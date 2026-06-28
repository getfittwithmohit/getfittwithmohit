import type { BlueprintResult } from '@/lib/utils/blueprint'

interface BlueprintCardProps {
  data: BlueprintResult
  currentWeightKg: number
  clientName?: string
}

export function BlueprintCard({ data, currentWeightKg, clientName }: BlueprintCardProps) {
  const {
    idealWeightKg, calories, proteinG, fatsG, fiberG, carbsG, caution, notApplicable,
  } = data

  if (notApplicable) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6">
        <h3 className="text-base font-semibold text-[#0f172a] mb-2">
          Fat Loss Blueprint
        </h3>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 leading-relaxed">
            {clientName ? `${clientName}'s` : 'This client\'s'} current weight ({currentWeightKg} kg) is already
            at or below their ideal weight ({idealWeightKg} kg). A fat-loss blueprint isn't the right tool here —
            consider a lean-gain or recomposition approach instead.
          </p>
        </div>
      </div>
    )
  }

  const macros = [
    { label: 'Calories', value: calories, unit: 'kcal', color: '#1a1f3a' },
    { label: 'Protein', value: proteinG, unit: 'g', color: '#22c55e' },
    { label: 'Fats', value: fatsG, unit: 'g', color: '#f59e0b' },
    { label: 'Carbs', value: carbsG, unit: 'g', color: '#4a7fd4' },
    { label: 'Fiber', value: fiberG, unit: 'g', color: '#a855f7' },
  ]

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6">
      <h3 className="text-base font-semibold text-[#0f172a] mb-1">
        Fat Loss Blueprint
      </h3>
      <p className="text-xs text-[#94a3b8] mb-4">
        Based on current weight {currentWeightKg} kg · Ideal weight {idealWeightKg} kg
      </p>

      {caution && (
        <div className={`rounded-xl p-3 mb-4 border ${
          caution === 'low'
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <p className={`text-xs leading-relaxed ${
            caution === 'low' ? 'text-red-700' : 'text-amber-700'
          }`}>
            ⚠ {caution === 'low'
              ? 'This calorie target is unusually low. Review manually before using with this client.'
              : 'This calorie target is unusually high. Review manually before using with this client.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {macros.map((m) => (
          <div key={m.label} className="bg-[#f8fafc] rounded-xl p-4">
            <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-1">{m.label}</p>
            <p className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value.toLocaleString()}
              <span className="text-sm font-medium text-[#94a3b8] ml-1">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#94a3b8] mt-4 leading-relaxed">
        Calories = weight × 22 · Protein = ideal weight × 1.6 · Fats = weight × 0.6 ·
        Fiber = (calories/1000) × 14 · Carbs = remaining calories ÷ 4
      </p>
    </div>
  )
}