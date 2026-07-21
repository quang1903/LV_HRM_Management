"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Users, Building2, Clock,
  CalendarDays, FileText, BarChart3, LogOut, Briefcase,
  Shield, Settings, X, UserCircle, ClipboardCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const mainMenu = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/", group: "main" },
  { key: "employees", label: "Nhân viên", icon: Users, href: "/employees", group: "main" },
  { key: "departments", label: "Phòng ban", icon: Building2, href: "/departments", group: "main" },
  { key: "attendance", label: "Chấm công", icon: Clock, href: "/attendance", group: "main" },
  { key: "leave", label: "Nghỉ phép", icon: CalendarDays, href: "/leave", group: "main" },
  { key: "contracts", label: "Hợp đồng", icon: FileText, href: "/contracts", group: "main" },
  { key: "positions", label: "Chức vụ", icon: Briefcase, href: "/positions", group: "admin" },
  { key: "reports", label: "Báo cáo", icon: BarChart3, href: "/reports", group: "admin" },
  { key: "users", href: "/users", label: "Người dùng", icon: Users, roles: ["admin", "hr"], group: "admin" },
  { key: "settings", label: "Cài đặt", icon: Settings, href: "/settings", group: "admin" },
  { key: "profile-requests", label: "Yêu cầu thay đổi", icon: ClipboardCheck, href: "/profile-requests", group: "admin" },
  { key: "profile", label: "Trang cá nhân", icon: UserCircle, href: "/profile", group: "admin" },
]

function getInitials(name: string) {
  return name?.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?"
}

const roleLabel: Record<string, string> = {
  admin: "Quản trị viên",
  hr: "Nhân sự",
  manager: "Quản lý",
  employee: "Nhân viên",
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, hasPermission } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("open-sidebar", handleOpen)
    return () => window.removeEventListener("open-sidebar", handleOpen)
  }, [])

  const visibleMenu = mainMenu.filter(item => hasPermission(item.href))
  const mainItems = visibleMenu.filter(i => i.group === "main")
  const adminItems = visibleMenu.filter(i => i.group === "admin")

  const content = (
    <div className="flex flex-col h-full min-h-0">
      {/* Logo */}
      <div className="flex h-[54px] items-center justify-between px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(99,102,241,0.9)" }}>
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold" style={{ color: "var(--sidebar-accent-foreground)" }}>
              HRM Pro
            </span>
            <span className="text-[10.5px]" style={{ color: "var(--sidebar-foreground)" }}>
              Quản lý nhân sự
            </span>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded"
          style={{ color: "var(--sidebar-foreground)" }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 flex flex-col gap-0.5 sidebar-nav">
        {mainItems.length > 0 && (
          <>
            <p className="px-2 pb-1 pt-1 text-[9.5px] font-semibold uppercase tracking-widest"
              style={{ color: "oklch(0.35 0.04 255)" }}>
              Tổng quan
            </p>
            {mainItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.key} href={item.href} onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium transition-all duration-100",
                    isActive
                      ? "text-[#a5b4fc]"
                      : "hover:text-[#c7d2fe]"
                  )}
                  style={{
                    background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                    color: isActive ? "#a5b4fc" : "var(--sidebar-foreground)",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  <Icon className="h-[15px] w-[15px] shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}

        {adminItems.length > 0 && (
          <>
            <p className="px-2 pb-1 pt-4 text-[9.5px] font-semibold uppercase tracking-widest"
              style={{ color: "oklch(0.35 0.04 255)" }}>
              Quản trị
            </p>
            {adminItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.key} href={item.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium transition-all duration-100"
                  style={{
                    background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                    color: isActive ? "#a5b4fc" : "var(--sidebar-foreground)",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  <Icon className="h-[15px] w-[15px] shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}

        {/* Đăng xuất */}
        <p className="px-2 pb-1 pt-4 text-[9.5px] font-semibold uppercase tracking-widest"
          style={{ color: "oklch(0.35 0.04 255)" }}>
          Hệ thống
        </p>
        <button type="button" onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium transition-all duration-100"
          style={{ color: "var(--sidebar-foreground)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" />
          Đăng xuất
        </button>
      </nav>

      {/* User footer */}
      <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: "rgba(99,102,241,0.9)" }}>
            {getInitials(user?.full_name || user?.username || "?")}
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[12px] font-medium"
              style={{ color: "var(--sidebar-accent-foreground)" }}>
              {user?.full_name || user?.username || "Chưa đăng nhập"}
            </span>
            <span className="truncate text-[10.5px]" style={{ color: "var(--sidebar-foreground)" }}>
              {roleLabel[user?.role || ""] || user?.role || "Nhân viên"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:block w-56 h-screen sticky top-0 shrink-0 overflow-hidden" style={{ background: "var(--sidebar)" }}>
        <div className="flex flex-col h-screen overflow-hidden">
          {content}
        </div>
      </aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-64 max-w-[85vw] h-full overflow-hidden" style={{ background: "var(--sidebar)" }}>
            <div className="flex flex-col h-full overflow-hidden">
              {content}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}