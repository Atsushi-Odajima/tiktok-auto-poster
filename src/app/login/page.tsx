'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl font-black bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">🎵 TikTok Auto</div>
          <p className="text-gray-400 mt-2 text-sm">自動投稿マネージャー</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-800">
          <h1 className="text-xl font-bold text-center">ログイン</h1>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">{error}</div>}
          <div>
            <label className="text-sm text-gray-400 block mb-1">メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">パスワード</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
          <p className="text-center text-sm text-gray-400">
            アカウントをお持ちでない方は <Link href="/register" className="text-pink-400 hover:underline">新規登録</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
