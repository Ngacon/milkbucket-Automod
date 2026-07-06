import type { NextAuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import CredentialsProvider from 'next-auth/providers/credentials'

const DISCORD_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_SECRET = process.env.DISCORD_CLIENT_SECRET
const ALLOW_DEV = process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_LOGIN === 'true'

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001'

if (!DISCORD_ID || !DISCORD_SECRET) {
  console.warn(
    '[auth] DISCORD_CLIENT_ID hoặc DISCORD_CLIENT_SECRET chưa cấu hình. ' +
    'Đăng nhập Discord sẽ không hoạt động. Vui lòng thiết lập trong .env'
  )
}

const providers: NextAuthOptions['providers'] = [
  DiscordProvider({
    id: 'discord',
    name: 'Discord',
    clientId: DISCORD_ID || 'placeholder',
    clientSecret: DISCORD_SECRET || 'placeholder',
    authorization: {
      params: {
        scope: 'identify guilds',
      },
    },
    profile(profile: {
      id: string
      username: string
      discriminator: string
      avatar: string | null
      global_name?: string | null
      email?: string | null
    }) {
      const avatarUrl = profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${(BigInt(profile.id) >> 22n) % 6n}.png`
      return {
        id: profile.id,
        name: profile.global_name || profile.username,
        username: profile.username,
        discriminator: profile.discriminator,
        image: avatarUrl,
        email: profile.email ?? null,
      }
    },
  }),
]

// Dev-only bypass để test UI khi chưa cấu hình Discord OAuth.
// KHÔNG hiển thị trên UI — chỉ gọi trực tiếp qua signIn('dev-bypass').
if (ALLOW_DEV) {
  providers.push(
    CredentialsProvider({
      id: 'dev-bypass',
      name: 'Dev Bypass',
      credentials: {},
      async authorize() {
        return {
          id: '1382898536265289810',
          name: 'Dashboard Admin',
          username: 'admin',
          email: 'admin@milkbucket.local',
          image: 'https://cdn.discordapp.com/embed/avatars/4.png',
        } as unknown as { id: string }
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'discord' && user?.id) {
        try {
          const res = await fetch(
            `${BOT_API_URL}/api/check-member?userId=${user.id}`
          )
          const data = await res.json()
          if (!data.allowed) return false
        } catch {
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        // @ts-expect-error — custom fields
        token.username = (user as { username?: string }).username ?? null
        // @ts-expect-error
        token.provider = account?.provider ?? 'discord'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error — mở rộng session.user
        session.user.id = token.id
        // @ts-expect-error
        session.user.username = token.username
        // @ts-expect-error
        session.user.provider = token.provider
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
