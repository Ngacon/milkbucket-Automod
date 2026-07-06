'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { AnimatedNumber, LiveClock, Sparkline } from '@/components/dashboard/animations'
import {
  Users, Shield, ShieldAlert, Bot, MessageSquare, Hash, Crown, Activity,
  TrendingUp, AlertTriangle, Clock, Zap, Smile, ScrollText,
} from 'lucide-react'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { formatNumber, timeAgo, ACTIVITY_LABELS, CATEGORY_LABELS } from '@/lib/format'

type OverviewData = {
  guild: {
    id: string
    name: string
    iconUrl: string | null
    ownerId: string
    memberCount: number
    channelCount: number
    roleCount: number
    prefix: string
    language: string
    joinedAt: string
    logChannelId: string | null
  }
  stats: {
    warnings: number
    mutes: number
    activeMutes: number
    bans: number
    automodEvents: number
    commandLogs: number
    reactionRoles: number
    badWords: number
    members: number
  }
  categoryCounts: Record<string, number>
  dayBuckets: { date: string; count: number }[]
  topCommands: { name: string; count: number }[]
  recentActivity: {
    id: string
    type: string
    description: string
    user: string
    createdAt: string
  }[]
  topWarnedUsers: { id: string; name: string; count: number }[]
}

export function OverviewSection() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/dashboard/overview')
        const json = await res.json()
        if (!cancelled) setData(json)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (loading || !data) return <OverviewSkeleton />

  const { guild, stats, categoryCounts, dayBuckets, topCommands, recentActivity, topWarnedUsers } = data

  const chartData = dayBuckets.map(d => ({
    date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    count: d.count,
  }))

  const categoryChart = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: CATEGORY_LABELS[cat] || cat,
    count,
  }))

  const chartConfig: ChartConfig = {
    count: { label: 'Lệnh', color: 'var(--chart-2)' },
  }

  const dailyCounts = dayBuckets.map(d => d.count)

  const statCards = [
    { label: 'Thành viên', value: stats.members, total: guild.memberCount, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Cảnh báo', value: stats.warnings, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Mute hoạt động', value: stats.activeMutes, total: stats.mutes, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: 'Ban', value: stats.bans, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { label: 'AutoMod events', value: stats.automodEvents, icon: Bot, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    { label: 'Lệnh đã chạy', value: stats.commandLogs, icon: Zap, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', spark: dailyCounts },
    { label: 'Reaction roles', value: stats.reactionRoles, icon: Smile, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30' },
    { label: 'Bad words', value: stats.badWords, icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  ]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Server hero card */}
      <Card className="overflow-hidden border-border/60 shadow-milky-lg">
        <div className="h-24 bg-gradient-to-r from-primary via-emerald-600 to-emerald-700 relative">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute top-4 right-4 flex items-center gap-2 text-white/90 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 backdrop-blur border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
              <LiveClock />
            </span>
          </div>
        </div>
        <CardContent className="px-6 pb-6 -mt-14">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <Avatar className="w-24 h-24 border-4 border-card rounded-2xl bg-card shadow-milky">
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-white text-2xl font-bold">
                MB
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{guild.name}</h1>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
                  Bot hoạt động
                </Badge>
                <Badge variant="outline" className="font-mono text-xs bg-card/50 border-border/60">
                  ID: {guild.id}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Prefix <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">{guild.prefix}</code>
                &nbsp;&middot;&nbsp; Ngôn ngữ {guild.language === 'vi' ? 'Tiếng Việt' : 'English'}
                &nbsp;&middot;&nbsp; Tham gia {timeAgo(guild.joinedAt)}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm bg-card/60 backdrop-blur rounded-xl px-4 py-3 border border-border/60 shadow-milky">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient-emerald">
                  <AnimatedNumber value={guild.memberCount} />
                </div>
                <div className="text-xs text-muted-foreground">Thành viên</div>
              </div>
              <div className="h-10 w-px bg-border/60" />
              <div className="text-center">
                <div className="text-2xl font-bold"><AnimatedNumber value={guild.channelCount} /></div>
                <div className="text-xs text-muted-foreground">Kênh</div>
              </div>
              <div className="h-10 w-px bg-border/60" />
              <div className="text-center">
                <div className="text-2xl font-bold"><AnimatedNumber value={guild.roleCount} /></div>
                <div className="text-xs text-muted-foreground">Role</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="border-border/60 shadow-milky hover:shadow-milky-lg transition-all hover:-translate-y-0.5 group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {s.label}
                    </div>
                    <div className="text-2xl font-bold mt-0.5 tabular-nums">
                      <AnimatedNumber value={s.value} />
                    </div>
                    {s.total !== undefined && s.total !== s.value && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        / <AnimatedNumber value={s.total} /> tổng
                      </div>
                    )}
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg} group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                {s.spark && (
                  <div className="mt-2 -mb-1 flex justify-end">
                    <Sparkline data={s.spark} width={90} height={22} color="var(--primary)" className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Command usage chart */}
        <Card className="lg:col-span-2 border-border/60 shadow-milky">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Hoạt động lệnh 14 ngày
                </CardTitle>
                <CardDescription>Số lệnh thực thi theo ngày</CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono bg-primary/10 text-primary">
                {chartData.reduce((a, b) => a + b.count, 0)} lệnh
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} tickMargin={4} className="text-xs" allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  fill="url(#fillCount)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top commands */}
        <Card className="border-border/60 shadow-milky">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Top lệnh
            </CardTitle>
            <CardDescription>Lệnh được dùng nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCommands.map((c, i) => {
                const max = topCommands[0]?.count || 1
                const pct = (c.count / max) * 100
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                        <code className="px-1.5 py-0.5 rounded bg-muted text-xs">{c.name}</code>
                      </span>
                      <span className="font-semibold tabular-nums">{c.count}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <Card className="border-border/60 shadow-milky">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Lệnh theo danh mục
            </CardTitle>
            <CardDescription>14 ngày gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart data={categoryChart} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickLine={false} axisLine={false} tickMargin={4} className="text-xs" allowDecimals={false} />
                <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={80} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2 border-border/60 shadow-milky">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-emerald-600" />
              Hoạt động gần đây
            </CardTitle>
            <CardDescription>Sự kiện moderation, automod và lệnh mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 -mr-1">
              {recentActivity.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Chưa có hoạt động nào
                </div>
              )}
              {recentActivity.map((a) => {
                const meta = ACTIVITY_LABELS[a.type] || { label: a.type, color: 'bg-slate-500' }
                return (
                  <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                    <div className={`w-1.5 self-stretch rounded-full ${meta.color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{meta.label}</Badge>
                        <span className="text-sm font-medium truncate">{a.user}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top warned users */}
        <Card className="border-border/60 shadow-milky">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Thành viên vi phạm nhiều nhất
            </CardTitle>
            <CardDescription>Số cảnh báo tích luỹ</CardDescription>
          </CardHeader>
          <CardContent>
            {topWarnedUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu</div>
            ) : (
              <div className="space-y-3">
                {topWarnedUsers.map((u, i) => {
                  const max = topWarnedUsers[0]?.count || 1
                  const pct = (u.count / max) * 100
                  return (
                    <div key={u.id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-4 text-right">{i + 1}</span>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-muted">
                          {u.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="truncate">{u.name}</span>
                          <span className="font-semibold tabular-nums text-amber-600">{u.count}</span>
                        </div>
                        <Progress value={pct} className="h-1 mt-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner & log channel info */}
        <Card className="border-border/60 shadow-milky">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              Thông tin server
            </CardTitle>
            <CardDescription>Cấu hình và quyền sở hữu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={Crown} label="Chủ server" value={<code className="text-xs font-mono">{guild.ownerId}</code>} />
            <InfoRow icon={MessageSquare} label="Kênh log" value={guild.logChannelId ? <code className="text-xs font-mono">{guild.logChannelId}</code> : <span className="text-muted-foreground italic text-xs">Chưa cấu hình</span>} />
            <InfoRow icon={Hash} label="Số kênh" value={<span className="font-medium">{guild.channelCount}</span>} />
            <InfoRow icon={Shield} label="Số role" value={<span className="font-medium">{guild.roleCount}</span>} />
            <InfoRow icon={Bot} label="Prefix" value={<code className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">{guild.prefix}</code>} />
            <InfoRow icon={Activity} label="Ngôn ngữ" value={<Badge variant="secondary" className="text-xs">{guild.language === 'vi' ? 'Tiếng Việt' : 'English'}</Badge>} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      {value}
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[340px] rounded-xl" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
    </div>
  )
}
