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
import { supabase } from '@/lib/supabase/client'
import { getTransformationReport, TransformationReportData } from '@/lib/supabase/queries/transformationReport'
import { TransformationReport } from '@/components/reports/TransformationReport'
import { BlueprintCard } from '@/components/blueprint/BlueprintCard'
import { generateBlueprint, isHeightPlausible, totalToFeetInches, feetInchesToTotal, formatHeight } from '@/lib/utils/blueprint'
import { calcWHtR } from '@/lib/utils/whtr'
import { WHtRCard } from '@/components/blueprint/WHtRCard'
import { WHtRTrendChart } from '@/components/progress/WHtRTrendChart'
import { calcCurrentWeek } from '@/lib/supabase/queries/clients'

type Tab = 'progress' | 'edit' | 'calls' | 'report' | 'checkins'

const FEET_OPTIONS = [3, 4, 5, 6, 7]
const INCH_OPTIONS = Array.from({ length: 12 }, (_, i) => i)

function calcAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function formatVal(v: any): string {
  if (v === null || v === undefined || v === '') return '—'
  if (Array.isArray(v)) return v.join(', ') || '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

const PHASES = ['Onboarding', 'Adaptation', 'Building', 'Performance', 'Maintenance']
const RISK_OPTIONS = [
  { value: 'green', label: '🟢 On Track' },
  { value: 'amber', label: '🟡 Needs Attention' },
  { value: 'red', label: '🔴 At Risk' },
]

function InfoSection({ title, data }: { title: string; data: Record<string, any> }) {
  const entries = Object.entries(data).filter(
    ([k, v]) => v !== null && v !== undefined && v !== '' && k !== 'id' && k !== 'client_id' && k !== 'created_at' && k !== 'updated_at'
  )
  if (!entries.length) return null
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-4">
      <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <p className="text-xs text-[#94a3b8] mb-0.5 capitalize">
              {key.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-[#0f172a] leading-relaxed">
              {Array.isArray(value)
                ? value.join(', ') || '—'
                : typeof value === 'boolean'
                  ? value ? 'Yes' : 'No'
                  : String(value) || '—'
              }
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ClientProgressPage() {
  const { checking } = useAuthGuard('coach')
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('progress')
  const [expandedCheckin, setExpandedCheckin] = useState<string | null>(null)

  // Edit form state
  const [editData, setEditData] = useState<any>(null)
  const [bodyMetrics, setBodyMetrics] = useState<any>(null)
  const [heightFeet, setHeightFeet] = useState<number>(5)
  const [heightInch, setHeightInch] = useState<number>(6)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Weekly Calls tab state
  const [calls, setCalls] = useState<any[]>([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [editingWeek, setEditingWeek] = useState<number | null>(null)
  const [callForm, setCallForm] = useState({
    status: 'completed' as 'completed' | 'missed' | 'rescheduled' | 'pending',
    discussed: '',
    changes: '',
    next_focus: '',
  })
  const [savingCall, setSavingCall] = useState(false)

  // Report tab state
  const [reportData, setReportData] = useState<TransformationReportData | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  // Export modal state
  const [exportOpen, setExportOpen] = useState(false)

  const loadReport = async () => {
    setReportLoading(true)
    try {
      const data = await getTransformationReport(clientId)
      setReportData(data)
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    if (!clientId) return
    getClientProgress(clientId).then((data) => {
      setProgressData(data)
      setLoading(false)

      setEditData({
        full_name: data.client?.full_name || '',
        email: data.client?.email || '',
        phone: data.client?.phone || '',
        gender: data.client?.gender || '',
        city: data.client?.city || '',
        occupation: data.client?.occupation || '',
        date_of_birth: data.client?.date_of_birth || '',
        phase: data.client?.phase || 'Onboarding',
        risk_status: data.client?.risk_status || 'green',
        start_date: data.client?.start_date || '',
        current_week: data.client?.current_week || 1,
        program_duration_weeks: data.client?.program_duration_weeks || 12,
      })

      const metrics = data.client?.body_metrics?.[0] || {}
      setBodyMetrics({
        weight_kg: metrics.weight_kg || '',
        height_inches: metrics.height_inches || '',
        waist_inches: metrics.waist_inches || '',
        chest_inches: metrics.chest_inches || '',
        hip_inches: metrics.hip_inches || '',
        target_weight_kg: metrics.target_weight_kg || '',
        primary_goal: metrics.primary_goal || '',
      })

      if (metrics.height_inches) {
        const { feet, inches } = totalToFeetInches(parseFloat(metrics.height_inches))
        setHeightFeet(feet)
        setHeightInch(inches)
      }
    })
  }, [clientId])

  const loadCalls = async () => {
    setCallsLoading(true)
    try {
      const res = await fetch(`/api/review-calls/list?clientId=${clientId}`)
      const data = await res.json()
      setCalls(data.calls || [])
    } catch (err) {
      console.error('Failed to load calls:', err)
    } finally {
      setCallsLoading(false)
    }
  }

  const startEditCall = (call: any) => {
    setEditingWeek(call.week_number)
    setCallForm({
      status: call.status || 'pending',
      discussed: call.discussed || '',
      changes: call.changes || '',
      next_focus: call.next_focus || '',
    })
  }

  const saveCall = async (weekNumber: number) => {
    setSavingCall(true)
    try {
      await fetch('/api/review-calls/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          weekNumber,
          status: callForm.status,
          discussed: callForm.discussed || null,
          changes: callForm.changes || null,
          next_focus: callForm.next_focus || null,
        }),
      })
      setEditingWeek(null)
      await loadCalls()
    } catch (err) {
      console.error('Save call error:', err)
      window.alert('Something went wrong.')
    } finally {
      setSavingCall(false)
    }
  }

  if (checking || loading) return <PageLoader />

  const {
    client, checkins, identity, pledge,
    medical, fitness, lifestyle, nutrition,
    psychology, expectations, assessments, hormonal,
  } = progressData
  const currentWeek =
  client?.phase === 'Onboarding' || !client?.start_date
    ? client?.current_week || 1
    : calcCurrentWeek(client.start_date)
  const checkinStatus = getThisWeekCheckinStatus(checkins, currentWeek)
  const checkinStreak = calcCheckinStreak(checkins)
  const workoutStreak = calcWorkoutStreak(checkins)
  const { startWeight, currentWeight, weightLost, maxEnergy, maxSteps } =
    calcTransformation(client, checkins)

  const latestCheckin = [...checkins].sort(
    (a, b) => (b.week_number || 0) - (a.week_number || 0)
  )[0]

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const currentWeekCalc =
  editData.phase === 'Onboarding' || !editData.start_date
    ? editData.current_week
    : calcCurrentWeek(editData.start_date)

      await supabase
        .from('clients')
        .update({
          full_name: editData.full_name,
          email: editData.email,
          phone: editData.phone,
          gender: editData.gender,
          city: editData.city,
          occupation: editData.occupation,
          date_of_birth: editData.date_of_birth || null,
          phase: editData.phase,
          risk_status: editData.risk_status,
          start_date: editData.start_date || null,
          current_week: currentWeekCalc,
          program_duration_weeks: parseInt(editData.program_duration_weeks) || 12,
        })
        .eq('id', clientId)

      const totalHeightInches = feetInchesToTotal(heightFeet, heightInch)

      if (client?.body_metrics?.[0]?.id) {
        await supabase
          .from('body_metrics')
          .update({
            weight_kg: parseFloat(bodyMetrics.weight_kg) || null,
            height_inches: totalHeightInches || null,
            waist_inches: parseFloat(bodyMetrics.waist_inches) || null,
            chest_inches: parseFloat(bodyMetrics.chest_inches) || null,
            hip_inches: parseFloat(bodyMetrics.hip_inches) || null,
            target_weight_kg: parseFloat(bodyMetrics.target_weight_kg) || null,
            primary_goal: bodyMetrics.primary_goal || null,
          })
          .eq('id', client.body_metrics[0].id)
      } else {
        await supabase
          .from('body_metrics')
          .insert({
            client_id: clientId,
            weight_kg: parseFloat(bodyMetrics.weight_kg) || null,
            height_inches: totalHeightInches || null,
            waist_inches: parseFloat(bodyMetrics.waist_inches) || null,
            chest_inches: parseFloat(bodyMetrics.chest_inches) || null,
            hip_inches: parseFloat(bodyMetrics.hip_inches) || null,
            target_weight_kg: parseFloat(bodyMetrics.target_weight_kg) || null,
            primary_goal: bodyMetrics.primary_goal || null,
          })
      }

      setBodyMetrics((prev: any) => ({ ...prev, height_inches: totalHeightInches }))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      console.error('Save error:', err)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const field = (
    label: string,
    key: string,
    type = 'text',
    source: 'client' | 'metrics' = 'client'
  ) => {
    const data = source === 'client' ? editData : bodyMetrics
    const setter = source === 'client' ? setEditData : setBodyMetrics
    return (
      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">{label}</label>
        <input
          type={type}
          value={data?.[key] || ''}
          onChange={(e) => setter((prev: any) => ({ ...prev, [key]: e.target.value }))}
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
        />
      </div>
    )
  }

  // ── Export helpers — top-level, not nested inside any render loop ──
  const buildExportText = () => {
    const lines: string[] = []
    const age = client?.date_of_birth ? calcAge(client.date_of_birth) : null

    lines.push(`# Client Profile — ${client?.full_name || ''}`)
    lines.push('')
    lines.push(`Generated: ${new Date().toLocaleDateString('en-IN')}`)
    lines.push('')

    lines.push('## Personal Information')
    lines.push(`- Full name: ${formatVal(client?.full_name)}`)
    lines.push(`- Age: ${age !== null ? age + ' years' : '—'}`)
    lines.push(`- Gender: ${formatVal(client?.gender)}`)
    lines.push(`- City: ${formatVal(client?.city)}`)
    lines.push(`- Occupation: ${formatVal(client?.occupation)}`)
    lines.push(`- Phase: ${formatVal(client?.phase)} · Week ${formatVal(client?.current_week)}`)
    lines.push('')

    lines.push('## Body Metrics')
    lines.push(`- Starting weight: ${formatVal(bodyMetrics?.weight_kg)} kg`)
    lines.push(`- Target weight: ${formatVal(bodyMetrics?.target_weight_kg)} kg`)
    lines.push(`- Height: ${formatHeight(bodyMetrics?.height_inches ? parseFloat(bodyMetrics.height_inches) : null)}`)
    lines.push(`- Waist: ${formatVal(bodyMetrics?.waist_inches)} inches`)
    lines.push(`- Chest: ${formatVal(bodyMetrics?.chest_inches)} inches`)
    lines.push(`- Hip: ${formatVal(bodyMetrics?.hip_inches)} inches`)
    lines.push(`- Primary goal: ${formatVal(bodyMetrics?.primary_goal)}`)
    lines.push('')

    if (medical) {
      lines.push('## Medical History')
      lines.push(`- Conditions: ${formatVal(medical.conditions)}`)
      lines.push(`- Injuries: ${formatVal(medical.injuries)}`)
      lines.push(`- Medications: ${formatVal(medical.medications)}`)
      lines.push(`- Recent surgery: ${formatVal(medical.recent_surgery)}`)
      lines.push(`- Under doctor's care: ${formatVal(medical.doctors_care)}`)
      lines.push('')
    }

    if (fitness) {
      lines.push('## Fitness Background')
      lines.push(`- Fitness level: ${formatVal(fitness.fitness_level)}`)
      lines.push(`- Training environments: ${formatVal(fitness.environments)}`)
      lines.push(`- Training days/week: ${formatVal(fitness.training_days)}`)
      lines.push(`- Session duration: ${formatVal(fitness.session_duration)}`)
      lines.push(`- Current activities: ${formatVal(fitness.current_activities)}`)
      lines.push('')
    }

    if (lifestyle) {
      lines.push('## Lifestyle')
      lines.push(`- Sleep duration: ${formatVal(lifestyle.sleep_duration)}`)
      lines.push(`- Sleep quality: ${formatVal(lifestyle.sleep_quality)}`)
      lines.push(`- Stress level: ${formatVal(lifestyle.stress_level)}`)
      lines.push(`- Stress sources: ${formatVal(lifestyle.stress_sources)}`)
      lines.push(`- Daily steps: ${formatVal(lifestyle.daily_steps)}`)
      lines.push(`- Typical day: ${formatVal(lifestyle.day_in_life)}`)
      lines.push('')
    }

    if (nutrition) {
      lines.push('## Nutrition')
      lines.push(`- Diet preference: ${formatVal(nutrition.diet_preference)}`)
      lines.push(`- Allergies: ${formatVal(nutrition.allergies)}`)
      lines.push(`- Disliked foods: ${formatVal(nutrition.disliked_foods)}`)
      lines.push(`- Meals per day: ${formatVal(nutrition.meals_per_day)}`)
      lines.push(`- Eating out frequency: ${formatVal(nutrition.eating_out_frequency)}`)
      lines.push(`- Digestion issues: ${formatVal(nutrition.digestion_issues)}`)
      lines.push(`- Water intake: ${formatVal(nutrition.water_intake)}`)
      lines.push('')
    }

    if (hormonal) {
      lines.push('## Hormonal Health')
      lines.push(`- Cycle regularity: ${formatVal(hormonal.cycle_regularity)}`)
      lines.push(`- Mood fluctuations: ${formatVal(hormonal.mood_fluctuations)}`)
      lines.push(`- Hormonal conditions: ${formatVal(hormonal.hormonal_conditions)}`)
      lines.push(`- Additional context: ${formatVal(hormonal.additional_context)}`)
      lines.push('')
    }

    if (psychology) {
      lines.push('## Psychology & Mindset')
      lines.push(`- Previous attempts: ${formatVal(psychology.previous_attempts)}`)
      lines.push(`- Why didn't last: ${formatVal(psychology.why_didnt_last)}`)
      lines.push(`- Readiness score: ${formatVal(psychology.readiness_score)}/10`)
      lines.push(`- Willingness score: ${formatVal(psychology.willingness_score)}/10`)
      lines.push(`- Biggest fear: ${formatVal(psychology.biggest_fear)}`)
      lines.push(`- Support system: ${formatVal(psychology.support_system)}`)
      lines.push('')
    }

    if (expectations) {
      lines.push('## Goals & Expectations')
      lines.push(`- Success in 3 months: ${formatVal(expectations.success_3_months)}`)
      lines.push(`- Success in 12 months: ${formatVal(expectations.success_12_months)}`)
      lines.push(`- Anything else: ${formatVal(expectations.anything_else)}`)
      lines.push('')
    }

    if (pledge) {
      lines.push('## Commitment Pledge')
      lines.push(`- Why transform: ${formatVal(pledge.why_transform)}`)
      lines.push(`- Doing this for: ${formatVal(pledge.doing_this_for)}`)
      lines.push(`- Cost of inconsistency: ${formatVal(pledge.cost_of_inconsistency)}`)
      lines.push(`- Person becoming: ${formatVal(pledge.person_becoming)}`)
      lines.push('')
    }

    if (identity) {
      lines.push('## Purpose & Identity')
      lines.push(`- Surface goal: ${formatVal(identity.surface_goal)}`)
      lines.push(`- Deep why: ${formatVal(identity.deep_why)}`)
      lines.push(`- Identity statement: ${formatVal(identity.identity_statement)}`)
      lines.push(`- Identity person: ${formatVal(identity.identity_person)}`)
      lines.push(`- Values: ${formatVal(identity.values)}`)
      lines.push(`- Obstacle: ${formatVal(identity.obstacle)}`)
      lines.push(`- Personal commitment: ${formatVal(identity.personal_commitment)}`)
      lines.push(`- Life vision: ${formatVal(identity.life_vision)}`)
      lines.push(`- Re-engagement anchor: ${formatVal(identity.reengagement_anchor)}`)
      lines.push('')
    }

    if (checkins?.length) {
      lines.push('## Recent Check-ins (most recent 5)')
      const recent = [...checkins]
        .sort((a, b) => (b.week_number || 0) - (a.week_number || 0))
        .slice(0, 5)
      recent.forEach((c: any) => {
        lines.push(`### Week ${formatVal(c.week_number)}`)
        lines.push(`- Weight: ${formatVal(c.weight_kg)} kg`)
        lines.push(`- Workouts completed: ${formatVal(c.workouts_completed)}`)
        lines.push(`- Nutrition adherence: ${formatVal(c.nutrition_adherence)}/10`)
        lines.push(`- Energy level: ${formatVal(c.energy_level)}/10`)
        lines.push(`- Sleep quality: ${formatVal(c.sleep_quality)}`)
        lines.push(`- Stress level: ${formatVal(c.stress_level)}`)
        lines.push(`- Biggest win: ${formatVal(c.biggest_win)}`)
        lines.push(`- Biggest challenge: ${formatVal(c.biggest_challenge)}`)
        lines.push('')
      })
    }

    if (assessments?.length) {
      const a = assessments[0]
      lines.push('## Latest Assessment')
      lines.push(`- Environment: ${formatVal(a.environment)}`)
      lines.push(`- Endurance: ${formatVal(a.endurance_result)}`)
      lines.push(`- Strength reps: ${formatVal(a.strength_reps)}`)
      lines.push(`- Flexibility: ${formatVal(a.flexibility_result)}`)
      lines.push(`- Mobility: ${formatVal(a.mobility_result)}`)
      lines.push('')
    }

    lines.push('---')
    lines.push('Use the information above to create a personalised workout plan, nutrition plan, or lifestyle/wellbeing plan for this client, tailored to their goals, constraints, and routine.')

    return lines.join('\n')
  }

  const handleCopyExport = () => {
    navigator.clipboard.writeText(buildExportText())
    window.alert('Copied to clipboard! Paste it into ChatGPT or any AI tool.')
  }

  const handleDownloadExport = () => {
    const blob = new Blob([buildExportText()], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(client?.full_name || 'client').replace(/\s+/g, '_')}_profile.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.close()}
              className="text-white/40 hover:text-white/70 text-xs mr-2 transition-colors"
            >
              ← Close
            </button>
            <img src="/logo.png" alt="GetFittWithMohit" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-white text-lg font-medium">{client?.full_name}</h1>
              <p className="text-white/50 text-xs">
                Week {currentWeek} · {client?.phase}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExportOpen(true)}
              className="text-white/60 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors"
            >
              📤 Export Data
            </button>
            <div className="text-right">
              <p className="text-[#00d4d4] text-xs font-medium tracking-wide">GETFITTWITHMOHIT</p>
              <p className="text-white/40 text-xs">Transform to Inspire</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-3xl mx-auto px-4 flex gap-0">
          {[
            { key: 'progress', label: '📊 Progress' },
            { key: 'edit', label: '✏️ Edit Profile' },
            { key: 'calls', label: '📞 Weekly Calls' },
            { key: 'checkins', label: '📝 Check-ins' },
            { key: 'report', label: '📑 Report' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key as Tab)
                if (t.key === 'calls' && calls.length === 0) loadCalls()
                if (t.key === 'report' && !reportData) loadReport()
              }}
              className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[#00d4d4] text-[#0f172a]'
                  : 'border-transparent text-[#94a3b8] hover:text-[#64748b]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Tab */}
      {tab === 'progress' && (
        <div className="max-w-3xl mx-auto px-4 py-6">
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

          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-4">
            <BodyChart checkins={checkins} startWeight={startWeight} />
          </div>

          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
            Weekly Trends
          </p>
          <TrendCharts checkins={checkins} />

          {bodyMetrics?.height_inches && isHeightPlausible(parseFloat(bodyMetrics.height_inches)) && (
            <div className="mt-4">
              <WHtRTrendChart
                checkins={checkins}
                heightInches={parseFloat(bodyMetrics.height_inches)}
              />
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Tab */}
      {tab === 'edit' && editData && (
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* Section 1 — Personal */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-4">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-4">
              Personal Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field('Full name', 'full_name')}
              {field('Email', 'email', 'email')}
              {field('Phone', 'phone', 'tel')}
              {field('Gender', 'gender')}
              {field('City', 'city')}
              {field('Occupation', 'occupation')}
              {field('Date of birth', 'date_of_birth', 'date')}
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Age</label>
                <div className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] text-[#64748b]">
                  {editData.date_of_birth ? `${calcAge(editData.date_of_birth)} years` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 — Programme */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-4">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-4">
              Programme
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Phase</label>
                <select
                  value={editData.phase}
                  onChange={(e) => setEditData((p: any) => ({ ...p, phase: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Risk status</label>
                <select
                  value={editData.risk_status}
                  onChange={(e) => setEditData((p: any) => ({ ...p, risk_status: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                >
                  {RISK_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  Start date
                </label>
                <input
                  type="date"
                  value={editData.start_date || ''}
                  onChange={(e) => setEditData((p: any) => ({ ...p, start_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  Current week (auto-calculated from start date on save)
                </label>
                <div className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] text-[#64748b]">
                  Week {editData.current_week}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  Programme duration (weeks)
                </label>
                <input
                  type="number"
                  value={editData.program_duration_weeks || ''}
                  onChange={(e) => setEditData((p: any) => ({ ...p, program_duration_weeks: e.target.value }))}
                  placeholder="12"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 3 — Body Metrics */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-4">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-4">
              Body Metrics
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field('Starting weight (kg)', 'weight_kg', 'number', 'metrics')}
              {field('Target weight (kg)', 'target_weight_kg', 'number', 'metrics')}

              {/* Height — Feet + Inches */}
              <div className="col-span-2">
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Height</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#94a3b8] mb-1 block">Feet</label>
                    <select
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                    >
                      {FEET_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f} ft</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] mb-1 block">Inches</label>
                    <select
                      value={heightInch}
                      onChange={(e) => setHeightInch(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                    >
                      {INCH_OPTIONS.map((i) => (
                        <option key={i} value={i}>{i} in</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-[#94a3b8] mt-1.5">
                  {heightFeet}' {heightInch}" — {feetInchesToTotal(heightFeet, heightInch)} inches total
                </p>
              </div>

              {field('Waist (inches)', 'waist_inches', 'number', 'metrics')}
              {field('Chest (inches)', 'chest_inches', 'number', 'metrics')}
              {field('Hip (inches)', 'hip_inches', 'number', 'metrics')}
              <div className="col-span-2">
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Primary goal</label>
                <input
                  type="text"
                  value={bodyMetrics?.primary_goal || ''}
                  onChange={(e) => setBodyMetrics((p: any) => ({ ...p, primary_goal: e.target.value }))}
                  placeholder="e.g. Fat loss, muscle gain, body recomposition..."
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Check-in history — read only */}
          {checkins.length > 0 && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-4">
              <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-4">
                Check-in History ({checkins.length} total)
              </p>
              <div className="flex flex-col gap-2">
                {[...checkins]
                  .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                  .map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[#0f172a]">
                          {c.week_number ? `Week ${c.week_number}` : `#${checkins.length - i}`}
                        </span>
                        <span className="text-xs text-[#94a3b8]">
                          {new Date(c.submitted_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#64748b]">
                        {c.weight_kg && <span>⚖️ {c.weight_kg}kg</span>}
                        {c.workouts_completed && <span>💪 {c.workouts_completed} workouts</span>}
                        {c.energy_level && <span>⚡ {c.energy_level}/10</span>}
                        {c.week_rating && <span>⭐ {c.week_rating}/10</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Commitment Pledge */}
          {pledge && (
            <InfoSection title="Commitment Pledge" data={{
              signed_at: new Date(pledge.signed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
              doing_this_for: pledge.doing_this_for,
              why_transform: pledge.why_transform,
              cost_of_inconsistency: pledge.cost_of_inconsistency,
              person_becoming: pledge.person_becoming,
              agreements: pledge.agreements,
            }} />
          )}

          {/* Purpose & Identity */}
          {identity && (
            <InfoSection title="Purpose & Identity" data={{
              submitted: new Date(identity.created_at).toLocaleDateString('en-IN'),
              surface_goal: identity.surface_goal,
              deep_why: identity.deep_why,
              identity_statement: identity.identity_statement,
              identity_person: identity.identity_person,
              values: identity.values,
              obstacle: identity.obstacle,
              personal_commitment: identity.personal_commitment,
              life_vision: identity.life_vision,
              reengagement_anchor: identity.reengagement_anchor,
            }} />
          )}

          {/* Medical History */}
          {medical && (
            <InfoSection title="Medical History" data={{
              conditions: medical.conditions,
              injuries: medical.injuries,
              medications: medical.medications,
              recent_surgery: medical.recent_surgery,
              doctors_care: medical.doctors_care,
            }} />
          )}

          {/* Fitness Background */}
          {fitness && (
            <InfoSection title="Fitness Background" data={{
              fitness_level: fitness.fitness_level,
              environments: fitness.environments,
              training_days: fitness.training_days,
              session_duration: fitness.session_duration,
              current_activities: fitness.current_activities,
            }} />
          )}

          {/* Lifestyle */}
          {lifestyle && (
            <InfoSection title="Lifestyle" data={{
              sleep_duration: lifestyle.sleep_duration,
              sleep_quality: lifestyle.sleep_quality,
              stress_level: lifestyle.stress_level,
              stress_sources: lifestyle.stress_sources,
              daily_steps: lifestyle.daily_steps,
              day_in_life: lifestyle.day_in_life,
            }} />
          )}

          {/* Nutrition */}
          {nutrition && (
            <InfoSection title="Nutrition" data={{
              diet_preference: nutrition.diet_preference,
              allergies: nutrition.allergies,
              disliked_foods: nutrition.disliked_foods,
              meals_per_day: nutrition.meals_per_day,
              eating_out_frequency: nutrition.eating_out_frequency,
              digestion_issues: nutrition.digestion_issues,
              water_intake: nutrition.water_intake,
            }} />
          )}

          {/* Hormonal Health */}
          {hormonal && (
            <InfoSection title="Hormonal Health" data={{
              cycle_regularity: hormonal.cycle_regularity,
              mood_fluctuations: hormonal.mood_fluctuations,
              hormonal_conditions: hormonal.hormonal_conditions,
              additional_context: hormonal.additional_context,
            }} />
          )}

          {/* Psychology */}
          {psychology && (
            <InfoSection title="Psychology & Mindset" data={{
              previous_attempts: psychology.previous_attempts,
              why_didnt_last: psychology.why_didnt_last,
              readiness_score: psychology.readiness_score ? `${psychology.readiness_score}/10` : null,
              willingness_score: psychology.willingness_score ? `${psychology.willingness_score}/10` : null,
              biggest_fear: psychology.biggest_fear,
              support_system: psychology.support_system,
            }} />
          )}

          {/* Expectations */}
          {expectations && (
            <InfoSection title="Goals & Expectations" data={{
              success_3_months: expectations.success_3_months,
              success_12_months: expectations.success_12_months,
              referral_source: expectations.referral_source,
              anything_else: expectations.anything_else,
            }} />
          )}

          {/* Assessments */}
          {assessments.length > 0 && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-4">
              <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-4">
                Assessments ({assessments.length} total)
              </p>
              <div className="flex flex-col gap-3">
                {assessments.map((a: any, i: number) => (
                  <div key={i} className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-[#0f172a]">
                        Assessment #{assessments.length - i}
                      </p>
                      <p className="text-xs text-[#94a3b8]">
                        {new Date(a.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {a.environment && <span className="text-[#64748b]">🏋️ {a.environment}</span>}
                      {a.endurance_result && <span className="text-[#64748b]">🏃 Endurance: {a.endurance_result}</span>}
                      {a.strength_reps && <span className="text-[#64748b]">💪 Strength: {a.strength_reps} reps</span>}
                      {a.flexibility_result && <span className="text-[#64748b]">🧘 Flexibility: {a.flexibility_result}</span>}
                      {a.mobility_result && <span className="text-[#64748b]">⚡ Mobility: {a.mobility_result}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center justify-between">
            {saveSuccess && (
              <p className="text-sm text-emerald-600 font-medium">
                ✅ Saved successfully
              </p>
            )}
            {!saveSuccess && <div />}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1a1f3a] text-[#00d4d4] px-8 py-3 rounded-xl text-sm font-medium hover:bg-[#141930] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes →'}
            </button>
          </div>

        </div>
      )}

      {/* Weekly Calls Tab */}
      {tab === 'calls' && (
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* Programme summary */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-1">Programme</p>
                <p className="text-lg font-semibold text-[#0f172a]">
                  Week {currentWeek} of {editData?.program_duration_weeks || client?.program_duration_weeks || 12}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600">
                    {calls.filter((c) => c.status === 'completed').length}
                  </p>
                  <p className="text-xs text-[#94a3b8]">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-red-500">
                    {calls.filter((c) => c.status === 'missed').length}
                  </p>
                  <p className="text-xs text-[#94a3b8]">Missed</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-500">
                    {calls.filter((c) => c.status === 'pending').length}
                  </p>
                  <p className="text-xs text-[#94a3b8]">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Program duration setting */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-5">
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
              Programme duration (weeks)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={editData?.program_duration_weeks || ''}
                onChange={(e) => setEditData((p: any) => ({ ...p, program_duration_weeks: e.target.value }))}
                placeholder="12"
                className="w-32 px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
              <button
                onClick={async () => {
                  await supabase
                    .from('clients')
                    .update({ program_duration_weeks: parseInt(editData.program_duration_weeks) || 12 })
                    .eq('id', clientId)
                  window.alert('Programme duration updated')
                }}
                className="bg-[#1a1f3a] text-[#00d4d4] px-5 py-2.5 rounded-lg text-xs font-medium hover:bg-[#141930] transition-colors"
              >
                Update
              </button>
            </div>
          </div>

          {/* Call history */}
          {callsLoading && (
            <div className="text-center py-12 text-sm text-[#94a3b8]">Loading call history...</div>
          )}

          {!callsLoading && calls.length === 0 && (
            <div className="text-center py-12 text-sm text-[#94a3b8]">
              No review calls yet. They'll appear here as weeks progress.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {calls.map((call) => {
              const statusConfig: Record<string, { emoji: string; color: string; bg: string }> = {
                completed: { emoji: '✅', color: '#22c55e', bg: '#f0fdf4' },
                missed: { emoji: '❌', color: '#ef4444', bg: '#fef2f2' },
                rescheduled: { emoji: '🔄', color: '#4a7fd4', bg: '#eff6ff' },
                pending: { emoji: '⏳', color: '#f59e0b', bg: '#fffbeb' },
              }
              const cfg = statusConfig[call.status] || statusConfig.pending
              const isEditing = editingWeek === call.week_number

              return (
                <div
                  key={call.week_number}
                  className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => isEditing ? setEditingWeek(null) : startEditCall(call)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.emoji} Week {call.week_number}
                      </span>
                      {call.status === 'completed' && call.discussed && (
                        <p className="text-xs text-[#64748b] truncate max-w-xs">
                          {call.discussed}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-[#94a3b8]">
                      {isEditing ? 'Close ▲' : 'Edit ▼'}
                    </span>
                  </div>

                  {isEditing && (
                    <div className="px-4 pb-4 border-t border-[#e2e8f0] pt-4">
                      <div className="flex gap-2 mb-3">
                        {[
                          { value: 'completed', label: '✅ Completed' },
                          { value: 'missed', label: '❌ Missed' },
                          { value: 'rescheduled', label: '🔄 Rescheduled' },
                          { value: 'pending', label: '⏳ Pending' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setCallForm((p) => ({ ...p, status: opt.value as any }))}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                              callForm.status === opt.value
                                ? 'bg-[#1a1f3a] text-[#00d4d4] border-[#1a1f3a]'
                                : 'bg-white text-[#64748b] border-[#e2e8f0]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {callForm.status === 'completed' && (
                        <div className="flex flex-col gap-2 mb-3">
                          <div>
                            <label className="text-xs text-[#94a3b8] mb-1 block">What we discussed</label>
                            <textarea
                              value={callForm.discussed}
                              onChange={(e) => setCallForm((p) => ({ ...p, discussed: e.target.value }))}
                              rows={2}
                              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#00d4d4] resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#94a3b8] mb-1 block">What we're changing</label>
                            <textarea
                              value={callForm.changes}
                              onChange={(e) => setCallForm((p) => ({ ...p, changes: e.target.value }))}
                              rows={2}
                              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#00d4d4] resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#94a3b8] mb-1 block">Next week's focus</label>
                            <textarea
                              value={callForm.next_focus}
                              onChange={(e) => setCallForm((p) => ({ ...p, next_focus: e.target.value }))}
                              rows={2}
                              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#00d4d4] resize-none"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => saveCall(call.week_number)}
                        disabled={savingCall}
                        className="w-full bg-[#1a1f3a] text-[#00d4d4] py-2.5 rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        {savingCall ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      )}

      {/* Report Tab */}
      {/* Check-ins Tab — full weekly_checkins data, ordered like the coach's SQL query */}
      {tab === 'checkins' && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          {checkins.length === 0 ? (
            <p className="text-sm text-[#94a3b8] text-center py-16">
              No check-ins yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {[...checkins]
                .sort((a, b) => (a.week_number ?? 0) - (b.week_number ?? 0))
                .map((c, i) => {
                  const isOpen = expandedCheckin === c.id
                  return (
                    <div key={c.id} className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCheckin(isOpen ? null : c.id)}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#f8fafc] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[#0f172a]">
                            {c.week_number ? `Week ${c.week_number}` : `Check-in ${i + 1}`}
                          </span>
                          <span className="text-xs text-[#94a3b8]">
                            {new Date(c.submitted_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#64748b]">
                          {c.weight_kg != null && <span>⚖️ {c.weight_kg}kg</span>}
                          {c.workouts_completed != null && <span>💪 {c.workouts_completed} workouts</span>}
                          {c.energy_level != null && <span>⚡ {c.energy_level}/10</span>}
                          {c.week_rating != null && <span>⭐ {c.week_rating}/10</span>}
                          <span className="text-[#94a3b8]">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#e2e8f0] px-5 py-4 bg-[#f8fafc]">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {Object.entries({
                              'Weight (kg)': c.weight_kg,
                              'Waist (in)': c.waist_inches,
                              'Lower belly (in)': c.lower_belly_inches,
                              'Thigh (in)': c.thigh_inches,
                              'Daily steps': c.daily_steps,
                              'Health issues': c.health_issues,
                              'Workouts completed': c.workouts_completed,
                              'Workout intensity': c.workout_intensity,
                              'Nutrition adherence': c.nutrition_adherence,
                              'Water intake': c.water_intake,
                              'Meals followed': c.meals_followed,
                              'Mood': c.mood,
                              'Energy level': c.energy_level,
                              'Sleep duration': c.sleep_duration,
                              'Sleep quality': c.sleep_quality,
                              'Stress level': c.stress_level,
                              'Biggest win': c.biggest_win,
                              'Biggest challenge': c.biggest_challenge,
                              'Real-life context': c.real_life_context,
                              'Mindset answer': c.mindset_answer,
                              'Why connection': c.why_connection,
                              'Needs from coach': c.needs_from_coach,
                              'Week rating': c.week_rating,
                              'Call booked': c.call_booked,
                              'Coach notes': c.coach_notes,
                            }).map(([label, value]) => (
                              <div key={label}>
                                <p className="text-xs text-[#94a3b8] mb-0.5">{label}</p>
                                <p className="text-sm text-[#0f172a] leading-relaxed">{formatVal(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {tab === 'report' && (
        <div>
          {reportLoading && (
            <div className="text-center py-16 text-sm text-[#94a3b8]">
              Generating transformation report...
            </div>
          )}
          {!reportLoading && !reportData && (
            <div className="text-center py-16 text-sm text-[#94a3b8]">
              Not enough check-in data yet to generate a report.
            </div>
          )}
          {!reportLoading && reportData && (
            <>
              <TransformationReport data={reportData} />
              {bodyMetrics?.height_inches && (
                <div className="max-w-2xl mx-auto px-4 pb-8 flex flex-col gap-4">
                  {isHeightPlausible(parseFloat(bodyMetrics.height_inches)) ? (
                    <>
                      <BlueprintCard
                        data={generateBlueprint(
                          reportData.currentWeight || 0,
                          parseFloat(bodyMetrics.height_inches),
                          client?.gender || null
                        )}
                        currentWeightKg={reportData.currentWeight || 0}
                        clientName={client?.full_name}
                      />
                      {bodyMetrics?.waist_inches && (() => {
                        const heightIn = parseFloat(bodyMetrics.height_inches)
                        const waistIn = parseFloat(bodyMetrics.waist_inches)
                        const whtr = calcWHtR(waistIn, heightIn)
                        return whtr ? (
                          <WHtRCard data={whtr} waistInches={waistIn} heightInches={heightIn} />
                        ) : null
                      })()}
                    </>
                  ) : (
                    <div className="bg-white border border-amber-200 rounded-2xl p-6">
                      <h3 className="text-base font-semibold text-[#0f172a] mb-2">
                        Fat Loss Blueprint
                      </h3>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-700 leading-relaxed">
                          ⚠ Height on file looks incorrect. Please correct the height in the{' '}
                          <button
                            onClick={() => setTab('edit')}
                            className="underline font-medium hover:text-amber-800"
                          >
                            Edit Profile
                          </button>{' '}
                          tab to see the blueprint.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Export modal */}
      {exportOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setExportOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#0f172a]">Export Client Data</h3>
              <button
                onClick={() => setExportOpen(false)}
                className="text-[#94a3b8] hover:text-[#64748b] text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <p className="text-xs text-[#64748b] mb-3">
                Copy this and paste into ChatGPT (or any AI tool) to generate a personalised
                workout, nutrition, or lifestyle plan for this client.
              </p>
              <textarea
                readOnly
                value={buildExportText()}
                rows={16}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-xs font-mono focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#e2e8f0]">
              <button
                onClick={handleCopyExport}
                className="flex-1 bg-[#1a1f3a] text-[#00d4d4] py-2.5 rounded-lg text-sm font-medium hover:bg-[#141930] transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleDownloadExport}
                className="px-5 py-2.5 rounded-lg text-sm text-[#64748b] border border-[#e2e8f0] hover:border-[#94a3b8] transition-colors"
              >
                Download .md
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}