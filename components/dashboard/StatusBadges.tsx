interface StatusBadgesProps {
  hasOnboarding: boolean
  hasIdentity: boolean
  hasPledge: boolean
  checkinStatus: 'submitted' | 'pending'
  mode?: 'icons' | 'full'
  currentWeek?: number
  identityDate?: string | null
  pledgeDate?: string | null
  checkinDate?: string | null
}

const STATUS = {
  onboarding: { icon: '📋', label: 'Onboarding' },
  identity: { icon: '🪪', label: 'Identity & Purpose' },
  pledge: { icon: '🤝', label: 'Commitment Pledge' },
  checkin: { icon: '✓', label: 'This week\'s check-in' },
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// Icon-only row for client list
export function StatusIcons({
  hasOnboarding,
  hasIdentity,
  hasPledge,
  checkinStatus,
}: StatusBadgesProps) {
  const items = [
    { done: hasOnboarding, icon: '📋' },
    { done: hasIdentity, icon: '🪪' },
    { done: hasPledge, icon: '🤝' },
    { done: checkinStatus === 'submitted', icon: '✓' },
  ]

  return (
    <div className="flex gap-1 mt-1">
      {items.map((item, i) => (
        <span
          key={i}
          className={`text-xs px-1 rounded ${
            item.done
              ? 'opacity-100'
              : 'opacity-20'
          }`}
          title={item.done ? 'Complete' : 'Pending'}
        >
          {item.icon}
        </span>
      ))}
    </div>
  )
}

// Full status cards for detail panel
export function StatusCards({
  hasOnboarding,
  hasIdentity,
  hasPledge,
  checkinStatus,
  currentWeek,
  identityDate,
  pledgeDate,
  checkinDate,
}: StatusBadgesProps) {
  const items = [
    {
      icon: STATUS.onboarding.icon,
      label: STATUS.onboarding.label,
      done: hasOnboarding,
      date: null,
      detail: hasOnboarding ? 'Profile complete' : 'Not submitted',
    },
    {
      icon: STATUS.identity.icon,
      label: STATUS.identity.label,
      done: hasIdentity,
      date: formatDate(identityDate),
      detail: hasIdentity ? `Filled ${formatDate(identityDate)}` : 'Not filled yet',
    },
    {
      icon: STATUS.pledge.icon,
      label: STATUS.pledge.label,
      done: hasPledge,
      date: formatDate(pledgeDate),
      detail: hasPledge ? `Signed ${formatDate(pledgeDate)}` : 'Not signed yet',
    },
    {
      icon: STATUS.checkin.icon,
      label: `Week ${currentWeek || '–'} check-in`,
      done: checkinStatus === 'submitted',
      date: formatDate(checkinDate),
      detail: checkinStatus === 'submitted'
        ? `Submitted ${formatDate(checkinDate)}`
        : '⚠️ Not submitted yet',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {items.map((item, i) => (
        <div
          key={i}
          className={`rounded-xl p-3 border ${
            item.done
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{item.icon}</span>
            <span className={`text-xs font-medium ${
              item.done ? 'text-emerald-700' : 'text-red-600'
            }`}>
              {item.label}
            </span>
          </div>
          <p className={`text-xs ${
            item.done ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {item.detail}
          </p>
        </div>
      ))}
    </div>
  )
}