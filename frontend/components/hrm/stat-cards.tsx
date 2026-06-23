"use client"

import { useEffect, useState } from "react"
import { Users, UserCheck, CalendarDays, FileWarning, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { employeeService } from "@/services/employee"
import { attendanceService } from "@/services/attendance"
import { leaveService } from "@/services/leave"
import { contractService } from "@/services/contract"

export function StatCards() {
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [todayAttendance, setTodayAttendance] = useState(0)
  const [pendingLeaves, setPendingLeaves] = useState(0)
  const [expiringContracts, setExpiringContracts] = useState(0)

  useEffect(() => {
    if (isLoading || !user) return
    fetchStats()
  }, [user, isLoading])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const today = new Date()
      const month = today.getMonth() + 1
      const year = today.getFullYear()
      const todayStr = today.toISOString().split("T")[0]

      const [empRes, attRes, leaveRes, contractRes] = await Promise.all([
        employeeService.getAll().catch(() => ({ data: [] })),
        attendanceService.getAll({ month, year }).catch(() => ({ data: [] })),
        leaveService.getAll().catch(() => ({ data: [] })),
        user?.role !== "employee"
          ? contractService.getExpiring().catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ])

      const activeEmployees = empRes.data.filter((e: any) => e.status === "Dang lam")
      setTotalEmployees(activeEmployees.length)

      const todayRecords = attRes.data.filter((a: any) =>
        a.work_date?.substring(0, 10) === todayStr && a.check_in
      )
      setTodayAttendance(todayRecords.length)

      const pending = leaveRes.data.filter((l: any) => l.status === "Cho duyet")
      setPendingLeaves(pending.length)

      setExpiringContracts(contractRes.data.length)
    } catch (err) {
      console.error("Lỗi tải stat cards:", err)
    } finally {
      setLoading(false)
    }
  }

  const attendanceRate = totalEmployees > 0
    ? Math.round((todayAttendance / totalEmployees) * 100)
    : 0

  const stats = [
    {
      label: "Tổng nhân viên",
      value: loading ? "..." : totalEmployees,
      hint: "Nhân viên đang làm việc",
      trend: { value: "active", direction: "up" as const },
      icon: Users,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Đi làm hôm nay",
      value: loading ? "..." : todayAttendance,
      hint: `Tỷ lệ chấm công ${attendanceRate}%`,
      trend: { value: `${attendanceRate}%`, direction: "up" as const },
      icon: UserCheck,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
    {
      label: "Đơn chờ duyệt",
      value: loading ? "..." : pendingLeaves,
      hint: "Nghỉ phép chờ phê duyệt",
      trend: { value: pendingLeaves > 0 ? `${pendingLeaves} đơn` : "0 đơn", direction: pendingLeaves > 0 ? "up" as const : "down" as const },
      icon: CalendarDays,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
    },
    {
      label: "HĐ sắp hết hạn",
      value: loading ? "..." : expiringContracts,
      hint: "Trong 30 ngày tới",
      trend: { value: expiringContracts > 0 ? `${expiringContracts} HĐ` : "Không có", direction: expiringContracts > 0 ? "up" as const : "down" as const },
      icon: FileWarning,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-5 flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend.direction === "up" ? ArrowUpRight : ArrowDownRight
        return (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", stat.iconBg)}>
                <Icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                stat.trend.direction === "up" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
              )}>
                <TrendIcon className="h-3 w-3" />
                {stat.trend.value}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}