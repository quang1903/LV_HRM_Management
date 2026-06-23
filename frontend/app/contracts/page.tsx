import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { ContractTable } from "@/components/hrm/contract-table"

export default function ContractsPage() {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold">Quản lý hợp đồng</h2>
              <p className="mt-1 text-sm text-muted-foreground">Quản lý hợp đồng lao động của nhân viên</p>
            </div>
            <ContractTable />
          </div>
        </main>
      </div>
    </div>
  )
}