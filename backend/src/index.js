import express from "express"
import cors from "cors"
import dotenv from "dotenv"
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

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: "*", credentials: true }))
app.use(express.json())

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

app.get("/", (req, res) => {
  res.json({ message: "HRM API đang chạy 🚀" })
})

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
})