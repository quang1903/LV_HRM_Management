import { Router } from "express"
import { getPositions, getPositionsByDepartment, createPosition, updatePosition, deletePosition } from "../controllers/position.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/",                         authMiddleware, getPositions)
router.get("/department/:departmentId", authMiddleware, getPositionsByDepartment)
router.post("/",    authMiddleware, roleMiddleware("admin", "hr"), createPosition)
router.put("/:id",  authMiddleware, roleMiddleware("admin", "hr"), updatePosition)
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletePosition)

export default router