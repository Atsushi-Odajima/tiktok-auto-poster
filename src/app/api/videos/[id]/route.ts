import { NextResponse } from 'next/server'
import type { RouteContext } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, ctx: RouteContext<'/api/videos/[id]'>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const video = await prisma.sourceVideo.findFirst({
    where: { id },
    include: {
      theme: true,
      clips: { orderBy: { clipOrder: 'asc' } },
    },
  })
  if (!video || video.theme.userId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(video)
}

export async function DELETE(request: Request, ctx: RouteContext<'/api/videos/[id]'>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const video = await prisma.sourceVideo.findFirst({
    where: { id },
    include: { theme: true },
  })
  if (!video || video.theme.userId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await prisma.sourceVideo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
