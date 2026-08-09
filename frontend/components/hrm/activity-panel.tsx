"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { CalendarDays, FileText, Clock, Loader2 } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

interface Props {
  data: { employees: any[]; attendance: any[]; leaves: any[]; contracts: any[] } | null
}

//Đơn xin nghỉ phép mới chờ duyệt
export function ActivityPanel({ data }: Props) {
  const { user } = useAuth()
  const loading = !data

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

  // Tạo danh sách hoạt động
  const today = new Date().toISOString().split("T")[0]
  const acts: any[] = []

  // Đơn nghỉ phép chờ duyệt
  const pending = (data?.leaves || []).filter((l: any) => l.status === "Cho duyet").slice(0, 2)
  pending.forEach((l: any) => {
    acts.push({
      icon: CalendarDays,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      title: "Yêu cầu nghỉ phép",
      description: `${l.full_name} xin nghỉ từ ${formatDate(l.start_date)} đến ${formatDate(l.end_date)}`,
      time: l.created_at ? new Date(l.created_at).toLocaleDateString("vi-VN") : "",
      href: "/leave",
    })
  })

  // Hợp đồng sắp hết hạn
  if (user?.role !== "employee") {
    (data?.contracts || []).slice(0, 1).forEach((c: any) => {
      acts.push({
        icon: FileText,
        iconBg: "bg-rose-100",
        iconColor: "text-rose-700",
        title: "Hợp đồng sắp hết hạn",
        description: `Hợp đồng của ${c.full_name} hết hạn ${formatDate(c.end_date)}`,
        time: `Hết hạn: ${formatDate(c.end_date)}`,
        href: "/contracts",
      })
    })
  }

  //Số nhân viên đã chấm công hôm nay
  const todayAtt = (data?.attendance || []).filter((a: any) => a.work_date?.substring(0, 10) === today && a.check_in)
  acts.push({
    icon: Clock,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    title: "Chấm công hôm nay",
    description: `${todayAtt.length} nhân viên đã chấm công hôm nay`,
    time: "Hôm nay",
    href: "/attendance",
  })

  //danh sách hợp đồng sắp hết hạn 
  const expiring = (data?.contracts || []).slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* THẺ TRÁI: Danh sách hoạt động */}
      <Card className="p-5 lg:col-span-3">
        {/* Header card với tiêu đề và nút "Xem tất cả" */}
        <div className="flex items-center justify-between">
          <div>
            {/* Tiêu đề và mô tả */}
            <h2 className="text-base font-semibold">Hoạt động gần đây</h2>
            <p className="text-sm text-muted-foreground">Các thay đổi mới nhất trong hệ thống</p>
          </div>
          {/* Nút xem tất cả */}
          <Link href="/leave" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
        </div>
        {/* Danh sách hoạt động */}
        <ul className="mt-4 flex flex-col gap-1">
          {acts.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">Không có hoạt động nào</li>
          ) : acts.map((activity, i) => {
            const Icon = activity.icon
            return (
              <li key={i}>
                <Link href={activity.href} className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-muted/50">
                {/* Icon của hoạt động */}
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", activity.iconBg)}>
                    <Icon className={cn("h-4 w-4", activity.iconColor)} />
                  </div>
                  {/* Icon và nhãn trạng thái */}
                  <div className="flex flex-1 flex-col leading-tight">
                    <span className="text-sm font-medium">{activity.title}</span>
                    <span className="text-sm text-muted-foreground">{activity.description}</span>
                  </div>
                  {/* Thời gian hoạt động */}
                  <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* THẺ PHẢI: Danh sách hợp đồng sắp hết hạn */}
      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            {/* Tiêu đề và mô tả */}
            <h2 className="text-base font-semibold">HĐ sắp hết hạn</h2>
            <p className="text-sm text-muted-foreground">Trong 30 ngày tới</p>
          </div>
          {/* Nút xem tất cả */}
          <Link href="/contracts" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
        </div>
        {/* Danh sách hợp đồng sắp hết hạn */}
        <ul className="mt-4 flex flex-col gap-3">
          {/* Nếu không có hợp đồng sắp hết hạn */}
          {expiring.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">Không có hợp đồng sắp hết hạn</li>
          ) : expiring.map((c, i) => (
            <li key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
              {/* Icon và nhãn trạng thái */}
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-rose-50 text-rose-600">
                <span className="text-lg font-bold leading-none">{new Date(c.end_date).getDate()}</span>
                <span className="text-xs">ngày</span>
              </div>
              {/* Tên và thông tin hợp đồng */}
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">{c.full_name}</span>
                <span className="text-xs text-muted-foreground">Hết hạn: {formatDate(c.end_date)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}