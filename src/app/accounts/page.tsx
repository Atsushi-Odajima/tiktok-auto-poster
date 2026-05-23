'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  async function connectTikTok() {
    setLoading(true)
    const res = await fetch('/api/accounts', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  async function deleteAccount(id: string) {
    if (!confirm('このアカウントを削除しますか？')) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    setAccounts(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">TikTokアカウント</h1>
          <p className="text-gray-400 text-sm mt-1">連携するアカウントを管理</p>
        </div>
        <button onClick={connectTikTok} disabled={loading}
          className="bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {loading ? '接続中...' : '＋ アカウント追加'}
        </button>
      </div>

      {success === 'connected' && (
        <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 text-sm">
          ✅ TikTokアカウントが正常に連携されました
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          ❌ 連携に失敗しました: {error}
        </div>
      )}

      {accounts.length === 0
        ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-4xl mb-3">🎵</div>
            <p className="text-gray-400 text-sm mb-4">TikTokアカウントがまだ連携されていません</p>
            <p className="text-gray-500 text-xs">「アカウント追加」からTikTokと連携してください</p>
            <p className="text-gray-600 text-xs mt-2">※TikTok APIキーが必要です</p>
          </div>
        )
        : (
          <div className="space-y-3">
            {accounts.map((account: any) => (
              <div key={account.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4">
                {account.avatarUrl
                  ? <img src={account.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  : <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-xl">🎵</div>
                }
                <div className="flex-1">
                  <div className="font-medium">{account.displayName ?? account.username}</div>
                  <div className="text-sm text-gray-400">@{account.username}</div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${account.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {account.isActive ? 'アクティブ' : '停止中'}
                </div>
                <button onClick={() => deleteAccount(account.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1">🗑️</button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
