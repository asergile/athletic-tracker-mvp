import React from 'react'
import Link from 'next/link'
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarDay, MonthSummary } from '../lib/activityGrid'
import { feelStyle } from '../lib/feelColors'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import { formatTotalTime } from '../lib/utils'

export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

/** 32px rounded-square day cell, shared by the month calendar and the week strip. */
export const DayCell: React.FC<{
  day: CalendarDay | null
  selected: boolean
  dimmed?: boolean
  onSelect: (date: string) => void
}> = ({ day, selected, dimmed = false, onSelect }) => {
  if (!day) return <div className="h-8 w-8" aria-hidden="true" />

  const style = feelStyle(day.ratings)
  let look: string
  if (style) {
    look = 'text-white font-bold'
  } else if (day.isFuture) {
    look = 'border border-white/[0.08] text-white/30'
  } else {
    look = day.isToday ? 'text-white font-bold' : 'text-purple-200'
  }
  // outline (not ring) so the gap between cell and ring shows the card behind it
  const ring = selected
    ? ' outline outline-2 outline-offset-2 outline-white'
    : day.isToday
      ? ' outline outline-1 outline-offset-2 outline-white/40'
      : ''

  return (
    <button
      type="button"
      disabled={day.isFuture}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(day.date)
      }}
      aria-label={day.date}
      aria-pressed={selected}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-opacity touch-manipulation disabled:cursor-default ${look}${ring}${dimmed ? ' opacity-40' : ''}`}
      style={style}
    >
      {day.dayOfMonth}
    </button>
  )
}

export const MonthNav: React.FC<{
  title: string
  onPrev: () => void
  onNext: () => void
  canNext: boolean
  small?: boolean
}> = ({ title, onPrev, onNext, canNext, small = false }) => (
  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={onPrev}
      aria-label="Previous month"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
    <span className={`font-bold text-white ${small ? 'text-base' : 'text-lg'}`}>{title}</span>
    <button
      type="button"
      onClick={onNext}
      disabled={!canNext}
      aria-label="Next month"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <ChevronRight className="h-5 w-5" />
    </button>
  </div>
)

/** Opens the Trends page; shared by the month calendar and the week strip. */
export const TrendsButton: React.FC = () => (
  <Link
    href="/trends"
    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20 touch-manipulation"
  >
    <BarChart3 className="h-4 w-4" />
    Trends
  </Link>
)

export const WeekdayHeader: React.FC = () => (
  <div className="grid grid-cols-7 justify-items-center">
    {WEEKDAY_LABELS.map((label, i) => (
      <div key={i} className="text-[11px] font-semibold text-purple-200">
        {label}
      </div>
    ))}
  </div>
)

interface MonthCalendarProps {
  title: string
  weeks: (CalendarDay | null)[][]
  summary: MonthSummary
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  canNextMonth: boolean
}

/** History month calendar card (wireframe B2.3), Monday-first. */
const MonthCalendar: React.FC<MonthCalendarProps> = ({
  title,
  weeks,
  summary,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  canNextMonth
}) => {
  const swipe = useHorizontalSwipe(
    () => { if (canNextMonth) onNextMonth() },
    onPrevMonth
  )

  return (
    <div
      {...swipe}
      className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl px-3 pt-2 pb-4"
    >
      <div className="flex items-center justify-between">
        <MonthNav title={title} onPrev={onPrevMonth} onNext={onNextMonth} canNext={canNextMonth} />
        <TrendsButton />
      </div>

      <p className="px-2 mb-3 text-sm text-purple-200">
        {plural(summary.days, 'day')}
        <span className="mx-2 text-white/30">|</span>
        {plural(summary.workouts, 'workout')}
        <span className="mx-2 text-white/30">|</span>
        {formatTotalTime(summary.minutes)}
      </p>

      <WeekdayHeader />
      <div className="mt-2 space-y-2">
        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7 justify-items-center">
            {week.map((day, j) => (
              <DayCell
                key={day ? day.date : `blank-${i}-${j}`}
                day={day}
                selected={!!day && day.date === selectedDate}
                onSelect={onSelectDate}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MonthCalendar
