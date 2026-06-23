import pool from "../config/db.js"

export async function getPositions(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, d.name as department_name
      FROM positions p
      LEFT JOIN departments d ON p.department_id = d.id
      ORDER BY d.name, p.name
    `)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getPositionsByDepartment(req, res) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM positions WHERE department_id = ? ORDER BY name",
      [req.params.departmentId]
    )
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function createPosition(req, res) {
  try {
    const { name, department_id } = req.body
    if (!name) return res.status(400).json({ message: "Vui lòng nhập tên chức vụ" })
    const [result] = await pool.execute(
      "INSERT INTO positions (name, department_id) VALUES (?, ?)",
      [name, department_id || null]
    )
    return res.status(201).json({ message: "Thêm chức vụ thành công", id: result.insertId })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updatePosition(req, res) {
  try {
    const { name, department_id } = req.body
    await pool.execute(
      "UPDATE positions SET name=?, department_id=? WHERE id=?",
      [name, department_id || null, req.params.id]
    )
    return res.json({ message: "Cập nhật chức vụ thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function deletePosition(req, res) {
  try {
    const [employees] = await pool.execute("SELECT id FROM employees WHERE position_id = ?", [req.params.id])
    if (employees.length > 0) {
      return res.status(400).json({ message: "Chức vụ đang được gán cho nhân viên, không thể xóa" })
    }
    await pool.execute("DELETE FROM positions WHERE id=?", [req.params.id])
    return res.json({ message: "Xóa chức vụ thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}