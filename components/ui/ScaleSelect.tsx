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
  const numbers = Array.from(
    { length: max - min + 1 },
    (_, i) => String(i + min)
  )

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-[#475569]">
          {label}
          {required && <span className="text-[#00D4E8] ml-0.5">*</span>}
        </label>
      )}
      <div className="flex gap-2 flex-wrap">
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`
              w-10 h-10 rounded-lg text-sm font-medium border
              transition-all duration-150
              ${value === n
                ? 'bg-[#1a1f3a] text-[#00D4E8] border-[#00D4E8]'
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#00D4E8]'
              }
            `}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-sm text-[#64748b]">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
      {error && (
        <span className="text-sm text-[#ef4444]">{error}</span>
      )}
    </div>
  )
}