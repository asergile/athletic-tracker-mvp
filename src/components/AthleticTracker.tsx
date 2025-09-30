import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Calendar, TrendingUp, Clock, Zap, Target, Activity, User, Flag, LogOut, BarChart3, Mic } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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

type ViewType = 'log';

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
  d.setHours(0, 0, 0, 0);  // Normalize to midnight
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
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
              if (view === 'log') {
                setCurrentView('log')
              } else if (view === 'goals') {
                window.location.href = '/goals'
              } else if (view === 'profile') {
                window.location.href = '/profile'
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


// ===== MAIN ATHLETIC TRACKER COMPONENT (CONVERTED TO TYPESCRIPT) =====
const AthleticTracker: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ===== STATE MANAGEMENT (FULLY TYPED) =====
  const [currentView, setCurrentView] = useState<ViewType>(() => {
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
  
  // Custom activity management state
  const [showAddWorkoutType, setShowAddWorkoutType] = useState<boolean>(false);

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
    console.log('[AthleticTracker] loadUserData called');
    try {
      const [workoutsResponse, settingsResponse, customTypesResponse, eventsResponse, goalsResponse] = await Promise.all([
        dbHelpers.getUserWorkouts(),
        dbHelpers.getUserSettings(),
        dbHelpers.getUserCustomWorkoutTypes(),
        dbHelpers.getUserEvents(),
        dbHelpers.getUserGoals()
      ]);

      console.log('[AthleticTracker] workoutsResponse:', { 
        hasData: !!workoutsResponse.data, 
        count: workoutsResponse.data?.length,
        error: workoutsResponse.error?.message 
      });

      if (workoutsResponse.data) {
        console.log('[AthleticTracker] Setting workouts state with', workoutsResponse.data.length, 'workouts');
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
    console.log('[AthleticTracker] weeklyStats calculation - workouts.length:', workouts.length);
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    console.log('[AthleticTracker] Week range:', weekStart.toISOString().split('T')[0], 'to', weekEnd.toISOString().split('T')[0]);
    
    const thisWeekWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date + 'T00:00:00');
      return workoutDate >= weekStart && workoutDate <= weekEnd;
    });

    console.log('[AthleticTracker] thisWeekWorkouts.length:', thisWeekWorkouts.length);
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
      weekStart.setHours(0, 0, 0, 0);  // Normalize to midnight
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