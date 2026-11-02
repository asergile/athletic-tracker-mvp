import { describe, it, expect } from 'vitest'
import {
  activityKey,
  buildTrends,
  convertDistance,
  formatDistance,
  inPeriod,
  normalizeUnit,
  periodFor,
  periodLabel,
  preferredUnits,
  shiftPeriod,
  TrendsWorkout
} from '../trends'

// 2026-11-04 is a Wednesday; its week is Nov 2 - Nov 8.
const TODAY = '2026-11-04'

const w = (over: Partial<TrendsWorkout>): TrendsWorkout => ({
  workout_type: 'Swimming',
  date: TODAY,
  duration: 60,
  rating: 2,
  ...over
})

describe('periods', () => {
  it('builds Monday-Sunday weeks, including weeks that span two months', () => {
    expect(periodFor('week', TODAY)).toEqual({ kind: 'week', start: '2026-11-02', end: '2026-11-08' })
    expect(periodFor('week', '2026-11-01')).toEqual({ kind: 'week', start: '2026-10-26', end: '2026-11-01' })
    expect(periodLabel(periodFor('week', '2026-11-01'))).toBe('Oct 26 – Nov 1')
  })

  it('builds calendar months, including leap-year February', () => {
    expect(periodFor('month', TODAY)).toEqual({ kind: 'month', start: '2026-11-01', end: '2026-11-30' })
    expect(periodFor('month', '2028-02-10').end).toBe('2028-02-29')
    expect(periodFor('month', '2026-02-10').end).toBe('2026-02-28')
    expect(periodLabel(periodFor('month', TODAY))).toBe('November 2026')
  })

  it('shifts weeks and months, across year boundaries', () => {
    expect(shiftPeriod(periodFor('week', TODAY), -1).start).toBe('2026-10-26')
    expect(shiftPeriod(periodFor('week', '2027-01-01'), 1).start).toBe('2027-01-04')
    expect(shiftPeriod(periodFor('month', '2026-01-15'), -1)).toEqual({ kind: 'month', start: '2025-12-01', end: '2025-12-31' })
  })

  it('includes both ends and rejects bad dates', () => {
    const week = periodFor('week', TODAY)
    expect(inPeriod('2026-11-02', week)).toBe(true)
    expect(inPeriod('2026-11-08', week)).toBe(true)
    expect(inPeriod('2026-11-09', week)).toBe(false)
    expect(inPeriod('2026-11-0', week)).toBe(false)
  })
})

describe('units', () => {
  it('normalizes stored and short unit names', () => {
    expect(normalizeUnit('yards')).toBe('yards')
    expect(normalizeUnit(' KM ')).toBe('kilometers')
    expect(normalizeUnit('mi')).toBe('miles')
    expect(normalizeUnit('furlongs')).toBeNull()
    expect(normalizeUnit(null)).toBeNull()
  })

  it('converts through meters', () => {
    expect(convertDistance(1, 'miles', 'kilometers')).toBeCloseTo(1.609344)
    expect(convertDistance(100, 'meters', 'yards')).toBeCloseTo(109.361, 2)
    expect(convertDistance(5, 'yards', 'yards')).toBe(5)
  })

  it('formats yds / m as whole numbers and mi / km with one decimal', () => {
    expect(formatDistance(14800, 'yards')).toBe('14,800 yds')
    expect(formatDistance(1093.6, 'meters')).toBe('1,094 m')
    expect(formatDistance(9.54, 'miles')).toBe('9.5 mi')
    expect(formatDistance(12.01, 'kilometers')).toBe('12 km')
  })
})

describe('activityKey and preferredUnits', () => {
  it('groups names by trimmed lower case', () => {
    expect(activityKey(' Cycling')).toBe('cycling')
    expect(activityKey('OTF')).toBe(activityKey('otf'))
    expect(activityKey('swim')).not.toBe(activityKey('Swimming'))
  })

  it('picks the most-used unit per activity; ties go to the most recent', () => {
    const units = preferredUnits([
      w({ distance: 2000, distance_unit: 'yards', date: '2026-10-01' }),
      w({ distance: 2000, distance_unit: 'yards', date: '2026-10-02' }),
      w({ distance: 1500, distance_unit: 'meters', date: '2026-11-03' }),
      w({ workout_type: 'Walking', distance: 3, distance_unit: 'miles', date: '2026-10-01' }),
      w({ workout_type: 'walking', distance: 5, distance_unit: 'kilometers', date: '2026-10-05' }),
      w({ workout_type: 'Dryland' })
    ])
    expect(units.get('swimming')).toBe('yards')
    expect(units.get('walking')).toBe('kilometers')
    expect(units.has('dryland')).toBe(false)
  })
})

describe('buildTrends', () => {
  const week = periodFor('week', TODAY)

  it('totals one card per activity, sorted by time, with mixed units converted', () => {
    const trends = buildTrends([
      w({ distance: 3000, distance_unit: 'yards', duration: 90, date: '2026-11-03' }),
      w({ workout_type: 'swimming ', distance: 1000, distance_unit: 'meters', duration: 60, date: '2026-11-02' }),
      w({ workout_type: 'Running', distance: 5, distance_unit: 'kilometers', duration: 30, date: '2026-11-03' }),
      w({ workout_type: 'Running', distance: 3, distance_unit: 'miles', duration: 25, date: '2026-11-04' }),
      w({ workout_type: 'Running', distance: 4, distance_unit: 'miles', duration: 35, date: '2026-10-20' }),
      w({ workout_type: 'Dryland', duration: 100, date: '2026-11-04' }),
      w({ workout_type: 'Dryland', duration: 100, date: '2026-11-09' })
    ], week)

    expect(trends.workouts).toBe(5)
    expect(trends.minutes).toBe(305)
    expect(trends.activities.map(a => a.key)).toEqual(['swimming', 'dryland', 'running'])

    const swim = trends.activities[0]
    expect(swim.name).toBe('Swimming')
    expect(swim.unit).toBe('yards')
    expect(swim.distance).toBeCloseTo(3000 + 1093.61, 1)
    expect(swim.sessions).toBe(2)
    expect(swim.missingDistance).toBe(0)

    const run = trends.activities[2]
    expect(run.unit).toBe('miles')
    expect(run.distance).toBeCloseTo(3 + 5 / 1.609344, 5)

    const dry = trends.activities[1]
    expect(dry.distance).toBeNull()
    expect(dry.unit).toBeNull()
    expect(dry.minutes).toBe(100)
  })

  it('counts sessions without distance only when the headline is distance', () => {
    const trends = buildTrends([
      w({ distance: 2000, distance_unit: 'yards', duration: 60 }),
      w({ duration: 45 }),
      w({ workout_type: 'Dryland', duration: 30 })
    ], week)
    const swim = trends.activities.find(a => a.key === 'swimming')!
    expect(swim.distance).toBe(2000)
    expect(swim.sessions).toBe(2)
    expect(swim.minutes).toBe(105)
    expect(swim.missingDistance).toBe(1)
    expect(trends.activities.find(a => a.key === 'dryland')!.missingDistance).toBe(0)
  })

  it('uses time as the headline when no session in the period logged a distance', () => {
    const trends = buildTrends([
      w({ duration: 45 }),
      w({ distance: 2000, distance_unit: 'yards', date: '2026-10-28' })
    ], week)
    const swim = trends.activities[0]
    expect(swim.distance).toBeNull()
    expect(swim.missingDistance).toBe(0)
    expect(swim.previous.distance).toBeNull()
    expect(swim.previous.minutes).toBe(60)
  })

  it('compares to the full previous period in the same unit', () => {
    const trends = buildTrends([
      w({ distance: 2000, distance_unit: 'yards' }),
      w({ distance: 1000, distance_unit: 'meters', duration: 50, date: '2026-10-26' }),
      w({ duration: 40, date: '2026-11-01' }),
      w({ workout_type: 'Running', distance: 3, distance_unit: 'miles', duration: 30 }),
      w({ workout_type: 'Running', duration: 30, date: '2026-10-27' })
    ], week)
    const swim = trends.activities.find(a => a.key === 'swimming')!
    expect(swim.previous.sessions).toBe(2)
    expect(swim.previous.minutes).toBe(90)
    expect(swim.previous.distance).toBeCloseTo(1093.61, 1)

    const run = trends.activities.find(a => a.key === 'running')!
    expect(run.previous.sessions).toBe(1)
    expect(run.previous.distance).toBeNull() // sessions last week, none with distance
  })

  it('reports no previous sessions when the activity is new this period', () => {
    const swim = buildTrends([w({ distance: 2000, distance_unit: 'yards' })], week).activities[0]
    expect(swim.previous).toEqual({ sessions: 0, minutes: 0, distance: null })
  })

  it('counts feel and ignores invalid ratings', () => {
    const trends = buildTrends([
      w({ rating: 3 }), w({ rating: 3 }), w({ rating: 2 }), w({ rating: 1 }), w({ rating: 0 }),
      w({ rating: 3, date: '2026-10-30' })
    ], week)
    expect(trends.feel).toEqual({ great: 2, solid: 1, struggled: 1 })
    expect(trends.workouts).toBe(5)
  })

  it('returns an empty summary for a period with no workouts', () => {
    const trends = buildTrends([w({ date: '2026-10-01' })], week)
    expect(trends).toEqual({ workouts: 0, minutes: 0, activities: [], feel: { great: 0, solid: 0, struggled: 0 } })
  })
})
