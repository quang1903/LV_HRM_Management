import pool from "../config/db.js"
import dotenv from "dotenv"
dotenv.config()

export async function getDepartments(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT d.*, e.full_name as manager_name
      FROM departments d
      LEFT JOIN employees e ON d.manager_id = e.id
      ORDER BY d.created_at DESC
    `)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getDepartmentById(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT d.*, e.full_name as manager_name
      FROM departments d
      LEFT JOIN employees e ON d.manager_id = e.id
      WHERE d.id = ?
    `, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy phòng ban" })
    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, description, manager_id } = req.body
    if (!name) return res.status(400).json({ message: "Vui lòng nhập tên phòng ban" })
    const [result] = await pool.execute(
      "INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)",
      [name, description || null, manager_id || null]
    )
    return res.status(201).json({ message: "Thêm phòng ban thành công", id: result.insertId })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updateDepartment(req, res) {
  try {
    const { name, description, manager_id } = req.body
    const [existing] = await pool.execute("SELECT id, manager_id FROM departments WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy phòng ban" })

    const oldManagerId = existing[0].manager_id
    const newManagerId = manager_id || null
    let warningMessage = ""

    // Nếu có gán Trưởng phòng mới và khác với người cũ
    if (newManagerId && newManagerId !== oldManagerId) {
      // Nâng role người mới lên manager (nếu role hiện tại thấp hơn admin)
      const [newManagerUser] = await pool.execute(
        "SELECT id, role FROM users WHERE employee_id = ?",
        [newManagerId]
      )
      if (newManagerUser.length > 0 && newManagerUser[0].role !== "admin" && newManagerUser[0].role !== "manager") {
        await pool.execute("UPDATE users SET role = 'manager' WHERE employee_id = ?", [newManagerId])
        warningMessage += " Đã tự động nâng quyền tài khoản Trưởng phòng mới lên Quản lý."
      }
    }

    // Nếu đổi qua người khác (có Trưởng phòng cũ và khác người mới), kiểm tra hạ role người cũ
    if (oldManagerId && oldManagerId !== newManagerId) {
      const [otherDepts] = await pool.execute(
        "SELECT id FROM departments WHERE manager_id = ? AND id != ?",
        [oldManagerId, req.params.id]
      )
      // Người cũ không còn quản lý phòng nào khác -> hạ role nếu đang là manager
      if (otherDepts.length === 0) {
        const [oldManagerUser] = await pool.execute(
          "SELECT id, role FROM users WHERE employee_id = ?",
          [oldManagerId]
        )
        if (oldManagerUser.length > 0 && oldManagerUser[0].role === "manager") {
          await pool.execute("UPDATE users SET role = 'employee' WHERE employee_id = ?", [oldManagerId])
          warningMessage += " Đã tự động hạ quyền tài khoản Trưởng phòng cũ về Nhân viên (không còn quản lý phòng nào)."
        }
      }
    }

    await pool.execute(
      "UPDATE departments SET name=?, description=?, manager_id=? WHERE id=?",
      [name, description || null, newManagerId, req.params.id]
    )
    return res.json({ message: `Cập nhật phòng ban thành công.${warningMessage}` })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function deleteDepartment(req, res) {
  try {
    const [existing] = await pool.execute("SELECT id FROM departments WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy phòng ban" })
    const [employees] = await pool.execute("SELECT id FROM employees WHERE department_id = ?", [req.params.id])
    if (employees.length > 0) return res.status(400).json({ message: "Phòng ban đang có nhân viên, không thể xóa" })
    await pool.execute("DELETE FROM departments WHERE id = ?", [req.params.id])
    return res.json({ message: "Xóa phòng ban thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}