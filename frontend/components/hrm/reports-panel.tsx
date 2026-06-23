"use client"

import { useState, useEffect } from "react"
import { Download, Users, Clock, FileText, TrendingUp, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { reportService } from "@/services/report"

export function ReportsPanel() {
  const [activeTab, setActiveTab] = useState<"attendance" | "department" | "leave" | "contract">("attendance")
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear]   = useState(new Date().getFullYear())

  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [leaveData, setLeaveData]           = useState<any[]>([])
  const [contractData, setContractData]     = useState<{ summary: any[]; expiring: any[] }>({ summary: [], expiring: [] })

  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingDepartment, setLoadingDepartment] = useState(false)
  const [loadingLeave, setLoadingLeave]           = useState(false)
  const [loadingContract, setLoadingContract]     = useState(false)

  const totalEmployees   = departmentData.reduce((sum, d) => sum + Number(d.active || 0), 0)
  const totalAttDays     = attendanceData.reduce((sum, e) => sum + Number(e.total_days || 0), 0)
  const totalOnTime      = attendanceData.reduce((sum, e) => sum + Number(e.on_time || 0), 0)
  const attendanceRate   = totalAttDays > 0 ? Math.round((totalOnTime / totalAttDays) * 100) : 0
  const pendingLeaves    = leaveData.reduce((sum, e) => sum + Number(e.pending || 0), 0)
  const expiringContracts = contractData.expiring.length

  useEffect(() => { fetchDepartment(); fetchContract() }, [])
  useEffect(() => { fetchAttendance(); fetchLeave() }, [month, year])

  const fetchAttendance = async () => {
    try { setLoadingAttendance(true); const res = await reportService.getAttendance(month, year); setAttendanceData(res.data) }
    catch { } finally { setLoadingAttendance(false) }
  }
  const fetchDepartment = async () => {
    try { setLoadingDepartment(true); const res = await reportService.getDepartment(); setDepartmentData(res.data) }
    catch { } finally { setLoadingDepartment(false) }
  }
  const fetchLeave = async () => {
    try { setLoadingLeave(true); const res = await reportService.getLeave(month, year); setLeaveData(res.data) }
    catch { } finally { setLoadingLeave(false) }
  }
  const fetchContract = async () => {
    try { setLoadingContract(true); const res = await reportService.getContract(); setContractData(res.data) }
    catch { } finally { setLoadingContract(false) }
  }

  const contractCount = (status: string) => contractData.summary.find(s => s.status === status)?.total || 0

  const tabs = [
    { key: "attendance", label: "Chấm công", icon: Clock },
    { key: "department", label: "Phòng ban", icon: Users },
    { key: "leave",      label: "Nghỉ phép", icon: FileText },
    { key: "contract",   label: "Hợp đồng",  icon: TrendingUp },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tổng nhân viên",   value: totalEmployees || "—",    color: "text-blue-600",    bg: "bg-blue-50" },
          { label: "Tỷ lệ đúng giờ",   value: totalAttDays > 0 ? `${attendanceRate}%` : "—", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Đơn chờ duyệt",    value: pendingLeaves || "—",     color: "text-amber-600",   bg: "bg-amber-50" },
          { label: "HĐ sắp hết hạn",   value: expiringContracts || "—", color: "text-rose-600",    bg: "bg-rose-50" },
        ].map(item => (
          <Card key={item.label} className="p-5">
            <div className={cn("inline-flex rounded-lg p-2 mb-3", item.bg)}>
              <TrendingUp className={cn("h-5 w-5", item.color)} />
            </div>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className={cn("text-3xl font-semibold mt-1", item.color)}>{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Bộ lọc tháng/năm */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Xem theo:</span>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
          value={month} onChange={e => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i+1} value={i+1}>Tháng {i+1}</option>
          ))}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
          value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              <Icon className="h-4 w-4" />{tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Chấm công */}
      {activeTab === "attendance" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Báo cáo chấm công tháng {month}/{year}</h3>
            <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Xuất Excel</Button>
          </div>
          {loadingAttendance ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Nhân viên</th>
                    <th className="px-4 py-3">Phòng ban</th>
                    <th className="px-4 py-3">Đúng giờ</th>
                    <th className="px-4 py-3">Đi trễ</th>
                    <th className="px-4 py-3">Vắng mặt</th>
                    <th className="px-4 py-3">Tổng giờ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceData.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Không có dữ liệu tháng {month}/{year}</td></tr>
                  ) : attendanceData.map((emp, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.department_name}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{emp.on_time}</td>
                      <td className="px-4 py-3 text-amber-600 font-medium">{emp.late}</td>
                      <td className="px-4 py-3 text-rose-600 font-medium">{emp.absent}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {emp.total_work_minutes ? `${Math.floor(emp.total_work_minutes / 60)}h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab Phòng ban */}
      {activeTab === "department" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Báo cáo nhân sự theo phòng ban</h3>
            <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Xuất Excel</Button>
          </div>
          {loadingDepartment ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Phòng ban</th>
                    <th className="px-4 py-3">Trưởng phòng</th>
                    <th className="px-4 py-3">Đang làm</th>
                    <th className="px-4 py-3">Đã nghỉ</th>
                    <th className="px-4 py-3">Tổng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departmentData.map((dept, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{dept.department_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{dept.manager_name || "Chưa có"}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{dept.active}</td>
                      <td className="px-4 py-3 text-rose-600 font-medium">{dept.inactive}</td>
                      <td className="px-4 py-3 font-medium">{dept.total_employees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab Nghỉ phép */}
      {activeTab === "leave" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Báo cáo nghỉ phép tháng {month}/{year}</h3>
            <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Xuất Excel</Button>
          </div>
          {loadingLeave ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Nhân viên</th>
                    <th className="px-4 py-3">Phòng ban</th>
                    <th className="px-4 py-3">Đã duyệt (ngày)</th>
                    <th className="px-4 py-3">Chờ duyệt</th>
                    <th className="px-4 py-3">Từ chối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaveData.filter(e => e.total_requests > 0).length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Không có đơn nghỉ phép tháng {month}/{year}</td></tr>
                  ) : leaveData.filter(e => e.total_requests > 0).map((emp, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.department_name}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{emp.approved_days}</td>
                      <td className="px-4 py-3 text-amber-600 font-medium">{emp.pending}</td>
                      <td className="px-4 py-3 text-rose-600 font-medium">{emp.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab Hợp đồng */}
      {activeTab === "contract" && (
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Thống kê hợp đồng</h3>
            {loadingContract ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Đang hiệu lực", status: "Dang hieu luc", color: "bg-emerald-50 text-emerald-700" },
                  { label: "Sắp hết hạn",   status: null,             color: "bg-amber-50 text-amber-700",   value: contractData.expiring.length },
                  { label: "Đã hết hạn",    status: "Da het han",     color: "bg-rose-50 text-rose-700" },
                  { label: "Đã chấm dứt",   status: "Da cham dut",    color: "bg-slate-100 text-slate-600" },
                ].map(item => (
                  <div key={item.label} className={cn("rounded-lg p-4 text-center", item.color)}>
                    <p className="text-3xl font-semibold">{item.value ?? contractCount(item.status!)}</p>
                    <p className="text-sm mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {contractData.expiring.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-4 text-amber-600">⚠ Hợp đồng sắp hết hạn trong 30 ngày</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3">Nhân viên</th>
                      <th className="px-4 py-3">Mã NV</th>
                      <th className="px-4 py-3">Loại HĐ</th>
                      <th className="px-4 py-3">Ngày hết hạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contractData.expiring.map((c, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium">{c.full_name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{c.employee_code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.contract_type}</td>
                        <td className="px-4 py-3 text-amber-600 font-medium">{c.end_date?.substring(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}