// Printable / WhatsApp-shareable PDF of a workout plan (client plan or
// template). Pure function: plan + fonts in, PDF bytes out. Light A4 so it
// prints cleanly; every exercise has a tappable "Watch demo" link.

import { PDFDocument, PDFFont, PDFName, PDFPage, PDFString, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { LogType, PlanExercise, PlanSession, WorkoutPlan } from '@/lib/types/workouts'
import { describeTarget, formatSeconds, youtubeSearchUrl } from '@/lib/utils/workouts'

export interface PlanPdfFonts {
  regular: ArrayBuffer | Uint8Array
  medium: ArrayBuffer | Uint8Array
  bold: ArrayBuffer | Uint8Array
}

export interface PlanPdfInput {
  plan: WorkoutPlan
  clientName?: string | null
  fonts: PlanPdfFonts
}

const hex = (h: string) => {
  const n = parseInt(h.replace('#', ''), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}
const NAVY = hex('#1a1f3a')
const CYAN = hex('#00D4E8')
const TEAL = hex('#007A8A')
const INK = hex('#0f172a')
const SEC = hex('#475569')
const MUTE = hex('#94a3b8')
const RULE = hex('#e2e8f0')
const ROW = hex('#f8fafc')
const WHITE = hex('#FFFFFF')

const W = 595.28
const H = 841.89
const M = 40
const BOTTOM = 56
const WEEKDAY = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Columns: # | exercise | sets × target | rest
const COL = { num: M + 10, ex: M + 34, target: W - M - 170, rest: W - M - 62 }
const EX_W = COL.target - COL.ex - 12

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (!line || font.widthOfTextAtSize(next, size) <= maxWidth) line = next
      else { lines.push(line); line = word }
    }
    if (line) lines.push(line)
  }
  return lines
}

function addLink(pdf: PDFDocument, page: PDFPage, x: number, y: number, w: number, h: number, url: string) {
  const annot = pdf.context.register(pdf.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [x, y, x + w, y + h],
    Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
  }))
  const annots = page.node.lookup(PDFName.of('Annots'))
  if (annots && 'push' in annots) (annots as unknown as { push: (r: unknown) => void }).push(annot)
  else page.node.set(PDFName.of('Annots'), pdf.context.obj([annot]))
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function restText(sec: number | null): string {
  if (!sec) return '—'
  if (sec < 60) return `${sec} sec`
  return sec % 60 === 0 ? `${sec / 60} min` : `${formatSeconds(sec)} min`
}

function targetText(pe: PlanExercise): string {
  const logType: LogType = pe.exercise?.log_type || 'weight_reps'
  const t = describeTarget(pe, logType)
  return logType === 'weight_reps' || logType === 'reps' ? `${t} reps` : t
}

export async function generatePlanPdf(input: PlanPdfInput): Promise<Uint8Array> {
  const { plan } = input
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const regular = await pdf.embedFont(input.fonts.regular, { subset: true })
  const medium = await pdf.embedFont(input.fonts.medium, { subset: true })
  const bold = await pdf.embedFont(input.fonts.bold, { subset: true })

  // Drop characters the font can't draw (emoji etc.) instead of failing.
  const glyphs = new Set(regular.getCharacterSet())
  const clean = (s: string | null | undefined) =>
    [...(s || '')].filter((ch) => ch === '\n' || glyphs.has(ch.codePointAt(0)!)).join('').replace(/[ \t]+/g, ' ').trim()

  const client = clean(input.clientName)
  pdf.setTitle(`${clean(plan.name)}${client ? ` — ${client}` : ''}`)
  pdf.setAuthor('Coach Mohit Mehral | GetFittWithMohit')

  let page = pdf.addPage([W, H])
  let y = H

  const text = (s: string, x: number, yy: number, font: PDFFont, size: number, color = INK) =>
    page.drawText(s, { x, y: yy, size, font, color })

  // ── Header band ──
  const header = () => {
    page.drawRectangle({ x: 0, y: H - 118, width: W, height: 118, color: NAVY })
    text('GETFITTWITHMOHIT  ·  WORKOUT PLAN', M, H - 38, medium, 8, CYAN)
    const title = wrap(clean(plan.name) || 'Workout plan', bold, 22, W - 2 * M)[0]
    text(title, M, H - 66, bold, 22, WHITE)
    const who = client ? `Prepared for ${client} by Coach Mohit` : 'Template by Coach Mohit'
    text(who, M, H - 86, regular, 10, hex('#CBD5E1'))
    const bits = [
      `${plan.plan_sessions.length} workout${plan.plan_sessions.length === 1 ? '' : 's'}`,
      plan.schedule_type === 'rolling' ? `${plan.sessions_per_week} per week, in order` : 'Fixed days',
      plan.weeks ? `${plan.weeks} weeks` : null,
      formatDate(plan.start_date) ? `From ${formatDate(plan.start_date)}` : null,
    ].filter(Boolean).join('   ·   ')
    text(bits, M, H - 102, regular, 9, hex('#94A3B8'))
    y = H - 140
  }

  const newPage = () => {
    page = pdf.addPage([W, H])
    const small = `${clean(plan.name)}${client ? ` · ${client}` : ''}`
    text(small, M, H - 34, medium, 8, MUTE)
    page.drawLine({ start: { x: M, y: H - 42 }, end: { x: W - M, y: H - 42 }, thickness: 0.6, color: RULE })
    y = H - 62
  }
  const ensure = (needed: number) => { if (y - needed < BOTTOM) newPage() }

  header()

  // How to use
  const howTo = plan.schedule_type === 'rolling'
    ? 'Do the workouts in order (A, B, C…) and start again after the last one. Log every set in the app’s Train tab — that’s how the weights go up week by week.'
    : 'Each workout has its day. Log every set in the app’s Train tab — that’s how the weights go up week by week.'
  const howLines = wrap(clean(howTo), regular, 9, W - 2 * M - 24)
  const howH = 16 + howLines.length * 12
  page.drawRectangle({ x: M, y: y - howH, width: W - 2 * M, height: howH, color: hex('#E6F7F9') })
  howLines.forEach((l, i) => text(l, M + 12, y - 14 - i * 12, regular, 9, TEAL))
  y -= howH + 22

  const sessions = [...plan.plan_sessions].sort((a, b) => a.sort_order - b.sort_order)

  const sessionHeader = (s: PlanSession, cont = false, noteLines: string[] = []) => {
    const day = plan.schedule_type === 'weekdays' && s.weekday ? WEEKDAY[s.weekday] : null
    const label = `${clean(s.label)}  ${clean(s.name)}`.trim()
    page.drawRectangle({ x: M, y: y - 26, width: W - 2 * M, height: 26, color: NAVY })
    text(`${label}${cont ? '  (continued)' : ''}`, M + 10, y - 17.5, bold, 11.5, WHITE)
    if (day) {
      const w = medium.widthOfTextAtSize(day.toUpperCase(), 8)
      text(day.toUpperCase(), W - M - 10 - w, y - 16.5, medium, 8, CYAN)
    }
    y -= 26
    if (noteLines.length) {
      y -= 4
      noteLines.forEach((l) => { y -= 12; text(l, M + 10, y, regular, 9, SEC) })
      y -= 2
    }
    // column labels
    y -= 16
    text('#', COL.num, y, medium, 7.5, MUTE)
    text('EXERCISE', COL.ex, y, medium, 7.5, MUTE)
    text('SETS × TARGET', COL.target, y, medium, 7.5, MUTE)
    text('REST', COL.rest, y, medium, 7.5, MUTE)
    y -= 8
  }

  for (const s of sessions) {
    const exercises = [...s.plan_exercises].sort((a, b) => a.sort_order - b.sort_order)
    const note = clean(s.coach_note)
    const noteLines = note ? wrap(note, regular, 9, W - 2 * M - 20) : []
    ensure(26 + 24 + noteLines.length * 12 + 44)
    sessionHeader(s, false, noteLines)

    if (exercises.length === 0) {
      y -= 18
      text('No exercises yet.', COL.ex, y, regular, 9.5, MUTE)
      y -= 10
    }

    exercises.forEach((pe, i) => {
      const name = clean(pe.exercise?.name) || 'Exercise'
      const nameLines = wrap(name, medium, 10.5, EX_W)
      const sub = [clean(pe.note), ...(pe.exercise?.cues || []).slice(0, 2).map(clean)].filter(Boolean)
      const subLines = sub.flatMap((t) => wrap(t, regular, 8.5, EX_W))
      const rowH = 12 + nameLines.length * 13 + subLines.length * 11 + 14
      if (y - rowH < BOTTOM) { newPage(); sessionHeader(s, true) }

      if (i % 2 === 0) page.drawRectangle({ x: M, y: y - rowH, width: W - 2 * M, height: rowH, color: ROW })
      let ry = y - 16
      text(String(i + 1), COL.num, ry, bold, 10, TEAL)
      nameLines.forEach((l) => { text(l, COL.ex, ry, medium, 10.5); ry -= 13 })
      subLines.forEach((l) => { text(l, COL.ex, ry + 1, regular, 8.5, SEC); ry -= 11 })
      const url = pe.exercise?.video_url || youtubeSearchUrl(pe.exercise?.name || name)
      const link = 'Watch demo'
      text(link, COL.ex, ry, medium, 8, TEAL)
      const lw = medium.widthOfTextAtSize(link, 8)
      page.drawLine({ start: { x: COL.ex, y: ry - 1.5 }, end: { x: COL.ex + lw, y: ry - 1.5 }, thickness: 0.5, color: TEAL })
      addLink(pdf, page, COL.ex - 2, ry - 4, lw + 4, 12, url)

      text(clean(targetText(pe)), COL.target, y - 16, medium, 10.5)
      text(restText(pe.rest_seconds), COL.rest, y - 16, regular, 10, SEC)
      y -= rowH
    })
    y -= 22
  }

  // Footer on every page
  const pages = pdf.getPages()
  pages.forEach((p, i) => {
    const f = `GetFittWithMohit  ·  Page ${i + 1} of ${pages.length}`
    p.drawText(f, { x: (W - regular.widthOfTextAtSize(f, 8)) / 2, y: 26, size: 8, font: regular, color: MUTE })
  })

  return pdf.save()
}

export function planPdfFileName(planName: string, clientName?: string | null): string {
  const slug = (s: string) => s.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return `${[clientName ? slug(clientName) : null, slug(planName) || 'Workout-Plan'].filter(Boolean).join('_')}.pdf`
}
