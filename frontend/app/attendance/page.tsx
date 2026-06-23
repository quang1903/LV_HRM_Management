import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { AttendanceTable } from "@/components/hrm/attendance-table"

export default function AttendancePage() {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold">Quản lý chấm công</h2>
              <p className="mt-1 text-sm text-muted-foreground">Theo dõi và quản lý chấm công nhân viên</p>
            </div>
            <AttendanceTable />
          </div>
        </main>
      </div>
    </div>
  )
}