interface SuccessScreenProps {
  name: string
  message?: string
}

export function SuccessScreen({
  name,
  message = 'Coach Mohit will review your profile within 24 hours and reach out to schedule your first Lifestyle & Routine Audit Consultation.',
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
          {name === 'you' ? 'Your Identity Card is saved.' : `Thank you, ${name}!`}
        </h2>
        <p className="text-sm text-[#64748b] leading-relaxed mb-6">
          {message}
        </p>

        <div className="bg-[#1a1f3a] rounded-xl py-3 px-6 inline-block">
          <p className="text-[#00d4d4] text-xs font-medium tracking-widest">
            TRANSFORM TO INSPIRE
          </p>
        </div>

      </div>
    </div>
  )
}