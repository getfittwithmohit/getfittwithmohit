import type { WHtRResult } from '@/lib/utils/whtr'

interface WHtRCardProps {
  data: WHtRResult
  waistInches: number
  heightInches: number
}

export function WHtRCard({ data, waistInches, heightInches }: WHtRCardProps) {
  const { ratio, label, color, message } = data

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-[#0f172a]">
          Waist-to-Height Ratio
        </h3>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: `${color}15`, color }}
        >
          {label}
        </span>
      </div>
      <p className="text-xs text-[#94a3b8] mb-4">
        Waist {waistInches}" ÷ Height {heightInches}"
      </p>

      <div className="flex items-end gap-2 mb-3">
        <p className="text-3xl font-bold" style={{ color }}>{ratio}</p>
        <p className="text-xs text-[#94a3b8] mb-1">ratio (target: under 0.50)</p>
      </div>

      {/* Visual scale */}
      <div className="relative w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden mb-2">
        <div className="absolute inset-0 flex">
          <div className="bg-emerald-300" style={{ width: '50%' }} />
          <div className="bg-amber-300" style={{ width: '17%' }} />
          <div className="bg-red-300" style={{ width: '33%' }} />
        </div>
        <div
          className="absolute top-0 bottom-0 w-1 bg-[#0f172a] rounded-full"
          style={{ left: `${Math.min(100, (ratio / 0.9) * 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#94a3b8] mb-4">
        <span>0.0</span>
        <span>0.5</span>
        <span>0.6</span>
        <span>0.9+</span>
      </div>

      <p className="text-sm text-[#64748b] leading-relaxed">{message}</p>
    </div>
  )
}