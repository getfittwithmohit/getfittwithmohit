import { SelectHTMLAttributes, forwardRef } from 'react'
import { FIELD, FIELD_ERROR, LABEL, ERROR, REQUIRED } from './fieldStyles'

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
          <label className={LABEL}>
            {label}
            {required && <span className={REQUIRED}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`${FIELD} min-h-[50px] ${error ? FIELD_ERROR : ''} ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {error && <span className={ERROR}>{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
