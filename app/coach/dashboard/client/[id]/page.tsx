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

type Tab = 'progress' | 'edit'

const PHASES = ['Onboarding', 'Adaptation', 'Building', 'Performance', 'Maintenance']
const RISK_OPTIONS = [
  { value: 'green', label: '🟢 On Track' },
  { value: 'amber', label: '🟡 Needs Attention' },
  { value: 'red', label: '🔴 At Risk' },
]

export default function ClientProgressPage() {
  const { checking } = useAuthGuard('coach')
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('progress')

  // Edit form state
  const [editData, setEditData] = useState<any>(null)
  const [bodyMetrics, setBodyMetrics] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!clientId) return
    getClientProgress(clientId).then((data) => {
      setProgressData(data)
      setLoading(false)

      // Pre-fill edit form
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
      })

      // Pre-fill body metrics
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
    (a, b) => (b.week_number || 0) - (a.week_number || 0)
  )[0]

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      // Calculate week from start_date if changed
      let currentWeekCalc = editData.current_week
      if (editData.start_date) {
        const start = new Date(editData.start_date)
        const today = new Date()
        const diff = Math.floor(
          (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
        )
        currentWeekCalc = Math.max(1, diff + 1)
      }

      // Update client record
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
        })
        .eq('id', clientId)

      // Update body metrics — upsert latest
      if (client?.body_metrics?.[0]?.id) {
        await supabase
          .from('body_metrics')
          .update({
            weight_kg: parseFloat(bodyMetrics.weight_kg) || null,
            height_inches: parseFloat(bodyMetrics.height_inches) || null,
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
            height_inches: parseFloat(bodyMetrics.height_inches) || null,
            waist_inches: parseFloat(bodyMetrics.waist_inches) || null,
            chest_inches: parseFloat(bodyMetrics.chest_inches) || null,
            hip_inches: parseFloat(bodyMetrics.hip_inches) || null,
            target_weight_kg: parseFloat(bodyMetrics.target_weight_kg) || null,
            primary_goal: bodyMetrics.primary_goal || null,
          })
      }

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
          <div className="text-right">
            <p className="text-[#00d4d4] text-xs font-medium tracking-wide">GETFITTWITHMOHIT</p>
            <p className="text-white/40 text-xs">Transform to Inspire</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-3xl mx-auto px-4 flex gap-0">
          {[
            { key: 'progress', label: '📊 Progress' },
            { key: 'edit', label: '✏️ Edit Profile' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
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
              {field('Height (inches)', 'height_inches', 'number', 'metrics')}
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

    </div>
  )
}