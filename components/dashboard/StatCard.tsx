interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
}

export function StatCard({ label, value, sub, color = '#0f172a' }: StatCardProps) {
  return (
    <div className="bg-[#f8fafc] rounded-xl p-4 text-center border border-[#e2e8f0]">
      <div
        className="text-xl font-medium mb-0.5"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-xs text-[#94a3b8] uppercase tracking-wide">
        {label}
      </div>
      {sub && (
        <div className="text-xs text-[#64748b] mt-0.5">{sub}</div>
      )}
    </div>
  )
}