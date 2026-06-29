import pool from "../config/db.js"
import { verify as verifyTotp } from "../utils/totp.js"
import dotenv from "dotenv"
dotenv.config()

export async function getAttendances(req, res) {
  try {
    const { month, year, department_id } = req.query
    let query = `
      SELECT a.*, e.full_name, e.employee_code, d.name as department_name,
             s.name as shift_name, s.start_time, s.end_time
      FROM attendances a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN shifts s ON a.shift_id = s.id
      WHERE 1=1
    `
    const params = []

    // Employee chỉ xem của mình
    if (req.user.role === "employee") {
      query += " AND a.employee_id = (SELECT employee_id FROM users WHERE id = ?)"
      params.push(req.user.id)
    }

    if (month && year) {
      query += " AND MONTH(a.work_date) = ? AND YEAR(a.work_date) = ?"
      params.push(month, year)
    }
    if (department_id) {
      query += " AND e.department_id = ?"
      params.push(department_id)
    }
    query += " ORDER BY a.work_date DESC, e.full_name ASC"
    const [rows] = await pool.execute(query, params)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getAttendanceById(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT a.*, e.full_name, e.employee_code, s.name as shift_name
      FROM attendances a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN shifts s ON a.shift_id = s.id
      WHERE a.id = ?
    `, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bản ghi chấm công" })
    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function createAttendance(req, res) {
  try {
    const { employee_id, shift_id, work_date, check_in, check_out, status, note } = req.body
    if (!employee_id || !work_date) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc" })
    }
    const [existing] = await pool.execute(
      "SELECT id FROM attendances WHERE employee_id = ? AND work_date = ?",
      [employee_id, work_date]
    )
    if (existing.length > 0) return res.status(400).json({ message: "Nhân viên đã có bản ghi chấm công ngày này" })

    let work_minutes = 0
    if (check_in && check_out) {
      // Hỗ trợ cả format "HH:MM" và "YYYY-MM-DD HH:MM:SS"
      const parseTime = (t) => {
        if (t.length <= 5) return t.split(":")
        return t.slice(11, 16).split(":")
      }
      const inParts = parseTime(check_in)
      const outParts = parseTime(check_out)
      work_minutes = (parseInt(outParts[0]) * 60 + parseInt(outParts[1])) - (parseInt(inParts[0]) * 60 + parseInt(inParts[1]))
      if (isNaN(work_minutes) || work_minutes < 0) work_minutes = 0
    }

    const [result] = await pool.execute(`
      INSERT INTO attendances (employee_id, shift_id, work_date, check_in, check_out, work_minutes, status, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [employee_id, shift_id || null, work_date, check_in || null, check_out || null, work_minutes, status || 'Vang mat', note || null])
    return res.status(201).json({ message: "Thêm chấm công thành công", id: result.insertId })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updateAttendance(req, res) {
  try {
    const { check_in, check_out, status, note } = req.body
    const [existing] = await pool.execute("SELECT id FROM attendances WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy bản ghi chấm công" })

    let work_minutes = 0
    if (check_in && check_out) {
      const parseTime = (t) => {
        if (t.length <= 5) return t.split(":")
        return t.slice(11, 16).split(":")
      }
      const inParts = parseTime(check_in)
      const outParts = parseTime(check_out)
      work_minutes = (parseInt(outParts[0]) * 60 + parseInt(outParts[1])) - (parseInt(inParts[0]) * 60 + parseInt(inParts[1]))
      if (isNaN(work_minutes) || work_minutes < 0) work_minutes = 0
    }

    await pool.execute(`
      UPDATE attendances SET check_in=?, check_out=?, work_minutes=?, status=?, note=? WHERE id=?
    `, [check_in || null, check_out || null, work_minutes, status || 'Vang mat', note || null, req.params.id])
    return res.json({ message: "Cập nhật chấm công thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function checkIn(req, res) {
  try {
    const { qr_value } = req.body
    if (!qr_value) return res.status(400).json({ message: "Mã QR không hợp lệ" })

    const [employee_code, otp] = qr_value.split(":")
    if (!employee_code || !otp) return res.status(400).json({ message: "Mã QR sai định dạng" })

    const secret = process.env.QR_SECRET_KEY + employee_code
    const isValid = verifyTotp(otp, secret)
    if (!isValid) return res.status(400).json({ message: "Mã QR đã hết hạn, vui lòng quét lại" })

    const [employees] = await pool.execute(
      "SELECT id, full_name FROM employees WHERE employee_code = ? AND status = 'Dang lam'",
      [employee_code]
    )
    if (employees.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })
    const employee = employees[0]
    const { now, nowVN, today } = getVietnamTime()
    const [existing] = await pool.execute(
      "SELECT id, check_in FROM attendances WHERE employee_id = ? AND work_date = ?",
      [employee.id, today]
    )
    if (existing.length > 0 && existing[0].check_in) return res.status(400).json({ message: "Nhân viên đã check-in hôm nay" })
    const hour = nowVN.getHours(), minute = nowVN.getMinutes()
    const status = (hour > 8 || (hour === 8 && minute > 30)) ? "Di tre" : "Dung gio"
    if (existing.length === 0) {
      await pool.execute(
        "INSERT INTO attendances (employee_id, work_date, check_in, status) VALUES (?, ?, ?, ?)",
        [employee.id, today, now, status]
      )
    } else {
      await pool.execute("UPDATE attendances SET check_in=?, status=? WHERE id=?", [now, status, existing[0].id])
    }
    return res.json({ message: "Check-in thành công", full_name: employee.full_name, check_in: now })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function checkOut(req, res) {
  try {
    const { qr_value } = req.body
    if (!qr_value) return res.status(400).json({ message: "Mã QR không hợp lệ" })

    const [employee_code, otp] = qr_value.split(":")
    if (!employee_code || !otp) return res.status(400).json({ message: "Mã QR sai định dạng" })

    const secret = process.env.QR_SECRET_KEY + employee_code
    const isValid = verifyTotp(otp, secret)
    if (!isValid) return res.status(400).json({ message: "Mã QR đã hết hạn, vui lòng quét lại" })

    const [employees] = await pool.execute(
      "SELECT id, full_name FROM employees WHERE employee_code = ? AND status = 'Dang lam'",
      [employee_code]
    )
    if (employees.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })
    const employee = employees[0]

    const { today } = getVietnamTime()
    const [existing] = await pool.execute(
      "SELECT id, check_in FROM attendances WHERE employee_id = ? AND work_date = ? AND check_in IS NOT NULL AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
      [employee.id, today]
    )
    if (existing.length === 0) return res.status(400).json({ message: "Bạn chưa check-in hôm nay, không thể check-out" })
    const now = new Date()
    const checkInTime = new Date(existing[0].check_in)
    const work_minutes = Math.round((now - checkInTime) / 60000)
    await pool.execute("UPDATE attendances SET check_out=?, work_minutes=? WHERE id=?", [now, work_minutes, existing[0].id])
    return res.json({ message: "Check-out thành công", full_name: employee.full_name, check_out: now, work_minutes })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

// Lấy ngày/giờ hiện tại theo múi giờ Việt Nam (chỉ dùng để TÍNH today/status, không dùng để LƯU vào DB)
function getVietnamTime() {
  const now = new Date()
  const nowVN = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
  const today = nowVN.getFullYear() + "-" + String(nowVN.getMonth() + 1).padStart(2, "0") + "-" + String(nowVN.getDate()).padStart(2, "0")
  return { now, nowVN, today }
}

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function selfCheckIn(req, res) {
  try {
    if (!req.user.employee_id) return res.status(400).json({ message: "Tài khoản chưa gắn nhân viên" })
    const { latitude, longitude } = req.body
    if (!latitude || !longitude) return res.status(400).json({ message: "Thiếu vị trí GPS" })

    const [settingsRows] = await pool.execute("SELECT * FROM settings WHERE id = 1")
    if (settingsRows.length === 0) return res.status(400).json({ message: "Chưa cài đặt vị trí công ty" })
    const companyLat = parseFloat(settingsRows[0].company_lat)
    const companyLng = parseFloat(settingsRows[0].company_lng)
    const maxDist = parseFloat(settingsRows[0].max_distance || 500)
    const distance = getDistanceMeters(latitude, longitude, companyLat, companyLng)

    if (distance > maxDist) {
      return res.status(403).json({ message: `Bạn đang ở ngoài phạm vi công ty (${Math.round(distance)}m)` })
    }

    const { now, nowVN, today } = getVietnamTime()
    const [existing] = await pool.execute(
      "SELECT id, check_in FROM attendances WHERE employee_id = ? AND work_date = ?",
      [req.user.employee_id, today]
    )
    if (existing.length > 0 && existing[0].check_in) {
      return res.status(400).json({ message: "Bạn đã check-in hôm nay" })
    }

    const hour = nowVN.getHours()
    const minute = nowVN.getMinutes()
    const status = (hour > 8 || (hour === 8 && minute > 30)) ? "Di tre" : "Dung gio"

    if (existing.length === 0) {
      await pool.execute(
        "INSERT INTO attendances (employee_id, work_date, check_in, status) VALUES (?, ?, ?, ?)",
        [req.user.employee_id, today, now, status]
      )
    } else {
      await pool.execute("UPDATE attendances SET check_in=?, status=? WHERE id=?", [now, status, existing[0].id])
    }

    return res.json({ message: "Check-in thành công", check_in: now, status })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function selfCheckOut(req, res) {
  try {
    if (!req.user.employee_id) return res.status(400).json({ message: "Tài khoản chưa gắn nhân viên" })
    const { latitude, longitude } = req.body
    if (!latitude || !longitude) return res.status(400).json({ message: "Thiếu vị trí GPS" })

    const [settingsRows] = await pool.execute("SELECT * FROM settings WHERE id = 1")
    if (settingsRows.length === 0) return res.status(400).json({ message: "Chưa cài đặt vị trí công ty" })
    const companyLat = parseFloat(settingsRows[0].company_lat)
    const companyLng = parseFloat(settingsRows[0].company_lng)
    const maxDist = parseFloat(settingsRows[0].max_distance || 500)
    const distance = getDistanceMeters(latitude, longitude, companyLat, companyLng)

    if (distance > maxDist) {
      return res.status(403).json({ message: `Bạn đang ở ngoài phạm vi công ty (${Math.round(distance)}m)` })
    }

    const { today } = getVietnamTime()
    const [existing] = await pool.execute(
      "SELECT id, check_in FROM attendances WHERE employee_id = ? AND work_date = ? AND check_in IS NOT NULL AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
      [req.user.employee_id, today]
    )
    if (existing.length === 0) return res.status(400).json({ message: "Bạn chưa check-in hôm nay, không thể check-out" })

    const now = new Date()
    const checkInTime = new Date(existing[0].check_in)
    const work_minutes = Math.round((now - checkInTime) / 60000)

    await pool.execute("UPDATE attendances SET check_out=?, work_minutes=? WHERE id=?", [now, work_minutes, existing[0].id])

    return res.json({ message: "Check-out thành công", check_out: now, work_minutes })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}