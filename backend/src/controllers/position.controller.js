import pool from "../config/db.js"

export async function getPositions(req, res) {
  try {
    //Đếm số lượng nhân viên đang giữ chức vụ này
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

    //gom nhân viên theo chức vụ { "1": [{ full_name: "A", employee_code: "NV01" }]
    const empByPosition = {}
    for (const emp of empRows) {
      if (!empByPosition[emp.position_id]) empByPosition[emp.position_id] = []
      empByPosition[emp.position_id].push({ full_name: emp.full_name, employee_code: emp.employee_code })
    }

    //Ghép mảng nhân viên vào từng đối tượng chức vụ tương ứng
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
    //lấy chức vụ theo department id (dùng để đổ vào select option trong edit employee)
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
    //thêm chức vụ mới
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
    //cập nhật chức vụ
    await pool.execute(
      "UPDATE positions SET name=?, department_id=? WHERE id=?",
      [name, department_id || null, req.params.id]
    )

    //Kiểm tra nếu tên có chứa "trưởng phòng" thì gán role manager cho nhân viên
    const isLeader = name?.toLowerCase().includes("trưởng phòng")

    // Lấy danh sách nhân viên đang giữ chức vụ này
    const [emps] = await pool.execute(
      "SELECT e.id FROM employees e WHERE e.position_id = ? AND e.status = 'Dang lam'",
      [req.params.id]
    )

    //Duyệt qua từng nhân viên
    for (const emp of emps) {
      const [userRows] = await pool.execute(
        "SELECT role FROM users WHERE employee_id = ?", [emp.id]
      )
      if (userRows.length === 0) continue
      const role = userRows[0].role
      //Đổi tên và Nâng role tài khoản thành 'manager'
      if (isLeader && role !== 'admin' && role !== 'hr' && role !== 'manager') {
        await pool.execute("UPDATE users SET role = 'manager' WHERE employee_id = ?", [emp.id])
        // Nếu phòng ban đó chưa có Trưởng phòng thì gán luôn nhân viên này làm manager_id
        if (department_id) {
          const [dept] = await pool.execute("SELECT manager_id FROM departments WHERE id = ?", [department_id])
          if (dept.length > 0 && !dept[0].manager_id) {
            await pool.execute("UPDATE departments SET manager_id = ? WHERE id = ?", [emp.id, department_id])
          }
        }
        //Đổi tên bỏ chữ Trưởng phòng -> Hạ role về 'employee' và bỏ quản lý phòng ban
      } else if (!isLeader && role === 'manager') {
        const [otherDepts] = await pool.execute(
          "SELECT id FROM departments WHERE manager_id = ?", [emp.id]
        )
        // Nếu họ không làm Trưởng phòng ở phòng nào khác nữa thì hạ về 'employee'
        if (otherDepts.length === 0) {
          await pool.execute("UPDATE users SET role = 'employee' WHERE employee_id = ?", [emp.id])
        }
        // bỏ quản lý phòng ban
        await pool.execute("UPDATE departments SET manager_id = NULL WHERE manager_id = ?", [emp.id])
      }
    }

    return res.json({ message: "Cập nhật chức vụ thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function deletePosition(req, res) {
  try {
    // Kiểm tra chức vụ có đang được gán cho nhân viên không
    const [employees] = await pool.execute("SELECT id FROM employees WHERE position_id = ?", [req.params.id])
    //ko cho xóa vì có người
    if (employees.length > 0) {
      return res.status(400).json({ message: "Chức vụ đang được gán cho nhân viên, không thể xóa" })
    }
    //xóa chức vụ
    await pool.execute("DELETE FROM positions WHERE id=?", [req.params.id])
    return res.json({ message: "Xóa chức vụ thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}