'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Save, Crown, Hash, Languages, KeyRound, Bell, ShieldAlert, Info,
} from 'lucide-react'

type Settings = {
  id: string
  name: string
  prefix: string
  language: string
  ownerId: string
  logChannelId: string | null
  memberCount: number
  channelCount: number
  roleCount: number
  joinedAt: string
  iconUrl: string | null
}

export function SettingsSection() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{ prefix: string; language: string; logChannelId: string }>({
    prefix: 'm!', language: 'vi', logChannelId: '',
  })
  const [enableLogChannel, setEnableLogChannel] = useState(false)
  const [ownerIds, setOwnerIds] = useState('1382898536265289810,201005938472939521')
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/settings')
      const json = await res.json()
      setSettings(json)
      setForm({
        prefix: json.prefix,
        language: json.language,
        logChannelId: json.logChannelId || '',
      })
      setEnableLogChannel(!!json.logChannelId)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        prefix: form.prefix,
        language: form.language,
        logChannelId: enableLogChannel ? form.logChannelId : '',
      }
      const res = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.ok) {
        toast({ title: 'Đã lưu cài đặt', description: 'Cấu hình server đã được cập nhật' })
        load()
      } else {
        toast({ title: 'Lỗi', description: json.error || 'Không thể lưu', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể kết nối', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) return <SettingsSkeleton />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cấu hình bot cho server {settings.name}
        </p>
      </div>

      {/* Prefix & language */}
      <Card className="border-border/60 shadow-milky">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            Lệnh & Ngôn ngữ
          </CardTitle>
          <CardDescription>Cấu hình prefix và locale cho bot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                maxLength={4}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Tối đa 4 ký tự. Mặc định: m!</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="language">Ngôn ngữ</Label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">
                    <span className="flex items-center gap-2">
                      <Languages className="w-3.5 h-3.5" /> Tiếng Việt
                    </span>
                  </SelectItem>
                  <SelectItem value="en">
                    <span className="flex items-center gap-2">
                      <Languages className="w-3.5 h-3.5" /> English
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Đổi ngôn ngữ phản hồi của bot</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
            <Info className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="text-xs text-muted-foreground">
              Bot cũng hỗ trợ prefix mặc định <code className="px-1 py-0.5 rounded bg-muted font-mono">m?</code> ngoài prefix tùy chỉnh.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log channel */}
      <Card className="border-border/60 shadow-milky">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            Kênh log
          </CardTitle>
          <CardDescription>Ghi lại các sự kiện moderation và automod</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="logEnabled" className="text-sm font-medium">Bật log channel</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Gửi sự kiện moderation vào kênh được chỉ định</p>
            </div>
            <Switch
              id="logEnabled"
              checked={enableLogChannel}
              onCheckedChange={setEnableLogChannel}
            />
          </div>
          {enableLogChannel && (
            <div className="space-y-1.5">
              <Label htmlFor="logChannelId">Channel ID</Label>
              <Input
                id="logChannelId"
                value={form.logChannelId}
                onChange={(e) => setForm({ ...form, logChannelId: e.target.value })}
                placeholder="1382898536265289820"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Click chuột phải vào kênh &rarr; Copy ID</p>
            </div>
          )}
          {settings.logChannelId && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="w-3.5 h-3.5" />
              Đang dùng: <code className="font-mono">{settings.logChannelId}</code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owner IDs (AutoMod protection) */}
      <Card className="border-border/60 shadow-milky">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Bảo vệ AutoMod
          </CardTitle>
          <CardDescription>
            Chỉ owner server hoặc các ID dưới đây mới đổi được cấu hình AutoMod
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ownerIds">BOT_OWNER_IDS</Label>
            <Input
              id="ownerIds"
              value={ownerIds}
              onChange={(e) => setOwnerIds(e.target.value)}
              placeholder="123456789012345678,987654321098765432"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Phân tách bằng dấu phẩy. Lưu vào file <code className="font-mono">.env</code> của bot.</p>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              Lệnh bị bảo vệ: <code className="font-mono">automod enable</code>, <code className="font-mono">anticaps</code>, <code className="font-mono">antispam</code>, <code className="font-mono">antilink</code>, <code className="font-mono">antimention</code>, <code className="font-mono">addword</code>, <code className="font-mono">delword</code>, <code className="font-mono">automod setwarn</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server info */}
      <Card className="border-border/60 shadow-milky">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            Thông tin server
          </CardTitle>
          <CardDescription>Thông tin cơ bản về server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Tên server" value={settings.name} />
          <InfoRow label="Server ID" value={<code className="font-mono text-xs">{settings.id}</code>} />
          <InfoRow label="Owner ID" value={<code className="font-mono text-xs">{settings.ownerId}</code>} />
          <InfoRow label="Thành viên" value={settings.memberCount.toLocaleString('vi-VN')} />
          <InfoRow label="Kênh" value={settings.channelCount} />
          <InfoRow label="Role" value={settings.roleCount} />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end gap-2 bg-background/80 backdrop-blur p-3 rounded-lg border border-border/60 shadow-milky">
        <Button variant="outline" onClick={load} disabled={saving}>Hủy</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
