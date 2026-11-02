/**
 * Trends page aggregation (wireframe C1): per-activity totals for a week or
 * month, unit conversion, and feel counts.
 *
 * Pure and string-based like activityGrid.ts: dates are local calendar dates
 * 'YYYY-MM-DD' and all date math goes through the activityGrid helpers.
 * Weeks run Monday to Sunday. Feel (rating) is NOT intensity.
 */
import { monthOf, monthTitle, shiftDays, shiftMonth, shortDateLabel, weekStartOf } from './activityGrid'

export type PeriodKind = 'week' | 'month'
export type DistanceUnit = 'yards' | 'meters' | 'miles' | 'kilometers'

export interface TrendsWorkout {
  workout_type: string
  date: string                    // 'YYYY-MM-DD'
  duration?: number | null        // minutes
  rating?: number | null          // 1 Struggled, 2 Solid, 3 Great
  distance?: number | null
  distance_unit?: string | null
  created_at?: string
}

export interface Period {
  kind: PeriodKind
  start: string                   // Monday, or the 1st of the month
  end: string                     // Sunday, or the last day of the month (inclusive)
}

export interface ActivityTrend {
  /** Grouping key: trimmed, lower-case activity name. */
  key: string
  /** Most-used spelling in the period. */
  name: string
  minutes: number
  sessions: number
  /** Total in `unit`, or null when no session in the period logged a distance (time is the headline). */
  distance: number | null
  unit: DistanceUnit | null
  /** Sessions without a distance; only counted when `distance` is not null. */
  missingDistance: number
  previous: {
    sessions: number
    minutes: number
    /** Total in `unit`, or null when no previous session logged a distance (or `unit` is null). */
    distance: number | null
  }
}

export interface FeelCounts {
  great: number
  solid: number
  struggled: number
}

export interface PeriodTrends {
  workouts: number
  minutes: number
  /** One entry per activity in the period, most time first. */
  activities: ActivityTrend[]
  feel: FeelCounts
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// ===== Periods =====

/** The week or month containing the date. */
export function periodFor(kind: PeriodKind, date: string): Period {
  if (kind === 'week') {
    const start = weekStartOf(date)
    return { kind, start, end: shiftDays(start, 6) }
  }
  const month = monthOf(date)
  return { kind, start: `${month}-01`, end: shiftDays(`${shiftMonth(month, 1)}-01`, -1) }
}

/** Move a period by delta weeks or months. */
export function shiftPeriod(period: Period, delta: number): Period {
  if (period.kind === 'week') return periodFor('week', shiftDays(period.start, 7 * delta))
  return periodFor('month', `${shiftMonth(monthOf(period.start), delta)}-01`)
}

/** 'Oct 26 – Nov 1' for a week, 'October 2026' for a month. */
export function periodLabel(period: Period): string {
  if (period.kind === 'week') return `${shortDateLabel(period.start)} – ${shortDateLabel(period.end)}`
  return monthTitle(monthOf(period.start))
}

/** String comparison is safe: all dates are zero-padded 'YYYY-MM-DD'. */
export const inPeriod = (date: string, period: Period): boolean =>
  DATE_RE.test(date) && date >= period.start && date <= period.end

// ===== Units =====

const UNIT_ALIASES: Record<string, DistanceUnit> = {
  yards: 'yards', yard: 'yards', yds: 'yards', yd: 'yards',
  meters: 'meters', meter: 'meters', metres: 'meters', metre: 'meters', m: 'meters',
  miles: 'miles', mile: 'miles', mi: 'miles',
  kilometers: 'kilometers', kilometer: 'kilometers', kilometres: 'kilometers', kilometre: 'kilometers', km: 'kilometers'
}

const METERS_PER: Record<DistanceUnit, number> = {
  yards: 0.9144,
  meters: 1,
  miles: 1609.344,
  kilometers: 1000
}

const UNIT_LABEL: Record<DistanceUnit, string> = {
  yards: 'yds',
  meters: 'm',
  miles: 'mi',
  kilometers: 'km'
}

/** Stored unit ('yards', 'km', ...) to a DistanceUnit, or null if unknown. */
export function normalizeUnit(unit: string | null | undefined): DistanceUnit | null {
  if (!unit) return null
  return UNIT_ALIASES[unit.trim().toLowerCase()] ?? null
}

export function convertDistance(value: number, from: DistanceUnit, to: DistanceUnit): number {
  return from === to ? value : (value * METERS_PER[from]) / METERS_PER[to]
}

export const unitLabel = (unit: DistanceUnit): string => UNIT_LABEL[unit]

/** '14,800' for yds / m (whole numbers); '9.5' or '12' for mi / km (one decimal, no trailing .0). */
export function formatDistanceValue(value: number, unit: DistanceUnit): string {
  if (unit === 'yards' || unit === 'meters') return Math.round(value).toLocaleString('en-US')
  return (Math.round(value * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 })
}

/** '14,800 yds', '9.5 mi'. */
export const formatDistance = (value: number, unit: DistanceUnit): string =>
  `${formatDistanceValue(value, unit)} ${unitLabel(unit)}`

// ===== Aggregation =====

/** Activity names are free text in places; group 'Swimming', 'swimming ' etc. together. */
export const activityKey = (name: string): string => (name || '').trim().toLowerCase()

/** A workout's distance and unit when both are usable, else null. */
const loggedDistance = (w: TrendsWorkout): { value: number; unit: DistanceUnit } | null => {
  const value = Number(w.distance)
  const unit = normalizeUnit(w.distance_unit)
  return unit && Number.isFinite(value) && value > 0 ? { value, unit } : null
}

const sortStamp = (w: TrendsWorkout): string => `${w.date}|${w.created_at || ''}`

/**
 * Each activity's most-used distance unit across all the given workouts
 * (not just one period, so the headline unit doesn't change week to week).
 * Ties go to the unit used most recently.
 */
export function preferredUnits(workouts: TrendsWorkout[]): Map<string, DistanceUnit> {
  const stats = new Map<string, Map<DistanceUnit, { count: number; latest: string }>>()
  for (const w of workouts) {
    const d = loggedDistance(w)
    if (!d) continue
    const key = activityKey(w.workout_type)
    if (!key) continue
    let byUnit = stats.get(key)
    if (!byUnit) stats.set(key, (byUnit = new Map()))
    const s = byUnit.get(d.unit) || { count: 0, latest: '' }
    s.count++
    if (sortStamp(w) > s.latest) s.latest = sortStamp(w)
    byUnit.set(d.unit, s)
  }
  const result = new Map<string, DistanceUnit>()
  stats.forEach((byUnit, key) => {
    let best: DistanceUnit | null = null
    let bestStat = { count: -1, latest: '' }
    byUnit.forEach((s, unit) => {
      if (s.count > bestStat.count || (s.count === bestStat.count && s.latest > bestStat.latest)) {
        best = unit
        bestStat = s
      }
    })
    if (best) result.set(key, best)
  })
  return result
}

const groupByActivity = (workouts: TrendsWorkout[]): Map<string, TrendsWorkout[]> => {
  const groups = new Map<string, TrendsWorkout[]>()
  for (const w of workouts) {
    const key = activityKey(w.workout_type)
    if (!key) continue
    const list = groups.get(key)
    if (list) list.push(w)
    else groups.set(key, [w])
  }
  return groups
}

const sumMinutes = (list: TrendsWorkout[]): number =>
  list.reduce((total, w) => total + (Number(w.duration) || 0), 0)

/** Total distance in `unit`, or null when no workout in the list logged one. */
const sumDistance = (list: TrendsWorkout[], unit: DistanceUnit): number | null => {
  let total: number | null = null
  for (const w of list) {
    const d = loggedDistance(w)
    if (d) total = (total ?? 0) + convertDistance(d.value, d.unit, unit)
  }
  return total
}

/** Most-used trimmed spelling; ties go to the first one seen. */
const mostUsedName = (list: TrendsWorkout[]): string => {
  const counts = new Map<string, number>()
  for (const w of list) {
    const name = w.workout_type.trim()
    counts.set(name, (counts.get(name) || 0) + 1)
  }
  let best = ''
  let bestCount = 0
  counts.forEach((count, name) => {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  })
  return best
}

/**
 * Totals for one period, with each activity compared to the previous period
 * (the full previous week or month). Units come from all the given workouts.
 */
export function buildTrends(workouts: TrendsWorkout[], period: Period): PeriodTrends {
  const units = preferredUnits(workouts)
  const previousPeriod = shiftPeriod(period, -1)
  const current = workouts.filter(w => inPeriod(w.date, period))
  const previousGroups = groupByActivity(workouts.filter(w => inPeriod(w.date, previousPeriod)))

  const activities: ActivityTrend[] = []
  groupByActivity(current).forEach((list, key) => {
    const unit = units.get(key) ?? null
    const distance = unit ? sumDistance(list, unit) : null
    const previous = previousGroups.get(key) || []
    activities.push({
      key,
      name: mostUsedName(list),
      minutes: sumMinutes(list),
      sessions: list.length,
      distance,
      unit: distance === null ? null : unit,
      missingDistance: distance === null ? 0 : list.filter(w => !loggedDistance(w)).length,
      previous: {
        sessions: previous.length,
        minutes: sumMinutes(previous),
        distance: unit && distance !== null ? sumDistance(previous, unit) : null
      }
    })
  })
  activities.sort((a, b) => b.minutes - a.minutes || b.sessions - a.sessions || a.name.localeCompare(b.name))

  const feel: FeelCounts = { great: 0, solid: 0, struggled: 0 }
  for (const w of current) {
    if (w.rating === 3) feel.great++
    else if (w.rating === 2) feel.solid++
    else if (w.rating === 1) feel.struggled++
  }

  return { workouts: current.length, minutes: sumMinutes(current), activities, feel }
}
