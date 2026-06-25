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
    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function createLeave(req, res) {
  try {
    let { employee_id, request_type, start_date, end_date, total_days, reason } = req.body

    // Chống IDOR: nhân viên chỉ được gửi đơn cho chính mình
    if (req.user.role === "employee") {
      if (!req.user.employee_id) {
        return res.status(403).json({ message: "Tài khoản của bạn chưa được gắn với nhân viên" })
      }
      employee_id = req.user.employee_id
    }

    if (!employee_id || !request_type || !start_date || !end_date || !total_days) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc" })
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: "Ngày kết thúc không được nhỏ hơn ngày bắt đầu" })
    }

    const [result] = await pool.execute(`
      INSERT INTO leave_requests (employee_id, request_type, start_date, end_date, total_days, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Cho duyet')
    `, [employee_id, request_type, start_date, end_date, total_days, reason || null])
    return res.status(201).json({ message: "Gửi đơn nghỉ phép thành công", id: result.insertId })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function approveLeave(req, res) {
  try {
    const [existing] = await pool.execute(
      `SELECT l.id, l.status, e.department_id
       FROM leave_requests l
       LEFT JOIN employees e ON l.employee_id = e.id
       WHERE l.id = ?`,
      [req.params.id]
    )
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy đơn" })
    if (existing[0].status !== 'Cho duyet') return res.status(400).json({ message: "Đơn đã được xử lý" })

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
    return res.json({ message: "Từ chối đơn thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}