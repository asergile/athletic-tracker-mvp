// Advanced Input Validation & Sanitization for Athletic Tracker
// Builds on existing security foundation with enterprise-grade validation

/**
 * SECURITY PRINCIPLE: Defense in Depth
 * - Client-side validation for UX
 * - Server-side validation for security  
 * - Database constraints as final safeguard
 */

// ===== TYPESCRIPT INTERFACES =====

interface SanitizeTextOptions {
  maxLength?: number
  minLength?: number
  allowNewlines?: boolean
  allowHtml?: boolean
  trim?: boolean
}

interface SanitizeNumberOptions {
  min?: number
  max?: number
  integer?: boolean
  required?: boolean
  defaultValue?: number
}

interface SanitizeDateOptions {
  required?: boolean
  minDate?: string | null
  maxDate?: string | null
}

interface WorkoutData {
  type?: string
  workout_type?: string
  duration: number | string
  rating: number | string
  date?: string
  distance?: number | string
  distance_unit?: string
  distanceUnit?: string
}

interface ValidatedWorkoutData {
  workout_type: string
  duration: number
  rating: number
  date: string
  distance?: number | null
  distance_unit?: string
}

interface ProfileData {
  display_name?: string
  avatar_url?: string
  privacy_level?: string
}

interface ValidatedProfileData {
  display_name?: string
  avatar_url?: string | null
  privacy_level?: string
}

// ===== INPUT SANITIZATION FUNCTIONS =====

/**
 * Sanitize text input - prevents XSS and normalizes data
 * @param input - Raw text input
 * @param options - Validation options
 * @returns Sanitized text
 */
export function sanitizeText(input: any, options: SanitizeTextOptions = {}): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const {
    maxLength = 255,
    minLength = 0,
    allowNewlines = false,
    allowHtml = false,
    trim = true
  } = options;

  let sanitized = input;

  // Trim whitespace if enabled
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Remove or escape HTML tags
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Enforce length limits
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Check minimum length
  if (sanitized.length < minLength) {
    throw new Error(`Input must be at least ${minLength} characters long`);
  }

  return sanitized;
}

/**
 * Sanitize and validate email address
 * @param email - Email address
 * @returns Validated email
 */
export function sanitizeEmail(email: any): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }

  const sanitized = email.trim().toLowerCase();
  
  // Email regex that matches database constraint
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  if (sanitized.length > 254) { // RFC 5321 limit
    throw new Error('Email address too long');
  }

  return sanitized;
}

/**
 * Sanitize and validate URL
 * @param url - URL to validate
 * @returns Validated URL
 */
export function sanitizeUrl(url: any): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const sanitized = url.trim();
  
  // URL validation that matches database constraint
  const urlRegex = /^https?:\/\//;
  
  if (!urlRegex.test(sanitized)) {
    throw new Error('URL must start with http:// or https://');
  }

  if (sanitized.length > 2048) { // Common URL length limit
    throw new Error('URL too long');
  }

  return sanitized;
}

/**
 * Sanitize numeric input with range validation
 * @param input - Numeric input
 * @param options - Validation options
 * @returns Validated number
 */
export function sanitizeNumber(input: any, options: SanitizeNumberOptions = {}): number | null {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
    required = true,
    defaultValue
  } = options;

  if (input === null || input === undefined || input === '') {
    if (required) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error('Number is required');
    }
    return defaultValue !== undefined ? defaultValue : null;
  }

  const num = Number(input);
  
  if (isNaN(num)) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('Invalid number format');
  }

  if (integer && !Number.isInteger(num)) {
    throw new Error('Value must be an integer');
  }

  if (num < min) {
    throw new Error(`Value must be at least ${min}`);
  }

  if (num > max) {
    throw new Error(`Value must be at most ${max}`);
  }

  return num;
}

/**
 * Sanitize date input
 * @param input - Date input
 * @param options - Validation options
 * @returns ISO date string (YYYY-MM-DD)
 */
export function sanitizeDate(input: any, options: SanitizeDateOptions = {}): string | null {
  const {
    required = true,
    minDate = null,
    maxDate = null
  } = options;

  if (!input) {
    if (required) {
      throw new Error('Date is required');
    }
    return null;
  }

  let date: Date;
  
  if (typeof input === 'string') {
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      date = new Date(input + 'T00:00:00.000Z');
    } else {
      date = new Date(input);
    }
  } else {
    date = new Date(input);
  }

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }

  // Validate date ranges
  if (minDate && date < new Date(minDate)) {
    throw new Error(`Date must be after ${minDate}`);
  }

  if (maxDate && date > new Date(maxDate)) {
    throw new Error(`Date must be before ${maxDate}`);
  }

  // Return ISO date string (YYYY-MM-DD)
  return date.toISOString().split('T')[0];
}

// ===== WORKOUT-SPECIFIC VALIDATION =====

/**
 * Validate workout type
 * @param workoutType - Workout type name
 * @returns Sanitized workout type
 */
export function validateWorkoutType(workoutType: any): string {
  return sanitizeText(workoutType, {
    maxLength: 50,
    minLength: 1,
    allowNewlines: false,
    allowHtml: false
  });
}

/**
 * Validate workout duration in minutes
 * @param duration - Duration in minutes
 * @returns Validated duration
 */
export function validateDuration(duration: any): number {
  const result = sanitizeNumber(duration, {
    min: 1,
    max: 1440, // 24 hours max
    integer: true,
    required: true
  });
  
  if (result === null) {
    throw new Error('Duration is required');
  }
  
  return result;
}

/**
 * Validate workout rating (1-3 scale)
 * @param rating - Workout rating
 * @returns Validated rating
 */
export function validateRating(rating: any): number {
  const validatedRating = sanitizeNumber(rating, {
    min: 1,
    max: 3,
    integer: true,
    required: true
  });

  if (validatedRating === null || ![1, 2, 3].includes(validatedRating)) {
    throw new Error('Rating must be 1, 2, or 3');
  }

  return validatedRating;
}

/**
 * Validate distance value
 * @param distance - Distance value
 * @param unit - Distance unit for context
 * @returns Validated distance or null
 */
export function validateDistance(distance: any, unit: string = 'miles'): number | null {
  if (!distance) {
    return null;
  }

  // Set reasonable limits based on unit
  const limits: Record<string, { min: number; max: number }> = {
    miles: { min: 0.01, max: 1000 },
    kilometers: { min: 0.01, max: 1600 },
    meters: { min: 1, max: 50000 },
    yards: { min: 1, max: 55000 }
  };

  const limit = limits[unit] || limits.miles;

  return sanitizeNumber(distance, {
    min: limit.min,
    max: limit.max,
    integer: false,
    required: false
  });
}

/**
 * Validate distance unit
 * @param unit - Distance unit
 * @returns Validated unit
 */
export function validateDistanceUnit(unit: any): string {
  const validUnits = ['miles', 'kilometers', 'meters', 'yards'];
  
  if (!unit || !validUnits.includes(unit)) {
    throw new Error('Invalid distance unit');
  }

  return unit;
}

// ===== PROFILE VALIDATION =====

/**
 * Validate display name
 * @param displayName - User's display name
 * @returns Validated display name
 */
export function validateDisplayName(displayName: any): string {
  return sanitizeText(displayName, {
    maxLength: 50,
    minLength: 1,
    allowNewlines: false,
    allowHtml: false
  });
}

/**
 * Validate privacy level
 * @param privacyLevel - Privacy level setting
 * @returns Validated privacy level
 */
export function validatePrivacyLevel(privacyLevel: any): string {
  const validLevels = ['private', 'coaches', 'public'];
  
  if (!validLevels.includes(privacyLevel)) {
    throw new Error('Invalid privacy level');
  }

  return privacyLevel;
}

// ===== BATCH VALIDATION FUNCTIONS =====

/**
 * Validate complete workout data
 * @param workoutData - Workout data object
 * @returns Validated and sanitized workout data
 */
export function validateWorkoutData(workoutData: WorkoutData): ValidatedWorkoutData {
  try {
    const validated: ValidatedWorkoutData = {
      workout_type: validateWorkoutType(workoutData.type || workoutData.workout_type),
      duration: validateDuration(workoutData.duration),
      rating: validateRating(workoutData.rating),
      date: sanitizeDate(workoutData.date, {
        required: false,
        maxDate: new Date().toISOString().split('T')[0] // No future dates
      }) || new Date().toISOString().split('T')[0]
    };

    // Handle optional distance
    if (workoutData.distance) {
      validated.distance = validateDistance(
        workoutData.distance, 
        workoutData.distance_unit || workoutData.distanceUnit
      );
      validated.distance_unit = validateDistanceUnit(
        workoutData.distance_unit || workoutData.distanceUnit || 'miles'
      );
    }

    return validated;
  } catch (error) {
    throw new Error(`Workout validation failed: ${(error as Error).message}`);
  }
}

/**
 * Validate profile update data
 * @param profileData - Profile data object
 * @returns Validated and sanitized profile data
 */
export function validateProfileData(profileData: ProfileData): ValidatedProfileData {
  try {
    const validated: ValidatedProfileData = {};

    if (profileData.display_name !== undefined) {
      validated.display_name = validateDisplayName(profileData.display_name);
    }

    if (profileData.avatar_url !== undefined) {
      validated.avatar_url = sanitizeUrl(profileData.avatar_url);
    }

    if (profileData.privacy_level !== undefined) {
      validated.privacy_level = validatePrivacyLevel(profileData.privacy_level);
    }

    // Note: Email is intentionally not included for security (immutable)
    
    return validated;
  } catch (error) {
    throw new Error(`Profile validation failed: ${(error as Error).message}`);
  }
}

// ===== SECURITY UTILITIES =====

/**
 * Rate limiting helper for validation operations
 * @param key - Rate limit key
 * @param maxAttempts - Maximum attempts
 * @param windowMs - Time window in milliseconds
 * @returns Whether operation is allowed
 */
export function checkRateLimit(key: string, maxAttempts: number = 100, windowMs: number = 60000): boolean {
  // Simple in-memory rate limiting for validation
  if (typeof window === 'undefined') return true; // Server-side always allowed
  
  const now = Date.now();
  const attempts: number[] = JSON.parse(localStorage.getItem(`rl_${key}`) || '[]');
  
  // Clean old attempts
  const validAttempts = attempts.filter(time => now - time < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return false;
  }
  
  validAttempts.push(now);
  localStorage.setItem(`rl_${key}`, JSON.stringify(validAttempts));
  
  return true;
}

/**
 * Secure error message formatter
 * @param error - Original error
 * @param context - Context for logging
 * @returns Safe error message for user
 */
export function formatSecureError(error: Error, context: string = 'operation'): string {
  // Log full error details for debugging (server-side only)
  if (typeof window === 'undefined') {
    console.error(`Security validation error in ${context}:`, error);
  }

  // Return safe, user-friendly error messages
  const safeMessages: Record<string, string> = {
    'Authentication required': 'Please sign in to continue',
    'Invalid email format': 'Please enter a valid email address',
    'Invalid number format': 'Please enter a valid number',
    'Invalid date format': 'Please enter a valid date',
    'URL must start with http': 'Please enter a complete URL starting with http:// or https://',
    'Rating must be 1, 2, or 3': 'Please select a rating from 1 to 3',
    'Input must be at least': 'Input is too short',
    'too long': 'Input is too long',
    'Value must be at least': 'Value is too small',
    'Value must be at most': 'Value is too large'
  };

  const message = error.message || 'An error occurred';
  
  // Find matching safe message
  for (const [pattern, safeMsg] of Object.entries(safeMessages)) {
    if (message.toLowerCase().includes(pattern.toLowerCase())) {
      return safeMsg;
    }
  }

  // Generic safe message for unknown errors
  return `Invalid ${context} data. Please check your input and try again.`;
}
