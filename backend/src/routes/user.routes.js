import { Router } from "express"
import { getUsers, createUser, updateUser, toggleUser, resetPassword, resetDevice, resetDeviceByEmployee, resetDeviceByDepartment } from "../controllers/user.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/", authMiddleware, roleMiddleware("admin", "hr", "manager"), getUsers)
router.post("/", authMiddleware, roleMiddleware("admin"), createUser)
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateUser)
router.patch("/:id/toggle", authMiddleware, roleMiddleware("admin"), toggleUser)
router.patch("/:id/reset-password", authMiddleware, roleMiddleware("admin"), resetPassword)
router.patch("/:id/reset-device", authMiddleware, roleMiddleware("admin"), resetDevice)
router.patch("/employee/:id/reset-device", authMiddleware, roleMiddleware("admin", "hr", "manager"), resetDeviceByEmployee)
router.patch("/department/:deptId/reset-device", authMiddleware, roleMiddleware("admin", "hr", "manager"), resetDeviceByDepartment)

export default router