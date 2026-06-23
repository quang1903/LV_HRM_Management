"use client"

import Link from "next/link"
import { Bell, Plus, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

export function Topbar() {
  const { user } = useAuth()
  const canAddEmployee = user?.role === "admin" || user?.role === "hr"

  const handleOpenSidebar = () => {
    window.dispatchEvent(new CustomEvent("open-sidebar"))
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur md:px-8">
      <button
        onClick={handleOpenSidebar}
        className="lg:hidden -ml-1 rounded-md p-2 text-foreground hover:bg-muted"
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="flex flex-col leading-tight min-w-0">
          <h1 className="text-base font-semibold text-foreground md:text-lg truncate">Dashboard</h1>
          <p className="hidden text-xs text-muted-foreground md:block">
            Xin chào, chúc bạn một ngày làm việc hiệu quả
          </p>
        </div>
      </div>

      <Button variant="outline" size="icon" className="relative shrink-0" aria-label="Thông báo">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
      </Button>

      {canAddEmployee && (
        <Link href="/employees" className="shrink-0">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Thêm nhân viên</span>
          </Button>
        </Link>
      )}
    </header>
  )
}