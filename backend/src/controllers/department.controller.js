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

    if (manager_id) {
      const [managerUser] = await pool.execute(
        "SELECT role FROM users WHERE employee_id = ?", [manager_id]
      )
      if (managerUser.length > 0 && managerUser[0].role !== 'admin' && managerUser[0].role !== 'hr') {
        await pool.execute("UPDATE users SET role = 'manager' WHERE employee_id = ?", [manager_id])
      }
    }

    return res.status(201).json({ message: "Thêm phòng ban thành công", id: result.insertId })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updateDepartment(req, res) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const { name, description, manager_id } = req.body
    const [existing] = await conn.execute("SELECT id, manager_id FROM departments WHERE id = ?", [req.params.id])
    if (existing.length === 0) {
      await conn.rollback()
      conn.release()
      return res.status(404).json({ message: "Không tìm thấy phòng ban" })
    }

    const oldManagerId = existing[0].manager_id
    const newManagerId = manager_id || null
    let warningMessage = ""

    // Nếu có gán Trưởng phòng mới và khác với người cũ
    if (newManagerId && newManagerId !== oldManagerId) {
      const [newManagerUser] = await conn.execute(
        "SELECT id, role FROM users WHERE employee_id = ?",
        [newManagerId]
      )
      if (newManagerUser.length > 0 && newManagerUser[0].role !== "admin" && newManagerUser[0].role !== "manager") {
        await conn.execute("UPDATE users SET role = 'manager' WHERE employee_id = ?", [newManagerId])
        warningMessage += " Đã tự động nâng quyền tài khoản Trưởng phòng mới lên Quản lý."
      }

      // Tự động gán chức vụ Trưởng phòng cho người mới
      const [leaderPos] = await conn.execute(
        "SELECT id FROM positions WHERE department_id = ? AND name LIKE 'Trưởng phòng%' LIMIT 1",
        [req.params.id]
      )
      if (leaderPos.length > 0) {
        await conn.execute(
          "UPDATE employees SET position_id = ? WHERE id = ?",
          [leaderPos[0].id, newManagerId]
        )
      }
    }

    // Nếu đổi qua người khác, kiểm tra hạ role người cũ
    if (oldManagerId && oldManagerId !== newManagerId) {
      const [otherDepts] = await conn.execute(
        "SELECT id FROM departments WHERE manager_id = ? AND id != ?",
        [oldManagerId, req.params.id]
      )
      if (otherDepts.length === 0) {
        const [oldManagerUser] = await conn.execute(
          "SELECT id, role FROM users WHERE employee_id = ?",
          [oldManagerId]
        )
        if (oldManagerUser.length > 0 && oldManagerUser[0].role === "manager") {
          await conn.execute("UPDATE users SET role = 'employee' WHERE employee_id = ?", [oldManagerId])
          warningMessage += " Đã tự động hạ quyền tài khoản Trưởng phòng cũ về Nhân viên (không còn quản lý phòng nào)."
        }
      }

      // Tự động bỏ chức vụ Trưởng phòng của người cũ — tìm chức vụ thường của phòng đó
      const [normalPos] = await conn.execute(
        "SELECT id FROM positions WHERE department_id = ? AND name NOT LIKE 'Trưởng phòng%' LIMIT 1",
        [req.params.id]
      )
      if (normalPos.length > 0) {
        await conn.execute(
          "UPDATE employees SET position_id = ? WHERE id = ?",
          [normalPos[0].id, oldManagerId]
        )
      }
    }

    await conn.execute(
      "UPDATE departments SET name=?, description=?, manager_id=? WHERE id=?",
      [name, description || null, newManagerId, req.params.id]
    )

    await conn.commit()
    conn.release()
    return res.json({ message: `Cập nhật phòng ban thành công.${warningMessage}` })
  } catch (err) {
    await conn.rollback()
    conn.release()
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

    await pool.execute(
      "UPDATE employees SET position_id = NULL WHERE position_id IN (SELECT id FROM positions WHERE department_id = ?)",
      [req.params.id]
    )
    await pool.execute("DELETE FROM positions WHERE department_id = ?", [req.params.id])
    await pool.execute("DELETE FROM departments WHERE id = ?", [req.params.id])
    return res.json({ message: "Xóa phòng ban thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}