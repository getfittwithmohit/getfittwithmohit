'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { Icon } from '@/components/ui/Icon'
import { Badge, Card, Group, Row, Screen, SectionTitle, T } from '@/components/ui/ios'
import { supabase } from '@/lib/supabase/client'
import { signOut } from '@/lib/supabase/queries/auth'
import { getLeaderboard } from '@/lib/supabase/queries/dailyCheckin'
import { loadSetupItems } from '@/lib/today/loadToday'
import { addDaysIST, todayIST } from '@/lib/utils/istDate'
import { confirmDialog } from '@/lib/ui/feedback'

// Me tab: who you are in the programme, your numbers, and everything about
// progress and identity in one grouped list.
export default function MePage() {
  const { checking } = useAuthGuard()
  const { client, loading } = useClient()
  const [stats, setStats] = useState<{ streak: number | null; xp: number | null; rank: number | null }>({ streak: null, xp: null, rank: null })
  const [why, setWhy] = useState<string | null>(null)
  const [weeklyDue, setWeeklyDue] = useState<string | null>(null)
  const [photosDue, setPhotosDue] = useState(false)

  useEffect(() => {
    if (checking || loading || !client) return
    let cancelled = false
    const yesterday = addDaysIST(todayIST(), -1)
    Promise.all([
      supabase.from('ritual_streaks').select('current_streak, last_completed_date').eq('client_id', client.id).maybeSingle(),
      getLeaderboard('week').catch(() => []),
      supabase.from('commitment_pledges').select('doing_this_for').eq('client_id', client.id).maybeSingle(),
      loadSetupItems(client).catch(() => []),
    ]).then(([streakRes, board, pledgeRes, setup]) => {
      if (cancelled) return
      const s = streakRes.data
      const me = board.find((r) => r.is_me)
      setStats({
        streak: s && s.last_completed_date >= yesterday ? s.current_streak || 0 : 0,
        xp: me ? me.xp : null,
        rank: me && !me.is_hidden ? me.rank : null,
      })
      setWhy(pledgeRes.data?.doing_this_for || null)
      setWeeklyDue(setup.find((i) => i.key === 'weekly')?.badge || null)
      setPhotosDue(setup.some((i) => i.key === 'photos'))
    })
    return () => { cancelled = true }
  }, [checking, loading, client])

  if (checking || loading) return <PageLoader />

  const name = client?.full_name || 'You'
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const phaseLine = client
    ? client.phase === 'Onboarding' ? 'Onboarding' : `Week ${client.current_week} · ${client.phase} phase`
    : ''

  const onSignOut = async () => {
    if (await confirmDialog('Sign out of GetFittWithMohit?', { confirmLabel: 'Sign out', destructive: true })) signOut()
  }

  const stat = (value: string, label: string) => (
    <>
      <span className="text-[22px] font-extrabold">{value}</span>
      <span className="text-[13px]" style={{ color: T.ter }}>{label}</span>
    </>
  )

  return (
    <Screen>
      <div className="flex flex-col items-center gap-2 pt-2 pb-1.5 text-center">
        <span className="w-[76px] h-[76px] rounded-full flex items-center justify-center text-[28px] font-extrabold" style={{ background: T.navy, color: T.cyan }}>{initials}</span>
        <h1 className="m-0 text-2xl font-extrabold">{name}</h1>
        <span className="text-[15px]" style={{ color: T.ter }}>{phaseLine}</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl py-3.5 px-2 flex flex-col items-center gap-0.5">{stat(stats.streak === null ? '–' : String(stats.streak), 'Day streak')}</div>
        <div className="bg-white rounded-2xl py-3.5 px-2 flex flex-col items-center gap-0.5">{stat(stats.xp === null ? '–' : stats.xp.toLocaleString('en-IN'), 'XP this week')}</div>
        <Link href="/leaderboard" className="bg-white rounded-2xl py-3.5 px-2 flex flex-col items-center gap-0.5" style={{ color: T.ink }}>{stat(stats.rank === null ? '–' : `#${stats.rank}`, 'Leaderboard')}</Link>
      </div>

      {why && (
        <Card className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: T.ter }}>Doing this for</span>
          <span className="text-base font-semibold leading-snug" style={{ color: T.teal }}>“{why}”</span>
        </Card>
      )}

      <SectionTitle>My plans</SectionTitle>
      <Group>
        <Row icon="heart" tint="green" title="My nutrition plan" subtitle="Your meals, options and protein target" href="/me/nutrition" last />
      </Group>

      <SectionTitle>Progress</SectionTitle>
      <Group>
        <Row icon="clipboard" title="Weekly check-in" subtitle="Weight, measurements, how the week went" href="/checkin" trailing={weeklyDue ? <Badge>{weeklyDue}</Badge> : undefined} />
        <Row icon="camera" title="Progress photos" subtitle="Before → now, every 4 weeks" href="/me/photos" trailing={photosDue ? <Badge>Due</Badge> : undefined} />
        <Row icon="chart" title="My progress" subtitle="Weight, waist and streak charts" href="/home/progress" />
        <Row icon="file" title="Transformation report" subtitle="Your 7-section report" href="/home/report" last />
      </Group>

      <SectionTitle>Who I’m becoming</SectionTitle>
      <Group>
        <Row icon="pen" tint="violet" title="My pledge" subtitle="Read it morning and night" href="/pledge" />
        <Row icon="target" tint="violet" title="Identity" subtitle="Your why, values and vision" href="/identity" />
        <Row icon="codex" tint="violet" title="My Codex" subtitle="Your story so far" href="/codex/view" />
        <Row icon="activity" tint="violet" title="Fitness assessment" subtitle="Your fitness baseline" href="/assessment" last />
      </Group>

      <SectionTitle>Daily habits</SectionTitle>
      <Group>
        <Row icon="sunrise" tint="slate" title="Morning ritual" subtitle="Strangest Secret · Goals · Affirmations" href="/ritual" />
        <Row icon="moon" tint="slate" title="Daily check-in" subtitle="1 minute · earns XP" href="/daily-checkin" last />
      </Group>

      <SectionTitle>Community</SectionTitle>
      <Group>
        <Row icon="trophy" tint="amber" title="Leaderboard" subtitle="Weekly and all-time" href="/leaderboard" last />
      </Group>

      <button type="button" onClick={onSignOut} className="mt-1.5 h-[52px] rounded-2xl bg-white flex items-center justify-center gap-2 text-base font-semibold" style={{ color: '#B91C1C' }}>
        <Icon name="logout" size={18} />Sign out
      </button>
    </Screen>
  )
}
