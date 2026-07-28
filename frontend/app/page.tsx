"use client"

import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { StatCards } from "@/components/hrm/stat-cards"
import { EmployeeTable } from "@/components/hrm/employee-table"
import { ActivityPanel } from "@/components/hrm/activity-panel"
import { useEffect, useState } from "react"
import { departmentService } from "@/services/department"
import { employeeService } from "@/services/employee"
import { attendanceService } from "@/services/attendance"
import { leaveService } from "@/services/leave"
import { contractService } from "@/services/contract"
import { AlertTriangle, X } from "lucide-react"
import Link from "next/link"

export default function Page() {
  const { user } = useAuth()
  const canSeeAllEmployees = user?.role === "admin" || user?.role === "hr" || user?.role === "manager"
  const canSeeAlerts = user?.role === "admin" || user?.role === "hr"

  const [missingManagers, setMissingManagers] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)

  // Fetch chung 1 lần cho toàn Dashboard
  const [dashData, setDashData] = useState<{
    employees: any[]
    attendance: any[]
    leaves: any[]
    contracts: any[]
    departments: any[]
  } | null>(null)

  useEffect(() => {
    if (!user) return
    const today = new Date()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    Promise.all([
      employeeService.getAll().catch(() => ({ data: [] })),
      attendanceService.getAll({ month, year }).catch(() => ({ data: [] })),
      leaveService.getAll().catch(() => ({ data: [] })),
      user.role !== "employee"
        ? contractService.getExpiring().catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      departmentService.getAll().catch(() => ({ data: [] })),
    ]).then(([empRes, attRes, leaveRes, contractRes, deptRes]) => {
      setDashData({
        employees: empRes.data || [],
        attendance: attRes.data || [],
        leaves: leaveRes.data || [],
        contracts: contractRes.data || [],
        departments: deptRes.data || [],
      })
      if (canSeeAlerts) {
        const missing = (deptRes.data || [])
          .filter((d: any) => !d.manager_id && d.name !== "Nhân sự")
          .map((d: any) => d.name)
        setMissingManagers(missing)
        if (missing.length > 0) setShowModal(true)
      }
    })
  }, [user, canSeeAlerts])

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
            <StatCards data={dashData} />
            <ActivityPanel data={dashData} />
            {canSeeAllEmployees && (
              <EmployeeTable
                initialEmployees={dashData?.employees}
                initialDepartments={dashData?.departments}
              />
            )}
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