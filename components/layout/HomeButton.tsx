import Link from 'next/link'

export function HomeButton() {
  return (
    <Link
      href="/home"
      className="text-white/60 hover:text-white text-[15px] inline-flex items-center gap-1 min-h-11 -ml-1 pr-2 mb-1 transition-colors"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      Today
    </Link>
  )
}
