import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Calendar, TrendingUp, Clock, Zap, Target, Activity, User, Flag, LogOut, BarChart3, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { dbHelpers } from '../lib/security/enhanced-db-helpers';
import FeedbackButton from './FeedbackButton';
import VoiceRecorder from './VoiceRecorder';
import StandardNavigation from './StandardNavigation';

// ===== TYPESCRIPT INTERFACES =====
interface Workout {
  id: string;
  workout_type: string;
  duration: number;
  rating: number;
  date: string;
  distance?: number;
  distance_unit?: string;
  created_at: string;
}

interface CurrentWorkout {
  type: string;
  duration: string;
  rating: number | null;
  date: string;
  distance: string;
  distanceUnit: string;
}

interface UserSettings {
  distance_unit_cardio: string;
  distance_unit_swimming: string;
  weekly_goal_minutes: number;
  weekly_workout_frequency: number;
}

interface WeeklyStats {
  count: number;
  totalTime: number;
  avgRating: number;
}

interface WeeklyGoalProgress {
  current: string;
  goal: string;
  percentage: number;
}

interface RatingConfig {
  label: string;
  emoji: string;
  color: string;
}

interface RatingLabels {
  [key: number]: RatingConfig;
}

interface DistanceUnits {
  cardio: string[];
  swimming: string[];
}

type ViewType = 'log' | 'goals' | 'profile';

// Event Handler Types
type ChangeEventHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
type ClickEventHandler = () => void;

// Goals & Events Interfaces
interface AppEvent {
  id: string;
  name: string;
  event_date: string;
  goal?: string | null;
  created_by: string;
  created_at: string;
}

interface Goal {
  id: string;
  user_id: string;
  event_id: string;
  target_workouts: number;
  created_at: string;
  events: AppEvent;
  workouts_completed: number;
  hours_completed: number;
  days_remaining: number;
}

interface EventFormData {
  name: string;
  eventDate: string;
  goal?: string;
}

interface GoalFormData {
  eventId: string;
  targetWorkouts: number;
}

// Component Prop Interfaces (placeholders for future sessions)
interface LogWorkoutViewProps {
  currentWorkout: CurrentWorkout;
  setCurrentWorkout: React.Dispatch<React.SetStateAction<CurrentWorkout>>;
  workoutTypes: string[];
  ratingLabels: RatingLabels;
  handleDurationChange: ChangeEventHandler;
  handleDistanceChange: ChangeEventHandler;
  handleDistanceUnitChange: ChangeEventHandler;
  handleDateChange: ChangeEventHandler;
  handleSubmit: ClickEventHandler;
  isSubmitting: boolean;
  showSuccess: boolean;
  error: string;
  setCurrentView: (view: ViewType) => void;
  weeklyGoalProgress: WeeklyGoalProgress;
  weeklyStats: WeeklyStats;
  weeklyStreak: number;
  showDatePicker: boolean;
  distanceUnit: string;
  getDistanceUnitOptions: () => string[];
  showAddWorkoutType: boolean;
  setShowAddWorkoutType: (show: boolean) => void;
  handleAddCustomType: (type: string) => Promise<void>;
  handleShowSuccessMessage: () => React.ReactElement;
}

interface GoalsAndEventsViewProps {
  setCurrentView: (view: ViewType) => void;
  onGoalCreated?: () => void;
  events: AppEvent[];
  goals: Goal[];
  userSettings: UserSettings;
  onEventCreate: (eventData: EventFormData) => Promise<void>;
  onEventUpdate: (eventId: string, eventData: EventFormData) => Promise<void>;
  onEventDelete: (eventId: string) => Promise<void>;
  onGoalCreate: (goalData: GoalFormData) => Promise<void>;
  onGoalDelete: (goalId: string) => Promise<void>;
  isLoading: boolean;
  error: string;
}

interface ProfileViewProps {
  setCurrentView: (view: ViewType) => void;
  user: any;
  userSettings: UserSettings;
  handleDistancePreferencesChange: (category: string, unit: string) => Promise<void>;
  goalHours: number;
  goalMinutes: number;
  handleWeeklyGoalChange: (hours: number, minutes: number) => Promise<void>;
  handleSignOut: () => Promise<void>;
  showAddNewActivity: boolean;
  setShowAddNewActivity: (show: boolean) => void;
  newActivityName: string;
  setNewActivityName: (name: string) => void;
  handleDeleteCustomActivity: (activity: string) => Promise<void>;
  handleAddNewActivityFromProfile: (newType: string, originalActivity?: string) => Promise<void>;
  workoutTypes: string[];
}

// ===== HELPER FUNCTIONS =====
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

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// ===== CONSTANTS =====
const defaultWorkoutTypes: string[] = ['Walking', 'Running', 'Swimming', 'Dryland'];

const distanceUnits: DistanceUnits = {
  cardio: ['miles', 'kilometers'],
  swimming: ['meters', 'yards']
};

const ratingLabels: RatingLabels = {
  1: { label: 'Struggled', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Solid', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
};

// ===== SUB-COMPONENTS (PLACEHOLDER - TO BE CONVERTED IN FUTURE SESSIONS) =====

// LOGWORKOUT VIEW COMPONENT - Fully Converted to TypeScript ✅
const LogWorkoutView: React.FC<LogWorkoutViewProps> = ({
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
          <StandardNavigation 
            currentPage="dashboard" 
            onNavigate={(view: string) => {
              if (view === 'goals' || view === 'profile') {
                setCurrentView(view as ViewType)
              } else if (view === 'log') {
                setCurrentView('log')
              } else if (view === 'weekly') {
                window.location.href = '/weekly-view'
              } else if (view === 'history') {
                window.location.href = '/history'
              }
            }} 
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <Target className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyGoalProgress.current}</p>
            <div className="w-full bg-gray-300 rounded-full h-1.5 sm:h-2 mt-1 mb-1 relative overflow-hidden">
              <div 
                className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-500 absolute" 
                style={{width: `${Math.min(weeklyGoalProgress.percentage, 100)}%`}}
              ></div>
              {weeklyGoalProgress.percentage > 100 && (
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-amber-600 h-1.5 sm:h-2 rounded-full transition-all duration-500 absolute"
                  style={{
                    left: '100%',
                    width: `${Math.min(weeklyGoalProgress.percentage - 100, 100)}%`,
                    transform: 'translateX(-100%)'
                  }}
                ></div>
              )}
            </div>
            <p className="text-purple-200 text-xs text-center truncate">
              {weeklyGoalProgress.percentage}% Weekly Goal {weeklyGoalProgress.percentage >= 100 && "🎯"}
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyStats.count} workouts</p>
            <p className="text-purple-200 text-xs sm:text-sm truncate">This Week</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyStreak} weeks</p>
            <p className="text-purple-200 text-xs sm:text-sm truncate">Weekly Streak</p>
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
              {workoutTypes.map((type: string) => (
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
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleAddCustomType(target.value);
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
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        const target = e.target as HTMLButtonElement;
                        const input = target.parentElement?.parentElement?.querySelector('input') as HTMLInputElement;
                        if (input) {
                          handleAddCustomType(input.value);
                        }
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
                  {getDistanceUnitOptions().map((unit: string) => (
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

// GOALS AND EVENTS VIEW COMPONENT - Fully Converted to TypeScript ✅
const GoalsAndEventsView: React.FC<GoalsAndEventsViewProps> = ({
  setCurrentView,
  events,
  goals,
  userSettings,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onGoalCreate,
  onGoalDelete,
  isLoading,
  error
}) => {
  // State for modals and forms
  const [showCreateEvent, setShowCreateEvent] = useState<boolean>(false);
  const [showCreateGoal, setShowCreateGoal] = useState<boolean>(false);
  const [selectedEventForGoal, setSelectedEventForGoal] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Form data state
  const [eventForm, setEventForm] = useState<EventFormData>({
    name: '',
    eventDate: '',
    goal: ''
  });
  
  const [goalForm, setGoalForm] = useState<GoalFormData>({
    eventId: '',
    targetWorkouts: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form handlers
  const handleEventFormChange = useCallback<ChangeEventHandler>((e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleGoalFormChange = useCallback<ChangeEventHandler>((e) => {
    const { name, value } = e.target;
    setGoalForm(prev => ({ 
      ...prev, 
      [name]: name === 'targetWorkouts' ? parseInt(value) || 0 : value 
    }));
  }, []);

  const handleCreateEvent = useCallback(async (): Promise<void> => {
    if (!eventForm.name || !eventForm.eventDate) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onEventCreate(eventForm);
      setEventForm({ name: '', eventDate: '', goal: '' });
      setShowCreateEvent(false);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [eventForm, onEventCreate]);

  const handleUpdateEvent = useCallback(async (): Promise<void> => {
    if (!editingEvent || !eventForm.name || !eventForm.eventDate) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onEventUpdate(editingEvent.id, eventForm);
      setEventForm({ name: '', eventDate: '', goal: '' });
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingEvent, eventForm, onEventUpdate]);

  const handleCreateGoal = useCallback(async (): Promise<void> => {
    if (!goalForm.eventId || goalForm.targetWorkouts <= 0) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onGoalCreate(goalForm);
      setGoalForm({ eventId: '', targetWorkouts: 0 });
      setShowCreateGoal(false);
      setSelectedEventForGoal('');
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [goalForm, onGoalCreate]);

  const handleDeleteEvent = useCallback(async (eventId: string): Promise<void> => {
    if (window.confirm('Delete this event? This will also delete any associated goals.')) {
      try {
        await onEventDelete(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  }, [onEventDelete]);

  const handleDeleteGoal = useCallback(async (goalId: string): Promise<void> => {
    if (window.confirm('Delete this goal?')) {
      try {
        await onGoalDelete(goalId);
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  }, [onGoalDelete]);

  const handleEditEvent = useCallback((event: AppEvent): void => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      eventDate: event.event_date,
      goal: event.goal || ''
    });
  }, []);

  const handleCreateGoalForEvent = useCallback((eventId: string): void => {
    setSelectedEventForGoal(eventId);
    setGoalForm(prev => ({ ...prev, eventId }));
    setShowCreateGoal(true);
  }, []);

  const resetForms = useCallback((): void => {
    setEventForm({ name: '', eventDate: '', goal: '' });
    setGoalForm({ eventId: '', targetWorkouts: 0 });
    setEditingEvent(null);
    setShowCreateEvent(false);
    setShowCreateGoal(false);
    setSelectedEventForGoal('');
  }, []);

  // Calculate target workouts for goal form
  const calculateTargetWorkouts = useCallback((eventDate: string): number => {
    const today = new Date();
    const event = new Date(eventDate);
    const weeksRemaining = Math.max(0.1, (event.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weeklyFrequency = userSettings?.weekly_workout_frequency || 4;
    return Math.ceil(weeksRemaining * weeklyFrequency);
  }, [userSettings?.weekly_workout_frequency]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Goals & Events</h1>
            <p className="text-green-200">Train toward concrete goals</p>
          </div>
          <StandardNavigation 
            currentPage="goals" 
            onNavigate={(view: string) => {
              if (view === 'log' || view === 'profile') {
                setCurrentView(view as ViewType)
              } else if (view === 'weekly') {
                window.location.href = '/weekly-view'
              } else if (view === 'history') {
                window.location.href = '/history'
              }
            }} 
          />
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
      <div className="px-6 pb-8">
        {/* Create Event Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateEvent(true)}
            className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create New Event</span>
            </div>
          </button>
        </div>

        {/* Events Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Upcoming Events</h2>
          {events.length === 0 ? (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Calendar className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white mb-2">No events created yet</p>
              <p className="text-green-200 text-sm">Create your first training event to start banking workouts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event: AppEvent) => {
                const eventGoal = goals.find(g => g.event_id === event.id);
                const daysRemaining = Math.max(0, Math.ceil((new Date(event.event_date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)));
                
                return (
                  <div key={event.id} className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{event.name}</h3>
                        <p className="text-gray-600 mb-2">
                          {new Date(event.event_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {event.goal && (
                          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium mb-2">
                            Goal: {event.goal}
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          {daysRemaining === 0 ? 'Today!' : daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Goal for this event */}
                    {eventGoal ? (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">Your Training Goal</h4>
                          <button
                            onClick={() => handleDeleteGoal(eventGoal.id)}
                            className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{eventGoal.workouts_completed}</p>
                            <p className="text-sm text-gray-600">Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">{eventGoal.target_workouts}</p>
                            <p className="text-sm text-gray-600">Target</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">{eventGoal.hours_completed}h</p>
                            <p className="text-sm text-gray-600">Banked</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                              style={{width: `${Math.min(100, (eventGoal.workouts_completed / eventGoal.target_workouts) * 100)}%`}}
                            ></div>
                          </div>
                          <p className="text-center text-sm text-gray-600 mt-1">
                            {Math.round((eventGoal.workouts_completed / eventGoal.target_workouts) * 100)}% Complete
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-200 pt-4">
                        <button
                          onClick={() => handleCreateGoalForEvent(event.id)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                        >
                          Create Training Goal
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      {(showCreateEvent || editingEvent) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 m-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  name="name"
                  value={eventForm.name}
                  onChange={handleEventFormChange}
                  placeholder="e.g., Marathon, Triathlon"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Event Date</label>
                <input
                  type="date"
                  name="eventDate"
                  value={eventForm.eventDate}
                  onChange={handleEventFormChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Goal (Optional)</label>
                <input
                  type="text"
                  name="goal"
                  value={eventForm.goal}
                  onChange={handleEventFormChange}
                  placeholder="e.g., Finish under 4 hours"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={resetForms}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                disabled={!eventForm.name || !eventForm.eventDate || isSubmitting}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  !eventForm.name || !eventForm.eventDate || isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                }`}
              >
                {isSubmitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 m-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create Training Goal</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Target Workouts</label>
                <input
                  type="number"
                  name="targetWorkouts"
                  value={goalForm.targetWorkouts || ''}
                  onChange={handleGoalFormChange}
                  min="1"
                  max="365"
                  placeholder={selectedEventForGoal && events.find(e => e.id === selectedEventForGoal) 
                    ? `Suggested: ${calculateTargetWorkouts(events.find(e => e.id === selectedEventForGoal)!.event_date)}` 
                    : '20'}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                {selectedEventForGoal && events.find(e => e.id === selectedEventForGoal) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Based on your weekly frequency: {calculateTargetWorkouts(events.find(e => e.id === selectedEventForGoal)!.event_date)} workouts recommended
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={resetForms}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={!goalForm.eventId || goalForm.targetWorkouts <= 0 || isSubmitting}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  !goalForm.eventId || goalForm.targetWorkouts <= 0 || isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackButton />
    </div>
  );
};

// PROFILE VIEW COMPONENT - Fully Converted to TypeScript ✅
const ProfileView: React.FC<ProfileViewProps> = ({
  setCurrentView,
  user,
  userSettings,
  handleDistancePreferencesChange,
  goalHours,
  goalMinutes,
  handleWeeklyGoalChange,
  handleSignOut,
  showAddNewActivity,
  setShowAddNewActivity,
  newActivityName,
  setNewActivityName,
  handleDeleteCustomActivity,
  handleAddNewActivityFromProfile,
  workoutTypes
}) => {
  // Local state for settings management
  const [tempGoalHours, setTempGoalHours] = useState<number>(goalHours);
  const [tempGoalMinutes, setTempGoalMinutes] = useState<number>(goalMinutes);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editingActivityName, setEditingActivityName] = useState<string>('');
  const [isUpdatingGoal, setIsUpdatingGoal] = useState<boolean>(false);
  
  // Update local state when props change
  useEffect(() => {
    setTempGoalHours(goalHours);
    setTempGoalMinutes(goalMinutes);
  }, [goalHours, goalMinutes]);

  // Form handlers
  const handleGoalHoursChange = useCallback<ChangeEventHandler>((e) => {
    const value = parseInt(e.target.value) || 0;
    setTempGoalHours(Math.max(0, Math.min(23, value)));
  }, []);

  const handleGoalMinutesChange = useCallback<ChangeEventHandler>((e) => {
    const value = parseInt(e.target.value) || 0;
    setTempGoalMinutes(Math.max(0, Math.min(59, value)));
  }, []);

  const handleSaveWeeklyGoal = useCallback(async (): Promise<void> => {
    setIsUpdatingGoal(true);
    try {
      await handleWeeklyGoalChange(tempGoalHours, tempGoalMinutes);
    } catch (error) {
      console.error('Error updating weekly goal:', error);
    } finally {
      setIsUpdatingGoal(false);
    }
  }, [tempGoalHours, tempGoalMinutes, handleWeeklyGoalChange]);

  const handleDistanceUnitChange = useCallback(async (category: string, unit: string): Promise<void> => {
    try {
      await handleDistancePreferencesChange(category, unit);
    } catch (error) {
      console.error('Error updating distance preferences:', error);
    }
  }, [handleDistancePreferencesChange]);

  const handleAddActivity = useCallback((): void => {
    if (newActivityName.trim()) {
      handleAddNewActivityFromProfile(newActivityName.trim());
      setNewActivityName('');
      setShowAddNewActivity(false);
    }
  }, [newActivityName, handleAddNewActivityFromProfile, setNewActivityName, setShowAddNewActivity]);

  const handleEditActivity = useCallback((activity: string): void => {
    setEditingActivity(activity);
    setEditingActivityName(activity);
  }, []);

  const handleSaveEditActivity = useCallback((): void => {
    if (editingActivity && editingActivityName.trim()) {
      handleAddNewActivityFromProfile(editingActivityName.trim(), editingActivity);
      setEditingActivity(null);
      setEditingActivityName('');
    }
  }, [editingActivity, editingActivityName, handleAddNewActivityFromProfile]);

  const handleCancelEdit = useCallback((): void => {
    setEditingActivity(null);
    setEditingActivityName('');
  }, []);

  const handleDeleteActivity = useCallback(async (activity: string): Promise<void> => {
    if (window.confirm(`Delete "${activity}" activity?`)) {
      try {
        await handleDeleteCustomActivity(activity);
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  }, [handleDeleteCustomActivity]);

  // Get custom activities (filter out default ones)
  const customActivities = workoutTypes.filter(type => 
    !defaultWorkoutTypes.includes(type)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-purple-200">Customize your preferences</p>
          </div>
          <StandardNavigation 
            currentPage="profile" 
            onNavigate={(view: string) => {
              if (view === 'log' || view === 'goals') {
                setCurrentView(view as ViewType)
              } else if (view === 'weekly') {
                window.location.href = '/weekly-view'
              } else if (view === 'history') {
                window.location.href = '/history'
              }
            }} 
          />
        </div>
      </div>

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
                            handleSaveEditActivity();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
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
                      handleAddActivity();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddNewActivity(false);
                  setNewActivityName('');
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
  );
};

// ===== MAIN ATHLETIC TRACKER COMPONENT (CONVERTED TO TYPESCRIPT) =====
const AthleticTracker: React.FC = () => {
  const { user, signOut } = useAuth();
  
  // ===== STATE MANAGEMENT (FULLY TYPED) =====
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      if (['log', 'goals', 'profile'].includes(viewParam || '')) {
        return viewParam as ViewType;
      }
    }
    return 'log';
  });

  // Voice integration state
  const [showVoiceExpanded, setShowVoiceExpanded] = useState<boolean>(false);
  const [isVoiceUploading, setIsVoiceUploading] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>('');
  const [lastLoggedWorkoutId, setLastLoggedWorkoutId] = useState<string | null>(null);
  
  // Workout state
  const [currentWorkout, setCurrentWorkout] = useState<CurrentWorkout>({
    type: '',
    duration: '',
    rating: null,
    date: new Date().toISOString().split('T')[0],
    distance: '',
    distanceUnit: ''
  });
  
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutTypes, setWorkoutTypes] = useState<string[]>(defaultWorkoutTypes);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showLogAnother, setShowLogAnother] = useState<boolean>(false);
  
  const [showDatePicker, setShowDatePicker] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('showDatePicker') === 'true';
    }
    return false;
  });
  
  const [showAddWorkoutType, setShowAddWorkoutType] = useState<boolean>(false);
    
  // Custom activity management state
  const [showAddNewActivity, setShowAddNewActivity] = useState<boolean>(false);
  const [newActivityName, setNewActivityName] = useState<string>('');
  const [editingActivityName, setEditingActivityName] = useState<string | null>(null);

  // User Settings State
  const [userSettings, setUserSettings] = useState<UserSettings>({
    distance_unit_cardio: 'miles',
    distance_unit_swimming: 'meters',
    weekly_goal_minutes: 300,
    weekly_workout_frequency: 4
  });
  
  // Goals & Events State
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoalsEvents, setIsLoadingGoalsEvents] = useState<boolean>(false);
  const [goalsEventsError, setGoalsEventsError] = useState<string>('');

  // Derived state
  const goalHours = Math.floor((userSettings?.weekly_goal_minutes || 300) / 60);
  const goalMinutes = (userSettings?.weekly_goal_minutes || 300) % 60;

  // ===== EFFECTS =====
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('view')) {
        url.searchParams.delete('view');
        window.history.replaceState({}, '', url);
      }
    }
  }, [currentView]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shouldShowDatePicker = urlParams.get('showDatePicker') === 'true';
      setShowDatePicker(shouldShowDatePicker);
    }
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        if (['log', 'goals', 'profile'].includes(viewParam || '')) {
          setCurrentView(viewParam as ViewType);
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('urlchange', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleUrlChange);
    };
  }, []);

  // ===== HANDLERS (FULLY TYPED) =====
  const loadUserData = async (): Promise<void> => {
    try {
      const [workoutsResponse, settingsResponse, customTypesResponse, eventsResponse, goalsResponse] = await Promise.all([
        dbHelpers.getUserWorkouts(),
        dbHelpers.getUserSettings(),
        dbHelpers.getUserCustomWorkoutTypes(),
        dbHelpers.getUserEvents(),
        dbHelpers.getUserGoals()
      ]);

      if (workoutsResponse.data) {
        setWorkouts(workoutsResponse.data);
      }

      if (settingsResponse.data) {
        setUserSettings(settingsResponse.data);
      }

      if (customTypesResponse.data) {
        const customTypeNames = customTypesResponse.data.map((type: any) => type.name);
        const allTypes = [...new Set([...defaultWorkoutTypes, ...customTypeNames])];
        setWorkoutTypes(allTypes);
      }
      
      if (eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
      
      if (goalsResponse.data) {
        setGoals(goalsResponse.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load your data. Please refresh the page.');
    }
  };

  const handleDurationChange = useCallback<ChangeEventHandler>((e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCurrentWorkout(prev => ({ ...prev, duration: value }));
    }
  }, []);

  const handleDistanceChange = useCallback<ChangeEventHandler>((e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCurrentWorkout(prev => ({ ...prev, distance: value }));
    }
  }, []);

  const handleDistanceUnitChange = useCallback<ChangeEventHandler>((e) => {
    const unit = e.target.value;
    setCurrentWorkout(prev => ({ ...prev, distanceUnit: unit }));
  }, []);

  const handleDateChange = useCallback<ChangeEventHandler>((e) => {
    setCurrentWorkout(prev => ({ ...prev, date: e.target.value }));
  }, []);

  const getDistanceUnitOptions = useCallback((): string[] => {
    const workoutType = currentWorkout.type?.toLowerCase() || '';
    if (workoutType.includes('swim')) {
      return distanceUnits.swimming;
    }
    return distanceUnits.cardio;
  }, [currentWorkout.type]);

  const distanceUnit = useMemo((): string => {
    const workoutType = currentWorkout.type?.toLowerCase() || '';
    if (workoutType.includes('swim')) {
      return userSettings?.distance_unit_swimming || 'meters';
    }
    return userSettings?.distance_unit_cardio || 'miles';
  }, [currentWorkout.type, userSettings]);

  const handleAddCustomType = useCallback(async (customType: string): Promise<void> => {
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
      const response = await dbHelpers.addCustomWorkoutType(newType);
      if (response.error) {
        console.error('Error saving custom workout type:', response.error);
        setError('Failed to save custom activity');
        return;
      }

      const updatedTypes = [...workoutTypes, newType];
      setWorkoutTypes(updatedTypes);
      setCurrentWorkout(prev => ({ ...prev, type: newType }));
      setShowAddWorkoutType(false);
    } catch (error) {
      console.error('Error saving custom workout type:', error);
      setError('Failed to save custom activity');
    }
  }, [workoutTypes]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!currentWorkout.type || !currentWorkout.duration || !currentWorkout.rating) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const workoutData = {
        workout_type: currentWorkout.type,  // ← FIXED: Changed from 'type' to 'workout_type'
        duration: parseInt(currentWorkout.duration),
        rating: currentWorkout.rating,
        date: currentWorkout.date,
        distance: currentWorkout.distance ? parseFloat(currentWorkout.distance) : undefined,
        distance_unit: currentWorkout.distance ? (currentWorkout.distanceUnit || distanceUnit) : undefined
      };

      const workoutResponse = await dbHelpers.createWorkout(workoutData);
      
      if (workoutResponse.data) {
        setLastLoggedWorkoutId(workoutResponse.data.id);
      }
      
      const updatedWorkoutsResponse = await dbHelpers.getUserWorkouts();
      if (updatedWorkoutsResponse.data) {
        setWorkouts(updatedWorkoutsResponse.data);
      }
      
      setShowSuccess(true);
      setShowVoiceExpanded(false);
      setCurrentWorkout({
        type: '',
        duration: '',
        rating: null,
        date: new Date().toISOString().split('T')[0],
        distance: '',
        distanceUnit: ''
      });
      setShowDatePicker(false);
      
    } catch (error) {
      console.error('Error submitting workout:', error);
      setError('Failed to save workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentWorkout, distanceUnit]);

  // Additional handlers for profile functionality
  const handleDistancePreferencesChange = useCallback(async (category: string, unit: string): Promise<void> => {
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

  const handleDeleteCustomActivity = useCallback(async (activityToDelete: string): Promise<void> => {
    try {
      const response = await dbHelpers.deleteCustomWorkoutType(activityToDelete);
      if (response.error) {
        console.error('Error deleting custom activity:', response.error);
        setError('Failed to delete activity');
        return;
      }
      
      const updatedTypes = workoutTypes.filter(type => type !== activityToDelete);
      setWorkoutTypes(updatedTypes);
    } catch (error) {
      console.error('Error deleting custom activity:', error);
      setError('Failed to delete activity');
    }
  }, [workoutTypes]);

  const handleAddNewActivityFromProfile = useCallback(async (newType: string, originalActivity?: string): Promise<void> => {
    if (!newType || !newType.trim()) {
      return;
    }

    const trimmedType = newType.trim();
    
    if (workoutTypes.includes(trimmedType) && trimmedType !== originalActivity) {
      setError('Activity already exists');
      return;
    }

    try {
      if (originalActivity && originalActivity !== trimmedType) {
        const deleteResponse = await dbHelpers.deleteCustomWorkoutType(originalActivity);
        if (deleteResponse.error) {
          console.error('Error deleting old activity:', deleteResponse.error);
          setError('Failed to update activity');
          return;
        }
      }
      
      if (!originalActivity || originalActivity !== trimmedType) {
        const response = await dbHelpers.addCustomWorkoutType(trimmedType);
        if (response.error) {
          console.error('Error adding/updating activity:', response.error);
          setError('Failed to save activity');
          return;
        }
      }
      
      let updatedTypes: string[];
      if (originalActivity && originalActivity !== trimmedType) {
        updatedTypes = workoutTypes.map(type => 
          type === originalActivity ? trimmedType : type
        );
      } else if (!workoutTypes.includes(trimmedType)) {
        updatedTypes = [...workoutTypes, trimmedType];
      } else {
        updatedTypes = workoutTypes;
      }
      
      setWorkoutTypes(updatedTypes);
      setError('');
    } catch (error) {
      console.error('Error adding/updating activity:', error);
      setError('Failed to save activity');
    }
  }, [workoutTypes]);

  const handleWeeklyGoalChange = useCallback(async (hours: number, minutes: number): Promise<void> => {
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

  // Goals & Events handlers
  const handleEventCreate = useCallback(async (eventData: EventFormData): Promise<void> => {
    setIsLoadingGoalsEvents(true);
    setGoalsEventsError('');
    
    try {
      const response = await dbHelpers.createEvent(eventData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Reload events
      const eventsResponse = await dbHelpers.getUserEvents();
      if (eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setGoalsEventsError('Failed to create event. Please try again.');
      throw error;
    } finally {
      setIsLoadingGoalsEvents(false);
    }
  }, []);

  const handleEventUpdate = useCallback(async (eventId: string, eventData: EventFormData): Promise<void> => {
    setIsLoadingGoalsEvents(true);
    setGoalsEventsError('');
    
    try {
      const response = await dbHelpers.updateEvent(eventId, eventData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Reload events
      const eventsResponse = await dbHelpers.getUserEvents();
      if (eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setGoalsEventsError('Failed to update event. Please try again.');
      throw error;
    } finally {
      setIsLoadingGoalsEvents(false);
    }
  }, []);

  const handleEventDelete = useCallback(async (eventId: string): Promise<void> => {
    setIsLoadingGoalsEvents(true);
    setGoalsEventsError('');
    
    try {
      const response = await dbHelpers.deleteEvent(eventId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Reload both events and goals (cascade delete)
      const [eventsResponse, goalsResponse] = await Promise.all([
        dbHelpers.getUserEvents(),
        dbHelpers.getUserGoals()
      ]);
      
      if (eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
      
      if (goalsResponse.data) {
        setGoals(goalsResponse.data);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setGoalsEventsError('Failed to delete event. Please try again.');
      throw error;
    } finally {
      setIsLoadingGoalsEvents(false);
    }
  }, []);

  const handleGoalCreate = useCallback(async (goalData: GoalFormData): Promise<void> => {
    setIsLoadingGoalsEvents(true);
    setGoalsEventsError('');
    
    try {
      const response = await dbHelpers.createGoal(goalData.eventId, goalData.targetWorkouts);
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Reload goals
      const goalsResponse = await dbHelpers.getUserGoals();
      if (goalsResponse.data) {
        setGoals(goalsResponse.data);
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      setGoalsEventsError('Failed to create goal. Please try again.');
      throw error;
    } finally {
      setIsLoadingGoalsEvents(false);
    }
  }, []);

  const handleGoalDelete = useCallback(async (goalId: string): Promise<void> => {
    setIsLoadingGoalsEvents(true);
    setGoalsEventsError('');
    
    try {
      const response = await dbHelpers.deleteGoal(goalId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Reload goals
      const goalsResponse = await dbHelpers.getUserGoals();
      if (goalsResponse.data) {
        setGoals(goalsResponse.data);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      setGoalsEventsError('Failed to delete goal. Please try again.');
      throw error;
    } finally {
      setIsLoadingGoalsEvents(false);
    }
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error signing out:', error);
        setError('Failed to sign out. Please try again.');
      } else {
        console.log('Successfully signed out');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  }, [signOut]);

  // Voice note handlers with TypeScript
  const handleAddVoiceNote = useCallback((): void => {
    setShowVoiceExpanded(true);
    setVoiceError(''); // Clear any previous errors
  }, []);

  const handleVoiceUpload = useCallback(async (audioBlob: Blob): Promise<void> => {
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

  const handleSkipToHistory = useCallback((): void => {
    setShowSuccess(false);
    setShowVoiceExpanded(false);
    window.location.href = '/history';
  }, []);

  const handleCollapseVoiceModal = useCallback((): void => {
    setShowVoiceExpanded(false);
    setVoiceError(''); // Clear errors when collapsing
  }, []);

  // Success message handler with TypeScript
  const handleShowSuccessMessage = useCallback((): React.ReactElement => {
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

  // ===== COMPUTED VALUES (FULLY TYPED) =====
  const weeklyStats = useMemo((): WeeklyStats => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const thisWeekWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date + 'T00:00:00');
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

  const weeklyGoalProgress = useMemo((): WeeklyGoalProgress => {
    const goalMinutes = userSettings?.weekly_goal_minutes || 300;
    const currentMinutes = weeklyStats.totalTime;
    const percentage = Math.round((currentMinutes / goalMinutes) * 100);
    
    return {
      current: formatTime(currentMinutes),
      goal: formatTime(goalMinutes),
      percentage
    };
  }, [weeklyStats.totalTime, userSettings?.weekly_goal_minutes]);

  const weeklyStreak = useMemo((): number => {
    let streak = 0;
    const now = new Date();
    
    for (let i = 0; i < 52; i++) {
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

  // ===== RENDER =====
  if (currentView === 'goals') {
    return (
      <GoalsAndEventsView 
        setCurrentView={setCurrentView}
        events={events}
        goals={goals}
        userSettings={userSettings}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        onGoalCreate={handleGoalCreate}
        onGoalDelete={handleGoalDelete}
        isLoading={isLoadingGoalsEvents}
        error={goalsEventsError}
        onGoalCreated={() => {
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