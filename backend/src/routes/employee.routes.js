import { Router } from "express"
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, deactivateEmployee, activateEmployee, permanentDelete, getMyQRSecret, importEmployees } from "../controllers/employee.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/my-qr", authMiddleware, getMyQRSecret)
router.post("/import", authMiddleware, roleMiddleware("admin", "hr"), importEmployees)
router.get("/",     authMiddleware, getEmployees)
router.get("/:id",  authMiddleware, getEmployeeById)
router.post("/",    authMiddleware, roleMiddleware("admin", "hr"), createEmployee)
router.put("/:id",  authMiddleware, roleMiddleware("admin", "hr"), updateEmployee)
router.delete("/:id", authMiddleware, roleMiddleware("admin", "hr"), deactivateEmployee)
router.patch("/:id/activate", authMiddleware, roleMiddleware("admin", "hr"), activateEmployee)
router.delete("/:id/permanent", authMiddleware, roleMiddleware("admin"), permanentDelete)

export default router