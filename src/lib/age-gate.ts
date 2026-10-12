/**
 * Device flag set when someone enters an under-13 date of birth.
 * PBGB is for athletes 13 and older; the flag keeps the sign-up screen
 * from simply being retried with a different date on the same device.
 */
const KEY = 'pbgb_age_block'

export function setAgeBlock(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* storage unavailable */
  }
  try {
    document.cookie = `${KEY}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  } catch {
    /* cookies unavailable */
  }
}

export function isAgeBlocked(): boolean {
  try {
    if (localStorage.getItem(KEY) === '1') return true
  } catch {
    /* storage unavailable */
  }
  try {
    return document.cookie.split('; ').some((c) => c === `${KEY}=1`)
  } catch {
    return false
  }
}

/** Whole years between a YYYY-MM-DD date and today (local time). Null if invalid. */
export function ageFromDateOfBirth(dateOfBirth: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1
  return age
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Turn separate month / day / year boxes into a YYYY-MM-DD date,
 * or a plain-language error that says what to fix.
 */
export function parseDateParts(
  month: string,
  day: string,
  year: string,
  today: Date = new Date()
): { date: string } | { error: string } {
  const m = month.trim()
  const d = day.trim()
  const y = year.trim()

  if (!m && !d && !y) return { error: 'Enter your date of birth.' }
  if (!/^\d{1,2}$/.test(m) || Number(m) < 1 || Number(m) > 12) {
    return { error: 'Enter a month from 1 to 12.' }
  }
  if (!/^\d{1,2}$/.test(d) || Number(d) < 1) {
    return { error: 'Enter a day of the month.' }
  }
  if (!/^\d{4}$/.test(y)) {
    return { error: 'Enter a 4-digit year.' }
  }

  const mm = Number(m)
  const dd = Number(d)
  const yyyy = Number(y)
  const daysInMonth = new Date(yyyy, mm, 0).getDate()
  if (dd > daysInMonth) {
    return { error: `Enter a real date. ${MONTH_NAMES[mm - 1]} ${yyyy} has ${daysInMonth} days.` }
  }

  const date = `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
  const age = ageFromDateOfBirth(date, today)
  if (age === null || age < 0) return { error: 'Date of birth can’t be in the future.' }
  if (age > 120) return { error: 'Check the year.' }
  return { date }
}
