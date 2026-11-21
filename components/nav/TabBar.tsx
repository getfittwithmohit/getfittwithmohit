'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Icon, type IconName } from '@/components/ui/Icon'

type Tab = { label: string; href: string; icon: IconName; owns: (p: string) => boolean }

const TABS: Tab[] = [
  { label: 'Today', href: '/home', icon: 'sun', owns: (p) => p === '/home' },
  { label: 'Train', href: '/train', icon: 'dumbbell', owns: (p) => p.startsWith('/train') || p.startsWith('/workout/plan') || p.startsWith('/plate') },
  { label: 'Learn', href: '/learn', icon: 'book', owns: (p) => p.startsWith('/learn') || p.startsWith('/courses') || p.startsWith('/ideas') },
  { label: 'Me', href: '/me', icon: 'user', owns: (p) => p.startsWith('/me') || p.startsWith('/home/') || p.startsWith('/leaderboard') },
]

// Screens that show the tab bar. Focused flows (a live workout, the ritual,
// forms with their own bottom buttons, the audio player) keep the full screen.
const SHOW_ON = [
  /^\/home(\/progress|\/report)?$/,
  /^\/(train|learn|me)$/,
  /^\/workout\/plan$/,
  /^\/plate$/,
  /^\/leaderboard$/,
  /^\/courses(\/[^/]+)?$/,
  /^\/ideas(\/stash|\/books|\/recap)?$/,
]

const BAR_HEIGHT = 64

export function TabBar() {
  const pathname = usePathname() || ''
  const [role, setRole] = useState<'client' | 'coach' | 'none' | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (!session) return setRole('none')
      const coach = process.env.NEXT_PUBLIC_COACH_EMAIL?.toLowerCase()
      setRole(session.user.email?.toLowerCase() === coach ? 'coach' : 'client')
    })
    return () => { cancelled = true }
  }, [])

  if (role !== 'client' || !SHOW_ON.some((r) => r.test(pathname))) return null

  return (
    <>
      {/* Keeps page content clear of the fixed bar */}
      <div aria-hidden="true" style={{ height: `calc(${BAR_HEIGHT}px + env(safe-area-inset-bottom))`, flexShrink: 0 }} />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB]"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'saturate(180%) blur(16px)',
          WebkitBackdropFilter: 'saturate(180%) blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="max-w-2xl mx-auto flex" style={{ height: BAR_HEIGHT }}>
          {TABS.map((t) => {
            const active = t.owns(pathname)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-0.5"
                style={{ color: active ? '#007A8A' : '#64748b' }}
              >
                <Icon name={t.icon} size={25} strokeWidth={active ? 2.2 : 2} />
                <span className="text-[11px]" style={{ fontWeight: active ? 600 : 500 }}>{t.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
