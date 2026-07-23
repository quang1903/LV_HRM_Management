import pool from "../config/db.js"
import dotenv from "dotenv"
dotenv.config()

export async function getAttendanceReport(req, res) {
  try {
    const { month, year } = req.query
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
    const m = month || (nowVN.getMonth() + 1)
    const y = year  || nowVN.getFullYear()

    const params = [m, y]
    if (req.user.role === 'manager') {
      params.push(req.user.employee_id)
    }

    const [rows] = await pool.execute(`
      SELECT
        e.id, e.full_name, e.employee_code,
        d.name as department_name,
        COUNT(a.id) as total_days,
        SUM(CASE WHEN a.status = 'Dung gio' THEN 1 ELSE 0 END) as on_time,
        SUM(CASE WHEN a.status = 'Di tre'   THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN a.status = 'Ve som'   THEN 1 ELSE 0 END) as early_leave,
        SUM(CASE WHEN a.status = 'Vang mat' THEN 1 ELSE 0 END) as absent,
        SUM(a.work_minutes) as total_work_minutes
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendances a ON e.id = a.employee_id
        AND MONTH(a.work_date) = ? AND YEAR(a.work_date) = ?
      WHERE e.status = 'Dang lam'
        ${req.user.role === 'manager' ? 'AND e.department_id IN (SELECT id FROM departments WHERE manager_id = ?)' : ''}
      GROUP BY e.id, e.full_name, e.employee_code, d.name
      ORDER BY d.name, e.full_name
    `, params)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getDepartmentReport(req, res) {
  try {
    const deptParams = []
    let deptWhere = ""
    if (req.user.role === 'manager') {
      deptWhere = "WHERE d.id IN (SELECT id FROM departments WHERE manager_id = ?)"
      deptParams.push(req.user.employee_id)
    }

    const [rows] = await pool.execute(`
      SELECT
        d.id, d.name as department_name,
        e_manager.full_name as manager_name,
        COUNT(e.id) as total_employees,
        SUM(CASE WHEN e.status = 'Dang lam'  THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN e.status = 'Nghi viec' THEN 1 ELSE 0 END) as inactive
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      LEFT JOIN employees e_manager ON d.manager_id = e_manager.id
      ${deptWhere}
      GROUP BY d.id, d.name, e_manager.full_name
      ORDER BY d.name
    `, deptParams)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getLeaveReport(req, res) {
  try {
    const { month, year } = req.query
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
    const m = month || (nowVN.getMonth() + 1)
    const y = year  || nowVN.getFullYear()

    const params = [m, y]
    if (req.user.role === 'manager') {
      params.push(req.user.employee_id)
    }

    const [rows] = await pool.execute(`
      SELECT
        e.id, e.full_name, e.employee_code,
        d.name as department_name,
        COUNT(l.id) as total_requests,
        SUM(CASE WHEN l.status = 'Da duyet'  THEN l.total_days ELSE 0 END) as approved_days,
        SUM(CASE WHEN l.status = 'Cho duyet' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN l.status = 'Tu choi'   THEN 1 ELSE 0 END) as rejected
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN leave_requests l ON e.id = l.employee_id
        AND MONTH(l.start_date) = ? AND YEAR(l.start_date) = ?
      WHERE e.status = 'Dang lam'
        ${req.user.role === 'manager' ? 'AND e.department_id IN (SELECT id FROM departments WHERE manager_id = ?)' : ''}
      GROUP BY e.id, e.full_name, e.employee_code, d.name
      ORDER BY d.name, e.full_name
    `, params)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getContractReport(req, res) {
  try {
    const expiringParams = req.user.role === 'manager' ? [req.user.employee_id] : []

    const [summary] = await pool.execute(`
      SELECT c.status, COUNT(*) as total
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      ${req.user.role === 'manager' ? 'WHERE e.department_id IN (SELECT id FROM departments WHERE manager_id = ?)' : ''}
      GROUP BY c.status
    `, expiringParams)

    const [expiring] = await pool.execute(`
      SELECT c.*, e.full_name, e.employee_code
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.end_date IS NOT NULL
        AND c.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND c.end_date >= CURDATE()
        AND c.status = 'Dang hieu luc'
        ${req.user.role === 'manager' ? 'AND e.department_id IN (SELECT id FROM departments WHERE manager_id = ?)' : ''}
      ORDER BY c.end_date ASC
    `, expiringParams)

    return res.json({ summary, expiring })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}