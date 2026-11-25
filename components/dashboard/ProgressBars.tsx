interface ProgressBarRowProps {
  label: string
  value: number
  max?: number
  color: string
}

function ProgressBarRow({ label, value, max = 100, color }: ProgressBarRowProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[15px] mb-1.5">
        <span className="text-[#475569]">{label}</span>
        <span className="font-bold text-[#0f172a]">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-[#EEF1F4] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

interface ProgressBarsProps {
  workout: number
  nutrition: number
  overall: number
}

export function ProgressBars({ workout, nutrition, overall }: ProgressBarsProps) {
  return (
    <div>
      <ProgressBarRow label="Workout adherence" value={workout} color="#00D4E8" />
      <ProgressBarRow label="Nutrition adherence" value={nutrition} color="#4a7fd4" />
      <ProgressBarRow label="Overall progress" value={overall} color="#22c55e" />
    </div>
  )
}