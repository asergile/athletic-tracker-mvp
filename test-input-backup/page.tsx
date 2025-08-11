'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Calendar, User, Target, Zap, TrendingUp } from 'lucide-react';

// MOVED OUTSIDE - NOW STABLE COMPONENT
const LogWorkoutView = ({ 
  currentWorkout, 
  handleDurationChange, 
  setCurrentView, 
  showSuccess, 
  weeklyGoalProgress, 
  weeklyStats, 
  weeklyStreak 
}) => {
  console.log('LogWorkoutView render - STABLE component');
  
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
            <h1 className="text-3xl font-bold text-white mb-2">FIXED STRUCTURE TEST</h1>
            <p className="text-blue-200">Component moved outside - should work now!</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200 text-sm">Weekly Goal</span>
            </div>
            <p className="text-2xl font-bold text-white">{weeklyGoalProgress.current}</p>
            <p className="text-blue-200 text-xs mt-1">
              {weeklyGoalProgress.percentage}% of {weeklyGoalProgress.goal}
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

      {/* Form */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {/* Duration - EXACT copy from main app */}
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
          
          <div className="text-sm text-gray-600 mb-4">
            Input value: "{currentWorkout.duration}"
          </div>
          
          <div className="text-sm text-green-600 mb-4 font-medium">
            ✅ FIXED: LogWorkoutView moved outside main component.
            Should now maintain focus while typing!
          </div>

          <a 
            href="/" 
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
};

const TestInputPage = () => {
  // Complex state like main app
  const [currentView, setCurrentView] = useState('log');
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(6);
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

  // useEffect hooks like main app
  useEffect(() => {
    console.log('Effect 1: Component mounted');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    console.log('Effect 2: weeklyGoal changed', weeklyGoal);
    const newGoalHours = Math.floor(weeklyGoal);
    const newGoalMinutes = Math.round((weeklyGoal % 1) * 60);
    setGoalHours(newGoalHours);
    setGoalMinutes(newGoalMinutes);
  }, [weeklyGoal]);

  // Complex calculations like main app
  const weeklyStats = useMemo(() => {
    console.log('Calculating weeklyStats');
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
    console.log('Calculating weeklyGoalProgress');
    const totalMinutes = weeklyStats.totalTime;
    const goalMinutes = weeklyGoal * 60;
    const percentage = goalMinutes > 0 ? (totalMinutes / goalMinutes) * 100 : 0;
    
    return {
      current: `${totalMinutes}m`,
      goal: `${weeklyGoal}h`,
      percentage: Math.round(percentage)
    };
  }, [weeklyStats, weeklyGoal]);

  const weeklyStreak = useMemo(() => {
    console.log('Calculating weeklyStreak');
    return workouts.length;
  }, [workouts]);

  // Complex change handler like main app
  const handleDurationChange = useCallback((e) => {
    console.log('Duration changing:', e.target.value);
    const value = e.target.value;
    
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setCurrentWorkout(prev => ({ ...prev, duration: value }));
    }
  }, []);

  // Simulate other state changes
  useEffect(() => {
    const interval = setInterval(() => {
      setWeeklyGoal(prev => prev + 0.1);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  console.log('Main component render', { currentWorkout, weeklyGoal, goalHours, goalMinutes });

  // NOW RETURNS STABLE COMPONENT
  return (
    <LogWorkoutView 
      currentWorkout={currentWorkout}
      handleDurationChange={handleDurationChange}
      setCurrentView={setCurrentView}
      showSuccess={showSuccess}
      weeklyGoalProgress={weeklyGoalProgress}
      weeklyStats={weeklyStats}
      weeklyStreak={weeklyStreak}
    />
  );
};

export default TestInputPage;
