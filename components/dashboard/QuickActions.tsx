import { Icon, type IconName } from '@/components/ui/Icon'

interface QuickActionsProps {
  onReengage: () => void
  onFlag: () => void
  onViewProfile: () => void
  onStartProgramme?: () => void
  showStartProgramme?: boolean
  onSendPledge?: () => void
}

export function QuickActions({
  onReengage,
  onFlag,
  onViewProfile,
  onStartProgramme,
  showStartProgramme = false,
  onSendPledge,
}: QuickActionsProps) {
  const actions: { label: string; icon: IconName; onClick: () => void; primary?: boolean; danger?: boolean }[] = [
    { label: 'Re-engage', icon: 'chat', onClick: onReengage, primary: true },
    { label: 'Full profile', icon: 'external', onClick: onViewProfile },
    { label: 'Send pledge', icon: 'pen', onClick: onSendPledge || (() => {}) },
    { label: 'Flag at-risk', icon: 'flag', onClick: onFlag, danger: true },
  ]

  return (
    <div className="flex flex-col gap-2">
      {/* Start programme button — only for Onboarding clients */}
      {showStartProgramme && onStartProgramme && (
        <button
          onClick={onStartProgramme}
          className="w-full min-h-[50px] rounded-2xl bg-[#00D4E8] text-[#1a1f3a] text-[15px] font-bold inline-flex items-center justify-center gap-2 hover:bg-[#00C4D7] transition-colors"
        >
          <Icon name="rocket" size={18} />
          Start programme · move to Adaptation week 1
        </button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`min-h-11 px-3 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${
              a.primary
                ? 'bg-[#1a1f3a] text-[#00D4E8] hover:bg-[#141930]'
                : a.danger
                  ? 'bg-[#F2F4F7] text-[#475569] hover:bg-[#FEF2F2] hover:text-[#B91C1C]'
                  : 'bg-[#F2F4F7] text-[#0f172a] hover:bg-[#E8ECF1]'
            }`}
          >
            <Icon name={a.icon} size={17} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
