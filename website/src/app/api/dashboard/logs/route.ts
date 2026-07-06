import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '1382898536265289809'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const success = searchParams.get('success')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '100')

  const where: Record<string, unknown> = { guildId: GUILD_ID }
  if (category) where.category = category
  if (success === 'true') where.success = true
  if (success === 'false') where.success = false
  if (search) where.commandName = { contains: search }

  const logs = await db.commandLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    logs: logs.map(l => ({
      id: l.id,
      commandName: l.commandName,
      category: l.category,
      userId: l.userId,
      username: l.username,
      args: l.args,
      success: l.success,
      durationMs: l.durationMs,
      createdAt: l.createdAt.toISOString(),
    })),
    total: logs.length,
  })
}
