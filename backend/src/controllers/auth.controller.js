import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import pool from "../config/db.js"
dotenv.config()

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, employee_id: user.employee_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  )
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  )
}

export async function login(req, res) {
  try {
    const { email, password, device_id } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" })
    }

    const [rows] = await pool.execute(`
      SELECT u.*, e.full_name, e.employee_code, e.avatar_url
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.email = ? AND u.is_active = 1
    `, [email])

    if (rows.length === 0) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" })
    }

    const user = rows[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" })
    }

    // Device Lock: chặn nếu đăng nhập từ thiết bị khác với thiết bị đã đăng ký
    if (user.device_id && device_id && user.device_id !== device_id) {
      return res.status(403).json({ message: "Thiết bị không hợp lệ! Vui lòng dùng thiết bị đã đăng ký hoặc liên hệ Admin để reset." })
    }

    // Lần đầu đăng nhập (chưa có device_id) thì lưu lại
    if (!user.device_id && device_id) {
      await pool.execute("UPDATE users SET device_id = ? WHERE id = ?", [device_id, user.id])
    }

    await pool.execute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id])

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await pool.execute(
      "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)",
      [user.id, refreshToken]
    )

    return res.json({
      message: "Đăng nhập thành công",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        employee_id: user.employee_id,
        full_name: user.full_name,
        employee_code: user.employee_code,
        avatar_url: user.avatar_url,
      }
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function logout(req, res) {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await pool.execute("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken])
    }
    return res.json({ message: "Đăng xuất thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(401).json({ message: "Không có refresh token" })
    }

    const [rows] = await pool.execute(
      "SELECT * FROM refresh_tokens WHERE token = ?", [refreshToken]
    )
    if (rows.length === 0) {
      return res.status(401).json({ message: "Refresh token không hợp lệ" })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const [users] = await pool.execute("SELECT * FROM users WHERE id = ?", [decoded.id])
    if (users.length === 0) {
      return res.status(401).json({ message: "Người dùng không tồn tại" })
    }
    if (users[0].is_active !== 1) {
      await pool.execute("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken])
      return res.status(401).json({ message: "Tài khoản đã bị vô hiệu hóa" })
    }

    const accessToken = generateAccessToken(users[0])
    return res.json({ accessToken })
  } catch (err) {
    return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" })
  }
}

export async function getMe(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.email, u.username, u.role, u.employee_id,
             e.full_name, e.employee_code, e.avatar_url
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.id = ?
    `, [req.user.id])

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" })
    }
    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}