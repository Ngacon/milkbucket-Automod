import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '1382898536265289809'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const raw = parseInt(searchParams.get('limit') || '50')
    const limit = Number.isNaN(raw) ? 50 : Math.min(Math.max(raw, 1), 200)

    const [botWarnings, mutes, bans] = await Promise.all([
      type === 'warnings' || type === 'all'
        ? db.$queryRaw<{
            id: number; guild_id: string; user_id: string; moderator_id: string
            reason: string | null; created_at: Date
          }[]>`
            SELECT id::INT, guild_id, user_id, moderator_id, reason, created_at
            FROM warnings
            WHERE guild_id = ${GUILD_ID}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `
        : Promise.resolve([] as Array<{
            id: number; guild_id: string; user_id: string; moderator_id: string
            reason: string | null; created_at: Date
          }>),
      db.mute.findMany({
        where: { guildId: GUILD_ID },
        orderBy: { createdAt: 'desc' },
        take: type === 'mutes' || type === 'all' ? limit : 0,
        include: { user: true },
      }),
      db.ban.findMany({
        where: { guildId: GUILD_ID },
        orderBy: { createdAt: 'desc' },
        take: type === 'bans' || type === 'all' ? limit : 0,
        include: { user: true },
      }),
    ])

    const allModIds = new Set<string>([
      ...botWarnings.map(w => w.moderator_id),
      ...mutes.map(m => m.moderatorId),
      ...bans.map(b => b.moderatorId),
    ])
    const mods = allModIds.size > 0
      ? await db.member.findMany({ where: { id: { in: Array.from(allModIds) } } })
      : []
    const modMap: Record<string, string> = {}
    for (const m of mods) modMap[m.id] = m.displayName || m.username

    return NextResponse.json({
      warnings: botWarnings.map(w => ({
        id: w.id,
        userId: w.user_id,
        userName: w.user_id,
        userAvatar: null,
        moderatorId: w.moderator_id,
        moderatorName: modMap[w.moderator_id] || w.moderator_id,
        reason: w.reason,
        level: 1,
        createdAt: new Date(w.created_at).toISOString(),
      })),
      mutes: mutes.map(m => ({
        id: m.id,
        userId: m.userId,
        userName: m.user?.displayName || m.user?.username || m.userId,
        userAvatar: m.user?.avatarUrl,
        moderatorId: m.moderatorId,
        moderatorName: modMap[m.moderatorId] || m.moderatorId,
        reason: m.reason,
        duration: m.duration,
        active: m.active,
        createdAt: m.createdAt.toISOString(),
        expiresAt: m.expiresAt?.toISOString() || null,
      })),
      bans: bans.map(b => ({
        id: b.id,
        userId: b.userId,
        userName: b.user?.displayName || b.user?.username || b.userId,
        userAvatar: b.user?.avatarUrl,
        moderatorId: b.moderatorId,
        moderatorName: modMap[b.moderatorId] || b.moderatorId,
        reason: b.reason,
        soft: b.soft,
        hackban: b.hackban,
        createdAt: b.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Moderation API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation data', detail: String(error) },
      { status: 500 },
    )
  }
}
