import { Router } from "express"
import { createRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest } from "../controllers/profileRequest.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/",              authMiddleware, createRequest)
router.get("/my",             authMiddleware, getMyRequests)
router.get("/",                authMiddleware, roleMiddleware("admin", "hr"), getAllRequests)
router.patch("/:id/approve",  authMiddleware, roleMiddleware("admin", "hr"), approveRequest)
router.patch("/:id/reject",   authMiddleware, roleMiddleware("admin", "hr"), rejectRequest)

export default router
