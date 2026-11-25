import { LABEL, ERROR, REQUIRED, CHIP, CHIP_ON, CHIP_OFF } from './fieldStyles'

interface RadioGroupProps {
  label?: string
  required?: boolean
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  error?: string
}

export function RadioGroup({
  label,
  required,
  options,
  value,
  onChange,
  error,
}: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <label className={LABEL}>
          {label}
          {required && <span className={REQUIRED}>*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={value === opt}
            onClick={() => onChange(opt)}
            className={`px-4 min-h-11 rounded-full text-[15px] font-medium ${CHIP} ${value === opt ? CHIP_ON : CHIP_OFF}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <span className={ERROR}>{error}</span>}
    </div>
  )
}
