// Shared formatting helpers for the milkbucket dashboard.

export function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN')
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatUptime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const parts: string[] = []
  if (days > 0) parts.push(`${days} ngày`)
  if (hours > 0) parts.push(`${hours} giờ`)
  if (minutes > 0) parts.push(`${minutes} phút`)
  if (days === 0 && hours === 0) parts.push(`${seconds} giây`)
  return parts.join(' ')
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return `${diff} giây trước`
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const CATEGORY_LABELS: Record<string, string> = {
  admin: 'Quản trị',
  automod: 'AutoMod',
  channels: 'Kênh',
  roles: 'Role',
  info: 'Thông tin',
  utility: 'Tiện ích',
  fun: 'Giải trí',
  system: 'Hệ thống',
}

export const FEATURE_LABELS: Record<string, string> = {
  antilink: 'Chặn Link',
  antiinvite: 'Chặn Invite',
  antispam: 'Chống Spam',
  antidup: 'Chống Trùng',
  anticaps: 'Chống Caps',
  antimention: 'Giới hạn Mention',
}

export const ACTION_LABELS: Record<string, string> = {
  delete: 'Xoá tin',
  warn: 'Cảnh báo',
  timeout: 'Timeout',
  mute: 'Mute',
  kick: 'Kick',
  ban: 'Ban',
}

export const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  warning: { label: 'Cảnh báo', color: 'bg-amber-500' },
  mute: { label: 'Mute', color: 'bg-orange-500' },
  ban: { label: 'Ban', color: 'bg-rose-500' },
  softban: { label: 'Softban', color: 'bg-rose-400' },
  hackban: { label: 'Hackban', color: 'bg-rose-600' },
  automod: { label: 'AutoMod', color: 'bg-emerald-500' },
  command: { label: 'Lệnh', color: 'bg-sky-500' },
}
