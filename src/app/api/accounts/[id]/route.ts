import { NextResponse } from 'next/server'
import type { RouteContext } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request, ctx: RouteContext<'/api/accounts/[id]'>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  await prisma.tikTokAccount.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request, ctx: RouteContext<'/api/accounts/[id]'>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const { isActive } = await request.json()
  const account = await prisma.tikTokAccount.updateMany({
    where: { id, userId: session.userId },
    data: { isActive },
  })
  return NextResponse.json(account)
}
