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
