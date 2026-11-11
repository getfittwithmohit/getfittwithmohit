'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { getClientIdea, getOneMoreIdea, updateMyIdea } from '@/lib/supabase/queries/peakIdeas'
import type { ClientIdea } from '@/lib/types/peakIdeas'
import { PEAK, topicColor } from '@/lib/constants/peakIdeas'
import { paragraphs } from '@/lib/utils/peakIdeas'
import { ErrorNote, Icon, IconButton, LoadingScreen, PeakShell, TopicArt, TopicPill, shareCard } from '@/components/peak/ui'

const STEPS = 3 // hook → idea → try this today

export default function IdeaReaderPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const rowId = params.id

  const [loaded, setLoaded] = useState<{ key: string; row: ClientIdea | null } | null>(null)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    if (clientLoading || !client) return
    let cancelled = false
    getClientIdea(rowId)
      .then((r) => {
        if (cancelled) return
        setLoaded({ key: rowId, row: r })
        if (r && !r.opened_at) updateMyIdea(r.id, { opened_at: new Date().toISOString() }).catch(() => {})
      })
      .catch((err) => { if (!cancelled) setError((err as Error).message) })
    return () => { cancelled = true }
  }, [rowId, client, clientLoading])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setStep((s) => Math.min(STEPS - 1, s + 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const row = loaded?.key === rowId ? loaded.row : null
  if (checking || clientLoading || (!loaded && !error) || (loaded && loaded.key !== rowId)) return <LoadingScreen />
  if (!row) {
    return (
      <PeakShell>
        <div className="px-5 pt-5"><IconButton label="Back to PEAK Ideas" href="/ideas">{Icon.close}</IconButton></div>
        <ErrorNote message={error || 'This idea could not be found.'} />
      </PeakShell>
    )
  }

  const idea = row.peak_ideas
  const color = topicColor(idea.topic)

  const patch = async (p: Parameters<typeof updateMyIdea>[1]) => {
    const before = row
    setLoaded({ key: rowId, row: { ...row, ...p } as ClientIdea })
    try {
      await updateMyIdea(row.id, p)
    } catch (err) {
      setLoaded({ key: rowId, row: before })
      setError((err as Error).message)
    }
  }

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1))
  const prev = () => setStep((s) => Math.max(0, s - 1))

  const onCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    if (e.clientX - box.left < box.width / 3) prev()
    else next()
  }

  const oneMore = async () => {
    if (!client) return
    setBusy(true)
    setError(null)
    try {
      const id = await getOneMoreIdea(client.id)
      if (id) { setStep(0); router.push(`/ideas/${id}`) }
      else setError('You’ve read every idea for now. New ones are on the way.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const share = () =>
    shareCard({
      topic: idea.topic,
      title: idea.hook,
      lines: [row.chose_easier ? idea.easier_action : idea.action].map((a) => `Try this: ${a}`),
      footer: idea.kind === 'book' ? `From ${idea.book_title} · PEAK Ideas` : undefined,
      fileName: 'peak-idea.png',
    })

  const action = row.chose_easier ? idea.easier_action : idea.action
  const bookLine = idea.kind === 'book' ? `${idea.book_title} · ${idea.book_author}` : null

  return (
    <PeakShell>
      {/* top bar */}
      <div className="px-5 pt-5 flex items-center gap-3">
        {step === 0
          ? <IconButton label="Close" href="/ideas">{Icon.close}</IconButton>
          : <IconButton label="Back" onClick={prev}>{Icon.back}</IconButton>}
        <div className="flex-1 grid grid-cols-3 gap-1.5" aria-label={`Panel ${step + 1} of ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className="h-1 rounded" style={{ background: i <= step ? PEAK.text : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {step < 2 ? (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Tap right for next, left for back"
            onClick={onCardClick}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return
              const dx = e.changedTouches[0].clientX - touchX.current
              touchX.current = null
              if (dx < -50) next()
              else if (dx > 50) prev()
            }}
            className="relative mx-4 mt-[18px] flex-1 min-h-[460px] rounded-[28px] px-6 py-[26px] flex flex-col gap-[18px] overflow-hidden select-none cursor-pointer"
            style={{ background: color, color: PEAK.ink }}
          >
            <TopicArt topic={idea.topic} size={260} className="-right-[90px] -bottom-[80px]" />
            <TopicPill topic={idea.topic} />
            {bookLine && <p className="relative text-sm font-semibold -mt-2">{bookLine}</p>}

            {step === 0 ? (
              <>
                <div className="flex-1" />
                <h1 className="relative text-[32px] font-bold leading-[1.15]">{idea.hook}</h1>
                <div className="flex-1" />
                <p className="relative self-end text-sm font-bold">Swipe →</p>
              </>
            ) : (
              <>
                {paragraphs(idea.body).map((p, i) => (
                  <p key={i} className={`relative leading-[1.55] ${i === 0 ? 'text-[22px] font-bold leading-[1.3]' : 'text-[18px] font-medium'}`}>{p}</p>
                ))}
                <div className="flex-1" />
                <p className="relative self-end text-sm font-bold">Your action for today →</p>
              </>
            )}
          </div>

          {step === 1 && idea.coach_take && (
            <div className="mx-4 mt-3.5 p-[18px] rounded-[20px] flex flex-col gap-1.5" style={{ background: PEAK.surface }}>
              <p className="text-xs tracking-[0.14em] uppercase font-semibold" style={{ color: PEAK.muted }}>Coach Mohit’s take</p>
              <p className="text-[15px] leading-relaxed" style={{ color: PEAK.soft }}>{idea.coach_take}</p>
            </div>
          )}

          {/* reactions */}
          <div className="px-4 pt-3.5 pb-5 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <ReactionButton label="More ideas like this" active={row.reaction === 1} onClick={() => patch({ reaction: row.reaction === 1 ? null : 1 })} up />
              <ReactionButton label="Fewer ideas like this" active={row.reaction === -1} onClick={() => patch({ reaction: row.reaction === -1 ? null : -1 })} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => patch({ saved_at: row.saved_at ? null : new Date().toISOString() })}
                aria-pressed={!!row.saved_at}
                className="h-12 px-4 rounded-[14px] flex items-center gap-2 text-sm font-semibold"
                style={{ border: `1px solid ${row.saved_at ? PEAK.gold : PEAK.line}`, color: row.saved_at ? PEAK.gold : PEAK.text }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={row.saved_at ? PEAK.gold : 'none'} stroke={row.saved_at ? PEAK.gold : PEAK.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                {row.saved_at ? 'Saved' : 'Save'}
              </button>
              <button type="button" onClick={share} aria-label="Share as image" className="w-12 h-12 rounded-[14px] flex items-center justify-center" style={{ border: `1px solid ${PEAK.line}` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PEAK.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mx-4 mt-[18px] rounded-[28px] px-6 py-[26px] flex flex-col gap-4" style={{ background: PEAK.surface, border: `2px solid ${color}` }}>
            <p className="text-xs tracking-[0.16em] uppercase font-bold" style={{ color }}>{row.chose_easier ? 'The easy version' : 'Try this today'}</p>
            <p className="text-[26px] font-bold leading-[1.25]">{action}</p>
          </div>

          {row.committed_at ? (
            <div className="mx-4 mt-4 p-[18px] rounded-[18px] flex items-start gap-3" style={{ background: 'rgba(74,222,128,0.08)' }}>
              {Icon.check()}
              <div className="flex flex-col gap-1">
                <p className="text-[15px] font-semibold" style={{ color: PEAK.green }}>Locked in</p>
                <p className="text-sm leading-normal" style={{ color: PEAK.soft }}>We’ll ask tomorrow morning if you did it. Kept promises earn +10 XP.</p>
              </div>
            </div>
          ) : (
            <div className="mx-4 mt-4 flex flex-col gap-2.5">
              <button type="button" onClick={() => patch({ committed_at: new Date().toISOString() })} className="h-[60px] rounded-[18px] text-[17px] font-bold" style={{ background: PEAK.cyan, color: PEAK.ink }}>
                {row.chose_easier ? 'I’ll do the easy one' : 'I’ll do it'}
              </button>
              <button type="button" onClick={() => patch({ chose_easier: !row.chose_easier })} className="h-12 rounded-2xl text-sm font-semibold" style={{ border: `1px solid ${PEAK.line}`, color: PEAK.soft }}>
                {row.chose_easier ? 'Back to the full version' : 'Give me an easier version'}
              </button>
              <p className="mt-2 px-3 text-center text-[13px] leading-normal" style={{ color: PEAK.muted }}>Small and done beats big and skipped. Kept promises earn +10 XP.</p>
            </div>
          )}

          <div className="flex-1" />

          <div className="px-4 pt-6 pb-5 flex gap-2">
            <button type="button" disabled={busy} onClick={oneMore} className="flex-1 h-[52px] rounded-2xl text-sm font-semibold disabled:opacity-60" style={{ border: `1px solid ${PEAK.line}` }}>
              {busy ? 'Finding one…' : 'One more idea'}
            </button>
            <Link href="/ideas" className="flex-1 h-[52px] rounded-2xl flex items-center justify-center text-sm font-bold" style={{ background: PEAK.text, color: PEAK.ink }}>
              Done for today
            </Link>
          </div>
        </>
      )}
    </PeakShell>
  )
}

function ReactionButton({ label, active, onClick, up = false }: { label: string; active: boolean; onClick: () => void; up?: boolean }) {
  const stroke = active ? PEAK.ink : PEAK.soft
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className="w-12 h-12 rounded-[14px] flex items-center justify-center"
      style={{ border: `1px solid ${active ? PEAK.text : PEAK.line}`, background: active ? PEAK.text : 'transparent' }}
    >
      {up ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10v11H4V10zM7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 14V3h3v11zM17 14l-4 8a3 3 0 0 1-3-3v-4H4.5a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.9 3H17" /></svg>
      )}
    </button>
  )
}
