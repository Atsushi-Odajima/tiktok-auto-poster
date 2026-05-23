import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import fs from 'fs'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export interface ClipOptions {
  inputPath: string
  outputPath: string
  startTime: number
  duration: number
  caption?: string
}

export interface VideoInfo {
  duration: number
  width: number
  height: number
  size: number
}

/** Get video metadata */
export function getVideoInfo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err)
      const video = metadata.streams.find(s => s.codec_type === 'video')
      const duration = metadata.format.duration ?? 0
      resolve({
        duration,
        width: video?.width ?? 0,
        height: video?.height ?? 0,
        size: metadata.format.size ?? 0,
      })
    })
  })
}

/** Extract a clip from a video, resize to TikTok vertical format (1080x1920) */
export function extractClip(opts: ClipOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(opts.outputPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    let cmd = ffmpeg(opts.inputPath)
      .setStartTime(opts.startTime)
      .setDuration(opts.duration)
      .videoFilters([
        // Scale to fill 1080x1920, crop if necessary
        'scale=1080:1920:force_original_aspect_ratio=increase',
        'crop=1080:1920',
      ])
      .audioCodec('aac')
      .videoBitrate('2000k')
      .fps(30)

    // Add caption overlay if provided
    if (opts.caption) {
      const safeCaption = opts.caption
        .replace(/'/g, "\\'")
        .replace(/:/g, '\\:')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
      cmd = cmd.videoFilters([
        'scale=1080:1920:force_original_aspect_ratio=increase',
        'crop=1080:1920',
        `drawtext=text='${safeCaption}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-200:box=1:boxcolor=black@0.6:boxborderw=10`,
      ])
    }

    cmd
      .output(opts.outputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run()
  })
}

/** Generate thumbnail from video */
export function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['50%'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '540x960',
      })
      .on('end', () => resolve())
      .on('error', reject)
  })
}
