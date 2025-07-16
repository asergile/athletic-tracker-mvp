'use client'

import { useState } from 'react'
import { WorkoutParsingResult, Workout, WorkoutSet } from '@/types'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'
import { CheckCircle, AlertCircle, Edit3, Save, X, Plus } from 'lucide-react'

interface WorkoutReviewProps {
  parseResult: WorkoutParsingResult & { transcript?: string; recording_duration?: number }
  onSave: (workout: Partial<Workout>) => void
  onDiscard: () => void
}

export function WorkoutReview({ parseResult, onSave, onDiscard }: WorkoutReviewProps) {
  const [editMode, setEditMode] = useState(false)
  const [workoutData, setWorkoutData] = useState(() => {
    const data = parseResult.workout_data
    return {
      duration_minutes: parseResult.recording_duration ? Math.max(Math.round(parseResult.recording_duration / 60), 30) : 60,
      distance_yards: data?.sets?.reduce((sum, set) => sum + (set.distance || 0), 0) || 0,
      workout_type: 'pool' as 'pool' | 'dryland' | 'weights',
      rating: 2 as 1 | 2 | 3,
      notes: ''
    }
  })

  const [sets, setSets] = useState(parseResult.workout_data?.sets || [])

  const handleSave = () => {
    const finalWorkout = {
      ...workoutData,
      processed_data: {
        sets,
        stroke_distribution: parseResult.workout_data?.stroke_distribution,
        achievements: parseResult.workout_data?.achievements,
        technical_focus: parseResult.workout_data?.technical_focus
      }
    }
    onSave(finalWorkout)
  }

  const totalDistance = sets.reduce((sum, set) => sum + (set.distance || 0), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Your Workout</h1>
            <div className="flex items-center gap-2">
              {parseResult.success ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm">Successfully processed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">Needs review</span>
                </div>
              )}
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">
                Confidence: {Math.round((parseResult.confidence || 0) * 100)}%
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {editMode ? 'View' : 'Edit'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalDistance}</div>
            <div className="text-sm text-gray-600">Total Yards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{sets.length}</div>
            <div className="text-sm text-gray-600">Sets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{workoutData.duration_minutes}m</div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
        </div>
      </div>

      {/* Workout Details Form */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Workout Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={workoutData.duration_minutes}
              onChange={(e) => setWorkoutData(prev => ({ 
                ...prev, 
                duration_minutes: parseInt(e.target.value) || 60 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workout Type
            </label>
            <select
              value={workoutData.workout_type}
              onChange={(e) => setWorkoutData(prev => ({ 
                ...prev, 
                workout_type: e.target.value as 'pool' | 'dryland' | 'weights'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pool">Pool</option>
              <option value="dryland">Dryland</option>
              <option value="weights">Weights</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How was it?
            </label>
            <select
              value={workoutData.rating}
              onChange={(e) => setWorkoutData(prev => ({ 
                ...prev, 
                rating: parseInt(e.target.value) as 1 | 2 | 3
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Below Average</option>
              <option value={2}>Average</option>
              <option value={3}>Good</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (optional)
          </label>
          <textarea
            value={workoutData.notes}
            onChange={(e) => setWorkoutData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional thoughts about this workout..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>

      {/* Sets Review */}
      {sets.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Workout Sets</h2>
            {editMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newSet: WorkoutSet = {
                    id: `set_${Date.now()}`,
                    type: 'main',
                    distance: 0,
                    description: 'New set',
                    stroke: 'freestyle'
                  }
                  setSets(prev => [...prev, newSet])
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Set
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {sets.map((set, index) => (
              <SetCard
                key={set.id || index}
                set={set}
                editMode={editMode}
                onUpdate={(updatedSet) => {
                  setSets(prev => prev.map((s, i) => i === index ? updatedSet : s))
                }}
                onDelete={() => {
                  setSets(prev => prev.filter((_, i) => i !== index))
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Original Transcript */}
      {parseResult.transcript && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Original Recording</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 italic">"{parseResult.transcript}"</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button 
          variant="outline" 
          onClick={onDiscard}
          className="px-6"
        >
          <X className="h-4 w-4 mr-2" />
          Discard
        </Button>
        <Button 
          onClick={handleSave}
          className="px-6 bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Workout
        </Button>
      </div>
    </div>
  )
}

interface SetCardProps {
  set: WorkoutSet
  editMode: boolean
  onUpdate: (set: WorkoutSet) => void
  onDelete: () => void
}

function SetCard({ set, editMode, onUpdate, onDelete }: SetCardProps) {
  if (editMode) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select
              value={set.type}
              onChange={(e) => onUpdate({ ...set, type: e.target.value as 'warmup' | 'main' | 'cooldown' | 'drill' })}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="warmup">Warm-up</option>
              <option value="main">Main Set</option>
              <option value="cooldown">Cool-down</option>
              <option value="drill">Drill</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Distance</label>
            <input
              type="number"
              value={set.distance}
              onChange={(e) => onUpdate({ ...set, distance: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border rounded"
              min="0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Stroke</label>
            <select
              value={set.stroke || 'freestyle'}
              onChange={(e) => onUpdate({ ...set, stroke: e.target.value as 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'IM' | 'kick' | 'drill' })}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="freestyle">Freestyle</option>
              <option value="backstroke">Backstroke</option>
              <option value="breaststroke">Breaststroke</option>
              <option value="butterfly">Butterfly</option>
              <option value="IM">IM</option>
              <option value="kick">Kick</option>
              <option value="drill">Drill</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={set.description}
            onChange={(e) => onUpdate({ ...set, description: e.target.value })}
            className="w-full px-2 py-1 text-sm border rounded"
          />
        </div>
      </div>
    )
  }

  // View mode
  const typeColors = {
    warmup: 'bg-blue-100 text-blue-800',
    main: 'bg-green-100 text-green-800',
    cooldown: 'bg-gray-100 text-gray-800',
    drill: 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[set.type]}`}>
              {set.type.charAt(0).toUpperCase() + set.type.slice(1)}
            </span>
            <span className="text-sm font-medium">{set.distance} yards</span>
            {set.stroke && (
              <span className="text-sm text-gray-600">• {set.stroke}</span>
            )}
          </div>
          <p className="text-gray-700">{set.description}</p>
          {set.interval && (
            <p className="text-sm text-gray-500 mt-1">Interval: {set.interval}</p>
          )}
        </div>
      </div>
    </div>
  )
}
