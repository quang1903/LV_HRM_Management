"use client"

import { useState, useEffect, useRef } from "react"
import { Eye, Pencil, Trash2, Search, Download, X, Plus, Loader2, AlertTriangle, Upload, FileSpreadsheet, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import * as XLSX from "xlsx"
import { exportToExcel } from "@/lib/exportExcel"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { employeeService } from "@/services/employee"
import { departmentService } from "@/services/department"
import { positionService } from "@/services/position"


type Employee = {
  id: number
  employee_code: string
  full_name: string
  email: string
  phone: string | null
  department_id: number | null
  department_name: string | null
  position_id: number | null
  position_name: string | null
  hire_date: string
  status: string
  birth_date: string | null
  gender: string | null
  address: string | null
  id_card: string | null
}

type Department = { id: number; name: string }

const statusStyles: Record<string, string> = {
  "Dang lam": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Nghi viec": "bg-slate-100 text-slate-600 ring-slate-500/20",
  "Tam nghi": "bg-amber-50 text-amber-700 ring-amber-600/20",
}

const statusLabel: Record<string, string> = {
  "Dang lam": "Đang làm",
  "Nghi viec": "Đã nghỉ",
  "Tam nghi": "Tạm nghỉ",
}

function getInitials(name: string) {
  return name?.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?"
}

const MONTHS_VI = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]
const DAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

function CalendarPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const today = new Date()
  const parsed = value ? new Date(value) : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || today.getFullYear() - 25)
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() || 0)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"day" | "month" | "year">("day")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectedDate = value ? new Date(value + "T00:00:00") : null
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_: any, i) => i + 1)
  ]

  const displayValue = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}`
    : ""

  const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_: any, i) => new Date().getFullYear() - i)

  return (
    <div className="relative mt-1" ref={ref}>
      <div
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm flex items-center justify-between cursor-pointer hover:border-primary transition-colors focus-within:ring-2 ring-ring/40"
        onClick={() => setOpen(!open)}
      >
        <span className={displayValue ? "text-foreground" : "text-muted-foreground"}>
          {displayValue || "Chọn ngày sinh"}
        </span>
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 bottom-full mb-1 w-72 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <button type="button" onClick={() => {
              if (mode === "day") { const d = new Date(viewYear, viewMonth - 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()) }
              else if (mode === "year") setViewYear(v => v - 12)
            }} className="p-1 rounded hover:bg-white/20 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode(mode === "month" ? "day" : "month")}
                className="text-sm font-semibold hover:bg-white/20 px-2 py-1 rounded transition-colors">
                {MONTHS_VI[viewMonth]}
              </button>
              <button type="button" onClick={() => setMode(mode === "year" ? "day" : "year")}
                className="text-sm font-semibold hover:bg-white/20 px-2 py-1 rounded transition-colors">
                {viewYear}
              </button>
            </div>
            <button type="button" onClick={() => {
              if (mode === "day") { const d = new Date(viewYear, viewMonth + 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()) }
              else if (mode === "year") setViewYear(v => v + 12)
            }} className="p-1 rounded hover:bg-white/20 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mode: chọn tháng */}
          {mode === "month" && (
            <div className="grid grid-cols-3 gap-2 p-3">
              {MONTHS_VI.map((m, i) => (
                <button key={i} type="button"
                  onClick={() => { setViewMonth(i); setMode("day") }}
                  className={cn("py-2 rounded-lg text-xs font-medium transition-colors",
                    viewMonth === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}>
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Mode: chọn năm */}
          {mode === "year" && (
            <div className="grid grid-cols-3 gap-2 p-3 max-h-48 overflow-y-auto">
              {years.map(y => (
                <button key={y} type="button"
                  onClick={() => { setViewYear(y); setMode("day") }}
                  className={cn("py-2 rounded-lg text-xs font-medium transition-colors",
                    viewYear === y ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Mode: chọn ngày */}
          {mode === "day" && (
            <div className="p-3">
              <div className="grid grid-cols-7 mb-1">
                {DAYS_VI.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day: any, i) => {
                  if (!day) return <div key={i} />
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const isSelected = value === dateStr
                  const isToday = day !== null && today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear
                  return (
                    <button key={i} type="button"
                      onClick={() => { onChange(dateStr); setOpen(false) }}
                      className={cn(
                        "h-8 w-full rounded-lg text-xs font-medium transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" :
                          isToday ? "border border-primary text-primary" :
                            "hover:bg-muted text-foreground"
                      )}>
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          {value && (
            <div className="border-t border-border px-3 py-2 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{displayValue}</span>
              <button type="button" onClick={() => { onChange(""); setOpen(false) }}
                className="text-xs text-rose-500 hover:text-rose-700">Xóa</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EmployeeTable() {
  const { user } = useAuth()
  const canEdit = user?.role === "admin" || user?.role === "hr"

  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null)
  const [permanentDeleteEmployee, setPermanentDeleteEmployee] = useState<Employee | null>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [editPositions, setEditPositions] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    employee_code: "", full_name: "", email: "", phone: "",
    department_id: "", position_id: "", hire_date: "", gender: "Nam", birth_date: "", address: "",
    id_card: ""
  })
  const [importing, setImporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [importResult, setImportResult] = useState<{ successCount: number; totalRows: number; errors: string[] } | null>(null)

  useEffect(() => {
    fetchEmployees()
    departmentService.getAll().then(res => setDepartments(res.data)).catch(() => { })
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await employeeService.getAll()
      setEmployees(res.data)
    } catch {
      alert("Không thể tải danh sách nhân viên")
    } finally {
      setLoading(false)
    }
  }


  const filtered = employees.filter(e => {
    const matchSearch =
      e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_code?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = showInactive ? e.status === "Nghi viec" : e.status !== "Nghi viec"
    return matchSearch && matchStatus
  })

  // Khi chọn phòng ban trong modal Thêm
  const handleDeptChange = async (deptId: string) => {
    setNewEmployee({ ...newEmployee, department_id: deptId, position_id: "" })
    if (deptId) {
      try {
        const res = await positionService.getByDepartment(Number(deptId))
        setPositions(res.data)
      } catch { setPositions([]) }
    } else {
      setPositions([])
    }
  }

  const handleEdit = async () => {
    if (!editEmployee) return
    try {
      await employeeService.update(editEmployee.id, {
        full_name: editEmployee.full_name,
        email: editEmployee.email,
        phone: editEmployee.phone,
        department_id: editEmployee.department_id,
        position_id: editEmployee.position_id,
        hire_date: editEmployee.hire_date,
        gender: editEmployee.gender,
        birth_date: editEmployee.birth_date,
        address: editEmployee.address,
      })
      setEditEmployee(null)
      fetchEmployees()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật nhân viên")
    }
  }
  const handleActivate = async (id: number) => {
    try {
      await employeeService.activate(id)
      fetchEmployees()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi kích hoạt nhân viên")
    }
  }

  const handleDelete = async () => {
    if (!deleteEmployee) return
    try {
      await employeeService.deactivate(deleteEmployee.id)
      setDeleteEmployee(null)
      fetchEmployees()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi vô hiệu hóa nhân viên")
    }
  }

  const handlePermanentDelete = async () => {
    if (!permanentDeleteEmployee) return
    try {
      await employeeService.permanentDelete(permanentDeleteEmployee.id)
      setPermanentDeleteEmployee(null)
      fetchEmployees()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa nhân viên")
    }
  }

  const handleAdd = async () => {
    if (!newEmployee.full_name || !newEmployee.email || !newEmployee.hire_date) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmployee.email)) {
      alert("Email không đúng định dạng (ví dụ: ten@company.com)")
      return
    }
    if (!newEmployee.department_id) {
      const confirmed = window.confirm(
        "⚠️ Nhân viên này chưa được gán phòng ban.\n\nHậu quả:\n• Nhân viên sẽ không xuất hiện trong danh sách của bất kỳ Quản lý nào\n• Dữ liệu chấm công vẫn được lưu nhưng chỉ Admin/HR mới thấy\n\nBạn vẫn muốn tiếp tục?"
      )
      if (!confirmed) return
    }
    const maxCode = employees.reduce((max, e) => {
      const num = parseInt(e.employee_code?.replace("EMP", "") || "0")
      return num > max ? num : max
    }, 0)
    const employee_code = `EMP${String(maxCode + 1).padStart(3, "0")}`
    try {
      await employeeService.create({
        ...newEmployee,
        employee_code,
        department_id: newEmployee.department_id ? Number(newEmployee.department_id) : null,
        position_id: newEmployee.position_id ? Number(newEmployee.position_id) : null,
      })
      setShowAdd(false)
      setNewEmployee({ employee_code: "", full_name: "", email: "", phone: "", department_id: "", position_id: "", hire_date: "", gender: "Nam", birth_date: "", address: "", id_card: "" })
      setPositions([])
      fetchEmployees()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi thêm nhân viên")
    }
  }

  const handleExportFile = (data: Employee[]) => {
    if (data.length === 0) {
      alert("Không có dữ liệu để xuất")
      return
    }
    exportToExcel(
      data,
      [
        { key: "employee_code", label: "Mã NV" },
        { key: "full_name", label: "Họ tên" },
        { key: "email", label: "Email" },
        { key: "phone", label: "SĐT" },
        { key: "department_name", label: "Phòng ban" },
        { key: "position_name", label: "Chức vụ" },
        { key: "hire_date", label: "Ngày vào làm" },
        { key: "status", label: "Trạng thái" },
      ],
      `Danh_sach_nhan_vien_${new Date().toISOString().split("T")[0]}`
    )
  }

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "Họ và tên": "Nguyen Van Mau",
        "Email": "mau.nguyen@hrm.com",
        "Ngày vào làm": "2026-01-15",
        "Phòng ban": departments[0]?.name || "Ky thuat",
        "Chức vụ": "",
        "Số điện thoại": "0901234567",
        "Ngày sinh": "1998-05-20",
        "Giới tính": "Nam",
        "CCCD": "",
        "Địa chỉ": "",
        "Vai trò": "employee",
      },
    ]
    const ws = XLSX.utils.json_to_sheet(sampleData)
    ws["!cols"] = [
      { wch: 20 }, { wch: 25 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
      { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 25 }, { wch: 12 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Mau_NhanVien")
    XLSX.writeFile(wb, "Mau_Import_Nhan_Vien.xlsx")
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      setImportResult(null)

      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: "array" })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      if (jsonData.length === 0) {
        alert("File Excel không có dữ liệu")
        return
      }

      const res = await employeeService.importEmployees(jsonData)
      setImportResult(res.data)
      fetchEmployees()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi đọc hoặc nhập file Excel")
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold">Danh sách nhân viên</h2>
            <p className="text-sm text-muted-foreground">Quản lý thông tin và trạng thái của tất cả nhân viên</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring/40 focus:ring-2 md:w-56"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowInactive(!showInactive)}>
              {showInactive ? "Xem đang làm" : "Xem đã nghỉ"}
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowExportMenu(!showExportMenu)}>
                <Download className="h-4 w-4" />Xuất file
              </Button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-background shadow-lg py-1">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => { handleExportFile(filtered); setShowExportMenu(false) }}
                    >
                      Xuất đang hiển thị
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => { handleExportFile(employees); setShowExportMenu(false) }}
                    >
                      Xuất tất cả
                    </button>
                  </div>
                </>
              )}
            </div>
            {canEdit && (
              <>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
                  <FileSpreadsheet className="h-4 w-4" />Tải file mẫu
                </Button>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted">
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Nhập từ Excel
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileImport} disabled={importing} />
                </label>
                <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4" />Thêm mới
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Mã NV</th>
                <th className="px-5 py-3">Họ tên</th>
                <th className="px-5 py-3">Phòng ban</th>
                <th className="px-5 py-3">Chức vụ</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">{canEdit ? "Hành động" : ""}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((employee) => (
                <tr key={employee.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-4 font-mono text-xs font-medium text-muted-foreground">{employee.employee_code}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(employee.full_name)}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{employee.full_name}</span>
                        {(user?.role === "admin" || user?.role === "hr") && (
                          <span className="text-xs text-muted-foreground">{employee.email}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {employee.department_name ? employee.department_name : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <AlertTriangle className="h-3 w-3" />
                        Chưa có phòng ban
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{employee.position_name || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", statusStyles[employee.status] || "bg-slate-100 text-slate-600")}>
                      {statusLabel[employee.status] || employee.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setViewEmployee(employee)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </button>
                      {canEdit && (
                        <>
                          {employee.status === "Dang lam" && (
                            <button type="button" onClick={async () => {
                              setEditEmployee({ ...employee })
                              if (employee.department_id) {
                                const res = await positionService.getByDepartment(employee.department_id).catch(() => ({ data: [] }))
                                setEditPositions(res.data)
                              } else {
                                setEditPositions([])
                              }
                            }} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {employee.status === "Dang lam" && (
                            <button type="button" onClick={() => setDeleteEmployee(employee)} className="rounded-md p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {employee.status === "Nghi viec" && canEdit && (
                            <button type="button" onClick={() => handleActivate(employee.id)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                              title="Kích hoạt lại">
                              Kích hoạt
                            </button>
                          )}
                          {employee.status === "Nghi viec" && user?.role === "admin" && (
                            <button type="button" onClick={() => setPermanentDeleteEmployee(employee)}
                              className="rounded-md p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                              title="Xóa chính thức">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
          Hiển thị <span className="font-medium text-foreground">{filtered.length}</span> trong tổng số <span className="font-medium text-foreground">{employees.length}</span> nhân viên
        </div>
      </Card>

      {/* Modal Xem */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thông tin nhân viên</h3>
                <button onClick={() => setViewEmployee(null)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary mx-auto">
                  {getInitials(viewEmployee.full_name)}
                </div>
                <p className="text-center font-semibold text-lg">{viewEmployee.full_name}</p>
                {[
                  { label: "Mã NV", value: viewEmployee.employee_code },
                  { label: "Email", value: viewEmployee.email },
                  { label: "SĐT", value: viewEmployee.phone || "—" },
                  { label: "Phòng ban", value: viewEmployee.department_name || "—" },
                  { label: "Chức vụ", value: viewEmployee.position_name || "—" },
                  { label: "Ngày vào", value: viewEmployee.hire_date?.substring(0, 10) },
                  { label: "Ngày sinh", value: viewEmployee.birth_date?.substring(0, 10) || "—" },
                  { label: "Giới tính", value: viewEmployee.gender === "Nam" ? "Nam" : viewEmployee.gender === "Nu" ? "Nữ" : viewEmployee.gender || "—" },
                  ...(user?.role === "admin" || user?.role === "hr" ? [
                    { label: "CCCD", value: viewEmployee.id_card || "—" },
                    { label: "Địa chỉ", value: viewEmployee.address || "—" },
                  ] : []),
                  { label: "Trạng thái", value: statusLabel[viewEmployee.status] || viewEmployee.status },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground text-sm">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" onClick={() => setViewEmployee(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa */}
      {editEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Chỉnh sửa nhân viên</h3>
                <button onClick={() => setEditEmployee(null)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Họ tên *", field: "full_name" },
                  { label: "SĐT", field: "phone" },
                  { label: "Địa chỉ", field: "address" },
                ].map(item => (
                  <div key={item.field}>
                    <label className="text-sm text-muted-foreground">{item.label}</label>
                    <input
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                      value={(editEmployee as any)[item.field] || ""}
                      onChange={e => setEditEmployee({ ...editEmployee, [item.field]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-sm text-muted-foreground">Email *</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={editEmployee?.email || ""}
                    onChange={e => setEditEmployee({ ...editEmployee!, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phòng ban</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={editEmployee.department_id || ""}
                    onChange={async e => {
                      const deptId = Number(e.target.value)
                      setEditEmployee({ ...editEmployee, department_id: deptId, position_id: 0 })
                      if (deptId) {
                        const res = await positionService.getByDepartment(deptId).catch(() => ({ data: [] }))
                        setEditPositions(res.data)
                      } else {
                        setEditPositions([])
                      }
                    }}
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Chức vụ</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={editEmployee.position_id || ""}
                    onChange={e => setEditEmployee({ ...editEmployee, position_id: Number(e.target.value) })}
                    disabled={!editEmployee.department_id}
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {editPositions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Giới tính</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={editEmployee.gender || "Nam"}
                    onChange={e => setEditEmployee({ ...editEmployee, gender: e.target.value })}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nu">Nữ</option>
                    <option value="Khac">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Ngày sinh</label>
                  <CalendarPicker
                    value={editEmployee.birth_date?.substring(0, 10) || ""}
                    onChange={val => setEditEmployee({ ...editEmployee, birth_date: val })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">CCCD</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={editEmployee.id_card || ""}
                    onChange={e => setEditEmployee({ ...editEmployee, id_card: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditEmployee(null)}>Hủy</Button>
                <Button className="flex-1" onClick={handleEdit}>Lưu</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {deleteEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold">Xác nhận vô hiệu hóa</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Bạn có chắc muốn vô hiệu hóa nhân viên <span className="font-medium text-foreground">{deleteEmployee.full_name}</span>?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteEmployee(null)}>Hủy</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete}>Vô hiệu hóa</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thêm nhân viên mới</h3>
                <button onClick={() => setShowAdd(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Họ tên *", field: "full_name" },
                  { label: "SĐT", field: "phone" },
                ].map(item => (
                  <div key={item.field}>
                    <label className="text-sm text-muted-foreground">{item.label}</label>
                    <input
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                      value={(newEmployee as any)[item.field]}
                      onChange={e => setNewEmployee({ ...newEmployee, [item.field]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-sm text-muted-foreground">Email *</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newEmployee.email}
                    onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Ngày vào làm *</label>
                  <input
                    type="date"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newEmployee.hire_date}
                    onChange={e => setNewEmployee({ ...newEmployee, hire_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phòng ban</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newEmployee.department_id}
                    onChange={e => handleDeptChange(e.target.value)}
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Chức vụ</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newEmployee.position_id}
                    onChange={e => setNewEmployee({ ...newEmployee, position_id: e.target.value })}
                    disabled={!newEmployee.department_id}
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Giới tính</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newEmployee.gender}
                    onChange={e => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nu">Nữ</option>
                    <option value="Khac">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Ngày sinh</label>
                  <CalendarPicker
                    value={newEmployee.birth_date}
                    onChange={val => setNewEmployee({ ...newEmployee, birth_date: val })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">CCCD</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    placeholder="Số CCCD..."
                    value={newEmployee.id_card || ""}
                    onChange={e => setNewEmployee({ ...newEmployee, id_card: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-muted-foreground">Địa chỉ</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    placeholder="Địa chỉ..."
                    value={newEmployee.address}
                    onChange={e => setNewEmployee({ ...newEmployee, address: e.target.value })}
                  />
                </div>
              </div>
              {!newEmployee.department_id && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Chưa chọn phòng ban — nhân viên này sẽ không xuất hiện trong danh sách của bất kỳ Quản lý nào</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Hủy</Button>
                <Button className="flex-1" onClick={handleAdd}>Thêm</Button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Modal Xóa chính thức */}
      {permanentDeleteEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold">Xóa chính thức</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Bạn có chắc muốn xóa vĩnh viễn nhân viên <span className="font-medium text-foreground">{permanentDeleteEmployee.full_name}</span>? Hành động này không thể hoàn tác!
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPermanentDeleteEmployee(null)}>Hủy</Button>
                <Button variant="destructive" className="flex-1" onClick={handlePermanentDelete}>Xóa vĩnh viễn</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {importResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Kết quả nhập Excel</h3>
                <button onClick={() => setImportResult(null)}><X className="h-5 w-5" /></button>
              </div>
              <div className="rounded-md bg-emerald-50 p-3 mb-3">
                <p className="text-sm font-medium text-emerald-700">
                  Nhập thành công {importResult.successCount}/{importResult.totalRows} dòng
                </p>
              </div>
              {importResult.errors.length > 0 && (
                <div className="rounded-md bg-rose-50 p-3 max-h-60 overflow-y-auto">
                  <p className="text-sm font-medium text-rose-700 mb-2">{importResult.errors.length} dòng bị lỗi:</p>
                  <ul className="text-sm text-rose-600 flex flex-col gap-1">
                    {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
                  </ul>
                </div>
              )}
              <Button className="w-full mt-4" onClick={() => setImportResult(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}