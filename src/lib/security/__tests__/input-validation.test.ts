import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeDate,
  validateWorkoutData,
  validateDisplayName,
  validateDuration,
  validateRating,
} from '../input-validation'
import { getLocalDateString } from '../../utils'

describe('validateWorkoutData - date fallback', () => {
  // The actual date-math correctness (local vs. UTC calendar date) is fully
  // covered directly against getLocalDateString() in
  // src/lib/__tests__/utils.test.ts, including the specific regression this
  // project has shipped twice (a UTC-based computation disagreeing with the
  // local calendar date). No need to re-prove that here, and - as it turns
  // out - mocking Date.prototype reliably through this particular import
  // chain is itself flaky (see git history for this file), so this test
  // deliberately avoids mocking entirely.
  //
  // What's specific to THIS function is that it must delegate to the shared
  // helper rather than reintroducing its own separate fallback - which is
  // exactly how this bug ended up duplicated (and silently wrong) across two
  // different files in the first place. A plain equality check against the
  // real, unmocked helper proves that delegation without needing to control
  // "what time it is" at all.
  it('falls back to getLocalDateString() when no date is given', () => {
    const expected = getLocalDateString()

    const result = validateWorkoutData({
      workout_type: 'Running',
      duration: 30,
      rating: 2,
      // date intentionally omitted
    })

    expect(result.date).toBe(expected)
  })

  it('uses the explicitly provided date when one is given', () => {
    const result = validateWorkoutData({
      workout_type: 'Running',
      duration: 30,
      rating: 2,
      date: '2026-02-01',
    })

    expect(result.date).toBe('2026-02-01')
  })
})

describe('sanitizeDate', () => {
  it('passes through a valid YYYY-MM-DD string unchanged', () => {
    expect(sanitizeDate('2026-06-01', { required: false })).toBe('2026-06-01')
  })

  it('returns null when not required and no input is given', () => {
    expect(sanitizeDate(undefined, { required: false })).toBeNull()
  })

  it('throws when required and no input is given', () => {
    expect(() => sanitizeDate(undefined, { required: true })).toThrow('Date is required')
  })

  it('rejects dates after maxDate', () => {
    expect(() =>
      sanitizeDate('2099-01-01', { required: false, maxDate: '2026-01-01' })
    ).toThrow()
  })

  it('throws on unparseable input', () => {
    expect(() => sanitizeDate('not-a-date', { required: false })).toThrow('Invalid date format')
  })

  it('rejects dates that do not exist instead of rolling them over', () => {
    expect(() => sanitizeDate('2026-02-31', { required: false })).toThrow('Invalid date format')
    expect(() => sanitizeDate('2026-13-01', { required: false })).toThrow('Invalid date format')
    expect(sanitizeDate('2028-02-29', { required: false })).toBe('2028-02-29')
  })

  it('compares bounds as YYYY-MM-DD strings, inclusive', () => {
    expect(sanitizeDate('2026-11-08', { maxDate: '2026-11-08' })).toBe('2026-11-08')
    expect(() => sanitizeDate('2026-11-09', { maxDate: '2026-11-08' })).toThrow()
    expect(sanitizeDate('2026-11-08', { minDate: '2026-11-08' })).toBe('2026-11-08')
    expect(() => sanitizeDate('2026-11-07', { minDate: '2026-11-08' })).toThrow()
  })

  it('turns a Date into its local calendar date', () => {
    const d = new Date(2026, 0, 31, 23, 30) // local Jan 31, 11:30pm
    expect(sanitizeDate(d)).toBe('2026-01-31')
  })
})

describe('validateWorkoutData - no future dates', () => {
  it("accepts today's local date", () => {
    const today = getLocalDateString()
    const result = validateWorkoutData({ workout_type: 'Running', duration: 30, rating: 2, date: today })
    expect(result.date).toBe(today)
  })

  it('rejects a date after local today', () => {
    expect(() =>
      validateWorkoutData({ workout_type: 'Running', duration: 30, rating: 2, date: '2999-01-01' })
    ).toThrow('Workout validation failed')
  })
})

describe('sanitizeText - stored as typed', () => {
  it('keeps apostrophes, quotes, slashes and angle brackets', () => {
    expect(sanitizeText("Women's Relay")).toBe("Women's Relay")
    expect(sanitizeText('Coach "K" A/B <3')).toBe('Coach "K" A/B <3')
  })

  it('trims and turns newlines into spaces by default', () => {
    expect(sanitizeText('  Easy\nswim  ')).toBe('Easy swim')
  })

  it('counts real characters toward maxLength', () => {
    const name = "'".repeat(50)
    expect(sanitizeText(name, { maxLength: 50 })).toBe(name)
    expect(sanitizeText("x'yz", { maxLength: 2 })).toBe("x'")
  })

  it('keeps an apostrophe in a display name', () => {
    expect(validateDisplayName("D'Angelo")).toBe("D'Angelo")
  })
})

describe('validateDuration', () => {
  it('accepts a valid duration', () => {
    expect(validateDuration(45)).toBe(45)
  })

  it('rejects zero or negative duration', () => {
    expect(() => validateDuration(0)).toThrow()
    expect(() => validateDuration(-10)).toThrow()
  })

  it('rejects durations over 24 hours', () => {
    expect(() => validateDuration(1441)).toThrow()
  })
})

describe('validateRating', () => {
  it('accepts 1, 2, or 3', () => {
    expect(validateRating(1)).toBe(1)
    expect(validateRating(2)).toBe(2)
    expect(validateRating(3)).toBe(3)
  })

  it('rejects ratings outside the 1-3 range', () => {
    expect(() => validateRating(0)).toThrow()
    expect(() => validateRating(4)).toThrow()
  })
})
