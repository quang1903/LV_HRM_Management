"use client"

import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { StatCards } from "@/components/hrm/stat-cards"
import { EmployeeTable } from "@/components/hrm/employee-table"
import { ActivityPanel } from "@/components/hrm/activity-panel"
import { CheckinButton } from "@/components/hrm/checkin-button"

export default function Page() {
  const { user } = useAuth()
  const canSeeAllEmployees = user?.role === "admin" || user?.role === "hr" || user?.role === "manager"

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
            <StatCards />
            {user?.role === "employee" && <CheckinButton />}
            <ActivityPanel />
            {canSeeAllEmployees && <EmployeeTable />}
          </div>
        </main>
      </div>
    </div>
  )
}