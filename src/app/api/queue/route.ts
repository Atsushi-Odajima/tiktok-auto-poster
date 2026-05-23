import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const posts = await prisma.videoPost.findMany({
    where: {
      theme: { userId: session.userId },
      ...(status ? { status } : {}),
    },
    include: {
      account: { select: { username: true, displayName: true, avatarUrl: true } },
      theme: { select: { title: true } },
      clip: { select: { filename: true, duration: true, clipOrder: true } },
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { clipId, accountId, scheduledAt } = await request.json()

  const clip = await prisma.videoClip.findFirst({
    where: { id: clipId },
    include: { sourceVideo: { include: { theme: true } } },
  })
  if (!clip || clip.sourceVideo.theme.userId !== session.userId) {
    return NextResponse.json({ error: 'クリップが見つかりません' }, { status: 404 })
  }

  const post = await prisma.videoPost.create({
    data: {
      themeId: clip.sourceVideo.themeId,
      accountId,
      clipId,
      caption: clip.caption,
      hashtags: clip.hashtags,
      status: scheduledAt ? 'SCHEDULED' : 'PENDING',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  })
  return NextResponse.json(post)
}
