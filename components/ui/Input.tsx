import { InputHTMLAttributes, forwardRef } from 'react'
import { FIELD, FIELD_ERROR, LABEL, HINT, ERROR, REQUIRED } from './fieldStyles'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  required?: boolean
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, required, hint, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className={LABEL}>
            {label}
            {required && <span className={REQUIRED}>*</span>}
          </label>
        )}
        {hint && <span className={HINT}>{hint}</span>}
        <input
          ref={ref}
          className={`${FIELD} min-h-[50px] ${error ? FIELD_ERROR : ''} ${className}`}
          {...props}
        />
        {error && <span className={ERROR}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
