'use client'

// Small pieces shared by the coach's Courses and Audios managers.

export const labelClass = 'text-xs font-medium text-[#64748b]'

export const fieldClass =
  'w-full px-3 py-2.5 text-sm border border-[#e2e8f0] rounded-lg text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00D4E8] transition-colors duration-150'

export function PublishToggle({
  published,
  disabled,
  onChange,
}: {
  published: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!published)}
      title={published ? 'Visible to clients — click to hide' : 'Hidden from clients — click to publish'}
      className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
        published
          ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#16a34a]'
          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:border-[#00D4E8]'
      }`}
    >
      {published ? '● Published' : '○ Draft — Publish'}
    </button>
  )
}
