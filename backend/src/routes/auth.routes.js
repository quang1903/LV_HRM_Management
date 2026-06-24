import { Router } from "express"
import { login, logout, refreshToken, getMe, changePassword } from "../controllers/auth.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/login",   login)
router.post("/logout",  logout)
router.post("/refresh", refreshToken)
router.get("/me",       authMiddleware, getMe)
router.post("/change-password", authMiddleware, changePassword)

export default router