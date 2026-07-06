'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Terminal, Search, ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/format'

type CommandItem = {
  name: string
  category: string
  description: string
  permissions: string[]
  cooldown: number
  aliases: string[]
  usage: string
  usage_count: string  // prefix + name
  stats: { count: number; success: number; fail: number }
}

type Data = {
  prefix: string
  categories: Record<string, CommandItem[]>
  totalCommands: number
  totalCategories: number
}

export function CommandsSection() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/dashboard/commands')
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
    if (!data) return {}
    if (!search.trim()) return data.categories
    const q = search.toLowerCase()
    const result: Record<string, CommandItem[]> = {}
    for (const [cat, items] of Object.entries(data.categories)) {
      const matched = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.aliases.some(a => a.toLowerCase().includes(q))
      )
      if (matched.length > 0) result[cat] = matched
    }
    return result
  }, [data, search])

  if (loading || !data) return <CommandsSkeleton />

  const totalFiltered = Object.values(filtered).reduce((a, b) => a + b.length, 0)
  const totalUsage = Object.values(data.categories).flat().reduce((a, c) => a + c.stats.count, 0)

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lệnh</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.totalCommands} lệnh trong {data.totalCategories} danh mục &middot; {totalUsage.toLocaleString('vi-VN')} lần dùng
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm lệnh, alias, mô tả..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Category quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(data.categories).map(([cat, items]) => {
          const usage = items.reduce((a, c) => a + c.stats.count, 0)
          return (
            <Card key={cat} className="border-border/60 shadow-milky">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground truncate">{CATEGORY_LABELS[cat] || cat}</div>
                <div className="text-xl font-bold mt-0.5">{items.length}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{usage} lần</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">Tất cả ({data.totalCommands})</TabsTrigger>
          {Object.keys(data.categories).map(cat => (
            <TabsTrigger key={cat} value={cat}>
              {CATEGORY_LABELS[cat] || cat} ({data.categories[cat].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {totalFiltered === 0 ? (
            <Card className="border-border/60 shadow-milky">
              <CardContent className="py-16 text-center">
                <Search className="w-10 h-10 mx-auto text-muted-foreground opacity-50 mb-3" />
                <h3 className="font-semibold">Không tìm thấy lệnh</h3>
                <p className="text-sm text-muted-foreground mt-1">Thử từ khoá khác</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(filtered).map(([cat, items]) => (
              <CommandGroup
                key={cat}
                category={cat}
                items={items}
                prefix={data.prefix}
                expanded={!!expanded[cat]}
                onToggle={() => setExpanded(s => ({ ...s, [cat]: !s[cat] }))}
              />
            ))
          )}
        </TabsContent>

        {Object.keys(data.categories).map(cat => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <CommandGroup
              category={cat}
              items={filtered[cat] || []}
              prefix={data.prefix}
              expanded={true}
              onToggle={() => {}}
              forceOpen
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function CommandGroup({
  category, items, prefix, expanded, onToggle, forceOpen,
}: {
  category: string
  items: CommandItem[]
  prefix: string
  expanded: boolean
  onToggle: () => void
  forceOpen?: boolean
}) {
  const isOpen = forceOpen || expanded
  const usage = items.reduce((a, c) => a + c.stats.count, 0)
  const successRate = items.reduce((a, c) => a + c.stats.success, 0)
  const total = items.reduce((a, c) => a + c.stats.count, 0)
  const rate = total > 0 ? (successRate / total * 100).toFixed(1) : '100.0'

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className="border-border/60 shadow-milky">
        <CollapsibleTrigger asChild className={forceOpen ? 'pointer-events-none' : ''}>
          <button className="w-full text-left">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!forceOpen && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                  <CardTitle className="text-base">{CATEGORY_LABELS[category] || category}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{items.length} lệnh</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{usage} lần</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {rate}%
                  </span>
                </div>
              </div>
            </CardHeader>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((cmd) => (
                <CommandCard key={cmd.name} cmd={cmd} prefix={prefix} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function CommandCard({ cmd, prefix }: { cmd: CommandItem; prefix: string }) {
  const rate = cmd.stats.count > 0 ? (cmd.stats.success / cmd.stats.count * 100).toFixed(0) : '—'
  return (
    <div className="p-3 rounded-lg border border-border/60 hover:border-emerald-500/40 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              {prefix}{cmd.name}
            </code>
            {cmd.aliases.length > 0 && cmd.aliases.map(a => (
              <Badge key={a} variant="outline" className="text-[10px] font-mono">alias: {a}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{cmd.description}</p>
        </div>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-muted-foreground">Usage:</span>
          <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-muted">{prefix}{cmd.usage}</code>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            {cmd.permissions.length > 0 ? (
              cmd.permissions.map(p => (
                <Badge key={p} variant="secondary" className="text-[10px] py-0">{p}</Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">Không cần quyền</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Cooldown {cmd.cooldown}s</span>
            {cmd.stats.count > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {cmd.stats.success}
                </span>
                {cmd.stats.fail > 0 && (
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-500" />
                    {cmd.stats.fail}
                  </span>
                )}
                <span>·</span>
                <span className="font-mono">{rate}%</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CommandsSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}
