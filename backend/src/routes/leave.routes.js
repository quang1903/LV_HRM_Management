import { Router } from "express"
import { getLeaves, getLeaveById, createLeave, approveLeave, rejectLeave, getLeaveBalance } from "../controllers/leave.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"
import { uploadLeaveAttachment } from "../middlewares/upload.middleware.js"

const router = Router()

router.get("/",    authMiddleware, getLeaves)
router.get("/balance", authMiddleware, getLeaveBalance)
router.get("/:id", authMiddleware, getLeaveById)
router.post("/",   authMiddleware, uploadLeaveAttachment.single("attachment"), createLeave)
router.patch("/:id/approve", authMiddleware, roleMiddleware("admin", "hr", "manager"), approveLeave)
router.patch("/:id/reject",  authMiddleware, roleMiddleware("admin", "hr", "manager"), rejectLeave)

export default router