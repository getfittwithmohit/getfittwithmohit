'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import {
  getClientProgress,
  getThisWeekCheckinStatus,
  calcCheckinStreak,
  calcWorkoutStreak,
  calcTransformation,
} from '@/lib/supabase/queries/clients'
import { StatusCards } from '@/components/dashboard/StatusBadges'
import { StreaksPanel } from '@/components/progress/StreaksPanel'
import { BodyChart } from '@/components/progress/BodyChart'
import { TrendCharts } from '@/components/progress/TrendCharts'

export default function ClientProgressPage() {
  const { checking } = useAuthGuard('coach')
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState<any>(null)

  useEffect(() => {
    if (!clientId) return
    getClientProgress(clientId).then((data) => {
      setProgressData(data)
      setLoading(false)
    })
  }, [clientId])

  if (checking || loading) return <PageLoader />

  const { client, checkins, identity, pledge } = progressData
  const currentWeek = client?.current_week || 1
  const checkinStatus = getThisWeekCheckinStatus(checkins, currentWeek)
  const checkinStreak = calcCheckinStreak(checkins)
  const workoutStreak = calcWorkoutStreak(checkins)
  const { startWeight, currentWeight, weightLost, maxEnergy, maxSteps } =
    calcTransformation(client, checkins)

  const latestCheckin = [...checkins].sort(
    (a, b) => b.week_number - a.week_number
  )[0]

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GetFittWithMohit" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-white text-lg font-medium">
                {client?.full_name}
              </h1>
              <p className="text-white/50 text-xs">
                Week {currentWeek} · {client?.phase} · Progress Dashboard
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#00d4d4] text-xs font-medium tracking-wide">
              GETFITTWITHMOHIT
            </p>
            <p className="text-white/40 text-xs">Transform to Inspire</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Status cards */}
        <div className="mb-2">
          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
            Programme Status
          </p>
          <StatusCards
            hasOnboarding={!!client?.full_name}
            hasIdentity={!!identity}
            hasPledge={!!pledge}
            checkinStatus={checkinStatus}
            currentWeek={currentWeek}
            identityDate={identity?.created_at}
            pledgeDate={pledge?.signed_at}
            checkinDate={latestCheckin?.submitted_at}
          />
        </div>

        {/* Streaks */}
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
          Achievements & Streaks
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

        {/* Body chart */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-4">
          <BodyChart checkins={checkins} startWeight={startWeight} />
        </div>

        {/* Trend charts */}
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
          Weekly Trends
        </p>
        <TrendCharts checkins={checkins} />

      </div>
    </div>
  )
}