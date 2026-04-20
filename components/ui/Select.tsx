import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  required?: boolean
  error?: string
  options: readonly string[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, required, error, options, placeholder = 'Select', className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[#64748b]">
            {label}
            {required && <span className="text-[#00d4d4] ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2.5 text-sm
            border border-[#e2e8f0] rounded-lg
            text-[#0f172a] bg-white
            focus:outline-none focus:border-[#00d4d4]
            transition-colors duration-150
            ${error ? 'border-[#ef4444]' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {error && (
          <span className="text-xs text-[#ef4444]">{error}</span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'