import { TextareaHTMLAttributes, forwardRef } from 'react'
import { FIELD, FIELD_ERROR, LABEL, HINT, ERROR, REQUIRED } from './fieldStyles'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  required?: boolean
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        <textarea
          ref={ref}
          rows={3}
          className={`${FIELD} py-3 leading-relaxed resize-none ${error ? FIELD_ERROR : ''} ${className}`}
          {...props}
        />
        {error && <span className={ERROR}>{error}</span>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
