import { go } from '@/lib/ui/navigate'
import { Screen, T } from '@/components/ui/ios'

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
    <Screen>
      <div className="rounded-3xl px-6 pt-10 pb-8 text-center mt-6 gfm-pop" style={{ background: T.navy }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: T.cyan }}>
          <svg viewBox="0 0 32 32" width="34" height="34" fill="none" aria-hidden="true">
            <path d="M8 16l5 5 11-11" stroke={T.navy} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="m-0 text-[26px] leading-tight font-extrabold tracking-tight text-white">
          {title || (name === 'you' ? 'All done!' : `Thank you, ${name}!`)}
        </h2>
        <p className="m-0 mt-3 text-base leading-relaxed text-white/75">{message}</p>
        <p className="m-0 mt-6 text-xs font-bold tracking-[0.2em]" style={{ color: T.cyan }}>TRANSFORM TO INSPIRE</p>
      </div>

      {/* Booking — only after the weekly check-in */}
      {showBooking && (
        <div className="bg-white rounded-2xl p-5">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: T.teal }}>Next step</p>
          <p className="m-0 mt-1 text-[19px] font-bold" style={{ color: T.ink }}>Book your review call</p>
          <p className="m-0 mt-1 mb-4 text-[15px] leading-relaxed" style={{ color: T.ter }}>
            Coach Mohit is available Saturday &amp; Sunday. He&apos;ll have reviewed your check-in before the call.
          </p>
          <button
            onClick={() => window.open('https://cal.com/fittnesscoach/weekly-review-call-for-1-1-clients-only?overlayCalendar=true', '_blank')}
            className="w-full min-h-[54px] rounded-2xl text-[17px] font-bold"
            style={{ background: T.cyan, color: T.navy }}
          >
            Open booking calendar
          </button>
        </div>
      )}

      <button
        onClick={() => go('/home')}
        className="w-full min-h-[54px] rounded-2xl text-base font-semibold"
        style={showBooking ? { background: '#fff', color: T.ink, border: `1px solid ${T.line}` } : { background: T.cyan, color: T.navy }}
      >
        Back to Today
      </button>
    </Screen>
  )
}
