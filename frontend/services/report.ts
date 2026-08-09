import api from "./api"
export const reportService = {
  getAttendance: (month: number, year: number) => api.get("/reports/attendance", { params: { month, year } }),
  getDepartment: () => api.get("/reports/department"),
  getLeave: (month: number, year: number) => api.get("/reports/leave", { params: { month, year } }),
  getContract: () => api.get("/reports/contract"),
  getSalary: (month: number, year: number) => api.get("/reports/salary", { params: { month, year } }),
}