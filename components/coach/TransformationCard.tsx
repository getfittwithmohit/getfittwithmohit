'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { heicToJpeg, looksHeic } from '@/lib/photos/heic'

// Coach tool: a branded before/after image (1080×1350, Instagram portrait)
// from a client's progress photos. Drawn in the browser; nothing is saved or
// shared until the coach downloads or shares it.

type Pose = 'front' | 'side' | 'back'
export interface CardWeek { week: number; urls: Record<Pose, string | null> }
type NameMode = 'first' | 'initials' | 'none'

const W = 1080
const H = 1350
const NAVY = '#1a1f3a'
const CYAN = '#00D4E8'
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif'

type Row = Record<string, unknown>
// Measurement sites recorded in onboarding / weekly check-ins (inches)
const SITES: [string, string][] = [
  ['waist_inches', 'Waist'],
  ['lower_belly_inches', 'Belly'],
  ['hip_inches', 'Hips'],
  ['chest_inches', 'Chest'],
  ['thigh_inches', 'Thighs'],
]
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

async function loadBitmap(url: string): Promise<ImageBitmap> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load a photo')
  const blob = await res.blob()
  try {
    return await createImageBitmap(blob)
  } catch {
    // iPhone HEIC photos: convert to JPEG first
    if (await looksHeic(blob)) return createImageBitmap(await heicToJpeg(blob))
    throw new Error('One of the photos is in a format that can’t be drawn')
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap, x: number, y: number, w: number, h: number, r: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.clip()
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  ctx.restore()
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string) {
  ctx.font = `700 30px ${FONT}`
  const w = ctx.measureText(text).width + 44
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(x, y, w, 56, 28)
  ctx.fill()
  ctx.fillStyle = fg
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + 22, y + 29)
}

export function TransformationCard({ clientId, clientName, weeks }: { clientId: string; clientName: string; weeks: CardWeek[] }) {
  const sorted = useMemo(() => [...weeks].sort((a, b) => a.week - b.week), [weeks])
  const [beforeWeek, setBeforeWeek] = useState(sorted[0]?.week)
  const [afterWeek, setAfterWeek] = useState(sorted[sorted.length - 1]?.week)
  const [pose, setPose] = useState<Pose>('front')
  const [nameMode, setNameMode] = useState<NameMode>('first')
  const [showKg, setShowKg] = useState(true)
  const [showInches, setShowInches] = useState(true)
  const [metrics, setMetrics] = useState<{ start: Row | null; byWeek: Record<number, Row> }>({ start: null, byWeek: {} })
  const [png, setPng] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('body_metrics').select('*').eq('client_id', clientId).limit(1).maybeSingle(),
      supabase.from('weekly_checkins').select('*').eq('client_id', clientId),
    ]).then(([bm, ck]) => {
      if (cancelled) return
      const byWeek: Record<number, Row> = {}
      for (const r of (ck.data || []) as Row[]) if (r.week_number) byWeek[Number(r.week_number)] = r
      setMetrics({ start: (bm.data as Row) || null, byWeek })
    })
    return () => { cancelled = true }
  }, [clientId])

  const before = sorted.find((w) => w.week === beforeWeek)
  const after = sorted.find((w) => w.week === afterWeek)
  const posesAvailable = (['front', 'side', 'back'] as Pose[]).filter((p) => before?.urls[p] && after?.urls[p])

  // Weight change: start weight (or that week's check-in) vs the closest
  // check-in at or before the "after" week.
  // Change in a measurement: the "before" week's check-in (or the onboarding
  // value for Week 1) vs the latest check-in at or before the "after" week
  // that has it. Only reductions count.
  const lossOf = useCallback((field: string): number | null => {
    if (beforeWeek === undefined || afterWeek === undefined) return null
    const startVal = num(metrics.byWeek[beforeWeek]?.[field]) ?? (beforeWeek <= 1 ? num(metrics.start?.[field]) : null)
    const endWeek = Object.keys(metrics.byWeek).map(Number)
      .filter((w) => w <= afterWeek && w > beforeWeek && num(metrics.byWeek[w][field]) !== null)
      .sort((a, b) => b - a)[0]
    const endVal = endWeek !== undefined ? num(metrics.byWeek[endWeek][field]) : null
    if (startVal === null || endVal === null) return null
    const d = Math.round((startVal - endVal) * 10) / 10
    return d > 0 ? d : null
  }, [metrics, beforeWeek, afterWeek])

  const kgLost = useMemo(() => lossOf('weight_kg'), [lossOf])
  const inches = useMemo(() => {
    const parts = SITES.map(([field, label]) => ({ label, d: lossOf(field) })).filter((x): x is { label: string; d: number } => x.d !== null)
    const total = Math.round(parts.reduce((s, x) => s + x.d, 0) * 10) / 10
    return { total: total > 0 ? total : null, parts: parts.sort((a, b) => b.d - a.d) }
  }, [lossOf])

  const displayName = (() => {
    const parts = clientName.trim().split(/\s+/)
    if (nameMode === 'none' || !parts[0]) return null
    if (nameMode === 'initials') return parts.map((p) => p[0]?.toUpperCase()).join('.') + '.'
    return parts[0]
  })()

  const make = async () => {
    if (!before || !after) return
    const bUrl = before.urls[pose]
    const aUrl = after.urls[pose]
    if (!bUrl || !aUrl) return setErr('Pick a pose that has a photo in both weeks.')
    setBusy(true)
    setErr(null)
    try {
      const [bImg, aImg] = await Promise.all([loadBitmap(bUrl), loadBitmap(aUrl)])
      let logo: ImageBitmap | null = null
      try { logo = await loadBitmap('/logo.png') } catch { /* card works without it */ }

      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = NAVY
      ctx.fillRect(0, 0, W, H)
      const glow = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 700)
      glow.addColorStop(0, 'rgba(0,212,232,0.18)')
      glow.addColorStop(1, 'rgba(0,212,232,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, H)

      // Headline
      const weeksApart = after.week - before.week
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = CYAN
      ctx.font = `700 34px ${FONT}`
      ctx.fillText('TRANSFORMATION', W / 2, 108)
      const stats = [
        showKg && kgLost ? `−${kgLost} kg` : null,
        showInches && inches.total ? `−${inches.total} inches` : null,
      ].filter(Boolean) as string[]
      ctx.fillStyle = '#FFFFFF'
      let size = 84
      const headline = stats.length ? stats.join('  ·  ') : `${weeksApart} weeks of work`
      do { ctx.font = `800 ${size}px ${FONT}` } while (ctx.measureText(headline).width > 960 && (size -= 4) > 40)
      ctx.fillText(headline, W / 2, 190)
      ctx.fillStyle = 'rgba(255,255,255,0.78)'
      ctx.font = `500 38px ${FONT}`
      const sub = [displayName, stats.length ? `in ${weeksApart} weeks` : null].filter(Boolean).join(' · ')
      if (sub) ctx.fillText(sub, W / 2, 246)
      if (showInches && inches.parts.length) {
        ctx.fillStyle = CYAN
        ctx.font = `600 30px ${FONT}`
        ctx.fillText(inches.parts.slice(0, 3).map((x) => `${x.label} −${x.d} in`).join('   '), W / 2, 296)
      }

      // Photos
      const top = 336
      const pw = 480
      const ph = 620
      const gap = 40
      const left = (W - pw * 2 - gap) / 2
      drawCover(ctx, bImg, left, top, pw, ph, 28)
      drawCover(ctx, aImg, left + pw + gap, top, pw, ph, 28)
      ctx.textAlign = 'left'
      pill(ctx, `Week ${before.week}`, left + 20, top + 20, 'rgba(10,15,26,0.72)', '#FFFFFF')
      pill(ctx, `Week ${after.week}`, left + pw + gap + 20, top + 20, CYAN, '#0a0f1a')

      // Footer
      ctx.textAlign = 'center'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `700 40px ${FONT}`
      ctx.fillText('Not just a body. A new identity.', W / 2, 1048)
      const footY = 1190
      if (logo) ctx.drawImage(logo, W / 2 - 230, footY - 58, 96, 96)
      ctx.textAlign = 'left'
      ctx.fillStyle = CYAN
      ctx.font = `800 40px ${FONT}`
      ctx.fillText('GetFittWithMohit', W / 2 - 116, footY - 6)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = `500 28px ${FONT}`
      ctx.fillText('Transform to Inspire', W / 2 - 116, footY + 34)

      setPng(canvas.toDataURL('image/png'))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not make the card')
    } finally {
      setBusy(false)
    }
  }

  const fileName = `transformation-${(displayName || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-w${beforeWeek}-w${afterWeek}.png`

  const share = async () => {
    if (!png) return
    const blob = await (await fetch(png)).blob()
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {})
    } else {
      const a = document.createElement('a')
      a.href = png
      a.download = fileName
      a.click()
    }
  }

  if (sorted.length < 2) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 text-sm text-[#64748b]">
        A transformation card needs photos from at least two different weeks. It will be available after this client’s next progress photos.
      </div>
    )
  }

  const select = 'w-full min-h-11 px-3 border border-[#e2e8f0] rounded-lg text-[15px] bg-white'

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-[#475569]">
          Before
          <select className={select} value={beforeWeek} onChange={(e) => { setBeforeWeek(Number(e.target.value)); setPng(null) }}>
            {sorted.map((w) => <option key={w.week} value={w.week}>Week {w.week}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-[#475569]">
          After
          <select className={select} value={afterWeek} onChange={(e) => { setAfterWeek(Number(e.target.value)); setPng(null) }}>
            {sorted.map((w) => <option key={w.week} value={w.week}>Week {w.week}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-[#475569]">
          Pose
          <select className={select} value={pose} onChange={(e) => { setPose(e.target.value as Pose); setPng(null) }}>
            {(['front', 'side', 'back'] as Pose[]).map((p) => (
              <option key={p} value={p} disabled={!posesAvailable.includes(p)}>{p[0].toUpperCase() + p.slice(1)}{posesAvailable.includes(p) ? '' : ' (missing)'}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-[#475569]">
          Name on card
          <select className={select} value={nameMode} onChange={(e) => { setNameMode(e.target.value as NameMode); setPng(null) }}>
            <option value="first">First name</option>
            <option value="initials">Initials only</option>
            <option value="none">No name</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-3 text-[15px] text-[#0f172a] min-h-11">
        <input type="checkbox" className="w-5 h-5 accent-[#00D4E8]" checked={showKg} onChange={(e) => { setShowKg(e.target.checked); setPng(null) }} />
        Show kg lost {kgLost ? `(−${kgLost} kg)` : '(no weight loss data for these weeks)'}
      </label>
      <label className="flex items-start gap-3 text-[15px] text-[#0f172a] min-h-11 py-1">
        <input type="checkbox" className="w-5 h-5 mt-0.5 accent-[#00D4E8]" checked={showInches} onChange={(e) => { setShowInches(e.target.checked); setPng(null) }} />
        <span>
          Show inches lost {inches.total ? `(−${inches.total} in total)` : '(no measurement data for these weeks)'}
          {inches.parts.length > 0 && (
            <span className="block text-sm text-[#64748b]">{inches.parts.map((x) => `${x.label} −${x.d}`).join(' · ')}</span>
          )}
        </span>
      </label>

      {beforeWeek !== undefined && afterWeek !== undefined && beforeWeek >= afterWeek ? (
        <p className="text-sm text-[#b91c1c]">“After” must be a later week than “Before”.</p>
      ) : (
        <button
          type="button"
          onClick={make}
          disabled={busy || !posesAvailable.includes(pose)}
          className="min-h-12 rounded-xl bg-[#1a1f3a] text-white text-base font-semibold disabled:opacity-50"
        >
          {busy ? 'Making card…' : png ? 'Remake card' : 'Make transformation card'}
        </button>
      )}

      {err && <p className="text-sm text-[#b91c1c]">{err}</p>}

      {png && (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={png} alt="Transformation card preview" className="w-full rounded-xl border border-[#e2e8f0]" />
          <div className="grid grid-cols-2 gap-2">
            <a href={png} download={fileName} className="min-h-12 rounded-xl border border-[#e2e8f0] text-base font-semibold text-[#0f172a] flex items-center justify-center">Download</a>
            <button type="button" onClick={share} className="min-h-12 rounded-xl bg-[#00D4E8] text-base font-semibold text-[#0a0f1a]">Share</button>
          </div>
        </div>
      )}

      <p className="text-sm text-[#64748b]">
        Before posting, check with the client. These are their personal photos.
      </p>
    </div>
  )
}
