import { Router } from "express"
import { getSettings, updateSettings, updateDeviceLock, updateScanPassword, activateScanTerminal } from "../controllers/settings.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()
router.get("/", authMiddleware, getSettings)//Xem cấu hình hệ thống hiện tại
router.put("/", authMiddleware, roleMiddleware("admin"), updateSettings)//Cập nhật tọa độ GPS văn phòng & bán kính chấm công
router.put("/device-lock", authMiddleware, roleMiddleware("admin"), updateDeviceLock)//Bật/Tắt tính năng khóa 1 tài khoản chỉ chấm công trên 1 máy 
router.post("/scan-password", authMiddleware, roleMiddleware("admin"), updateScanPassword) //Cài đặt mật khẩu cho máy quét/Kiosk chấm công ở sảnh
router.post("/scan-activate", activateScanTerminal)//Máy quét ở sảnh gửi mật khẩu lên để lấy token xác thực
export default router
