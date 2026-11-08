/**
 * Seasons (Phase 4): a season is a user-named date range with a required
 * start and end – a sport's season, a training block, any span. It is a lens:
 * every workout dated inside it counts, and workouts are never linked to a
 * season. Overlaps and duplicate names are allowed.
 *
 * Pure and string-based like activityGrid.ts: dates are local calendar dates
 * 'YYYY-MM-DD' and are compared as strings (safe because they are zero-padded,
 * including across Jan 1). Never derive "today" in here: callers pass it in
 * from getLocalDateString(). Weeks run Monday to Sunday.
 */
import { shortDateLabel, weekStartOf } from './activityGrid'

export interface SeasonFields {
  name: string
  start_date: string      // 'YYYY-MM-DD'
  end_date: string        // 'YYYY-MM-DD', inclusive
}

export interface Season extends SeasonFields {
  id: string
  created_at?: string
}

export type SeasonStatus = 'upcoming' | 'current' | 'ended'

/** Same limits as the seasons table's check constraints. */
export const SEASON_NAME_MAX = 50
/** end_date - start_date in days: about 2 years. */
export const SEASON_MAX_DAYS = 731

const DAY_MS = 24 * 60 * 60 * 1000
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

const toMs = (date: string): number | null => {
  const m = DATE_RE.exec(date)
  if (!m) return null
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** A real calendar date in 'YYYY-MM-DD' form (rejects 2026-02-30). */
export function isCalendarDate(value: string | null | undefined): value is string {
  if (!value) return false
  const m = DATE_RE.exec(value)
  if (!m) return false
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return (
    d.getUTCFullYear() === Number(m[1]) &&
    d.getUTCMonth() === Number(m[2]) - 1 &&
    d.getUTCDate() === Number(m[3])
  )
}

/** Days from `from` to `to` (to - from); 0 for the same day. Both must be valid dates. */
export function daysBetween(from: string, to: string): number {
  const a = toMs(from)
  const b = toMs(to)
  if (a === null || b === null) return NaN
  return Math.round((b - a) / DAY_MS)
}

/** Trim, turn control characters and runs of whitespace into single spaces. No HTML escaping: React escapes on render. */
export function cleanSeasonName(name: string | null | undefined): string {
  return (name || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Error message for the form, or null when the season can be saved. */
export function validateSeason(fields: SeasonFields): string | null {
  const name = cleanSeasonName(fields.name)
  if (!name) return 'Give the season a name.'
  if (name.length > SEASON_NAME_MAX) return `Keep the name to ${SEASON_NAME_MAX} characters or fewer.`
  if (!isCalendarDate(fields.start_date)) return 'Pick a start date.'
  if (!isCalendarDate(fields.end_date)) return 'Pick an end date.'
  if (fields.end_date < fields.start_date) return 'The end date must be on or after the start date.'
  if (daysBetween(fields.start_date, fields.end_date) > SEASON_MAX_DAYS) return 'A season can be at most 2 years long.'
  return null
}

export function seasonStatus(season: SeasonFields, today: string): SeasonStatus {
  if (today < season.start_date) return 'upcoming'
  if (today > season.end_date) return 'ended'
  return 'current'
}

export const inSeason = (date: string, season: SeasonFields): boolean =>
  DATE_RE.test(date) && date >= season.start_date && date <= season.end_date

export const seasonsOverlap = (a: SeasonFields, b: SeasonFields): boolean =>
  a.start_date <= b.end_date && b.start_date <= a.end_date

/** '2026' within one year, '2025–26' across a year, '1999–2000' across a century. */
export function seasonYears(season: SeasonFields): string {
  const startYear = season.start_date.slice(0, 4)
  const endYear = season.end_date.slice(0, 4)
  if (startYear === endYear) return startYear
  const sameCentury = startYear.slice(0, 2) === endYear.slice(0, 2)
  return `${startYear}–${sameCentury ? endYear.slice(2) : endYear}`
}

/**
 * Display label, computed from the dates and never stored: 'Winter 2025–26',
 * 'Spring 2026'. Names that already carry the year ('XC 2026',
 * 'HS Swim 2026–27', 'Swim 25-26') are shown as typed.
 */
export function seasonLabel(season: SeasonFields): string {
  const name = cleanSeasonName(season.name)
  const startYear = season.start_date.slice(0, 4)
  const endYear = season.end_date.slice(0, 4)
  const shortSpan = new RegExp(`${startYear.slice(2)}\\s*[-–/]\\s*${endYear.slice(2)}`)
  const hasYear =
    name.includes(startYear) ||
    name.includes(endYear) ||
    (startYear !== endYear && shortSpan.test(name))
  return hasYear ? name : `${name} ${seasonYears(season)}`
}

/** Full dates: 'Oct 1, 2025 – Feb 28, 2026'. */
export function seasonDateRange(season: SeasonFields): string {
  const start = `${shortDateLabel(season.start_date)}, ${season.start_date.slice(0, 4)}`
  const end = `${shortDateLabel(season.end_date)}, ${season.end_date.slice(0, 4)}`
  return `${start} – ${end}`
}

/** Monday-based week number within the season: the week containing the start date is Week 1. Label only. */
export function weekNumber(seasonStart: string, date: string): number {
  return Math.floor(daysBetween(weekStartOf(seasonStart), weekStartOf(date)) / 7) + 1
}

/** Number of Monday-based weeks the season touches. */
export const seasonWeeks = (season: SeasonFields): number => weekNumber(season.start_date, season.end_date)

/**
 * Another season with the same name (trimmed, case-insensitive) and
 * overlapping dates, for the soft "Save anyway?" warning; null if none.
 * Pass the season being edited as `excludeId`.
 */
export function findSameNameOverlap<T extends Season>(fields: SeasonFields, seasons: T[], excludeId?: string): T | null {
  const key = cleanSeasonName(fields.name).toLowerCase()
  if (!key) return null
  return (
    seasons.find(
      s => s.id !== excludeId && cleanSeasonName(s.name).toLowerCase() === key && seasonsOverlap(s, fields)
    ) ?? null
  )
}

/**
 * The season Trends opens on: the last one viewed if it still exists, else the
 * one that started most recently, else (none started yet) the next to start.
 */
export function defaultSeason<T extends Season>(seasons: T[], today: string, lastViewedId?: string | null): T | null {
  if (seasons.length === 0) return null
  const lastViewed = lastViewedId ? seasons.find(s => s.id === lastViewedId) : undefined
  if (lastViewed) return lastViewed
  const started = seasons.filter(s => s.start_date <= today)
  if (started.length > 0) {
    return started.reduce((best, s) => (s.start_date > best.start_date ? s : best))
  }
  return seasons.reduce((best, s) => (s.start_date < best.start_date ? s : best))
}

/** Oldest start first; ties by end date then name, so ‹ › order is stable. */
export function seasonsByStart<T extends Season>(seasons: T[]): T[] {
  return [...seasons].sort(
    (a, b) =>
      a.start_date.localeCompare(b.start_date) ||
      a.end_date.localeCompare(b.end_date) ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id)
  )
}
