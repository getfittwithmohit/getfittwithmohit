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
    <div
      className="bg-white rounded-3xl p-5 sm:p-6"
      style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.04)' }}
    >
      {section > 0 && (
        <p className="m-0 mb-1.5 text-xs font-bold tracking-[0.12em] uppercase" style={{ color: '#007A8A' }}>
          Section {section} of {total}
        </p>
      )}
      <h3 className="m-0 text-[22px] leading-tight font-bold tracking-tight text-[#0f172a]">
        {title}
      </h3>
      <p className="m-0 mt-1.5 mb-5 text-[15px] text-[#64748b] leading-relaxed">
        {subtitle}
      </p>
      <div className="flex flex-col gap-5">
        {children}
      </div>
    </div>
  )
}
