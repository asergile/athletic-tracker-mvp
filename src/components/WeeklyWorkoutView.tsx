'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Target, Plus, Flag, User, Activity, Calendar, BarChart3, Mic, FileText, Edit, Route } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { dbHelpers } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { startOfWeek, addDays, format } from 'date-fns';
import FeedbackButton from './FeedbackButton';
import StandardNavigation from './StandardNavigation';

// TypeScript Interfaces
interface Workout {
  id: string;
  date: string;
  duration: number;
  rating: number;
  workout_type: string;
  distance?: number;
  distance_unit?: string;
  voice_transcription?: string;
  workout_analysis?: string;
}

interface EditingWorkout {
  id: string;
  workout_type: string;
  duration: string | number;
  rating: number;
  date: string;
  distance?: number | string;
  distance_unit?: string;
  created_at: string;
  voice_transcription?: string;
  workout_analysis?: string;
  type: string;
  distanceUnit?: string;
}

interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  fullDate: Date;
}

interface WeeklyStats {
  count: number;
  totalTime: number;
  avgRating: number;
}

interface RatingConfig {
  label: string;
  emoji: string;
  color: string;
}

// Helper function to format time
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

// Helper function to get start of week (Sunday) - using date-fns for reliability
const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
};

// Helper function to get week days array (Sunday first) - using date-fns
const getWeekDays = (weekStart: Date): WeekDay[] => {
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

// Typed rating labels constant
const ratingLabels: Record<number, RatingConfig> = {
  1: { label: 'Rough', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Decent', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
};

const WeeklyWorkoutView: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [editingWorkout, setEditingWorkout] = useState<EditingWorkout | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Navigation handlers - Clean route-based navigation with date picker for backdating
  const goToAddWorkout = (): void => {
    router.push('/?showDatePicker=true');
  };

  // Voice analysis navigation
  const handleVoiceAnalysis = (workoutId: string): void => {
    router.push(`/voice-analysis/${workoutId}`);
  };

  // Edit workout functionality
  const handleEditWorkout = (workout: Workout): void => {
    setEditingWorkout({
      ...workout,
      type: workout.workout_type,
      distanceUnit: workout.distance_unit || 'miles',
      created_at: new Date().toISOString() // Add fallback for created_at
    });
    setError('');
  };

  const handleUpdateWorkout = async (): Promise<void> => {
    if (!editingWorkout?.type || !editingWorkout?.duration || !editingWorkout?.rating) {
      setError('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const updateData = {
        workout_type: editingWorkout.type,
        duration: parseInt(editingWorkout.duration.toString()),
        rating: editingWorkout.rating,
        date: editingWorkout.date,
        distance: editingWorkout.distance ? parseFloat(editingWorkout.distance.toString()) : undefined,
        distance_unit: editingWorkout.distance ? editingWorkout.distanceUnit : undefined
      };

      const response = await dbHelpers.updateWorkout(editingWorkout.id, updateData);
      
      if (response.error) {
        throw response.error;
      }

      // Reload workouts to show updated data
      await loadWorkouts();
      setEditingWorkout(null);
    } catch (error) {
      console.error('Error updating workout:', error);
      setError('Failed to update workout. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = (): void => {
    setEditingWorkout(null);
    setError('');
  };

  // Load workouts data
  useEffect(() => {
    loadWorkouts();
  }, [user]);
  
  const loadWorkouts = async (): Promise<void> => {
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

  // Get current week days
  const weekDays = useMemo<WeekDay[]>(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  // Get workouts for current week
  const weekWorkouts = useMemo<Workout[]>(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    return workouts.filter((workout: Workout) => {
      const workoutDate = new Date(workout.date + 'T00:00:00');
      return workoutDate >= currentWeekStart && workoutDate <= weekEnd;
    });
  }, [workouts, currentWeekStart]);

  // Group workouts by day
  const workoutsByDay = useMemo<Record<string, Workout[]>>(() => {
    const grouped: Record<string, Workout[]> = {};
    weekWorkouts.forEach((workout: Workout) => {
      if (!grouped[workout.date]) {
        grouped[workout.date] = [];
      }
      grouped[workout.date].push(workout);
    });
    return grouped;
  }, [weekWorkouts]);

  // Calculate weekly stats (consistent with History View)
  const weeklyStats = useMemo<WeeklyStats>(() => {
    const totalTime = weekWorkouts.reduce((sum: number, workout: Workout) => sum + workout.duration, 0);
    const avgRating = weekWorkouts.length > 0 
      ? weekWorkouts.reduce((sum: number, workout: Workout) => sum + workout.rating, 0) / weekWorkouts.length 
      : 0;

    return {
      count: weekWorkouts.length,
      totalTime,
      avgRating
    };
  }, [weekWorkouts]);

  // Navigate to previous week
  const goToPreviousWeek = (): void => {
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
  const goToNextWeek = (): void => {
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
  const canGoToNextWeek = (): boolean => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(currentWeekStart.getDate() + 7);
    const today = new Date();
    return nextWeek <= today;
  };

  // Handle day selection
  const handleDaySelect = (day: WeekDay): void => {
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
    
    const handleScroll = (): void => {
      const workoutSections = document.querySelectorAll('[id^="day-"]');
      const viewportMiddle = window.innerHeight / 2;
      
      let closestSection: Element | null = null;
      let closestDistance = Infinity;
      
      workoutSections.forEach((section: Element) => {
        const rect = section.getBoundingClientRect();
        const sectionMiddle = rect.top + rect.height / 2;
        const distance = Math.abs(sectionMiddle - viewportMiddle);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      });
      
      if (closestSection) {
        const dateStr = (closestSection as HTMLElement).id.replace('day-', '');
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
  const throttle = <T extends (...args: any[]) => void>(func: T, limit: number): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  };

  // Format week range for display
  const getWeekRangeText = (): string => {
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
      {/* Header with Standardized 5-Icon Navigation */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Weekly View</h1>
            <p className="text-purple-200 text-sm sm:text-base">Your workout journey</p>
          </div>
          <StandardNavigation currentPage="weekly" />
        </div>

        {/* Stats Cards - Consistent with History View */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{formatTime(weeklyStats.totalTime)}</p>
            <p className="text-purple-200 text-xs sm:text-sm truncate">Total Time</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-green-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyStats.count} workouts</p>
            <p className="text-purple-200 text-xs sm:text-sm truncate">This Week</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <Target className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyStats.avgRating.toFixed(1)}</p>
            <p className="text-purple-200 text-xs sm:text-sm truncate">Avg Feel</p>
          </div>
        </div>

        {/* Week Navigation Banner */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            {/* Left Arrow */}
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200 touch-manipulation"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            
            {/* Date Range */}
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">{getWeekRangeText()}</h2>
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

        {/* Week Calendar - Mobile Responsive Unified Grid */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map((day: WeekDay) => {
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
        </div>
      </div>

      {/* Workout Cards */}
      <div className="px-6 pb-8">
        {weekDays.map((day: WeekDay) => {
          const dayWorkouts: Workout[] = workoutsByDay[day.date] || [];
          
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
                {dayWorkouts.map((workout: Workout) => {
                  const ratingConfig: RatingConfig = ratingLabels[workout.rating];
                  const hasVoiceData = workout.voice_transcription || workout.workout_analysis;
                  
                  return (
                    <div key={workout.id} className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 relative">
                      {/* Action Buttons - Bigger and better positioned */}
                      <div className="absolute top-4 right-4 flex space-x-3 z-10">
                        <button
                          onClick={() => handleVoiceAnalysis(workout.id)}
                          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all relative"
                          title={hasVoiceData ? "View voice analysis" : "Add voice note"}
                        >
                          {hasVoiceData ? (
                            <FileText className="w-5 h-5 text-gray-600" />
                          ) : (
                            <>
                              <Mic className="w-5 h-5 text-gray-600" />
                              <Plus className="w-3 h-3 absolute -top-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5" />
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleEditWorkout(workout)}
                          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
                          title="Edit workout"
                        >
                          <Edit className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>

                      {/* Main Content */}
                      <div className="pr-28">
                        {/* Workout type - prominent */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{workout.workout_type}</h3>
                        <p className="text-gray-500 text-sm font-medium mb-4">
                          {day.fullDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>

                        {/* Stats in a row */}
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-gray-600" />
                            <span className="text-lg font-bold text-gray-900">{formatTime(workout.duration)}</span>
                          </div>
                          {workout.distance && (
                            <div className="flex items-center space-x-2">
                              <Route className="w-5 h-5 text-gray-600" />
                              <span className="text-lg font-bold text-gray-900">{workout.distance}</span>
                              <span className="text-sm text-gray-600 font-medium">{workout.distance_unit}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rating pill positioned below action buttons on the right */}
                      <div className="absolute top-20 right-4">
                        <div className={`inline-flex items-center space-x-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${ratingConfig.color} text-white shadow-lg transform hover:scale-105 transition-transform`}>
                          <span className="text-xl">{ratingConfig.emoji}</span>
                          <span className="text-base font-bold">{ratingConfig.label}</span>
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
      
      {/* Edit Workout Modal */}
      {editingWorkout && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl p-6 m-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Workout</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700 p-2"
                disabled={isUpdating}
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
                  onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, type: e.target.value }) : null)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Running, Swimming"
                  disabled={isUpdating}
                />
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={editingWorkout.duration}
                  onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, duration: e.target.value }) : null)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="45"
                  min="1"
                  disabled={isUpdating}
                />
              </div>
              
              {/* Distance (Optional) */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Distance (optional)</label>
                <div className="flex space-x-3">
                  <input
                    type="number"
                    step="0.1"
                    value={editingWorkout.distance || ''}
                    onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, distance: e.target.value }) : null)}
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="5.2"
                    disabled={isUpdating}
                  />
                  <select
                    value={editingWorkout.distanceUnit || 'miles'}
                    onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, distanceUnit: e.target.value }) : null)}
                    className="w-28 p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    disabled={isUpdating}
                  >
                    <option value="miles">miles</option>
                    <option value="kilometers">km</option>
                    <option value="meters">meters</option>
                    <option value="yards">yards</option>
                  </select>
                </div>
              </div>
              
              {/* Date */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={editingWorkout.date}
                  onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  disabled={isUpdating}
                />
              </div>
              
              {/* Rating */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">How did it go?</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(ratingLabels).map(([rating, config]) => (
                    <button
                      key={rating}
                      onClick={() => setEditingWorkout(prev => prev ? ({ ...prev, rating: parseInt(rating) }) : null)}
                      disabled={isUpdating}
                      className={`p-4 rounded-xl transition-all duration-200 disabled:opacity-50 ${
                        editingWorkout.rating === parseInt(rating)
                          ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.emoji}</div>
                      <div className="font-medium text-sm">{config.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateWorkout}
                disabled={isUpdating || !editingWorkout.type || !editingWorkout.duration || !editingWorkout.rating}
                className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyWorkoutView;