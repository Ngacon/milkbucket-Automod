'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { AlertTriangle, Clock, ShieldBan, Search, Filter } from 'lucide-react'
import { timeAgo, formatDuration } from '@/lib/format'

type WarningRow = {
  id: number; userId: string; userName: string; userAvatar: string | null;
  moderatorId: string; moderatorName: string; reason: string; level: number; createdAt: string
}
type MuteRow = {
  id: number; userId: string; userName: string; userAvatar: string | null;
  moderatorId: string; moderatorName: string; reason: string; duration: number;
  active: boolean; createdAt: string; expiresAt: string | null
}
type BanRow = {
  id: number; userId: string; userName: string; userAvatar: string | null;
  moderatorId: string; moderatorName: string; reason: string;
  soft: boolean; hackban: boolean; createdAt: string
}

type Data = { warnings: WarningRow[]; mutes: MuteRow[]; bans: BanRow[] }

export function ModerationSection() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/dashboard/moderation?type=all&limit=100')
        const json = await res.json()
        if (!cancelled) setData(json)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (!data) return { warnings: [] as WarningRow[], mutes: [] as MuteRow[], bans: [] as BanRow[] }
    if (!search.trim()) return data
    const q = search.toLowerCase()
    const match = (s: string) => s.toLowerCase().includes(q)
    return {
      warnings: data.warnings.filter(w => match(w.userName) || match(w.reason) || match(w.moderatorName)),
      mutes: data.mutes.filter(m => match(m.userName) || match(m.reason) || match(m.moderatorName)),
      bans: data.bans.filter(b => match(b.userName) || match(b.reason) || match(b.moderatorName)),
    }
  }, [data, search])

  if (loading || !data) return <ModerationSkeleton />

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản trị</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cảnh báo, mute và ban trong server
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, lý do, mod..."
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Cảnh báo" value={data.warnings.length} icon={AlertTriangle} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <SummaryCard label="Mute" value={data.mutes.length} icon={Clock} color="text-orange-600 bg-orange-50 dark:bg-orange-950/30" />
        <SummaryCard label="Ban" value={data.bans.length} icon={ShieldBan} color="text-rose-600 bg-rose-50 dark:bg-rose-950/30" />
      </div>

      <Tabs defaultValue="warnings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="warnings" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cảnh báo
            <Badge variant="secondary" className="text-xs ml-1">{filtered.warnings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="mutes" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Mute
            <Badge variant="secondary" className="text-xs ml-1">{filtered.mutes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bans" className="gap-1.5">
            <ShieldBan className="w-3.5 h-3.5" />
            Ban
            <Badge variant="secondary" className="text-xs ml-1">{filtered.bans.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warnings" className="mt-4">
          <Card className="border-border/60 shadow-milky">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lịch sử cảnh báo</CardTitle>
              <CardDescription>{filtered.warnings.length} bản ghi</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Thành viên</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead className="w-20">Mức</TableHead>
                      <TableHead className="w-32">Moderator</TableHead>
                      <TableHead className="w-28 text-right">Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.warnings.length === 0 ? (
                      <EmptyRow colSpan={6} />
                    ) : filtered.warnings.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{w.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-xs bg-muted">{w.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{w.userName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{w.userId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs"><div className="truncate">{w.reason}</div></TableCell>
                        <TableCell>
                          <Badge variant={w.level >= 3 ? 'destructive' : w.level === 2 ? 'default' : 'secondary'} className="text-xs">
                            Lv {w.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{w.moderatorName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap">{timeAgo(w.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mutes" className="mt-4">
          <Card className="border-border/60 shadow-milky">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lịch sử mute</CardTitle>
              <CardDescription>{filtered.mutes.length} bản ghi</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Thành viên</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead className="w-24">Thời lượng</TableHead>
                      <TableHead className="w-24">Trạng thái</TableHead>
                      <TableHead className="w-32">Moderator</TableHead>
                      <TableHead className="w-28 text-right">Khi nào</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.mutes.length === 0 ? (
                      <EmptyRow colSpan={7} />
                    ) : filtered.mutes.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-xs bg-muted">{m.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{m.userName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{m.userId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs"><div className="truncate">{m.reason}</div></TableCell>
                        <TableCell className="text-sm font-mono">{formatDuration(m.duration)}</TableCell>
                        <TableCell>
                          {m.active ? (
                            <Badge className="text-xs bg-orange-500/15 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20">
                              Đang mute
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Đã hết</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{m.moderatorName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap">{timeAgo(m.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bans" className="mt-4">
          <Card className="border-border/60 shadow-milky">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lịch sử ban</CardTitle>
              <CardDescription>{filtered.bans.length} bản ghi</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Thành viên</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead className="w-24">Loại</TableHead>
                      <TableHead className="w-32">Moderator</TableHead>
                      <TableHead className="w-28 text-right">Khi nào</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.bans.length === 0 ? (
                      <EmptyRow colSpan={6} />
                    ) : filtered.bans.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{b.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-xs bg-muted">{b.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{b.userName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{b.userId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs"><div className="truncate">{b.reason}</div></TableCell>
                        <TableCell>
                          {b.soft ? (
                            <Badge variant="secondary" className="text-xs">Softban</Badge>
                          ) : b.hackban ? (
                            <Badge className="text-xs bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20">Hackban</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Ban</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{b.moderatorName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap">{timeAgo(b.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollTable>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ScrollTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-[560px] overflow-y-auto rounded-md border border-border/60 shadow-milky">
      {children}
    </div>
  )
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center text-sm text-muted-foreground py-12">
        <Filter className="w-6 h-6 mx-auto mb-2 opacity-50" />
        Không có bản ghi phù hợp
      </TableCell>
    </TableRow>
  )
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-border/60 shadow-milky">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-0.5">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function ModerationSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-[640px] w-full rounded-xl" />
    </div>
  )
}
