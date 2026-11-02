/**
 * Activity Grid (Log page heatmap) and History month calendar data builders.
 *
 * Pure and string-based: every date is a local calendar date 'YYYY-MM-DD'
 * and every month is 'YYYY-MM'. Date arithmetic is done on UTC-midnight
 * timestamps built from those strings, so the result never depends on the
 * device's time zone or DST. Never derive "today" in here: callers pass it
 * in from getLocalDateString().
 *
 * Weeks run Monday to Sunday everywhere.
 */

export interface GridWorkout {
  date: string            // 'YYYY-MM-DD'
  rating: number          // 1 Struggled, 2 Solid, 3 Great
  created_at?: string
}

export interface GridDay {
  date: string
  /** Ratings for the first two workouts of the day, in logged order (max 2). */
  ratings: number[]
  isToday: boolean
  isFuture: boolean
}

export interface GridWeek {
  /** Monday of this week, 'YYYY-MM-DD'. */
  start: string
  /** Short month name when the 1st of a month falls in this week, else null. */
  monthLabel: string | null
  days: GridDay[]         // always 7, Monday first
}

export interface BuildGridOptions {
  /** Weeks shown after the current week. */
  futureWeeks?: number
  /** Minimum number of weeks up to and including the current week. */
  minPastWeeks?: number
  /** Hard cap on weeks before the current week (guards against bad old dates). */
  maxPastWeeks?: number
}

/** A day in the History month calendar or week strip. */
export interface CalendarDay extends GridDay {
  /** Day of the month, 1-31. */
  dayOfMonth: number
  /** 'YYYY-MM' this day belongs to. */
  month: string
}

export interface MonthSummary {
  /** Distinct days with at least one workout. */
  days: number
  workouts: number
  /** Total duration in minutes. */
  minutes: number
}

/** Ratings per date: first two workouts of the day in logged order. */
export type RatingsByDate = Map<string, number[]>

const DAY_MS = 24 * 60 * 60 * 1000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_RE = /^(\d{4})-(\d{2})$/

const pad = (n: number): string => String(n).padStart(2, '0')

const toMs = (date: string): number | null => {
  const m = DATE_RE.exec(date)
  if (!m) return null
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** UTC-midnight timestamp back to 'YYYY-MM-DD' (UTC accessors only, never toISOString). */
const toStr = (ms: number): string => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Monday on or before the given UTC-midnight timestamp. */
const mondayOf = (ms: number): number => {
  const dow = new Date(ms).getUTCDay() // 0 = Sunday
  const back = dow === 0 ? 6 : dow - 1
  return ms - back * DAY_MS
}

const isValidRating = (r: number): boolean => r === 1 || r === 2 || r === 3

/**
 * Group workouts by date, keeping the first two ratings of each day in
 * logged order (created_at ascending). Invalid dates and ratings are skipped.
 */
export function groupRatingsByDate(workouts: GridWorkout[]): RatingsByDate {
  const byDate = new Map<string, GridWorkout[]>()
  for (const w of workouts) {
    if (toMs(w.date) === null || !isValidRating(w.rating)) continue
    const list = byDate.get(w.date)
    if (list) list.push(w)
    else byDate.set(w.date, [w])
  }
  const result: RatingsByDate = new Map()
  byDate.forEach((list, date) => {
    list.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
    result.set(date, list.slice(0, 2).map(w => w.rating))
  })
  return result
}

export function buildActivityGrid(
  workouts: GridWorkout[],
  today: string,
  { futureWeeks = 3, minPastWeeks = 26, maxPastWeeks = 156 }: BuildGridOptions = {}
): GridWeek[] {
  const todayMs = toMs(today)
  if (todayMs === null) return []
  const thisMonday = mondayOf(todayMs)

  const byDate = groupRatingsByDate(workouts)
  let oldestMs = todayMs
  byDate.forEach((_ratings, date) => {
    const ms = toMs(date) as number
    if (ms < oldestMs) oldestMs = ms
  })

  // Range: back to the oldest workout's week (at least minPastWeeks, at most maxPastWeeks).
  const oldestWeeksBack = Math.round((thisMonday - mondayOf(oldestMs)) / (7 * DAY_MS))
  const weeksBack = Math.min(Math.max(oldestWeeksBack, minPastWeeks - 1), maxPastWeeks)
  const firstMonday = thisMonday - weeksBack * 7 * DAY_MS
  const totalWeeks = weeksBack + 1 + futureWeeks

  const weeks: GridWeek[] = []
  for (let wk = 0; wk < totalWeeks; wk++) {
    const mondayMs = firstMonday + wk * 7 * DAY_MS
    const days: GridDay[] = []
    let monthLabel: string | null = null
    for (let d = 0; d < 7; d++) {
      const ms = mondayMs + d * DAY_MS
      const date = toStr(ms)
      const dt = new Date(ms)
      if (dt.getUTCDate() === 1) monthLabel = MONTHS[dt.getUTCMonth()]
      days.push({
        date,
        ratings: byDate.get(date) || [],
        isToday: ms === todayMs,
        isFuture: ms > todayMs
      })
    }
    weeks.push({ start: toStr(mondayMs), monthLabel, days })
  }
  return weeks
}

// ===== History month calendar helpers =====

/** 'YYYY-MM-DD' -> 'YYYY-MM'. */
export const monthOf = (date: string): string => date.slice(0, 7)

/** Move a 'YYYY-MM' month by delta months. */
export function shiftMonth(month: string, delta: number): string {
  const m = MONTH_RE.exec(month)
  if (!m) return month
  const index = Number(m[1]) * 12 + (Number(m[2]) - 1) + delta
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`
}

/** 'YYYY-MM' -> 'October 2026'. */
export function monthTitle(month: string): string {
  const m = MONTH_RE.exec(month)
  if (!m) return month
  return `${MONTHS_LONG[Number(m[2]) - 1]} ${m[1]}`
}

/** 'YYYY-MM' -> 'October'. */
export function monthName(month: string): string {
  const m = MONTH_RE.exec(month)
  if (!m) return month
  return MONTHS_LONG[Number(m[2]) - 1]
}

/** 'YYYY-MM-DD' -> 'Oct 31'. */
export function shortDateLabel(date: string): string {
  const m = DATE_RE.exec(date)
  if (!m) return date
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`
}

/** Monday of the week containing the date ('YYYY-MM-DD'). */
export function weekStartOf(date: string): string {
  const ms = toMs(date)
  return ms === null ? date : toStr(mondayOf(ms))
}

/** Move a date by delta days. */
export function shiftDays(date: string, delta: number): string {
  const ms = toMs(date)
  return ms === null ? date : toStr(ms + delta * DAY_MS)
}

const makeDay = (ms: number, byDate: RatingsByDate, todayMs: number): CalendarDay => {
  const date = toStr(ms)
  return {
    date,
    dayOfMonth: new Date(ms).getUTCDate(),
    month: monthOf(date),
    ratings: byDate.get(date) || [],
    isToday: ms === todayMs,
    isFuture: ms > todayMs
  }
}

/** The 7 days (Monday first) of the week starting at the given Monday. */
export function buildWeek(monday: string, byDate: RatingsByDate, today: string): CalendarDay[] {
  const startMs = toMs(weekStartOf(monday))
  const todayMs = toMs(today)
  if (startMs === null || todayMs === null) return []
  const days: CalendarDay[] = []
  for (let d = 0; d < 7; d++) days.push(makeDay(startMs + d * DAY_MS, byDate, todayMs))
  return days
}

/**
 * Month calendar: Monday-first weeks, 7 cells each. Cells outside the month are null.
 */
export function buildMonthCalendar(
  month: string,
  byDate: RatingsByDate,
  today: string
): (CalendarDay | null)[][] {
  const firstMs = toMs(`${month}-01`)
  const todayMs = toMs(today)
  if (firstMs === null || todayMs === null) return []
  const nextFirstMs = toMs(`${shiftMonth(month, 1)}-01`) as number

  const weeks: (CalendarDay | null)[][] = []
  for (let mondayMs = mondayOf(firstMs); mondayMs < nextFirstMs; mondayMs += 7 * DAY_MS) {
    const week: (CalendarDay | null)[] = []
    for (let d = 0; d < 7; d++) {
      const ms = mondayMs + d * DAY_MS
      week.push(ms >= firstMs && ms < nextFirstMs ? makeDay(ms, byDate, todayMs) : null)
    }
    weeks.push(week)
  }
  return weeks
}

/** Days with workouts, workout count and total minutes for one month. */
export function summarizeMonth(
  workouts: { date: string; duration?: number | null }[],
  month: string
): MonthSummary {
  const days = new Set<string>()
  let count = 0
  let minutes = 0
  for (const w of workouts) {
    if (toMs(w.date) === null || monthOf(w.date) !== month) continue
    days.add(w.date)
    count++
    minutes += Number(w.duration) || 0
  }
  return { days: days.size, workouts: count, minutes }
}
