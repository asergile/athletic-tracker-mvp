import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(yards: number): string {
  if (yards >= 1760) {
    const miles = (yards / 1760).toFixed(1)
    return `${miles} mi`
  }
  return `${yards} yd`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function getRatingText(rating: 1 | 2 | 3): string {
  const ratings = {
    1: 'Below Average',
    2: 'Average', 
    3: 'Good'
  }
  return ratings[rating]
}

export function getRatingColor(rating: 1 | 2 | 3): string {
  const colors = {
    1: 'text-red-600',
    2: 'text-yellow-600',
    3: 'text-green-600'
  }
  return colors[rating]
}

export function calculateWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

/**
 * Returns the LOCAL calendar date (YYYY-MM-DD) for the given Date, using
 * the environment's own local-time accessors rather than toISOString()
 * (which is always UTC). This is the single source of truth for "what date
 * is it right now" used when saving a new workout with no explicit date.
 *
 * Deliberately avoids manual UTC-offset arithmetic (e.g. shifting a
 * timestamp by getTimezoneOffset() and re-reading it via toISOString()) -
 * that approach has caused this exact bug to ship twice in this codebase
 * (July 2025 in createWorkout, September 2026 in validateWorkoutData, each
 * written independently of the other). getFullYear()/getMonth()/getDate()
 * are always local by spec, so on a real device (iOS Safari, Android
 * Chrome, desktop) this is correct automatically with no arithmetic at all.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatAttendanceRate(attended: number, planned: number): string {
  if (planned === 0) return '0%'
  const rate = Math.round((attended / planned) * 100)
  return `${rate}%`
}

export function getWorkoutTypeIcon(type: string): string {
  const icons = {
    pool: '🏊‍♂️',
    dryland: '🏃‍♂️',
    weights: '🏋️‍♂️'
  }
  return icons[type as keyof typeof icons] || '🏊‍♂️'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function generateWorkoutId(): string {
  return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
