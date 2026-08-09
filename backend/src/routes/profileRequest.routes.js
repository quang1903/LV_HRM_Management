import { Router } from "express"
import { createRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest } from "../controllers/profileRequest.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/",              authMiddleware, createRequest) //tạo yêu cầu
router.get("/my",             authMiddleware, getMyRequests) //xem yêu cầu của tôi
router.get("/",                authMiddleware, roleMiddleware("admin", "hr"), getAllRequests) //xem tất cả yêu cầu trong hệ thống
router.patch("/:id/approve",  authMiddleware, roleMiddleware("admin", "hr"), approveRequest) 
router.patch("/:id/reject",   authMiddleware, roleMiddleware("admin", "hr"), rejectRequest)

export default router
