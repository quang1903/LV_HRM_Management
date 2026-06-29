import { Router } from "express"
import { getAttendances, getAttendanceById, createAttendance, updateAttendance, checkIn, checkOut } from "../controllers/attendance.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/",    authMiddleware, getAttendances)
router.get("/:id", authMiddleware, getAttendanceById)
router.post("/",   authMiddleware, roleMiddleware("admin", "hr"), createAttendance)
router.put("/:id", authMiddleware, roleMiddleware("admin", "hr"), updateAttendance)
router.post("/checkin",  checkIn)
router.post("/checkout", checkOut)

export default router