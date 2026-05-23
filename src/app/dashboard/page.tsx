'use client'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="p-6 text-gray-400">読み込み中...</div>

  const statCards = [
    { label: 'アカウント', value: data.accounts, icon: '👤', color: 'from-pink-500 to-rose-500' },
    { label: 'テーマ', value: data.themes, icon: '🎬', color: 'from-purple-500 to-pink-500' },
    { label: '投稿済み', value: data.stats?.POSTED ?? 0, icon: '✅', color: 'from-cyan-500 to-blue-500' },
    { label: '予約中', value: data.stats?.SCHEDULED ?? 0, icon: '⏰', color: 'from-yellow-500 to-orange-500' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-gray-400 text-sm mt-1">TikTok自動投稿の管理画面</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className={`text-2xl w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-gray-400 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">最近の投稿</h2>
        {data.recentPosts?.length === 0
          ? <p className="text-gray-500 text-sm text-center py-8">投稿がまだありません</p>
          : <div className="space-y-3">
              {data.recentPosts?.map((post: any) => (
                <div key={post.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center text-sm">
                    {post.status === 'POSTED' ? '✅' : post.status === 'FAILED' ? '❌' : '⏳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{post.theme?.title}</div>
                    <div className="text-xs text-gray-400">@{post.account?.username} · クリップ {post.clip?.clipOrder}</div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    post.status === 'POSTED' ? 'bg-green-500/20 text-green-400' :
                    post.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                    post.status === 'SCHEDULED' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>{post.status}</div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}
