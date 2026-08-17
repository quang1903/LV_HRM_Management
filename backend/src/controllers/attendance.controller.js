import pool from "../config/db.js"
import { verify as verifyTotp } from "../utils/totp.js"
import dotenv from "dotenv"
dotenv.config()

export async function getAttendances(req, res) {
  try {
    const { month, year, department_id } = req.query
    let query = `
      SELECT a.*, e.full_name, e.employee_code, d.name as department_name,
             s.name as shift_name, s.start_time, s.end_time,
             lr.request_type as leave_type,
             CASE WHEN lr.id IS NOT NULL THEN lr.request_type ELSE a.status END as display_status
      FROM attendances a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN shifts s ON a.shift_id = s.id
      LEFT JOIN leave_requests lr 
        ON lr.employee_id = a.employee_id
        AND lr.status = 'Da duyet'
        AND a.work_date BETWEEN lr.start_date AND lr.end_date
      WHERE 1=1
    `
    const params = []

    // Employee chỉ xem của mình
    if (req.user.role === "employee") {
      query += " AND a.employee_id = (SELECT employee_id FROM users WHERE id = ?)"
      params.push(req.user.id)
    }

    if (req.user.role === "manager") {
      query += " AND e.department_id IN (SELECT id FROM departments WHERE manager_id = ?)"
      params.push(req.user.employee_id)
    }

    //Lọc dữ liệu chấm công theo Tháng và Năm (ví dụ: tháng 8/2026 -> lấy từ ngày 2026-08-01 đến 2026-08-31)
    if (month && year) {
      const m = String(month).padStart(2, "0")
      const startDate = `${year}-${m}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${m}-${String(lastDay).padStart(2, "0")}`
      query += " AND a.work_date BETWEEN ? AND ?"
      params.push(startDate, endDate)
    }

    //Lọc dữ liệu chấm công theo Phòng ban
    if (department_id) {
      query += " AND e.department_id = ?"
      params.push(department_id)
    }
    // Sắp xếp dữ liệu chấm công theo ngày làm việc (gần nhất trước) và giờ vào làm (sớm nhất trước)
    query += " ORDER BY a.work_date DESC, a.check_in DESC"
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

    const isSelf = rows[0].employee_id === req.user.employee_id
    if (req.user.role === 'employee' && !isSelf) {
      return res.status(403).json({ message: "Không có quyền xem bản ghi này" })
    }
    if (req.user.role === 'manager' && !isSelf) {
      const [dept] = await pool.execute(
        "SELECT id FROM departments WHERE id = (SELECT department_id FROM employees WHERE id = ?) AND manager_id = ?",
        [rows[0].employee_id, req.user.employee_id]
      )
      if (dept.length === 0) return res.status(403).json({ message: "Không có quyền xem bản ghi này" })
    }

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

    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
    if (work_date > today) {
      return res.status(400).json({ message: "Không thể thêm chấm công cho ngày tương lai" })
    }
    //Kiểm tra nhân viên đã có bản ghi chấm công cho ngày này chưa (chống tạo trùng)
    const [existing] = await pool.execute(
      "SELECT id FROM attendances WHERE employee_id = ? AND work_date = ?",
      [employee_id, work_date]
    )
    if (existing.length > 0) return res.status(400).json({ message: "Nhân viên đã có bản ghi chấm công ngày này" })

    // Format check_in và check_out thành DATETIME đầy đủ
    const formatTime = (time, date) => {
      if (!time) return null
      if (time.includes(date)) return time
      return `${date} ${time}:00`
    }

    const checkInFormatted = formatTime(check_in, work_date)
    const checkOutFormatted = formatTime(check_out, work_date)

    //Tính toán số phút làm việc thực tế 
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

    //Insert dữ liệu chấm công vào database
    const [result] = await pool.execute(`
      INSERT INTO attendances (employee_id, shift_id, work_date, check_in, check_out, work_minutes, status, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [employee_id, shift_id || null, work_date, checkInFormatted, checkOutFormatted, work_minutes, status || 'Vang mat', note || null])
    return res.status(201).json({ message: "Thêm chấm công thành công", id: result.insertId })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updateAttendance(req, res) {
  try {
    const { check_in, check_out, status, note, is_supplemented } = req.body
    const [existing] = await pool.execute("SELECT id, work_date, check_out, is_supplemented FROM attendances WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy bản ghi chấm công" })

    // ⭐ Ưu tiên giá trị HR gửi lên (0 hoặc 1); nếu không gửi (undefined), giữ hành vi tự động cũ làm fallback
    const wasAlreadySupplemented = existing[0].is_supplemented === 1
    const finalSupplemented = is_supplemented !== undefined
      ? (is_supplemented ? 1 : 0)
      : (wasAlreadySupplemented || (!existing[0].check_out && check_out) ? 1 : 0)

    //Chuẩn hóa chuỗi ngày giờ DATETIME
    const rawDate = existing[0]?.work_date
    const work_date = rawDate ? (typeof rawDate === 'string' ? rawDate.split('T')[0] : new Date(rawDate).toISOString().split('T')[0]) : null

    const formatTime = (time, date) => {
      if (!time || !date) return null
      if (time.includes(date)) return time
      return `${date} ${time}:00`
    }

    //Định dạng giờ vào làm và giờ ra làm (nếu được gửi lên dưới dạng chuỗi giờ đơn giản, ví dụ: "08:30" hoặc "09:00")
    const checkInFormatted = formatTime(check_in, work_date)
    const checkOutFormatted = formatTime(check_out, work_date)

    //Kiểm tra giờ ra (check-out) phải lớn hơn giờ vào (check-in)
    if (check_in && check_out && checkOutFormatted <= checkInFormatted) {
      return res.status(400).json({ message: "Giờ ra (check-out) phải lớn hơn giờ vào (check-in)" })
    }

    //Tính toán số phút làm việc thực tế
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

    //Cập nhật dữ liệu chấm công vào database
    await pool.execute(`
      UPDATE attendances SET check_in=?, check_out=?, work_minutes=?, status=?, note=?, is_supplemented=? WHERE id=?
    `, [checkInFormatted, checkOutFormatted, work_minutes, status || 'Vang mat', note || null, finalSupplemented, req.params.id])
    return res.json({ message: "Cập nhật chấm công thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function checkIn(req, res) {
  try {
    //Lấy giá trị mã QR và tọa độ GPS từ thiết bị quét gửi lên
    const { qr_value, latitude, longitude } = req.body
    if (!qr_value) return res.status(400).json({ message: "Mã QR không hợp lệ" })
    if (!latitude || !longitude) return res.status(400).json({ message: "Thiếu vị trí GPS của thiết bị quét" })

    //Lấy tọa độ GPS nhà máy/văn phòng công ty trong bảng settings
    const [settingsRows] = await pool.execute("SELECT * FROM settings WHERE id = 1")
    if (settingsRows.length === 0) return res.status(400).json({ message: "Chưa cài đặt vị trí công ty" })
    const companyLat = parseFloat(settingsRows[0].company_lat)
    const companyLng = parseFloat(settingsRows[0].company_lng)
    const maxDist = parseFloat(settingsRows[0].max_distance || 500)//// Khoảng cách tối đa cho phép (mặc định 500m)
    //tính kc
    const distance = getDistanceMeters(latitude, longitude, companyLat, companyLng)
    if (distance > maxDist) {
      return res.status(403).json({ message: `Thiết bị quét không ở trong khu vực công ty (${Math.round(distance)}m)` })
    }

    //Phân tích mã QR (Tách employee_code và OTP)
    const [employee_code, otp] = qr_value.split(":")
    if (!employee_code || !otp) return res.status(400).json({ message: "Mã QR sai định dạng" })

    // Dùng mã SECRET của công ty + Mã NV để xác minh xem mã OTP 6 số có hợp lệ trong chu kỳ 30s không
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

    // Kiểm tra ngày nghỉ phép đã duyệt
    const [absent] = await pool.execute(
      "SELECT id FROM attendances WHERE employee_id = ? AND work_date = ? AND status = 'Vang mat' AND check_in IS NULL",
      [employee.id, today]
    )
    if (absent.length > 0) {
      return res.status(400).json({ message: "Hôm nay bạn đã được duyệt nghỉ phép, không thể check-in" })
    }

    //CHỐNG CHECK-IN LẦN 2 TRONG NGÀY
    const [existing] = await pool.execute(
      "SELECT id, check_in FROM attendances WHERE employee_id = ? AND work_date = ?",
      [employee.id, today]
    )
    if (existing.length > 0 && existing[0].check_in) return res.status(400).json({ message: "Nhân viên đã check-in hôm nay" })

    // Lấy giờ chuẩn từ settings (linh hoạt, Admin có thể chỉnh)
    const workStartTime = settingsRows[0].work_start_time || '08:30:00'
    const [wsH, wsM] = workStartTime.split(':').map(Number)

    const hour = nowVN.getHours(), minute = nowVN.getMinutes()
    const status = (hour > wsH || (hour === wsH && minute > wsM)) ? "Di tre" : "Dung gio"
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

//kiểm tra check ra và tính thời gian tăng ca
export async function checkOut(req, res) {
  try {
    const { qr_value, latitude, longitude } = req.body
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Thiếu thông tin vị trí GPS" })
    }

    const [settingsRows] = await pool.execute("SELECT * FROM settings WHERE id = 1")
    if (settingsRows.length === 0 || !settingsRows[0].company_lat) {
      return res.status(400).json({ message: "Chưa cấu hình vị trí công ty" })
    }
    const distance = getDistanceMeters(
      Number(latitude), Number(longitude),
      Number(settingsRows[0].company_lat), Number(settingsRows[0].company_lng)
    )
    if (distance > (settingsRows[0].max_distance || 500)) {
      return res.status(400).json({ message: `Bạn đang ở quá xa công ty (${Math.round(distance)}m)` })
    }

    const [empCode, otp] = qr_value.split(":")
    const secret = process.env.QR_SECRET_KEY + empCode
    const isValidOtp = verifyTotp(otp, secret)
    if (!isValidOtp) {
      return res.status(400).json({ message: "Mã QR đã hết hạn hoặc không hợp lệ" })
    }

    const [employees] = await pool.execute(
      "SELECT id, full_name FROM employees WHERE employee_code = ? AND status = 'Dang lam'",
      [empCode]
    )
    if (employees.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })
    const employee = employees[0]

    const [existing] = await pool.execute(
      "SELECT id, check_in, status, work_date, check_out, is_supplemented FROM attendances WHERE employee_id = ? AND check_in IS NOT NULL AND check_out IS NULL AND check_in >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY check_in DESC LIMIT 1",
      [employee.id]
    )
    if (existing.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy bản ghi check-in hợp lệ để check-out" })
    }

    const { now, nowVN } = getVietnamTime()
    const checkInTime = new Date(existing[0].check_in)
    const diffMinutes = (now - checkInTime) / 60000
    const work_minutes = Math.round(diffMinutes)

    const workEndTime = settingsRows[0].work_end_time || '17:00:00'
    const overtimeStartTime = settingsRows[0].overtime_start_time || '17:30:00'
    const overtimeEndTime = settingsRows[0].overtime_end_time || '19:00:00'

    const [weH, weM] = workEndTime.split(':').map(Number)
    const [osH, osM] = overtimeStartTime.split(':').map(Number)
    const [oeH, oeM] = overtimeEndTime.split(':').map(Number)

    const hour = nowVN.getHours()
    let status = existing[0].status
    if (hour < weH && status === 'Dung gio') {
      status = 'Ve som'
    }

    // ⭐ Tính tăng ca dựa trên nowVN (giờ Việt Nam thật), KHÔNG dùng now (giờ gốc server)
    // Tránh lỗi lệch múi giờ khi deploy lên server đặt ở UTC/nước ngoài
    const overtimeStart = new Date(nowVN)
    overtimeStart.setHours(osH, osM, 0, 0)
    const overtimeEnd = new Date(nowVN)
    overtimeEnd.setHours(oeH, oeM, 0, 0)

    let overtime_minutes = 0
    if (nowVN > overtimeStart) {
      const actualEnd = nowVN < overtimeEnd ? nowVN : overtimeEnd
      overtime_minutes = Math.max(0, Math.round((actualEnd - overtimeStart) / 60000))
    }

    // ⭐ Giữ nguyên cờ phạt nếu đã từng bị đánh dấu từ trước (chống "xóa án phạt" khi HR sửa lần 2)
    const wasAlreadySupplemented = existing[0].is_supplemented === 1
    const isSupplementingCheckout = wasAlreadySupplemented

    await pool.execute(
      "UPDATE attendances SET check_out=?, work_minutes=?, overtime_minutes=?, status=?, is_supplemented=? WHERE id=?",
      [now, work_minutes, overtime_minutes, status, isSupplementingCheckout ? 1 : 0, existing[0].id]
    )

    return res.json({
      message: "Check-out thành công",
      full_name: employee.full_name,
      check_out: now,
      work_minutes,
      overtime_minutes,
      status
    })
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

// Tính khoảng cách giữa 2 điểm GPS theo đường chim bay
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Bán kính Trái đất theo mét (6,371km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) // Trả về khoảng cách tính bằng MÉT giữa 2 vị trí GPS
  return R * c
}