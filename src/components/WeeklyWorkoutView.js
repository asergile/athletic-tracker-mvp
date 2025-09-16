'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Target, Plus, Flag, User, Activity, Calendar, BarChart3 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { startOfWeek, addDays, format } from 'date-fns';

// Helper function to format time
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

// Helper function to get start of week (Sunday) - using date-fns for reliability
const getWeekStart = (date) => {
  return startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
};

// Helper function to get week days array (Sunday first) - using date-fns
const getWeekDays = (weekStart) => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'), // Sun, Mon, Tue, etc.
      dayNumber: date.getDate(),
      fullDate: date
    };
  });
};

const ratingLabels = {
  1: { label: 'Rough', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Decent', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
};

const WeeklyWorkoutView = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Navigation handlers - Updated for better UX flow
  const goToMainApp = () => {
    router.push('/');
  };

  const goToHistory = () => {
    // Navigate to history view in main app
    router.push('/?view=history');
  };

  const goToGoals = () => {
    // Navigate to goals view in main app  
    router.push('/?view=goals');
  };

  const goToProfile = () => {
    // Navigate to profile view in main app
    router.push('/?view=profile');
  };

  const goToAddWorkout = () => {
    // Navigate to log workout view in main app
    router.push('/?view=log');
  };

  // Load workouts data
  useEffect(() => {
    const loadWorkouts = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await dbHelpers.getUserWorkouts();
        if (error) {
          console.error('Error loading workouts:', error);
        } else {
          setWorkouts(data || []);
        }
      } catch (err) {
        console.error('Error loading workouts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, [user]);

  // Get current week days
  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  // Get workouts for current week
  const weekWorkouts = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date + 'T00:00:00');
      return workoutDate >= currentWeekStart && workoutDate <= weekEnd;
    });
  }, [workouts, currentWeekStart]);

  // Group workouts by day
  const workoutsByDay = useMemo(() => {
    const grouped = {};
    weekWorkouts.forEach(workout => {
      if (!grouped[workout.date]) {
        grouped[workout.date] = [];
      }
      grouped[workout.date].push(workout);
    });
    return grouped;
  }, [weekWorkouts]);

  // Calculate weekly stats (consistent with History View)
  const weeklyStats = useMemo(() => {
    const totalTime = weekWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
    const avgRating = weekWorkouts.length > 0 
      ? weekWorkouts.reduce((sum, workout) => sum + workout.rating, 0) / weekWorkouts.length 
      : 0;

    return {
      count: weekWorkouts.length,
      totalTime,
      avgRating
    };
  }, [weekWorkouts]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const previousWeek = new Date(currentWeekStart);
    previousWeek.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(previousWeek);
    setIsScrolling(true);
    
    // Scroll to first workout of previous week
    setTimeout(() => {
      const weekDaysForPrevious = getWeekDays(previousWeek);
      for (const day of weekDaysForPrevious) {
        const dayElement = document.getElementById(`day-${day.date}`);
        if (dayElement) {
          dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
      }
      setTimeout(() => setIsScrolling(false), 1000);
    }, 100);
  };

  // Navigate to next week (but not future past today)
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(currentWeekStart.getDate() + 7);
    const today = new Date();
    
    // Only allow if the next week starts before or on today
    if (nextWeek <= today) {
      setCurrentWeekStart(nextWeek);
      setIsScrolling(true);
      
      // Scroll to first workout of next week
      setTimeout(() => {
        const weekDaysForNext = getWeekDays(nextWeek);
        for (const day of weekDaysForNext) {
          const dayElement = document.getElementById(`day-${day.date}`);
          if (dayElement) {
            dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
          }
        }
        setTimeout(() => setIsScrolling(false), 1000);
      }, 100);
    }
  };

  // Check if we can go to next week
  const canGoToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(currentWeekStart.getDate() + 7);
    const today = new Date();
    return nextWeek <= today;
  };

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day.date);
    setIsScrolling(true);
    // Scroll to workout cards for that day
    const dayElement = document.getElementById(`day-${day.date}`);
    if (dayElement) {
      dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Reset scrolling flag after scroll completes
    setTimeout(() => setIsScrolling(false), 1000);
  };

  // Handle scroll detection to update week banner
  useEffect(() => {
    if (isScrolling) return; // Don't update during programmatic scrolling
    
    const handleScroll = () => {
      const workoutSections = document.querySelectorAll('[id^="day-"]');
      const viewportMiddle = window.innerHeight / 2;
      
      let closestSection = null;
      let closestDistance = Infinity;
      
      workoutSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const sectionMiddle = rect.top + rect.height / 2;
        const distance = Math.abs(sectionMiddle - viewportMiddle);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      });
      
      if (closestSection) {
        const dateStr = closestSection.id.replace('day-', '');
        const workoutDate = new Date(dateStr + 'T00:00:00');
        const weekStartForDate = getWeekStart(workoutDate);
        
        // Only update if we're looking at a different week
        if (weekStartForDate.getTime() !== currentWeekStart.getTime()) {
          setCurrentWeekStart(weekStartForDate);
        }
        
        setSelectedDay(dateStr);
      }
    };
    
    const throttledScroll = throttle(handleScroll, 200);
    window.addEventListener('scroll', throttledScroll);
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [currentWeekStart, isScrolling]);

  // Throttle function to limit scroll event frequency
  const throttle = (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  };

  // Format week range for display
  const getWeekRangeText = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    const startMonth = currentWeekStart.toLocaleDateString('en-US', { month: 'short' });
    const startDay = currentWeekStart.getDate();
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const endDay = weekEnd.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with Navigation */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToMainApp}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
            title="Back to Main App"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Weekly View</h1>
            <p className="text-purple-200 text-sm sm:text-base">Your workout journey</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={goToAddWorkout}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Add Workout"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={goToHistory}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="History"
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={goToGoals}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Goals"
            >
              <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={goToProfile}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Profile"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Cards - Consistent with History View */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
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

        {/* Week Navigation Banner */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 mb-6">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">{getWeekRangeText()}</h2>
          </div>
        </div>

        {/* Week Calendar - Mobile Responsive Unified Grid */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            {/* Left Arrow */}
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200 touch-manipulation"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            
            {/* Day Grid - Mobile Responsive */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 mx-2 sm:mx-4">
              {weekDays.map((day) => {
                const hasWorkouts = workoutsByDay[day.date]?.length > 0;
                const isSelected = selectedDay === day.date;
                const isToday = day.fullDate.toDateString() === new Date().toDateString();
                
                return (
                  <div key={day.date} className="flex flex-col items-center">
                    {/* Day letter at top */}
                    <span className="text-purple-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      {day.dayName.charAt(0)}
                    </span>
                    {/* Day indicator below */}
                    <button
                      onClick={() => handleDaySelect(day)}
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation ${
                        isSelected 
                          ? 'ring-2 ring-white ring-opacity-60' 
                          : ''
                      } ${
                        isToday 
                          ? 'ring-2 ring-yellow-400 ring-opacity-60' 
                          : ''
                      }`}
                    >
                      {hasWorkouts ? (
                        <div className="text-xl sm:text-2xl">💪</div>
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-medium">{day.dayNumber}</span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Right Arrow */}
            <button
              onClick={goToNextWeek}
              disabled={!canGoToNextWeek()}
              className={`p-2 rounded-lg transition-all duration-200 touch-manipulation ${
                canGoToNextWeek() 
                  ? 'hover:bg-white hover:bg-opacity-10' 
                  : 'cursor-not-allowed'
              }`}
              title={canGoToNextWeek() ? "Next Week" : "Can't go beyond today"}
            >
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${
                canGoToNextWeek() ? 'text-white' : 'text-white text-opacity-30'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Workout Cards */}
      <div className="px-6 pb-8">
        {weekDays.map((day) => {
          const dayWorkouts = workoutsByDay[day.date] || [];
          
          if (dayWorkouts.length === 0) {
            return null; // Don't show empty days
          }

          return (
            <div key={day.date} id={`day-${day.date}`} className="mb-6">
              {/* Day Header - Mobile Responsive */}
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {day.dayName}, {day.fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </h3>
              </div>

              {/* Workout Cards for this day */}
              <div className="space-y-4">
                {dayWorkouts.map((workout) => {
                  const ratingConfig = ratingLabels[workout.rating];
                  
                  return (
                    <div key={workout.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                            <h4 className="text-lg sm:text-xl font-bold text-gray-800">{workout.workout_type}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm sm:text-base">{formatTime(workout.duration)}</span>
                            </div>
                            {workout.distance && (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <span>📏</span>
                                <span className="text-sm sm:text-base">{workout.distance} {workout.distance_unit}</span>
                              </div>
                            )}
                            <div className={`inline-flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r ${ratingConfig.color} text-white text-xs sm:text-sm font-medium`}>
                              <span>{ratingConfig.emoji}</span>
                              <span>{ratingConfig.label}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-2 sm:ml-0">
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${ratingConfig.color} flex items-center justify-center text-xl sm:text-2xl`}>
                            {ratingConfig.emoji}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {weekWorkouts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl sm:text-6xl mb-4">💪</div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No workouts this week</h3>
            <p className="text-purple-200 text-sm sm:text-base px-4">Start logging to see your progress here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyWorkoutView;