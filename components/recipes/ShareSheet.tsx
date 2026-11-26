'use client'

import { useEffect, useMemo, useState } from 'react'
import { T } from '@/components/ui/ios'
import { toast } from '@/lib/ui/feedback'
import { swapWords } from './shared'
import { potExtra, shareText, type RecipeExtra, type RecipeTranslation, type ShareLang } from '@/lib/nutrition/recipes'

interface Props {
  recipeId: string
  title: string
  people: number
  ingredients: { slug: string; name: string; amount: string; prep?: string }[]
  extras: RecipeExtra[]
  steps: string[]
  tip: string | null
  /** Protein swapped on the recipe page: rename it in translated text too */
  swap?: { from: string; to: string } | null
  onClose: () => void
}

const LANGS: { key: ShareLang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिंदी' },
  { key: 'mr', label: 'मराठी' },
]

// Translations already fetched this session, per recipe+language
const memo = new Map<string, RecipeTranslation>()

// Bottom sheet: pick a language, see the message, send it on WhatsApp.
export function ShareSheet({ recipeId, title, people, ingredients, extras, steps, tip, swap, onClose }: Props) {
  const [lang, setLang] = useState<ShareLang>(() => {
    try { return (localStorage.getItem('gfm:cookLang') as ShareLang) || 'en' } catch { return 'en' }
  })
  const [tr, setTr] = useState<RecipeTranslation | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const pick = (l: ShareLang) => {
    setLang(l)
    try { localStorage.setItem('gfm:cookLang', l) } catch { /* private mode */ }
  }

  useEffect(() => {
    if (lang === 'en') return
    const key = `${recipeId}:${lang}`
    const hit = memo.get(key)
    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (hit) return hit
        if (!cancelled) { setLoading(true); setFailed(false) }
        return fetch('/api/me/recipes/translate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: recipeId, lang }),
        }).then((r) => r.json().then((d) => (r.ok ? d.translation as RecipeTranslation : Promise.reject(new Error(d.error)))))
      })
      .then((t) => { memo.set(key, t); if (!cancelled) setTr(t) })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lang, recipeId])

  const text = useMemo(() => {
    const t = lang !== 'en' && tr && !failed ? tr : null
    const L: ShareLang = t ? lang : 'en'
    const from = t && swap ? t.names[swap.from] : undefined
    const to = t && swap ? t.names[swap.to] : undefined
    return shareText({
      lang: L,
      title: t ? swapWords(t.title, from, to) : title,
      people,
      ingredients: ingredients.map((i) => ({ name: t?.names[i.slug] || i.name, amount: i.amount, prep: t ? undefined : i.prep })),
      extras: (t ? t.extras : extras).map((x) => potExtra(x, people, L)),
      steps: t ? t.steps.map((x) => swapWords(x, from, to)) : steps,
      tip: t ? t.tip : tip,
    })
  }, [lang, tr, failed, title, people, ingredients, extras, steps, tip, swap])

  const ready = lang === 'en' || (!loading && (tr || failed))

  const send = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast('Copied — paste it anywhere', 'success') } catch { window.prompt('Copy this:', text) }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Send recipe">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-[28px] max-h-[92vh] flex flex-col gfm-toast" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl w-full mx-auto px-4 pt-2.5 flex flex-col gap-3 min-h-0">
          <div className="w-10 h-[5px] rounded-full bg-[#CBD5E1] self-center" />
          <div>
            <h2 className="m-0 text-[22px] font-extrabold">Send to whoever’s cooking</h2>
            <p className="m-0 mt-1 text-[15px]" style={{ color: T.ter }}>Exact amounts for {people} {people === 1 ? 'person' : 'people'}, in their language.</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Language">
            {LANGS.map((l) => (
              <button key={l.key} role="radio" aria-checked={lang === l.key} onClick={() => pick(l.key)}
                className="min-h-11 rounded-xl text-[15px] font-semibold"
                style={lang === l.key ? { background: T.navy, color: '#fff' } : { background: '#F2F4F7', color: T.ink }}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl p-3" style={{ background: '#E9E3D9' }}>
            {!ready ? (
              <div className="ml-auto max-w-[88%] rounded-[14px_4px_14px_14px] p-3 flex flex-col gap-2" style={{ background: '#D9FDD3' }}>
                {[80, 60, 70, 50, 90, 65].map((w, i) => <span key={i} className="h-3 rounded gfm-shimmer" style={{ width: `${w}%` }} />)}
                <span className="text-xs text-[#667781]">Writing it in {lang === 'hi' ? 'Hindi' : 'Marathi'}…</span>
              </div>
            ) : (
              <div className="ml-auto max-w-[88%] rounded-[14px_4px_14px_14px] px-3.5 py-3 text-[14px] leading-relaxed whitespace-pre-line" style={{ background: '#D9FDD3', color: '#111b21' }}>
                {text.replace(/\*([^*]+)\*/g, '$1').replace(/_([^_]+)_/g, '$1')}
              </div>
            )}
          </div>
          {failed && lang !== 'en' && <p className="m-0 text-sm" style={{ color: '#B45309' }}>Couldn’t translate right now — this is the English version.</p>}
          <div className="flex gap-2">
            <button onClick={copy} disabled={!ready} className="min-h-14 px-5 rounded-2xl text-base font-semibold disabled:opacity-50" style={{ background: '#F2F4F7', color: T.ink }}>Copy</button>
            <button onClick={send} disabled={!ready} className="flex-1 min-h-14 rounded-2xl text-[17px] font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: T.cyan, color: T.navy }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Send on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
