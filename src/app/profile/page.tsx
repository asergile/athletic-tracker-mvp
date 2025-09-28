'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Clock, Target, Activity, User, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import FeedbackButton from '@/components/FeedbackButton'
import StandardNavigation from '@/components/StandardNavigation'

// TypeScript Interfaces
interface UserSettings {
  distance_unit_cardio: string;
  distance_unit_swimming: string;
  weekly_goal_minutes: number;
  weekly_workout_frequency: number;
}

interface DistanceUnits {
  cardio: string[];
  swimming: string[];
}

// Constants
const defaultWorkoutTypes: string[] = ['Walking', 'Running', 'Swimming', 'Dryland'];

const distanceUnits: DistanceUnits = {
  cardio: ['miles', 'kilometers'],
  swimming: ['meters', 'yards']
};

// Helper function
const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

export default function ProfilePage(): React.ReactElement {
  const { user, signOut, loading, isHydrated } = useAuth()
  const router = useRouter()
  
  // State
  const [userSettings, setUserSettings] = useState<UserSettings>({
    distance_unit_cardio: 'miles',
    distance_unit_swimming: 'meters',
    weekly_goal_minutes: 300,
    weekly_workout_frequency: 4
  })
  const [workoutTypes, setWorkoutTypes] = useState<string[]>(defaultWorkoutTypes)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  
  // Profile-specific state
  const [tempGoalHours, setTempGoalHours] = useState<number>(0)
  const [tempGoalMinutes, setTempGoalMinutes] = useState<number>(0)
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [editingActivityName, setEditingActivityName] = useState<string>('')
  const [isUpdatingGoal, setIsUpdatingGoal] = useState<boolean>(false)
  const [showAddNewActivity, setShowAddNewActivity] = useState<boolean>(false)
  const [newActivityName, setNewActivityName] = useState<string>('')

  // Derived state
  const goalHours = Math.floor((userSettings?.weekly_goal_minutes || 300) / 60)
  const goalMinutes = (userSettings?.weekly_goal_minutes || 300) % 60

  // Load data
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])
  
  // Update local state when settings change
  useEffect(() => {
    setTempGoalHours(goalHours)
    setTempGoalMinutes(goalMinutes)
  }, [goalHours, goalMinutes])

  const loadUserData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const [settingsResponse, customTypesResponse] = await Promise.all([
        dbHelpers.getUserSettings(),
        dbHelpers.getUserCustomWorkoutTypes()
      ])

      if (settingsResponse.data) {
        setUserSettings(settingsResponse.data)
      }

      if (customTypesResponse.data) {
        const customTypeNames = customTypesResponse.data.map((type: any) => type.name)
        const allTypes = [...new Set([...defaultWorkoutTypes, ...customTypeNames])]
        setWorkoutTypes(allTypes)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setError('Failed to load your data. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }

  // Form handlers
  const handleGoalHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setTempGoalHours(Math.max(0, Math.min(23, value)))
  }, [])

  const handleGoalMinutesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setTempGoalMinutes(Math.max(0, Math.min(59, value)))
  }, [])

  const handleSaveWeeklyGoal = useCallback(async (): Promise<void> => {
    setIsUpdatingGoal(true)
    try {
      const totalMinutes = tempGoalHours * 60 + tempGoalMinutes
      await dbHelpers.updateUserSettings({ weekly_goal_minutes: totalMinutes })
      const newSettings = { ...userSettings, weekly_goal_minutes: totalMinutes }
      setUserSettings(newSettings)
    } catch (error) {
      console.error('Error updating weekly goal:', error)
      setError('Failed to save goal')
    } finally {
      setIsUpdatingGoal(false)
    }
  }, [tempGoalHours, tempGoalMinutes, userSettings])

  const handleDistanceUnitChange = useCallback(async (category: string, unit: string): Promise<void> => {
    const settingKey = category === 'cardio' ? 'distance_unit_cardio' : 'distance_unit_swimming'
    const newSettings = { ...userSettings, [settingKey]: unit }
    setUserSettings(newSettings)

    try {
      await dbHelpers.updateUserSettings({ [settingKey]: unit })
    } catch (error) {
      console.error('Error updating distance preferences:', error)
      setError('Failed to save preferences')
    }
  }, [userSettings])

  const handleAddActivity = useCallback((): void => {
    if (newActivityName.trim()) {
      handleAddNewActivityFromProfile(newActivityName.trim())
      setNewActivityName('')
      setShowAddNewActivity(false)
    }
  }, [newActivityName])

  const handleEditActivity = useCallback((activity: string): void => {
    setEditingActivity(activity)
    setEditingActivityName(activity)
  }, [])

  const handleSaveEditActivity = useCallback((): void => {
    if (editingActivity && editingActivityName.trim()) {
      handleAddNewActivityFromProfile(editingActivityName.trim(), editingActivity)
      setEditingActivity(null)
      setEditingActivityName('')
    }
  }, [editingActivity, editingActivityName])

  const handleCancelEdit = useCallback((): void => {
    setEditingActivity(null)
    setEditingActivityName('')
  }, [])

  const handleDeleteActivity = useCallback(async (activity: string): Promise<void> => {
    if (window.confirm(`Delete "${activity}" activity?`)) {
      try {
        const response = await dbHelpers.deleteCustomWorkoutType(activity)
        if (response.error) {
          console.error('Error deleting custom activity:', response.error)
          setError('Failed to delete activity')
          return
        }
        
        const updatedTypes = workoutTypes.filter(type => type !== activity)
        setWorkoutTypes(updatedTypes)
      } catch (error) {
        console.error('Error deleting custom activity:', error)
        setError('Failed to delete activity')
      }
    }
  }, [workoutTypes])

  const handleAddNewActivityFromProfile = useCallback(async (newType: string, originalActivity?: string): Promise<void> => {
    if (!newType || !newType.trim()) {
      return
    }

    const trimmedType = newType.trim()
    
    if (workoutTypes.includes(trimmedType) && trimmedType !== originalActivity) {
      setError('Activity already exists')
      return
    }

    try {
      if (originalActivity && originalActivity !== trimmedType) {
        const deleteResponse = await dbHelpers.deleteCustomWorkoutType(originalActivity)
        if (deleteResponse.error) {
          console.error('Error deleting old activity:', deleteResponse.error)
          setError('Failed to update activity')
          return
        }
      }
      
      if (!originalActivity || originalActivity !== trimmedType) {
        const response = await dbHelpers.addCustomWorkoutType(trimmedType)
        if (response.error) {
          console.error('Error adding/updating activity:', response.error)
          setError('Failed to save activity')
          return
        }
      }
      
      let updatedTypes: string[]
      if (originalActivity && originalActivity !== trimmedType) {
        updatedTypes = workoutTypes.map(type => 
          type === originalActivity ? trimmedType : type
        )
      } else if (!workoutTypes.includes(trimmedType)) {
        updatedTypes = [...workoutTypes, trimmedType]
      } else {
        updatedTypes = workoutTypes
      }
      
      setWorkoutTypes(updatedTypes)
      setError('')
    } catch (error) {
      console.error('Error adding/updating activity:', error)
      setError('Failed to save activity')
    }
  }, [workoutTypes])

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Error signing out:', error)
        setError('Failed to sign out. Please try again.')
      } else {
        // Redirect to main page after successful sign out
        router.push('/')
      }
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    }
  }, [signOut, router])

  // Get custom activities (filter out default ones)
  const customActivities = workoutTypes.filter(type => 
    !defaultWorkoutTypes.includes(type)
  )

  if (loading || !isHydrated) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-purple-200">Customize your preferences</p>
          </div>
          <StandardNavigation currentPage="profile" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 mb-4">
          <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4">
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* User Info */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user?.email}</h2>
              <p className="text-gray-600">Athletic Tracker User</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Weekly Goal Settings */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span>Weekly Goal</span>
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Hours</label>
                <input
                  type="number"
                  value={tempGoalHours}
                  onChange={handleGoalHoursChange}
                  min="0"
                  max="23"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Minutes</label>
                <input
                  type="number"
                  value={tempGoalMinutes}
                  onChange={handleGoalMinutesChange}
                  min="0"
                  max="59"
                  step="5"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            {(tempGoalHours !== goalHours || tempGoalMinutes !== goalMinutes) && (
              <button
                onClick={handleSaveWeeklyGoal}
                disabled={isUpdatingGoal}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isUpdatingGoal
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg'
                }`}
              >
                {isUpdatingGoal ? 'Saving...' : 'Save Weekly Goal'}
              </button>
            )}
            <p className="text-sm text-gray-600">
              Current goal: {formatTime(goalHours * 60 + goalMinutes)} per week
            </p>
          </div>
        </div>

        {/* Distance Unit Preferences */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <span>Distance Units</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Cardio Activities</label>
              <div className="grid grid-cols-2 gap-3">
                {distanceUnits.cardio.map((unit: string) => (
                  <button
                    key={unit}
                    onClick={() => handleDistanceUnitChange('cardio', unit)}
                    className={`p-3 rounded-lg font-medium transition-all ${
                      userSettings.distance_unit_cardio === unit
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Swimming Activities</label>
              <div className="grid grid-cols-2 gap-3">
                {distanceUnits.swimming.map((unit: string) => (
                  <button
                    key={unit}
                    onClick={() => handleDistanceUnitChange('swimming', unit)}
                    className={`p-3 rounded-lg font-medium transition-all ${
                      userSettings.distance_unit_swimming === unit
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Activities */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-600" />
              <span>Custom Activities</span>
            </h3>
            <button
              onClick={() => setShowAddNewActivity(true)}
              className="py-2 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 text-sm"
            >
              Add Activity
            </button>
          </div>
          
          {customActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No custom activities yet</p>
              <p className="text-gray-400 text-sm">Add activities like Rowing, Basketball, or Yoga</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customActivities.map((activity: string) => (
                <div key={activity} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingActivity === activity ? (
                    <div className="flex-1 flex items-center space-x-3">
                      <input
                        type="text"
                        value={editingActivityName}
                        onChange={(e) => setEditingActivityName(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded focus:border-purple-500 focus:outline-none"
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            handleSaveEditActivity()
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEditActivity}
                        className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-800">{activity}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditActivity(activity)}
                          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity)}
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add New Activity Modal */}
      {showAddNewActivity && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 m-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Custom Activity</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Activity Name</label>
                <input
                  type="text"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  placeholder="e.g., Rowing, Basketball, Yoga"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      handleAddActivity()
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddNewActivity(false)
                  setNewActivityName('')
                }}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddActivity}
                disabled={!newActivityName.trim()}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  !newActivityName.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg'
                }`}
              >
                Add Activity
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackButton />
    </div>
  )
}
