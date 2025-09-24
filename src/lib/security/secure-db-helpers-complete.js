/**
 * Backwards compatible wrapper for existing dbHelpers.getWorkoutStats
 * @returns {Promise<Object>} - Result in existing format
 */
export async function getWorkoutStatsCompatible() {
  try {
    const result = await getWorkoutStatsSecure();
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ===== ENHANCED SECURITY UTILITIES =====

/**
 * Validate SQL query parameters to prevent injection
 * @param {Array} params - Query parameters
 * @returns {boolean} - Whether parameters are safe
 */
export function validateQueryParams(params) {
  for (const param of params) {
    if (typeof param === 'string') {
      // Check for common SQL injection patterns
      const dangerousPatterns = [
        /('|(\\')|(;)|(\-\-)|(\|)|(\*)|(%)|(\+)/gi,
        /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi,
        /(script|javascript|vbscript|onload|onerror)/gi
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(param)) {
          console.warn('Potentially dangerous query parameter detected:', param.substring(0, 50));
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Log security events for monitoring
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 * @param {string} userEmail - User email (optional)
 */
export function logSecurityEvent(eventType, details, userEmail = null) {
  // Only log on server side to prevent client manipulation
  if (typeof window === 'undefined') {
    console.log('Security Event:', {
      type: eventType,
      timestamp: new Date().toISOString(),
      userEmail,
      details: details ? JSON.stringify(details).substring(0, 200) : null,
      ip: 'server-side' // In real implementation, capture actual IP
    });
  }
}

/**
 * Generate secure error ID for tracking
 * @returns {string} - Unique error ID
 */
export function generateErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== PERFORMANCE MONITORING =====

/**
 * Monitor query performance and log slow queries
 * @param {Function} queryFn - Query function to monitor
 * @param {string} queryName - Name for monitoring
 * @returns {Promise} - Query result
 */
export async function monitorQueryPerformance(queryFn, queryName) {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Log slow queries (>1 second)
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      logSecurityEvent('slow_query', { queryName, duration });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logSecurityEvent('query_error', { queryName, duration, error: error.message });
    throw error;
  }
}

// ===== EXPORT ALL FUNCTIONS =====

// Export enhanced versions as default
export {
  createWorkoutSecure as createWorkout,
  getUserWorkoutsSecure as getUserWorkouts,
  updateWorkoutSecure as updateWorkout,
  deleteWorkoutSecure as deleteWorkout,
  getUserProfileSecure as getUserProfile,
  updateUserProfileSecure as updateUserProfile,
  getUserSettingsSecure as getUserSettings,
  updateUserSettingsSecure as updateUserSettings,
  getUserCustomWorkoutTypesSecure as getUserCustomWorkoutTypes,
  addCustomWorkoutTypeSecure as addCustomWorkoutType,
  deleteCustomWorkoutTypeSecure as deleteCustomWorkoutType,
  getWorkoutStatsSecure as getWorkoutStats
};

// Export compatibility functions for gradual migration
export {
  createWorkoutCompatible,
  getUserWorkoutsCompatible,
  updateWorkoutCompatible,
  deleteWorkoutCompatible,
  getUserProfileCompatible,
  updateUserProfileCompatible,
  getUserSettingsCompatible,
  updateUserSettingsCompatible,
  getUserCustomWorkoutTypesCompatible,
  addCustomWorkoutTypeCompatible,
  deleteCustomWorkoutTypeCompatible,
  getWorkoutStatsCompatible
};