import api from "./api"
export const attendanceService = {
  getAll: (params?: any) => api.get("/attendances", { params }),
  getById: (id: number) => api.get(`/attendances/${id}`),
  create: (data: any) => api.post("/attendances", data),
  update: (id: number, data: any) => api.put(`/attendances/${id}`, data),
  selfCheckIn: (lat: number, lng: number) => api.post("/attendances/self-checkin", { latitude: lat, longitude: lng }),
  selfCheckOut: (lat: number, lng: number) => api.post("/attendances/self-checkout", { latitude: lat, longitude: lng }),
}