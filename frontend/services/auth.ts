import api from "./api"
export const authService = {
  changePassword: (data: { old_password: string; new_password: string }) => api.post("/auth/change-password", data),
}
