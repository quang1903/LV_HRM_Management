import axios from "axios"
import { getDeviceId } from "@/lib/device"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hrm_access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers["X-Device-Id"] = getDeviceId()
  }
  return config
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem("hrm_refresh_token")
        if (!refreshToken) throw new Error("No refresh token")

        const res = await axios.post(
          `${api.defaults.baseURL?.replace("/api", "")}/api/auth/refresh`,
          { refreshToken }
        )

        const newToken = res.data.accessToken
        localStorage.setItem("hrm_access_token", newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        processQueue(error)
        localStorage.removeItem("hrm_user")
        localStorage.removeItem("hrm_access_token")
        localStorage.removeItem("hrm_refresh_token")
        // Xóa cookie hrm_user
        document.cookie = "hrm_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        if (typeof window !== "undefined") window.location.href = "/login"
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api