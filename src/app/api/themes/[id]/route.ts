import { NextResponse } from 'next/server'
import type { RouteContext } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, ctx: RouteContext<'/api/themes/[id]'>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const theme = await prisma.theme.findFirst({
    where: { id, userId: session.userId },
    include: {
      sourceVideos: {
        include: { clips: { orderBy: { clipOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!theme) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(theme)
}

export async function DELETE(request: Request, ctx: RouteContext<'/api/themes/[id]'>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  await prisma.theme.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}
