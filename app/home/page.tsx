'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Icon } from '@/components/ui/Icon'
import { Badge, Card, Group, LargeTitle, Row, Screen, SectionTitle, Skeleton, T, ScreenSkeleton } from '@/components/ui/ios'
import { SaverSheet } from '@/components/today/SaverSheet'
import { WeekFocus } from '@/components/today/WeekFocus'
import { loadToday, type TodayData, type TodayStep } from '@/lib/today/loadToday'
import { getCached, setCached } from '@/lib/ui/cache'
import { PullToRefresh } from '@/components/ui/PullToRefresh'

const DAILY_QUOTES = [
  'The pain of discipline is lighter than the weight of regret.',
  'You don’t rise to the level of your goals. You fall to the level of your systems.',
  'Every rep, every meal, every choice — it compounds.',
  'Your future self is watching you right now. Make them proud.',
  'Consistency over intensity. Always.',
  'The body achieves what the mind believes.',
  'Small daily improvements lead to stunning long-term results.',
]

function istParts() {
  const now = new Date()
  const date = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })
  const hour = Number(now.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }))
  const dayIndex = Number(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric' }))
  return { date, hour, dayIndex }
}

// Today: the day as a short checklist in time order. Whatever is next gets
// the one big card; finished steps shrink to a ✓ row.
export default function TodayPage() {
  const { checking } = useAuthGuard()
  const { client, loading } = useClient()
  const [data, setData] = useState<TodayData | null>(() => getCached<TodayData>('today') ?? null)
  const [saverOpen, setSaverOpen] = useState(false)
  const [focusKey, setFocusKey] = useState(0)

  const refresh = async () => {
    if (!client) return
    const d = await loadToday(client)
    setData(setCached('today', d))
    setFocusKey((k) => k + 1)
  }

  useEffect(() => {
    if (checking || loading || !client) return
    let cancelled = false
    loadToday(client).then((d) => { if (!cancelled) setData(setCached('today', d)) })
    return () => { cancelled = true }
  }, [checking, loading, client])

  if (checking || loading) return <ScreenSkeleton title="Today" blocks={[88, 220, 64, 64]} />

  if (!client) {
    return (
      <Screen>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-3 px-6">
          <h1 className="text-2xl font-extrabold m-0">Welcome to GetFittWithMohit</h1>
          <p className="text-base m-0" style={{ color: T.sec }}>Let’s get you set up. Complete your onboarding to get started.</p>
          <Link href="/onboarding" className="mt-3 h-[52px] px-8 rounded-2xl flex items-center text-base font-bold" style={{ background: T.cyan, color: '#0a0f1a' }}>
            Start onboarding
          </Link>
        </div>
      </Screen>
    )
  }

  const { date, hour, dayIndex } = istParts()
  const firstName = client.full_name?.split(' ')[0] || 'there'
  const initials = (client.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const avatar = (
    <Link href="/me" aria-label="Open your profile" className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold mb-1 flex-shrink-0" style={{ background: T.navy, color: T.cyan }}>
      {initials}
    </Link>
  )

  return (
    <Screen>
      <PullToRefresh onRefresh={refresh} />
      <LargeTitle eyebrow={date} title="Today" right={avatar} />

      {!data ? (
        <>
          <Skeleton h={88} />
          <Skeleton h={220} />
          <Skeleton h={64} />
          <Skeleton h={64} />
        </>
      ) : (
        <TodayList data={data} greeting={`${greeting}, ${firstName}`} onSaver={() => setSaverOpen(true)} />
      )}

      <WeekFocus key={focusKey} />

      <SectionTitle>Thought for today</SectionTitle>
      <Card>
        <p className="m-0 text-base leading-relaxed italic" style={{ color: T.sec }}>“{DAILY_QUOTES[dayIndex % DAILY_QUOTES.length]}”</p>
      </Card>

      {saverOpen && <SaverSheet onClose={() => setSaverOpen(false)} />}
    </Screen>
  )
}

function TodayList({ data, greeting, onSaver }: { data: TodayData; greeting: string; onSaver: () => void }) {
  const required = data.steps.filter((s) => !s.optional)
  const doneCount = required.filter((s) => s.done).length
  const current = required.find((s) => !s.done) || null
  const allDone = required.length > 0 && !current
  const pct = required.length ? Math.round((doneCount / required.length) * 100) : 0

  return (
    <>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold">{greeting}</span>
          {data.streak > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap" style={{ color: '#B45309' }}>
              <Icon name="flame" size={18} />{data.streak}-day streak
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-[#E5E7EB] overflow-hidden" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={required.length} aria-label="Today’s progress">
            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: T.cyan }} />
          </div>
          <span className="text-sm font-semibold whitespace-nowrap" style={{ color: T.sec }}>
            {doneCount} of {required.length} done{data.xpToday ? ` · +${data.xpToday} XP` : ''}
          </span>
        </div>
      </Card>

      {data.setup.length > 0 && (
        <>
          <SectionTitle>Needs you</SectionTitle>
          <Group>
            {data.setup.map((item, i) => (
              <Row
                key={item.key}
                icon={item.icon}
                tint="amber"
                title={item.title}
                subtitle={item.subtitle}
                href={item.href}
                trailing={item.badge ? <Badge>{item.badge}</Badge> : undefined}
                last={i === data.setup.length - 1}
              />
            ))}
          </Group>
        </>
      )}

      <SectionTitle>Your day</SectionTitle>
      {data.steps.map((s) =>
        current && s.key === current.key ? (
          <HeroStep key={s.key} step={s} onSaver={s.key === 'ritual' ? onSaver : undefined} />
        ) : (
          <StepRow key={s.key} step={s} />
        )
      )}

      {allDone && (
        <div className="rounded-[22px] p-5 flex flex-col gap-2 text-white" style={{ background: T.navy }}>
          <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: T.cyan }}>Day complete</span>
          <span className="text-2xl font-extrabold leading-tight">Every box ticked. That’s who you’re becoming.</span>
          <span className="text-[15px] text-[#CBD5E1]">Show up again tomorrow to keep the streak alive.</span>
        </div>
      )}

      {data.highFive && (
        <>
          <SectionTitle>From Coach Mohit</SectionTitle>
          <Card className="flex gap-3 items-start">
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0" style={{ background: T.navy, color: T.cyan }}>M</span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">High-five on your {data.highFive} session</span>
              <span className="text-sm" style={{ color: T.sec }}>Keep that energy going today.</span>
            </span>
          </Card>
        </>
      )}
    </>
  )
}

function HeroStep({ step, onSaver }: { step: TodayStep; onSaver?: () => void }) {
  return (
    <div className="rounded-[22px] p-5 flex flex-col gap-3.5 text-white" style={{ background: T.navy }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: T.cyan }}>Up now · {step.when}</span>
        <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,232,0.14)', color: T.cyan }}>
          <Icon name={step.icon} size={22} />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[26px] leading-tight font-extrabold tracking-tight">{step.title}</span>
        <span className="text-[15px] text-[#CBD5E1]">{step.meta}</span>
      </div>
      <Link href={step.href} className="h-[54px] rounded-2xl flex items-center justify-center gap-2 text-[17px] font-bold" style={{ background: T.cyan, color: '#0a0f1a' }}>
        {step.key === 'workout' && <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0f1a" aria-hidden="true"><polygon points="7,4 20,12 7,20" /></svg>}
        {step.cta}
      </Link>
      {onSaver && (
        <button type="button" onClick={onSaver} className="self-center text-sm font-semibold py-1" style={{ color: T.cyan }}>
          What is SAVER?
        </button>
      )}
    </div>
  )
}

function StepRow({ step }: { step: TodayStep }) {
  return (
    <Link href={step.href} className="bg-white rounded-2xl min-h-16 px-3.5 py-2.5 flex items-center gap-3">
      {step.done ? (
        <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7', color: '#15803D' }}>
          <Icon name="check" size={20} strokeWidth={2.6} />
        </span>
      ) : (
        <span className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2F6', color: T.sec }}>
          <Icon name={step.icon} size={20} />
        </span>
      )}
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-base font-semibold truncate" style={{ color: step.done ? T.ter : T.ink }}>{step.title}</span>
        <span className="text-sm truncate" style={{ color: step.done ? '#15803D' : T.ter }}>
          {step.done ? step.doneNote : `${step.when} · ${step.meta}`}
        </span>
      </span>
      <span style={{ color: '#94a3b8' }}><Icon name="chevron" size={18} /></span>
    </Link>
  )
}
