import axios from "axios"
import { getDeviceId } from "@/lib/device"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    //Lấy Access Token từ localStorage và đính vào Header Authorization dạng 'Bearer <token>'
    const token = localStorage.getItem("hrm_access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Đính kèm Device ID thiết bị vào Header 'X-Device-Id' phục vụ cho tính năng Device Lock
    config.headers["X-Device-Id"] = getDeviceId()
  }
  return config
})

let isRefreshing = false
let failedQueue: any[] = []

// Hàm giải quyết hàng chờ: Duyệt qua tất cả request trong failedQueue
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error) // Nếu xin token thất bại -> Báo lỗi cho cả hàng chờ
    else resolve(token) // Nếu xin token thành công -> Trả token cho request chờ
  })
  // Xóa hàng chờ sau khi xử lý xong
  failedQueue = []
}


//Xử lý Response từ Backend trả về
api.interceptors.response.use(
  (response) => response,// trả kq nếu thành công
  async (error) => {
    const originalRequest = error.config

    //kt lỗi 401 và đảm bảo không xử lý lại request này chưa từng thử lại 
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang trong quá trình Refresh Token, các request đến sau sẽ được đẩy vào hàng chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest) // Chờ có token mới thì gửi lại lá thư này
        })
      }

      originalRequest._retry = true
      isRefreshing = true // Đánh dấu: "Người đại diện đi xin Token mới!"

      try {
        //Lấy Refresh Token từ localStorage gửi lên API /auth/refresh để lấy Access Token mới
        const refreshToken = localStorage.getItem("hrm_refresh_token")
        if (!refreshToken) throw new Error("No refresh token")

        const res = await axios.post(
          `${api.defaults.baseURL?.replace("/api", "")}/api/auth/refresh`,
          { refreshToken }
        )

        const newToken = res.data.accessToken
        //Lưu Access Token mới vào localStorage và xử lý hàng chờ các request bị nghẽn
        localStorage.setItem("hrm_access_token", newToken)
        processQueue(null, newToken)
        //Gửi lại request ban đầu với Token mới
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        //Nếu Refresh Token cũng hết hạn hoặc lỗi -> Đăng xuất người dùng & đẩy về trang /login
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