import cron from "node-cron"
import pool from "../config/db.js"

async function markAbsentEmployees() {
  try {
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
    const dayOfWeek = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short" })

    // Bỏ qua Chủ nhật (không phải ngày làm việc)
    if (dayOfWeek === "Sun") {
      console.log(`[AutoMarkAbsent] ${today} là Chủ nhật, bỏ qua.`)
      return
    }

    // Lấy nhân viên đang làm việc, CHƯA có bản ghi chấm công hôm nay,
    // VÀ không có đơn nghỉ phép đã duyệt cho ngày hôm nay
    const [employees] = await pool.execute(`
      SELECT e.id
      FROM employees e
      WHERE e.status = 'Dang lam'
      AND NOT EXISTS (
        SELECT 1 FROM attendances a WHERE a.employee_id = e.id AND a.work_date = ?
      )
      AND NOT EXISTS (
        SELECT 1 FROM leave_requests l 
        WHERE l.employee_id = e.id 
        AND l.status = 'Da duyet'
        AND ? BETWEEN l.start_date AND l.end_date
      )
    `, [today, today])

    for (const emp of employees) {
      await pool.execute(
        "INSERT INTO attendances (employee_id, work_date, status) VALUES (?, ?, 'Vang mat')",
        [emp.id, today]
      )
    }

    console.log(`[AutoMarkAbsent] ${today}: Đã tự động đánh dấu Vắng mặt cho ${employees.length} nhân viên.`)
  } catch (err) {
    console.error("[AutoMarkAbsent] Lỗi:", err)
  }
}

// Chạy mỗi ngày lúc 23:55 (giờ Việt Nam)
export function startAutoMarkAbsentJob() {
  cron.schedule("55 23 * * *", markAbsentEmployees, {
    timezone: "Asia/Ho_Chi_Minh",
  })
  console.log("✅ Đã khởi động job tự động đánh dấu Vắng mặt (chạy lúc 23:55 hàng ngày)")
}
