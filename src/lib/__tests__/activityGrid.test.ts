import { describe, it, expect } from 'vitest'
import { buildActivityGrid, GridWorkout } from '../activityGrid'

// 2026-11-04 is a Wednesday; its week starts Monday 2026-11-02.
const TODAY = '2026-11-04'

const findDay = (weeks: ReturnType<typeof buildActivityGrid>, date: string) =>
  weeks.flatMap(w => w.days).find(d => d.date === date)

describe('buildActivityGrid', () => {
  it('builds Monday-first weeks with 7 days each', () => {
    const weeks = buildActivityGrid([], TODAY)
    expect(weeks.every(w => w.days.length === 7)).toBe(true)
    expect(weeks.every(w => new Date(w.start + 'T00:00:00Z').getUTCDay() === 1)).toBe(true)
  })

  it('with no workouts shows minPastWeeks (incl. current) plus 3 future weeks', () => {
    const weeks = buildActivityGrid([], TODAY)
    expect(weeks.length).toBe(26 + 3)
    expect(weeks[25].start).toBe('2026-11-02')
    expect(weeks[weeks.length - 1].start).toBe('2026-11-23')
  })

  it('marks today and future days', () => {
    const weeks = buildActivityGrid([], TODAY)
    expect(findDay(weeks, TODAY)?.isToday).toBe(true)
    expect(findDay(weeks, '2026-11-03')?.isFuture).toBe(false)
    expect(findDay(weeks, '2026-11-05')?.isFuture).toBe(true)
    expect(weeks.flatMap(w => w.days).filter(d => d.isToday).length).toBe(1)
  })

  it('handles a Sunday as today (last day of its week)', () => {
    const weeks = buildActivityGrid([], '2026-11-01')
    const current = weeks[25]
    expect(current.start).toBe('2026-10-26')
    expect(current.days[6]).toMatchObject({ date: '2026-11-01', isToday: true })
  })

  it('records one rating, and the first two of three in logged order', () => {
    const workouts: GridWorkout[] = [
      { date: '2026-11-03', rating: 3, created_at: '2026-11-03T12:00:00Z' },
      { date: '2026-11-02', rating: 2, created_at: '2026-11-02T20:00:00Z' },
      { date: '2026-11-02', rating: 1, created_at: '2026-11-02T09:00:00Z' },
      { date: '2026-11-02', rating: 3, created_at: '2026-11-02T22:00:00Z' }
    ]
    const weeks = buildActivityGrid(workouts, TODAY)
    expect(findDay(weeks, '2026-11-03')?.ratings).toEqual([3])
    expect(findDay(weeks, '2026-11-02')?.ratings).toEqual([1, 2])
    expect(findDay(weeks, '2026-11-01')?.ratings).toEqual([])
  })

  it('ignores invalid ratings and malformed dates', () => {
    const workouts: GridWorkout[] = [
      { date: '2026-11-03', rating: 0 },
      { date: 'not-a-date', rating: 3 },
      { date: '2026-11-03', rating: 2 }
    ]
    const weeks = buildActivityGrid(workouts, TODAY)
    expect(findDay(weeks, '2026-11-03')?.ratings).toEqual([2])
  })

  it('extends back to the oldest workout week, across a year boundary', () => {
    const weeks = buildActivityGrid([{ date: '2025-12-31', rating: 3 }], TODAY)
    expect(weeks[0].start).toBe('2025-12-29')
    expect(findDay(weeks, '2025-12-31')?.ratings).toEqual([3])
  })

  it('caps how far back the grid goes', () => {
    const weeks = buildActivityGrid([{ date: '1990-01-01', rating: 3 }], TODAY)
    expect(weeks.length).toBe(156 + 1 + 3)
  })

  it('labels the week containing the 1st of each month', () => {
    const weeks = buildActivityGrid([], TODAY)
    expect(weeks.find(w => w.start === '2026-10-26')?.monthLabel).toBe('Nov')
    expect(weeks.find(w => w.start === '2026-11-02')?.monthLabel).toBeNull()
    expect(weeks.find(w => w.start === '2026-09-28')?.monthLabel).toBe('Oct')
  })
})
