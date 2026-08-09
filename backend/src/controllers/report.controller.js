import pool from "../config/db.js"
import dotenv from "dotenv"
dotenv.config()

//Báo Cáo Thống Kê Quy Mô Nhân Sự Các Phòng Ban
export async function getAttendanceReport(req, res) {
  try {
    const { month, year } = req.query
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
    const m = month || (nowVN.getMonth() + 1)
    const y = year || nowVN.getFullYear()

    const mm = String(m).padStart(2, "0")
    const startDate = `${y}-${mm}-01`
    const lastDay = new Date(y, m, 0).getDate()//// Lấy số ngày tối đa trong tháng (28, 29, 30 hoặc 31)
    const endDate = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`
    const params = [startDate, endDate]

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
        AND a.work_date BETWEEN ? AND ?
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

//Báo Cáo Thống Kê Quy Mô Nhân Sự Các Phòng Ban
export async function getDepartmentReport(req, res) {
  try {
    const deptParams = []
    let deptWhere = ""
    if (req.user.role === 'manager') {
      deptWhere = "WHERE d.id IN (SELECT id FROM departments WHERE manager_id = ?)"
      deptParams.push(req.user.employee_id)
    }

    // Truy vấn thống kê từng phòng ban (Tên phòng, Tên Trưởng phòng, Tổng nhân sự, Số người Đang làm, Số người Nghỉ việc)
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

//Báo Cáo Thống Kê Tình Hình Nghỉ Phép Tháng
export async function getLeaveReport(req, res) {
  try {
    const { month, year } = req.query
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
    const m = month || (nowVN.getMonth() + 1)
    const y = year || nowVN.getFullYear()

    const mm = String(m).padStart(2, "0")
    const startDate = `${y}-${mm}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const endDate = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`
    const params = [startDate, endDate]
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
        AND l.start_date BETWEEN ? AND ?
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

//Báo Cáo Thống Kê Tổng Quan Hợp Đồng Lao Động
export async function getContractReport(req, res) {
  try {
    const expiringParams = req.user.role === 'manager' ? [req.user.employee_id] : []

    //Thống kê tổng số lượng hợp đồng theo từng trạng thái ('Dang hieu luc', 'Da cham dut')
    const [summary] = await pool.execute(`
      SELECT c.status, COUNT(*) as total
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      ${req.user.role === 'manager' ? 'WHERE e.department_id IN (SELECT id FROM departments WHERE manager_id = ?)' : ''}
      GROUP BY c.status
    `, expiringParams)

    //Danh sách hợp đồng sẽ hết hạn trong 30 ngày tới
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

// Báo Cáo Tính Lương Theo Tháng
export async function getSalaryReport(req, res) {
  try {
    const { month, year } = req.query
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
    const m = month || (nowVN.getMonth() + 1)
    const y = year || nowVN.getFullYear()

    const mm = String(m).padStart(2, "0")
    const startDate = `${y}-${mm}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const endDate = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`

    const [rows] = await pool.execute(`
      SELECT
        e.id, e.full_name, e.employee_code,
        d.name as department_name,
        c.salary as base_salary,
        c.contract_type,
        COALESCE(att.work_days, 0) as work_days,
        COALESCE(att.absent_days, 0) as absent_days,
        COALESCE(lv.leave_days, 0) as leave_days
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Dang hieu luc'
      LEFT JOIN (
        SELECT 
          employee_id,
          COUNT(CASE WHEN status IN ('Dung gio','Di tre','Ve som') THEN 1 END) as work_days,
          COUNT(CASE WHEN status = 'Vang mat' THEN 1 END) as absent_days
        FROM attendances
        WHERE work_date BETWEEN ? AND ?
        GROUP BY employee_id
      ) att ON att.employee_id = e.id
      LEFT JOIN (
        SELECT 
          employee_id,
          SUM(total_days) as leave_days
        FROM leave_requests
        WHERE start_date BETWEEN ? AND ? AND status = 'Da duyet'
        GROUP BY employee_id
      ) lv ON lv.employee_id = e.id
      WHERE e.status = 'Dang lam'
      ORDER BY d.name, e.full_name
    `, [startDate, endDate, startDate, endDate])

    const STANDARD_WORKDAYS = 26
    const PROBATION_RATE = 0.85

    const result = rows.map(r => {
      const typeStr = (r.contract_type || "").trim().toLowerCase()
      const isProbation = typeStr === "thu viec" || typeStr === "thử việc"
      const rate = isProbation ? PROBATION_RATE : 1.0
      const baseSalary = Number(r.base_salary || 0)
      const dailyRate = baseSalary > 0 ? baseSalary / STANDARD_WORKDAYS : 0
      const actualSalary = Math.round(dailyRate * (Number(r.work_days) + Number(r.leave_days)) * rate)
      const unexcusedAbsent = Math.max(0, Number(r.absent_days) - Number(r.leave_days))
      return { ...r, actual_salary: actualSalary, unexcused_absent: unexcusedAbsent }
    })

    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

// Báo Cáo Lương Cá Nhân (Nhân viên tự xem lương của mình)
export async function getMySalaryReport(req, res) {
  try {
    if (!req.user.employee_id) {
      return res.status(400).json({ message: "Tài khoản chưa gắn với hồ sơ nhân viên" })
    }

    const { month, year } = req.query
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
    const m = month || (nowVN.getMonth() + 1)
    const y = year || nowVN.getFullYear()

    const mm = String(m).padStart(2, "0")
    const startDate = `${y}-${mm}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const endDate = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`

    const [rows] = await pool.execute(`
      SELECT
        e.id, e.full_name, e.employee_code,
        d.name as department_name,
        c.salary as base_salary,
        c.contract_type,
        COALESCE(att.work_days, 0) as work_days,
        COALESCE(att.absent_days, 0) as absent_days,
        COALESCE(lv.leave_days, 0) as leave_days
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Dang hieu luc'
      LEFT JOIN (
        SELECT 
          employee_id,
          COUNT(CASE WHEN status IN ('Dung gio','Di tre','Ve som') THEN 1 END) as work_days,
          COUNT(CASE WHEN status = 'Vang mat' THEN 1 END) as absent_days
        FROM attendances
        WHERE work_date BETWEEN ? AND ? AND employee_id = ?
        GROUP BY employee_id
      ) att ON att.employee_id = e.id
      LEFT JOIN (
        SELECT 
          employee_id,
          SUM(total_days) as leave_days
        FROM leave_requests
        WHERE start_date BETWEEN ? AND ? AND status = 'Da duyet' AND employee_id = ?
        GROUP BY employee_id
      ) lv ON lv.employee_id = e.id
      WHERE e.id = ?
    `, [startDate, endDate, req.user.employee_id, startDate, endDate, req.user.employee_id, req.user.employee_id])

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy dữ liệu" })
    }

    const STANDARD_WORKDAYS = 26
    const PROBATION_RATE = 0.85
    const r = rows[0]

    const typeStr = (r.contract_type || "").trim().toLowerCase()
    const isProbation = typeStr === "thu viec" || typeStr === "thử việc"
    const rate = isProbation ? PROBATION_RATE : 1.0
    const baseSalary = Number(r.base_salary || 0)
    const dailyRate = baseSalary > 0 ? baseSalary / STANDARD_WORKDAYS : 0
    const actualSalary = Math.round(dailyRate * (Number(r.work_days) + Number(r.leave_days)) * rate)
    const unexcusedAbsent = Math.max(0, Number(r.absent_days) - Number(r.leave_days))

    return res.json({ ...r, actual_salary: actualSalary, unexcused_absent: unexcusedAbsent })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}