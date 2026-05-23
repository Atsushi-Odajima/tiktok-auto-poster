import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadVideoToTikTok } from '@/lib/tiktok'

// This endpoint is called by a cron job every minute
export async function GET() {
  const now = new Date()

  // Find posts scheduled to be posted
  const pendingPosts = await prisma.videoPost.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
    include: {
      account: true,
      clip: true,
    },
    take: 10,
  })

  const results = []
  for (const post of pendingPosts) {
    if (!post.clip) continue

    await prisma.videoPost.update({ where: { id: post.id }, data: { status: 'POSTING' } })

    const caption = `${post.caption ?? ''}\n${post.hashtags ?? ''}`
    const result = await uploadVideoToTikTok(
      post.account.accessToken,
      post.clip.path,
      caption,
      post.hashtags ?? ''
    )

    if (result.error) {
      await prisma.videoPost.update({ where: { id: post.id }, data: { status: 'FAILED' } })
      results.push({ id: post.id, status: 'FAILED', error: result.error })
    } else {
      await prisma.videoPost.update({
        where: { id: post.id },
        data: { status: 'POSTED', postedAt: new Date(), tiktokPostId: result.postId },
      })
      results.push({ id: post.id, status: 'POSTED' })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
