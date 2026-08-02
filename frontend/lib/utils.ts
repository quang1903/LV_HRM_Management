import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Định dạng ngày từ YYYY-MM-DD (hoặc ISO) sang DD/MM/YYYY chuẩn Việt Nam
 * Ví dụ: "2026-08-02" -> "02/08/2026"
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—"
  const cleanDateStr = dateStr.substring(0, 10)
  const [y, m, d] = cleanDateStr.split("-")
  if (!y || !m || !d || y.length !== 4) return dateStr
  return `${d}/${m}/${y}`
}

