'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ThemeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [theme, setTheme] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [scheduleModal, setScheduleModal] = useState<{ clip: any; accountId: string } | null>(null)

  useEffect(() => {
    fetch(`/api/themes/${params.id}`).then(r => r.json()).then(setTheme)
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [params.id])

  async function uploadVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('video', file)
    fd.append('themeId', params.id as string)
    const res = await fetch('/api/videos/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) {
      setTheme((t: any) => ({ ...t, sourceVideos: [data, ...(t.sourceVideos ?? [])] }))
    } else {
      alert('アップロードに失敗しました: ' + data.error)
    }
    setUploading(false)
    e.target.value = ''
  }

  async function analyzeVideo(videoId: string) {
    setAnalyzing(videoId)
    const res = await fetch(`/api/videos/${videoId}/analyze`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      // Refresh theme data
      const updated = await fetch(`/api/themes/${params.id}`).then(r => r.json())
      setTheme(updated)
    } else {
      alert('分析に失敗しました: ' + data.error)
    }
    setAnalyzing(null)
  }

  async function scheduleClip(clip: any, accountId: string, scheduledAt?: string) {
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clipId: clip.id, accountId, scheduledAt }),
    })
    if (res.ok) {
      alert('キューに追加しました！')
      setScheduleModal(null)
    }
  }

  if (!theme) return <div className="p-6 text-gray-400">読み込み中...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => router.push('/themes')} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1">
        ← テーマ一覧
      </button>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
        <h1 className="text-2xl font-bold">{theme.title}</h1>
        <p className="text-gray-400 text-sm mt-1">{theme.description}</p>
        <div className="flex gap-3 mt-3 text-xs text-gray-500">
          <span>スタイル: {theme.style}</span>
          <span>言語: {theme.language === 'ja' ? '🇯🇵 日本語' : '🇺🇸 English'}</span>
        </div>
      </div>

      {/* Video Upload */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">元動画をアップロード</h2>
          <label className={`cursor-pointer bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold px-4 py-2 rounded-lg text-sm ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}>
            {uploading ? 'アップロード中...' : '📹 動画を選択'}
            <input type="file" accept="video/*" onChange={uploadVideo} disabled={uploading} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-gray-500">動画をアップロードするとAIが自動で最適なクリップに分割します（MP4, MOV対応）</p>
      </div>

      {/* Source Videos */}
      <div className="space-y-4">
        {theme.sourceVideos?.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-dashed border-gray-700 p-12 text-center">
            <div className="text-4xl mb-3">📹</div>
            <p className="text-gray-400 text-sm">元動画がまだありません</p>
            <p className="text-gray-500 text-xs mt-1">動画をアップロードするとAIが分析します</p>
          </div>
        )}

        {theme.sourceVideos?.map((video: any) => (
          <div key={video.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Video Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{video.originalName}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {video.duration > 0 ? `${video.duration.toFixed(1)}秒` : '不明'} · {(video.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  video.status === 'DONE' ? 'bg-green-500/20 text-green-400' :
                  video.status === 'PROCESSING' || video.status === 'ANALYZING' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
                  video.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-700 text-gray-400'
                }`}>{video.status}</span>
                {(video.status === 'UPLOADED' || video.status === 'FAILED') && (
                  <button onClick={() => analyzeVideo(video.id)} disabled={analyzing === video.id}
                    className="bg-pink-500/20 hover:bg-pink-500/40 text-pink-400 px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50">
                    {analyzing === video.id ? '🤖 AI分析中...' : '🤖 AIで分析・分割'}
                  </button>
                )}
              </div>
            </div>

            {/* AI Strategy */}
            {video.aiStrategy && (() => {
              try {
                const strategy = JSON.parse(video.aiStrategy)
                return (
                  <div className="px-4 py-3 bg-pink-500/5 border-b border-gray-800">
                    <div className="text-xs text-pink-400 font-medium mb-1">🤖 AI戦略</div>
                    <p className="text-xs text-gray-300">{strategy.overallStrategy}</p>
                    <p className="text-xs text-gray-500 mt-1">推奨投稿頻度: {strategy.recommendedPostingFrequency}</p>
                  </div>
                )
              } catch { return null }
            })()}

            {/* Clips */}
            {video.clips?.length > 0 && (
              <div className="p-4">
                <div className="text-xs text-gray-400 mb-3 font-medium">生成されたクリップ ({video.clips.length}本)</div>
                <div className="space-y-2">
                  {video.clips.map((clip: any) => (
                    <div key={clip.id} className="bg-gray-800 rounded-lg p-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-pink-400 flex-shrink-0">
                        {clip.clipOrder}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-300 mb-1">
                          ⏱️ {clip.startTime.toFixed(1)}s → {clip.endTime.toFixed(1)}s ({clip.duration.toFixed(1)}s)
                        </div>
                        {clip.caption && <p className="text-sm mb-1">{clip.caption}</p>}
                        {clip.hashtags && <p className="text-xs text-cyan-400">{clip.hashtags}</p>}
                      </div>
                      <div className="flex-shrink-0">
                        {accounts.length > 0 && clip.status === 'READY' ? (
                          <button onClick={() => setScheduleModal({ clip, accountId: accounts[0].id })}
                            className="bg-pink-500/20 hover:bg-pink-500/40 text-pink-400 px-2 py-1 rounded text-xs transition-colors">
                            予約 →
                          </button>
                        ) : accounts.length === 0 ? (
                          <span className="text-xs text-gray-500">アカウント必要</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-sm">
            <h3 className="font-bold mb-4">投稿を予約</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">投稿アカウント</label>
                <select value={scheduleModal.accountId}
                  onChange={e => setScheduleModal(s => s ? { ...s, accountId: e.target.value } : null)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  {accounts.map(a => <option key={a.id} value={a.id}>@{a.username}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scheduleClip(scheduleModal.clip, scheduleModal.accountId)}
                className="flex-1 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold py-2 rounded-lg text-sm">
                今すぐキューに追加
              </button>
              <button onClick={() => setScheduleModal(null)}
                className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-gray-400">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
