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
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!canSeeAlerts) return
    departmentService.getAll()
      .then(res => {
        const missing = res.data
          .filter((d: any) => !d.manager_id)
          .map((d: any) => d.name)
        setMissingManagers(missing)
      })
      .catch(() => {})
  }, [canSeeAlerts])

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
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

            {/* Banner cảnh báo */}
            {canSeeAlerts && !dismissed && missingManagers.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="flex-1">
                  <p className="font-medium">
                    {missingManagers.length} phòng ban chưa có Trưởng phòng
                  </p>
                  <p className="mt-0.5 text-amber-700">
                    {missingManagers.join(", ")} — vào trang{" "}
                    <Link href="/departments" className="underline font-medium hover:text-amber-900">
                      Phòng ban
                    </Link>{" "}
                    để gán Trưởng phòng.
                  </p>
                </div>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <StatCards />
            <ActivityPanel />
            {canSeeAllEmployees && <EmployeeTable />}
          </div>
        </main>
      </div>
    </div>
  )
}