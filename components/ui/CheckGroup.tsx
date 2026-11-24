import { LABEL, ERROR, CHIP, CHIP_ON, CHIP_OFF } from './fieldStyles'

interface CheckGroupProps {
  label?: string
  options: readonly string[]
  values: string[]
  onChange: (value: string) => void
  error?: string
}

export function CheckGroup({
  label,
  options,
  values,
  onChange,
  error,
}: CheckGroupProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {label && <label className={LABEL}>{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = values.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onChange(opt)}
              className={`px-4 min-h-11 rounded-full text-[15px] font-medium inline-flex items-center gap-1.5 ${CHIP} ${on ? CHIP_ON : CHIP_OFF}`}
            >
              {on && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
              )}
              {opt}
            </button>
          )
        })}
      </div>
      {error && <span className={ERROR}>{error}</span>}
    </div>
  )
}
