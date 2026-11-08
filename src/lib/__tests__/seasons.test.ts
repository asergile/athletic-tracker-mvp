import { describe, it, expect } from 'vitest'
import {
  cleanSeasonName,
  daysBetween,
  defaultSeason,
  findSameNameOverlap,
  inSeason,
  isCalendarDate,
  Season,
  seasonDateRange,
  seasonLabel,
  seasonStatus,
  seasonsByStart,
  seasonsOverlap,
  seasonWeeks,
  seasonYears,
  validateSeason,
  weekNumber
} from '../seasons'

// 2026-11-04 is a Wednesday.
const TODAY = '2026-11-04'

const s = (over: Partial<Season>): Season => ({
  id: 'a',
  name: 'Winter',
  start_date: '2025-10-01',
  end_date: '2026-02-28',
  ...over
})

describe('dates', () => {
  it('accepts only real YYYY-MM-DD calendar dates', () => {
    expect(isCalendarDate('2026-11-04')).toBe(true)
    expect(isCalendarDate('2028-02-29')).toBe(true)
    expect(isCalendarDate('2026-02-29')).toBe(false)
    expect(isCalendarDate('2026-02-30')).toBe(false)
    expect(isCalendarDate('2026-11-4')).toBe(false)
    expect(isCalendarDate('')).toBe(false)
    expect(isCalendarDate(null)).toBe(false)
  })

  it('counts days across month, year and leap-day boundaries', () => {
    expect(daysBetween('2026-11-04', '2026-11-04')).toBe(0)
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1)
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2)
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365)
  })
})

describe('validateSeason', () => {
  const ok = { name: 'Swim season', start_date: '2026-11-02', end_date: '2027-02-20' }

  it('accepts a normal season, including one that crosses Jan 1', () => {
    expect(validateSeason(ok)).toBeNull()
  })

  it('accepts a one-day season (end on start)', () => {
    expect(validateSeason({ ...ok, end_date: ok.start_date })).toBeNull()
  })

  it('requires a name of at most 50 characters after cleaning', () => {
    expect(validateSeason({ ...ok, name: '   ' })).toMatch(/name/)
    expect(validateSeason({ ...ok, name: 'x'.repeat(50) })).toBeNull()
    expect(validateSeason({ ...ok, name: 'x'.repeat(51) })).toMatch(/50/)
  })

  it('requires real start and end dates', () => {
    expect(validateSeason({ ...ok, start_date: '' })).toMatch(/start/)
    expect(validateSeason({ ...ok, end_date: '2027-02-30' })).toMatch(/end/)
  })

  it('rejects an end before the start', () => {
    expect(validateSeason({ ...ok, end_date: '2026-11-01' })).toMatch(/on or after/)
  })

  it('allows up to 731 days and rejects longer (about 2 years)', () => {
    expect(validateSeason({ ...ok, start_date: '2026-01-01', end_date: '2028-01-01' })).toBeNull() // 730
    expect(validateSeason({ ...ok, start_date: '2027-03-01', end_date: '2029-03-01' })).toBeNull() // 731 (leap)
    expect(validateSeason({ ...ok, start_date: '2026-01-01', end_date: '2028-01-03' })).toMatch(/2 years/) // 732
  })
})

describe('names', () => {
  it('trims and collapses whitespace without HTML-escaping', () => {
    expect(cleanSeasonName("  Women's \n  XC  ")).toBe("Women's XC")
    expect(cleanSeasonName('Oct/Feb <block>')).toBe('Oct/Feb <block>')
    expect(cleanSeasonName(undefined)).toBe('')
  })
})

describe('status and membership', () => {
  const season = s({ start_date: '2026-11-04', end_date: '2026-11-30' })

  it('is current from the start date through the end date, inclusive', () => {
    expect(seasonStatus(season, '2026-11-03')).toBe('upcoming')
    expect(seasonStatus(season, TODAY)).toBe('current')
    expect(seasonStatus(season, '2026-11-30')).toBe('current')
    expect(seasonStatus(season, '2026-12-01')).toBe('ended')
  })

  it('includes dates across Jan 1 by string comparison', () => {
    const winter = s({})
    expect(inSeason('2025-12-31', winter)).toBe(true)
    expect(inSeason('2026-01-01', winter)).toBe(true)
    expect(inSeason('2026-02-28', winter)).toBe(true)
    expect(inSeason('2026-03-01', winter)).toBe(false)
    expect(inSeason('2025-09-30', winter)).toBe(false)
    expect(inSeason('bad', winter)).toBe(false)
  })

  it('detects overlap, including seasons that share one day', () => {
    const xc = s({ start_date: '2026-08-10', end_date: '2026-11-07' })
    const swim = s({ start_date: '2026-11-02', end_date: '2027-02-20' })
    const spring = s({ start_date: '2027-02-21', end_date: '2027-05-31' })
    expect(seasonsOverlap(xc, swim)).toBe(true)
    expect(seasonsOverlap(swim, spring)).toBe(false)
    expect(seasonsOverlap(swim, s({ start_date: '2027-02-20', end_date: '2027-03-01' }))).toBe(true)
  })
})

describe('labels', () => {
  it('shows one year within a year and a short span across years', () => {
    expect(seasonYears(s({ start_date: '2026-03-01', end_date: '2026-05-31' }))).toBe('2026')
    expect(seasonYears(s({}))).toBe('2025–26')
    expect(seasonYears(s({ start_date: '1999-10-01', end_date: '2000-02-28' }))).toBe('1999–2000')
  })

  it('adds the years to the name unless the name already has them', () => {
    expect(seasonLabel(s({}))).toBe('Winter 2025–26')
    expect(seasonLabel(s({ name: 'Spring', start_date: '2026-03-01', end_date: '2026-05-31' }))).toBe('Spring 2026')
    expect(seasonLabel(s({ name: 'XC 2026', start_date: '2026-08-10', end_date: '2026-11-07' }))).toBe('XC 2026')
    expect(seasonLabel(s({ name: 'HS Swim 2026–27', start_date: '2026-11-02', end_date: '2027-02-20' }))).toBe('HS Swim 2026–27')
    expect(seasonLabel(s({ name: 'Swim 25-26' }))).toBe('Swim 25-26')
    expect(seasonLabel(s({ name: 'Taper block', start_date: '2026-02-01', end_date: '2026-02-20' }))).toBe('Taper block 2026')
  })

  it('formats full dates', () => {
    expect(seasonDateRange(s({}))).toBe('Oct 1, 2025 – Feb 28, 2026')
  })
})

describe('weekNumber', () => {
  // 2026-11-04 is a Wednesday; its Monday is 2026-11-02.
  it('makes the Monday week containing the start date Week 1', () => {
    expect(weekNumber('2026-11-04', '2026-11-04')).toBe(1)
    expect(weekNumber('2026-11-04', '2026-11-02')).toBe(1) // same Monday week, before the start
    expect(weekNumber('2026-11-04', '2026-11-08')).toBe(1) // Sunday
    expect(weekNumber('2026-11-04', '2026-11-09')).toBe(2) // next Monday
  })

  it('counts weeks across Jan 1', () => {
    // 2025-10-01 is a Wednesday (week of Sep 29); 2026-02-28 is a Saturday (week of Feb 23).
    expect(weekNumber('2025-10-01', '2026-02-28')).toBe(22)
    expect(seasonWeeks(s({}))).toBe(22)
  })

  it('treats a season that starts on a Sunday as a one-day Week 1', () => {
    // 2026-11-08 is a Sunday.
    expect(weekNumber('2026-11-08', '2026-11-08')).toBe(1)
    expect(weekNumber('2026-11-08', '2026-11-09')).toBe(2)
  })
})

describe('findSameNameOverlap', () => {
  const seasons: Season[] = [
    s({ id: 'w1', name: 'Winter', start_date: '2025-10-01', end_date: '2026-02-28' }),
    s({ id: 'w2', name: 'Winter', start_date: '2026-10-01', end_date: '2027-02-28' }),
    s({ id: 'xc', name: 'XC', start_date: '2025-08-10', end_date: '2025-11-07' })
  ]

  it('finds a season with the same name (case- and space-insensitive) and overlapping dates', () => {
    const found = findSameNameOverlap({ name: ' winter ', start_date: '2026-01-01', end_date: '2026-03-31' }, seasons)
    expect(found?.id).toBe('w1')
  })

  it('ignores same name with different dates, and different names with overlapping dates', () => {
    expect(findSameNameOverlap({ name: 'Winter', start_date: '2026-03-01', end_date: '2026-09-30' }, seasons)).toBeNull()
    expect(findSameNameOverlap({ name: 'Swim', start_date: '2025-10-01', end_date: '2026-02-28' }, seasons)).toBeNull()
  })

  it('ignores the season being edited', () => {
    expect(findSameNameOverlap(seasons[0], seasons, 'w1')).toBeNull()
  })
})

describe('defaultSeason (Trends picker)', () => {
  const past = s({ id: 'past', start_date: '2025-10-01', end_date: '2026-02-28' })
  const current = s({ id: 'cur', start_date: '2026-08-10', end_date: '2026-11-30' })
  const startedLater = s({ id: 'later', start_date: '2026-11-02', end_date: '2027-02-20' })
  const upcoming = s({ id: 'up', start_date: '2026-12-01', end_date: '2027-03-01' })
  const upcomingSooner = s({ id: 'soon', start_date: '2026-11-20', end_date: '2027-01-01' })

  it('returns null with no seasons', () => {
    expect(defaultSeason([], TODAY)).toBeNull()
  })

  it('prefers the last viewed season when it still exists', () => {
    expect(defaultSeason([past, current, upcoming], TODAY, 'past')?.id).toBe('past')
    expect(defaultSeason([past, current, upcoming], TODAY, 'deleted')?.id).toBe('cur')
  })

  it('otherwise picks the most recently started season, ignoring upcoming ones', () => {
    expect(defaultSeason([past, current, startedLater, upcoming], TODAY)?.id).toBe('later')
    expect(defaultSeason([past, upcoming], TODAY)?.id).toBe('past')
  })

  it('picks the next to start when none has started', () => {
    expect(defaultSeason([upcoming, upcomingSooner], TODAY)?.id).toBe('soon')
  })
})

describe('seasonsByStart', () => {
  it('orders oldest start first without changing the input', () => {
    const list = [
      s({ id: 'b', start_date: '2026-11-02', end_date: '2027-02-20' }),
      s({ id: 'a', start_date: '2025-10-01' }),
      s({ id: 'c', start_date: '2026-11-02', end_date: '2026-11-30' }) // same start, ends sooner
    ]
    expect(seasonsByStart(list).map(x => x.id)).toEqual(['a', 'c', 'b'])
    expect(list.map(x => x.id)).toEqual(['b', 'a', 'c'])
  })
})
