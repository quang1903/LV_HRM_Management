import api from "./api"
export const userService = {
  getAll: () => api.get("/users"),
  create: (data: any) => api.post("/users", data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  toggle: (id: number) => api.patch(`/users/${id}/toggle`),
  resetPassword: (id: number, data: any) => api.patch(`/users/${id}/reset-password`, data),
  resetDevice: (id: number) => api.patch(`/users/${id}/reset-device`),
  resetDeviceByEmployee: (employeeId: number) => api.patch(`/users/employee/${employeeId}/reset-device`),
}