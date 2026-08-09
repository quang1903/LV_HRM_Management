import { Router } from "express"
import { getAttendanceReport, getDepartmentReport, getLeaveReport, getContractReport, getSalaryReport, getMySalaryReport } from "../controllers/report.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/attendance", authMiddleware, roleMiddleware("admin", "hr", "manager"), getAttendanceReport)
router.get("/department", authMiddleware, roleMiddleware("admin", "hr", "manager"), getDepartmentReport)
router.get("/leave", authMiddleware, roleMiddleware("admin", "hr", "manager"), getLeaveReport)
router.get("/contract", authMiddleware, roleMiddleware("admin", "hr", "manager"), getContractReport)
router.get("/salary", authMiddleware, roleMiddleware("admin", "hr"), getSalaryReport)
router.get("/my-salary", authMiddleware, getMySalaryReport)

export default router