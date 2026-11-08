'use client'

import React, { useMemo, useState } from 'react'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import {
  cleanSeasonName,
  findSameNameOverlap,
  isCalendarDate,
  SEASON_NAME_MAX,
  validateSeason,
  type Season,
  type SeasonFields
} from '@/lib/seasons'

interface SeasonModalProps {
  /** The season being edited, or null to add a new one. */
  season: Season | null
  /** All of the athlete's seasons, for the same-name overlap warning. */
  seasons: Season[]
  onClose: () => void
  onSaved: () => void
  /** Confirms and deletes; resolves to an error message to show here, or null (deleted or cancelled). */
  onDelete: (season: Season) => Promise<string | null>
}

/** Add / Edit Season (wireframe D2, minus the event chip and repeat toggle). */
const SeasonModal: React.FC<SeasonModalProps> = ({ season, seasons, onClose, onSaved, onDelete }) => {
  const [name, setName] = useState<string>(season?.name ?? '')
  const [startDate, setStartDate] = useState<string>(season?.start_date ?? '')
  const [endDate, setEndDate] = useState<string>(season?.end_date ?? '')
  const [error, setError] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const busy = isSaving || isDeleting

  const fields: SeasonFields = { name, start_date: startDate, end_date: endDate }

  // Soft warning only (never blocks): same name AND overlapping dates.
  const overlap = useMemo(() => {
    if (!cleanSeasonName(name) || !isCalendarDate(startDate) || !isCalendarDate(endDate) || endDate < startDate) {
      return null
    }
    return findSameNameOverlap({ name, start_date: startDate, end_date: endDate }, seasons, season?.id)
  }, [name, startDate, endDate, seasons, season?.id])

  const handleSave = async (): Promise<void> => {
    const message = validateSeason(fields)
    if (message) {
      setError(message)
      return
    }
    setError('')
    setIsSaving(true)
    const response = season
      ? await dbHelpers.updateSeason(season.id, fields)
      : await dbHelpers.createSeason(fields)
    setIsSaving(false)
    if (response.error) {
      setError(response.error.message)
      return
    }
    onSaved()
  }

  // On success the card closes this modal; on failure the error shows here, not behind the modal.
  const handleDelete = async (): Promise<void> => {
    if (!season) return
    setError('')
    setIsDeleting(true)
    const message = await onDelete(season)
    setIsDeleting(false)
    if (message) setError(message)
  }

  const inputClass =
    'w-full min-w-0 p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white'

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 m-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{season ? 'Edit Season' : 'Add Season'}</h3>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="seasonName" className="block text-gray-700 font-medium mb-2">Name</label>
            <input
              id="seasonName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={SEASON_NAME_MAX}
              placeholder="e.g., Swim season, XC 2026, Taper block"
              className={inputClass}
              autoFocus={!season}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label htmlFor="seasonStart" className="block text-gray-700 font-medium mb-2">Starts</label>
              <input
                id="seasonStart"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputClass} h-12`}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="seasonEnd" className="block text-gray-700 font-medium mb-2">Ends</label>
              <input
                id="seasonEnd"
                type="date"
                value={endDate}
                min={isCalendarDate(startDate) ? startDate : undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputClass} h-12`}
              />
            </div>
          </div>

          {overlap && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              You already have a {cleanSeasonName(overlap.name)} season during these dates.
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              busy
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg'
            }`}
          >
            {isSaving ? 'Saving…' : overlap ? 'Save anyway' : 'Save'}
          </button>
        </div>

        {season && (
          <button
            onClick={handleDelete}
            disabled={busy}
            className="mt-4 w-full text-center text-sm font-medium text-red-600 hover:text-red-700 disabled:text-gray-400"
          >
            {isDeleting ? 'Deleting…' : 'Delete season'}
          </button>
        )}
      </div>
    </div>
  )
}

export default SeasonModal
