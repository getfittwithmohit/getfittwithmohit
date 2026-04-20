interface QuickActionsProps {
  onReengage: () => void
  onFlag: () => void
  onViewProfile: () => void
}

export function QuickActions({
  onReengage,
  onFlag,
  onViewProfile,
}: QuickActionsProps) {
  const actions = [
    {
      label: 'Re-engage',
      icon: '💬',
      onClick: onReengage,
      style: 'bg-[#1a1f3a] text-[#00d4d4] border-[#1a1f3a]',
    },
    {
      label: 'Flag at-risk',
      icon: '🚩',
      onClick: onFlag,
      style: 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#ef4444] hover:text-[#ef4444]',
    },
    {
      label: 'View profile',
      icon: '📋',
      onClick: onViewProfile,
      style: 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#00d4d4] hover:text-[#00d4d4]',
    },
  ]

  return (
    <div className="flex gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          className={`
            flex-1 py-2 px-3 rounded-lg text-xs font-medium
            border transition-all duration-150 text-center
            ${a.style}
          `}
        >
          <span className="mr-1">{a.icon}</span>
          {a.label}
        </button>
      ))}
    </div>
  )
}