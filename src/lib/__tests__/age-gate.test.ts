import { describe, it, expect } from 'vitest'
import { parseDateParts, ageFromDateOfBirth } from '../age-gate'

const today = new Date(2026, 9, 12) // Oct 12, 2026 (local time)

describe('parseDateParts', () => {
  it('builds a padded ISO date', () => {
    expect(parseDateParts('9', '5', '2010', today)).toEqual({ date: '2010-09-05' })
  })

  it('rejects impossible days with a specific message', () => {
    expect(parseDateParts('09', '31', '2010', today)).toEqual({
      error: 'Enter a real date. September 2010 has 30 days.'
    })
    expect(parseDateParts('2', '29', '2011', today)).toHaveProperty('error')
    expect(parseDateParts('2', '29', '2012', today)).toEqual({ date: '2012-02-29' })
  })

  it('requires a valid month and a 4-digit year', () => {
    expect(parseDateParts('13', '1', '2010', today)).toEqual({ error: 'Enter a month from 1 to 12.' })
    expect(parseDateParts('1', '1', '10', today)).toEqual({ error: 'Enter a 4-digit year.' })
    expect(parseDateParts('', '', '', today)).toEqual({ error: 'Enter your date of birth.' })
  })

  it('rejects future dates and implausible ages', () => {
    expect(parseDateParts('12', '1', '2026', today)).toHaveProperty('error')
    expect(parseDateParts('1', '1', '1890', today)).toEqual({ error: 'Check the year.' })
  })
})

describe('ageFromDateOfBirth', () => {
  it('counts the birthday day itself', () => {
    expect(ageFromDateOfBirth('2013-10-12', today)).toBe(13)
    expect(ageFromDateOfBirth('2013-10-13', today)).toBe(12)
  })
})
