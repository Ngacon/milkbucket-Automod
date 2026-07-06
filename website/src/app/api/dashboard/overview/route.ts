import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '1382898536265289809'

export async function GET() {
  const guild = await db.guild.findUnique({ where: { id: GUILD_ID } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  const [warningCount, muteCount, activeMuteCount, banCount, automodEventCount, commandLogCount, memberCount, botWarningCount, reactionRoleCount, badWordCount] = await Promise.all([
    db.dashboardWarning.count({ where: { guildId: GUILD_ID } }),
    db.mute.count({ where: { guildId: GUILD_ID } }),
    db.mute.count({ where: { guildId: GUILD_ID, active: true } }),
    db.ban.count({ where: { guildId: GUILD_ID } }),
    db.autoModEvent.count({ where: { guildId: GUILD_ID } }),
    db.commandLog.count({ where: { guildId: GUILD_ID } }),
    db.member.count({ where: { guildId: GUILD_ID } }),
    db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::INT as count FROM warnings WHERE guild_id = ${GUILD_ID}`,
    db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::INT as count FROM reaction_roles WHERE guild_id = ${GUILD_ID}`,
    db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::INT as count FROM automod_words WHERE guild_id = ${GUILD_ID}`,
  ])

  const totalWarnings = warningCount + Number(botWarningCount[0]?.count || 0)
  const totalReactionRoles = Number(reactionRoleCount[0]?.count || 0)
  const totalBadWords = Number(badWordCount[0]?.count || 0)

  const commandLogs = await db.commandLog.findMany({
    where: { guildId: GUILD_ID, createdAt: { gte: new Date(Date.now() - 14 * 86400000) } },
    select: { category: true, createdAt: true },
  })
  const categoryCounts: Record<string, number> = {}
  for (const log of commandLogs) {
    categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1
  }

  const dayBuckets: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    dayBuckets.push({ date: key, count: 0 })
  }
  for (const log of commandLogs) {
    const key = log.createdAt.toISOString().slice(0, 10)
    const bucket = dayBuckets.find(b => b.date === key)
    if (bucket) bucket.count++
  }

  const topCommandsMap: Record<string, number> = {}
  const allLogs = await db.commandLog.findMany({ where: { guildId: GUILD_ID }, select: { commandName: true } })
  for (const log of allLogs) {
    topCommandsMap[log.commandName] = (topCommandsMap[log.commandName] || 0) + 1
  }
  const topCommands = Object.entries(topCommandsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  const [recentWarnings, recentMutes, recentBans, recentAutomod, recentCommands] = await Promise.all([
    db.dashboardWarning.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 5, include: { user: true } }),
    db.mute.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 5, include: { user: true } }),
    db.ban.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 5, include: { user: true } }),
    db.autoModEvent.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 5 }),
    db.commandLog.findMany({ where: { guildId: GUILD_ID }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  type Activity = { id: string; type: string; description: string; user: string; createdAt: Date }
  const activity: Activity[] = []
  for (const w of recentWarnings) activity.push({ id: `w-${w.id}`, type: 'warning', description: w.reason, user: w.user?.displayName || w.userId, createdAt: w.createdAt })
  for (const m of recentMutes) activity.push({ id: `m-${m.id}`, type: 'mute', description: m.reason, user: m.user?.displayName || m.userId, createdAt: m.createdAt })
  for (const b of recentBans) activity.push({ id: `b-${b.id}`, type: b.soft ? 'softban' : (b.hackban ? 'hackban' : 'ban'), description: b.reason, user: b.user?.displayName || b.userId, createdAt: b.createdAt })
  for (const a of recentAutomod) activity.push({ id: `a-${a.id}`, type: 'automod', description: `[${a.feature}] ${a.content.slice(0, 60)}`, user: a.username, createdAt: a.createdAt })
  for (const c of recentCommands) activity.push({ id: `c-${c.id}`, type: 'command', description: `${c.commandName}${c.args ? ' ' + c.args : ''}`, user: c.username, createdAt: c.createdAt })
  activity.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const recentActivity = activity.slice(0, 12).map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }))

  const warningsWithUser = await db.dashboardWarning.findMany({ where: { guildId: GUILD_ID }, include: { user: true } })
  const warnedUsersMap: Record<string, { count: number; name: string }> = {}
  for (const w of warningsWithUser) {
    const key = w.userId
    if (!warnedUsersMap[key]) warnedUsersMap[key] = { count: 0, name: w.user?.displayName || w.userId }
    warnedUsersMap[key].count++
  }
  const topWarnedUsers = Object.entries(warnedUsersMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))

  return NextResponse.json({
    guild,
    stats: {
      warnings: totalWarnings,
      mutes: muteCount,
      activeMutes: activeMuteCount,
      bans: banCount,
      automodEvents: automodEventCount,
      commandLogs: commandLogCount,
      reactionRoles: totalReactionRoles,
      badWords: totalBadWords,
      members: memberCount,
    },
    categoryCounts,
    dayBuckets,
    topCommands,
    recentActivity,
    topWarnedUsers,
  })
}
