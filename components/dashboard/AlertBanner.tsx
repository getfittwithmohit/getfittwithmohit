interface AlertBannerProps {
  message: string
  level: 'red' | 'amber' | 'green'
}

const styles = {
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: '⚠',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: '⚡',
  },
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: '✓',
  },
}

export function AlertBanner({ message, level }: AlertBannerProps) {
  const s = styles[level]
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs ${s.bg} ${s.border} ${s.text}`}>
      <span className="flex-shrink-0 font-medium">{s.icon}</span>
      <span className="leading-relaxed">{message}</span>
    </div>
  )
}