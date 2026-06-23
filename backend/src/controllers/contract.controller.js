import pool from "../config/db.js"
import dotenv from "dotenv"
dotenv.config()

export async function getContracts(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, e.full_name, e.employee_code
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      ORDER BY c.created_at DESC
    `)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getContractById(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, e.full_name, e.employee_code
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.id = ?
    `, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy hợp đồng" })
    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function createContract(req, res) {
  try {
    const { employee_id, contract_type, start_date, end_date, salary } = req.body
    if (!employee_id || !contract_type || !start_date || !salary) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc" })
    }
    if (end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" })
    }
    const [emp] = await pool.execute("SELECT id FROM employees WHERE id = ?", [employee_id])
    if (emp.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })
    const [existing] = await pool.execute(
      "SELECT id FROM contracts WHERE employee_id = ? AND status = 'Dang hieu luc'",
      [employee_id]
    )
    if (existing.length > 0) return res.status(400).json({ message: "Nhân viên đã có hợp đồng đang hiệu lực" })
    const [result] = await pool.execute(`
      INSERT INTO contracts (employee_id, contract_type, start_date, end_date, salary, status)
      VALUES (?, ?, ?, ?, ?, 'Dang hieu luc')
    `, [employee_id, contract_type, start_date, end_date || null, salary])
    return res.status(201).json({ message: "Tạo hợp đồng thành công", id: result.insertId })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function renewContract(req, res) {
  try {
    const { end_date } = req.body
    if (!end_date) return res.status(400).json({ message: "Vui lòng nhập ngày gia hạn mới" })
    const [existing] = await pool.execute("SELECT id, start_date FROM contracts WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy hợp đồng" })
    if (new Date(end_date) <= new Date(existing[0].start_date)) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu hợp đồng" })
    }
    await pool.execute(
      "UPDATE contracts SET end_date=?, status='Dang hieu luc' WHERE id=?",
      [end_date, req.params.id]
    )
    return res.json({ message: "Gia hạn hợp đồng thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function terminateContract(req, res) {
  try {
    const [existing] = await pool.execute("SELECT id, status FROM contracts WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: "Không tìm thấy hợp đồng" })
    if (existing[0].status !== 'Dang hieu luc') return res.status(400).json({ message: "Hợp đồng không còn hiệu lực" })
    await pool.execute("UPDATE contracts SET status='Da cham dut' WHERE id=?", [req.params.id])
    return res.json({ message: "Chấm dứt hợp đồng thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function getExpiringContracts(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, e.full_name, e.employee_code
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.end_date IS NOT NULL
        AND c.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND c.end_date >= CURDATE()
        AND c.status = 'Dang hieu luc'
      ORDER BY c.end_date ASC
    `)
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}