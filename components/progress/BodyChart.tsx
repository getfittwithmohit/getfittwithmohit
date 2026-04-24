'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface BodyChartProps {
  checkins: any[]
  startWeight: number | null
}

export function BodyChart({ checkins, startWeight }: BodyChartProps) {
  const data = checkins
    .filter((c) => c.week_number)
    .map((c) => ({
      week: `Wk ${c.week_number}`,
      Weight: c.weight_kg || null,
      Waist: c.waist_inches || null,
      'Lower Belly': c.lower_belly_inches || null,
      Hip: c.hip_inches || null,
      Thigh: c.thigh_inches || null,
      Chest: c.chest_inches || null,
    }))

  const LINES = [
    { key: 'Weight', color: '#00d4d4', unit: 'kg' },
    { key: 'Waist', color: '#4a7fd4', unit: 'in' },
    { key: 'Lower Belly', color: '#f59e0b', unit: 'in' },
    { key: 'Hip', color: '#a855f7', unit: 'in' },
    { key: 'Thigh', color: '#22c55e', unit: 'in' },
    { key: 'Chest', color: '#ef4444', unit: 'in' },
  ]

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[#94a3b8]">
        No measurement data yet
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-[#0f172a] mb-1">
        Body Measurements
      </h3>
      <p className="text-xs text-[#94a3b8] mb-4">
        Weight (kg) · All measurements (inches)
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          />
          {LINES.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 4, fill: line.color }}
              connectNulls
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}