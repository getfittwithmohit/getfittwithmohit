'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { getDueRecall, getMyIdeas, getTodayIdea, updateMyIdea } from '@/lib/supabase/queries/peakIdeas'
import type { ClientIdea, Recall } from '@/lib/types/peakIdeas'
import { PEAK, topicColor } from '@/lib/constants/peakIdeas'
import { addDaysIST, formatDayLabel, todayIST } from '@/lib/utils/istDate'
import { daysAway, greeting, ideaStreak, istHour } from '@/lib/utils/peakIdeas'
import { ErrorNote, Icon, LoadingScreen, PeakShell, TopicArt, TopicPill } from '@/components/peak/ui'

interface Data {
  today: ClientIdea | null
  mine: ClientIdea[]
  recall: Recall | null
}

export default function IdeasHomePage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [promiseSaving, setPromiseSaving] = useState(false)
  const [promiseResult, setPromiseResult] = useState<'done' | 'not_yet' | null>(null)

  useEffect(() => {
    if (clientLoading || !client) return
    let cancelled = false
    // the daily idea must be assigned before we read the full list
    getTodayIdea(client.id)
      .then(async (today) => {
        const [mine, recall] = await Promise.all([getMyIdeas(client.id), getDueRecall(client.id)])
        if (!cancelled) setData({ today, mine, recall })
      })
      .catch((err) => { if (!cancelled) setError((err as Error).message) })
    return () => { cancelled = true }
  }, [client, clientLoading])

  if (checking || clientLoading || (!data && !error)) return <LoadingScreen />
  if (!client) {
    return <PeakShell><ErrorNote message="We could not find your client profile. Please sign out and sign in again." /></PeakShell>
  }

  const today = todayIST()
  const mine = data?.mine || []
  const todayIdea = data?.today || null
  const streak = ideaStreak(mine, today)
  const away = daysAway(mine, today)
  const comingBack = away !== null && away >= 3
  const firstName = client.full_name?.split(' ')[0] || ''

  // The latest promise from an earlier day that still needs an answer (last 3 days)
  const askPromise =
    mine.find((r) => r.committed_at && r.outcome === null && r.day < today && r.day >= addDaysIST(today, -3)) || null
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay()
  const isRecapDay = weekday === 0 || weekday === 1 // Sunday, and Monday for anyone who missed it

  const answerPromise = async (outcome: 'done' | 'not_yet') => {
    if (!askPromise) return
    setPromiseSaving(true)
    try {
      await updateMyIdea(askPromise.id, { outcome })
      setPromiseResult(outcome)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPromiseSaving(false)
    }
  }

  const promiseText = askPromise ? (askPromise.chose_easier ? askPromise.peak_ideas.easier_action : askPromise.peak_ideas.action) : ''
  const promiseWhen = askPromise ? (askPromise.day === addDaysIST(today, -1) ? 'Yesterday' : formatDayLabel(askPromise.day)) : ''

  return (
    <PeakShell>
      <header className="px-6 pt-7 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <Link href="/home" className="text-[13px]" style={{ color: PEAK.muted }}>← Home</Link>
          <h1 className="text-[26px] font-semibold leading-tight truncate">
            {comingBack ? `Welcome back, ${firstName}` : `${greeting(istHour())}, ${firstName}`}
          </h1>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-full shrink-0" style={{ background: 'rgba(245,184,61,0.12)' }} aria-label={`${streak} day streak`}>
            {Icon.flame}
            <span className="text-base font-bold" style={{ color: PEAK.gold }}>{streak}</span>
          </div>
        )}
      </header>

      {comingBack && (
        <p className="px-6 mt-2 text-sm" style={{ color: PEAK.soft }}>No catching up needed. One idea today is all it takes.</p>
      )}

      {error && <ErrorNote message={error} />}

      {/* Today's idea */}
      {todayIdea ? (
        <Link href={`/ideas/${todayIdea.id}`} className="mx-4 mt-6 rounded-[26px] overflow-hidden flex flex-col" style={{ background: PEAK.surface }}>
          <div className="relative h-[220px] p-[22px] flex flex-col justify-between overflow-hidden" style={{ background: topicColor(todayIdea.peak_ideas.topic) }}>
            <TopicArt topic={todayIdea.peak_ideas.topic} size={230} className="-right-10 -top-8" />
            <TopicPill topic={todayIdea.peak_ideas.topic} />
            <h2 className="relative text-[27px] font-bold leading-[1.12]" style={{ color: PEAK.ink }}>{todayIdea.peak_ideas.hook}</h2>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <p className="text-[13px]" style={{ color: PEAK.muted }}>
              {todayIdea.committed_at ? '✓ Committed · tap to read again' : todayIdea.opened_at ? 'Today’s PEAK Idea · finish it' : 'Today’s PEAK Idea · 1 min'}
            </p>
            <span className="h-10 px-[18px] rounded-xl flex items-center text-sm font-bold" style={{ background: PEAK.cyan, color: PEAK.ink }}>
              {todayIdea.opened_at ? 'Open' : 'Read'}
            </span>
          </div>
        </Link>
      ) : (
        <div className="mx-4 mt-6 rounded-[26px] p-6 flex flex-col gap-2" style={{ background: PEAK.surface }}>
          <p className="text-lg font-semibold">New ideas are on the way</p>
          <p className="text-sm" style={{ color: PEAK.soft }}>You’ve read everything so far. Coach Mohit is adding more — check back tomorrow.</p>
        </div>
      )}

      {/* Yesterday's promise */}
      {askPromise && (
        <div className="mx-4 mt-3.5 p-[18px] rounded-[20px] flex flex-col gap-3" style={{ background: PEAK.surface }}>
          {promiseResult ? (
            <p className="text-[15px] font-semibold" style={{ color: promiseResult === 'done' ? PEAK.green : PEAK.soft }}>
              {promiseResult === 'done' ? 'Promise kept · +10 XP. That’s who you are now.' : 'No problem. Small steps still count — try it again today.'}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <p className="text-xs" style={{ color: PEAK.muted }}>{promiseWhen} you said you’d</p>
                <p className="text-[15px] font-semibold leading-snug">{promiseText}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={promiseSaving} onClick={() => answerPromise('done')} className="flex-1 h-11 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: 'rgba(34,197,94,0.16)', color: PEAK.green }}>
                  Done · +10 XP
                </button>
                <button type="button" disabled={promiseSaving} onClick={() => answerPromise('not_yet')} className="flex-1 h-11 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ border: `1px solid ${PEAK.line}`, color: PEAK.soft }}>
                  Not yet
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Recall */}
      {data?.recall && (
        <Link href="/ideas/recall" className="mx-4 mt-3.5 p-[18px] rounded-[20px] flex items-center gap-3.5" style={{ background: PEAK.surface }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: topicColor(data.recall.peak_ideas.topic) }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PEAK.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          </div>
          <div className="flex-1 flex flex-col gap-0.5">
            <p className="text-sm font-semibold">Quick recall</p>
            <p className="text-xs" style={{ color: PEAK.muted }}>1 question · 10 seconds · +5 XP</p>
          </div>
          {Icon.chevron}
        </Link>
      )}

      {/* Weekly recap */}
      {isRecapDay && mine.some((r) => r.committed_at && r.day >= addDaysIST(today, -7)) && (
        <Link href="/ideas/recap" className="mx-4 mt-3.5 p-[18px] rounded-[20px] flex items-center gap-3.5" style={{ background: 'rgba(245,184,61,0.10)', border: '1px solid rgba(245,184,61,0.35)' }}>
          <div className="flex-1 flex flex-col gap-0.5">
            <p className="text-sm font-semibold" style={{ color: PEAK.gold }}>Your week in ideas is ready</p>
            <p className="text-xs" style={{ color: PEAK.soft }}>See the promises you kept this week</p>
          </div>
          {Icon.chevron}
        </Link>
      )}

      <div className="flex-1" />

      <nav className="px-4 pb-6 pt-6 grid grid-cols-2 gap-2">
        <Link href="/ideas/stash" className="h-[52px] rounded-2xl flex items-center justify-center text-sm font-semibold" style={{ border: `1px solid ${PEAK.line}` }}>My Stash</Link>
        <Link href="/ideas/books" className="h-[52px] rounded-2xl flex items-center justify-center text-sm font-semibold" style={{ border: `1px solid ${PEAK.line}` }}>Books</Link>
      </nav>
    </PeakShell>
  )
}
