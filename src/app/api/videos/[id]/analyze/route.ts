import { NextResponse } from 'next/server'
import type { RouteContext } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateVideoStrategy } from '@/lib/claude'
import { extractClip, generateThumbnail, getVideoInfo } from '@/lib/ffmpeg'
import path from 'path'
import fs from 'fs'

export const maxDuration = 300

export async function POST(request: Request, ctx: RouteContext<'/api/videos/[id]/analyze'>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  try {
    const sourceVideo = await prisma.sourceVideo.findFirst({
      where: { id },
      include: { theme: true },
    })
    if (!sourceVideo || sourceVideo.theme.userId !== session.userId) {
      return NextResponse.json({ error: '動画が見つかりません' }, { status: 404 })
    }

    // Update status
    await prisma.sourceVideo.update({ where: { id }, data: { status: 'ANALYZING' } })

    // Get accurate duration
    let duration = sourceVideo.duration
    try {
      const info = await getVideoInfo(sourceVideo.path)
      duration = info.duration
      await prisma.sourceVideo.update({ where: { id }, data: { duration } })
    } catch {}

    // Call Claude AI for strategy
    const strategy = await generateVideoStrategy(
      duration,
      sourceVideo.theme.title,
      sourceVideo.theme.description,
      sourceVideo.theme.style,
      sourceVideo.theme.language
    )

    // Save strategy
    await prisma.sourceVideo.update({
      where: { id },
      data: { aiStrategy: JSON.stringify(strategy), status: 'PROCESSING' },
    })

    // Create clips directory
    const clipsDir = path.join(process.cwd(), 'uploads', 'clips')
    const thumbDir = path.join(process.cwd(), 'uploads', 'thumbnails')

    // Process each clip with FFmpeg
    const createdClips = []
    for (let i = 0; i < strategy.clips.length; i++) {
      const clip = strategy.clips[i]
      const clipFilename = `clip_${id}_${i + 1}_${Date.now()}.mp4`
      const clipPath = path.join(clipsDir, clipFilename)
      const thumbFilename = `thumb_${id}_${i + 1}.jpg`
      const thumbPath = path.join(thumbDir, thumbFilename)

      try {
        await extractClip({
          inputPath: sourceVideo.path,
          outputPath: clipPath,
          startTime: clip.startTime,
          duration: clip.endTime - clip.startTime,
          caption: clip.caption,
        })

        // Generate thumbnail
        try {
          await generateThumbnail(clipPath, thumbPath)
        } catch {}

        const dbClip = await prisma.videoClip.create({
          data: {
            sourceVideoId: id,
            filename: clipFilename,
            path: clipPath,
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: clip.endTime - clip.startTime,
            caption: clip.caption,
            hashtags: clip.hashtags.join(' '),
            clipOrder: i + 1,
            status: 'READY',
          },
        })
        createdClips.push(dbClip)
      } catch (clipErr: any) {
        console.error(`Clip ${i + 1} failed:`, clipErr.message)
      }
    }

    await prisma.sourceVideo.update({ where: { id }, data: { status: 'DONE' } })

    return NextResponse.json({ strategy, clips: createdClips })
  } catch (e: any) {
    await prisma.sourceVideo.update({ where: { id }, data: { status: 'FAILED' } }).catch(() => {})
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
