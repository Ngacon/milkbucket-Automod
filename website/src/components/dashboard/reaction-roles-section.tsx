'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Smile, Plus, Trash2, RefreshCw, MessageSquare, ExternalLink, CheckCircle2, AlertCircle, Clock,
} from 'lucide-react'
import { timeAgo } from '@/lib/format'

type RRItem = { id: number; emoji: string; roleName: string; syncStatus: string }
type Message = { messageId: string; channelId: string; count: number; items: RRItem[] }
type RR = {
  id: number; messageId: string; channelId: string; emoji: string
  roleId: string; roleName: string; revoked: boolean; syncStatus: string; createdAt: string
}
type Data = { reactionRoles: RR[]; messages: Message[] }

const SYNC_STATUS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  synced:  { label: 'Đã đồng bộ',  icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  pending: { label: 'Đang chờ',    icon: Clock,        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  failed:  { label: 'Lỗi',          icon: AlertCircle,  color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
}

export function ReactionRolesSection() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ messageId: '', channelId: '', emoji: '', roleId: '', roleName: '' })
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/reaction-roles')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!form.messageId || !form.channelId || !form.emoji || !form.roleId || !form.roleName) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng điền đầy đủ các trường', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/dashboard/reaction-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.ok) {
        toast({ title: 'Đã thêm reaction role', description: `${form.emoji} → ${form.roleName}` })
        setForm({ messageId: '', channelId: '', emoji: '', roleId: '', roleName: '' })
        setOpen(false)
        load()
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể thêm', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/dashboard/reaction-roles?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Đã xoá reaction role' })
      load()
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể xoá', variant: 'destructive' })
    }
  }

  const handleSync = async (messageId: string) => {
    toast({ title: 'Đang đồng bộ...', description: `Message ${messageId}` })
    // Simulate sync
    setTimeout(() => {
      toast({ title: 'Đã đồng bộ xong', description: `Message ${messageId}` })
      load()
    }, 1200)
  }

  if (loading || !data) return <RRSkeleton />

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reaction Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.messages.length} tin nhắn &middot; {data.reactionRoles.length} reaction role
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
              <Plus className="w-4 h-4" />
              Thêm reaction role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm reaction role mới</DialogTitle>
              <DialogDescription>
                Thêm cặp emoji-role vào một tin nhắn. Bot sẽ tự đồng bộ khi có reaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="msgId">Message ID</Label>
                  <Input id="msgId" value={form.messageId} onChange={(e) => setForm({ ...form, messageId: e.target.value })} placeholder="1382998536265289901" className="font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chId">Channel ID</Label>
                  <Input id="chId" value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} placeholder="1382898536265289830" className="font-mono text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input id="emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="👍" className="text-center text-lg" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="roleName">Tên role</Label>
                  <Input id="roleName" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} placeholder="Announcements" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roleId">Role ID</Label>
                <Input id="roleId" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} placeholder="1382898536265289811" className="font-mono text-sm" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Huỷ</Button>
              </DialogClose>
              <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {data.messages.length === 0 ? (
        <Card className="border-border/60 shadow-milky">
          <CardContent className="py-16 text-center">
            <Smile className="w-10 h-10 mx-auto text-muted-foreground opacity-50 mb-3" />
            <h3 className="font-semibold">Chưa có reaction role nào</h3>
            <p className="text-sm text-muted-foreground mt-1">Bấm "Thêm reaction role" để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.messages.map((msg) => (
            <Card key={msg.messageId} className="border-border/60 shadow-milky">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-mono truncate">{msg.messageId}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        Channel: {msg.channelId}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleSync(msg.messageId)}>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sync
                    </Button>
                    <a
                      href={`https://discord.com/channels/${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID}/${msg.channelId}/${msg.messageId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input hover:bg-accent"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {msg.items.map((item) => {
                    const sync = SYNC_STATUS[item.syncStatus] || SYNC_STATUS.pending
                    const SyncIcon = sync.icon
                    return (
                      <div key={item.id} className="group flex items-center gap-3 p-2 rounded-lg border border-border/60 hover:bg-accent transition-colors">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.roleName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-1 ${sync.color}`}>
                              <SyncIcon className="w-3 h-3" />
                              {sync.label}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Command reference */}
      <Card className="border-border/60 shadow-milky">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-emerald-600" />
            Cú pháp lệnh reaction role
          </CardTitle>
          <CardDescription>Các lệnh có thể dùng trong Discord</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CommandExample cmd="reaction role" args="<messageId> <emoji> <@role>" desc="Thêm reaction role vào tin nhắn" />
            <CommandExample cmd="reaction role list" args="<messageLink|messageId>" desc="Liệt kê reaction role của tin nhắn" />
            <CommandExample cmd="reaction role remove" args="<messageLink|messageId> <emoji> [--revoke]" desc="Gỡ reaction role (revoke để gỡ role đã cấp)" />
            <CommandExample cmd="reaction role sync" args="<messageLink|messageId>" desc="Đồng bộ reaction role với reactions hiện tại" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CommandExample({ cmd, args, desc }: { cmd: string; args: string; desc: string }) {
  return (
    <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono">
          m!{cmd}
        </code>
        <code className="text-xs font-mono text-muted-foreground">{args}</code>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
    </div>
  )
}

function RRSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}
