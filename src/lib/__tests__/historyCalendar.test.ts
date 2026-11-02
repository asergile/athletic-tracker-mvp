import { describe, it, expect } from 'vitest'
import {
  buildActivityGrid,
  buildMonthCalendar,
  buildWeek,
  groupRatingsByDate,
  monthTitle,
  shiftDays,
  shiftMonth,
  shortDateLabel,
  summarizeMonth,
  weekStartOf,
  GridWorkout
} from '../activityGrid'
import { feelStyle, FEEL_HEX } from '../feelColors'
import { parseDateParam } from '../utils'

// 2026-11-04 is a Wednesday.
const TODAY = '2026-11-04'

describe('groupRatingsByDate', () => {
  it('keeps the first two ratings per day in logged order and skips bad rows', () => {
    const workouts: GridWorkout[] = [
      { date: '2026-11-02', rating: 2, created_at: '2026-11-02T20:00:00Z' },
      { date: '2026-11-02', rating: 1, created_at: '2026-11-02T09:00:00Z' },
      { date: '2026-11-02', rating: 3, created_at: '2026-11-02T22:00:00Z' },
      { date: '2026-11-03', rating: 0 },
      { date: 'bad', rating: 3 }
    ]
    const byDate = groupRatingsByDate(workouts)
    expect(byDate.get('2026-11-02')).toEqual([1, 2])
    expect(byDate.has('2026-11-03')).toBe(false)
    expect(byDate.size).toBe(1)
  })

  it('gives the Log grid the same ratings as before the refactor', () => {
    const workouts: GridWorkout[] = [{ date: '2026-11-03', rating: 3 }]
    const day = buildActivityGrid(workouts, TODAY)
      .reduce<{ date: string; ratings: number[] }[]>((all, w) => all.concat(w.days), [])
      .find(d => d.date === '2026-11-03')
    expect(day?.ratings).toEqual([3])
  })
})

describe('month helpers', () => {
  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
    expect(shiftMonth('2026-11', -13)).toBe('2025-10')
  })

  it('formats month titles and short dates', () => {
    expect(monthTitle('2026-10')).toBe('October 2026')
    expect(shortDateLabel('2026-10-31')).toBe('Oct 31')
    expect(shortDateLabel('2026-03-05')).toBe('Mar 5')
  })

  it('finds Monday and shifts days across month and year boundaries', () => {
    expect(weekStartOf('2026-11-04')).toBe('2026-11-02')
    expect(weekStartOf('2026-11-01')).toBe('2026-10-26') // Sunday belongs to the week before
    expect(weekStartOf('2026-11-02')).toBe('2026-11-02')
    expect(shiftDays('2025-12-29', 7)).toBe('2026-01-05')
    expect(shiftDays('2026-03-02', -7)).toBe('2026-02-23')
  })
})

describe('buildMonthCalendar', () => {
  const byDate = groupRatingsByDate([
    { date: '2026-10-05', rating: 3, created_at: '2026-10-05T08:00:00Z' },
    { date: '2026-10-05', rating: 1, created_at: '2026-10-05T18:00:00Z' },
    { date: '2026-10-31', rating: 2 }
  ])

  it('lays out a month Monday-first with blanks outside the month', () => {
    // October 2026 starts on a Thursday and ends on a Saturday.
    const weeks = buildMonthCalendar('2026-10', byDate, TODAY)
    expect(weeks.length).toBe(5)
    expect(weeks.every(w => w.length === 7)).toBe(true)
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null])
    expect(weeks[0][3]?.date).toBe('2026-10-01')
    expect(weeks[4][5]?.date).toBe('2026-10-31')
    expect(weeks[4][6]).toBeNull()
    const days = weeks.reduce<(typeof weeks)[number]>((all, w) => all.concat(w), []).filter(Boolean)
    expect(days.length).toBe(31)
  })

  it('handles a month that starts on a Sunday', () => {
    // November 2026 starts on a Sunday: the 1st is the last cell of week one.
    const weeks = buildMonthCalendar('2026-11', byDate, TODAY)
    expect(weeks[0].slice(0, 6).every(d => d === null)).toBe(true)
    expect(weeks[0][6]?.date).toBe('2026-11-01')
    expect(weeks.length).toBe(6)
  })

  it('handles February in a leap year', () => {
    const weeks = buildMonthCalendar('2028-02', new Map(), '2028-03-01')
    const days = weeks.reduce<(typeof weeks)[number]>((all, w) => all.concat(w), []).filter(Boolean)
    expect(days.length).toBe(29)
  })

  it('carries ratings, today and future flags', () => {
    const weeks = buildMonthCalendar('2026-11', byDate, TODAY)
    const all = weeks.reduce<(typeof weeks)[number]>((acc, w) => acc.concat(w), [])
    expect(all.find(d => d?.date === TODAY)?.isToday).toBe(true)
    expect(all.find(d => d?.date === '2026-11-05')?.isFuture).toBe(true)
    expect(all.find(d => d?.date === '2026-11-03')?.isFuture).toBe(false)
    const oct = buildMonthCalendar('2026-10', byDate, TODAY)
    const oct5 = oct.reduce<(typeof oct)[number]>((acc, w) => acc.concat(w), []).find(d => d?.date === '2026-10-05')
    expect(oct5?.ratings).toEqual([3, 1])
    expect(oct5?.dayOfMonth).toBe(5)
  })
})

describe('buildWeek', () => {
  it('returns 7 days from Monday, spanning months', () => {
    const days = buildWeek('2026-10-26', new Map(), TODAY)
    expect(days.map(d => d.date)).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'
    ])
    expect(days[6].month).toBe('2026-11')
  })

  it('normalizes a non-Monday start to its Monday', () => {
    expect(buildWeek('2026-11-04', new Map(), TODAY)[0].date).toBe('2026-11-02')
  })
})

describe('summarizeMonth', () => {
  it('counts distinct days, workouts and minutes for that month only', () => {
    const summary = summarizeMonth(
      [
        { date: '2026-10-05', duration: 60 },
        { date: '2026-10-05', duration: 30 },
        { date: '2026-10-31', duration: 45 },
        { date: '2026-11-01', duration: 90 },
        { date: '2026-09-30', duration: 90 }
      ],
      '2026-10'
    )
    expect(summary).toEqual({ days: 2, workouts: 3, minutes: 135 })
  })

  it('returns zeros for an empty month', () => {
    expect(summarizeMonth([], '2026-10')).toEqual({ days: 0, workouts: 0, minutes: 0 })
  })
})

describe('feelStyle', () => {
  it('returns one color, a diagonal split, or nothing', () => {
    expect(feelStyle([3])).toEqual({ backgroundColor: FEEL_HEX[3] })
    expect(feelStyle([3, 1])).toEqual({
      background: `linear-gradient(135deg, ${FEEL_HEX[3]} 50%, ${FEEL_HEX[1]} 50%)`
    })
    expect(feelStyle([])).toBeUndefined()
  })
})

describe('parseDateParam', () => {
  it('accepts today and past dates', () => {
    expect(parseDateParam('2026-11-04', TODAY)).toBe('2026-11-04')
    expect(parseDateParam('2025-12-31', TODAY)).toBe('2025-12-31')
  })

  it('rejects future dates', () => {
    expect(parseDateParam('2026-11-05', TODAY)).toBeNull()
  })

  it('rejects malformed and impossible dates', () => {
    expect(parseDateParam(null, TODAY)).toBeNull()
    expect(parseDateParam('', TODAY)).toBeNull()
    expect(parseDateParam('2026-2-3', TODAY)).toBeNull()
    expect(parseDateParam('2026-02-30', TODAY)).toBeNull()
    expect(parseDateParam('2026-13-01', TODAY)).toBeNull()
    expect(parseDateParam('2026-10-01T00:00', TODAY)).toBeNull()
    expect(parseDateParam('<script>', TODAY)).toBeNull()
  })
})
