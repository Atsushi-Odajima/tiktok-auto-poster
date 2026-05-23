import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVideoInfo } from '@/lib/ffmpeg'
import path from 'path'
import fs from 'fs'
import { cuid } from '@/lib/cuid'

export const maxDuration = 300 // 5 min timeout

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('video') as File | null
    const themeId = formData.get('themeId') as string

    if (!file || !themeId) {
      return NextResponse.json({ error: '動画ファイルとテーマIDは必須です' }, { status: 400 })
    }

    // Validate theme belongs to user
    const theme = await prisma.theme.findFirst({ where: { id: themeId, userId: session.userId } })
    if (!theme) return NextResponse.json({ error: 'テーマが見つかりません' }, { status: 404 })

    // Save file to disk
    const uploadDir = path.join(process.cwd(), 'uploads', 'videos')
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

    const ext = path.extname(file.name) || '.mp4'
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
    const filePath = path.join(uploadDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    // Get video metadata
    let duration = 0
    try {
      const info = await getVideoInfo(filePath)
      duration = info.duration
    } catch {
      // FFmpeg might not be able to read metadata for all formats
    }

    const sourceVideo = await prisma.sourceVideo.create({
      data: {
        themeId,
        filename,
        originalName: file.name,
        path: filePath,
        duration,
        size: buffer.length,
        status: 'UPLOADED',
      },
    })

    return NextResponse.json(sourceVideo)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
