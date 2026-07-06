import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '1382898536265289809'

export async function GET() {
  const guild = await db.guild.findUnique({ where: { id: GUILD_ID } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  const [recentWarnings, recentMutes, recentBans, recentAutomod, recentCommands] = await Promise.all([
    db.dashboardWarning.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: true } }),
    db.mute.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: true } }),
    db.ban.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: true } }),
    db.autoModEvent.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 10 }),
    db.commandLog.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ])

  const activity: { id: string; type: string; description: string; user: string; createdAt: string }[] = []
  for (const w of recentWarnings) activity.push({ id: `w-${w.id}`, type: 'warning', description: w.reason, user: w.user?.displayName || w.userId, createdAt: w.createdAt.toISOString() })
  for (const m of recentMutes) activity.push({ id: `m-${m.id}`, type: 'mute', description: m.reason, user: m.user?.displayName || m.userId, createdAt: m.createdAt.toISOString() })
  for (const b of recentBans) activity.push({ id: `b-${b.id}`, type: b.soft ? 'softban' : (b.hackban ? 'hackban' : 'ban'), description: b.reason, user: b.user?.displayName || b.userId, createdAt: b.createdAt.toISOString() })
  for (const a of recentAutomod) activity.push({ id: `a-${a.id}`, type: 'automod', description: `[${a.feature}] ${a.content.slice(0, 80)}`, user: a.username, createdAt: a.createdAt.toISOString() })
  for (const c of recentCommands) activity.push({ id: `c-${c.id}`, type: 'command', description: `${c.commandName}${c.args ? ' ' + c.args : ''}`, user: c.username, createdAt: c.createdAt.toISOString() })

  activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ activity: activity.slice(0, 20) })
}
