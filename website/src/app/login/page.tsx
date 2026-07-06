'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { DiscordIcon } from '@/components/icons/discord'
import {
  Milk, Loader2, ShieldCheck, Zap, Bot, Smile, Terminal,
  ScrollText, Sparkles, ArrowRight, Server, Globe, Users,
} from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/'
  const error = params.get('error')
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [botStatus, setBotStatus] = useState<{ commandsLoaded?: number } | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/bot-status')
      .then(res => res.json())
      .then(data => setBotStatus(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    getSession().then((session) => {
      if (session) router.replace(callbackUrl)
      else setChecking(false)
    })
  }, [router, callbackUrl])

  useEffect(() => {
    if (error) {
      const messages: Record<string, string> = {
        OAuthSignin: 'Không thể bắt đầu đăng nhập Discord.',
        OAuthCallback: 'Discord từ chối phiên đăng nhập.',
        OAuthCreateAccount: 'Không thể tạo tài khoản.',
        EmailCreateAccount: 'Không thể tạo tài khoản email.',
        Callback: 'Lỗi callback OAuth.',
        AccessDenied: 'Bạn đã từ chối quyền truy cập.',
        Configuration: 'Lỗi cấu hình server. Kiểm tra .env.',
        Verification: 'Token không hợp lệ.',
        default: 'Đăng nhập thất bại, vui lòng thử lại.',
      }
      toast({
        title: 'Đăng nhập thất bại',
        description: messages[error] || messages.default,
        variant: 'destructive',
      })
    }
  }, [error, toast])

  const handleDiscord = async () => {
    setLoading(true)
    try {
      await signIn('discord', { callbackUrl })
    } catch {
      setLoading(false)
      toast({ title: 'Lỗi', description: 'Không thể kết nối Discord', variant: 'destructive' })
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — hero / branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-emerald-700 to-emerald-900">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Big blurred blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col p-12 text-white w-full h-full">
          {/* Top brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Milk className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">milkbucket</div>
              <div className="text-xs text-white/70">Dashboard quản trị v2.4</div>
            </div>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-6 max-w-md -mt-12">
              <h1 className="text-4xl font-bold leading-tight tracking-tight">
                Quản trị server Discord của bạn<br />
                <span className="text-amber-300">đẹp hơn, nhanh hơn.</span>
              </h1>
              <p className="text-white/80 text-base leading-relaxed">
                Dashboard all-in-one cho bot milkbucket — moderation, automod,
                reaction roles, command logs và nhiều hơn nữa, trong một giao diện
                tiếng Việt tinh tế.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { icon: ShieldCheck, label: 'Moderation' },
                  { icon: Bot, label: 'AutoMod' },
                  { icon: Smile, label: 'Reaction Roles' },
                  { icon: Terminal, label: '47 lệnh' },
                  { icon: ScrollText, label: 'Logs realtime' },
                ].map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-medium"
                  >
                    <f.icon className="w-3.5 h-3.5" />
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/15">
            <Stat value={botStatus?.commandsLoaded ? botStatus.commandsLoaded.toString() : '...'} label="Số lệnh" icon={Terminal} />
            <Stat value="vi · en" label="Ngôn ngữ" icon={Globe} />
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Soft background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-72 h-72 rounded-full bg-amber-200/20 blur-3xl" />
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand (visible only on small screens) */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-white shadow-milky-lg mb-3">
              <Milk className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient-emerald">milkbucket</span>
            </h1>
            <p className="text-sm text-muted-foreground">Dashboard quản trị bot Discord</p>
          </div>

          <Card className="shadow-milky-lg border-border/60 overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Đăng nhập bằng tài khoản Discord để tiếp tục
                </p>
              </div>

              <Button
                onClick={handleDiscord}
                disabled={loading}
                className="w-full h-13 py-3.5 bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-milky transition-all hover:shadow-milky-lg hover:-translate-y-0.5 group text-base"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2.5 animate-spin" />
                ) : (
                  <DiscordIcon className="w-5 h-5 mr-2.5" />
                )}
                Đăng nhập với Discord
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>

              {/* Server context */}
              <div className="mt-5 p-3 rounded-lg bg-muted/50 border border-border/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Server className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Server mục tiêu</div>
                  <div className="text-xs font-mono truncate">{process.env.NEXT_PUBLIC_DISCORD_GUILD_ID}</div>
                </div>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Active
                </Badge>
              </div>

              {/* Trust indicators */}
              <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  OAuth2 chính thức
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  Không lưu mật khẩu
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Help note */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chỉ thành viên của server{' '}
              <code className="font-mono text-foreground/80 px-1 py-0.5 rounded bg-muted">
                Milkbucket Community
              </code>{' '}
              mới truy cập được dashboard.
              <br />
              Cần trợ giúp? Liên hệ admin server.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] gap-1">
              <Sparkles className="w-3 h-3" />
              v2.4.1
            </Badge>
            <span>·</span>
            <span>Next.js 16 + NextAuth</span>
            <span>·</span>
            <span>Discord OAuth2</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}



export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
