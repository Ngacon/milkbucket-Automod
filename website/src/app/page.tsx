'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { OverviewSection } from '@/components/dashboard/overview-section'
import { ModerationSection } from '@/components/dashboard/moderation-section'
import { AutomodSection } from '@/components/dashboard/automod-section'
import { ReactionRolesSection } from '@/components/dashboard/reaction-roles-section'
import { SettingsSection } from '@/components/dashboard/settings-section'
import { CommandsSection } from '@/components/dashboard/commands-section'
import { LogsSection } from '@/components/dashboard/logs-section'
import { DiscordIcon } from '@/components/icons/discord'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { Loader2, Milk } from 'lucide-react'

export type SectionKey =
  | 'overview'
  | 'moderation'
  | 'automod'
  | 'reaction-roles'
  | 'settings'
  | 'commands'
  | 'logs'

type BotStatus = {
  online: boolean
  ping: number
  wsPing: number
  uptimeMs: number
  memoryMb: number
  version: string
} | null

const SECTION_LABELS: Record<SectionKey, string> = {
  overview: 'Tổng quan',
  moderation: 'Quản trị',
  automod: 'AutoMod',
  'reaction-roles': 'Reaction Roles',
  settings: 'Cài đặt',
  commands: 'Lệnh',
  logs: 'Nhật ký',
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [section, setSection] = useState<SectionKey>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [botStatus, setBotStatus] = useState<BotStatus>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    async function load() {
      try {
        const res = await fetch('/api/dashboard/bot-status')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setBotStatus(data)
      } catch {
        // silent
      }
    }
    load()
    timer = setInterval(load, 30000)
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [status])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center text-white shadow-milky">
            <Milk className="w-6 h-6" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  // Auth gate — useEffect ở trên sẽ redirect
  if (status !== 'authenticated' || !session) {
    return null
  }

  const handleNavigate = (key: SectionKey) => {
    setSection(key)
    setSidebarOpen(false)
  }

  const user = session.user as {
    name?: string | null
    username?: string | null
    image?: string | null
    email?: string | null
    provider?: string | null
    role?: string | null
  } | null

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        botStatus={botStatus}
        onMenuClick={() => setSidebarOpen(true)}
        user={user}
        onSignOut={() => signOut({ callbackUrl: '/login' })}
      />
      <div className="flex-1 flex w-full">
        <Sidebar
          active={section}
          onNavigate={handleNavigate}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onSignOut={() => signOut({ callbackUrl: '/login' })}
        />
        <main key={section} className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-x-hidden scrollbar-milky animate-in fade-in slide-in-from-bottom-2 duration-300">
          {section === 'overview' && <OverviewSection />}
          {section === 'moderation' && <ModerationSection />}
          {section === 'automod' && <AutomodSection />}
          {section === 'reaction-roles' && <ReactionRolesSection />}
          {section === 'settings' && <SettingsSection />}
          {section === 'commands' && <CommandsSection />}
          {section === 'logs' && <LogsSection />}
        </main>
      </div>
      <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur px-4 py-3 text-xs text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1600px] mx-auto">
          <span>
            <span className="text-gradient-emerald font-semibold">milkbucket</span>{' '}
            dashboard &middot; Server{' '}
            <span className="font-mono">{process.env.NEXT_PUBLIC_DISCORD_GUILD_ID}</span>
            &middot; Mục: {SECTION_LABELS[section]}
          </span>
          <span className="flex items-center gap-1.5">
            <DiscordIcon className="w-3 h-3" />
            {user?.name} &middot; {user?.username ? `@${user.username}` : 'Discord user'}
          </span>
        </div>
      </footer>
    </div>
  )
}
