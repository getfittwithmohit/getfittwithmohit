interface SuccessScreenProps {
  name: string
  message?: string
  showBooking?: boolean
  title?: string
}

export function SuccessScreen({
  name,
  message = 'Coach Mohit will review your profile within 24 hours and reach out to schedule your first Lifestyle & Routine Audit Consultation.',
  showBooking = false,
  title,
}: SuccessScreenProps) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e2e8f0] max-w-md w-full text-center">

        <div className="w-16 h-16 bg-[#00d4d4] rounded-full flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <path
              d="M8 16l5 5 11-11"
              stroke="#1a1f3a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="text-xl font-medium text-[#0f172a] mb-2">
  {title || (name === 'you' ? 'All done!' : `Thank you, ${name}!`)}
</h2>
        <p className="text-sm text-[#64748b] leading-relaxed mb-6">
          {message}
        </p>

        {/* Booking section — only for check-in */}
        {showBooking && (
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 mb-6 text-left">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3 text-center">
              Next Step
            </p>
            <p className="text-sm font-medium text-[#0f172a] text-center mb-1">
              📅 Book your review call
            </p>
            <p className="text-xs text-[#64748b] text-center leading-relaxed mb-4">
              Coach Mohit is available Saturday & Sunday.
              He'll have reviewed your check-in before the call.
            </p>
            <button
              onClick={() => window.open(
                'https://cal.com/fittnesscoach/weekly-review-call-for-1-1-clients-only?overlayCalendar=true',
                '_blank'
              )}
              className="w-full bg-[#00d4d4] text-[#1a1f3a] py-3 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors"
            >
              Open Booking Calendar →
            </button>
          </div>
        )}

        {/* Home button */}
        <button
          onClick={() => window.location.href = '/home'}
          className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors mb-6 block w-full"
        >
          ← Back to Home
        </button>

        <div className="bg-[#1a1f3a] rounded-xl py-3 px-6 inline-block">
          <p className="text-[#00d4d4] text-xs font-medium tracking-widest">
            TRANSFORM TO INSPIRE
          </p>
        </div>

      </div>
    </div>
  )
}