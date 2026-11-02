/**
 * Activity Grid data builder (Log page heatmap).
 *
 * Pure and string-based: every date is a local calendar date 'YYYY-MM-DD'.
 * Date arithmetic is done on UTC-midnight timestamps built from those strings,
 * so the result never depends on the device's time zone or DST.
 *
 * Weeks run Monday to Sunday (same as the rest of the app).
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

const DAY_MS = 24 * 60 * 60 * 1000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

const toMs = (date: string): number | null => {
  const m = DATE_RE.exec(date)
  if (!m) return null
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

const toStr = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

/** Monday on or before the given UTC-midnight timestamp. */
const mondayOf = (ms: number): number => {
  const dow = new Date(ms).getUTCDay() // 0 = Sunday
  const back = dow === 0 ? 6 : dow - 1
  return ms - back * DAY_MS
}

export function buildActivityGrid(
  workouts: GridWorkout[],
  today: string,
  { futureWeeks = 3, minPastWeeks = 26, maxPastWeeks = 156 }: BuildGridOptions = {}
): GridWeek[] {
  const todayMs = toMs(today)
  if (todayMs === null) return []
  const thisMonday = mondayOf(todayMs)

  // Group valid workouts by date, keeping logged order (created_at ascending).
  const byDate = new Map<string, GridWorkout[]>()
  let oldestMs = todayMs
  for (const w of workouts) {
    const ms = toMs(w.date)
    if (ms === null || ![1, 2, 3].includes(w.rating)) continue
    if (ms < oldestMs) oldestMs = ms
    const list = byDate.get(w.date)
    if (list) list.push(w)
    else byDate.set(w.date, [w])
  }
  byDate.forEach(list =>
    list.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
  )

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
        ratings: (byDate.get(date) || []).slice(0, 2).map(w => w.rating),
        isToday: ms === todayMs,
        isFuture: ms > todayMs
      })
    }
    weeks.push({ start: toStr(mondayMs), monthLabel, days })
  }
  return weeks
}
