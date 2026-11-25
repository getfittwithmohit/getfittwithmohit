interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
}

export function StatCard({ label, value, sub, color = '#0f172a' }: StatCardProps) {
  return (
    <div className="bg-[#F7F9FB] rounded-2xl px-3 py-3.5">
      <div
        className="text-[24px] leading-none font-extrabold tracking-tight mb-1.5"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[13px] font-medium text-[#64748b]">
        {label}
      </div>
      {sub && (
        <div className="text-xs text-[#94a3b8] mt-0.5">{sub}</div>
      )}
    </div>
  )
}