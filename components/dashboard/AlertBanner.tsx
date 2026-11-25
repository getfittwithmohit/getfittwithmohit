import { Icon, type IconName } from '@/components/ui/Icon'

interface AlertBannerProps {
  message: string
  level: 'red' | 'amber' | 'green'
}

const styles: Record<AlertBannerProps['level'], { bg: string; fg: string; icon: IconName }> = {
  red: { bg: '#FEF2F2', fg: '#B91C1C', icon: 'alert' },
  amber: { bg: '#FFFBEB', fg: '#B45309', icon: 'bolt' },
  green: { bg: '#F0FDF4', fg: '#15803D', icon: 'check' },
}

export function AlertBanner({ message, level }: AlertBannerProps) {
  const s = styles[level]
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl text-[15px]" style={{ background: s.bg, color: s.fg }}>
      <span className="flex-shrink-0 mt-px"><Icon name={s.icon} size={18} /></span>
      <span className="leading-relaxed font-medium">{message}</span>
    </div>
  )
}
