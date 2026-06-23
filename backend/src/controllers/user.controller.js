import pool from "../config/db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config()

export async function getUsers(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login_at, u.created_at,
             e.full_name, e.employee_code
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      ORDER BY u.created_at DESC
    `)
    return res.json(rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function createUser(req, res) {
  try {
    const { username, email, password, role, employee_id } = req.body
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" })
    }
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?", [email, username]
    )
    if (existing.length > 0) return res.status(400).json({ message: "Email hoặc username đã tồn tại" })

    if (employee_id) {
      const [dupEmp] = await pool.execute("SELECT id FROM users WHERE employee_id = ?", [employee_id])
      if (dupEmp.length > 0) return res.status(400).json({ message: "Nhân viên này đã có tài khoản" })
    }

    const hashed = await bcrypt.hash(password, 10)
    const [result] = await pool.execute(`
      INSERT INTO users (username, email, password, role, employee_id, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [username, email, hashed, role, employee_id || null])
    return res.status(201).json({ message: "Tạo tài khoản thành công", id: result.insertId })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updateUser(req, res) {
  try {
    const { role, employee_id } = req.body
    const [existing] = await pool.execute("SELECT id FROM users WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy tài khoản" })

    if (employee_id) {
      const [dupEmp] = await pool.execute("SELECT id FROM users WHERE employee_id = ? AND id != ?", [employee_id, req.params.id])
      if (dupEmp.length > 0) return res.status(400).json({ message: "Nhân viên này đã có tài khoản khác" })
    }

    await pool.execute(
      "UPDATE users SET role = ?, employee_id = ? WHERE id = ?",
      [role, employee_id || null, req.params.id]
    )
    return res.json({ message: "Cập nhật thành công" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function toggleUser(req, res) {
  try {
    const [existing] = await pool.execute(
      "SELECT id, is_active FROM users WHERE id = ?", [req.params.id]
    )
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy tài khoản" })
    if (existing[0].id === req.user.id) {
      return res.status(400).json({ message: "Không thể vô hiệu hóa tài khoản của chính mình" })
    }
    const newStatus = existing[0].is_active ? 0 : 1
    await pool.execute("UPDATE users SET is_active = ? WHERE id = ?", [newStatus, req.params.id])
    return res.json({ message: newStatus ? "Kích hoạt thành công" : "Vô hiệu hóa thành công" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function resetPassword(req, res) {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ message: "Vui lòng nhập mật khẩu mới" })
    const hashed = await bcrypt.hash(password, 10)
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, req.params.id])
    return res.json({ message: "Đặt lại mật khẩu thành công" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function resetDevice(req, res) {
  try {
    await pool.execute("UPDATE users SET device_id = NULL WHERE id = ?", [req.params.id])
    return res.json({ message: "Đã reset thiết bị, nhân viên có thể đăng nhập lại từ máy mới" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}