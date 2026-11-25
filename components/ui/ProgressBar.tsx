interface ProgressBarProps {
  current: number
  total: number
}

// One segment per section: done segments are filled, the current one glows.
export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-[13px] font-semibold mb-2 text-[#64748b]">
        <span>Section {current} of {total}</span>
        <span>{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#E2E8F0]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: i < current ? '100%' : '0%', background: i === current - 1 ? '#00D4E8' : '#1a1f3a' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
