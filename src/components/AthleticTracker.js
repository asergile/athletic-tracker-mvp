import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Calendar, TrendingUp, Clock, Zap, Target, ChevronLeft, Activity, Download, Upload, Database, LogOut, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext'
import { dbHelpers } from '../lib/supabase'

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
  
  // Ref to maintain focus on duration input
  const durationInputRef = useRef(null);

  // Load workouts from Supabase on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Load workouts - this is the critical operation
      const { data: workoutsData, error: workoutsError } = await dbHelpers.getUserWorkouts();
      if (workoutsError) {
        console.error('Error loading workouts:', workoutsError);
        setError('Failed to load your workout data. Please try refreshing.');
        return;
      }
      
      setWorkouts(workoutsData || []);

      // Load user settings - if this fails, just use defaults (no error shown)
      try {
        const { data: settingsData, error: settingsError } = await dbHelpers.getUserSettings();
        if (!settingsError && settingsData && settingsData.weekly_goal_hours) {
          setWeeklyGoal(settingsData.weekly_goal_hours);
        }
      } catch (settingsError) {
        console.log('No user settings found, using defaults');
        // Don't show error for settings - not critical
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
      setError('Failed to load your workout data. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize goal hours and minutes from weeklyGoal
  useEffect(() => {
    const newGoalHours = Math.floor(weeklyGoal);
    const newGoalMinutes = Math.round((weeklyGoal % 1) * 60);
    setGoalHours(newGoalHours);
    setGoalMinutes(newGoalMinutes);
  }, [weeklyGoal]);

  const workoutTypes = ['Swimming', 'Running', 'Cycling', 'Weight Training', 'Yoga', 'CrossFit', 'Basketball', 'Soccer', 'Tennis', 'Other'];
  
  const ratingLabels = {
    1: { label: 'Rough', emoji: '😤', color: 'from-red-500 to-red-600' },
    2: { label: 'Decent', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
    3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
  };

  const handleSubmit = async () => {
    if (!currentWorkout.type || !currentWorkout.duration || !currentWorkout.rating) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Save to Supabase database
      const { data, error } = await dbHelpers.createWorkout({
        type: currentWorkout.type,
        duration: parseInt(currentWorkout.duration) || 0,
        rating: currentWorkout.rating,
        date: new Date().toISOString().split('T')[0]
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

  // FIXED: Weekly streak calculation (consecutive weeks with 1+ workout)
  const getWeeklyStreakDays = () => {
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
        // Go to previous week
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Helper function to get start of week (Monday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekWorkouts = workouts.filter(w => new Date(w.date) >= oneWeekAgo);
    const totalTime = weekWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const avgRating = weekWorkouts.length > 0 
      ? weekWorkouts.reduce((sum, w) => sum + w.rating, 0) / weekWorkouts.length 
      : 0;
    
    return { count: weekWorkouts.length, totalTime, avgRating };
  };

  // Weekly goal progress calculation - shows over 100% when exceeded
  const getWeeklyGoalProgress = () => {
    const stats = getWeeklyStats();
    const totalMinutes = stats.totalTime;
    const goalMinutes = weeklyGoal * 60;
    const percentage = goalMinutes > 0 ? (totalMinutes / goalMinutes) * 100 : 0;
    
    // Format goal properly as hours and minutes
    const goalHoursDisplay = Math.floor(weeklyGoal);
    const goalMinutesDisplay = Math.round((weeklyGoal % 1) * 60);
    const goalDisplay = goalMinutesDisplay > 0 ? `${goalHoursDisplay}h ${goalMinutesDisplay}m` : `${goalHoursDisplay}h`;
    
    return {
      current: formatTime(totalMinutes),
      goal: goalDisplay,
      percentage: Math.round(percentage)
    };
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
    
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      const cursorPosition = e.target.selectionStart;
      
      setCurrentWorkout(prev => ({ ...prev, duration: value }));
      
      // Restore focus and cursor position after re-render
      requestAnimationFrame(() => {
        if (durationInputRef.current) {
          durationInputRef.current.focus();
          durationInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    }
  }, []);

  const exportData = () => {
    const dataToExport = {
      workouts: workouts,
      weeklyGoal: weeklyGoal,
      exportDate: new Date().toISOString(),
      version: '2.0',
      user: user?.email
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `athletic-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

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

  const LogWorkoutView = () => {
    console.log('LogWorkoutView render - Current state:', { weeklyGoal, goalHours, goalMinutes });
    const weeklyGoalProgress = getWeeklyGoalProgress();
    const weeklyStats = getWeeklyStats();
    const weeklyStreak = getWeeklyStreakDays();
    console.log('LogWorkoutView - weeklyGoalProgress:', weeklyGoalProgress);

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
          <div className="grid grid-cols-3 gap-4 mb-8" key={`goal-${weeklyGoal}-${goalHours}-${goalMinutes}`}>
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
                  ref={durationInputRef}
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

  const HistoryView = () => {
    const weeklyStats = getWeeklyStats();
    
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
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
            >
              <User className="w-6 h-6 text-white" />
            </button>
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
              const date = new Date(workout.date);
              const today = new Date();
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              
              // FIXED: Proper date comparison for "Today" vs "Yesterday"
              const isToday = date.toDateString() === today.toDateString();
              const isYesterday = date.toDateString() === yesterday.toDateString();
              
              let dateLabel;
              if (isToday) dateLabel = 'Today';
              else if (isYesterday) dateLabel = 'Yesterday';
              else dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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

  const ProfileView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('history')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-green-200">Account & Settings</p>
          </div>
          <div className="w-12"></div>
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

  // Route between views
  if (currentView === 'profile') return <ProfileView />;
  return currentView === 'log' ? <LogWorkoutView /> : <HistoryView />;
};

export default AthleticTracker;
