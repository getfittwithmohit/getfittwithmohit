'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { calcWHtR } from '@/lib/utils/whtr'

interface WHtRTrendChartProps {
  checkins: any[]
  heightInches: number | null
}

export function WHtRTrendChart({ checkins, heightInches }: WHtRTrendChartProps) {
  if (!heightInches) return null

  const data = checkins
    .filter((c) => c.week_number && c.waist_inches)
    .map((c) => {
      const whtr = calcWHtR(parseFloat(c.waist_inches), heightInches)
      return {
        week: `Wk ${c.week_number}`,
        Ratio: whtr?.ratio ?? null,
      }
    })

  if (data.length < 2) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-1">Waist-to-Height Ratio Trend</h3>
        <p className="text-xs text-[#94a3b8] py-8 text-center">
          Need at least 2 weeks of waist measurements to show a trend.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-[#0f172a] mb-1">Waist-to-Height Ratio Trend</h3>
      <p className="text-xs text-[#94a3b8] mb-4">Target: under 0.50 (dashed line)</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
          <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="5 4" strokeWidth={1.5} />
          <Line type="monotone" dataKey="Ratio" stroke="#4a7fd4" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}