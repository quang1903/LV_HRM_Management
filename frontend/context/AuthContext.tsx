"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getDeviceId } from "@/lib/device"

export type UserRole = "admin" | "hr" | "manager" | "employee"

export type User = {
  id: number
  email: string
  username: string
  role: UserRole
  employee_id: number | null
  full_name: string | null
  employee_code: string | null
  avatar_url: string | null
}

//// Kịch bản định dạng đối tượng User
type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasPermission: (page: string) => boolean
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "")

const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  "/": ["admin", "hr", "manager", "employee"],
  "/employees": ["admin", "hr", "manager"],
  "/departments": ["admin", "hr"],
  "/positions": ["admin", "hr"],
  "/attendance": ["admin", "hr", "manager", "employee"],
  "/leave": ["admin", "hr", "manager", "employee"],
  "/contracts": ["admin", "hr", "manager"],
  "/reports": ["admin", "hr", "manager"],
  "/users": ["admin", "hr"],
  "/settings": ["admin", "hr"],
  "/profile": ["admin", "hr", "manager", "employee"],
  "/profile-requests": ["admin", "hr"],
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  //Khi vừa vào Web, đọc thông tin user đã lưu trong localStorage ra để duy trì trạng thái đăng nhập
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hrm_user")
      if (stored) setUser(JSON.parse(stored))
    } catch {
      localStorage.removeItem("hrm_user")
      localStorage.removeItem("hrm_access_token")
      localStorage.removeItem("hrm_refresh_token")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // HÀM ĐĂNG NHẬP (login)
  const login = async (email: string, password: string) => {
    try {
      const device_id = getDeviceId()
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, device_id }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message || "Đăng nhập thất bại" }
      // Đăng nhập thành công -> Lưu accessToken, refreshToken, hrm_user vào localStorage & Cookie
      localStorage.setItem("hrm_access_token", data.accessToken)
      localStorage.setItem("hrm_refresh_token", data.refreshToken)
      localStorage.setItem("hrm_user", JSON.stringify(data.user))
      document.cookie = `hrm_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400`
      setUser(data.user)
      return { success: true }
    } catch {
      return { success: false, error: "Không thể kết nối đến server" }
    }
  }

  // HÀM ĐĂNG XUẤT (logout)
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("hrm_refresh_token")
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
    } catch { }
    finally {
      // Xóa sạch toàn bộ dữ liệu trong bộ nhớ và chuyển hướng về trang /login
      setUser(null)
      localStorage.removeItem("hrm_user")
      localStorage.removeItem("hrm_access_token")
      localStorage.removeItem("hrm_refresh_token")
      document.cookie = "hrm_user=; path=/; max-age=0"
      router.push("/login")
    }
  }

  // HÀM KIỂM TRA QUYỀN TRUY CẬP TRANG (hasPermission)
  const hasPermission = (page: string) => {
    if (!user) return false
    const allowed = PAGE_PERMISSIONS[page]
    if (!allowed) return user.role === "admin" // Nếu không có trong danh sách, chỉ Admin mới được vào
    return allowed.includes(user.role) // Check xem role có nằm trong danh sách được phép không
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

//Giúp các component giao diện gọi ngắn gọn: const { user, logout } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

/*
Nếu KHÔNG dùng useAuth() (Phải viết rườm rà 3 dòng):
Ở mỗi file giao diện (Header, Sidebar, Bảng nhân viên...), bạn phải tự import useContext và AuthContext:

import { useContext } from "react"
import { AuthContext } from "@/context/AuthContext"
const context = useContext(AuthContext)
if (!context) throw new Error("Chưa bọc AuthProvider")
const user = context.user

Khi CÓ useAuth() (Chỉ cần viết đúng 1 dòng gọn nhẹ):

import { useAuth } from "@/context/AuthContext"
const { user, logout } = useAuth()
*/