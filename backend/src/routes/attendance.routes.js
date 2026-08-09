import { Router } from "express"
import { getAttendances, getAttendanceById, createAttendance, updateAttendance, checkIn, checkOut } from "../controllers/attendance.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"
import pool from "../config/db.js"

const router = Router()

// MIDDLEWARE RIÊNG CHO MÁY QUÉT QR (Terminal Kiosk)
async function verifyTerminalToken(req, res, next) {
  try {
    // Kiểm tra máy tính/máy tính bảng đặt ở sảnh công ty có đính kèm 'x-terminal-token' không
    const token = req.headers["x-terminal-token"]
    if (!token) return res.status(401).json({ message: "Thiết bị chưa được kích hoạt" })
    // Đối chiếu token của máy quét với token mã hóa lưu trong bảng settings của MySQL
    const [rows] = await pool.execute("SELECT scan_token FROM settings WHERE id = 1")
    if (rows.length === 0 || rows[0].scan_token !== token) {
      return res.status(401).json({ message: "Token không hợp lệ, vui lòng kích hoạt lại máy quét" })
    }
    //cho phép 
    next()
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

router.get("/",    authMiddleware, getAttendances)
router.get("/:id", authMiddleware, getAttendanceById)
router.post("/",   authMiddleware, roleMiddleware("admin", "hr"), createAttendance)
router.put("/:id", authMiddleware, roleMiddleware("admin", "hr"), updateAttendance)
router.post("/checkin",  verifyTerminalToken, checkIn)
router.post("/checkout", verifyTerminalToken, checkOut)

export default router