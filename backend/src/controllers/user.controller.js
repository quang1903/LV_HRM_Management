import pool from "../config/db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config()

//Lấy danh sách Tài khoản Hệ thống
export async function getUsers(req, res) {
  try {
    let query = `
      SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login_at, u.created_at,
             u.employee_id,
             e.full_name, e.employee_code, e.department_id,
             d.name as department_name,
             GROUP_CONCAT(dm.name SEPARATOR ', ') as managing_department_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN departments dm ON dm.manager_id = e.id
    `
    const params = []

    // Manager chỉ thấy user thuộc phòng ban mình quản lý
    if (req.user.role === "manager") {
      query += `
        WHERE e.department_id IN (
          SELECT id FROM departments WHERE manager_id = ?
        )
      `
      params.push(req.user.employee_id)
    }

    query += `
      GROUP BY u.id, u.username, u.email, u.role, u.is_active, u.last_login_at, u.created_at,
               u.employee_id, e.full_name, e.employee_code, e.department_id, d.name
      ORDER BY u.created_at DESC
    `
    const [rows] = await pool.execute(query, params)

    // Ẩn email với role employee
    if (req.user.role === "employee") {
      rows.forEach((row) => {
        if (row.id !== req.user.id) {
          delete row.email
        }
      })
    }
    return res.json(rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

//Tạo Tài khoản Đăng nhập Mới
export async function createUser(req, res) {
  try {
    const { username, email, password, role, employee_id } = req.body
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" })
    }

    //Kiểm tra Email hoặc Username đã tồn tại chưa
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?", [email, username]
    )
    if (existing.length > 0) return res.status(400).json({ message: "Email hoặc username đã tồn tại" })

    //Kiểm tra Nhân viên hợp lệ hay không
    if (employee_id) {
      const [empRows] = await pool.execute("SELECT id, status FROM employees WHERE id = ?", [employee_id])
      if (empRows.length === 0) return res.status(400).json({ message: "Không tìm thấy nhân viên" })
      if (empRows[0].status === 'Nghi viec') {
        return res.status(400).json({ message: "Nhân viên đã nghỉ việc, không thể tạo tài khoản" })
      }

      //Kiểm tra Nhân viên đã có tài khoản chưa
      const [dupEmp] = await pool.execute("SELECT id FROM users WHERE employee_id = ?", [employee_id])
      if (dupEmp.length > 0) return res.status(400).json({ message: "Nhân viên này đã có tài khoản" })
    }

    //Mã hóa mật khẩu bằng Bcrypt và chèn vào bảng `users` với trạng thái mở (`is_active = 1`)
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
    //Kiểm tra tài khoản cần sửa có tồn tại trong hệ thống hay không
    const { role, employee_id } = req.body
    const [existing] = await pool.execute("SELECT id, role, employee_id FROM users WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy tài khoản" })
    //Kiểm tra nếu có nhân viên được gán vào tài khoản thì phải kiểm tra tiếp
    if (employee_id) {
      const [dupEmp] = await pool.execute("SELECT id FROM users WHERE employee_id = ? AND id != ?", [employee_id, req.params.id])
      if (dupEmp.length > 0) return res.status(400).json({ message: "Nhân viên này đã có tài khoản khác" })
    }

    const oldUser = existing[0]
    let warningMessage = ""

    // Nếu đang hạ role từ manager xuống role khác, kiểm tra và xóa Trưởng phòng nếu có
    if (oldUser.role === "manager" && role !== "manager" && oldUser.employee_id) {
      const [deptRows] = await pool.execute(
        "SELECT id, name FROM departments WHERE manager_id = ?",
        [oldUser.employee_id]
      )
      if (deptRows.length > 0) {
        //Gán manager_id = NULL ở bảng departments
        await pool.execute("UPDATE departments SET manager_id = NULL WHERE manager_id = ?", [oldUser.employee_id])
        const deptNames = deptRows.map(d => d.name).join(", ")
        warningMessage = ` (Đã tự động bỏ chức Trưởng phòng tại: ${deptNames})`
      }
    }

    //Cập nhật thông tin role và employee_id mới vào bảng users
    await pool.execute(
      "UPDATE users SET role = ?, employee_id = ? WHERE id = ?",
      [role, employee_id || null, req.params.id]
    )
    return res.json({ message: `Cập nhật thành công${warningMessage}` })
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
    
    //Không cho phép Admin tự khóa tài khoản của chính mình (req.user.id)
    if (existing[0].id === req.user.id) {
      return res.status(400).json({ message: "Không thể vô hiệu hóa tài khoản của chính mình" })
    }
    //Đảo ngược trạng thái: Nếu đang 1 (active) -> 0 (inactive), và ngược lại
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
    const [result] = await pool.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, req.params.id])
    //Nếu không có dòng nào được cập nhật => User ID không tồn tại
    if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy tài khoản" })
    return res.json({ message: "Đặt lại mật khẩu thành công" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function resetDevice(req, res) {
  try {
    const [result] = await pool.execute("UPDATE users SET device_id = NULL WHERE id = ?", [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy tài khoản" })
    return res.json({ message: "Đã reset thiết bị, nhân viên có thể đăng nhập lại từ máy mới" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function resetDeviceByEmployee(req, res) {
  try {
    const employeeId = req.params.id // ID của NHÂN VIÊN (employees.id)

    //Tìm user id tương ứng với employee_id này
    const [userRows] = await pool.execute("SELECT id FROM users WHERE employee_id = ?", [employeeId])
    if (userRows.length === 0) return res.status(404).json({ message: "Nhân viên chưa có tài khoản" })

    //Nếu là Manager, kiểm tra nhân viên có thuộc phòng ban mình quản lý không
    if (req.user.role === "manager") {
      const [emp] = await pool.execute("SELECT department_id FROM employees WHERE id = ?", [employeeId])
      if (emp.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })

      const [dept] = await pool.execute(
        "SELECT id FROM departments WHERE id = ? AND manager_id = ?",
        [emp[0].department_id, req.user.employee_id]
      )
      if (dept.length === 0) {
        return res.status(403).json({ message: "Bạn chỉ được reset thiết bị cho nhân viên thuộc phòng ban mình quản lý" })
      }
    }

    //Thực hiện đặt device_id = NULL
    await pool.execute("UPDATE users SET device_id = NULL WHERE id = ?", [userRows[0].id])
    return res.json({ message: "Đã reset thiết bị, nhân viên có thể đăng nhập lại từ máy mới" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function resetDeviceByDepartment(req, res) {
  try {
    const departmentId = req.params.deptId

    // Nếu là Manager, chỉ cho reset đúng phòng mình quản lý
    if (req.user.role === "manager") {
      const [dept] = await pool.execute(
        "SELECT id FROM departments WHERE id = ? AND manager_id = ?",
        [departmentId, req.user.employee_id]
      )
      if (dept.length === 0) {
        return res.status(403).json({ message: "Bạn chỉ được reset thiết bị cho phòng ban mình quản lý" })
      }
    }

    //Lấy tất cả các user có employee_id thuộc departmentId
    const [userRows] = await pool.execute(`
      SELECT u.id FROM users u
      INNER JOIN employees e ON u.employee_id = e.id
      WHERE e.department_id = ?
    `, [departmentId])

    if (userRows.length === 0) {
      return res.json({ message: "Không có tài khoản nào trong phòng ban này", resetCount: 0 })
    }

    //Thực hiện đặt device_id = NULL
    const userIds = userRows.map(r => r.id)
    await pool.execute(
      `UPDATE users SET device_id = NULL WHERE id IN (${userIds.map(() => "?").join(",")})`,
      userIds
    )

    return res.json({ message: `Đã reset thiết bị cho ${userIds.length} nhân viên`, resetCount: userIds.length })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}