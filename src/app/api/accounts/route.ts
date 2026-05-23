import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTikTokAuthUrl } from '@/lib/tiktok'

// GET: list accounts
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const accounts = await prisma.tikTokAccount.findMany({
    where: { userId: session.userId },
    select: { id: true, username: true, displayName: true, avatarUrl: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(accounts)
}

// POST: get TikTok OAuth URL
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const state = `${session.userId}_${Date.now()}`
  const url = getTikTokAuthUrl(state)
  return NextResponse.json({ url })
}
