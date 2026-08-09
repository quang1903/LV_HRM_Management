import { Router } from "express"
import { login, logout, refreshToken, getMe, changePassword } from "../controllers/auth.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/login",   login)
router.post("/logout",  logout)
router.post("/refresh", refreshToken)

//Nghĩa là request bắt buộc phải gửi kèm Token hợp lệ và giải mã xong thì mới được chuyển vào hàm getMe
router.get("/me",       authMiddleware, getMe)
router.post("/change-password", authMiddleware, changePassword)

export default router