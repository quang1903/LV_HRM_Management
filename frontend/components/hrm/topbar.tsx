"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Plus, Menu, ChevronRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { useState, useRef, useEffect } from "react"

const pageLabels: Record<string, string> = {
  "/": "Dashboard",
  "/employees": "Nhân viên",
  "/departments": "Phòng ban",
  "/attendance": "Chấm công",
  "/leave": "Nghỉ phép",
  "/contracts": "Hợp đồng",
  "/reports": "Báo cáo",
  "/users": "Người dùng",
  "/settings": "Cài đặt",
  "/profile-requests": "Yêu cầu thay đổi",
  "/profile": "Trang cá nhân",
  "/positions": "Chức vụ",
}

type TopbarProps = {
  missingManagers?: string[]
}


export function Topbar({ missingManagers = [] }: TopbarProps) {
  // Sử dụng AuthContext để lấy thông tin user
  const { user } = useAuth()
  // Lấy đường dẫn hiện tại
  const pathname = usePathname()
  // Điều kiện hiển thị nút thêm nhân viên
  const canAddEmployee = user?.role === "admin" || user?.role === "hr"
  // Điều kiện hiển thị thông báo
  const canSeeAlerts = user?.role === "admin" || user?.role === "hr"
  // Hiện thị tên Trang hiện tại
  const currentLabel = pageLabels[pathname] || "Dashboard"
  // Hiện thị thông báo
  const [showNotif, setShowNotif] = useState(false)
  // Tham chiếu đến dropdown thông báo
  const notifRef = useRef<HTMLDivElement>(null)
  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    // Hàm xử lý đóng dropdown khi click ra ngoài
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    // Thêm event listener
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Hàm xử lý mở sidebar
  const handleOpenSidebar = () => {
    window.dispatchEvent(new CustomEvent("open-sidebar"))
  }
  // Số lượng thông báo
  const totalAlerts = missingManagers.length
  // Render giao diện
  return (
    <header className="sticky top-0 z-10 flex h-[54px] items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6 shrink-0">
      {/* Nút mở sidebar */}
      <button onClick={handleOpenSidebar}
        className="lg:hidden -ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
        aria-label="Mở menu">
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb */}
      <div className="flex flex-1 items-center gap-1.5 min-w-0 text-[12px]">
        {/* Trang chủ */}
        <span className="text-muted-foreground hidden sm:inline">Tổng quan</span>
        {/* Mũi tên */}
        <ChevronRight className="h-3 w-3 text-muted-foreground hidden sm:inline shrink-0" />
        {/* Trang hiện tại */}
        <span className="font-medium text-foreground truncate">{currentLabel}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Chuông thông báo */}
        {canSeeAlerts && (
          <div className="relative" ref={notifRef}>
            {/* Nút chuông thông báo */}
            <Button
              variant="outline"
              size="icon"
              className="relative h-8 w-8 rounded-lg"
              aria-label="Thông báo"
              onClick={() => setShowNotif(!showNotif)}
            >
              <Bell className="h-3.5 w-3.5" />
              {totalAlerts > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {totalAlerts}
                </span>
              )}
            </Button>

            {/* Dropdown thông báo */}
            {showNotif && (
              <div className="absolute right-0 top-10 w-80 rounded-xl border border-border bg-background shadow-xl z-50">
                {/* Tiêu đề dropdown */}
                <div className="border-b border-border px-4 py-3">
                  <p className="font-semibold text-sm">Thông báo hệ thống</p>
                </div>
                {/* Nội dung dropdown */}
                <div className="max-h-72 overflow-y-auto">
                  {totalAlerts === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Không có thông báo nào
                    </p>
                  ) : (
                    <>
                      {/* Thông báo các phòng ban chưa có trưởng phòng */}
                      {missingManagers.length > 0 && (
                        <Link
                          href="/departments"
                          onClick={() => setShowNotif(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                        >
                          {/* Icon thông báo */}
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          </div>
                          {/* Nội dung thông báo */}
                          <div>
                            {/* Số lượng phòng ban chưa có trưởng phòng */}
                            <p className="text-sm font-medium text-foreground">
                              {missingManagers.length} phòng ban chưa có Trưởng phòng
                            </p>
                            {/* Danh sách các phòng ban chưa có trưởng phòng */}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {missingManagers.join(", ")}
                            </p>
                            {/* Link xử lý thông báo */}
                            <p className="text-xs text-rose-600 mt-1 font-medium">Bấm để xử lý →</p>
                          </div>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nút thêm nhân viên */}
        {canAddEmployee && (
          <Link href="/employees">
            {/* Nút thêm nhân viên */}
            <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-[12px]">
              {/* Icon thêm nhân viên */}
              <Plus className="h-3.5 w-3.5" />
              {/* Chữ Thêm nhân viên */}
              <span className="hidden sm:inline">Thêm nhân viên</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}