'use client'
import { useEffect, useState } from 'react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: '待機中', color: 'bg-gray-700 text-gray-300' },
  SCHEDULED: { label: '予約済み', color: 'bg-yellow-500/20 text-yellow-400' },
  POSTING:   { label: '投稿中', color: 'bg-blue-500/20 text-blue-400 animate-pulse' },
  POSTED:    { label: '投稿済み', color: 'bg-green-500/20 text-green-400' },
  FAILED:    { label: '失敗', color: 'bg-red-500/20 text-red-400' },
}

export default function QueuePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('')
  const [publishing, setPublishing] = useState<string | null>(null)

  useEffect(() => {
    const url = filter ? `/api/queue?status=${filter}` : '/api/queue'
    fetch(url).then(r => r.json()).then(setPosts)
  }, [filter])

  async function publishNow(id: string) {
    if (!confirm('今すぐTikTokに投稿しますか？')) return
    setPublishing(id)
    const res = await fetch(`/api/queue/${id}/publish`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setPosts(p => p.map(post => post.id === id ? { ...post, status: 'POSTED' } : post))
    } else {
      alert('投稿に失敗しました: ' + data.error)
    }
    setPublishing(null)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">投稿キュー</h1>
        <p className="text-gray-400 text-sm mt-1">スケジュール済みの動画投稿を管理</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['', '全て'], ...Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.label])].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${filter === val ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {posts.length === 0
        ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 text-sm">キューにアイテムがありません</p>
            <p className="text-gray-500 text-xs mt-1">テーマページからクリップを追加してください</p>
          </div>
        )
        : (
          <div className="space-y-3">
            {posts.map((post: any) => {
              const st = STATUS_LABELS[post.status] ?? STATUS_LABELS.PENDING
              return (
                <div key={post.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      🎵
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{post.theme?.title}</span>
                        <span className="text-xs text-gray-400">クリップ #{post.clip?.clipOrder}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      {post.caption && <p className="text-sm text-gray-300 mt-1 line-clamp-2">{post.caption}</p>}
                      {post.hashtags && <p className="text-xs text-cyan-400 mt-1">{post.hashtags}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>@{post.account?.username}</span>
                        {post.scheduledAt && <span>⏰ {new Date(post.scheduledAt).toLocaleString('ja-JP')}</span>}
                        {post.postedAt && <span>✅ {new Date(post.postedAt).toLocaleString('ja-JP')}</span>}
                        {post.clip?.duration && <span>⏱️ {post.clip.duration.toFixed(1)}s</span>}
                      </div>
                      {post.status === 'POSTED' && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                          <span>👁️ {post.views.toLocaleString()}</span>
                          <span>❤️ {post.likes.toLocaleString()}</span>
                          <span>💬 {post.comments.toLocaleString()}</span>
                          <span>🔁 {post.shares.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {post.status === 'PENDING' && (
                      <button onClick={() => publishNow(post.id)} disabled={publishing === post.id}
                        className="flex-shrink-0 bg-pink-500/20 hover:bg-pink-500/40 text-pink-400 px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50">
                        {publishing === post.id ? '投稿中...' : '今すぐ投稿'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
