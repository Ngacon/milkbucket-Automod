import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '1382898536265289809'

export async function GET() {
  const guild = await db.guild.findUnique({ where: { id: GUILD_ID } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  return NextResponse.json({
    id: guild.id,
    name: guild.name,
    prefix: guild.prefix,
    language: guild.language,
    ownerId: guild.ownerId,
    logChannelId: guild.logChannelId,
    memberCount: guild.memberCount,
    channelCount: guild.channelCount,
    roleCount: guild.roleCount,
    joinedAt: guild.joinedAt.toISOString(),
    iconUrl: guild.iconUrl,
  })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { prefix, language, logChannelId } = body

  const data: Record<string, unknown> = {}
  if (typeof prefix === 'string' && prefix.length > 0 && prefix.length <= 4) data.prefix = prefix
  if (language === 'vi' || language === 'en') data.language = language
  if (typeof logChannelId === 'string') data.logChannelId = logChannelId || null

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await db.guild.update({ where: { id: GUILD_ID }, data })
  return NextResponse.json({
    ok: true,
    guild: {
      prefix: updated.prefix,
      language: updated.language,
      logChannelId: updated.logChannelId,
    },
  })
}
