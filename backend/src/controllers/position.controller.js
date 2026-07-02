import pool from "../config/db.js"

export async function getPositions(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, d.name as department_name,
        COUNT(e.id) as employee_count
      FROM positions p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN employees e ON e.position_id = p.id AND e.status = 'Dang lam'
      GROUP BY p.id, p.name, p.department_id, d.name
      ORDER BY d.name, p.name
    `)

    // Lấy danh sách nhân viên theo từng chức vụ
    const [empRows] = await pool.execute(`
      SELECT e.position_id, e.full_name, e.employee_code
      FROM employees e
      WHERE e.status = 'Dang lam' AND e.position_id IS NOT NULL
      ORDER BY e.full_name
    `)

    const empByPosition = {}
    for (const emp of empRows) {
      if (!empByPosition[emp.position_id]) empByPosition[emp.position_id] = []
      empByPosition[emp.position_id].push({ full_name: emp.full_name, employee_code: emp.employee_code })
    }

    const result = rows.map(p => ({
      ...p,
      employees: empByPosition[p.id] || []
    }))

    return res.json(result)
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