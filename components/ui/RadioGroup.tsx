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
        <label className="text-xs font-medium text-[#64748b]">
          {label}
          {required && <span className="text-[#00d4d4] ml-0.5">*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`
              px-4 py-2 rounded-full text-xs border
              transition-all duration-150
              ${value === opt
                ? 'bg-[#1a1f3a] text-[#00d4d4] border-[#00d4d4]'
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#00d4d4]'
              }
            `}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && (
        <span className="text-xs text-[#ef4444]">{error}</span>
      )}
    </div>
  )
}