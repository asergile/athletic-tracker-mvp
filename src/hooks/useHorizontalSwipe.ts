import { useRef } from 'react'
import type React from 'react'

/**
 * Touch handlers for a horizontal swipe. Only fires when the gesture is
 * mostly sideways and longer than `threshold` px, so vertical page scrolling
 * is never mistaken for a swipe.
 */
export function useHorizontalSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50
) {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (dx < 0) onSwipeLeft()
    else onSwipeRight()
  }

  return { onTouchStart, onTouchEnd }
}
