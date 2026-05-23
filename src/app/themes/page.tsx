'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STYLES = ['educational', 'entertainment', 'tutorial', 'vlog', 'comedy', 'trending']
const STYLE_LABELS: Record<string, string> = {
  educational: '教育・解説', entertainment: 'エンタメ', tutorial: 'チュートリアル',
  vlog: 'Vlog', comedy: 'コメディ', trending: 'トレンド',
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', style: 'educational', language: 'ja' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/themes').then(r => r.json()).then(setThemes)
  }, [])

  async function createTheme(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const res = await fetch('/api/themes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) { setThemes(t => [data, ...t]); setShowForm(false); setForm({ title: '', description: '', style: 'educational', language: 'ja' }) }
    setLoading(false)
  }

  async function deleteTheme(id: string) {
    if (!confirm('このテーマを削除しますか？')) return
    await fetch(`/api/themes/${id}`, { method: 'DELETE' })
    setThemes(t => t.filter(x => x.id !== id))
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">テーマ管理</h1>
          <p className="text-gray-400 text-sm mt-1">投稿コンテンツのテーマを管理</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold px-4 py-2 rounded-lg text-sm">
          {showForm ? '✕ キャンセル' : '＋ 新規テーマ'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTheme} className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6 space-y-4">
          <h2 className="font-semibold">新しいテーマを作成</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">テーマタイトル *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                placeholder="例: 料理レシピ" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">スタイル</label>
              <select value={form.style} onChange={e => setForm(p => ({ ...p, style: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500">
                {STYLES.map(s => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">説明・方向性 *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={3}
              placeholder="どんな動画を投稿したいか説明してください。AIがクリップ戦略を立案します。"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 resize-none" />
          </div>
          <div className="flex gap-2">
            {['ja', 'en'].map(lang => (
              <button key={lang} type="button" onClick={() => setForm(p => ({ ...p, language: lang }))}
                className={`px-3 py-1.5 rounded-lg text-xs border ${form.language === lang ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'border-gray-700 text-gray-400'}`}>
                {lang === 'ja' ? '🇯🇵 日本語' : '🇺🇸 English'}
              </button>
            ))}
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold py-2.5 rounded-lg disabled:opacity-50">
            {loading ? '作成中...' : 'テーマを作成'}
          </button>
        </form>
      )}

      {themes.length === 0
        ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-gray-400 text-sm">テーマがまだありません</p>
          </div>
        )
        : (
          <div className="space-y-3">
            {themes.map((theme: any) => (
              <div key={theme.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{theme.title}</span>
                      <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">
                        {STYLE_LABELS[theme.style] ?? theme.style}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{theme.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>📹 元動画 {theme._count?.sourceVideos ?? 0}本</span>
                      <span>📤 投稿 {theme._count?.posts ?? 0}件</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/themes/${theme.id}`}
                      className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition-colors">
                      管理 →
                    </Link>
                    <button onClick={() => deleteTheme(theme.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors px-2">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
