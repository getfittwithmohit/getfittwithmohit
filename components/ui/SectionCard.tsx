interface SectionCardProps {
  section: number
  total?: number
  title: string
  subtitle: string
  children: React.ReactNode
}

export function SectionCard({
  section,
  total = 11,
  title,
  subtitle,
  children,
}: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
      <span className="inline-block bg-[#1a1f3a] text-[#00d4d4] text-xs px-3 py-1 rounded-full mb-4 tracking-wide">
        Section {section} / {total}
      </span>
      <h3 className="text-lg font-medium text-[#0f172a] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[#64748b] mb-6 leading-relaxed">
        {subtitle}
      </p>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}