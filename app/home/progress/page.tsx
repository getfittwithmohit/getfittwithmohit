'use client'

import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import {
  getClientProgress,
  calcCheckinStreak,
  calcWorkoutStreak,
  calcTransformation,
} from '@/lib/supabase/queries/clients'
import { StreaksPanel } from '@/components/progress/StreaksPanel'
import { BodyChart } from '@/components/progress/BodyChart'
import { TrendCharts } from '@/components/progress/TrendCharts'

export default function ClientProgressPage() {
  const { checking } = useAuthGuard()
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (!client) return
      const data = await getClientProgress(client.id)
      setProgressData(data)
      setLoading(false)
    }
    load()
  }, [])

  if (checking || loading) return <PageLoader />

  const { client, checkins, pledge } = progressData
  const checkinStreak = calcCheckinStreak(checkins)
  const workoutStreak = calcWorkoutStreak(checkins)
  const { startWeight, weightLost, maxEnergy, maxSteps } =
    calcTransformation(client, checkins)

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-5 text-center">
        <img src="/logo.png" alt="GetFittWithMohit" className="w-14 h-14 object-contain mx-auto mb-2" />
        <h1 className="text-white text-lg font-medium">Your Progress</h1>
        <p className="text-white/50 text-xs mt-1">Week {client?.current_week} · {client?.phase}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
          Your Achievements
        </p>
        <StreaksPanel
          checkinStreak={checkinStreak}
          workoutStreak={workoutStreak}
          totalCheckins={checkins.length}
          weightLost={weightLost}
          maxEnergy={maxEnergy}
          maxSteps={maxSteps}
          doingThisFor={pledge?.doing_this_for || null}
        />

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-4">
          <BodyChart checkins={checkins} startWeight={startWeight} />
        </div>

        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
          Weekly Trends
        </p>
        <TrendCharts checkins={checkins} />

      </div>
    </div>
  )
}