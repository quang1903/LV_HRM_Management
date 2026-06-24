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

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasPermission: (page: string) => boolean
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "")

const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  "/":            ["admin", "hr", "manager", "employee"],
  "/employees":   ["admin", "hr", "manager"],
  "/departments": ["admin", "hr"],
  "/attendance":  ["admin", "hr", "manager", "employee"],
  "/leave":       ["admin", "hr", "manager", "employee"],
  "/contracts":   ["admin", "hr", "manager"],
  "/reports":     ["admin", "hr", "manager"],
  "/users":       ["admin"],
  "/profile":     ["admin", "hr", "manager", "employee"],
  "/profile-requests": ["admin", "hr"],
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
      localStorage.setItem("hrm_access_token",  data.accessToken)
      localStorage.setItem("hrm_refresh_token", data.refreshToken)
      localStorage.setItem("hrm_user",          JSON.stringify(data.user))
      document.cookie = `hrm_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400`
      setUser(data.user)
      return { success: true }
    } catch {
      return { success: false, error: "Không thể kết nối đến server" }
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("hrm_refresh_token")
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
    } catch {}
    finally {
      setUser(null)
      localStorage.removeItem("hrm_user")
      localStorage.removeItem("hrm_access_token")
      localStorage.removeItem("hrm_refresh_token")
      document.cookie = "hrm_user=; path=/; max-age=0"
      router.push("/login")
    }
  }

  const hasPermission = (page: string) => {
    if (!user) return false
    const allowed = PAGE_PERMISSIONS[page]
    if (!allowed) return user.role === "admin"
    return allowed.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}