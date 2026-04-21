export function PageLoader() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#00d4d4] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#64748b]">Loading...</p>
      </div>
    </div>
  )
}