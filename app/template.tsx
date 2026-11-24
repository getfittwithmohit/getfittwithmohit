// Re-mounts on every navigation: a short fade so screens settle in instead of
// popping. Opacity only — a transform here would shift fixed bars and sheets.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="gfm-page flex flex-1 flex-col w-full">{children}</div>
}
