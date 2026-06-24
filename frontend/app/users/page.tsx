"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { UserTable } from "@/components/hrm/user-table"

export default function Page() {
  const { user, isLoading, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !hasPermission("/users")) router.replace("/")
  }, [user, isLoading, hasPermission])

  if (isLoading || !user) return null

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Quản lý người dùng</h2>
            <p className="text-sm text-muted-foreground">Quản lý tài khoản và phân quyền trong hệ thống</p>
          </div>
          <UserTable />
        </main>
      </div>
    </div>
  )
}