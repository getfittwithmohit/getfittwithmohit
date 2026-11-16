// Builds the one-page "Unstoppable Pledge" PDF a client can keep for her
// morning and night ritual. Pure function: give it the name, the signing date
// and the font files, get PDF bytes back. No network, no database.

import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { PLEDGE_OPENING, pledgeStanzas } from './pledgeText'

export interface PledgePdfFonts {
  regular: ArrayBuffer | Uint8Array
  medium: ArrayBuffer | Uint8Array
  bold: ArrayBuffer | Uint8Array
}

export interface PledgePdfInput {
  fullName: string
  signedAt?: string | Date | null
  fonts: PledgePdfFonts
}

const hex = (h: string) => {
  const n = parseInt(h.replace('#', ''), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const NAVY = hex('#0a0f1a')
const PANEL = hex('#111827')
const RULE = hex('#1F2A3A')
const CYAN = hex('#00D4E8')
const WHITE = hex('#FFFFFF')
const SOFT = hex('#C9D1DC')
const MUTE = hex('#7C8798')

// A4 in points
const W = 595.28
const H = 841.89
const M = 42

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (!line || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function roundedRect(w: number, h: number, r: number): string {
  return [
    `M ${r} 0`, `H ${w - r}`, `Q ${w} 0 ${w} ${r}`,
    `V ${h - r}`, `Q ${w} ${h} ${w - r} ${h}`,
    `H ${r}`, `Q 0 ${h} 0 ${h - r}`,
    `V ${r}`, `Q 0 0 ${r} 0`, 'Z',
  ].join(' ')
}

function centred(
  page: PDFPage, text: string, font: PDFFont, size: number, y: number,
  color = WHITE,
) {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: (W - w) / 2, y, size, font, color })
}

function tracked(
  page: PDFPage, text: string, font: PDFFont, size: number, y: number,
  tracking: number, color = CYAN,
) {
  const chars = [...text]
  const total = chars.reduce((s, ch) => s + font.widthOfTextAtSize(ch, size), 0)
    + tracking * (chars.length - 1)
  let x = (W - total) / 2
  for (const ch of chars) {
    page.drawText(ch, { x, y, size, font, color })
    x += font.widthOfTextAtSize(ch, size) + tracking
  }
}

function formatDate(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generatePledgePdf(input: PledgePdfInput): Promise<Uint8Array> {
  const name = (input.fullName || '').trim().replace(/\s+/g, ' ')
  if (!name) throw new Error('A name is needed to create the pledge PDF.')

  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const regular = await pdf.embedFont(input.fonts.regular, { subset: true })
  const medium = await pdf.embedFont(input.fonts.medium, { subset: true })
  const bold = await pdf.embedFont(input.fonts.bold, { subset: true })

  pdf.setTitle('The Unstoppable Health, Fitness & Performance Commitment Pledge')
  pdf.setAuthor('Coach Mohit Mehral | GetFittWithMohit')
  pdf.setSubject(`Commitment pledge of ${name}`)

  const page = pdf.addPage([W, H])

  // Background and frame
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY })
  page.drawSvgPath(roundedRect(W - 44, H - 44, 10), {
    x: 22, y: H - 22, borderColor: CYAN, borderWidth: 0.8,
  })

  // ── Header ──
  let y = H - 54
  tracked(page, 'TRANSFORM TO INSPIRE', medium, 8, y, 2.6)
  y -= 30
  centred(page, 'The Unstoppable Pledge', bold, 23, y)
  y -= 18
  centred(
    page,
    'Health, Fitness & Performance Commitment  ·  Read every morning and every night',
    regular, 9, y, MUTE,
  )
  y -= 14
  page.drawLine({
    start: { x: W / 2 - 26, y }, end: { x: W / 2 + 26, y },
    thickness: 1.4, color: CYAN,
  })
  y -= 24

  // ── Opening: "I, <name>, pledge from today that I will become" ──
  const openSize = 11.2
  const [openA, openB] = (() => {
    const split = PLEDGE_OPENING.indexOf('unstoppable')
    return [PLEDGE_OPENING.slice(0, split).trim(), PLEDGE_OPENING.slice(split).trim()]
  })()
  const maxOpenW = W - 2 * M - 40
  const pre = 'I, '
  const post = `, ${openA}`
  const preW = medium.widthOfTextAtSize(pre, openSize)
  const nameW = medium.widthOfTextAtSize(name, openSize)
  const postW = medium.widthOfTextAtSize(post, openSize)

  if (preW + nameW + postW <= maxOpenW) {
    let x = (W - (preW + nameW + postW)) / 2
    page.drawText(pre, { x, y, size: openSize, font: medium, color: WHITE })
    x += preW
    page.drawText(name, { x, y, size: openSize, font: medium, color: CYAN })
    x += nameW
    page.drawText(post, { x, y, size: openSize, font: medium, color: WHITE })
    y -= 17
  } else {
    // Long name: give it its own line(s), then continue the sentence below
    const nameLines = wrap(name, medium, openSize, maxOpenW - preW - 6)
    nameLines.forEach((ln, i) => {
      const first = i === 0 ? pre : ''
      const last = i === nameLines.length - 1 ? ',' : ''
      const firstW = medium.widthOfTextAtSize(first, openSize)
      const lnW = medium.widthOfTextAtSize(ln, openSize)
      const lastW = medium.widthOfTextAtSize(last, openSize)
      let x = (W - (firstW + lnW + lastW)) / 2
      if (first) page.drawText(first, { x, y, size: openSize, font: medium, color: WHITE })
      x += firstW
      page.drawText(ln, { x, y, size: openSize, font: medium, color: CYAN })
      x += lnW
      if (last) page.drawText(last, { x, y, size: openSize, font: medium, color: WHITE })
      y -= 17
    })
    centred(page, openA, medium, openSize, y)
    y -= 17
  }
  centred(page, openB, medium, openSize, y, CYAN)
  y -= 24

  // ── Stanzas ──
  const stanzas = pledgeStanzas()
  const lead = stanzas[0]
  const closing = stanzas[stanzas.length - 1]
  const middle = stanzas.slice(1, -1)

  const bodySize = 9.6
  const leading = 13.5
  const stanzaGap = 9

  // Lead stanza, centred
  for (const text of lead) {
    for (const ln of wrap(text, regular, bodySize, W - 2 * M - 80)) {
      centred(page, ln, regular, bodySize, y, SOFT)
      y -= leading
    }
  }
  y -= 12

  // Two balanced columns
  const gutter = 26
  const colW = (W - 2 * M - gutter) / 2
  const textW = colW - 10

  const laidOut = middle.map((stanza) =>
    stanza.map((text, i) => ({
      lines: wrap(
        text,
        stanza.length > 1 && i === stanza.length - 1 ? medium : regular,
        bodySize, textW,
      ),
      strong: stanza.length > 1 && i === stanza.length - 1,
    })),
  )
  const heights = laidOut.map(
    (st) => st.reduce((s, item) => s + item.lines.length * leading, 0) + stanzaGap,
  )
  const total = heights.reduce((a, b) => a + b, 0)
  let split = 1
  let best = Infinity
  let acc = 0
  for (let i = 0; i < heights.length - 1; i++) {
    acc += heights[i]
    const diff = Math.abs(total - 2 * acc)
    if (diff < best) { best = diff; split = i + 1 }
  }

  const top = y
  const drawColumn = (items: typeof laidOut, x: number): number => {
    let cy = top
    for (const stanza of items) {
      page.drawRectangle({ x, y: cy - 9.5, width: 2, height: 7, color: CYAN })
      for (const item of stanza) {
        for (const ln of item.lines) {
          page.drawText(ln, {
            x: x + 10, y: cy - leading * 0.74, size: bodySize,
            font: item.strong ? medium : regular,
            color: item.strong ? WHITE : SOFT,
          })
          cy -= leading
        }
      }
      cy -= stanzaGap
    }
    return cy
  }
  const yLeft = drawColumn(laidOut.slice(0, split), M)
  const yRight = drawColumn(laidOut.slice(split), M + colW + gutter)
  const bottom = Math.min(yLeft, yRight) + stanzaGap
  page.drawLine({
    start: { x: W / 2, y: top - 2 }, end: { x: W / 2, y: bottom + 2 },
    thickness: 0.6, color: RULE,
  })
  y = bottom - 14

  // ── Closing panel ──
  const closeLines = closing.slice(0, -1)
  const finalLine = closing[closing.length - 1]
  const closeLeading = 15
  const panelH = 11 + closeLines.length * closeLeading + 43
  page.drawSvgPath(roundedRect(W - 2 * M, panelH, 8), { x: M, y, color: PANEL })
  let py = y - 11
  for (const ln of closeLines) {
    centred(page, ln, medium, 10.4, py - closeLeading * 0.74, WHITE)
    py -= closeLeading
  }
  centred(page, finalLine, bold, 19, py - 23, CYAN)

  // ── Footer ──
  const signed = formatDate(input.signedAt)
  const footer = [
    signed ? `Signed on ${signed}` : null,
    'Coach Mohit Mehral',
    'GetFittWithMohit',
  ].filter(Boolean).join('  ·  ')
  centred(page, footer, regular, 7.8, 38, MUTE)

  return pdf.save()
}

export function pledgePdfFileName(fullName: string): string {
  const safe = (fullName || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return safe ? `Unstoppable-Pledge-${safe}.pdf` : 'Unstoppable-Pledge.pdf'
}
