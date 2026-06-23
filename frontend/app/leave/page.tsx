import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { LeaveTable } from "@/components/hrm/leave-table"

export default function LeavePage() {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold">Quản lý nghỉ phép</h2>
              <p className="mt-1 text-sm text-muted-foreground">Quản lý đơn xin nghỉ phép của nhân viên</p>
            </div>
            <LeaveTable />
          </div>
        </main>
      </div>
    </div>
  )
}

