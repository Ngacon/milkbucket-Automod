'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ScrollText, Search, CheckCircle2, XCircle, Filter, Download } from 'lucide-react'
import { timeAgo, formatDateTime, CATEGORY_LABELS } from '@/lib/format'

type LogItem = {
  id: number
  commandName: string
  category: string
  userId: string
  username: string
  args: string
  success: boolean
  durationMs: number
  createdAt: string
}

export function LogsSection() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (category !== 'all') params.set('category', category)
      if (status === 'success') params.set('success', 'true')
      if (status === 'failed') params.set('success', 'false')
      if (search) params.set('search', search)
      const res = await fetch(`/api/dashboard/logs?${params}`)
      const json = await res.json()
      setLogs(json.logs)
    } finally {
      setLoading(false)
    }
  }, [category, status, search])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  const exportCsv = () => {
    const header = 'id,command,category,user,args,success,duration_ms,created_at\n'
    const rows = logs.map(l =>
      `${l.id},${l.commandName},${l.category},${l.username},"${l.args.replace(/"/g, '""')}",${l.success},${l.durationMs},${l.createdAt}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `milkbucket-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const successCount = logs.filter(l => l.success).length
  const failCount = logs.length - successCount
  const avgDuration = logs.length > 0 ? (logs.reduce((a, l) => a + l.durationMs, 0) / logs.length).toFixed(0) : 0

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nhật ký lệnh</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {logs.length} bản ghi gần nhất &middot; Tỉ lệ thành công {logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv} disabled={logs.length === 0}>
          <Download className="w-3.5 h-3.5" />
          Xuất CSV
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Tổng số" value={logs.length} icon={ScrollText} color="text-sky-600 bg-sky-50 dark:bg-sky-950/30" />
        <MiniStat label="Thành công" value={successCount} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
        <MiniStat label="Thất bại" value={failCount} icon={XCircle} color="text-rose-600 bg-rose-50 dark:bg-rose-950/30" />
        <MiniStat label="Độ trễ TB" value={`${avgDuration}ms`} icon={Filter} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
      </div>

      {/* Filters */}
      <Card className="border-border/60 shadow-milky">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên lệnh..."
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {Object.keys(CATEGORY_LABELS).map(cat => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card className="border-border/60 shadow-milky">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-emerald-600" />
            Lịch sử lệnh
          </CardTitle>
          <CardDescription>{logs.length} bản ghi</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="max-h-[640px] overflow-y-auto rounded-md border border-border/60 shadow-milky">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-44">Lệnh</TableHead>
                    <TableHead className="w-28">Danh mục</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Args</TableHead>
                    <TableHead className="w-20">Độ trễ</TableHead>
                    <TableHead className="w-20">Trạng thái</TableHead>
                    <TableHead className="w-32 text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-12">
                        <Filter className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        Không có log phù hợp
                      </TableCell>
                    </TableRow>
                  ) : logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{l.id}</TableCell>
                      <TableCell>
                        <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          m!{l.commandName}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[l.category] || l.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{l.username}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">
                        {l.args ? <code className="font-mono">{l.args}</code> : <span className="opacity-50">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{l.durationMs}ms</Badge>
                      </TableCell>
                      <TableCell>
                        {l.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap">
                        <span title={formatDateTime(l.createdAt)}>{timeAgo(l.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: React.ReactNode; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-border/60 shadow-milky">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold mt-0.5">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardContent>
    </Card>
  )
}
