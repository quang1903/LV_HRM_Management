import { Router } from "express"
import { getSettings, updateSettings, updateDeviceLock } from "../controllers/settings.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()
router.get("/", authMiddleware, getSettings)
router.put("/", authMiddleware, roleMiddleware("admin"), updateSettings)
router.put("/device-lock", authMiddleware, roleMiddleware("admin"), updateDeviceLock)
export default router
