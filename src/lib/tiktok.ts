import fs from 'fs'
import path from 'path'

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2'

export function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY ?? '',
    redirect_uri: process.env.TIKTOK_CALLBACK_URL ?? '',
    response_type: 'code',
    scope: 'user.info.basic,video.upload,video.publish',
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
}

export async function exchangeCodeForToken(code: string) {
  const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_CALLBACK_URL ?? '',
    }),
  })
  return resp.json()
}

export async function refreshAccessToken(refreshToken: string) {
  const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  return resp.json()
}

export async function getTikTokUserInfo(accessToken: string) {
  const resp = await fetch(
    `${TIKTOK_API_BASE}/user/info/?fields=open_id,union_id,avatar_url,display_name,username`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  return resp.json()
}

/** Upload a video to TikTok using FILE_UPLOAD method */
export async function uploadVideoToTikTok(
  accessToken: string,
  videoPath: string,
  caption: string,
  hashtags: string
): Promise<{ postId?: string; error?: string }> {
  try {
    // Step 1: Initialize upload
    const initResp = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: fs.statSync(videoPath).size,
          chunk_size: fs.statSync(videoPath).size,
          total_chunk_count: 1,
        },
      }),
    })

    const initData = await initResp.json()
    if (initData.error?.code !== 'ok') {
      return { error: initData.error?.message ?? 'Init failed' }
    }

    const { publish_id, upload_url } = initData.data

    // Step 2: Upload video file
    const videoBuffer = fs.readFileSync(videoPath)
    const uploadResp = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
        'Content-Length': videoBuffer.length.toString(),
      },
      body: videoBuffer,
    })

    if (!uploadResp.ok) {
      return { error: `Upload failed: ${uploadResp.status}` }
    }

    return { postId: publish_id }
  } catch (e: any) {
    return { error: e.message }
  }
}

/** Check the status of a TikTok post */
export async function checkPostStatus(accessToken: string, publishId: string) {
  const resp = await fetch(`${TIKTOK_API_BASE}/post/publish/status/fetch/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({ publish_id: publishId }),
  })
  return resp.json()
}
