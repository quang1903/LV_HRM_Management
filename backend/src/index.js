//khai bao thu vien
import express from "express"
import cors from "cors" //gui yeu cau lay du lieu cho back end ma ko bị chan
import dotenv from "dotenv"  //doc bien an va file cau hinh
import path from "path"           // ⭐ MỚI
import { fileURLToPath } from "url" // ⭐ MỚI

import authRoutes from "./routes/auth.routes.js"
import employeeRoutes from "./routes/employee.routes.js"
import departmentRoutes from "./routes/department.routes.js"
import contractRoutes from "./routes/contract.routes.js"
import leaveRoutes from "./routes/leave.routes.js"
import attendanceRoutes from "./routes/attendance.routes.js"
import reportRoutes from "./routes/report.routes.js"
import userRoutes from "./routes/user.routes.js"
import positionRoutes from "./routes/position.routes.js"
import settingsRoutes from "./routes/settings.routes.js"
import profileRequestRoutes from "./routes/profileRequest.routes.js"
import { startAutoMarkAbsentJob } from "./jobs/autoMarkAbsent.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)   // ⭐ MỚI
const __dirname = path.dirname(__filename)            // ⭐ MỚI

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: "*", credentials: true })) // vé thông hành
app.use(express.json()) // phiên dịch

// ⭐ MỚI: Cho phép truy cập ảnh đã upload qua URL /uploads/...
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

app.use("/api/auth",        authRoutes)
app.use("/api/employees",   employeeRoutes)
app.use("/api/departments", departmentRoutes)
app.use("/api/contracts",   contractRoutes)
app.use("/api/leaves",      leaveRoutes)
app.use("/api/attendances", attendanceRoutes)
app.use("/api/reports",     reportRoutes)
app.use("/api/users",       userRoutes)
app.use("/api/positions", positionRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/profile-requests", profileRequestRoutes)

app.get("/", (req, res) => {
  res.json({ message: "HRM API đang chạy 🚀" })
})

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
  startAutoMarkAbsentJob()
})