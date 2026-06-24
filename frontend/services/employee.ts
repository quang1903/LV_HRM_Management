import api from "./api"
export const employeeService = {
  getAll: () => api.get("/employees"),
  getById: (id: number) => api.get(`/employees/${id}`),
  create: (data: any) => api.post("/employees", data),
  update: (id: number, data: any) => api.put(`/employees/${id}`, data),
  deactivate: (id: number) => api.delete(`/employees/${id}`),
  activate: (id: number) => api.patch(`/employees/${id}/activate`),
  permanentDelete: (id: number) => api.delete(`/employees/${id}/permanent`),
  getMyQR: () => api.get("/employees/my-qr"),
  importEmployees: (data: any[]) => api.post("/employees/import", { data }),
  resetDevice: (employeeId: number) => api.patch(`/users/employee/${employeeId}/reset-device`),
  resetDeviceByDepartment: (deptId: number) => api.patch(`/users/department/${deptId}/reset-device`),
}