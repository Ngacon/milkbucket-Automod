import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '1382898536265289809'

export async function GET() {
  const [configs, events] = await Promise.all([
    db.autoModConfig.findMany({ where: { guildId: GUILD_ID } }),
    db.autoModEvent.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ])

  // Read bad words from bot's actual automod_words table
  const botBadWords = await db.$queryRaw<{
    guild_id: string; word: string; created_at: Date
  }[]>`
    SELECT guild_id, word, created_at
    FROM automod_words
    WHERE guild_id = ${GUILD_ID}
    ORDER BY created_at DESC
  `

  const eventCountsByFeature: Record<string, number> = {}
  for (const e of events) {
    eventCountsByFeature[e.feature] = (eventCountsByFeature[e.feature] || 0) + 1
  }

  const allEvents = await db.autoModEvent.findMany({ where: { guildId: GUILD_ID } })
  const userMap: Record<string, { count: number; name: string }> = {}
  for (const e of allEvents) {
    if (!userMap[e.userId]) userMap[e.userId] = { count: 0, name: e.username }
    userMap[e.userId].count++
  }
  const topOffenders = Object.entries(userMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))

  return NextResponse.json({
    configs: configs.map(c => ({
      id: c.id,
      feature: c.feature,
      enabled: c.enabled,
      threshold: c.threshold,
      action: c.action,
      warnLimit: c.warnLimit,
    })),
    badWords: botBadWords.map((w, i) => ({
      id: i + 1,
      word: w.word,
      severity: 'medium',
      createdAt: new Date(w.created_at).toISOString(),
    })),
    events: events.map(e => ({
      id: e.id,
      feature: e.feature,
      userId: e.userId,
      username: e.username,
      action: e.action,
      content: e.content,
      createdAt: e.createdAt.toISOString(),
    })),
    eventCountsByFeature,
    topOffenders,
    totalEvents: allEvents.length,
  })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { feature, enabled } = body as { feature: string; enabled: boolean }
  if (!feature) return NextResponse.json({ error: 'feature required' }, { status: 400 })

  const updated = await db.autoModConfig.update({
    where: { guildId_feature: { guildId: GUILD_ID, feature } },
    data: { enabled },
  })
  return NextResponse.json({ ok: true, config: updated })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { action, word, severity } = body as { action: 'add' | 'remove'; word: string; severity?: string }
  if (!word) return NextResponse.json({ error: 'word required' }, { status: 400 })

  if (action === 'add') {
    // Write to both dashboard_badwords via Prisma AND bot's automod_words via raw SQL
    await db.$executeRaw`INSERT INTO automod_words (guild_id, word) VALUES (${GUILD_ID}, ${word.toLowerCase()}) ON CONFLICT (guild_id, word) DO NOTHING`
    const created = await db.dashboardBadWord.create({
      data: { guildId: GUILD_ID, word: word.toLowerCase(), severity: severity || 'medium' },
    })
    return NextResponse.json({ ok: true, badWord: created })
  } else {
    await db.$executeRaw`DELETE FROM automod_words WHERE guild_id = ${GUILD_ID} AND word = ${word.toLowerCase()}`
    await db.dashboardBadWord.deleteMany({ where: { guildId: GUILD_ID, word: word.toLowerCase() } })
    return NextResponse.json({ ok: true })
  }
}
