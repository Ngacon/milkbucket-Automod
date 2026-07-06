import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '1382898536265289809'

export async function GET() {
  // Read from bot's actual reaction_roles table
  const botReactionRoles = await db.$queryRaw<{
    guild_id: string; channel_id: string; message_id: string; role_id: string
    emoji: string; created_at: Date
  }[]>`
    SELECT guild_id, channel_id, message_id, role_id, emoji, created_at
    FROM reaction_roles
    WHERE guild_id = ${GUILD_ID}
    ORDER BY created_at DESC
  `

  const messageMap: Record<string, { messageId: string; channelId: string; items: Array<{
    emoji: string; roleId: string; syncStatus: string
  }> }> = {}
  for (const rr of botReactionRoles) {
    if (!messageMap[rr.message_id]) {
      messageMap[rr.message_id] = { messageId: rr.message_id, channelId: rr.channel_id, items: [] }
    }
    messageMap[rr.message_id].items.push({
      emoji: rr.emoji,
      roleId: rr.role_id,
      syncStatus: 'synced',
    })
  }

  return NextResponse.json({
    reactionRoles: botReactionRoles.map(r => ({
      id: 0,
      messageId: r.message_id,
      channelId: r.channel_id,
      emoji: r.emoji,
      roleId: r.role_id,
      roleName: '',
      revoked: false,
      syncStatus: 'synced',
      createdAt: new Date(r.created_at).toISOString(),
    })),
    messages: Object.values(messageMap).map(m => ({
      messageId: m.messageId,
      channelId: m.channelId,
      count: m.items.length,
      items: m.items,
    })),
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { messageId, channelId, emoji, roleId, roleName } = body
  if (!messageId || !channelId || !emoji || !roleId || !roleName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Write to bot's reaction_roles table via raw SQL and to dashboard table via Prisma
  await db.$executeRaw`
    INSERT INTO reaction_roles (guild_id, channel_id, message_id, role_id, emoji)
    VALUES (${GUILD_ID}, ${channelId}, ${messageId}, ${roleId}, ${emoji})
    ON CONFLICT (message_id, emoji) DO UPDATE SET role_id = EXCLUDED.role_id
  `
  const created = await db.dashboardReactionRole.create({
    data: { guildId: GUILD_ID, messageId, channelId, emoji, roleId, roleName, syncStatus: 'pending' },
  })
  return NextResponse.json({ ok: true, reactionRole: created })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const messageId = searchParams.get('messageId')
  const emoji = searchParams.get('emoji')
  if (!id && !messageId) return NextResponse.json({ error: 'id or messageId required' }, { status: 400 })

  if (messageId && emoji) {
    await db.$executeRaw`DELETE FROM reaction_roles WHERE message_id = ${messageId} AND emoji = ${emoji}`
    await db.dashboardReactionRole.deleteMany({ where: { messageId, emoji } })
  } else if (id) {
    await db.dashboardReactionRole.delete({ where: { id: parseInt(id) } })
  }
  return NextResponse.json({ ok: true })
}
