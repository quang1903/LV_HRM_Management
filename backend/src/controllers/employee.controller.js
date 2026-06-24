import pool from "../config/db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config()

export async function getEmployees(req, res) {
    try {
        let query = `
      SELECT e.*, d.name as department_name, p.name as position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
    `
        const params = []

        // Manager chỉ thấy nhân viên thuộc phòng ban mình quản lý
        if (req.user.role === "manager") {
            query += ` WHERE e.department_id IN (SELECT id FROM departments WHERE manager_id = ?) `
            params.push(req.user.employee_id)
        }

        query += " ORDER BY e.created_at DESC"
        const [rows] = await pool.execute(query, params)

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

export async function importEmployees(req, res) {
  try {
    const { data } = req.body
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu để nhập" })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let successCount = 0
    const errors = []

    const [maxRows] = await pool.execute(
      "SELECT employee_code FROM employees WHERE employee_code LIKE 'EMP%' ORDER BY CAST(SUBSTRING(employee_code, 4) AS UNSIGNED) DESC LIMIT 1"
    )
    let maxCode = 0
    if (maxRows.length > 0) {
      maxCode = parseInt(maxRows[0].employee_code.replace("EMP", "")) || 0
    }

    const [allDepartments] = await pool.execute("SELECT id, name FROM departments")
    const [allPositions] = await pool.execute("SELECT id, name, department_id FROM positions")

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2

      try {
        const full_name = (row["Họ và tên"] || "").toString().trim()
        const email = (row["Email"] || "").toString().trim()
        const hire_date_raw = row["Ngày vào làm"]
        const dept_name = (row["Phòng ban"] || "").toString().trim()
        const pos_name = (row["Chức vụ"] || "").toString().trim()
        const phone = (row["Số điện thoại"] || "").toString().trim() || null
        const birth_date_raw = row["Ngày sinh"]
        const genderRaw = (row["Giới tính"] || "").toString().trim()
        const id_card = (row["CCCD"] || "").toString().trim() || null
        const address = (row["Địa chỉ"] || "").toString().trim() || null

        if (!full_name || !email || !hire_date_raw) {
          errors.push(`Dòng ${rowNumber}: Thiếu Họ tên, Email hoặc Ngày vào làm`)
          continue
        }

        if (!emailRegex.test(email)) {
          errors.push(`Dòng ${rowNumber}: Email "${email}" không đúng định dạng`)
          continue
        }

        const [dupEmail] = await pool.execute("SELECT id FROM employees WHERE email = ?", [email])
        if (dupEmail.length > 0) {
          errors.push(`Dòng ${rowNumber}: Email "${email}" đã tồn tại trong hệ thống`)
          continue
        }

        let department_id = null
        if (dept_name) {
          const dept = allDepartments.find(d => d.name.toLowerCase() === dept_name.toLowerCase())
          if (!dept) {
            errors.push(`Dòng ${rowNumber}: Không tìm thấy phòng ban "${dept_name}"`)
            continue
          }
          department_id = dept.id
        }

        let position_id = null
        if (pos_name) {
          const pos = allPositions.find(p =>
            p.name.toLowerCase() === pos_name.toLowerCase() &&
            (!department_id || p.department_id === department_id)
          )
          if (!pos) {
            errors.push(`Dòng ${rowNumber}: Không tìm thấy chức vụ "${pos_name}" trong phòng ban đã chọn`)
            continue
          }
          position_id = pos.id
        }

        const hire_date = normalizeExcelDate(hire_date_raw)
        if (!hire_date) {
          errors.push(`Dòng ${rowNumber}: Ngày vào làm không hợp lệ`)
          continue
        }
        const birth_date = birth_date_raw ? normalizeExcelDate(birth_date_raw) : null

        let gender = null
        if (genderRaw) {
          if (genderRaw === "Nam") gender = "Nam"
          else if (genderRaw === "Nữ" || genderRaw === "Nu") gender = "Nu"
          else gender = "Khac"
        }

        maxCode += 1
        const employee_code = `EMP${String(maxCode).padStart(3, "0")}`

        const [result] = await pool.execute(`
          INSERT INTO employees (employee_code, full_name, email, phone, address, birth_date, gender, id_card, department_id, position_id, hire_date, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dang lam')
        `, [employee_code, full_name, email, phone, address, birth_date, gender, id_card, department_id, position_id, hire_date])

        const employeeId = result.insertId

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

        successCount++
      } catch (rowErr) {
        console.error(`Lỗi dòng ${rowNumber}:`, rowErr)
        errors.push(`Dòng ${rowNumber}: Lỗi xử lý không xác định`)
      }
    }

    return res.json({ success: true, successCount, totalRows: data.length, errors })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server khi import" })
  }
}

function normalizeExcelDate(value) {
  if (!value) return null

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + value * 86400000)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split("T")[0]
  }

  const str = value.toString().trim()
  const date = new Date(str)
  if (isNaN(date.getTime())) return null
  return date.toISOString().split("T")[0]
}