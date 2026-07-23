import pool from "../config/db.js"
import dotenv from "dotenv"
dotenv.config()

export async function getLeaves(req, res) {
  try {
    let query = `
      SELECT l.*, e.full_name, e.employee_code, e.department_id, d.name as department_name
      FROM leave_requests l
      LEFT JOIN employees e ON l.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
    `
    const params = []

    // Employee chỉ xem đơn của mình
    if (req.user.role === "employee") {
      query += " WHERE l.employee_id = (SELECT employee_id FROM users WHERE id = ?)"
      params.push(req.user.id)
    }

    // Manager chỉ xem đơn của nhân viên thuộc phòng ban mình quản lý
    if (req.user.role === "manager") {
      query += " WHERE e.department_id IN (SELECT id FROM departments WHERE manager_id = ?)"
      params.push(req.user.employee_id)
    }

    query += " ORDER BY l.created_at DESC"
    const [rows] = await pool.execute(query, params)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getLeaveById(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT l.*, e.full_name, e.employee_code, d.name as department_name
      FROM leave_requests l
      LEFT JOIN employees e ON l.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE l.id = ?
    `, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy đơn nghỉ phép" })

    const isSelf = rows[0].employee_id === req.user.employee_id
    if (req.user.role === 'employee' && !isSelf) {
      return res.status(403).json({ message: "Không có quyền xem đơn này" })
    }
    if (req.user.role === 'manager' && !isSelf) {
      const [dept] = await pool.execute(
        "SELECT id FROM departments WHERE id = (SELECT department_id FROM employees WHERE id = ?) AND manager_id = ?",
        [rows[0].employee_id, req.user.employee_id]
      )
      if (dept.length === 0) return res.status(403).json({ message: "Không có quyền xem đơn này" })
    }

    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function createLeave(req, res) {
  try {
    let { employee_id, request_type, start_date, end_date, reason } = req.body

    // Chống IDOR: nhân viên chỉ được gửi đơn cho chính mình
    if (req.user.role === "employee") {
      if (!req.user.employee_id) {
        return res.status(403).json({ message: "Tài khoản của bạn chưa được gắn với nhân viên" })
      }
      employee_id = req.user.employee_id
    }

    if (!employee_id || !request_type || !start_date || !end_date) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc" })
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: "Ngày kết thúc không được nhỏ hơn ngày bắt đầu" })
    }

    // Kiểm tra trùng khoảng ngày nghỉ phép
    const [overlap] = await pool.execute(`
      SELECT id FROM leave_requests 
      WHERE employee_id = ? 
      AND status != 'Tu choi'
      AND start_date <= ? AND end_date >= ?
    `, [employee_id, end_date, start_date])
    if (overlap.length > 0) {
      return res.status(400).json({ message: "Nhân viên đã có đơn nghỉ phép trong khoảng thời gian này" })
    }

    // Backend tự tính total_days, KHÔNG nhận từ Client để chống gian lận.
    // Tính từng ngày trong khoảng, chỉ loại trừ Chủ nhật (Thứ 7 vẫn tính là ngày làm việc bình thường).
    const total_days = countWorkingDays(start_date, end_date)
    if (total_days <= 0) {
      return res.status(400).json({ message: "Khoảng ngày nghỉ không hợp lệ (toàn bộ là Chủ nhật)" })
    }

    const [result] = await pool.execute(`
      INSERT INTO leave_requests (employee_id, request_type, start_date, end_date, total_days, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Cho duyet')
    `, [employee_id, request_type, start_date, end_date, total_days, reason || null])
    return res.status(201).json({ message: "Gửi đơn nghỉ phép thành công", id: result.insertId, total_days })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

// Đếm số ngày nghỉ phép thật, loại bỏ Chủ nhật (getUTCDay() === 0)
function countWorkingDays(startStr, endStr) {
  const toStr = (val) => typeof val === "string" ? val.split("T")[0] : new Date(val).toISOString().split("T")[0]
  const [sy, sm, sd] = toStr(startStr).split("-").map(Number)
  const [ey, em, ed] = toStr(endStr).split("-").map(Number)
  const current = new Date(Date.UTC(sy, sm - 1, sd))
  const end = new Date(Date.UTC(ey, em - 1, ed))
  let count = 0
  while (current <= end) {
    if (current.getUTCDay() !== 0) { // 0 = Chủ nhật
      count++
    }
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return count
}

export async function approveLeave(req, res) {
  try {
    const [existing] = await pool.execute(
      `SELECT l.id, l.status, l.employee_id, e.department_id
       FROM leave_requests l
       LEFT JOIN employees e ON l.employee_id = e.id
       WHERE l.id = ?`,
      [req.params.id]
    )
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy đơn" })
    if (existing[0].status !== 'Cho duyet') return res.status(400).json({ message: "Đơn đã được xử lý" })

    // Chặn Trưởng phòng tự duyệt đơn của chính mình
    if (existing[0].employee_id === req.user.employee_id) {
      return res.status(403).json({ message: "Bạn không thể tự duyệt đơn nghỉ phép của chính mình" })
    }

    // Manager chỉ được duyệt đơn của nhân viên thuộc phòng ban mình quản lý
    if (req.user.role === "manager") {
      const [dept] = await pool.execute(
        "SELECT id FROM departments WHERE id = ? AND manager_id = ?",
        [existing[0].department_id, req.user.employee_id]
      )
      if (dept.length === 0) {
        return res.status(403).json({ message: "Bạn chỉ được duyệt đơn của nhân viên thuộc phòng ban mình quản lý" })
      }
    }

    await pool.execute(
      "UPDATE leave_requests SET status='Da duyet', approved_by=?, approved_at=NOW() WHERE id=?",
      [req.user.id, req.params.id]
    )

    // Đồng bộ chấm công — tạo bản ghi Vắng mặt cho từng ngày nghỉ
    const [leaveRows] = await pool.execute(
      "SELECT employee_id, start_date, end_date FROM leave_requests WHERE id = ?",
      [req.params.id]
    )
    if (leaveRows.length > 0) {
      const { employee_id, start_date, end_date } = leaveRows[0]
      const toStr = (val) => typeof val === "string" ? val.split("T")[0] : new Date(val).toISOString().split("T")[0]
      const [sy, sm, sd] = toStr(start_date).split("-").map(Number)
      const [ey, em, ed] = toStr(end_date).split("-").map(Number)
      const current = new Date(Date.UTC(sy, sm - 1, sd))
      const end = new Date(Date.UTC(ey, em - 1, ed))
      while (current <= end) {
        if (current.getUTCDay() !== 0) { // Bỏ qua Chủ nhật
          const workDate = current.toISOString().split("T")[0]
          // Kiểm tra đã có bản ghi chưa
          const [existing] = await pool.execute(
            "SELECT id FROM attendances WHERE employee_id = ? AND work_date = ?",
            [employee_id, workDate]
          )
          if (existing.length === 0) {
            // Chưa có → tạo mới Vắng mặt
            await pool.execute(
              "INSERT INTO attendances (employee_id, work_date, status) VALUES (?, ?, 'Vang mat')",
              [employee_id, workDate]
            )
          } else {
            // Đã có → cập nhật thành Vắng mặt
            await pool.execute(
              "UPDATE attendances SET status = 'Vang mat', check_in = NULL, check_out = NULL WHERE employee_id = ? AND work_date = ?",
              [employee_id, workDate]
            )
          }
        }
        current.setUTCDate(current.getUTCDate() + 1)
      }
    }

    return res.json({ message: "Duyệt đơn thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function rejectLeave(req, res) {
  try {
    const { reject_reason } = req.body
    if (!reject_reason) return res.status(400).json({ message: "Vui lòng nhập lý do từ chối" })

    const [existing] = await pool.execute(
      `SELECT l.id, l.status, e.department_id
       FROM leave_requests l
       LEFT JOIN employees e ON l.employee_id = e.id
       WHERE l.id = ?`,
      [req.params.id]
    )
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy đơn" })
    if (existing[0].status !== 'Cho duyet') return res.status(400).json({ message: "Đơn đã được xử lý" })

    // Manager chỉ được từ chối đơn của nhân viên thuộc phòng ban mình quản lý
    if (req.user.role === "manager") {
      const [dept] = await pool.execute(
        "SELECT id FROM departments WHERE id = ? AND manager_id = ?",
        [existing[0].department_id, req.user.employee_id]
      )
      if (dept.length === 0) {
        return res.status(403).json({ message: "Bạn chỉ được từ chối đơn của nhân viên thuộc phòng ban mình quản lý" })
      }
    }

    await pool.execute(
      "UPDATE leave_requests SET status='Tu choi', reject_reason=?, approved_by=?, approved_at=NOW() WHERE id=?",
      [reject_reason, req.user.id, req.params.id]
    )

    // Xóa các bản ghi Vắng mặt nếu đơn đã từng được duyệt (hoặc dọn dẹp)
    const [leaveRows] = await pool.execute(
      "SELECT employee_id, start_date, end_date FROM leave_requests WHERE id = ?",
      [req.params.id]
    )
    if (leaveRows.length > 0) {
      const { employee_id, start_date, end_date } = leaveRows[0]
      await pool.execute(
        "DELETE FROM attendances WHERE employee_id = ? AND work_date BETWEEN ? AND ? AND status = 'Vang mat' AND check_in IS NULL",
        [employee_id, start_date, end_date]
      )
    }

    return res.json({ message: "Từ chối đơn thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}