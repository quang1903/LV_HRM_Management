export function getDeviceId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("hrm_device_id")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("hrm_device_id", id)
  }
  return id
}
