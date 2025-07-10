import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Calendar, TrendingUp, Clock, Zap, Target, ChevronLeft, ChevronRight, Activity, Download, Upload, Database } from 'lucide-react';

const AthleticTracker = () => {
  const [currentView, setCurrentView] = useState('log'); // 'log' or 'history'
  const [workouts, setWorkouts] = useState([]);
  
  const [currentWorkout, setCurrentWorkout] = useState({
    type: '',
    duration: '',
    rating: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDataOptions, setShowDataOptions] = useState(false);
  
  // Ref to maintain focus on duration input
  const durationInputRef = useRef(null);

  // Load workouts from localStorage on component mount
  useEffect(() => {
    const savedWorkouts = localStorage.getItem('athletic-tracker-workouts');
    if (savedWorkouts) {
      try {
        const parsed = JSON.parse(savedWorkouts);
        setWorkouts(parsed);
      } catch (error) {
        console.error('Error loading workouts:', error);
        // If there's an error, start with empty array
        setWorkouts([]);
      }
    } else {
      // First time user - start with empty array
      setWorkouts([]);
    }
  }, []);

  // Close data options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDataOptions && !event.target.closest('.data-options-container')) {
        setShowDataOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDataOptions]);

  // Save workouts to localStorage whenever workouts change
  useEffect(() => {
    localStorage.setItem('athletic-tracker-workouts', JSON.stringify(workouts));
  }, [workouts]);

  const workoutTypes = ['Swimming', 'Running', 'Cycling', 'Weight Training', 'Yoga', 'CrossFit', 'Basketball', 'Soccer', 'Tennis', 'Other'];
  
  const ratingLabels = {
    1: { label: 'Rough', emoji: '😤', color: 'from-red-500 to-red-600' },
    2: { label: 'Decent', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
    3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
  };

  const handleSubmit = async () => {
    if (!currentWorkout.type || !currentWorkout.duration || !currentWorkout.rating) return;
    
    setIsSubmitting(true);
    
    // Simulate brief processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newWorkout = {
      id: Date.now(),
      ...currentWorkout,
      duration: parseInt(currentWorkout.duration) || 0,
      date: new Date().toISOString().split('T')[0]
    };
    
    setWorkouts(prev => [newWorkout, ...prev]);
    setCurrentWorkout({ type: '', duration: '', rating: null });
    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const getStreakDays = () => {
    if (workouts.length === 0) return 0;
    
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // End of today
    
    for (let workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(23, 59, 59, 999); // End of workout day
      
      const diffTime = currentDate - workoutDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= streak) {
        streak++;
        currentDate = new Date(workoutDate);
        currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
      } else {
        break;
      }
    }
    return streak;
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
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `athletic-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.workouts && Array.isArray(importedData.workouts)) {
          setWorkouts(importedData.workouts);
          alert(`Successfully imported ${importedData.workouts.length} workouts!`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (error) {
        alert('Error reading backup file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const LogWorkoutView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 text-center transform animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-800">Workout Logged!</h3>
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
          <button
            onClick={() => setCurrentView('history')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
          >
            <Calendar className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200 text-sm">Streak</span>
            </div>
            <p className="text-2xl font-bold text-white">{getStreakDays()} days</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-blue-200 text-sm">This Week</span>
            </div>
            <p className="text-2xl font-bold text-white">{getWeeklyStats().count} workouts</p>
          </div>
        </div>
      </div>

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
              onClick={() => setShowDataOptions(!showDataOptions)}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200 relative data-options-container"
            >
              <Database className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Data Options Dropdown */}
          {showDataOptions && (
            <div className="absolute right-6 top-20 bg-white rounded-xl shadow-2xl p-4 z-50 min-w-48 data-options-container">
              <h3 className="font-bold text-gray-800 mb-3">Backup & Restore</h3>
              
              <button
                onClick={() => {
                  exportData();
                  setShowDataOptions(false);
                }}
                className="w-full flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors mb-2"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">Export Data</span>
              </button>
              
              <label className="w-full flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Import Data</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    importData(e);
                    setShowDataOptions(false);
                  }}
                  className="hidden"
                />
              </label>
              
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                Use this to backup your workouts or sync between devices
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{weeklyStats.count}</p>
              <p className="text-purple-200 text-sm">This Week</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{formatTime(weeklyStats.totalTime)}</p>
              <p className="text-purple-200 text-sm">Total Time</p>
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
              const isToday = date.toDateString() === new Date().toDateString();
              const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
              
              let dateLabel;
              if (isToday) dateLabel = 'Today';
              else if (isYesterday) dateLabel = 'Yesterday';
              else dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div key={workout.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{workout.type}</h3>
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

  return currentView === 'log' ? <LogWorkoutView /> : <HistoryView />;
};

export default AthleticTracker;