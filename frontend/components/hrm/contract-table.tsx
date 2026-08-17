"use client"

import { useState, useEffect } from "react"
import { Pencil, Trash2, Search, Plus, X, Loader2, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatDate } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { contractService } from "@/services/contract"
import { employeeService } from "@/services/employee"

type Contract = {
  id: number
  employee_id: number
  full_name: string
  employee_code: string
  contract_type: string
  start_date: string
  end_date: string | null
  salary: number
  status: string
  created_at?: string
}

type Employee = { id: number; full_name: string; employee_code: string; status: string }

const statusStyles: Record<string, string> = {
  "Dang hieu luc": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Sap het han": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Da het han": "bg-rose-50 text-rose-700 ring-rose-600/20",
  "Da cham dut": "bg-slate-100 text-slate-600 ring-slate-500/20",
}

const statusLabel: Record<string, string> = {
  "Dang hieu luc": "Đang hiệu lực",
  "Sap het han": "Sắp hết hạn",
  "Da het han": "Đã hết hạn",
  "Da cham dut": "Đã chấm dứt",
}


// Lấy tên viết tắt của nhân viên
function getInitials(name: string) {
  return name?.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?"
}

// Định dạng tiền lương
function formatSalary(salary: number) {
  return Number(salary || 0).toLocaleString("vi-VN")
}
// HÀM TÍNH TOÁN TRẠNG THÁI HỢP ĐỒNG THEO NGÀY HIỆN TẠI 
function getDisplayStatus(status: string, end_date: string | null) {
  if (status === "Da cham dut") return { key: "Da cham dut", label: "Đã chấm dứt" }
  if (!end_date) return { key: "Dang hieu luc", label: "Đang hiệu lực" }// HĐ không xác định thời hạn
  const today = new Date()

  const endDate = new Date(end_date)
  
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { key: "Da het han", label: "Đã hết hạn" }
  if (diffDays <= 30) return { key: "Sap het han", label: "Sắp hết hạn" }// Sắp hết hạn trong 30 ngày
  return { key: "Dang hieu luc", label: "Đang hiệu lực" }
}

// Bảng danh sách hợp đồng
export function ContractTable() {
  const { user } = useAuth()
  const canEdit = user?.role === "admin" || user?.role === "hr"
  const canTerminate = user?.role === "admin"

  const [contracts, setContracts] = useState<Contract[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [editContract, setEditContract] = useState<Contract | null>(null)
  const [terminateContract, setTerminateContract] = useState<Contract | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const [newContract, setNewContract] = useState({
    employee_id: "", employee_search: "",
    contract_type: "Chinh thuc",
    start_date: "", end_date: "", salary: "",
  })

  // Tải danh sách hợp đồng & danh sách nhân viên
  useEffect(() => {
    fetchContracts()
    employeeService.getAll().then(res => setEmployees(res.data)).catch(() => { })
  }, [])

  // Hàm tải danh sách hợp đồng
  const fetchContracts = async () => {
    try {
      setLoading(true)
      const res = await contractService.getAll()
      setContracts(res.data)
    } catch {
      alert("Không thể tải danh sách hợp đồng")
    } finally {
      setLoading(false)
    }
  }

  // Lọc hợp đồng theo tên/mã nhân viên và trạng thái
  const filtered = contracts.filter(c => {
    const matchSearch =
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.employee_code?.toLowerCase().includes(search.toLowerCase())
    const displayStatus = getDisplayStatus(c.status, c.end_date).key
    const matchStatus = filterStatus ? displayStatus === filterStatus : true
    return matchSearch && matchStatus
  })

  // Phân trang hợp đồng
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  // Hàm gia hạn hợp đồng
  const handleEdit = async () => {
    if (!editContract) return
    try {
      await contractService.renew(editContract.id, { end_date: editContract.end_date })
      setEditContract(null)
      fetchContracts()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi gia hạn hợp đồng")
    }
  }

  // Hàm chấm dứt hợp đồng
  const handleTerminate = async () => {
    if (!terminateContract) return
    try {
      await contractService.terminate(terminateContract.id)
      setTerminateContract(null)
      fetchContracts()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi chấm dứt hợp đồng")
    }
  }

  // Hàm thêm hợp đồng mới
  const handleAdd = async () => {
    if (!newContract.employee_id || !newContract.start_date || !newContract.salary) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc")
      return
    }
    try {
      await contractService.create({
        employee_id: Number(newContract.employee_id),
        contract_type: newContract.contract_type,
        start_date: newContract.start_date,
        end_date: newContract.end_date || null,
        salary: Number(newContract.salary),
      })
      setShowAdd(false)
      setNewContract({ employee_id: "", employee_search: "", contract_type: "Chinh thuc", start_date: "", end_date: "", salary: "" })
      fetchContracts()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi thêm hợp đồng")
    }
  }

  // Xử lý trạng thái tải dữ liệu ban đầu
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Tìm kiếm & Bộ lọc trạng thái */}
      <Card className="overflow-hidden p-0">
        {/* Tiêu đề và nút Thêm mới hợp đồng */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          {/* Tiêu đề và mô tả */}
          <div>
            {/* Tiêu đề */}
            <h2 className="text-base font-semibold">Danh sách hợp đồng</h2>
            {/* Mô tả */}
            <p className="text-sm text-muted-foreground">Quản lý hợp đồng lao động của nhân viên</p>
          </div>
          {/* Thanh tìm kiếm và nút Thêm mới hợp đồng */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Thanh tìm kiếm */}
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="search" placeholder="Tìm kiếm..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 ring-ring/40 md:w-56"
              />
            </div>
            {/* Bộ lọc trạng thái */}
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="Dang hieu luc">Đang hiệu lực</option>
              <option value="Sap het han">Sắp hết hạn</option>
              <option value="Da het han">Đã hết hạn</option>
              <option value="Da cham dut">Đã chấm dứt</option>
            </select>
            {/* Nút thêm hợp đồng mới */}
            {canEdit && (
              <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />Thêm hợp đồng
              </Button>
            )}
          </div>
        </div>
        
        {/* Bảng hiển thị danh sách hợp đồng */}  
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            {/* Tiêu đề bảng */}
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Nhân viên</th>
                <th className="px-5 py-3">Loại HĐ</th>
                <th className="px-5 py-3">Ngày bắt đầu</th>
                <th className="px-5 py-3">Ngày kết thúc</th>
                <th className="px-5 py-3">Lương</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            {/* Bảng thân hiển thị danh sách hợp đồng */}
            <tbody className="divide-y divide-border">
              {paginated.map((contract) => {
                const display = getDisplayStatus(contract.status, contract.end_date)
                return (
                  <tr key={contract.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* Ảnh đại diện nhân viên */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(contract.full_name)}
                        </div>
                        {/* Tên và mã nhân viên */}
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">{contract.full_name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{contract.employee_code}</span>
                        </div>
                      </div>
                    </td>
                    {/* Loại HĐ */}
                    <td className="px-5 py-4 text-muted-foreground">{contract.contract_type}</td>
                    {/* Ngày bắt đầu */}
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(contract.start_date)}</td>
                    {/* Ngày kết thúc */}
                    <td className="px-5 py-4 text-muted-foreground">{contract.end_date ? formatDate(contract.end_date) : "Không xác định"}</td>
                    {/* Lương */}
                    <td className="px-5 py-4 font-medium">{formatSalary(contract.salary)} đ</td>
                    {/* Trạng thái */}
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", statusStyles[display.key] || "bg-slate-100 text-slate-600")}>
                        {display.label}
                      </span>
                    </td>
                    {/* Nút chỉnh sửa và chấm dứt hợp đồng */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <button type="button" onClick={() => setEditContract({ ...contract })} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canTerminate && display.key === "Dang hieu luc" ? (
                          <button type="button" onClick={() => setTerminateContract(contract)}
                            className="rounded-md p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          // Nút gia hạn
                        ) : canEdit && display.key !== "Dang hieu luc" ? (
                          <button type="button" onClick={() => setEditContract({ ...contract })}
                            className="rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                            Gia hạn
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Thanh phân trang */}
        <div className="border-t border-border px-5 py-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Hiển thị <span className="font-medium text-foreground">{paginated.length}</span> / <span className="font-medium text-foreground">{filtered.length}</span> hợp đồng</span>
          {/* Nút phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded px-2 py-1 text-xs border border-input hover:bg-muted disabled:opacity-40">
                ←
              </button>
              {/* Số trang hiện tại / tổng số trang */}
              <span className="px-2 text-xs">{page} / {totalPages}</span>
              {/* Nút trang tiếp theo */}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded px-2 py-1 text-xs border border-input hover:bg-muted disabled:opacity-40">
                →
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal Gia hạn */}
      {editContract && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Nội dung modal gia hạn hợp đồng */}
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              {/* Tiêu đề modal */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Gia hạn hợp đồng</h3>
                <button onClick={() => setEditContract(null)}><X className="h-5 w-5" /></button>
              </div>
              {/* Thông tin nhân viên */}
              <p className="text-sm text-muted-foreground mb-4">
                Nhân viên: <span className="font-medium text-foreground">{editContract.full_name}</span>
              </p>
              {/* Ngày kết thúc mới */}
              <div>
                <label className="text-sm text-muted-foreground">Ngày kết thúc mới *</label>
                <input type="date"
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                  min={new Date().toISOString().split("T")[0]}
                  value={editContract.end_date?.substring(0, 10) || ""}
                  onChange={e => setEditContract({ ...editContract, end_date: e.target.value })}
                />
              </div>
              {/* Nút Hủy và Gia hạn */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditContract(null)}>Hủy</Button>
                <Button className="flex-1" onClick={handleEdit}>Gia hạn</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chấm dứt */}
      {terminateContract && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Nội dung modal chấm dứt hợp đồng */}
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              {/* Tiêu đề modal */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold">Xác nhận chấm dứt</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Bạn có chắc muốn chấm dứt hợp đồng của <span className="font-medium text-foreground">{terminateContract.full_name}</span>?
              </p>

              {/* Nút Hủy và Chấm dứt */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setTerminateContract(null)}>Hủy</Button>
                <Button variant="destructive" className="flex-1" onClick={handleTerminate}>Chấm dứt</Button>
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
              {/* Tiêu đề modal */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thêm hợp đồng mới</h3>
                <button onClick={() => setShowAdd(false)}><X className="h-5 w-5" /></button>
              </div>
              {/* Thông tin hợp đồng */}
              <div className="flex flex-col gap-3">
                <div>

                  <label className="text-sm text-muted-foreground">Nhân viên *</label>
                  <input list="employee-list" type="text" placeholder="Gõ tên hoặc mã NV..."
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newContract.employee_search}
                    onChange={e => {
                      const val = e.target.value
                      setNewContract({ ...newContract, employee_search: val, employee_id: "" })
                      const found = employees.find(emp => `${emp.employee_code} — ${emp.full_name}` === val)
                      if (found) setNewContract(prev => ({ ...prev, employee_search: val, employee_id: String(found.id) }))
                    }}
                  />
                  {/* Danh sách nhân viên */}
                  <datalist id="employee-list">
                    {employees
                      .filter(e => {
                        if (e.status !== "Dang lam") return false
                        const hasActive = contracts.some(c =>
                          c.employee_id === e.id &&
                          (getDisplayStatus(c.status, c.end_date).key === "Dang hieu luc" ||
                            getDisplayStatus(c.status, c.end_date).key === "Sap het han")
                        )
                        return !hasActive
                      })
                      .map(e => <option key={e.id} value={`${e.employee_code} — ${e.full_name}`} />)}
                  </datalist>
                  
                  {newContract.employee_id && <p className="mt-1 text-xs text-emerald-600">✓ Đã chọn nhân viên</p>}
                </div>
                {/* Loại hợp đồng */}
                <div>
                  <label className="text-sm text-muted-foreground">Loại hợp đồng</label>
                  <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newContract.contract_type}
                    onChange={e => setNewContract({ ...newContract, contract_type: e.target.value })}>
                    <option value="Chinh thuc">Chính thức</option>
                    <option value="Thu viec">Thử việc</option>
                    <option value="Xac dinh thoi han">Xác định thời hạn</option>
                    <option value="Khong xac dinh thoi han">Không xác định thời hạn</option>
                  </select>
                </div>

                {/* Ngày bắt đầu */}
                <div>
                  <label className="text-sm text-muted-foreground">Ngày bắt đầu *</label>
                  <input type="date" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newContract.start_date}
                    onChange={e => setNewContract({ ...newContract, start_date: e.target.value })} />
                </div>
                {/* Ngày kết thúc */}
                <div>
                  <label className="text-sm text-muted-foreground">Ngày kết thúc</label>
                  <input type="date" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newContract.end_date}
                    onChange={e => setNewContract({ ...newContract, end_date: e.target.value })} />
                </div>
                {/* Lương */}
                <div>
                  <label className="text-sm text-muted-foreground">Lương (VNĐ) *</label>
                  <input type="number" placeholder="VD: 15000000"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newContract.salary}
                    onChange={e => setNewContract({ ...newContract, salary: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Hủy</Button>
                <Button className="flex-1" onClick={handleAdd}>Thêm</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}