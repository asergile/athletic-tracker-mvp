'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'
import FeedbackButton from '@/components/FeedbackButton'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import { formatTotalTime, getLocalDateString } from '@/lib/utils'
import { FEEL_HEX } from '@/lib/feelColors'
import { shortDateLabel } from '@/lib/activityGrid'
import {
  defaultSeason,
  seasonLabel,
  seasonStatus,
  seasonsByStart,
  seasonWeeks,
  startedSeasons,
  weekNumber,
  type Season
} from '@/lib/seasons'
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

type TabKind = PeriodKind | 'season'

const TABS: { kind: TabKind; label: string }[] = [
  { kind: 'week', label: 'Week' },
  { kind: 'month', label: 'Month' },
  { kind: 'season', label: 'Season' }
]

// Last season viewed on this device (per-viewer convenience; never required).
const LAST_SEASON_KEY = 'pbgb.trends.lastSeasonId'
const readLastSeason = (): string | null => {
  try {
    return window.localStorage.getItem(LAST_SEASON_KEY)
  } catch {
    return null
  }
}
const writeLastSeason = (id: string): void => {
  try {
    window.localStorage.setItem(LAST_SEASON_KEY, id)
  } catch {
    // Private mode or storage blocked: the picker just falls back to the default.
  }
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

/** 'This week', 'Last week', 'This month', 'Last month', or '' for older periods. */
const relativeLabel = (period: Period, current: Period): string => {
  const unit = period.kind === 'week' ? 'week' : 'month'
  if (period.start === current.start) return `This ${unit}`
  if (period.start === shiftPeriod(current, -1).start) return `Last ${unit}`
  return ''
}

/** 'Last week: 16,200 yds' – same terms as the card headline; null when there is no comparison (seasons). */
const previousText = (activity: ActivityTrend, kind: TabKind): string | null => {
  const label = kind === 'week' ? 'Last week' : 'Last month'
  const { previous, unit, distance } = activity
  if (!previous) return null
  if (previous.sessions === 0) return `${label}: none`
  if (distance !== null && unit) {
    return previous.distance === null
      ? `${label}: no distance logged`
      : `${label}: ${formatDistance(previous.distance, unit)}`
  }
  return `${label}: ${formatTotalTime(previous.minutes)}`
}

const ActivityCard: React.FC<{ activity: ActivityTrend; kind: TabKind }> = ({ activity, kind }) => {
  const comparison = previousText(activity, kind)
  const hasDistance = activity.distance !== null && activity.unit !== null
  const details: string[] = []
  if (hasDistance) details.push(formatTotalTime(activity.minutes))
  details.push(plural(activity.sessions, 'session'))
  if (activity.missingDistance > 0) details.push(`${activity.missingDistance} without distance`)

  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
      <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-fuchsia-200">{activity.name}</span>
      <div className="flex items-end gap-1.5">
        <span className="text-[32px] font-bold leading-[38px] text-white">
          {hasDistance
            ? formatDistanceValue(activity.distance as number, activity.unit!)
            : formatTotalTime(activity.minutes)}
        </span>
        {hasDistance && (
          <span className="pb-0.5 text-base font-semibold text-fuchsia-200">{unitLabel(activity.unit!)}</span>
        )}
      </div>
      <span className="text-sm text-fuchsia-200">{details.join(' · ')}</span>
      {comparison && (
        <>
          <div className="h-px w-full bg-white/[0.12]" />
          <span className="text-[13px] text-fuchsia-300">{comparison}</span>
        </>
      )}
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
      <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-fuchsia-200">How workouts went</span>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {parts.map(p => (
          <div key={p.label} className="h-3" style={{ width: `${(p.count / total) * 100}%`, backgroundColor: p.color }} />
        ))}
      </div>
      <span className="text-[13px] text-fuchsia-200">{parts.map(p => `${p.count} ${p.label}`).join(' · ')}</span>
    </div>
  )
}

/** 'Week 9' (current) or '22 weeks' (ended). Weeks are Monday-based; Week 1 holds the start date. */
const seasonProgress = (season: Season, today: string): string => {
  if (seasonStatus(season, today) === 'current') return `Week ${weekNumber(season.start_date, today)}`
  const weeks = seasonWeeks(season)
  return `${weeks} week${weeks === 1 ? '' : 's'}`
}

const navButtonClass =
  'flex h-9 w-9 flex-none items-center justify-center rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent'

/** Season picker (wireframe C2): ‹ › step by start date; the chip opens the phone's native picker. */
const SeasonNav: React.FC<{
  season: Season
  seasons: Season[]        // started seasons only, newest start first
  older: Season | null
  newer: Season | null
  today: string
  onSelect: (id: string) => void
}> = ({ season, seasons, older, newer, today, onSelect }) => {
  const current = seasons.filter(s => seasonStatus(s, today) === 'current')
  const past = seasons.filter(s => seasonStatus(s, today) === 'ended')
  const several = seasons.length > 1

  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => older && onSelect(older.id)}
        disabled={!older}
        aria-label="Previous season"
        className={navButtonClass}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-col items-center">
        <div className="relative max-w-full">
          <div className="flex min-w-0 items-center gap-1 rounded-lg bg-white/10 px-3 py-1">
            <span className="truncate text-[17px] font-bold text-white">{seasonLabel(season)}</span>
            {several && <ChevronDown className="h-4 w-4 flex-none text-white" />}
          </div>
          {several && (
            // Invisible native select over the chip. text-base (16px) stops iOS zooming on focus.
            <select
              aria-label="Choose a season"
              value={season.id}
              onChange={(e) => onSelect(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer text-base opacity-0"
            >
              {current.length > 0 && (
                <optgroup label="Current">
                  {current.map(s => <option key={s.id} value={s.id}>{seasonLabel(s)}</option>)}
                </optgroup>
              )}
              {past.length > 0 && (
                <optgroup label="Past">
                  {past.map(s => <option key={s.id} value={s.id}>{seasonLabel(s)}</option>)}
                </optgroup>
              )}
            </select>
          )}
        </div>
        <span className="mt-1 text-xs text-fuchsia-200">
          {shortDateLabel(season.start_date)} – {shortDateLabel(season.end_date)} · {seasonProgress(season, today)}
        </span>
      </div>
      <button
        type="button"
        onClick={() => newer && onSelect(newer.id)}
        disabled={!newer}
        aria-label="Next season"
        className={navButtonClass}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

export default function TrendsPage(): React.ReactElement {
  const { user, loading, isHydrated } = useAuth()

  const [workouts, setWorkouts] = useState<TrendsWorkout[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonId, setSeasonId] = useState<string | null>(null)
  const [goalMinutes, setGoalMinutes] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  // Always opens on Week (not the last-viewed tab).
  const today = useMemo(() => getLocalDateString(), [])
  const [kind, setKind] = useState<TabKind>('week')
  const [period, setPeriod] = useState<Period>(() => periodFor('week', today))

  useEffect(() => {
    if (!user) return
    const load = async (): Promise<void> => {
      setIsLoading(true)
      try {
        const [workoutsResponse, settingsResponse, seasonsResponse] = await Promise.all([
          dbHelpers.getUserWorkouts(),
          dbHelpers.getUserSettings(),
          dbHelpers.getUserSeasons()
        ])
        if (workoutsResponse.error) setError('Failed to load workouts')
        setWorkouts(workoutsResponse.data || [])
        // Seasons are optional: if they fail to load, the Season tab just doesn't show.
        // Upcoming seasons have no data yet, so Trends only gets seasons that have started.
        const loadedSeasons = seasonsResponse.error ? [] : startedSeasons(seasonsResponse.data, today)
        setSeasons(loadedSeasons)
        setSeasonId(defaultSeason(loadedSeasons, today, readLastSeason())?.id ?? null)
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
  }, [user, today])

  const isSeason = kind === 'season'
  const season = isSeason ? seasons.find(s => s.id === seasonId) ?? null : null
  const orderedSeasons = useMemo(() => seasonsByStart(seasons), [seasons])
  const seasonIndex = season ? orderedSeasons.findIndex(s => s.id === season.id) : -1
  const olderSeason = seasonIndex > 0 ? orderedSeasons[seasonIndex - 1] : null
  const newerSeason =
    seasonIndex >= 0 && seasonIndex < orderedSeasons.length - 1 ? orderedSeasons[seasonIndex + 1] : null

  const currentPeriod = useMemo(() => periodFor(kind === 'season' ? 'week' : kind, today), [kind, today])
  // Seasons: totals for the season's own dates, no comparison (v1). Overlapping seasons are independent.
  const trends = useMemo(
    () =>
      season
        ? buildTrends(workouts, { start: season.start_date, end: season.end_date }, null)
        : buildTrends(workouts, period),
    [workouts, period, season]
  )

  // Workouts are newest first, so the last one is the oldest loaded.
  const oldestLoadedDate = workouts.length > 0 ? workouts[workouts.length - 1].date : null
  const canPrev = !!oldestLoadedDate && period.start > periodFor(period.kind, oldestLoadedDate).start
  const canNext = period.start < currentPeriod.start
  // At the load limit, this period or the one it is compared with may be missing older workouts.
  const mayBeIncomplete =
    workouts.length >= WORKOUT_LOAD_LIMIT &&
    !!oldestLoadedDate &&
    (season ? season.start_date : shiftPeriod(period, -1).start) <= oldestLoadedDate

  const switchTab = (next: TabKind): void => {
    setKind(next)
    if (next !== 'season') setPeriod(periodFor(next, today))
  }

  const selectSeason = (id: string): void => {
    setSeasonId(id)
    writeLastSeason(id)
  }

  if (loading || isLoading || !isHydrated) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  const relative = isSeason ? '' : relativeLabel(period, currentPeriod)
  // The Season tab only exists when the athlete has at least one season.
  const tabs = TABS.filter(tab => tab.kind !== 'season' || seasons.length > 0)

  let emptyText = relative ? `No workouts ${relative.toLowerCase()}.` : `No workouts in ${periodLabel(period)}.`
  if (season) {
    const label = seasonLabel(season)
    emptyText = seasonStatus(season, today) === 'current' ? `No workouts in ${label} yet.` : `No workouts in ${label}.`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-fuchsia-900 to-slate-900">
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

        {/* Week | Month | Season tabs (Season only when the athlete has seasons) */}
        <div role="tablist" className="mb-4 flex w-full gap-1 rounded-xl bg-white/10 p-1">
          {tabs.map(tab => {
            const active = tab.kind === kind
            return (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchTab(tab.kind)}
                className={`flex-1 rounded-lg py-2 text-sm touch-manipulation ${
                  active ? 'bg-white font-bold text-fuchsia-950' : 'font-semibold text-fuchsia-200 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {season ? (
          <SeasonNav
            season={season}
            seasons={seasons}
            older={olderSeason}
            newer={newerSeason}
            today={today}
            onSelect={selectSeason}
          />
        ) : (
        /* Period navigation: back through history, never into the future */
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
            {relative && <span className="text-xs text-fuchsia-200">{relative}</span>}
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
        )}

        {/* Summary: workouts | total time (Week adds goal progress) */}
        <p className="mb-5 text-center text-sm font-semibold text-white">
          {plural(trends.workouts, 'workout')}
          <span className="mx-2 font-normal text-white/30">|</span>
          {formatTotalTime(trends.minutes)}
          {kind === 'week' && goalMinutes !== null && (
            <span className="font-normal text-fuchsia-200"> of {formatTotalTime(goalMinutes)} goal</span>
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
          <p className="py-8 text-center text-sm text-fuchsia-200">
            {emptyText}
          </p>
        )}

        {mayBeIncomplete && (
          <p className="pt-4 text-center text-xs text-fuchsia-300">
            Only your most recent {WORKOUT_LOAD_LIMIT} workouts are loaded, so these numbers may be incomplete.
          </p>
        )}
      </div>

      <FeedbackButton />
    </div>
  )
}
