import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Calendar, TrendingUp, Clock, Zap, Target, ChevronLeft, Activity, Download, Upload, Database, LogOut, User, Flag } from 'lucide-react';
import { useAuth } from '../lib/AuthContext'
import { dbHelpers } from '../lib/supabase'
import FeedbackButton from './FeedbackButton'

// HELPER FUNCTIONS - MOVED OUTSIDE TO BE ACCESSIBLE
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

// CONSTANTS
const workoutTypes = ['Swimming', 'Running', 'Cycling', 'Weight Training', 'Dryland', 'CrossFit', 'Walking', 'Soccer', 'Tennis', 'Other'];

const ratingLabels = {
  1: { label: 'Rough', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Decent', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
};

// STABLE COMPONENTS - MOVED OUTSIDE TO FIX INPUT FOCUS ISSUE

const LogWorkoutView = ({
  currentWorkout,
  setCurrentWorkout,
  workoutTypes,
  ratingLabels,
  handleDurationChange,
  handleSubmit,
  isSubmitting,
  showSuccess,
  error,
  setCurrentView,
  weeklyGoalProgress,
  weeklyStats,
  weeklyStreak
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 text-center transform animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-800">Workout Logged!</h3>
            <p className="text-gray-600">Redirecting to history...</p>
          </div>
        </div>
      )}

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

        {/* Stats Cards - Reordered: Goal, Workouts, Streak */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200 text-sm">Weekly Goal</span>
            </div>
            <p className="text-2xl font-bold text-white">{weeklyGoalProgress.current}</p>
            <div className="w-full bg-gray-300 rounded-full h-3 mt-2 relative overflow-hidden">
              {/* Base progress bar - solid green for work done */}
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500 absolute" 
                style={{width: `${Math.min(weeklyGoalProgress.percentage, 100)}%`}}
              ></div>
              {/* Overflow progress - golden gradient when goal exceeded */}
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
              {/* Grey vertical line at 100% - clearly visible above and below */}
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
            </div>
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

const HistoryView = ({ setCurrentView, weeklyStats, workouts, ratingLabels, formatTime }) => {
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
              onClick={() => setCurrentView('profile')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <User className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Cards - Reordered: Total Time, Workouts This Week, Avg Feel */}
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

const GoalsView = ({ setCurrentView, onGoalCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    personalGoal: '',
    weeklyFrequency: 4,
    sport: 'Swimming'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set default date to 8 weeks from now
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 56); // 8 weeks
    setFormData(prev => ({
      ...prev,
      eventDate: defaultDate.toISOString().split('T')[0]
    }));
  }, []);
  
  // Load user's goals
  const loadGoals = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await dbHelpers.getUserGoals();
      if (error) {
        console.error('Error loading goals:', error);
        setError('Failed to load goals');
      } else {
        // Sort goals by event date (soonest first)
        const sortedGoals = (data || []).sort((a, b) => {
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
  
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCreateGoal = async () => {
    if (!formData.eventName || !formData.eventDate) {
      setError('Please fill in event name and date');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // First create the event
      const { data: event, error: eventError } = await dbHelpers.createEvent({
        name: formData.eventName,
        eventDate: formData.eventDate,
        goal: formData.personalGoal
      });
      
      if (eventError) {
        throw eventError;
      }
      
      // Update user's weekly frequency if changed
      await dbHelpers.updateWeeklyFrequency(formData.weeklyFrequency);
      
      // Create the goal
      const { data: goal, error: goalError } = await dbHelpers.createGoal(event.id);
      
      if (goalError) {
        throw goalError;
      }
      
      // Reset form and reload goals
      setFormData({
        eventName: '',
        eventDate: '',
        personalGoal: '',
        weeklyFrequency: 4,
        sport: 'Swimming'
      });
      
      // Set default date again
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 56);
      setFormData(prev => ({
        ...prev,
        eventDate: defaultDate.toISOString().split('T')[0]
      }));
      
      setIsCreating(false);
      await loadGoals(); // This will reload and sort the goals
      
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
    if (!formData.eventDate) return { daysLeft: '--', targetWorkouts: '--' };
    
    const eventDate = new Date(formData.eventDate);
    const today = new Date();
    const diffTime = eventDate - today;
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const weeksRemaining = Math.max(0.1, daysLeft / 7);
    const targetWorkouts = Math.ceil(weeksRemaining * formData.weeklyFrequency);
    
    return { daysLeft, targetWorkouts };
  };
  
  const { daysLeft, targetWorkouts } = calculatePreviewValues();
  
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
      
      {/* Content */}
      <div className="px-6 pb-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4 mb-6">
            <p className="text-red-200">{error}</p>
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
                      className="banking-card"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold mb-1">{goal.events.name}</h3>
                          <div className="text-sm opacity-90">
                            {new Date(goal.events.event_date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                        <div className="text-right text-sm opacity-90">
                          <span className="text-2xl font-bold block">{goal.days_remaining}</span>
                          days left
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
            
            {/* Create New Goal Button */}
            {!isCreating && (
              <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Goal</h3>
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Event Goal</span>
                </button>
              </div>
            )}
            
            {/* Goal Creation Form */}
            {isCreating && (
              <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Add New Goal</h3>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-gray-500 hover:text-gray-700 p-2"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name</label>
                    <input
                      type="text"
                      value={formData.eventName}
                      onChange={(e) => handleFormChange('eventName', e.target.value)}
                      placeholder="e.g., State Championships"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date</label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => handleFormChange('eventDate', e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Goal</label>
                    <input
                      type="text"
                      value={formData.personalGoal}
                      onChange={(e) => handleFormChange('personalGoal', e.target.value)}
                      placeholder="e.g., Set PB in freestyle"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Weekly Workouts</label>
                      <select
                        value={formData.weeklyFrequency}
                        onChange={(e) => handleFormChange('weeklyFrequency', parseInt(e.target.value))}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                      >
                        <option value={3}>3 per week</option>
                        <option value={4}>4 per week</option>
                        <option value={5}>5 per week</option>
                        <option value={6}>6 per week</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Sport</label>
                      <select
                        value={formData.sport}
                        onChange={(e) => handleFormChange('sport', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                      >
                        <option value="Swimming">Swimming</option>
                        <option value="Running">Running</option>
                        <option value="Cycling">Cycling</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCreateGoal}
                    disabled={!formData.eventName || !formData.eventDate || isSubmitting}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                      !formData.eventName || !formData.eventDate || isSubmitting
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
                      'Create Goal'
                    )}
                  </button>
                  
                  {/* Preview Card */}
                  {formData.eventName && formData.eventDate && (
                    <div 
                      className="mt-6 p-4 rounded-xl text-white"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-base font-bold mb-1">
                            {formData.personalGoal ? `${formData.eventName} - ${formData.personalGoal}` : formData.eventName}
                          </h3>
                          <div className="text-sm opacity-90">
                            {new Date(formData.eventDate).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
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
    </div>
  );
};

const ProfileView = ({ setCurrentView, user, goalHours, goalMinutes, handleWeeklyGoalChange, handleSignOut }) => (
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

const AthleticTracker = () => {
  const { user, signOut } = useAuth()
  const [currentView, setCurrentView] = useState('log'); // 'log', 'history', or 'profile'
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyGoal, setWeeklyGoal] = useState(6); // Default 6 hours per week
  
  const [currentWorkout, setCurrentWorkout] = useState({
    type: '',
    duration: '',
    rating: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [goalHours, setGoalHours] = useState(6);
  const [goalMinutes, setGoalMinutes] = useState(0);

  // Load user data from Supabase
  const loadUserData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Load workouts and user settings in parallel
      const [workoutsResult, settingsResult] = await Promise.all([
        dbHelpers.getUserWorkouts(),
        dbHelpers.getUserSettings()
      ]);
      
      // Handle workouts
      if (workoutsResult.error) {
        console.error('Error loading workouts:', workoutsResult.error);
        setError('Failed to load workouts. Please refresh the page.');
      } else {
        setWorkouts(workoutsResult.data || []);
      }
      
      // Handle user settings
      if (settingsResult.error && settingsResult.error.message !== 'User not authenticated') {
        console.error('Error loading settings:', settingsResult.error);
        // Don't show error for missing settings, just use defaults
      } else if (settingsResult.data) {
        const goalHours = settingsResult.data.weekly_goal_hours || 6;
        setWeeklyGoal(goalHours);
        setGoalHours(Math.floor(goalHours));
        setGoalMinutes(Math.round((goalHours % 1) * 60));
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load workouts from Supabase on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const handleSubmit = async () => {
    if (!currentWorkout.type || !currentWorkout.duration || !currentWorkout.rating) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Save to Supabase database with explicit date handling
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const dateString = localDate.toISOString().split('T')[0];
      
      const { data, error } = await dbHelpers.createWorkout({
        type: currentWorkout.type,
        duration: parseInt(currentWorkout.duration) || 0,
        rating: currentWorkout.rating,
        date: dateString
      });
      
      if (error) throw error;
      
      // Reset form and reload all data from database
      setCurrentWorkout({ type: '', duration: '', rating: null });
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Reload workouts from database to ensure consistency
      await loadUserData();
      
      // FIXED: Redirect to history after success animation
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentView('history');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving workout:', error);
      setError('Failed to save workout. Please try again.');
      setIsSubmitting(false);
    }
  };

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

  const handleDurationChange = useCallback((e) => {
    const value = e.target.value;
    
    // Only allow numbers and limit to 3 digits (max 999 minutes)
    if (value === '' || (/^\d+$/.test(value) && value.length <= 3)) {
      setCurrentWorkout(prev => ({ ...prev, duration: value }));
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        setError('Failed to sign out. Please try again.');
      } else {
        // Sign out successful - user will be redirected automatically by AuthContext
        console.log('Successfully signed out');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  const handleWeeklyGoalChange = async (hours, minutes) => {
    const newGoal = hours + (minutes / 60);
    
    // Capture previous values for potential revert
    const previousGoal = weeklyGoal;
    const previousHours = goalHours;
    const previousMinutes = goalMinutes;
    
    // Update local state immediately for responsiveness
    setWeeklyGoal(newGoal);
    setGoalHours(hours);
    setGoalMinutes(minutes);
    
    try {
      const { error } = await dbHelpers.updateUserSettings({ weekly_goal_hours: newGoal });
      if (error) {
        console.error('Database error saving weekly goal:', error);
        setError('Failed to save weekly goal. Please try again.');
        // Revert on failure
        setWeeklyGoal(previousGoal);
        setGoalHours(previousHours);
        setGoalMinutes(previousMinutes);
      } else {
        // Clear any previous errors
        setError('');
      }
    } catch (error) {
      console.error('Error saving weekly goal:', error);
      setError('Failed to save weekly goal. Please try again.');
      // Revert on failure
      setWeeklyGoal(previousGoal);
      setGoalHours(previousHours);
      setGoalMinutes(previousMinutes);
    }
  };

  // Memoized calculations to prevent unnecessary re-renders
  const weeklyStats = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekWorkouts = workouts.filter(w => new Date(w.date) >= oneWeekAgo);
    const totalTime = weekWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const avgRating = weekWorkouts.length > 0 
      ? weekWorkouts.reduce((sum, w) => sum + w.rating, 0) / weekWorkouts.length 
      : 0;
    
    return { count: weekWorkouts.length, totalTime, avgRating };
  }, [workouts]);

  const weeklyGoalProgress = useMemo(() => {
    const totalMinutes = weeklyStats.totalTime;
    const goalMinutes = weeklyGoal * 60;
    const percentage = goalMinutes > 0 ? (totalMinutes / goalMinutes) * 100 : 0;
    
    const goalHoursDisplay = Math.floor(weeklyGoal);
    const goalMinutesDisplay = Math.round((weeklyGoal % 1) * 60);
    const goalDisplay = goalMinutesDisplay > 0 ? `${goalHoursDisplay}h ${goalMinutesDisplay}m` : `${goalHoursDisplay}h`;
    
    return {
      current: formatTime(totalMinutes),
      goal: goalDisplay,
      percentage: Math.round(percentage)
    };
  }, [weeklyStats, weeklyGoal]);

  const weeklyStreak = useMemo(() => {
    if (workouts.length === 0) return 0;
    
    // Group workouts by week
    const workoutsByWeek = {};
    workouts.forEach(workout => {
      const date = new Date(workout.date);
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      workoutsByWeek[weekKey] = true;
    });
    
    // Count consecutive weeks from current week backwards
    let streak = 0;
    let currentWeekStart = getWeekStart(new Date());
    
    while (true) {
      const weekKey = currentWeekStart.toISOString().split('T')[0];
      if (workoutsByWeek[weekKey]) {
        streak++;
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      } else {
        break;
      }
    }
    
    return streak;
  }, [workouts]);

  // Show loading screen while data loads
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-white mb-2">Loading your workouts...</h3>
          <p className="text-blue-200">Syncing your data</p>
        </div>
      </div>
    );
  }

  // Route between views using conditional rendering to maintain stable components
  return (
    <>
      {currentView === 'goals' && (
        <GoalsView 
          setCurrentView={setCurrentView}
          onGoalCreated={() => {
            // Optionally reload workouts when a new goal is created
            loadUserData();
          }}
        />
      )}
      
      {currentView === 'profile' && (
        <ProfileView 
          setCurrentView={setCurrentView}
          user={user}
          goalHours={goalHours}
          goalMinutes={goalMinutes}
          handleWeeklyGoalChange={handleWeeklyGoalChange}
          handleSignOut={handleSignOut}
        />
      )}
      
      {currentView === 'history' && (
        <HistoryView 
          setCurrentView={setCurrentView}
          weeklyStats={weeklyStats}
          workouts={workouts}
          ratingLabels={ratingLabels}
          formatTime={formatTime}
        />
      )}
      
      {currentView === 'log' && (
        <LogWorkoutView 
          currentWorkout={currentWorkout}
          setCurrentWorkout={setCurrentWorkout}
          workoutTypes={workoutTypes}
          ratingLabels={ratingLabels}
          handleDurationChange={handleDurationChange}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          showSuccess={showSuccess}
          error={error}
          setCurrentView={setCurrentView}
          weeklyGoalProgress={weeklyGoalProgress}
          weeklyStats={weeklyStats}
          weeklyStreak={weeklyStreak}
        />
      )}
      
      <FeedbackButton />
    </>
  );
};

export default AthleticTracker;
