import api from "./api"
export const settingsService = {
  get: () => api.get("/settings"),
  update: (data: any) => api.put("/settings", data),
  updateDeviceLock: (enabled: boolean) => api.put("/settings/device-lock", { device_lock_enabled: enabled }),
  updateWorkTime: (data: any) => api.put("/settings/work-time", data),
}
