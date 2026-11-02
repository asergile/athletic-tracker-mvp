import type { CSSProperties } from 'react'

/**
 * Feel colors (1 Struggled, 2 Solid, 3 Great), shared by the Log page
 * Activity Grid and the History calendar. Feel is NOT intensity.
 */
export const FEEL_HEX: Record<number, string> = {
  1: '#ef4444', // red-500
  2: '#eab308', // yellow-500
  3: '#22c55e'  // green-500
}

/**
 * Background for a day square: one feel color, or a diagonal split for two
 * workouts (earlier workout top-left). Undefined when the day has no workouts.
 */
export function feelStyle(ratings: number[]): CSSProperties | undefined {
  const [first, second] = ratings
  if (first && second && FEEL_HEX[first] && FEEL_HEX[second]) {
    return { background: `linear-gradient(135deg, ${FEEL_HEX[first]} 50%, ${FEEL_HEX[second]} 50%)` }
  }
  if (first && FEEL_HEX[first]) {
    return { backgroundColor: FEEL_HEX[first] }
  }
  return undefined
}
