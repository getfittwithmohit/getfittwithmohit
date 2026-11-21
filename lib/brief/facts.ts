// Coach Brief — the facts. Every number in a brief is computed here, from the
// client's own rows; the AI only turns these facts into words. Pure function:
// no database calls, so it can be tested on its own.

type Row = Record<string, unknown>

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN
  return Number.isFinite(n) ? n : null
}
const r1 = (n: number) => Math.round(n * 10) / 10
const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null)
  return v.length ? r1(v.reduce((a, b) => a + b, 0) / v.length) : null
}
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
const inRange = (d: string, from: string, to: string) => d >= from && d <= to

export interface BriefInput {
  today: string // IST yyyy-mm-dd
  currentWeek: number
  client: Row
  bodyMetrics: Row | null
  pledge: Row | null
  weekly: Row[] // weekly_checkins, any order
  daily: Row[] // daily_checkins, last 14+ days
  workouts: Row[] // workout_logs, last 14+ days
  painFlags: Row[] // workout_pain_flags, unresolved
  meals: Row[] // meal_logs, logged, last 7+ days
  rituals: Row[] // daily_rituals, last 14+ days
  ritualStreak: Row | null
  photoWeeks: number[]
  lastCall: Row | null // review_calls, latest with notes
}

const SITES: [string, string][] = [
  ['waist_inches', 'waist'],
  ['lower_belly_inches', 'lower belly'],
  ['hip_inches', 'hips'],
  ['chest_inches', 'chest'],
  ['thigh_inches', 'thigh'],
]

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return t.toISOString().slice(0, 10)
}

const dateOf = (v: unknown) => (typeof v === 'string' ? v.slice(0, 10) : '')

export function buildFacts(i: BriefInput) {
  const thisFrom = addDays(i.today, -6)
  const prevFrom = addDays(i.today, -13)
  const prevTo = addDays(i.today, -7)

  // ── Body ──────────────────────────────────────────────────────────────
  const weekly = [...i.weekly].sort((a, b) => (num(a.week_number) ?? 0) - (num(b.week_number) ?? 0) || String(a.submitted_at).localeCompare(String(b.submitted_at)))
  const latest = weekly[weekly.length - 1] || null
  const previous = weekly.length > 1 ? weekly[weekly.length - 2] : null
  const startWeight = num(i.bodyMetrics?.weight_kg)
  const latestWeight = num(latest?.weight_kg)
  const lastValue = (field: string) => {
    for (let k = weekly.length - 1; k >= 0; k--) { const v = num(weekly[k][field]); if (v !== null) return v }
    return null
  }
  const startValue = (field: string) => num(i.bodyMetrics?.[field]) ?? (() => {
    for (const w of weekly) { const v = num(w[field]); if (v !== null) return v }
    return null
  })()
  const inchesSinceStart = SITES.map(([f, label]) => {
    const s = startValue(f)
    const e = lastValue(f)
    return s !== null && e !== null && s !== e ? { site: label, change_in: r1(e - s) } : null
  }).filter(Boolean) as { site: string; change_in: number }[]
  const inchesTotal = inchesSinceStart.length ? r1(inchesSinceStart.reduce((a, x) => a + x.change_in, 0)) : null

  const body = {
    start_weight_kg: startWeight,
    latest_weight_kg: latestWeight,
    target_weight_kg: num(i.bodyMetrics?.target_weight_kg),
    weight_change_since_start_kg: startWeight !== null && latestWeight !== null ? r1(latestWeight - startWeight) : null,
    weight_change_vs_previous_checkin_kg: latestWeight !== null && num(previous?.weight_kg) !== null ? r1(latestWeight - num(previous!.weight_kg)!) : null,
    waist_change_vs_previous_checkin_in: num(latest?.waist_inches) !== null && num(previous?.waist_inches) !== null ? r1(num(latest!.waist_inches)! - num(previous!.waist_inches)!) : null,
    inches_change_since_start_total: inchesTotal,
    inches_change_since_start_by_site: inchesSinceStart,
    trouser_size_start: str(i.bodyMetrics?.trouser_waist_size),
    trouser_size_latest: (() => { for (let k = weekly.length - 1; k >= 0; k--) { const v = str(weekly[k].trouser_waist_size); if (v) return v } return null })(),
  }

  // ── Daily habits: this 7 days vs the 7 before ─────────────────────────
  const window = (from: string, to: string) => {
    const days = i.daily.filter((d) => inRange(dateOf(d.checkin_date), from, to))
    return {
      checkin_days: days.length,
      workouts_done_or_modified: days.filter((d) => d.workout_status === 'done' || d.workout_status === 'modified').length,
      workouts_skipped: days.filter((d) => d.workout_status === 'skipped').length,
      avg_nutrition_1_10: avg(days.map((d) => num(d.nutrition_score))),
      avg_steps: (() => { const a = avg(days.map((d) => num(d.steps))); return a === null ? null : Math.round(a) })(),
      avg_sleep_hours: avg(days.map((d) => num(d.sleep_hours))),
      nights_under_6h: days.filter((d) => (num(d.sleep_hours) ?? 99) < 6).length,
      avg_sleep_quality_1_10: avg(days.map((d) => num(d.sleep_quality))),
      avg_energy_1_10: avg(days.map((d) => num(d.energy))),
      avg_water_litres: avg(days.map((d) => num(d.water_litres))),
    }
  }
  const thisWeek = window(thisFrom, i.today)
  const lastWeek = window(prevFrom, prevTo)

  const skipNotes = i.daily
    .filter((d) => inRange(dateOf(d.checkin_date), thisFrom, i.today) && d.workout_status !== 'done' && str(d.workout_note))
    .map((d) => `${dateOf(d.checkin_date)}: ${str(d.workout_note)}`)
  const nutritionNotes = i.daily
    .filter((d) => inRange(dateOf(d.checkin_date), thisFrom, i.today) && str(d.nutrition_note))
    .map((d) => `${dateOf(d.checkin_date)}: ${str(d.nutrition_note)}`)
  const support = i.daily
    .filter((d) => d.support_needed === true && inRange(dateOf(d.checkin_date), prevFrom, i.today))
    .map((d) => ({ date: dateOf(d.checkin_date), message: str(d.support_message), resolved: d.support_resolved === true }))

  // ── Training ──────────────────────────────────────────────────────────
  const completed = (from: string, to: string) => i.workouts.filter((w) => w.status === 'completed' && inRange(dateOf(w.completed_at || w.started_at), from, to))
  const trainedThis = completed(thisFrom, i.today)
  const training = {
    sessions_completed_this_7_days: trainedThis.length,
    sessions_completed_previous_7_days: completed(prevFrom, prevTo).length,
    sessions: trainedThis.map((w) => ({ date: dateOf(w.completed_at), name: str(w.session_name), feel: str(w.feel), minutes: num(w.duration_seconds) !== null ? Math.round(num(w.duration_seconds)! / 60) : null })),
    unresolved_pain_flags: i.painFlags.map((p) => ({ date: dateOf(p.created_at), note: str(p.note) })),
  }

  // ── Nutrition (PEAK Plate, only if they use it) ──────────────────────
  const mealsThis = i.meals.filter((m) => inRange(dateOf(m.meal_date), thisFrom, i.today))
  const mealDays = [...new Set(mealsThis.map((m) => dateOf(m.meal_date)))]
  const perDay = mealDays.map((d) => mealsThis.filter((m) => dateOf(m.meal_date) === d))
  const nutrition = mealsThis.length
    ? {
        meals_logged_7_days: mealsThis.length,
        days_with_meals_logged: mealDays.length,
        avg_calories_on_logged_days: Math.round(avg(perDay.map((ms) => ms.reduce((a, m) => a + (num(m.calories) ?? 0), 0)))!),
        avg_protein_g_on_logged_days: Math.round(avg(perDay.map((ms) => ms.reduce((a, m) => a + (num(m.protein_g) ?? 0), 0)))!),
        avg_meal_score_1_10: avg(mealsThis.map((m) => num(m.score))),
        meals_needing_a_fix: mealsThis.filter((m) => m.verdict === 'fix').map((m) => str(m.title)).slice(0, 5),
      }
    : null

  // ── Ritual ────────────────────────────────────────────────────────────
  const ritualDays = i.rituals.filter((r) => r.completed_at && inRange(dateOf(r.date), thisFrom, i.today)).length
  const streakLast = dateOf(i.ritualStreak?.last_completed_date)
  const ritual = {
    ritual_days_this_7: ritualDays,
    current_streak_days: streakLast && streakLast >= addDays(i.today, -1) ? num(i.ritualStreak?.current_streak) ?? 0 : 0,
    longest_streak_days: num(i.ritualStreak?.longest_streak),
  }

  // ── Latest weekly check-in (their words) ──────────────────────────────
  const latestDate = dateOf(latest?.submitted_at)
  const weeklyCheckin = latest
    ? {
        week_number: num(latest.week_number),
        submitted: latestDate,
        is_from_this_week: latestDate >= thisFrom,
        mood: str(latest.mood),
        week_rating_1_10: num(latest.week_rating),
        stress_1_10: num(latest.stress_level),
        hunger_cravings_1_10: num(latest.hunger_level),
        alcoholic_drinks: str(latest.drinks_this_week),
        cycle_phase: str(latest.cycle_phase),
        why_connection_1_10: num(latest.why_connection),
        health_issues: str(latest.health_issues),
        biggest_win: str(latest.biggest_win),
        biggest_challenge: str(latest.biggest_challenge),
        real_life_context: str(latest.real_life_context),
        mindset_answer: str(latest.mindset_answer),
        needs_from_coach: Array.isArray(latest.needs_from_coach) ? (latest.needs_from_coach as string[]).join(', ') : str(latest.needs_from_coach),
      }
    : null

  // ── Photos & last call ────────────────────────────────────────────────
  const lastPhotoWeek = i.photoWeeks.length ? Math.max(...i.photoWeeks) : null
  const photos = {
    photo_weeks: [...new Set(i.photoWeeks)].sort((a, b) => a - b),
    progress_photos_due: i.currentWeek >= 2 && (lastPhotoWeek === null || i.currentWeek - lastPhotoWeek >= 4),
  }
  const lastCall = i.lastCall
    ? { week: num(i.lastCall.week_number), discussed: str(i.lastCall.discussed), changes_agreed: str(i.lastCall.changes), next_focus: str(i.lastCall.next_focus) }
    : null

  // ── What's missing (so the brief can say so instead of guessing) ─────
  const gaps: string[] = []
  if (!latest || !weeklyCheckin?.is_from_this_week) gaps.push('No weekly check-in in the last 7 days')
  if (thisWeek.checkin_days < 4) gaps.push(`Only ${thisWeek.checkin_days} of 7 daily check-ins this week`)
  if (photos.progress_photos_due) gaps.push('Progress photos are due')
  if (startWeight === null) gaps.push('No starting weight on file')

  return {
    client: {
      first_name: str(i.client.full_name)?.split(/\s+/)[0] ?? 'Client',
      gender: str(i.client.gender),
      phase: str(i.client.phase),
      programme_week: i.currentWeek,
      primary_goal: str(i.bodyMetrics?.primary_goal),
      doing_this_for: str(i.pledge?.doing_this_for),
      coach_private_notes: str(i.client.coach_notes),
    },
    body,
    daily_this_7_days: thisWeek,
    daily_previous_7_days: lastWeek,
    workout_skip_notes: skipNotes,
    nutrition_notes: nutritionNotes,
    support_requests_last_14_days: support,
    training,
    peak_plate: nutrition,
    ritual,
    weekly_checkin: weeklyCheckin,
    photos,
    last_review_call: lastCall,
    data_gaps: gaps,
  }
}

export type BriefFacts = ReturnType<typeof buildFacts>
