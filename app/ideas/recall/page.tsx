'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { answerRecall, getDueRecall } from '@/lib/supabase/queries/peakIdeas'
import type { Recall } from '@/lib/types/peakIdeas'
import { PEAK, topicColor } from '@/lib/constants/peakIdeas'
import { ErrorNote, Icon, IconButton, LoadingScreen, PeakShell } from '@/components/peak/ui'

export default function RecallPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()
  const [recall, setRecall] = useState<Recall | null | undefined>(undefined)
  const [picked, setPicked] = useState<number | null>(null)
  const [result, setResult] = useState<{ correct: boolean; answer: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientLoading || !client) return
    let cancelled = false
    getDueRecall(client.id)
      .then((r) => { if (!cancelled) setRecall(r) })
      .catch((err) => { if (!cancelled) { setError((err as Error).message); setRecall(null) } })
    return () => { cancelled = true }
  }, [client, clientLoading])

  if (checking || clientLoading || recall === undefined) return <LoadingScreen />

  const choose = async (i: number) => {
    if (!recall || picked !== null) return
    setPicked(i)
    try {
      setResult(await answerRecall(recall.id, i))
    } catch (err) {
      setPicked(null)
      setError((err as Error).message)
    }
  }

  const idea = recall?.peak_ideas

  return (
    <PeakShell>
      <div className="px-5 pt-5 flex items-center justify-between">
        <IconButton label="Close" href="/ideas">{Icon.close}</IconButton>
        <p className="text-[13px]" style={{ color: PEAK.muted }}>Quick recall</p>
        <div className="w-11" />
      </div>

      {error && <ErrorNote message={error} />}

      {!recall || !idea ? (
        <div className="mx-4 mt-6 p-6 rounded-[24px]" style={{ background: PEAK.surface }}>
          <p className="text-lg font-semibold">Nothing to recall today</p>
          <p className="mt-1 text-sm" style={{ color: PEAK.soft }}>Save ideas you love — we’ll bring them back so they stick.</p>
        </div>
      ) : (
        <>
          <div className="relative mx-4 mt-6 rounded-[28px] px-6 py-[26px] flex flex-col gap-3 overflow-hidden" style={{ background: topicColor(idea.topic), color: PEAK.ink }}>
            <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true" className="absolute -right-[60px] -top-[50px]"><circle cx="100" cy="100" r="90" fill="none" stroke="rgba(17,19,24,0.14)" strokeWidth="18" /></svg>
            <p className="relative text-xs tracking-[0.16em] uppercase font-bold">Remember this?</p>
            <p className="relative text-2xl font-bold leading-[1.25]">{idea.recall_question}</p>
          </div>

          <div className="mx-4 mt-[18px] flex flex-col gap-2.5">
            {idea.recall_options.map((option, i) => {
              const isAnswer = result && i === result.answer
              const isWrongPick = result && i === picked && !result.correct
              return (
                <button
                  key={i}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => choose(i)}
                  className="min-h-[60px] px-4 py-3.5 rounded-2xl text-left text-[15px] flex items-center justify-between gap-2.5"
                  style={{
                    background: isAnswer ? 'rgba(74,222,128,0.10)' : isWrongPick ? 'rgba(248,113,113,0.10)' : PEAK.surface,
                    border: isAnswer ? `2px solid ${PEAK.green}` : isWrongPick ? '2px solid #F87171' : `1px solid ${PEAK.line}`,
                    color: isAnswer ? PEAK.text : PEAK.soft,
                    fontWeight: isAnswer ? 600 : 500,
                  }}
                >
                  {option}
                  {isAnswer && Icon.check()}
                </button>
              )
            })}
          </div>

          {result && (
            <div className="mx-4 mt-4 p-[18px] rounded-[18px] flex flex-col gap-1.5" style={{ background: result.correct ? 'rgba(74,222,128,0.08)' : PEAK.surface }}>
              <p className="text-[15px] font-semibold" style={{ color: result.correct ? PEAK.green : PEAK.text }}>
                {result.correct ? 'Locked in · +5 XP' : 'Close — now you’ve got it'}
              </p>
              <p className="text-sm leading-normal" style={{ color: PEAK.soft }}>
                {recall.step === 1 ? 'You’ll see this once more in 10 days — then it’s yours for good.' : 'That’s the last time we’ll ask. This one is yours now.'}
              </p>
            </div>
          )}

          <div className="flex-1" />
          {result && (
            <div className="px-4 pt-6 pb-5 flex gap-2">
              <Link href={`/ideas`} className="flex-1 h-14 rounded-2xl flex items-center justify-center text-base font-bold" style={{ background: PEAK.cyan, color: PEAK.ink }}>Done</Link>
            </div>
          )}
        </>
      )}
    </PeakShell>
  )
}
