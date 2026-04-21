import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'back' | 'danger'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = `
    inline-flex items-center justify-center gap-2
    px-6 py-2.5 rounded-lg text-sm font-medium
    transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `

  const variants = {
    primary: 'bg-[#00d4d4] text-[#1a1f3a] hover:bg-[#00bcbc]',
    secondary: 'bg-[#1a1f3a] text-[#00d4d4] hover:bg-[#141930]',
    back: 'border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] bg-transparent',
    danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}