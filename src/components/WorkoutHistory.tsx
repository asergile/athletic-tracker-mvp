'use client'

import { Workout, ProcessedWorkoutData, StrokeDistribution } from '@/types'
import { formatDate, formatDistance, formatDuration, getRatingText, getRatingColor, getWorkoutTypeIcon } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface WorkoutHistoryProps {
  workouts: Workout[]
  onWorkoutSelect: (workout: Workout) => void
}

export function WorkoutHistory({ workouts, onWorkoutSelect }: WorkoutHistoryProps) {
  if (workouts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <div className="text-gray-400 mb-4">
          <div className="text-6xl">🏊‍♂️</div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
        <p className="text-gray-600">
          Record your first workout using the voice recorder above
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => (
        <WorkoutCard 
          key={workout.id}
          workout={workout}
          onClick={() => onWorkoutSelect(workout)}
        />
      ))}
    </div>
  )
}

interface WorkoutCardProps {
  workout: Workout
  onClick: () => void
}

function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const hasProcessedData = workout.processed_data && 
    typeof workout.processed_data === 'object' && 
    'sets' in workout.processed_data

  return (
    <div 
      className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{getWorkoutTypeIcon(workout.workout_type)}</span>
            <div>
              <h3 className="font-medium text-gray-900">
                {workout.workout_type.charAt(0).toUpperCase() + workout.workout_type.slice(1)} Workout
              </h3>
              <p className="text-sm text-gray-600">{formatDate(workout.date)}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{formatDuration(workout.duration_minutes)}</span>
            </div>
            
            {workout.distance_yards && workout.distance_yards > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{formatDistance(workout.distance_yards)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Rating:</span>
              <span className={`font-medium ${getRatingColor(workout.rating as 1 | 2 | 3)}`}>
                {getRatingText(workout.rating as 1 | 2 | 3)}
              </span>
            </div>
          </div>

          {/* Processed Data Preview */}
          {hasProcessedData && (
            <div className="mt-3 pt-3 border-t">
              <ProcessedDataPreview data={workout.processed_data} />
            </div>
          )}

          {/* Notes */}
          {workout.notes && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 line-clamp-2">{workout.notes}</p>
            </div>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-gray-400 ml-3" />
      </div>
    </div>
  )
}

function ProcessedDataPreview({ data }: { data: ProcessedWorkoutData | undefined }) {
  if (!data || typeof data !== 'object') return null

  const sets = data.sets || []
  const strokeDist = data.stroke_distribution as StrokeDistribution | undefined
  const achievements = data.achievements || []

  return (
    <div className="space-y-2">
      {/* Set count */}
      {sets.length > 0 && (
        <div className="text-xs text-gray-600">
          {sets.length} sets • {sets.filter(s => s.type === 'main').length} main sets
        </div>
      )}

      {/* Stroke distribution */}
      {strokeDist && Object.keys(strokeDist).length > 0 && (
        <div className="flex gap-3 text-xs">
          {Object.entries(strokeDist)
            .filter(([_, percentage]) => typeof percentage === 'number' && percentage > 5)
            .slice(0, 3)
            .map(([stroke, percentage]) => (
              <span key={stroke} className="text-gray-600">
                {stroke}: {Math.round(percentage as number)}%
              </span>
            ))
          }
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="text-xs">
          <span className="text-green-600 font-medium">🎉 {achievements[0]}</span>
        </div>
      )}
    </div>
  )
}
