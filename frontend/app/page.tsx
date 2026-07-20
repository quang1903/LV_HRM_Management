"use client"

import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { StatCards } from "@/components/hrm/stat-cards"
import { EmployeeTable } from "@/components/hrm/employee-table"
import { ActivityPanel } from "@/components/hrm/activity-panel"
import { useEffect, useState } from "react"
import { departmentService } from "@/services/department"
import { AlertTriangle, X } from "lucide-react"
import Link from "next/link"

export default function Page() {
  const { user } = useAuth()
  const canSeeAllEmployees = user?.role === "admin" || user?.role === "hr" || user?.role === "manager"
  const canSeeAlerts = user?.role === "admin" || user?.role === "hr"

  const [missingManagers, setMissingManagers] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!canSeeAlerts) return
    departmentService.getAll()
      .then(res => {
        const missing = res.data
          .filter((d: any) => !d.manager_id && d.name !== "Nhân sự")
          .map((d: any) => d.name)
        setMissingManagers(missing)
        if (missing.length > 0) setShowModal(true)
      })
      .catch(() => {})
  }, [canSeeAlerts])

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar missingManagers={missingManagers} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Tổng quan nhân sự
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Theo dõi các chỉ số quan trọng và hoạt động nhân sự trong công ty
              </p>
            </div>
            <StatCards />
            <ActivityPanel />
            {canSeeAllEmployees && <EmployeeTable />}
          </div>
        </main>
      </div>

      {/* Popup modal thông báo */}
      {canSeeAlerts && showModal && missingManagers.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Link
            href="/departments"
            className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden cursor-pointer block"
            onClick={() => setShowModal(false)}
          >
            {/* Header đỏ */}
            <div className="bg-rose-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-white" />
                <span className="text-white font-bold text-base tracking-wide">THÔNG BÁO</span>
              </div>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setShowModal(false) }}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nội dung */}
            <div className="px-6 py-6 text-center">
              <p className="text-2xl font-bold text-rose-600 mb-2">
                {missingManagers.length} phòng ban
              </p>
              <p className="text-gray-700 font-medium mb-4">
                chưa có Trưởng phòng, cần xử lý ngay!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {missingManagers.map(name => (
                  <span key={name} className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-sm text-rose-700 font-medium">
                    {name}
                  </span>
                ))}
              </div>
              <div className="inline-block rounded-lg bg-rose-600 px-6 py-2 text-white font-semibold text-sm hover:bg-rose-700 transition-colors">
                Đến trang Phòng ban →
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}