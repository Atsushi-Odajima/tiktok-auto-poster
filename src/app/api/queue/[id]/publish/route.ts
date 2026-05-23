import { NextResponse } from 'next/server'
import type { RouteContext } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadVideoToTikTok } from '@/lib/tiktok'

export async function POST(request: Request, ctx: RouteContext<'/api/queue/[id]/publish'>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params

  const post = await prisma.videoPost.findFirst({
    where: { id },
    include: {
      account: true,
      clip: true,
      theme: true,
    },
  })

  if (!post || post.theme.userId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!post.clip) {
    return NextResponse.json({ error: 'クリップが見つかりません' }, { status: 400 })
  }

  await prisma.videoPost.update({ where: { id }, data: { status: 'POSTING' } })

  const caption = `${post.caption ?? ''}\n${post.hashtags ?? ''}`
  const result = await uploadVideoToTikTok(
    post.account.accessToken,
    post.clip.path,
    caption,
    post.hashtags ?? ''
  )

  if (result.error) {
    await prisma.videoPost.update({ where: { id }, data: { status: 'FAILED' } })
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  await prisma.videoPost.update({
    where: { id },
    data: { status: 'POSTED', postedAt: new Date(), tiktokPostId: result.postId },
  })

  return NextResponse.json({ ok: true, postId: result.postId })
}
