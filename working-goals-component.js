import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Calendar, TrendingUp, Clock, Zap, Target, ChevronLeft, Activity, User, Flag, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext'
import { dbHelpers } from '../lib/supabase'
import FeedbackButton from './FeedbackButton'

// HELPER FUNCTIONS
const formatTime = (minutes) => {
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

// Helper function to get start of week (Monday)
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

// Enhanced workout types with default types
const defaultWorkoutTypes = ['Swimming', 'Running', 'Cycling', 'Weight Training', 'Dryland', 'CrossFit', 'Walking', 'Soccer', 'Tennis', 'Other'];

// Distance unit options
const distanceUnits = {
  cardio: ['miles', 'kilometers'],
  swimming: ['meters', 'yards']
};

const ratingLabels = {
  1: { label: 'Rough', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Decent', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
};

// HISTORY VIEW COMPONENT
const HistoryView = ({ setCurrentView, weeklyStats, workouts, ratingLabels, formatTime, setShowLogAnother }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('log')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Your Journey</h1>
            <p className="text-purple-200">Every workout counts</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowLogAnother && setShowLogAnother()}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('goals')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Flag className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <User className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{formatTime(weeklyStats.totalTime)}</p>
            <p className="text-purple-200 text-sm">Total Time</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{weeklyStats.count} workouts</p>
            <p className="text-purple-200 text-sm">This Week</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{weeklyStats.avgRating.toFixed(1)}</p>
            <p className="text-purple-200 text-sm">Avg Feel</p>
          </div>
        </div>
      </div>

      {/* Add Workout Button */}
      <div className="px-6 mb-6">
        <button
          onClick={() => setShowLogAnother && setShowLogAnother()}
          className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add Workout</span>
        </button>
      </div>
      
      {/* Workout List */}
      <div className="px-6 pb-8">
        <div className="space-y-4">
          {workouts.map((workout, index) => {
            const ratingConfig = ratingLabels[workout.rating];
            
            // Fix: Create date object that interprets the date string as local, not UTC
            const dateParts = workout.date.split('-');
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // year, month-1, day
            
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            // Enhanced date comparison and formatting with day of week
            const isToday = date.toDateString() === today.toDateString();
            const isYesterday = date.toDateString() === yesterday.toDateString();
            
            let dateLabel;
            if (isToday) {
              dateLabel = 'Today';
            } else if (isYesterday) {
              dateLabel = 'Yesterday';
            } else {
              // Format with day of week for older dates
              const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
              const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              dateLabel = `${dayOfWeek}, ${monthDay}`;
            }

            return (
              <div key={workout.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{workout.workout_type}</h3>
                      <span className="text-sm font-medium text-gray-500">{dateLabel}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(workout.duration)}</span>
                      </div>
                      {workout.distance && (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <span>📏</span>
                          <span>{workout.distance} {workout.distance_unit}</span>
                        </div>
                      )}
                      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${ratingConfig.color} text-white text-sm font-medium`}>
                        <span>{ratingConfig.emoji}</span>
                        <span>{ratingConfig.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${ratingConfig.color} flex items-center justify-center text-2xl`}>
                      {ratingConfig.emoji}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-xl font-bold text-white mb-2">Start Your Journey</h3>
            <p className="text-purple-200 mb-6">Log your first workout to see your progress here</p>
            <button
              onClick={() => setCurrentView('log')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              Log First Workout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// LOG WORKOUT VIEW COMPONENT
const LogWorkoutView = ({
  currentWorkout,
  setCurrentWorkout,
  workoutTypes,
  ratingLabels,
  handleDurationChange,
  handleDistanceChange,
  handleDistanceUnitChange,
  handleDateChange,
  handleSubmit,
  isSubmitting,
  showSuccess,
  error,
  setCurrentView,
  weeklyGoalProgress,
  weeklyStats,
  weeklyStreak,
  showDatePicker,
  distanceUnit,
  getDistanceUnitOptions,
  showAddWorkoutType,
  setShowAddWorkoutType,
  handleAddCustomType,
  handleShowSuccessMessage
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Success Animation */}
      {showSuccess && handleShowSuccessMessage()}

      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Log Workout</h1>
            <p className="text-blue-200">Keep the momentum going</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('goals')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Flag className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Calendar className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <User className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200 text-sm">Weekly Goal</span>
            </div>
            <p className="text-2xl font-bold text-white">{weeklyGoalProgress.current}</p>
            <div className="w-full bg-gray-300 rounded-full h-3 mt-2 relative overflow-hidden">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500 absolute" 
                style={{width: `${Math.min(weeklyGoalProgress.percentage, 100)}%`}}
              ></div>
              {weeklyGoalProgress.percentage > 100 && (
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-amber-600 h-3 rounded-full transition-all duration-500 absolute"
                  style={{
                    left: '100%',
                    width: `${Math.min(weeklyGoalProgress.percentage - 100, 100)}%`,
                    transform: 'translateX(-100%)'
                  }}
                ></div>
              )}
              <div 
                className="absolute bg-gray-500 rounded-full"
                style={{
                  left: '100%',
                  top: '-4px',
                  width: '2px',
                  height: '20px',
                  transform: 'translateX(-50%)'
                }}
              ></div>
            </div>
            <p className="text-blue-200 text-xs mt-1">
              {weeklyGoalProgress.percentage}% of {weeklyGoalProgress.goal}
              {weeklyGoalProgress.percentage >= 100 && " 🎯"}
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-blue-200 text-sm">This Week</span>
            </div>
            <p className="text-2xl font-bold text-white">{weeklyStats.count} workouts</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-blue-200 text-sm">Weekly Streak</span>
            </div>
            <p className="text-2xl font-bold text-white">{weeklyStreak} weeks</p>
          </div>
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

      {/* Form */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {/* Workout Type */}
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-4">What did you do?</label>
            <div className="grid grid-cols-2 gap-3">
              {workoutTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setCurrentWorkout(prev => ({ ...prev, type }))}
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    currentWorkout.type === type
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <span className="font-medium">{type}</span>
                </button>
              ))}
              <button
                onClick={() => setShowAddWorkoutType(true)}
                className="p-4 rounded-xl transition-all duration-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105 border-2 border-dashed border-gray-300"
              >
                <span className="font-medium">+ Add Activity</span>
              </button>
            </div>
            
            {/* Add Custom Workout Type Modal */}
            {showAddWorkoutType && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl p-6 m-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Add Custom Activity</h3>
                  <input
                    type="text"
                    placeholder="e.g., Rowing, Basketball"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none mb-4"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomType(e.target.value);
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAddWorkoutType(false)}
                      className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => {
                        const input = e.target.parentElement.parentElement.querySelector('input');
                        handleAddCustomType(input.value);
                      }}
                      className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-4">How long? (minutes)</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={currentWorkout.duration}
                onChange={handleDurationChange}
                placeholder="45"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none text-lg transition-colors"
              />
            </div>
          </div>
          
          {/* Distance (Optional) */}
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-4">Distance (optional)</label>
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={currentWorkout.distance || ''}
                  onChange={handleDistanceChange}
                  placeholder="5.2"
                  autoComplete="off"
                  inputMode="decimal"
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none text-lg transition-colors"
                />
              </div>
              <div className="w-28">
                <select
                  value={currentWorkout.distanceUnit || distanceUnit}
                  onChange={handleDistanceUnitChange}
                  className="w-full px-3 py-4 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none text-lg transition-colors bg-white"
                >
                  {getDistanceUnitOptions().map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Date Picker (Conditional) */}
          {showDatePicker && (
            <div className="mb-8">
              <label className="block text-gray-800 font-semibold mb-4">Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={currentWorkout.date || ''}
                  onChange={handleDateChange}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none text-lg transition-colors"
                />
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-4">How did it go?</label>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(ratingLabels).map(([rating, config]) => (
                <button
                  key={rating}
                  onClick={() => setCurrentWorkout(prev => ({ ...prev, rating: parseInt(rating) }))}
                  className={`p-6 rounded-xl transition-all duration-200 ${
                    currentWorkout.rating === parseInt(rating)
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg scale-105`
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <div className="text-3xl mb-2">{config.emoji}</div>
                  <div className="font-medium">{config.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!currentWorkout.type || !currentWorkout.duration || !currentWorkout.rating || isSubmitting}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              !currentWorkout.type || !currentWorkout.duration || !currentWorkout.rating || isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Logging...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Log Workout</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// GOALS VIEW COMPONENT
const GoalsView = ({ setCurrentView }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('log')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Goals</h1>
            <p className="text-green-200">Track your journey to greatness</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('log')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Calendar className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <User className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-white mb-2">Goals Feature Coming Soon</h3>
          <p className="text-green-200 mb-6">Event banking and goal tracking will be available in the next update</p>
        </div>
      </div>
    </div>
  );
};

// PROFILE VIEW COMPONENT
const ProfileView = ({ 
  setCurrentView, 
  user, 
  userSettings, 
  handleDistancePreferencesChange,
  goalHours,
  goalMinutes,
  handleWeeklyGoalChange,
  handleSignOut,
  // NEW PROPS FOR CUSTOM ACTIVITIES
  showAddNewActivity,
  setShowAddNewActivity,
  newActivityName,
  setNewActivityName,
  handleDeleteCustomActivity,
  handleAddNewActivityFromProfile,
  workoutTypes
}) => {
  // Get custom activities from workoutTypes array (excludes default types)
  const customActivities = workoutTypes.filter(type => 
    !defaultWorkoutTypes.includes(type)
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('log')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-green-200">Account & Settings</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('log')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('goals')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Flag className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <Calendar className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {/* User Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Athletic Tracker</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>

          {/* Distance Preferences */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">DISTANCE UNITS</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Running/Cycling Distance
                </label>
                <select
                  value={userSettings?.distance_unit_cardio || 'miles'}
                  onChange={(e) => handleDistancePreferencesChange('cardio', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="miles">Miles</option>
                  <option value="kilometers">Kilometers</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Swimming Distance
                </label>
                <select
                  value={userSettings?.distance_unit_swimming || 'meters'}
                  onChange={(e) => handleDistancePreferencesChange('swimming', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="meters">Meters</option>
                  <option value="yards">Yards</option>
                </select>
</div>
</div>
</div>

          {/* CUSTOM ACTIVITIES SECTION - NEW */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">CUSTOM ACTIVITIES</h3>
            
            <div className="space-y-4">
              {/* List existing custom activities */}
              {customActivities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium mb-3">Your custom activities:</p>
                  {customActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{activity}</span>
                      <button
                        onClick={() => handleDeleteCustomActivity(activity)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add new activity button */}
              {!showAddNewActivity ? (
                <button
                  onClick={() => setShowAddNewActivity(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  + Add Custom Activity
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    placeholder="e.g., Rowing, Basketball"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNewActivityFromProfile();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowAddNewActivity(false);
                        setNewActivityName('');
                      }}
                      className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNewActivityFromProfile}
                      className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                    >
                      Add Activity
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* Weekly Goal Setting */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">WEEKLY GOAL</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              Weekly workout goal: {goalHours}h {goalMinutes > 0 ? `${goalMinutes}m` : ''} per week
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hours</label>
                <select
                  value={goalHours}
                  onChange={(e) => handleWeeklyGoalChange(parseInt(e.target.value), goalMinutes)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {Array.from({length: 14}, (_, i) => i + 2).map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Minutes</label>
                <select
                  value={goalMinutes}
                  onChange={(e) => handleWeeklyGoalChange(goalHours, parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>0</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Your goal:</strong> {goalHours}h {goalMinutes > 0 ? `${goalMinutes}m` : ''} per week 
              ({Math.round((goalHours * 60 + goalMinutes) / 7)} minutes per day average)
            </p>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">ACCOUNT</h3>
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="text-gray-700 font-medium">Sign Out</span>
          </div>
        </button>
      </div>

      {/* App Info */}
      <div className="text-center pt-6 border-t">
        <p className="text-gray-500 text-sm">Athletic Tracker MVP v2.0</p>
        <p className="text-gray-400 text-xs mt-1">Cloud sync enabled</p>
      </div>
    </div>
  </div>
</div>
);
};
// MAIN ATHLETIC TRACKER COMPONENT
const AthleticTracker = () => {
const { user, signOut } = useAuth();
// State Management
const [currentView, setCurrentView] = useState('log');
const [currentWorkout, setCurrentWorkout] = useState({
type: '',
duration: '',
rating: null,
date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
distance: '',
distanceUnit: ''
});
const [workouts, setWorkouts] = useState([]);
const [workoutTypes, setWorkoutTypes] = useState(defaultWorkoutTypes);
const [isSubmitting, setIsSubmitting] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);
const [error, setError] = useState('');
const [showLogAnother, setShowLogAnother] = useState(false);
const [showDatePicker, setShowDatePicker] = useState(false);
const [showAddWorkoutType, setShowAddWorkoutType] = useState(false);
  
  // Custom activity management state for profile page
  const [showAddNewActivity, setShowAddNewActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
// User Settings State
const [userSettings, setUserSettings] = useState({
distance_unit_cardio: 'miles',
distance_unit_swimming: 'meters',
weekly_goal_minutes: 300 // 5 hours default
});
// Weekly goal state (derived from userSettings)
const goalHours = Math.floor((userSettings?.weekly_goal_minutes || 300) / 60);
const goalMinutes = (userSettings?.weekly_goal_minutes || 300) % 60;
// Load initial data
useEffect(() => {
if (user) {
loadUserData();
}
}, [user]);
// Load initial data
const loadUserData = async () => {
try {
const [workoutsResponse, settingsResponse, customTypesResponse] = await Promise.all([
dbHelpers.getUserWorkouts(),
dbHelpers.getUserSettings(),
dbHelpers.getUserCustomWorkoutTypes()
]);

// Handle workouts response
if (workoutsResponse.data) {
setWorkouts(workoutsResponse.data);
}

// Handle settings response
if (settingsResponse.data) {
setUserSettings(settingsResponse.data);
}

// Handle custom workout types from table
if (customTypesResponse.data) {
const customTypeNames = customTypesResponse.data.map(type => type.name);
const allTypes = [...new Set([...defaultWorkoutTypes, ...customTypeNames])];
setWorkoutTypes(allTypes);
}
} catch (error) {
console.error('Error loading user data:', error);
setError('Failed to load your data. Please refresh the page.');
}
};
// Input handlers with proper regex validation (FIXED)
const handleDurationChange = useCallback((e) => {
const value = e.target.value;
// FIXED: Use single backslash for proper regex escaping
if (value === '' || /^\d+$/.test(value)) {
setCurrentWorkout(prev => ({ ...prev, duration: value }));
}
}, []);
const handleDistanceChange = useCallback((e) => {
const value = e.target.value;
// FIXED: Allow decimal numbers for distance
if (value === '' || /^\d*.?\d*$/.test(value)) {
setCurrentWorkout(prev => ({ ...prev, distance: value }));
}
}, []);
const handleDistanceUnitChange = useCallback((e) => {
const unit = e.target.value;
setCurrentWorkout(prev => ({ ...prev, distanceUnit: unit }));
}, []);
const handleDateChange = useCallback((e) => {
setCurrentWorkout(prev => ({ ...prev, date: e.target.value }));
}, []);
// Distance unit options based on workout type
const getDistanceUnitOptions = useCallback(() => {
const workoutType = currentWorkout.type?.toLowerCase() || '';
if (workoutType.includes('swim')) {
return distanceUnits.swimming;
}
return distanceUnits.cardio;
}, [currentWorkout.type]);
// Get appropriate distance unit based on workout type and user preferences
const distanceUnit = useMemo(() => {
const workoutType = currentWorkout.type?.toLowerCase() || '';
if (workoutType.includes('swim')) {
return userSettings?.distance_unit_swimming || 'meters';
}
return userSettings?.distance_unit_cardio || 'miles';
}, [currentWorkout.type, userSettings]);
// Handle custom workout type addition
const handleAddCustomType = useCallback(async (customType) => {
if (!customType.trim()) {
setShowAddWorkoutType(false);
return;
}
const newType = customType.trim();
if (workoutTypes.includes(newType)) {
  setShowAddWorkoutType(false);
  return;
}

try {
  // Save to database table
  const response = await dbHelpers.addCustomWorkoutType(newType);
  if (response.error) {
    console.error('Error saving custom workout type:', response.error);
    setError('Failed to save custom activity');
    return;
  }

  // Update local state
  const updatedTypes = [...workoutTypes, newType];
  setWorkoutTypes(updatedTypes);

  // Select the new type and close modal
  setCurrentWorkout(prev => ({ ...prev, type: newType }));
  setShowAddWorkoutType(false);
} catch (error) {
  console.error('Error saving custom workout type:', error);
  setError('Failed to save custom activity');
}
}, [workoutTypes]);
// Distance preferences change handler
const handleDistancePreferencesChange = useCallback(async (category, unit) => {
const settingKey = category === 'cardio' ? 'distance_unit_cardio' : 'distance_unit_swimming';
const newSettings = { ...userSettings, [settingKey]: unit };
setUserSettings(newSettings);

try {
  await dbHelpers.updateUserSettings({ [settingKey]: unit });
} catch (error) {
  console.error('Error updating distance preferences:', error);
  setError('Failed to save preferences');
}
}, [userSettings]);

  // Delete custom activity from profile
  const handleDeleteCustomActivity = useCallback(async (activityToDelete) => {
    try {
      // Delete from database table
      const response = await dbHelpers.deleteCustomWorkoutType(activityToDelete);
      if (response.error) {
        console.error('Error deleting custom activity:', response.error);
        setError('Failed to delete activity');
        return;
      }
      
      // Update local state - remove from workout types list
      const updatedTypes = workoutTypes.filter(type => type !== activityToDelete);
      setWorkoutTypes(updatedTypes);
      
    } catch (error) {
      console.error('Error deleting custom activity:', error);
      setError('Failed to delete activity');
    }
  }, [workoutTypes]);

  // Add new activity from profile page
  const handleAddNewActivityFromProfile = useCallback(async () => {
    if (!newActivityName.trim()) {
      return;
    }

    const newType = newActivityName.trim();
    
    // Check if already exists
    if (workoutTypes.includes(newType)) {
      setError('Activity already exists');
      return;
    }

    try {
      // Save to database table
      const response = await dbHelpers.addCustomWorkoutType(newType);
      if (response.error) {
        console.error('Error adding new activity:', response.error);
        setError('Failed to add activity');
        return;
      }
      
      // Update local state
      const updatedTypes = [...workoutTypes, newType];
      setWorkoutTypes(updatedTypes);
      
      // Reset form
      setNewActivityName('');
      setShowAddNewActivity(false);
      
    } catch (error) {
      console.error('Error adding new activity:', error);
      setError('Failed to add activity');
    }
  }, [newActivityName, workoutTypes]);
// Weekly goal change handler
const handleWeeklyGoalChange = useCallback(async (hours, minutes) => {
const totalMinutes = hours * 60 + minutes;
const newSettings = { ...userSettings, weekly_goal_minutes: totalMinutes };
setUserSettings(newSettings);

try {
await dbHelpers.updateUserSettings({ weekly_goal_minutes: totalMinutes });
} catch (error) {
  console.error('Error updating weekly goal:', error);
  setError('Failed to save goal');
}
}, [userSettings]);
// Sign out handler
const handleSignOut = useCallback(async () => {
try {
const { error } = await signOut();
if (error) {
  console.error('Error signing out:', error);
  setError('Failed to sign out. Please try again.');
} else {
  // Sign out successful - user will be redirected by auth state change
  console.log('Successfully signed out');
}
} catch (error) {
console.error('Error signing out:', error);
setError('Failed to sign out. Please try again.');
}
}, [signOut, setError]);
// Submit workout
const handleSubmit = useCallback(async () => {
if (!currentWorkout.type || !currentWorkout.duration || !currentWorkout.rating) {
setError('Please fill in all required fields');
return;
}
setIsSubmitting(true);
setError('');

try {
const workoutData = {
type: currentWorkout.type,
duration: parseInt(currentWorkout.duration),
rating: currentWorkout.rating,
date: currentWorkout.date,
distance: currentWorkout.distance ? parseFloat(currentWorkout.distance) : null,
distance_unit: currentWorkout.distance ? (currentWorkout.distanceUnit || distanceUnit) : null
};

  await dbHelpers.createWorkout(workoutData);
  
  // Reload workouts
  const updatedWorkoutsResponse = await dbHelpers.getUserWorkouts();
  if (updatedWorkoutsResponse.data) {
        setWorkouts(updatedWorkoutsResponse.data);
      }
  
  // Show success and reset form
  setShowSuccess(true);
  setCurrentWorkout({
  type: '',
  duration: '',
  rating: null,
  date: new Date().toISOString().split('T')[0],
  distance: '',
  distanceUnit: ''
  });
  setShowDatePicker(false);
  
  // Hide success after 2 seconds and navigate to history
  setTimeout(() => {
        setShowSuccess(false);
        setCurrentView('history');
      }, 2000);
  
} catch (error) {
  console.error('Error submitting workout:', error);
  setError('Failed to save workout. Please try again.');
} finally {
  setIsSubmitting(false);
}
}, [currentWorkout, distanceUnit]);
// Success message handler
const handleShowSuccessMessage = useCallback(() => {
return (
<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
<div className="bg-white rounded-3xl p-8 m-6 text-center max-w-sm animate-bounce">
<div className="text-6xl mb-4">🎉</div>
<h3 className="text-2xl font-bold text-gray-800 mb-2">Workout Logged!</h3>
<p className="text-gray-600 mb-6">Great job keeping up the momentum!</p>
</div>
</div>
);
}, []);
// Log another workout handler
const handleLogAnother = useCallback(() => {
setCurrentView('log');
setShowLogAnother(true);
setShowDatePicker(true);
setCurrentWorkout(prev => ({
...prev,
type: '',
duration: '',
rating: null,
distance: '',
distanceUnit: ''
}));
}, []);
// Calculate weekly stats
const weeklyStats = useMemo(() => {
const now = new Date();
const weekStart = getWeekStart(now);
const weekEnd = new Date(weekStart);
weekEnd.setDate(weekEnd.getDate() + 6);
const thisWeekWorkouts = workouts.filter(workout => {
  const workoutDate = new Date(workout.date + 'T00:00:00'); // Ensure local timezone
  return workoutDate >= weekStart && workoutDate <= weekEnd;
});

const totalTime = thisWeekWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
const avgRating = thisWeekWorkouts.length > 0 
  ? thisWeekWorkouts.reduce((sum, workout) => sum + workout.rating, 0) / thisWeekWorkouts.length 
  : 0;

return {
  count: thisWeekWorkouts.length,
  totalTime,
  avgRating
};
}, [workouts]);
// Calculate weekly goal progress
const weeklyGoalProgress = useMemo(() => {
const goalMinutes = userSettings?.weekly_goal_minutes || 300;
const currentMinutes = weeklyStats.totalTime;
const percentage = Math.round((currentMinutes / goalMinutes) * 100);
return {
  current: formatTime(currentMinutes),
  goal: formatTime(goalMinutes),
  percentage
};
}, [weeklyStats.totalTime, userSettings?.weekly_goal_minutes]);
// Calculate weekly streak
const weeklyStreak = useMemo(() => {
// This is a simplified calculation - you might want to implement a more sophisticated streak calculation
let streak = 0;
const now = new Date();
for (let i = 0; i < 52; i++) { // Check up to 52 weeks
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - (i * 7) - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const weekWorkouts = workouts.filter(workout => {
    const workoutDate = new Date(workout.date + 'T00:00:00');
    return workoutDate >= weekStart && workoutDate <= weekEnd;
  });
  
  if (weekWorkouts.length > 0) {
    streak++;
  } else {
    break;
  }
}

return streak;
}, [workouts]);
// Render appropriate view
if (currentView === 'history') {
return (
<HistoryView
setCurrentView={setCurrentView}
weeklyStats={weeklyStats}
workouts={workouts}
ratingLabels={ratingLabels}
formatTime={formatTime}
setShowLogAnother={() => {
setCurrentView('log');
setShowLogAnother(true);
setShowDatePicker(true);
}}
/>
);
}
if (currentView === 'goals') {
return <GoalsView setCurrentView={setCurrentView} />;
}
if (currentView === 'profile') {
return (
<ProfileView
     setCurrentView={setCurrentView}
     user={user}
     userSettings={userSettings}
     handleDistancePreferencesChange={handleDistancePreferencesChange}
     goalHours={goalHours}
     goalMinutes={goalMinutes}
     handleWeeklyGoalChange={handleWeeklyGoalChange}
     handleSignOut={handleSignOut}
     showAddNewActivity={showAddNewActivity}
     setShowAddNewActivity={setShowAddNewActivity}
     newActivityName={newActivityName}
     setNewActivityName={setNewActivityName}
     handleDeleteCustomActivity={handleDeleteCustomActivity}
     handleAddNewActivityFromProfile={handleAddNewActivityFromProfile}
     workoutTypes={workoutTypes}
   />
);
}
// Default: Log Workout View
return (
<>
<LogWorkoutView
     currentWorkout={currentWorkout}
     setCurrentWorkout={setCurrentWorkout}
     workoutTypes={workoutTypes}
     ratingLabels={ratingLabels}
     handleDurationChange={handleDurationChange}
     handleDistanceChange={handleDistanceChange}
     handleDistanceUnitChange={handleDistanceUnitChange}
     handleDateChange={handleDateChange}
     handleSubmit={handleSubmit}
     isSubmitting={isSubmitting}
     showSuccess={showSuccess}
     error={error}
     setCurrentView={setCurrentView}
     weeklyGoalProgress={weeklyGoalProgress}
     weeklyStats={weeklyStats}
     weeklyStreak={weeklyStreak}
     showDatePicker={showDatePicker}
     distanceUnit={distanceUnit}
     getDistanceUnitOptions={getDistanceUnitOptions}
     showAddWorkoutType={showAddWorkoutType}
     setShowAddWorkoutType={setShowAddWorkoutType}
     handleAddCustomType={handleAddCustomType}
     handleShowSuccessMessage={handleShowSuccessMessage}
   />
<FeedbackButton />
</>
);
};
export default AthleticTracker;