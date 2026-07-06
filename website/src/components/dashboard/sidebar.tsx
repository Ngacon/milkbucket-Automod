'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SectionKey } from '@/app/page'
import {
  LayoutDashboard, Shield, Bot, Smile, SlidersHorizontal,
  Terminal, ScrollText, Milk, Sparkles, LogOut,
} from 'lucide-react'

type NavItem = {
  key: SectionKey
  label: string
  description: string
  icon: React.ElementType
  group: 'main' | 'tools'
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview',       label: 'Tổng quan',      description: 'Tình trạng server & bot',     icon: LayoutDashboard, group: 'main' },
  { key: 'moderation',     label: 'Quản trị',       description: 'Warn · Mute · Ban',           icon: Shield,          group: 'main', badge: '77' },
  { key: 'automod',        label: 'AutoMod',        description: 'Antilink, antispam, badwords', icon: Bot,             group: 'main', badge: '5/6' },
  { key: 'reaction-roles', label: 'Reaction Roles', description: 'Quản lý reaction role',       icon: Smile,           group: 'tools' },
  { key: 'settings',       label: 'Cài đặt',        description: 'Prefix, ngôn ngữ, log',       icon: SlidersHorizontal, group: 'tools' },
  { key: 'commands',       label: 'Lệnh',           description: '47 lệnh trong 8 danh mục',    icon: Terminal,        group: 'tools', badge: '47' },
  { key: 'logs',           label: 'Nhật ký',        description: 'Lịch sử lệnh & sự kiện',      icon: ScrollText,      group: 'tools', badge: '200' },
]

interface SidebarProps {
  active: SectionKey
  onNavigate: (key: SectionKey) => void
  open: boolean
  onClose: () => void
  user?: {
    name?: string | null
    username?: string | null
    image?: string | null
    email?: string | null
  } | null
  onSignOut?: () => void
}

export function Sidebar({ active, onNavigate, open, onClose, user, onSignOut }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
        <SidebarContent active={active} onNavigate={onNavigate} user={user} onSignOut={onSignOut} />
      </aside>

      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <SidebarContent active={active} onNavigate={onNavigate} user={user} onSignOut={onSignOut} />
        </SheetContent>
      </Sheet>
    </>
  )
}

function SidebarContent({
  active, onNavigate, user, onSignOut,
}: {
  active: SectionKey
  onNavigate: (k: SectionKey) => void
  user?: SidebarProps['user']
  onSignOut?: () => void
}) {
  const mainItems = NAV_ITEMS.filter(i => i.group === 'main')
  const toolItems = NAV_ITEMS.filter(i => i.group === 'tools')
  const initials = (user?.name || user?.username || 'U')
    .split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col w-full h-full">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/60">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-emerald-600 to-emerald-700 flex items-center justify-center text-white shadow-milky relative">
          <Milk className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-sidebar" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold leading-tight tracking-tight">
            <span className="text-gradient-emerald">milkbucket</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">Dashboard quản trị</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-milky">
        <NavGroup label="Tổng quan" items={mainItems} active={active} onNavigate={onNavigate} />
        <NavGroup label="Công cụ" items={toolItems} active={active} onNavigate={onNavigate} />
      </nav>

      {/* User card footer */}
      <div className="border-t border-border/60 p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card/60 border border-border/60 hover:bg-accent/50 transition-colors group">
            <Avatar className="w-9 h-9 border border-border/60 shrink-0">
              {user.image ? <AvatarImage src={user.image} alt={user.name || 'avatar'} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-700 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{user.name || user.username}</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {user.email || `@${user.username}`}
              </div>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-muted-foreground/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            v2.4.1
          </span>
          <span className="flex items-center gap-1.5 text-primary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Bot online
          </span>
        </div>
      </div>
    </div>
  )
}

function NavGroup({
  label, items, active, onNavigate,
}: {
  label: string
  items: NavItem[]
  active: SectionKey
  onNavigate: (k: SectionKey) => void
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-2">
        {label}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'group w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                'hover:bg-accent/70 hover:shadow-sm',
                isActive && 'bg-gradient-to-r from-primary/10 to-emerald-500/5 shadow-milky border border-primary/20'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                isActive
                  ? 'bg-gradient-to-br from-primary to-emerald-700 text-white'
                  : 'bg-muted/60 text-muted-foreground group-hover:bg-card group-hover:text-primary'
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className={cn(
                  'text-sm font-medium leading-tight transition-colors flex items-center gap-2',
                  isActive ? 'text-primary' : 'text-foreground'
                )}>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className={cn(
                        'text-[10px] px-1.5 py-0 font-mono shrink-0',
                        isActive && 'bg-primary/15 text-primary border-primary/20'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{item.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
