import { Router } from "express"
import { getAttendanceReport, getDepartmentReport, getLeaveReport, getContractReport } from "../controllers/report.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/attendance", authMiddleware, getAttendanceReport)
router.get("/department", authMiddleware, getDepartmentReport)
router.get("/leave", authMiddleware, getLeaveReport)
router.get("/contract", authMiddleware, getContractReport)

export default router