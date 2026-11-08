'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronRight } from 'lucide-react'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import { getLocalDateString } from '@/lib/utils'
import { shiftDays, shortDateLabel } from '@/lib/activityGrid'
import { seasonDateRange, seasonLabel, seasonStatus, type Season } from '@/lib/seasons'
import SeasonModal from './SeasonModal'

const HELPER_TEXT =
  "Track any stretch of time with a start and end, like a sport's season or a training block. See your totals for it in Trends."

const Badge: React.FC<{ season: Season; today: string }> = ({ season, today }) => {
  const status = seasonStatus(season, today)
  if (status === 'current') {
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Current</span>
  }
  if (status === 'ended') {
    return <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">Ended</span>
  }
  const when = season.start_date === shiftDays(today, 1) ? 'tomorrow' : shortDateLabel(season.start_date)
  return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Starts {when}</span>
}

const SeasonRow: React.FC<{
  season: Season
  today: string
  onEdit: (season: Season) => void
  onDelete: (season: Season) => void
}> = ({ season, today, onEdit, onDelete }) => {
  const label = seasonLabel(season)
  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-800 break-words">{label}</p>
        <p className="text-sm text-gray-500">{seasonDateRange(season)}</p>
        <div className="mt-1.5">
          <Badge season={season} today={today} />
        </div>
      </div>
      <div className="flex flex-none space-x-2">
        <button
          onClick={() => onEdit(season)}
          aria-label={`Edit ${label}`}
          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(season)}
          aria-label={`Delete ${label}`}
          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/**
 * Profile › Seasons (wireframe D1, without the superseded "Default" row).
 * Seasons are optional named date ranges; workouts are never linked to them.
 */
const SeasonsCard: React.FC = () => {
  const today = useMemo(() => getLocalDateString(), [])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loaded, setLoaded] = useState<boolean>(false)
  // Load failures get a retry; delete failures from a row just show the message.
  const [loadError, setLoadError] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  // Guards against a double tap opening two delete confirmations.
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showPast, setShowPast] = useState<boolean>(false)
  // null = closed, 'new' = Add Season, otherwise the season being edited.
  const [editing, setEditing] = useState<Season | 'new' | null>(null)

  const loadSeasons = useCallback(async (): Promise<void> => {
    const response = await dbHelpers.getUserSeasons()
    if (response.error) {
      setLoadError(true)
    } else {
      setLoadError(false)
      setError('')
      setSeasons(response.data)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    loadSeasons()
  }, [loadSeasons])

  // Already sorted newest start first by getUserSeasons().
  const active = seasons.filter(s => seasonStatus(s, today) !== 'ended')
  const past = seasons.filter(s => seasonStatus(s, today) === 'ended')

  /** Confirm and delete. Returns the error message on failure, else null (deleted, or cancelled). */
  const deleteSeason = async (season: Season): Promise<string | null> => {
    if (!window.confirm(`Delete ${seasonLabel(season)}? Your workouts stay as they are.`)) return null
    const response = await dbHelpers.deleteSeason(season.id)
    if (response.error) return response.error.message
    setEditing(null)
    await loadSeasons()
    return null
  }

  // From a row's trash icon: the error shows on the card.
  const handleRowDelete = async (season: Season): Promise<void> => {
    if (deletingId) return
    setError('')
    setDeletingId(season.id)
    const message = await deleteSeason(season)
    setDeletingId(null)
    if (message) setError(message)
  }

  const handleSaved = async (): Promise<void> => {
    setEditing(null)
    await loadSeasons()
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <span>Seasons</span>
        </h3>
        <button
          onClick={() => setEditing('new')}
          className="py-2 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 text-sm"
        >
          Add Season
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">{HELPER_TEXT}</p>

      {loadError && (
        <p className="mb-3 text-sm text-red-600">
          Couldn&apos;t load seasons.{' '}
          <button onClick={() => loadSeasons()} className="font-medium underline">
            Try again
          </button>
        </p>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loaded && !loadError && seasons.length === 0 && <p className="text-sm text-gray-400">No seasons yet.</p>}

      {active.length > 0 && (
        <div className="space-y-3">
          {active.map(season => (
            <SeasonRow key={season.id} season={season} today={today} onEdit={setEditing} onDelete={handleRowDelete} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className={active.length > 0 ? 'mt-3' : ''}>
          <button
            onClick={() => setShowPast(open => !open)}
            aria-expanded={showPast}
            className="flex w-full items-center justify-between py-2 text-sm font-medium text-purple-700 hover:text-purple-800"
          >
            <span>Past seasons ({past.length})</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showPast ? 'rotate-90' : ''}`} />
          </button>
          {showPast && (
            <div className="mt-2 space-y-3">
              {past.map(season => (
                <SeasonRow key={season.id} season={season} today={today} onEdit={setEditing} onDelete={handleRowDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <SeasonModal
          season={editing === 'new' ? null : editing}
          seasons={seasons}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onDelete={deleteSeason}
        />
      )}
    </div>
  )
}

export default SeasonsCard
