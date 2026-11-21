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
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-[#475569]">
          {label}
          {required && <span className="text-[#00D4E8] ml-0.5">*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`
              px-4 min-h-10 rounded-full text-sm border
              transition-all duration-150
              ${value === opt
                ? 'bg-[#1a1f3a] text-[#00D4E8] border-[#00D4E8]'
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#00D4E8]'
              }
            `}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && (
        <span className="text-sm text-[#ef4444]">{error}</span>
      )}
    </div>
  )
}