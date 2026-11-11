'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { getBooks, getMyIdeas, openIdea, type Book } from '@/lib/supabase/queries/peakIdeas'
import type { ClientIdea } from '@/lib/types/peakIdeas'
import { PEAK, topicColor } from '@/lib/constants/peakIdeas'
import { ErrorNote, Icon, IconButton, LoadingScreen, PeakShell } from '@/components/peak/ui'

export default function BooksPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()
  const router = useRouter()
  const [data, setData] = useState<{ books: Book[]; mine: ClientIdea[] } | null>(null)
  const [openBook, setOpenBook] = useState<string | null>(null)
  const [opening, setOpening] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientLoading || !client) return
    let cancelled = false
    Promise.all([getBooks(), getMyIdeas(client.id)])
      .then(([books, mine]) => { if (!cancelled) setData({ books, mine }) })
      .catch((err) => { if (!cancelled) { setError((err as Error).message); setData({ books: [], mine: [] }) } })
    return () => { cancelled = true }
  }, [client, clientLoading])

  if (checking || clientLoading || !data) return <LoadingScreen />

  const readIds = new Map(data.mine.filter((r) => r.opened_at).map((r) => [r.idea_id, r.id]))

  const read = async (ideaId: string) => {
    if (!client) return
    const existing = readIds.get(ideaId)
    if (existing) { router.push(`/ideas/${existing}`); return }
    setOpening(ideaId)
    try {
      router.push(`/ideas/${await openIdea(client.id, ideaId)}`)
    } catch (err) {
      setError((err as Error).message)
      setOpening(null)
    }
  }

  return (
    <PeakShell>
      <div className="px-5 pt-5"><IconButton label="Back to PEAK Ideas" href="/ideas">{Icon.back}</IconButton></div>
      <header className="px-6 pt-4 flex flex-col gap-1">
        <p className="text-xs tracking-[0.16em] uppercase font-semibold" style={{ color: PEAK.muted }}>PEAK Ideas</p>
        <h1 className="text-[28px] font-bold">Books</h1>
        <p className="text-sm" style={{ color: PEAK.soft }}>The key ideas from the best books, in plain words — with Coach Mohit’s take.</p>
      </header>

      {error && <ErrorNote message={error} />}

      {data.books.length === 0 && (
        <div className="mx-4 mt-6 p-6 rounded-[24px]" style={{ background: PEAK.surface }}>
          <p className="text-lg font-semibold">Books are coming soon</p>
          <p className="mt-1 text-sm" style={{ color: PEAK.soft }}>Coach Mohit is picking the books that matter most.</p>
        </div>
      )}

      <div className="mx-4 mt-5 mb-6 flex flex-col gap-2.5">
        {data.books.map((book) => {
          const done = book.ideas.filter((i) => readIds.has(i.id)).length
          const isOpen = openBook === book.title
          const color = topicColor(book.ideas[0]?.topic)
          return (
            <div key={book.title} className="rounded-[20px] overflow-hidden" style={{ background: PEAK.surface }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpenBook(isOpen ? null : book.title)} className="w-full p-4 flex items-center gap-3 text-left">
                <span className="w-[34px] h-12 rounded shrink-0" style={{ background: color }} />
                <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <span className="text-sm font-semibold truncate">{book.title}</span>
                  <span className="text-xs" style={{ color: PEAK.muted }}>{book.author}</span>
                  <span className="h-1 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <span className="block h-full" style={{ width: `${(done / book.ideas.length) * 100}%`, background: color }} />
                  </span>
                </span>
                <span className="text-xs shrink-0" style={{ color: PEAK.muted }}>{done} / {book.ideas.length}</span>
              </button>
              {isOpen && (
                <ol className="px-4 pb-4 flex flex-col gap-1.5">
                  {book.ideas.map((idea, n) => (
                    <li key={idea.id}>
                      <button type="button" disabled={opening === idea.id} onClick={() => read(idea.id)} className="w-full p-3 rounded-xl flex items-center gap-3 text-left disabled:opacity-60" style={{ background: PEAK.surface2 }}>
                        <span className="text-xs w-5 shrink-0" style={{ color: PEAK.muted }}>{n + 1}</span>
                        <span className="flex-1 text-sm leading-snug">{idea.hook}</span>
                        {readIds.has(idea.id) ? Icon.check(PEAK.muted) : Icon.chevron}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )
        })}
      </div>
    </PeakShell>
  )
}
