import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [accounts, themes, postStats, recentPosts] = await Promise.all([
    prisma.tikTokAccount.count({ where: { userId: session.userId } }),
    prisma.theme.count({ where: { userId: session.userId } }),
    prisma.videoPost.groupBy({
      by: ['status'],
      where: { theme: { userId: session.userId } },
      _count: true,
    }),
    prisma.videoPost.findMany({
      where: { theme: { userId: session.userId } },
      include: {
        account: { select: { username: true } },
        theme: { select: { title: true } },
        clip: { select: { duration: true, clipOrder: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const stats = Object.fromEntries(postStats.map(s => [s.status, s._count]))

  return NextResponse.json({ accounts, themes, stats, recentPosts })
}
