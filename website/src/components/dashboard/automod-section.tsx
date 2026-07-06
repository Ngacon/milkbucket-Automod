'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Bot, Link2, Mail, Repeat, Type, AtSign, Shield, Plus, Trash2, AlertCircle, TrendingUp, Bot as BotIcon,
} from 'lucide-react'
import { FEATURE_LABELS, ACTION_LABELS, timeAgo } from '@/lib/format'

type Config = {
  id: number; feature: string; enabled: boolean; threshold: number; action: string; warnLimit: number
}
type BadWord = { id: number; word: string; severity: string; createdAt: string }
type AutoModEvent = {
  id: number; feature: string; userId: string; username: string; action: string; content: string; createdAt: string
}

type Data = {
  configs: Config[]
  badWords: BadWord[]
  events: AutoModEvent[]
  eventCountsByFeature: Record<string, number>
  topOffenders: { id: string; name: string; count: number }[]
  totalEvents: number
}

const FEATURE_ICONS: Record<string, React.ElementType> = {
  antilink: Link2,
  antiinvite: Mail,
  antispam: Repeat,
  antidup: Repeat,
  anticaps: Type,
  antimention: AtSign,
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  high: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
}

export function AutomodSection() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [newWord, setNewWord] = useState('')
  const [newSeverity, setNewSeverity] = useState('medium')
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/automod')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleFeature = async (feature: string, enabled: boolean) => {
    if (!data) return
    setData({ ...data, configs: data.configs.map(c => c.feature === feature ? { ...c, enabled } : c) })
    try {
      await fetch('/api/dashboard/automod', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, enabled }),
      })
      toast({
        title: enabled ? 'Đã bật AutoMod' : 'Đã tắt AutoMod',
        description: `${FEATURE_LABELS[feature] || feature}`,
      })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật', variant: 'destructive' })
      load()
    }
  }

  const addWord = async () => {
    if (!newWord.trim()) return
    try {
      const res = await fetch('/api/dashboard/automod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', word: newWord.trim(), severity: newSeverity }),
      })
      const json = await res.json()
      if (json.ok) {
        setNewWord('')
        toast({ title: 'Đã thêm từ cấm', description: `"${newWord}"` })
        load()
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể thêm', variant: 'destructive' })
    }
  }

  const removeWord = async (word: string) => {
    try {
      await fetch('/api/dashboard/automod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', word }),
      })
      toast({ title: 'Đã xoá từ cấm', description: `"${word}"` })
      load()
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể xoá', variant: 'destructive' })
    }
  }

  if (loading || !data) return <AutomodSkeleton />

  const enabledCount = data.configs.filter(c => c.enabled).length

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AutoMod</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {enabledCount}/{data.configs.length} tính năng đang bật &middot; {data.totalEvents} sự kiện đã ghi nhận
        </p>
      </div>

      {/* Feature toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.configs.map((c) => {
          const Icon = FEATURE_ICONS[c.feature] || Bot
          const eventCount = data.eventCountsByFeature[c.feature] || 0
          return (
            <Card key={c.id} className="border-border/60 shadow-milky">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.enabled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{FEATURE_LABELS[c.feature] || c.feature}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Hành động: {ACTION_LABELS[c.action] || c.action}
                        {c.threshold > 0 && <> &middot; Ngưỡng {c.threshold}{c.feature === 'anticaps' ? '%' : ''}</>}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={c.enabled}
                    onCheckedChange={(v) => toggleFeature(c.feature, v)}
                  />
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60 shadow-milky">
                  <div className="text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Warn limit: <span className="font-medium text-foreground">{c.warnLimit}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {eventCount} sự kiện
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bad words management */}
        <Card className="lg:col-span-2 border-border/60 shadow-milky">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Danh sách từ cấm
            </CardTitle>
            <CardDescription>{data.badWords.length} từ đang được theo dõi</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add form */}
            <div className="flex items-center gap-2 mb-4">
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Thêm từ cấm mới..."
                onKeyDown={(e) => e.key === 'Enter' && addWord()}
                className="flex-1"
              />
              <Select value={newSeverity} onValueChange={setNewSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Vừa</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addWord} size="icon" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Words list */}
            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
              {data.badWords.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8 w-full">
                  Chưa có từ cấm nào
                </div>
              ) : data.badWords.map((bw) => (
                <div
                  key={bw.word}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/40 text-sm"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_COLORS[bw.severity].split(' ')[0].replace('bg-', 'bg-')}`} />
                  <span className="font-mono">{bw.word}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SEVERITY_COLORS[bw.severity]}`}>
                    {bw.severity}
                  </Badge>
                  <button
                    onClick={() => removeWord(bw.word)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top offenders */}
        <Card className="border-border/60 shadow-milky">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              Vi phạm nhiều nhất
            </CardTitle>
            <CardDescription>Theo số sự kiện AutoMod</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topOffenders.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu</div>
            ) : (
              <div className="space-y-3">
                {data.topOffenders.map((u, i) => {
                  const max = data.topOffenders[0]?.count || 1
                  const pct = (u.count / max) * 100
                  return (
                    <div key={u.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                          <span className="truncate">{u.name}</span>
                        </span>
                        <span className="font-semibold tabular-nums text-rose-600">{u.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden ml-6">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent AutoMod events */}
      <Card className="border-border/60 shadow-milky">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="w-4 h-4 text-emerald-600" />
            Sự kiện AutoMod gần đây
          </CardTitle>
          <CardDescription>{data.events.length} sự kiện mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto rounded-md border border-border/60 shadow-milky">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Tính năng</TableHead>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="w-24">Hành động</TableHead>
                  <TableHead className="w-28 text-right">Khi nào</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">
                      Chưa có sự kiện nào
                    </TableCell>
                  </TableRow>
                ) : data.events.map((e) => {
                  const Icon = FEATURE_ICONS[e.feature] || Bot
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Icon className="w-3 h-3" />
                          {FEATURE_LABELS[e.feature] || e.feature}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{e.username}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">
                        <code className="px-1.5 py-0.5 rounded bg-muted font-mono truncate inline-block max-w-full">{e.content}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{ACTION_LABELS[e.action] || e.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap">{timeAgo(e.createdAt)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AutomodSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  )
}
