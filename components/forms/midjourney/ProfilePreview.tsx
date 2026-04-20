import { CoachPrefillData } from '@/lib/types/forms'
import { PHASES } from '@/lib/constants/phases'

interface Props {
  data: CoachPrefillData
}

export function ProfilePreview({ data }: Props) {
  const phase = data.phase ? PHASES[data.phase as keyof typeof PHASES] : null

  const weightLost =
    data.starting_weight && data.current_weight
      ? (
          parseFloat(data.starting_weight) - parseFloat(data.current_weight)
        ).toFixed(1)
      : null

  return (
    <div className="bg-[#1a1f3a] rounded-xl p-5 relative overflow-hidden">

      {/* Decorative */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#00d4d4]/5" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#4a7fd4]/5" />

      <div className="relative">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-1">
          GetFittWithMohit · Transferred Client
        </p>

        {/* Name */}
        <h3 className="text-xl font-medium text-white mb-4">
          {data.full_name || 'Client Name'}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <p className="text-sm font-medium text-[#00d4d4]">
              {data.current_week ? `Wk ${data.current_week}` : '–'}
            </p>
            <p className="text-xs text-white/40 mt-0.5 uppercase tracking-wide">
              Current Week
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <p
              className="text-sm font-medium"
              style={{ color: phase?.color || '#00d4d4' }}
            >
              {phase ? `${phase.emoji} ${phase.label}` : '–'}
            </p>
            <p className="text-xs text-white/40 mt-0.5 uppercase tracking-wide">
              Phase
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <p className="text-sm font-medium text-[#22c55e]">
              {weightLost ? `${weightLost} kg` : '–'}
            </p>
            <p className="text-xs text-white/40 mt-0.5 uppercase tracking-wide">
              Lost
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <p className="text-xs text-white/25 uppercase tracking-widest">
            Transform to Inspire
          </p>
          <p className="text-xs text-white/25">
            {new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}