'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'ホーム', icon: '🏠' },
  { href: '/accounts', label: 'アカウント', icon: '👤' },
  { href: '/themes', label: 'テーマ', icon: '🎬' },
  { href: '/queue', label: 'キュー', icon: '📋' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex md:hidden z-50">
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${pathname.startsWith(l.href) ? 'text-pink-400' : 'text-gray-400 hover:text-white'}`}>
          <span className="text-xl">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-60 bg-gray-900 border-r border-gray-800 min-h-screen p-4 fixed top-0 left-0">
      <div className="mb-8 px-2">
        <div className="text-2xl font-black bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
          🎵 TikTok Auto
        </div>
        <div className="text-xs text-gray-500 mt-1">自動投稿マネージャー</div>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${pathname.startsWith(l.href) ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <span className="text-lg">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-800">
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
            🚪 ログアウト
          </button>
        </form>
      </div>
    </aside>
  )
}
