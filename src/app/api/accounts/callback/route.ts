import { NextResponse } from 'next/server'
import type { RouteContext } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exchangeCodeForToken, getTikTokUserInfo } from '@/lib/tiktok'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/accounts?error=oauth_failed', request.url))
  }

  const userId = state.split('_')[0]

  try {
    const tokenData = await exchangeCodeForToken(code)
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/accounts?error=token_failed', request.url))
    }

    const userInfo = await getTikTokUserInfo(tokenData.access_token)
    const tiktokUser = userInfo.data?.user

    const expiryDate = new Date(Date.now() + (tokenData.expires_in ?? 86400) * 1000)

    await prisma.tikTokAccount.upsert({
      where: { openId: tiktokUser.open_id },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? '',
        tokenExpiry: expiryDate,
        displayName: tiktokUser.display_name,
        avatarUrl: tiktokUser.avatar_url,
        username: tiktokUser.username ?? tiktokUser.display_name,
      },
      create: {
        userId,
        openId: tiktokUser.open_id,
        username: tiktokUser.username ?? tiktokUser.display_name,
        displayName: tiktokUser.display_name,
        avatarUrl: tiktokUser.avatar_url,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? '',
        tokenExpiry: expiryDate,
      },
    })

    return NextResponse.redirect(new URL('/accounts?success=connected', request.url))
  } catch (e: any) {
    console.error('OAuth callback error:', e)
    return NextResponse.redirect(new URL('/accounts?error=server_error', request.url))
  }
}
