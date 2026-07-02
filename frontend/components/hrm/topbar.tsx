"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Plus, Menu, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

const pageLabels: Record<string, string> = {
  "/":                 "Dashboard",
  "/employees":        "Nhân viên",
  "/departments":      "Phòng ban",
  "/attendance":       "Chấm công",
  "/leave":            "Nghỉ phép",
  "/contracts":        "Hợp đồng",
  "/reports":          "Báo cáo",
  "/users":            "Người dùng",
  "/settings":         "Cài đặt",
  "/profile-requests": "Yêu cầu thay đổi",
  "/profile":          "Trang cá nhân",
}

export function Topbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const canAddEmployee = user?.role === "admin" || user?.role === "hr"
  const currentLabel = pageLabels[pathname] || "Dashboard"

  const handleOpenSidebar = () => {
    window.dispatchEvent(new CustomEvent("open-sidebar"))
  }

  return (
    <header className="sticky top-0 z-10 flex h-[54px] items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6 shrink-0">
      <button onClick={handleOpenSidebar}
        className="lg:hidden -ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
        aria-label="Mở menu">
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb */}
      <div className="flex flex-1 items-center gap-1.5 min-w-0 text-[12px]">
        <span className="text-muted-foreground hidden sm:inline">Tổng quan</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground hidden sm:inline shrink-0" />
        <span className="font-medium text-foreground truncate">{currentLabel}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="icon" className="relative h-8 w-8 rounded-lg" aria-label="Thông báo">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
        {canAddEmployee && (
          <Link href="/employees">
            <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-[12px]">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Thêm nhân viên</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}