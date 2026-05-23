'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-800">
          <h1 className="text-xl font-bold text-center">新規登録</h1>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">{error}</div>}
          {(['name', 'email', 'password'] as const).map(key => (
            <div key={key}>
              <label className="text-sm text-gray-400 block mb-1">
                {key === 'name' ? '名前（任意）' : key === 'email' ? 'メールアドレス' : 'パスワード'}
              </label>
              <input type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                required={key !== 'name'}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">
            {loading ? '登録中...' : 'アカウント作成'}
          </button>
          <p className="text-center text-sm text-gray-400">
            すでにアカウントをお持ちの方は <Link href="/login" className="text-pink-400 hover:underline">ログイン</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
