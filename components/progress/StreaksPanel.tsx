interface StreaksPanelProps {
  checkinStreak: number
  workoutStreak: number
  totalCheckins: number
  weightLost: number | null
  maxEnergy: number
  maxSteps: number
  doingThisFor: string | null
}

function StreakCard({
  value,
  label,
  sublabel,
  color,
  emoji,
}: {
  value: string | number
  label: string
  sublabel?: string
  color: string
  emoji: string
}) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{ background: `${color}12`, border: `1px solid ${color}30` }}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div
        className="text-3xl font-bold mb-0.5"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-xs font-medium text-[#0f172a]">{label}</div>
      {sublabel && (
        <div className="text-xs text-[#94a3b8] mt-0.5">{sublabel}</div>
      )}
    </div>
  )
}

export function StreaksPanel({
  checkinStreak,
  workoutStreak,
  totalCheckins,
  weightLost,
  maxEnergy,
  maxSteps,
  doingThisFor,
}: StreaksPanelProps) {
  return (
    <div className="mb-6">

      {/* Doing this for */}
      {doingThisFor && (
        <div className="bg-[#1a1f3a] rounded-2xl p-4 mb-4 text-center">
          <p className="text-xs text-[#00d4d4] uppercase tracking-wide mb-1">
            Doing this for
          </p>
          <p className="text-white text-sm font-medium leading-relaxed">
            "{doingThisFor}"
          </p>
        </div>
      )}

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <StreakCard
          emoji="🔥"
          value={`${checkinStreak}w`}
          label="Check-in streak"
          sublabel="consecutive weeks"
          color="#f59e0b"
        />
        <StreakCard
          emoji="💪"
          value={`${workoutStreak}w`}
          label="Workout streak"
          sublabel="3+ sessions/week"
          color="#00d4d4"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StreakCard
          emoji="📅"
          value={totalCheckins}
          label="Total check-ins"
          color="#4a7fd4"
        />
        <StreakCard
          emoji="⚡"
          value={`${maxEnergy}/10`}
          label="Best energy"
          sublabel="personal best"
          color="#22c55e"
        />
        <StreakCard
          emoji="👣"
          value={maxSteps > 0 ? `${(maxSteps / 1000).toFixed(1)}k` : '–'}
          label="Best step day"
          sublabel="personal best"
          color="#a855f7"
        />
      </div>

      {weightLost !== null && weightLost > 0 && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-600 mb-0.5">
            -{weightLost} kg
          </div>
          <div className="text-xs font-medium text-emerald-700">
            Lost since Day 1
          </div>
        </div>
      )}
    </div>
  )
}