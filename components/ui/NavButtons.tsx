interface NavButtonsProps {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  loading?: boolean
}

// Bottom of every form step: a big primary button, with Back beside it.
export function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Continue →',
  loading = false,
}: NavButtonsProps) {
  return (
    <div className="flex items-center gap-2.5 pt-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          aria-label="Back"
          className="min-h-[54px] px-5 rounded-2xl text-base font-medium bg-white text-[#475569] border border-[#E5E7EB] hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors inline-flex items-center gap-1"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={loading}
        className="flex-1 min-h-[54px] px-5 rounded-2xl text-[17px] font-bold bg-[#00D4E8] text-[#1a1f3a] hover:bg-[#00C4D7] active:scale-[0.99] disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {nextLabel}
      </button>
    </div>
  )
}
