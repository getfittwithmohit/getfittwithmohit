'use client'

import { useEffect, useState } from 'react'
import { getClientXp, getDailyCheckins } from '@/lib/supabase/queries/dailyCheckin'
import { todayIST } from '@/lib/utils/istDate'

// Home-screen card: shows whether today's daily check-in is in, and the XP
// earned today. Tapping goes to the check-in.
export function DailyCheckinCard({ clientId }: { clientId: string }) {
  const [state, setState] = useState<{ done: boolean; xpToday: number } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const today = todayIST()
    Promise.all([getDailyCheckins(clientId, today), getClientXp(clientId)])
      .then(([rows, xp]) => {
        setState({
          done: rows.some((r) => r.checkin_date === today),
          xpToday: xp.filter((e) => e.event_date === today).reduce((s, e) => s + e.points, 0),
        })
      })
      .catch(() => setFailed(true))
  }, [clientId])

  const done = state?.done

  return (
    <button
      onClick={() => window.location.href = '/daily-checkin'}
      className={`w-full rounded-2xl p-5 mb-3 text-left transition-colors border ${
        done
          ? 'bg-white border-[#e2e8f0] hover:border-[#00d4d4]'
          : 'bg-[#00d4d4] border-[#00d4d4] hover:bg-[#00bcbc]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs tracking-widest uppercase mb-1 ${done ? 'text-[#00a3a3]' : 'text-[#1a1f3a]/70'}`}>
            Daily Check-In
          </p>
          <p className="text-base font-medium text-[#0f172a]">
            {state === null && !failed
              ? 'Loading…'
              : done
                ? `✓ Done for today · +${state!.xpToday} XP`
                : 'Check in for today — 1 minute'}
          </p>
          <p className={`text-xs mt-0.5 ${done ? 'text-[#94a3b8]' : 'text-[#1a1f3a]/60'}`}>
            {done ? 'Tap to review or edit' : 'Workout · Nutrition · Steps · Sleep · Water'}
          </p>
        </div>
        <div className="text-3xl">{done ? '✅' : '📋'}</div>
      </div>
    </button>
  )
}
