export function HomeButton() {
  return (
    <button
      onClick={() => window.location.href = '/home'}
      className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1 transition-colors mb-3"
    >
      ← Home
    </button>
  )
}