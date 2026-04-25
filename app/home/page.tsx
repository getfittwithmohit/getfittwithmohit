'use client'

import { useEffect, useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { signOut } from '@/lib/supabase/queries/auth'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'

const PHASE_EMOJI: Record<string, string> = {
  Onboarding: '📋',
  Adaptation: '🌱',
  Building: '💪',
  Performance: '🔥',
  Maintenance: '🏆',
}

const DAILY_QUOTES = [
  "The pain of discipline is lighter than the weight of regret.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
  "Every rep, every meal, every choice — it compounds.",
  "Your future self is watching you right now. Make them proud.",
  "Consistency over intensity. Always.",
  "The body achieves what the mind believes.",
  "Small daily improvements lead to stunning long-term results.",
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const QUICK_LINKS = [
  { emoji: '📋', label: 'Check-in', href: '/checkin' },
  { emoji: '💪', label: 'Assessment', href: '/assessment' },
  { emoji: '🎯', label: 'Identity', href: '/identity' },
  { emoji: '📊', label: 'Progress', href: '/home/progress' },
  { emoji: '✊', label: 'Pledge', href: '/pledge' },
]

export default function ClientHomePage() {
  const { checking } = useAuthGuard()
  const { client, loading } = useClient()

  const [pledge, setPledge] = useState<any>(null)
  const [identity, setIdentity] = useState<any>(null)
  const [checkinDone, setCheckinDone] = useState<boolean>(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [saverOpen, setSaverOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!client) return

      const [pledgeRes, identityRes] = await Promise.all([
        supabase
          .from('commitment_pledges')
          .select('doing_this_for, signed_at')
          .eq('client_id', client.id)
          .maybeSingle(),
        supabase
          .from('identity_cards')
          .select('id')
          .eq('client_id', client.id)
          .maybeSingle(),
      ])

      if (pledgeRes.data) setPledge(pledgeRes.data)
      if (identityRes.data) setIdentity(identityRes.data)

      const todayDay = new Date().getDay()
      const isCheckinTime = [5, 6, 0].includes(todayDay)
      if (isCheckinTime && client.current_week) {
        const { data: checkinData } = await supabase
          .from('weekly_checkins')
          .select('id')
          .eq('client_id', client.id)
          .eq('week_number', client.current_week)
          .maybeSingle()
        setCheckinDone(!!checkinData)
      }

      setDataLoading(false)
    }
    fetchData()
  }, [client])

  if (checking || loading || dataLoading) return <PageLoader />

  if (!client) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">👋</div>
          <h2 className="text-lg font-medium text-[#0f172a] mb-2">
            Welcome to GetFittWithMohit
          </h2>
          <p className="text-sm text-[#64748b] mb-6">
            Let's get you set up. Complete your onboarding to get started.
          </p>
          <button
            onClick={() => window.location.href = '/onboarding'}
            className="bg-[#00d4d4] text-[#1a1f3a] px-8 py-3 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors"
          >
            Start Onboarding →
          </button>
        </div>
      </div>
    )
  }

  const today = new Date()
  const dayName = DAY_NAMES[today.getDay()]
  const quote = DAILY_QUOTES[today.getDay()]
  const firstName = client?.full_name?.split(' ')[0] || 'there'

  // All pending items
  const pendingItems = []
  if (!checkinDone) pendingItems.push({
    emoji: '📋',
    label: `Week ${client?.current_week || ''} Check-in`,
    description: '8–10 mins · Due this weekend',
    href: '/checkin',
    color: '#f59e0b',
  })
  if (!pledge) pendingItems.push({
    emoji: '🤝',
    label: 'Commitment Pledge',
    description: 'Sign your promise to yourself',
    href: '/pledge',
    color: '#00d4d4',
  })
  if (!identity) pendingItems.push({
    emoji: '🎯',
    label: 'Purpose & Identity',
    description: 'Your why, values and vision',
    href: '/identity',
    color: '#a855f7',
  })

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header — same as every other page */}
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GetFittWithMohit" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[#00d4d4] text-xs font-medium tracking-widest uppercase">
                GetFittWithMohit
              </p>
              <p className="text-white/40 text-xs mt-0.5">Transform to Inspire</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-medium text-[#0f172a]">
            Hey {firstName} 👋
          </h2>
          <p className="text-sm text-[#64748b] mt-0.5">
            {PHASE_EMOJI[client?.phase || '']} {client?.phase}
            {client?.phase !== 'Onboarding' && ` · Week ${client?.current_week || 1}`}
          </p>
        </div>

        {/* Phase + motivation card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-5">

          {/* Phase row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-0.5">
                Current phase
              </p>
              <p className="text-lg font-semibold text-[#0f172a]">
                {PHASE_EMOJI[client?.phase || '']} {client?.phase || '–'}
              </p>
            </div>
            {client?.phase !== 'Onboarding' && (
              <div className="text-right">
                <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-0.5">Week</p>
                <p className="text-3xl font-bold text-[#1a1f3a]">
                  {client?.current_week || 1}
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[#e2e8f0] mb-4" />

          {/* Pledge */}
          {pledge?.doing_this_for && (
            <div className="mb-4">
              <p className="text-xs text-[#94a3b8] mb-1">Doing this for</p>
              <p className="text-sm font-medium text-[#00d4d4] leading-relaxed">
                "{pledge.doing_this_for}"
              </p>
            </div>
          )}

          {/* Quote */}
          <div className="border-l-2 border-[#00d4d4]/30 pl-3 mb-4">
            <p className="text-xs text-[#64748b] italic leading-relaxed">
              "{quote}"
            </p>
          </div>

          {/* SAVER nudge */}
          <button
            onClick={() => setSaverOpen(true)}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity w-full"
          >
            <span className="text-xs text-[#94a3b8]">
              🌅 {dayName} · Have you done your SAVER today?
            </span>
            <span className="text-xs text-[#00d4d4] underline underline-offset-2 flex-shrink-0">
              What is SAVER?
            </span>
          </button>

        </div>

        {/* Pending items */}
        {pendingItems.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
                Pending · {pendingItems.length} item{pendingItems.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {pendingItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => window.location.href = item.href}
                  className="flex items-center gap-4 bg-white border border-[#e2e8f0] rounded-xl p-4 text-left hover:border-[#00d4d4] transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${item.color}15` }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0f172a]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                    style={{ background: `${item.color}15`, color: item.color }}
                  >
                    Do it →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All clear */}
        {pendingItems.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-medium text-emerald-700">You're on track</p>
              <p className="text-xs text-emerald-600/70 mt-0.5">Nothing pending · Keep showing up</p>
            </div>
          </div>
        )}

        {/* Quick access */}
        <div className="mb-8">
          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
            Quick access
          </p>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_LINKS.map((item) => (
              <button
                key={item.href}
                onClick={() => window.location.href = item.href}
                className="flex flex-col items-center gap-1.5 bg-white border border-[#e2e8f0] rounded-xl py-3 px-1 hover:border-[#00d4d4] transition-colors"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-xs text-[#64748b] text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
      {/* Floating SAVER button */}
      <button
        onClick={() => setSaverOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#1a1f3a] border border-[#00d4d4]/30 rounded-full flex items-center justify-center shadow-lg hover:border-[#00d4d4] transition-colors z-40"
      >
        <span className="text-sm font-bold text-[#00d4d4]">S</span>
      </button>

      {/* SAVER modal */}
      {saverOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setSaverOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-2xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#e2e8f0] rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-[#0f172a]">
                  Your SAVER Routine
                </h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Do this every morning · Takes 45–60 mins total
                </p>
              </div>
              <button
                onClick={() => setSaverOpen(false)}
                className="text-[#94a3b8] hover:text-[#64748b] text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {[
                {
                  letter: 'S',
                  word: 'Silence',
                  duration: '5–10 mins',
                  color: '#4a7fd4',
                  steps: [
                    'Find a quiet spot — no phone, no noise',
                    'Sit comfortably and breathe slowly',
                    'Read your goals out loud or write them down',
                    'Ask yourself: What is the one thing I must do today?',
                  ],
                },
                {
                  letter: 'A',
                  word: 'Affirmations',
                  duration: '5 mins',
                  color: '#00d4d4',
                  steps: [
                    'Write or speak 5–10 statements about who you are becoming',
                    'Use present tense: "I am strong. I am consistent."',
                    'Say them with conviction — feel them, don\'t just recite',
                  ],
                },
                {
                  letter: 'V',
                  word: 'Visualisation',
                  duration: '5 mins',
                  color: '#a855f7',
                  steps: [
                    'Close your eyes and see your 6-month goal clearly',
                    'Then see your 1-year self — how do you look, feel, move?',
                    'See your 5-year vision — who have you become?',
                    'Finally: What is the ONE thing you will accomplish today?',
                  ],
                },
                {
                  letter: 'E',
                  word: 'Exercise',
                  duration: '20–60 mins',
                  color: '#f59e0b',
                  steps: [
                    'Follow your Coach Mohit programme',
                    'Even on rest days — walk, stretch, move',
                    'Non-negotiable · Your body is your vehicle',
                  ],
                },
                {
                  letter: 'R',
                  word: 'Reading',
                  duration: '10+ mins',
                  color: '#22c55e',
                  steps: [
                    'Read a book that grows your mind',
                    'Minimum 10 pages every morning',
                    'Focus on health, mindset, business or biography',
                  ],
                },
              ].map((item) => (
                <div key={item.letter} className="flex gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}
                  >
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {item.letter}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[#0f172a]">{item.word}</p>
                      <span className="text-xs text-[#94a3b8]">· {item.duration}</span>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {item.steps.map((step, i) => (
                        <li key={i} className="text-xs text-[#64748b] flex items-start gap-1.5">
                          <span className="text-[#94a3b8] mt-0.5 flex-shrink-0">·</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#1a1f3a] rounded-xl p-4 text-center">
              <p className="text-xs text-white/50 leading-relaxed">
                Track how many days you completed SAVER in your{' '}
                <span className="text-[#00d4d4]">weekly check-in</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}