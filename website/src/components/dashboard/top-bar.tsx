'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import {
  Menu, Bell, Search, LogOut, ChevronDown, Sun, Moon,
  Command, X, AlertTriangle, Clock, ShieldBan, Bot, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { formatUptime, timeAgo } from '@/lib/format'
import { DiscordIcon } from '@/components/icons/discord'

interface TopBarProps {
  botStatus: {
    online: boolean
    ping: number
    wsPing: number
    uptimeMs: number
    memoryMb: number
    version: string
  } | null
  onMenuClick: () => void
  user: {
    name?: string | null
    username?: string | null
    image?: string | null
    email?: string | null
    provider?: string | null
  } | null
  onSignOut: () => void
}

const ACTIVITY_LABELS: Record<string, { title: string; color: string }> = {
  warning: { title: 'Cảnh báo mới', color: 'bg-amber-500' },
  mute: { title: 'Mute mới', color: 'bg-orange-500' },
  ban: { title: 'Ban mới', color: 'bg-rose-500' },
  softban: { title: 'Softban mới', color: 'bg-rose-500' },
  hackban: { title: 'Hackban mới', color: 'bg-purple-500' },
  automod: { title: 'AutoMod trigger', color: 'bg-emerald-500' },
  command: { title: 'Lệnh mới', color: 'bg-sky-500' },
}

export function TopBar({ botStatus, onMenuClick, user, onSignOut }: TopBarProps) {
  const [activity, setActivity] = useState<{ id: string; type: string; description: string; user: string; createdAt: string }[]>([])
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/activity')
      .then(res => res.json())
      .then(data => setActivity(data.activity || []))
      .catch(() => {})
  }, [])

  // mounted flag for theme toggle hydration safety — chạy 1 lần sau hydrate
  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  // Hotkey Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
      if (e.key === 'Escape') setCmdOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const initials = (user?.name || user?.username || 'U')
    .split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 py-3">
        <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Command palette trigger */}
        <button
          onClick={() => setCmdOpen(true)}
          className="hidden sm:flex items-center gap-2 flex-1 max-w-md h-9 px-3 rounded-md border border-border/60 bg-muted/40 hover:bg-muted/60 transition-colors text-sm text-muted-foreground group"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Tìm kiếm hoặc chạy lệnh...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border/60 bg-card text-[10px] font-mono">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {botStatus && (
            <div className="hidden md:flex items-center gap-1.5">
              <Badge variant="outline" className="gap-1.5 bg-card/50 border-border/60 py-1">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  botStatus.online ? 'bg-primary animate-pulse' : 'bg-destructive'
                )} />
                <span className="text-xs">{botStatus.online ? 'Online' : 'Offline'}</span>
              </Badge>
              <Badge variant="outline" className="font-mono text-xs bg-card/50 border-border/60 py-1 hidden lg:inline-flex">
                {botStatus.ping}ms
              </Badge>
              <Badge variant="outline" className="hidden xl:inline-flex bg-card/50 border-border/60 py-1 text-xs">
                {formatUptime(botStatus.uptimeMs)}
              </Badge>
            </div>
          )}

          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-accent"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Chuyển sang light mode' : 'Chuyển sang dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-accent">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border border-card" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-3 border-b border-border/60">
                <div className="font-semibold text-sm">Thông báo</div>
                <Badge variant="secondary" className="text-[10px]">{activity.length} mới</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-milky">
                {activity.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">Chưa có hoạt động</div>
                ) : activity.map((a) => {
                  const meta = ACTIVITY_LABELS[a.type] || { title: a.type, color: 'bg-slate-500' }
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-3 hover:bg-accent/50 border-b border-border/40 last:border-0 cursor-pointer transition-colors">
                      <div className={`w-1.5 self-stretch rounded-full ${meta.color}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-tight">{meta.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.user} — {a.description}</div>
                        <div className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(a.createdAt)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-2 border-t border-border/60">
                <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                  Xem tất cả thông báo
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:bg-accent pl-1 pr-2 py-1 transition-colors">
                <Avatar className="w-8 h-8 border-2 border-border/60">
                  {user?.image ? <AvatarImage src={user.image} alt={user.name || 'avatar'} /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-700 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium leading-tight max-w-32 truncate">
                    {user?.name || user?.username || 'User'}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight flex items-center gap-0.5">
                    <DiscordIcon className="w-2.5 h-2.5" />
                    Discord
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs cursor-default">
                <DiscordIcon className="w-3.5 h-3.5 mr-2 text-[#5865F2]" />
                <span className="text-muted-foreground">Phương thức:</span>
                <span className="ml-auto font-medium">Discord OAuth</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-default">
                <span className="text-muted-foreground ml-6">User ID:</span>
                <code className="ml-auto text-[10px] font-mono">…289810</code>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Command palette overlay */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-150"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-card border border-border/60 rounded-xl shadow-milky-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm lệnh, thành viên, log... (Esc để đóng)"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border border-border/60">ESC</kbd>
              <button onClick={() => setCmdOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto scrollbar-milky">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1.5">
                Gợi ý
              </div>
              {[
                { label: 'Tổng quan', desc: 'Xem trạng thái server và bot', k: 'overview' },
                { label: 'Quản trị — Cảnh báo', desc: 'Xem danh sách cảnh báo', k: 'moderation' },
                { label: 'AutoMod — Bad words', desc: 'Quản lý từ cấm', k: 'automod' },
                { label: 'Reaction Roles', desc: 'Thêm reaction role mới', k: 'reaction-roles' },
                { label: 'Cài đặt prefix', desc: 'Đổi prefix bot', k: 'settings' },
                { label: 'Lệnh — tìm kiếm', desc: 'Tìm trong 47 lệnh', k: 'commands' },
                { label: 'Logs — export CSV', desc: 'Xuất nhật ký lệnh', k: 'logs' },
              ]
                .filter(s => !search || s.label.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()))
                .map((s) => (
                  <button
                    key={s.k}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-accent text-left transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-tight">{s.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.desc}</div>
                    </div>
                    <ArrowReturn className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
            </div>
            <div className="px-3 py-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 rounded border border-border/60 font-mono">↑↓</kbd>
                để chọn
              </span>
              <span>milkbucket command palette</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function ArrowReturn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h7a3 3 0 0 1 0 6H6" />
      <path d="M5 6L3 8l2 2" />
    </svg>
  )
}
