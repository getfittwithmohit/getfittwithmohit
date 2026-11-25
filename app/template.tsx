'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { tabIndex } from '@/components/nav/TabBar'

// Remembered across navigations (the template itself re-mounts each time).
let lastTab = -1

// Re-mounts on every navigation. Between the main tabs the screen slides in
// from the side you're moving towards; everything else gets a short fade.
// Both animations end on transform:none, so fixed bars and sheets are unaffected.
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const tab = tabIndex(pathname)
  const [cls] = useState(() =>
    tab >= 0 && lastTab >= 0 && tab !== lastTab ? (tab > lastTab ? 'gfm-from-right' : 'gfm-from-left') : 'gfm-page'
  )
  useEffect(() => { if (tab >= 0) lastTab = tab }, [tab])
  return <div className={`${cls} flex flex-1 flex-col w-full`}>{children}</div>
}
