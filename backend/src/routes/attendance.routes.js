import { Router } from "express"
import { getAttendances, getAttendanceById, createAttendance, updateAttendance, checkIn, checkOut, selfCheckIn, selfCheckOut } from "../controllers/attendance.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/",    authMiddleware, getAttendances)
router.get("/:id", authMiddleware, getAttendanceById)
router.post("/",   authMiddleware, roleMiddleware("admin", "hr"), createAttendance)
router.put("/:id", authMiddleware, roleMiddleware("admin", "hr"), updateAttendance)
router.post("/checkin",  checkIn)
router.post("/checkout", checkOut)

router.post("/self-checkin",  authMiddleware, selfCheckIn)
router.post("/self-checkout", authMiddleware, selfCheckOut)

export default router