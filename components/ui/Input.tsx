import { InputHTMLAttributes, forwardRef } from 'react'

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
          <label className="text-xs font-medium text-[#64748b]">
            {label}
            {required && <span className="text-[#00d4d4] ml-0.5">*</span>}
          </label>
        )}
        {hint && (
          <span className="text-xs text-[#94a3b8]">{hint}</span>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2.5 text-sm
            border border-[#e2e8f0] rounded-lg
            text-[#0f172a] bg-white
            placeholder:text-[#94a3b8]
            focus:outline-none focus:border-[#00d4d4]
            transition-colors duration-150
            ${error ? 'border-[#ef4444]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-[#ef4444]">{error}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'