import * as XLSX from "xlsx"

export function exportToExcel(data: any[], columns: { key: string; label: string }[], filename: string) {
  const rows = data.map(row => {
    const obj: Record<string, any> = {}
    columns.forEach(col => { obj[col.label] = row[col.key] ?? "" })
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
