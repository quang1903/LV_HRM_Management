"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { CalendarDays, FileText, UserPlus, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { employeeService } from "@/services/employee"
import { leaveService } from "@/services/leave"
import { contractService } from "@/services/contract"
import { attendanceService } from "@/services/attendance"

export function ActivityPanel() {
  const { user, isLoading } = useAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [expiring, setExpiring]     = useState<any[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (isLoading || !user) return
    fetchData()
  }, [user, isLoading])

  const fetchData = async () => {
    try {
      setLoading(true)
      const today = new Date()
      const month = today.getMonth() + 1
      const year  = today.getFullYear()

      const [leaveRes, contractRes, attRes] = await Promise.all([
        leaveService.getAll().catch(() => ({ data: [] })),
        user?.role !== "employee"
          ? contractService.getExpiring().catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        attendanceService.getAll({ month, year }).catch(() => ({ data: [] })),
      ])

      const acts: any[] = []

      // Đơn nghỉ phép chờ duyệt
      const pending = leaveRes.data.filter((l: any) => l.status === "Cho duyet").slice(0, 2)
      pending.forEach((l: any) => {
        acts.push({
          icon: CalendarDays,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-700",
          title: "Yêu cầu nghỉ phép",
          description: `${l.full_name} xin nghỉ từ ${l.start_date?.substring(0, 10)} đến ${l.end_date?.substring(0, 10)}`,
          time: l.created_at ? new Date(l.created_at).toLocaleDateString("vi-VN") : "",
          href: "/leave",
        })
      })

      // Hợp đồng sắp hết hạn
      contractRes.data.slice(0, 1).forEach((c: any) => {
        acts.push({
          icon: FileText,
          iconBg: "bg-rose-100",
          iconColor: "text-rose-700",
          title: "Hợp đồng sắp hết hạn",
          description: `Hợp đồng của ${c.full_name} hết hạn ${c.end_date?.substring(0, 10)}`,
          time: `Hết hạn: ${c.end_date?.substring(0, 10)}`,
          href: "/contracts",
        })
      })

      // Chấm công hôm nay
      const todayStr = today.toISOString().split("T")[0]
      const todayAtt = attRes.data.filter((a: any) =>
        a.work_date?.substring(0, 10) === todayStr && a.check_in
      )
      acts.push({
        icon: Clock,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-700",
        title: "Chấm công hôm nay",
        description: `${todayAtt.length}/6 nhân viên đã chấm công hôm nay`,
        time: "Hôm nay",
        href: "/attendance",
      })

      setActivities(acts)
      setExpiring(contractRes.data.slice(0, 3))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3 flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
        <Card className="p-5 lg:col-span-2 flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="p-5 lg:col-span-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Hoạt động gần đây</h2>
            <p className="text-sm text-muted-foreground">Các thay đổi mới nhất trong hệ thống</p>
          </div>
          <Link href="/leave" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
        </div>
        <ul className="mt-4 flex flex-col gap-1">
          {activities.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">Không có hoạt động nào</li>
          ) : activities.map((activity, i) => {
            const Icon = activity.icon
            return (
              <li key={i}>
                <Link href={activity.href} className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-muted/50">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", activity.iconBg)}>
                    <Icon className={cn("h-4 w-4", activity.iconColor)} />
                  </div>
                  <div className="flex flex-1 flex-col leading-tight">
                    <span className="text-sm font-medium">{activity.title}</span>
                    <span className="text-sm text-muted-foreground">{activity.description}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">HĐ sắp hết hạn</h2>
            <p className="text-sm text-muted-foreground">Trong 30 ngày tới</p>
          </div>
          <Link href="/contracts" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {expiring.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">Không có hợp đồng sắp hết hạn</li>
          ) : expiring.map((c, i) => (
            <li key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-rose-50 text-rose-600">
                <span className="text-lg font-bold leading-none">{new Date(c.end_date).getDate()}</span>
                <span className="text-xs">ngày</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">{c.full_name}</span>
                <span className="text-xs text-muted-foreground">Hết hạn: {c.end_date?.substring(0, 10)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}