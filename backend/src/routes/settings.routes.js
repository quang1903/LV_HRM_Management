import { Router } from "express"
import { getSettings, updateSettings, updateDeviceLock, updateScanPassword, activateScanTerminal } from "../controllers/settings.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()
router.get("/", authMiddleware, getSettings)
router.put("/", authMiddleware, roleMiddleware("admin"), updateSettings)
router.put("/device-lock", authMiddleware, roleMiddleware("admin"), updateDeviceLock)
router.post("/scan-password", authMiddleware, roleMiddleware("admin"), updateScanPassword)
router.post("/scan-activate", activateScanTerminal)
export default router
