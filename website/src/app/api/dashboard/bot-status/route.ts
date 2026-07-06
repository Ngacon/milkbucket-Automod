import { NextResponse } from 'next/server'

// Simulated bot runtime status. In production, the milkbucket bot would
// expose this via an authenticated endpoint or shared Redis key.
export async function GET() {
  try {
    const url = process.env.BOT_API_URL || 'http://localhost:3001'
    const res = await fetch(`${url}/api/status`, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ online: false }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ online: false, error: 'Cannot connect to bot API' }, { status: 500 })
  }
}
