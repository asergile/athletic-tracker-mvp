import { describe, it, expect, afterEach, vi } from 'vitest'
import { getLocalDateString } from '../utils'

// getLocalDateString() depends only on Date's local accessors
// (getFullYear/getMonth/getDate), which the real browser on a user's actual
// device (iOS Safari, Android Chrome, desktop) always resolves correctly
// against that device's real timezone - no arithmetic needed in production.
//
// For deterministic tests we mock those accessors directly rather than
// relying on the test runner's OS-level timezone (e.g. mutating
// process.env.TZ at runtime). That approach is platform-dependent - Node's
// handling of a mid-process TZ change isn't guaranteed across OSes, and in
// practice it silently failed on macOS during development of this suite,
// which would have masked a real bug rather than catching one.
describe('getLocalDateString', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('formats a local date as YYYY-MM-DD with zero-padding', () => {
    vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026)
    vi.spyOn(Date.prototype, 'getMonth').mockReturnValue(0) // January = 0
    vi.spyOn(Date.prototype, 'getDate').mockReturnValue(5)

    expect(getLocalDateString(new Date())).toBe('2026-01-05')
  })

  it('does not shift to a different calendar day based on UTC - only local accessors matter', () => {
    // This is the exact failure mode that shipped twice: a UTC-based
    // computation (toISOString) disagreeing with the local calendar date.
    // getLocalDateString must never consult UTC at all, so pinning the
    // local accessors to one date is sufficient regardless of what instant
    // the underlying Date object actually represents.
    vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026)
    vi.spyOn(Date.prototype, 'getMonth').mockReturnValue(6) // July = 6
    vi.spyOn(Date.prototype, 'getDate').mockReturnValue(13)

    // Even if the instant's UTC date would be July 14th, the local
    // calendar date (per the mocked accessors) is July 13th - that's what
    // must come back.
    expect(getLocalDateString(new Date('2026-07-14T03:45:00.000Z'))).toBe('2026-07-13')
  })

  it('defaults to the current moment when no argument is given', () => {
    vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026)
    vi.spyOn(Date.prototype, 'getMonth').mockReturnValue(11) // December = 11
    vi.spyOn(Date.prototype, 'getDate').mockReturnValue(25)

    expect(getLocalDateString()).toBe('2026-12-25')
  })
})
