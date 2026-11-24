// Shared look for the form fields (Input, Textarea, Select): soft filled
// field, no hard border, cyan focus ring, red ring on error. 16px text so
// iPhones don't zoom in on focus.
export const FIELD =
  'w-full px-4 text-base rounded-xl text-[#0f172a] bg-[#F2F4F7] placeholder:text-[#94a3b8] ' +
  'border border-transparent focus:outline-none focus:bg-white focus:border-[#00D4E8] focus:ring-4 focus:ring-[#00D4E8]/15 ' +
  'transition-colors duration-150'

export const FIELD_ERROR = '!border-[#ef4444] !bg-[#FEF2F2]'

export const LABEL = 'text-[15px] font-semibold text-[#0f172a]'
export const HINT = 'text-sm text-[#64748b]'
export const ERROR = 'text-sm text-[#DC2626]'
export const REQUIRED = 'text-[#007A8A] ml-0.5'

// Tap chips (RadioGroup, CheckGroup, ScaleSelect)
export const CHIP = 'transition-all duration-150 active:scale-[0.97]'
export const CHIP_ON = 'bg-[#1a1f3a] text-[#00D4E8]'
export const CHIP_OFF = 'bg-[#F2F4F7] text-[#0f172a] hover:bg-[#E8ECF1]'
