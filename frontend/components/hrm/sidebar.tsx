"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Users, Building2, Clock,
  CalendarDays, FileText, BarChart3, LogOut, Briefcase, Shield, Settings, X, UserCircle, ClipboardCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const mainMenu = [
  { key: "dashboard",   label: "Dashboard",  icon: LayoutDashboard, href: "/" },
  { key: "employees",   label: "Nhân viên",  icon: Users,           href: "/employees" },
  { key: "departments", label: "Phòng ban",  icon: Building2,       href: "/departments" },
  { key: "attendance",  label: "Chấm công",  icon: Clock,           href: "/attendance" },
  { key: "leave",       label: "Nghỉ phép",  icon: CalendarDays,    href: "/leave" },
  { key: "contracts",   label: "Hợp đồng",   icon: FileText,        href: "/contracts" },
  { key: "reports",     label: "Báo cáo",    icon: BarChart3,       href: "/reports" },
  { key: "users",       label: "Người dùng", icon: Shield,          href: "/users" },
  { key: "settings",    label: "Cài đặt",    icon: Settings,        href: "/settings", roles: ["admin"] },
  { key: "profile-requests", label: "Yêu cầu thay đổi", icon: ClipboardCheck, href: "/profile-requests" },
  { key: "profile",     label: "Trang cá nhân", icon: UserCircle,   href: "/profile" },
]

function getInitials(name: string) {
  return name?.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?"
}

const roleLabel: Record<string, string> = {
  admin:    "Quản trị viên",
  hr:       "Nhân sự",
  manager:  "Quản lý",
  employee: "Nhân viên",
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, hasPermission } = useAuth()
  const [open, setOpen] = useState(false)

  // Lắng nghe sự kiện mở sidebar từ Topbar, tự động dọn dẹp khi chuyển trang
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("open-sidebar", handleOpen)
    return () => {
      window.removeEventListener("open-sidebar", handleOpen)
    }
  }, [])

  const visibleMenu = mainMenu.filter(item => hasPermission(item.href))

  const content = (
    <>
      <div className="flex h-16 items-center justify-between gap-3 border-b border-sidebar-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">HRM Pro</span>
            <span className="text-xs text-muted-foreground">Quản lý nhân sự</span>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-sidebar-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tổng quan
        </p>
        <ul className="flex flex-col gap-1">
          {visibleMenu.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Hệ thống
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </li>
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/60 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {getInitials(user?.full_name || user?.username || "?")}
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {user?.full_name || user?.username || "Chưa đăng nhập"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {roleLabel[user?.role || ""] || user?.role || "Nhân viên"}
            </span>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Sidebar cố định cho desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
        {content}
      </aside>

      {/* Overlay + Drawer cho mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-sidebar h-full animate-in slide-in-from-left">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}