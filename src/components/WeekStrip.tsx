import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import type { CalendarDay } from '../lib/activityGrid'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import { DayCell, MonthNav, WeekdayHeader } from './MonthCalendar'

interface WeekStripProps {
  title: string
  /** 'YYYY-MM' shown in the list; days of other months are dimmed. */
  month: string
  days: CalendarDay[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  canNextMonth: boolean
  onPrevWeek: () => void
  onNextWeek: () => void
  canNextWeek: boolean
  onExpand: () => void
}

/**
 * Collapsed one-week strip (wireframe B2.4), pinned to the top of the screen
 * while the History list is scrolled. Solid background so cards don't show
 * through. Swipe for weeks; the handle expands back to the month calendar.
 */
const WeekStrip = forwardRef<HTMLDivElement, WeekStripProps>(function WeekStrip(
  {
    title,
    month,
    days,
    selectedDate,
    onSelectDate,
    onPrevMonth,
    onNextMonth,
    canNextMonth,
    onPrevWeek,
    onNextWeek,
    canNextWeek,
    onExpand
  },
  ref
) {
  const swipe = useHorizontalSwipe(
    () => { if (canNextWeek) onNextWeek() },
    onPrevWeek
  )

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-30 px-4"
      style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}
    >
      <div
        {...swipe}
        className="rounded-xl bg-purple-950/95 backdrop-blur-md shadow-lg px-3 pt-2"
      >
        <div className="flex items-center justify-between">
          <MonthNav
            title={title}
            onPrev={onPrevMonth}
            onNext={onNextMonth}
            canNext={canNextMonth}
            small
          />
          {/* Trends button goes here in Phase 3 */}
        </div>
        <WeekdayHeader />
        <div className="mt-2 grid grid-cols-7 justify-items-center">
          {days.map(day => (
            <DayCell
              key={day.date}
              day={day}
              selected={day.date === selectedDate}
              dimmed={day.month !== month}
              onSelect={onSelectDate}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onExpand}
          aria-label="Show the whole month"
          className="flex w-full items-center justify-center py-1.5 text-purple-200 hover:text-white"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
})

export default WeekStrip
