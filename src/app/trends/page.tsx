'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'
import FeedbackButton from '@/components/FeedbackButton'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import { formatTotalTime, getLocalDateString } from '@/lib/utils'
import { FEEL_HEX } from '@/lib/feelColors'
import {
  buildTrends,
  formatDistance,
  formatDistanceValue,
  periodFor,
  periodLabel,
  shiftPeriod,
  unitLabel,
  type ActivityTrend,
  type FeelCounts,
  type Period,
  type PeriodKind,
  type TrendsWorkout
} from '@/lib/trends'

// getUserWorkouts() returns at most this many rows (newest first).
const WORKOUT_LOAD_LIMIT = 500

const TABS: { kind: PeriodKind; label: string }[] = [
  { kind: 'week', label: 'Week' },
  { kind: 'month', label: 'Month' }
]

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

/** 'This week', 'Last week', 'This month', 'Last month', or '' for older periods. */
const relativeLabel = (period: Period, current: Period): string => {
  const unit = period.kind === 'week' ? 'week' : 'month'
  if (period.start === current.start) return `This ${unit}`
  if (period.start === shiftPeriod(current, -1).start) return `Last ${unit}`
  return ''
}

/** 'Last week: 16,200 yds' – same terms as the card headline. */
const previousText = (activity: ActivityTrend, kind: PeriodKind): string => {
  const label = kind === 'week' ? 'Last week' : 'Last month'
  const { previous, unit, distance } = activity
  if (previous.sessions === 0) return `${label}: none`
  if (distance !== null && unit) {
    return previous.distance === null
      ? `${label}: no distance logged`
      : `${label}: ${formatDistance(previous.distance, unit)}`
  }
  return `${label}: ${formatTotalTime(previous.minutes)}`
}

const ActivityCard: React.FC<{ activity: ActivityTrend; kind: PeriodKind }> = ({ activity, kind }) => {
  const hasDistance = activity.distance !== null && activity.unit !== null
  const details: string[] = []
  if (hasDistance) details.push(formatTotalTime(activity.minutes))
  details.push(plural(activity.sessions, 'session'))
  if (activity.missingDistance > 0) details.push(`${activity.missingDistance} without distance`)

  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
      <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-purple-200">{activity.name}</span>
      <div className="flex items-end gap-1.5">
        <span className="text-[32px] font-bold leading-[38px] text-white">
          {hasDistance
            ? formatDistanceValue(activity.distance as number, activity.unit!)
            : formatTotalTime(activity.minutes)}
        </span>
        {hasDistance && (
          <span className="pb-0.5 text-base font-semibold text-purple-200">{unitLabel(activity.unit!)}</span>
        )}
      </div>
      <span className="text-sm text-purple-200">{details.join(' · ')}</span>
      <div className="h-px w-full bg-white/[0.12]" />
      <span className="text-[13px] text-purple-300">{previousText(activity, kind)}</span>
    </div>
  )
}

/** "How workouts went" – share of Great / Solid / Struggled. Feel is not intensity. */
const FeelCard: React.FC<{ feel: FeelCounts }> = ({ feel }) => {
  const total = feel.great + feel.solid + feel.struggled
  if (total === 0) return null
  const parts = [
    { count: feel.great, label: 'Great', color: FEEL_HEX[3] },
    { count: feel.solid, label: 'Solid', color: FEEL_HEX[2] },
    { count: feel.struggled, label: 'Struggled', color: FEEL_HEX[1] }
  ].filter(p => p.count > 0)

  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
      <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-purple-200">How workouts went</span>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {parts.map(p => (
          <div key={p.label} className="h-3" style={{ width: `${(p.count / total) * 100}%`, backgroundColor: p.color }} />
        ))}
      </div>
      <span className="text-[13px] text-purple-200">{parts.map(p => `${p.count} ${p.label}`).join(' · ')}</span>
    </div>
  )
}

export default function TrendsPage(): React.ReactElement {
  const { user, loading, isHydrated } = useAuth()

  const [workouts, setWorkouts] = useState<TrendsWorkout[]>([])
  const [goalMinutes, setGoalMinutes] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  // Always opens on Week (not the last-viewed tab).
  const today = useMemo(() => getLocalDateString(), [])
  const [kind, setKind] = useState<PeriodKind>('week')
  const [period, setPeriod] = useState<Period>(() => periodFor('week', today))

  useEffect(() => {
    if (!user) return
    const load = async (): Promise<void> => {
      setIsLoading(true)
      try {
        const [workoutsResponse, settingsResponse] = await Promise.all([
          dbHelpers.getUserWorkouts(),
          dbHelpers.getUserSettings()
        ])
        if (workoutsResponse.error) setError('Failed to load workouts')
        setWorkouts(workoutsResponse.data || [])
        const goal = Number(settingsResponse.data?.weekly_goal_minutes)
        setGoalMinutes(Number.isFinite(goal) && goal > 0 ? goal : null)
      } catch (err) {
        console.error('Error loading trends:', err)
        setError('Failed to load workouts')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user])

  const currentPeriod = useMemo(() => periodFor(kind, today), [kind, today])
  const trends = useMemo(() => buildTrends(workouts, period), [workouts, period])

  // Workouts are newest first, so the last one is the oldest loaded.
  const oldestLoadedDate = workouts.length > 0 ? workouts[workouts.length - 1].date : null
  const canPrev = !!oldestLoadedDate && period.start > periodFor(kind, oldestLoadedDate).start
  const canNext = period.start < currentPeriod.start
  // At the load limit, this period or the one it is compared with may be missing older workouts.
  const mayBeIncomplete =
    workouts.length >= WORKOUT_LOAD_LIMIT && !!oldestLoadedDate && shiftPeriod(period, -1).start <= oldestLoadedDate

  const switchTab = (next: PeriodKind): void => {
    setKind(next)
    setPeriod(periodFor(next, today))
  }

  if (loading || isLoading || !isHydrated) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  const relative = relativeLabel(period, currentPeriod)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="px-4 pt-12 pb-8">
        {/* Header: back to History, centered title */}
        <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link
            href="/history"
            className="flex w-fit items-center gap-1 rounded-xl bg-white/10 py-2 pl-2 pr-3 text-[15px] font-medium text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
            History
          </Link>
          <h1 className="text-xl font-bold text-white">Trends</h1>
          <div />
        </div>

        {/* Week | Month tabs (Season comes with seasons) */}
        <div role="tablist" className="mb-4 flex w-full gap-1 rounded-xl bg-white/10 p-1">
          {TABS.map(tab => {
            const active = tab.kind === kind
            return (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchTab(tab.kind)}
                className={`flex-1 rounded-lg py-2 text-sm touch-manipulation ${
                  active ? 'bg-white font-bold text-purple-950' : 'font-semibold text-purple-200 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Period navigation: back through history, never into the future */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPeriod(shiftPeriod(period, -1))}
            disabled={!canPrev}
            aria-label={kind === 'week' ? 'Previous week' : 'Previous month'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[17px] font-bold text-white">{periodLabel(period)}</span>
            {relative && <span className="text-xs text-purple-200">{relative}</span>}
          </div>
          <button
            type="button"
            onClick={() => setPeriod(shiftPeriod(period, 1))}
            disabled={!canNext}
            aria-label={kind === 'week' ? 'Next week' : 'Next month'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Summary: workouts | total time (Week adds goal progress) */}
        <p className="mb-5 text-center text-sm font-semibold text-white">
          {plural(trends.workouts, 'workout')}
          <span className="mx-2 font-normal text-white/30">|</span>
          {formatTotalTime(trends.minutes)}
          {kind === 'week' && goalMinutes !== null && (
            <span className="font-normal text-purple-200"> of {formatTotalTime(goalMinutes)} goal</span>
          )}
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500 border-opacity-30 bg-red-500 bg-opacity-10 p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {trends.activities.map(activity => (
            <ActivityCard key={activity.key} activity={activity} kind={kind} />
          ))}
          <FeelCard feel={trends.feel} />
        </div>

        {trends.workouts === 0 && !error && (
          <p className="py-8 text-center text-sm text-purple-200">
            {relative ? `No workouts ${relative.toLowerCase()}.` : `No workouts in ${periodLabel(period)}.`}
          </p>
        )}

        {mayBeIncomplete && (
          <p className="pt-4 text-center text-xs text-purple-300">
            Only your most recent {WORKOUT_LOAD_LIMIT} workouts are loaded, so these numbers may be incomplete.
          </p>
        )}
      </div>

      <FeedbackButton />
    </div>
  )
}
