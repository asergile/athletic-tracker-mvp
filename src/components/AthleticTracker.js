import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Calendar, TrendingUp, Clock, Zap, Target, ChevronLeft, Activity, User, Flag, LogOut, Trash2, Edit, BarChart3, Mic } from 'lucide-react';
import { useAuth } from '../lib/AuthContext'
import { dbHelpers, supabase } from '../lib/supabase'
import FeedbackButton from './FeedbackButton'
import WeeklyWorkoutView from './WeeklyWorkoutView'
import VoiceRecorder from './VoiceRecorder'

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

// Streamlined default workout types - users add custom activities as needed
const defaultWorkoutTypes = ['Walking', 'Running', 'Swimming', 'Dryland'];

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
const HistoryView = ({ setCurrentView, weeklyStats, workouts, ratingLabels, formatTime, setShowLogAnother, onWorkoutUpdated, onWorkoutDeleted }) => {
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Distance unit options based on workout type for edit modal
  const getEditDistanceUnitOptions = () => {
    const workoutType = editingWorkout.type?.toLowerCase() || '';
    if (workoutType.includes('swim')) {
      return distanceUnits.swimming;
    }
    return distanceUnits.cardio;
  };
  
  const handleEditWorkout = (workout) => {
    setEditingWorkout({
      ...workout,
      // Convert workout_type to type for form compatibility
      type: workout.workout_type,
      // Ensure distance is string for form
      distance: workout.distance ? workout.distance.toString() : '',
      distanceUnit: workout.distance_unit || 'miles'
    });
    setError('');
  };
  
  const handleSaveWorkout = async () => {
    if (!editingWorkout.type || !editingWorkout.duration || !editingWorkout.rating) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const workoutData = {
        type: editingWorkout.type,
        duration: parseInt(editingWorkout.duration),
        rating: editingWorkout.rating,
        date: editingWorkout.date,
        distance: editingWorkout.distance ? parseFloat(editingWorkout.distance) : null,
        distance_unit: editingWorkout.distance ? editingWorkout.distanceUnit : null
      };
      
      const { error } = await dbHelpers.updateWorkout(editingWorkout.id, workoutData);
      
      if (error) {
        throw error;
      }
      
      setEditingWorkout(null);
      if (onWorkoutUpdated) {
        onWorkoutUpdated();
      }
    } catch (err) {
      console.error('Error updating workout:', err);
      setError('Failed to update workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteWorkout = async () => {
    if (!confirm('Are you sure you want to delete this workout? This cannot be undone.')) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { error } = await dbHelpers.deleteWorkout(editingWorkout.id);
      
      if (error) {
        throw error;
      }
      
      setEditingWorkout(null);
      if (onWorkoutDeleted) {
        onWorkoutDeleted();
      }
    } catch (err) {
      console.error('Error deleting workout:', err);
      setError('Failed to delete workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('log')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
            title="Back to Log Workout"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Your Journey</h1>
            <p className="text-purple-200 text-sm sm:text-base">Every workout counts</p>
          </div>
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowLogAnother && setShowLogAnother()}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Add Workout"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('weekly')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Weekly View"
            >
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('goals')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Goals"
            >
              <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Profile"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Cards - Mobile Responsive */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{formatTime(weeklyStats.totalTime)}</p>
            <p className="text-purple-200 text-xs sm:text-sm">Total Time</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
            <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-green-400 mx-auto mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyStats.count} workouts</p>
            <p className="text-purple-200 text-xs sm:text-sm">This Week</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
            <Target className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyStats.avgRating.toFixed(1)}</p>
            <p className="text-purple-200 text-xs sm:text-sm">Avg Feel</p>
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
              <div key={workout.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 relative">
                {/* Edit Icon - Mobile Responsive */}
                <button
                  onClick={() => handleEditWorkout(workout)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 border border-gray-200 z-10 touch-manipulation"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-10 sm:pr-12"> {/* Mobile responsive padding for edit button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">{workout.workout_type}</h3>
                      <span className="text-xs sm:text-sm font-medium text-gray-500">{dateLabel}</span>
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
      
      {/* Edit Workout Modal */}
      {editingWorkout && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl p-6 m-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Workout</h3>
              <button
                onClick={() => setEditingWorkout(null)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ×
              </button>
            </div>
            
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4 mb-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Workout Type */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Activity</label>
                <input
                  type="text"
                  value={editingWorkout.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setEditingWorkout(prev => {
                      // Auto-update distance unit when activity type changes
                      const workoutType = newType.toLowerCase();
                      let defaultUnit = prev.distanceUnit;
                      
                      if (workoutType.includes('swim')) {
                        defaultUnit = 'meters';
                      } else {
                        defaultUnit = 'miles';
                      }
                      
                      return { ...prev, type: newType, distanceUnit: defaultUnit };
                    });
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={editingWorkout.duration}
                  onChange={(e) => setEditingWorkout(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Distance */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Distance (optional)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={editingWorkout.distance}
                    onChange={(e) => setEditingWorkout(prev => ({ ...prev, distance: e.target.value }))}
                    placeholder="5.2"
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <select
                    value={editingWorkout.distanceUnit}
                    onChange={(e) => setEditingWorkout(prev => ({ ...prev, distanceUnit: e.target.value }))}
                    className="w-24 p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                  >
                    {getEditDistanceUnitOptions().map(unit => (
                      <option key={unit} value={unit}>
                        {unit === 'miles' ? 'mi' : unit === 'kilometers' ? 'km' : unit === 'meters' ? 'm' : 'yd'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Date */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={editingWorkout.date}
                  onChange={(e) => setEditingWorkout(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Rating */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">How did it go?</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ratingLabels).map(([rating, config]) => (
                    <button
                      key={rating}
                      onClick={() => setEditingWorkout(prev => ({ ...prev, rating: parseInt(rating) }))}
                      className={`p-3 rounded-lg transition-all duration-200 ${editingWorkout.rating === parseInt(rating)
                        ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-lg mb-1">{config.emoji}</div>
                      <div className="text-xs font-medium">{config.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleDeleteWorkout}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleSaveWorkout}
                disabled={isSubmitting || !editingWorkout.type || !editingWorkout.duration || !editingWorkout.rating}
                className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
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
              onClick={() => setCurrentView('weekly')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <BarChart3 className="w-6 h-6 text-white" />
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

// GOALS AND EVENTS VIEW COMPONENT
const GoalsAndEventsView = ({ setCurrentView, onGoalCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state - separated Events from Goals
  const [eventData, setEventData] = useState({
    name: '',
    eventDate: '',
    location: '',
    isDiscoverable: false
  });
  
  const [goalData, setGoalData] = useState({
    goalDescription: '',
    weeklyFrequency: 4
  });
  
  const [showSimilarEvents, setShowSimilarEvents] = useState(false);
  const [similarEvents, setSimilarEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  
  // Set default date to 8 weeks from now
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 56); // 8 weeks
    setEventData(prev => ({
      ...prev,
      eventDate: defaultDate.toISOString().split('T')[0]
    }));
  }, []); 
  
  // Load user's goals using existing schema
  const loadGoals = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await dbHelpers.getUserGoals();
      if (result.error) {
        console.error('Error loading goals:', result.error);
        setError('Failed to load goals');
      } else {
        // Sort goals by event date (soonest first)
        const sortedGoals = (result.data || []).sort((a, b) => {
          const dateA = new Date(a.events.event_date);
          const dateB = new Date(b.events.event_date);
          return dateA - dateB; // Ascending order (soonest first)
        });
        setGoals(sortedGoals);
      }
    } catch (err) {
      console.error('Error loading goals:', err);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadGoals();
  }, []);
  
  const handleEventChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
    // Note: Similar events detection disabled for now - using existing schema
  };
  
  const handleGoalChange = (field, value) => {
    setGoalData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleEditGoal = (goal) => {
    setEditingGoal({
      id: goal.id,
      eventId: goal.event_id,
      eventName: goal.events.name,
      eventDate: goal.events.event_date,
      goalDescription: goal.events.goal || ''
    });
    setError('');
  };
  
  const handleSaveGoal = async () => {
    if (!editingGoal.eventName || !editingGoal.eventDate || !editingGoal.goalDescription) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Update the event
      const eventResult = await dbHelpers.updateEvent(editingGoal.eventId, {
        name: editingGoal.eventName,
        eventDate: editingGoal.eventDate,
        goal: editingGoal.goalDescription
      });
      
      if (eventResult.error) {
        throw eventResult.error;
      }
      
      setEditingGoal(null);
      await loadGoals();
      
      if (onGoalCreated) {
        onGoalCreated();
      }
    } catch (err) {
      console.error('Error updating goal:', err);
      setError(`Failed to update goal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteGoal = async () => {
    if (!confirm('Are you sure you want to delete this goal and event? This cannot be undone.')) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Delete the goal first
      const goalResult = await dbHelpers.deleteGoal(editingGoal.id);
      
      if (goalResult.error) {
        throw goalResult.error;
      }
      
      // Then delete the event
      const eventResult = await dbHelpers.deleteEvent(editingGoal.eventId);
      
      if (eventResult.error) {
        throw eventResult.error;
      }
      
      setEditingGoal(null);
      await loadGoals();
      
      if (onGoalCreated) {
        onGoalCreated();
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError(`Failed to delete goal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCreateGoal = async () => {
    if (!eventData.name || !eventData.eventDate || !goalData.goalDescription) {
      setError('Please fill in event name, date, and your goal');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create event first using existing schema
      const eventResult = await dbHelpers.createEvent({
        name: eventData.name,
        eventDate: eventData.eventDate,
        goal: goalData.goalDescription // Store goal description in event
      });
      
      if (eventResult.error) {
        throw eventResult.error;
      }
      
      // Create the personal goal for this event using existing schema
      const goalResult = await dbHelpers.createGoal(eventResult.data.id);
      
      if (goalResult.error) {
        throw goalResult.error;
      }
      
      // Reset form and reload goals
      setEventData({
        name: '',
        eventDate: '',
        location: '',
        isDiscoverable: false
      });
      
      setGoalData({
        goalDescription: '',
        weeklyFrequency: 4
      });
      
      // Set default date again
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 56);
      setEventData(prev => ({
        ...prev,
        eventDate: defaultDate.toISOString().split('T')[0]
      }));
      
      setSelectedEventId(null);
      setShowSimilarEvents(false);
      setSimilarEvents([]);
      setIsCreating(false);
      await loadGoals();
      
      if (onGoalCreated) {
        onGoalCreated();
      }
      
    } catch (err) {
      console.error('Error creating goal:', err);
      setError(`Failed to create goal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const calculatePreviewValues = () => {
    if (!eventData.eventDate) return { daysLeft: '--', targetWorkouts: '--' };
    
    const eventDate = new Date(eventData.eventDate);
    const today = new Date();
    const diffTime = eventDate - today;
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const weeksRemaining = Math.max(0.1, daysLeft / 7);
    const targetWorkouts = Math.ceil(weeksRemaining * goalData.weeklyFrequency);
    
    return { daysLeft, targetWorkouts };
  };
  
  const { daysLeft, targetWorkouts } = calculatePreviewValues();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header - Mobile Responsive */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('log')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
            title="Back to Log Workout"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Goals & Events</h1>
            <p className="text-green-200 text-sm sm:text-base">Train toward your competitions</p>
          </div>
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentView('log')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Add Workout"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('weekly')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Weekly View"
            >
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="History"
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Profile"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 pb-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}
        
        {/* Create New Goal Button - Moved to top */}
        {!isCreating && (
          <div className="mb-6">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Add Event Goal</span>
            </button>
          </div>
        )}
        
        {/* Goal Creation Form - Moved to top */}
        {isCreating && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Add New Goal & Event</h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setShowSimilarEvents(false);
                  setSelectedEventId(null);
                }}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* EVENT SECTION */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  📅 Competition/Event
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name</label>
                    <input
                      type="text"
                      value={eventData.name}
                      onChange={(e) => handleEventChange('name', e.target.value)}
                      placeholder="e.g., State Championships"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date</label>
                      <input
                        type="date"
                        value={eventData.eventDate}
                        onChange={(e) => handleEventChange('eventDate', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location (optional)</label>
                      <input
                        type="text"
                        value={eventData.location}
                        onChange={(e) => handleEventChange('location', e.target.value)}
                        placeholder="e.g., Aquatic Center"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDiscoverable"
                      checked={eventData.isDiscoverable}
                      onChange={(e) => handleEventChange('isDiscoverable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isDiscoverable" className="text-sm text-gray-700">
                      Make this event discoverable by others
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Similar Events Found */}
              {/* Note: Similar events detection disabled - using existing schema */}
              
              {/* GOAL SECTION */}
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  🎯 Your Personal Goal
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">What do you want to achieve at this event?</label>
                    <input
                      type="text"
                      value={goalData.goalDescription}
                      onChange={(e) => handleGoalChange('goalDescription', e.target.value)}
                      placeholder="e.g., Swim PB in 100 freestyle, Break 3:00 marathon"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Weekly Workouts Target</label>
                    <select
                      value={goalData.weeklyFrequency}
                      onChange={(e) => handleGoalChange('weeklyFrequency', parseInt(e.target.value))}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    >
                      {Array.from({length: 21}, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'workout' : 'workouts'} per week
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose your target training frequency (1-21 sessions per week)
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCreateGoal}
                disabled={!eventData.name || !eventData.eventDate || !goalData.goalDescription || isSubmitting}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                  !eventData.name || !eventData.eventDate || !goalData.goalDescription || isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Goal...</span>
                  </div>
                ) : (
                  'Create Event & Goal'
                )}
              </button>
              
              {/* Preview Card */}
              {eventData.name && eventData.eventDate && goalData.goalDescription && (
                <div 
                  className="mt-6 p-4 rounded-xl text-white"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-bold mb-1">
                        {eventData.name}
                      </h3>
                      <div className="text-sm opacity-90 mb-1">
                        {new Date(eventData.eventDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm opacity-75 italic">
                        Goal: {goalData.goalDescription}
                      </div>
                    </div>
                    <div className="text-right text-sm opacity-90">
                      <span className="text-xl font-bold block">{daysLeft}</span>
                      days left
                    </div>
                  </div>
                  
                  <div className="text-sm font-bold mb-2">0 workouts • 0 hours banked</div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white bg-opacity-10 rounded-lg p-2">
                      <h4 className="text-xs opacity-90 mb-1 uppercase tracking-wide">Sessions</h4>
                      <div className="text-sm font-bold">0 of {targetWorkouts}</div>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-lg p-2">
                      <h4 className="text-xs opacity-90 mb-1 uppercase tracking-wide">Hours</h4>
                      <div className="text-sm font-bold">0 of {Math.round(targetWorkouts * 1.3)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Loading your goals...</h3>
            <p className="text-green-200">Syncing your progress</p>
          </div>
        ) : (
          <>
            {/* Banking Cards - Show all cards stacked vertically */}
            {goals.length > 0 && (
              <div className="space-y-4 mb-6">
                {goals.map((goal) => {
                  const progressPercentage = goal.target_workouts > 0 
                    ? (goal.workouts_completed / goal.target_workouts) * 100 
                    : 0;
                  const hoursTarget = Math.round(goal.target_workouts * 1.3); // Estimate ~1.3h per workout
                  
                  return (
                    <div 
                      key={goal.id} 
                      className="banking-card relative"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Edit Icon - Standardized to top-right positioning */}
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="absolute top-4 right-4 w-9 h-9 bg-white bg-opacity-25 hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 z-10"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-16"> {/* Add right padding for edit button */}
                          <h3 className="text-lg font-bold mb-1">{goal.events.name}</h3>
                          <div className="text-sm opacity-90">
                            {new Date(goal.events.event_date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                          {goal.events.goal && (
                            <div className="text-base font-semibold bg-white bg-opacity-20 rounded-lg px-3 py-2 mt-3">
                              🎯 {goal.events.goal}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm opacity-90 flex flex-col items-end pr-12"> {/* Add padding for edit button */}
                          <div>
                            <span className="text-2xl font-bold block">{goal.days_remaining}</span>
                            <span className="text-xs">days left</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-base font-bold mb-2">
                        {goal.workouts_completed} workouts • {goal.hours_completed}h banked
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white bg-opacity-10 rounded-xl p-3">
                          <h4 className="text-xs opacity-90 mb-1 uppercase tracking-wide">Sessions</h4>
                          <div className="text-base font-bold mb-2">
                            {goal.workouts_completed} of {goal.target_workouts}
                          </div>
                          <div className="w-full h-1.5 bg-white bg-opacity-30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-10 rounded-xl p-3">
                          <h4 className="text-xs opacity-90 mb-1 uppercase tracking-wide">Hours</h4>
                          <div className="text-base font-bold mb-2">
                            {goal.hours_completed} of {hoursTarget}
                          </div>
                          <div className="w-full h-1.5 bg-white bg-opacity-30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((goal.hours_completed / hoursTarget) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Empty State */}
            {goals.length === 0 && !isCreating && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">Set Your First Goal</h3>
                <p className="text-green-200 mb-6">Create an event goal to start banking workouts toward your target</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Create First Goal
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl p-6 m-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Goal & Event</h3>
              <button
                onClick={() => setEditingGoal(null)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ×
              </button>
            </div>
            
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4 mb-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  value={editingGoal.eventName}
                  onChange={(e) => setEditingGoal(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="e.g., State Championships"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Event Date */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Event Date</label>
                <input
                  type="date"
                  value={editingGoal.eventDate}
                  onChange={(e) => setEditingGoal(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Goal Description */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Your Goal</label>
                <input
                  type="text"
                  value={editingGoal.goalDescription}
                  onChange={(e) => setEditingGoal(prev => ({ ...prev, goalDescription: e.target.value }))}
                  placeholder="e.g., Swim PB in 100 freestyle"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleDeleteGoal}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleSaveGoal}
                disabled={isSubmitting || !editingGoal.eventName || !editingGoal.eventDate || !editingGoal.goalDescription}
                className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  
  // Local state for editing activities
  const [editingActivityName, setEditingActivityName] = useState(null);
  
  // Local edit handler for custom activities
  const handleLocalEditActivity = useCallback(async () => {
    if (!newActivityName.trim()) {
      return;
    }

    const newType = newActivityName.trim();
    const originalActivity = editingActivityName;
    
    // Check if already exists and we're not editing
    if (workoutTypes.includes(newType) && newType !== originalActivity) {
      // Could set local error state here if needed
      return;
    }

    // Call the parent handler
    await handleAddNewActivityFromProfile(newType, originalActivity);
    
    // Reset local form state
    setNewActivityName('');
    setShowAddNewActivity(false);
    setEditingActivityName(null);
  }, [newActivityName, workoutTypes, editingActivityName, handleAddNewActivityFromProfile, setNewActivityName, setShowAddNewActivity]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header - Mobile Responsive */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('log')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
            title="Back to Log Workout"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Profile</h1>
            <p className="text-green-200 text-sm sm:text-base">Account & Settings</p>
          </div>
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentView('log')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Add Workout"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('weekly')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Weekly View"
            >
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('goals')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Goals"
            >
              <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="History"
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg relative">
                      <span className="text-gray-700 flex-1 pr-20">{activity}</span>
                      <div className="absolute top-3 right-3 flex space-x-2">
                        {/* Edit Icon - Top-right positioning */}
                        <button
                          onClick={() => {
                            setEditingActivityName(activity);
                            setNewActivityName(activity);
                            setShowAddNewActivity(true);
                          }}
                          className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-all duration-200 border border-blue-200"
                        >
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Delete Icon - Top-right positioning */}
                        <button
                          onClick={() => handleDeleteCustomActivity(activity)}
                          className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-all duration-200 border border-red-200"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
                        handleLocalEditActivity();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowAddNewActivity(false);
                        setNewActivityName('');
                        setEditingActivityName(null);
                      }}
                      className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLocalEditActivity}
                      className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                    >
                      {editingActivityName ? 'Update Activity' : 'Add Activity'}
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
const [currentView, setCurrentView] = useState(() => {
  // Check for URL parameters to set initial view (for navigation from WeeklyWorkoutView)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (['log', 'history', 'goals', 'profile', 'weekly'].includes(viewParam)) {
      return viewParam;
    }
  }
  return 'log';
});

// Voice integration state for success modal
const [showVoiceExpanded, setShowVoiceExpanded] = useState(false);
const [isVoiceUploading, setIsVoiceUploading] = useState(false);
const [voiceError, setVoiceError] = useState('');
const [lastLoggedWorkoutId, setLastLoggedWorkoutId] = useState(null);
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
  const [editingActivityName, setEditingActivityName] = useState(null); // Track which activity is being edited
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

// Clean up URL parameters when view changes (for better UX)
useEffect(() => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location);
    if (url.searchParams.has('view')) {
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url);
    }
  }
}, [currentView]);
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

  // Add new activity from profile page (supports both add and edit)
  const handleAddNewActivityFromProfile = useCallback(async (newType, originalActivity) => {
    if (!newType || !newType.trim()) {
      return;
    }

    const trimmedType = newType.trim();
    
    // Check if already exists and we're not editing
    if (workoutTypes.includes(trimmedType) && trimmedType !== originalActivity) {
      setError('Activity already exists');
      return;
    }

    try {
      // If editing an existing activity, delete the old one first
      if (originalActivity && originalActivity !== trimmedType) {
        const deleteResponse = await dbHelpers.deleteCustomWorkoutType(originalActivity);
        if (deleteResponse.error) {
          console.error('Error deleting old activity:', deleteResponse.error);
          setError('Failed to update activity');
          return;
        }
      }
      
      // Save the new/updated activity
      if (!originalActivity || originalActivity !== trimmedType) {
        const response = await dbHelpers.addCustomWorkoutType(trimmedType);
        if (response.error) {
          console.error('Error adding/updating activity:', response.error);
          setError('Failed to save activity');
          return;
        }
      }
      
      // Update local state
      let updatedTypes;
      if (originalActivity && originalActivity !== trimmedType) {
        // Replace old activity with new one
        updatedTypes = workoutTypes.map(type => 
          type === originalActivity ? trimmedType : type
        );
      } else if (!workoutTypes.includes(trimmedType)) {
        // Add new activity
        updatedTypes = [...workoutTypes, trimmedType];
      } else {
        // No change needed
        updatedTypes = workoutTypes;
      }
      
      setWorkoutTypes(updatedTypes);
      setError(''); // Clear any existing errors
      
    } catch (error) {
      console.error('Error adding/updating activity:', error);
      setError('Failed to save activity');
    }
  }, [workoutTypes]);
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

// DEBUG: Log the current workout state
console.log('🐛 DEBUG - currentWorkout before submit:', currentWorkout);

try {
const workoutData = {
type: currentWorkout.type,
duration: parseInt(currentWorkout.duration),
rating: currentWorkout.rating,
date: currentWorkout.date,
distance: currentWorkout.distance ? parseFloat(currentWorkout.distance) : null,
distance_unit: currentWorkout.distance ? (currentWorkout.distanceUnit || distanceUnit) : null
};

// DEBUG: Log the data being sent to database
console.log('🐛 DEBUG - workoutData being sent to DB:', workoutData);

  const workoutResponse = await dbHelpers.createWorkout(workoutData);
  
  // Capture workout ID for voice recording - fix array access
  if (workoutResponse.data && workoutResponse.data.length > 0) {
    setLastLoggedWorkoutId(workoutResponse.data[0].id);
    console.log('🎤 Captured workout ID for voice note:', workoutResponse.data[0].id);
  }
  
  // Reload workouts
  const updatedWorkoutsResponse = await dbHelpers.getUserWorkouts();
  if (updatedWorkoutsResponse.data) {
        setWorkouts(updatedWorkoutsResponse.data);
      }
  
  // Show success and reset form
  setShowSuccess(true);
  setShowVoiceExpanded(false); // Reset voice modal state
  setCurrentWorkout({
type: '',
duration: '',
rating: null,
date: new Date().toISOString().split('T')[0],
distance: '',
distanceUnit: ''
});
  setShowDatePicker(false);
  
  // NOTE: Removed auto-redirect - users now choose between voice note or skip to history
  
} catch (error) {
  console.error('Error submitting workout:', error);
  setError('Failed to save workout. Please try again.');
} finally {
  setIsSubmitting(false);
}
}, [currentWorkout, distanceUnit]);
// Voice note handlers
const handleAddVoiceNote = useCallback(() => {
  setShowVoiceExpanded(true);
  setVoiceError(''); // Clear any previous errors
}, []);

const handleVoiceUpload = useCallback(async (audioBlob) => {
  if (!lastLoggedWorkoutId || !user) {
    setVoiceError('No workout found for voice note');
    return;
  }

  setIsVoiceUploading(true);
  setVoiceError('');

  try {
    // Get auth token - copying from voice-test approach  
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found');
    }

    // Create form data - copying from voice-test approach
    const formData = new FormData();
    formData.append('audio', audioBlob, 'workout-voice-note.webm');
    formData.append('workoutId', lastLoggedWorkoutId);

    // Upload and transcribe - copying from voice-test approach
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    // Success - redirect to voice analysis page
    window.location.href = `/voice-analysis/${lastLoggedWorkoutId}`;

  } catch (err) {
    setVoiceError(err instanceof Error ? err.message : 'Upload failed');
  } finally {
    setIsVoiceUploading(false);
  }
}, [lastLoggedWorkoutId, user]);

const handleSkipToHistory = useCallback(() => {
  setShowSuccess(false);
  setShowVoiceExpanded(false);
  setCurrentView('history');
}, []);

const handleCollapseVoiceModal = useCallback(() => {
  setShowVoiceExpanded(false);
  setVoiceError(''); // Clear errors when collapsing
}, []);

// Success message handler
const handleShowSuccessMessage = useCallback(() => {
return (
<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
  <div className={`bg-white rounded-3xl p-6 m-6 text-center transition-all duration-300 ${
    showVoiceExpanded ? 'max-w-md w-full' : 'max-w-sm'
  }`}>
    {!showVoiceExpanded ? (
      // Original success modal
      <>
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Workout Logged!</h3>
        <p className="text-gray-600 mb-6">Great job keeping the momentum going!</p>
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleAddVoiceNote}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            <Mic className="w-5 h-5" />
            <span>Add Voice Note</span>
          </button>
          <button
            onClick={handleSkipToHistory}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
          >
            Skip to History
          </button>
        </div>
      </>
    ) : (
      // Expanded voice recording modal
      <>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Add Voice Note</h3>
          <button
            onClick={handleCollapseVoiceModal}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-all"
          >
            ×
          </button>
        </div>
        
        {/* Voice Recorder Component */}
        <div className="mb-6">
          {voiceError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {voiceError}
            </div>
          )}
          
          {isVoiceUploading && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              Uploading and analyzing your voice note...
            </div>
          )}
          
          <VoiceRecorder
            onRecordingComplete={handleVoiceUpload}
            disabled={isVoiceUploading}
          />
        </div>
        
        <button
          onClick={handleSkipToHistory}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
        >
          Continue to History
        </button>
      </>
    )}
  </div>
</div>
);
}, [showVoiceExpanded, handleAddVoiceNote, handleSkipToHistory, handleCollapseVoiceModal, handleVoiceUpload, voiceError, isVoiceUploading]);
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
if (currentView === 'weekly') {
  return (
    <WeeklyWorkoutView />
  );
}
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
onWorkoutUpdated={loadUserData}
onWorkoutDeleted={loadUserData}
/>
);
}
if (currentView === 'goals') {
return (
<GoalsAndEventsView 
setCurrentView={setCurrentView}
onGoalCreated={() => {
// Reload workouts when a new goal is created to ensure consistency
loadUserData();
}}
/>
);
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