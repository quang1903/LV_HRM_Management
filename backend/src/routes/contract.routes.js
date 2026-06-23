import { Router } from "express"
import { getContracts, getContractById, createContract, renewContract, terminateContract, getExpiringContracts } from "../controllers/contract.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/expiring", authMiddleware, roleMiddleware("admin", "hr", "manager"), getExpiringContracts)
router.get("/", authMiddleware, roleMiddleware("admin", "hr", "manager"), getContracts)
router.get("/:id", authMiddleware, roleMiddleware("admin", "hr", "manager"), getContractById)
router.post("/", authMiddleware, roleMiddleware("admin", "hr"), createContract)
router.put("/:id", authMiddleware, roleMiddleware("admin", "hr"), renewContract)
router.patch("/:id/terminate", authMiddleware, roleMiddleware("admin"), terminateContract)

export default router