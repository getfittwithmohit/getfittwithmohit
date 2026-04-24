'use client'

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

interface TrendChartsProps {
  checkins: any[]
}

function TrendCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 mb-4">
      <h4 className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-4">
        {title}
      </h4>
      {children}
    </div>
  )
}

export function TrendCharts({ checkins }: TrendChartsProps) {
  const data = checkins
    .filter((c) => c.week_number)
    .map((c) => ({
      week: `Wk ${c.week_number}`,
      Energy: c.energy_level || null,
      Stress: c.stress_level || null,
      Steps: c.daily_steps || null,
      Workout: c.workouts_completed || null,
      Nutrition: c.nutrition_adherence || null,
      Rating: c.week_rating || null,
      Mood: c.mood || null,
      SAVER: c.saver_days || null,
    }))

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-[#94a3b8]">
        No trend data yet
      </div>
    )
  }

  const tickStyle = { fontSize: 11, fill: '#94a3b8' }
  const axisProps = { axisLine: false, tickLine: false }
  const gridProps = { strokeDasharray: '3 3', stroke: '#e2e8f0' }
  const tooltipStyle = {
    contentStyle: {
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      fontSize: 12,
    }
  }

  return (
    <div>

      {/* Energy & Stress */}
      <TrendCard title="Energy vs Stress (1–10)">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="week" tick={tickStyle} {...axisProps} />
            <YAxis domain={[0, 10]} tick={tickStyle} {...axisProps} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="Energy" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="Stress" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <span className="text-xs flex items-center gap-1"><span className="w-3 h-0.5 bg-[#22c55e] inline-block" /> Energy</span>
          <span className="text-xs flex items-center gap-1"><span className="w-3 h-0.5 bg-[#ef4444] inline-block" /> Stress</span>
        </div>
      </TrendCard>

      {/* Daily Steps */}
      <TrendCard title="Daily Steps">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="week" tick={tickStyle} {...axisProps} />
            <YAxis tick={tickStyle} {...axisProps} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="Steps" fill="#4a7fd4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </TrendCard>

      {/* Workout & Nutrition Adherence */}
      <TrendCard title="Workout sessions & Nutrition adherence">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="week" tick={tickStyle} {...axisProps} />
            <YAxis tick={tickStyle} {...axisProps} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="Workout" fill="#00d4d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Nutrition" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="SAVER" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
  <span className="text-xs flex items-center gap-1"><span className="w-3 h-2 bg-[#00d4d4] inline-block rounded" /> Workouts</span>
  <span className="text-xs flex items-center gap-1"><span className="w-3 h-2 bg-[#f59e0b] inline-block rounded" /> Nutrition /10</span>
  <span className="text-xs flex items-center gap-1"><span className="w-3 h-2 bg-[#a855f7] inline-block rounded" /> SAVER days</span>
</div>
      </TrendCard>

      {/* Week Rating */}
      <TrendCard title="Week rating (1–10)">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="week" tick={tickStyle} {...axisProps} />
            <YAxis domain={[0, 10]} tick={tickStyle} {...axisProps} />
            <Tooltip {...tooltipStyle} />
            <Line
              type="monotone"
              dataKey="Rating"
              stroke="#a855f7"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#a855f7' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </TrendCard>

    </div>
  )
}