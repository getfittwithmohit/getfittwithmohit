'use client'

import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import type { TransformationReportData } from '@/lib/supabase/queries/transformationReport'

type ChartTab = 'weight' | 'steps' | 'lifestyle'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function TransformationReport({ data }: { data: TransformationReportData }) {
  const [tab, setTab] = useState<ChartTab>('weight')

  const {
    clientName, startDate, endDate, durationDays,
    startWeight, currentWeight, totalChange, totalCheckins,
    avgSteps, totalWorkouts, weekLabels, weightChartLabels,
    weightSeries, weightTrend, stepsSeries, stepsTrend,
    week1AvgSteps, latestAvgSteps,
    energySeries, sleepSeries, stressSeries,
    avgEnergy, avgSleep, avgStress,
    compliance, milestones,
  } = data

  const isLoss = (totalChange || 0) >= 0
  const heroLabel = isLoss ? 'Total Fat Lost' : 'Total Weight Gained'
  const heroColor = isLoss ? '#22c55e' : '#4a7fd4'

  // Chart data assembly
  const weightChartData = weightChartLabels.map((label, i) => ({
    week: label,
    Weight: weightSeries[i],
    Trend: weightTrend[i],
  }))

  const stepsChartData = weekLabels.map((label, i) => ({
    week: label,
    Steps: stepsSeries[i],
  }))

  const lifestyleChartData = weekLabels.map((label, i) => ({
    week: label,
    Energy: energySeries[i],
    Sleep: sleepSeries[i],
    Stress: stressSeries[i],
  }))

  const tickStyle = { fontSize: 11, fill: '#94a3b8' }
  const axisProps = { axisLine: false, tickLine: false }
  const gridProps = { strokeDasharray: '3 3', stroke: '#e2e8f0' }
  const tooltipStyle = {
    contentStyle: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 },
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium text-[#00d4d4] uppercase tracking-widest mb-1">
          GetFittWithMohit · Transform to Inspire
        </p>
        <h1 className="text-2xl font-bold text-[#0f172a] leading-tight">
          {clientName}'s Transformation
        </h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          {durationDays}-day coaching programme · {formatDate(startDate)} – {formatDate(endDate)}
        </p>
      </div>

      {/* Hero stat */}
      {totalChange !== null && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold" style={{ color: heroColor }}>
              {Math.abs(totalChange)}
            </span>
            <span className="text-xl font-medium text-[#94a3b8]">kg</span>
          </div>
          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mt-1 mb-2">
            {heroLabel}
          </p>
          <p className="text-sm text-[#64748b]">
            {startWeight} kg → {currentWeight} kg
          </p>
        </div>
      )}

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4">
          <div className="text-2xl mb-1">📋</div>
          <p className="text-2xl font-bold text-[#1a1f3a]">{totalCheckins}</p>
          <p className="text-xs text-[#94a3b8] uppercase tracking-wide mt-0.5">Check-ins</p>
          <p className="text-xs text-[#64748b] mt-0.5">days consistently logged</p>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4">
          <div className="text-2xl mb-1">✅</div>
          <p className="text-2xl font-bold text-emerald-600">
            {compliance.mealPlan.pct.toFixed(1)}%
          </p>
          <p className="text-xs text-[#94a3b8] uppercase tracking-wide mt-0.5">Meal Compliance</p>
          <p className="text-xs text-[#64748b] mt-0.5">{compliance.mealPlan.value} on plan</p>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4">
          <div className="text-2xl mb-1">📷</div>
          <p className="text-2xl font-bold text-amber-500">
            {avgSteps ? avgSteps.toLocaleString() : '–'}
          </p>
          <p className="text-xs text-[#94a3b8] uppercase tracking-wide mt-0.5">Daily Steps Avg</p>
          <p className="text-xs text-[#64748b] mt-0.5">steps per day</p>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4">
          <div className="text-2xl mb-1">🏆</div>
          <p className="text-2xl font-bold text-[#4a7fd4]">{totalWorkouts}</p>
          <p className="text-xs text-[#94a3b8] uppercase tracking-wide mt-0.5">Workouts Done</p>
          <p className="text-xs text-[#64748b] mt-0.5">sessions completed</p>
        </div>
      </div>

      {/* Progress Trends */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-4">
        <h3 className="text-base font-semibold text-[#0f172a] mb-1">Progress Trends</h3>
        <p className="text-xs text-[#94a3b8] mb-4">
          Actual check-in data with linear regression trendline
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'weight', label: 'Weight' },
            { key: 'steps', label: 'Steps' },
            { key: 'lifestyle', label: 'Lifestyle' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as ChartTab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#1a1f3a] text-[#00d4d4]'
                  : 'bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* WEIGHT TAB */}
        {tab === 'weight' && (
          <>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Start', value: `${startWeight} kg`, color: '#0f172a' },
                { label: 'End', value: `${currentWeight} kg`, color: '#22c55e' },
                { label: isLoss ? 'Lost' : 'Gained', value: `${Math.abs(totalChange || 0)} kg`, color: '#4a7fd4' },
                { label: 'Duration', value: `${durationDays} days`, color: '#0f172a' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#f8fafc] rounded-xl p-2.5 text-center">
                  <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-0.5">{stat.label}</p>
                  <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightChartData}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="week" tick={tickStyle} {...axisProps} />
                <YAxis tick={tickStyle} {...axisProps} domain={['auto', 'auto']} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="Weight" stroke="#4a7fd4" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Trend" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {/* STEPS TAB */}
        {tab === 'steps' && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Week 1 Avg', value: week1AvgSteps?.toLocaleString() || '–', color: '#0f172a' },
                { label: 'Programme Avg', value: avgSteps?.toLocaleString() || '–', color: '#4a7fd4' },
                { label: 'Latest Avg', value: latestAvgSteps?.toLocaleString() || '–', color: '#22c55e' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#f8fafc] rounded-xl p-2.5 text-center">
                  <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-0.5">{stat.label}</p>
                  <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stepsChartData}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="week" tick={tickStyle} {...axisProps} />
                <YAxis tick={tickStyle} {...axisProps} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="Steps" fill="#4a7fd4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {/* LIFESTYLE TAB */}
        {tab === 'lifestyle' && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Avg Energy', value: avgEnergy ? `${avgEnergy}/10` : '–', color: '#f59e0b' },
                { label: 'Avg Sleep', value: avgSleep ? `${avgSleep}/10` : '–', color: '#22c55e' },
                { label: 'Avg Stress', value: avgStress ? `${avgStress}/10` : '–', color: '#4a7fd4' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#f8fafc] rounded-xl p-2.5 text-center">
                  <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-0.5">{stat.label}</p>
                  <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lifestyleChartData}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="week" tick={tickStyle} {...axisProps} />
                <YAxis tick={tickStyle} {...axisProps} domain={[0, 10]} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="Energy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Sleep" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Stress" stroke="#4a7fd4" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              <span className="text-xs flex items-center gap-1"><span className="w-3 h-0.5 bg-[#f59e0b] inline-block" /> Energy</span>
              <span className="text-xs flex items-center gap-1"><span className="w-3 h-0.5 bg-[#22c55e] inline-block" /> Sleep</span>
              <span className="text-xs flex items-center gap-1"><span className="w-3 h-0.5 bg-[#4a7fd4] inline-block" /> Stress</span>
            </div>
          </>
        )}
      </div>

      {/* Journey Milestones */}
      {milestones.length > 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-4">
          <h3 className="text-base font-semibold text-[#0f172a] mb-1">Journey Milestones</h3>
          <p className="text-xs text-[#94a3b8] mb-4">
            Key breakthroughs across {weekLabels.length} weeks
          </p>
          <div className="flex flex-col">
            {milestones.map((m, i) => {
              const colorMap = { blue: '#4a7fd4', green: '#22c55e', orange: '#f59e0b' }
              const color = colorMap[m.color]
              return (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: color }}
                    >
                      W{m.week}
                    </div>
                    {i < milestones.length - 1 && (
                      <div className="w-px flex-1 bg-[#e2e8f0] mt-1" style={{ minHeight: 16 }} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color }}>
                      Week {m.week}
                    </p>
                    <p className="text-sm font-semibold text-[#0f172a] mt-0.5">{m.label}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{m.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Compliance Scorecard */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-4">
        <h3 className="text-base font-semibold text-[#0f172a] mb-1">Compliance Scorecard</h3>
        <p className="text-xs text-[#94a3b8] mb-4">Programme adherence across key habits</p>

        <div className="flex flex-col gap-4">
          {[
            { label: 'Meal plan', ...compliance.mealPlan, barColor: '#22c55e' },
            { label: 'Workouts', ...compliance.workouts, barColor: '#4a7fd4' },
            { label: 'Daily step goal (10k+)', ...compliance.steps, barColor: '#f59e0b' },
            { label: 'Sleep quality', ...compliance.sleep, barColor: '#60a5fa' },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#64748b]">{row.label}</span>
                <span className="font-medium text-[#0f172a]">{row.value}</span>
              </div>
              <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, row.pct)}%`, background: row.barColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand block — Transform to Inspire (only showcase genuine wins) */}
      <div className="bg-[#1a1f3a] rounded-2xl p-6 mb-4">
        <p className="text-xs font-medium text-[#00d4d4] uppercase tracking-widest mb-4">
          The GetFittWithMohit Difference
        </p>
        <div className="flex flex-col gap-2.5">
          {[
            totalChange !== null && Math.abs(totalChange) >= 1 &&
              `${Math.abs(totalChange)} kg ${isLoss ? 'lost' : 'gained'} — zero crash dieting`,
            totalWorkouts > 0 && 'No endless cardio, just focused 30–40 min sessions',
            avgEnergy !== null && avgEnergy >= 6 &&
              `Energy strong across the programme — averaging ${avgEnergy}/10`,
            avgSleep !== null && avgSleep >= 6 &&
              `Sleep excellence: ${avgSleep}/10 average`,
            compliance.mealPlan.pct >= 50 &&
              `${compliance.mealPlan.pct.toFixed(0)}% meal compliance — real discipline`,
            avgSteps !== null && avgSteps >= 3000 &&
              `${avgSteps.toLocaleString()} daily steps — consistency mastered`,
          ].filter(Boolean).map((line, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-[#00d4d4] text-sm flex-shrink-0 mt-0.5">✓</span>
              <p className="text-sm text-white/80 leading-relaxed">{line}</p>
            </div>
          ))}
          {/* If nothing qualifies yet, show an encouraging placeholder instead of an empty block */}
          {totalCheckins < 2 && (
            <p className="text-sm text-white/50 italic">
              Building momentum — more milestones will appear as check-ins continue.
            </p>
          )}
        </div>
      </div>

      {/* Closing quote */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 text-center">
        <p className="text-base text-[#0f172a] italic leading-relaxed mb-4">
          "We don't chase numbers. We rebuild the system that controls your body."
        </p>
        <div className="w-10 h-px bg-[#e2e8f0] mx-auto mb-3" />
        <p className="text-xs font-medium text-[#64748b] tracking-wide">
          COACH MOHIT · TRANSFORM TO INSPIRE
        </p>
      </div>

    </div>
  )
}