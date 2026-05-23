import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const themes = await prisma.theme.findMany({
    where: { userId: session.userId },
    include: { _count: { select: { sourceVideos: true, posts: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(themes)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, description, style, language } = await request.json()
  if (!title || !description) {
    return NextResponse.json({ error: 'タイトルと説明は必須です' }, { status: 400 })
  }
  const theme = await prisma.theme.create({
    data: { userId: session.userId, title, description, style: style ?? 'educational', language: language ?? 'ja' },
  })
  return NextResponse.json(theme)
}
