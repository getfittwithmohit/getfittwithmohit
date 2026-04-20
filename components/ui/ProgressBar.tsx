interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-[#64748b] mb-2">
        <span>Section {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-[#e2e8f0] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #00d4d4, #4a7fd4)',
          }}
        />
      </div>
    </div>
  )
}