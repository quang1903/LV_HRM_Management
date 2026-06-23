import { Router } from "express"
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from "../controllers/department.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/",     authMiddleware, getDepartments)
router.get("/:id",  authMiddleware, getDepartmentById)
router.post("/",    authMiddleware, roleMiddleware("admin", "hr"), createDepartment)
router.put("/:id",  authMiddleware, roleMiddleware("admin", "hr"), updateDepartment)
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteDepartment)

export default router