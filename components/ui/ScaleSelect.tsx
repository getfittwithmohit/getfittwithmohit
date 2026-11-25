import { LABEL, ERROR, REQUIRED, CHIP } from './fieldStyles'

interface ScaleSelectProps {
  label?: string
  required?: boolean
  min?: number
  max?: number
  value: string
  onChange: (value: string) => void
  lowLabel?: string
  highLabel?: string
  error?: string
}

export function ScaleSelect({
  label,
  required,
  min = 1,
  max = 10,
  value,
  onChange,
  lowLabel,
  highLabel,
  error,
}: ScaleSelectProps) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min)
  const picked = value === '' ? null : Number(value)
  // Up to 10 options sit in one even row; more wrap
  const fits = numbers.length <= 10

  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <label className={LABEL}>
          {label}
          {required && <span className={REQUIRED}>*</span>}
        </label>
      )}
      <div
        className={fits ? 'grid gap-1' : 'flex flex-wrap gap-1.5'}
        style={fits ? { gridTemplateColumns: `repeat(${numbers.length}, minmax(0, 1fr))` } : undefined}
        role="radiogroup"
      >
        {numbers.map((n) => {
          const on = picked === n
          const below = picked !== null && n >= min && n < picked
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(String(n))}
              className={`h-11 ${fits ? '' : 'w-11'} rounded-lg text-base font-semibold ${CHIP} ${
                on ? 'bg-[#1a1f3a] text-[#00D4E8]' : below ? 'bg-[#CCF4F8] text-[#0f172a]' : 'bg-[#F2F4F7] text-[#475569] hover:bg-[#E8ECF1]'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-sm text-[#64748b]">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
      {error && <span className={ERROR}>{error}</span>}
    </div>
  )
}
