import pool from "../config/db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config()

export async function getEmployees(req, res) {
    try {
        const [rows] = await pool.execute(`
      SELECT e.*, d.name as department_name, p.name as position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      ORDER BY e.created_at DESC
    `)

        if (req.user.role === "employee") {
            rows.forEach(row => {
                if (row.id !== req.user.employee_id) {
                    delete row.id_card
                    delete row.address
                    delete row.birth_date
                }
            })
        }

        return res.json(rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: "Lỗi server" })
    }
}

export async function getEmployeeById(req, res) {
    try {
        const [rows] = await pool.execute(`
      SELECT e.*, d.name as department_name, p.name as position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.id = ?
    `, [req.params.id])
        if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })

        const employee = rows[0]
        if (req.user.role === "employee" && employee.id !== req.user.employee_id) {
            delete employee.id_card
            delete employee.address
            delete employee.birth_date
        }

        return res.json(employee)
    } catch (err) {
        return res.status(500).json({ message: "Lỗi server" })
    }
}

export async function createEmployee(req, res) {
    try {
        const { employee_code, full_name, email, phone, address, birth_date, gender, id_card, department_id, position_id, hire_date } = req.body
        if (!employee_code || !full_name || !email || !hire_date) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc" })
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email không đúng định dạng" })
        }
        const [existing] = await pool.execute("SELECT id FROM employees WHERE email = ?", [email])
        if (existing.length > 0) return res.status(400).json({ message: "Email đã tồn tại" })
        const [existingCode] = await pool.execute("SELECT id FROM employees WHERE employee_code = ?", [employee_code])
        if (existingCode.length > 0) return res.status(400).json({ message: "Mã nhân viên đã tồn tại" })

        const [result] = await pool.execute(`
      INSERT INTO employees (employee_code, full_name, email, phone, address, birth_date, gender, id_card, department_id, position_id, hire_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dang lam')
    `, [employee_code, full_name, email, phone || null, address || null, birth_date || null, gender || null, id_card || null, department_id || null, position_id || null, hire_date])

        const employeeId = result.insertId

        // Tự tạo tài khoản, tránh trùng username
        let baseUsername = email.split("@")[0]
        let username = baseUsername
        let counter = 1
        while (true) {
            const [dup] = await pool.execute("SELECT id FROM users WHERE username = ?", [username])
            if (dup.length === 0) break
            username = `${baseUsername}${counter}`
            counter++
        }
        const hashed = await bcrypt.hash("123456", 10)
        await pool.execute(`
      INSERT INTO users (username, email, password, role, employee_id, is_active)
      VALUES (?, ?, ?, 'employee', ?, 1)
    `, [username, email, hashed, employeeId])

        return res.status(201).json({ message: "Thêm nhân viên thành công", id: employeeId })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: "Lỗi server" })
    }
}

export async function updateEmployee(req, res) {
  try {
    const { full_name, email, phone, address, birth_date, gender, id_card, department_id, position_id, hire_date } = req.body
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email không đúng định dạng" })
    }

    const [existing] = await pool.execute("SELECT id FROM employees WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })

    const [dupEmail] = await pool.execute("SELECT id FROM employees WHERE email = ? AND id != ?", [email, req.params.id])
    if (dupEmail.length > 0) return res.status(400).json({ message: "Email đã được sử dụng bởi nhân viên khác" })

    await pool.execute(`
      UPDATE employees SET full_name=?, email=?, phone=?, address=?, birth_date=?, gender=?, id_card=?, department_id=?, position_id=?, hire_date=?
      WHERE id=?
    `, [full_name, email, phone || null, address || null, birth_date || null, gender || null, id_card || null, department_id || null, position_id || null, hire_date, req.params.id])

    await pool.execute("UPDATE users SET email = ? WHERE employee_id = ?", [email, req.params.id])

    return res.json({ message: "Cập nhật nhân viên thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function deactivateEmployee(req, res) {
    try {
        const [existing] = await pool.execute("SELECT id FROM employees WHERE id = ?", [req.params.id])
        if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })
        const [contracts] = await pool.execute("SELECT id FROM contracts WHERE employee_id = ? AND status = 'Dang hieu luc'", [req.params.id])
        if (contracts.length > 0) return res.status(400).json({ message: "Nhân viên còn hợp đồng đang hiệu lực" })
        await pool.execute("UPDATE employees SET status = 'Nghi viec' WHERE id = ?", [req.params.id])
        await pool.execute("UPDATE users SET is_active = 0 WHERE employee_id = ?", [req.params.id])
        return res.json({ message: "Vô hiệu hóa nhân viên thành công" })
    } catch (err) {
        return res.status(500).json({ message: "Lỗi server" })
    }
}

export async function activateEmployee(req, res) {
    try {
        const [existing] = await pool.execute("SELECT id, status FROM employees WHERE id = ?", [req.params.id])
        if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })
        if (existing[0].status !== 'Nghi viec') return res.status(400).json({ message: "Nhân viên đang làm việc rồi" })
        await pool.execute("UPDATE employees SET status = 'Dang lam' WHERE id = ?", [req.params.id])
        await pool.execute("UPDATE users SET is_active = 1 WHERE employee_id = ?", [req.params.id])
        return res.json({ message: "Kích hoạt nhân viên thành công" })
    } catch (err) {
        return res.status(500).json({ message: "Lỗi server" })
    }
}

export async function permanentDelete(req, res) {
    try {
        const [existing] = await pool.execute("SELECT id, status FROM employees WHERE id = ?", [req.params.id])
        if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })
        if (existing[0].status !== 'Nghi viec') return res.status(400).json({ message: "Chỉ xóa được nhân viên đã nghỉ việc" })
        await pool.execute("DELETE FROM users WHERE employee_id = ?", [req.params.id])
        await pool.execute("DELETE FROM employees WHERE id = ?", [req.params.id])
        return res.json({ message: "Xóa nhân viên thành công" })
    } catch (err) {
        return res.status(500).json({ message: "Lỗi server" })
    }
}

import * as otplib from "otplib"
const { totp } = otplib

export async function getMyQRSecret(req, res) {
  try {
    if (!req.user.employee_id) return res.status(400).json({ message: "Tài khoản chưa gắn nhân viên" })
    const [rows] = await pool.execute("SELECT employee_code FROM employees WHERE id = ?", [req.user.employee_id])
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })

    totp.options = { step: 30, digits: 6 }
    const secret = process.env.QR_SECRET_KEY + rows[0].employee_code
    const code = totp.generate(secret)

    return res.json({
      employee_code: rows[0].employee_code,
      otp: code,
      qr_value: `${rows[0].employee_code}:${code}`,
      expires_in: 30 - Math.floor(Date.now() / 1000) % 30
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}