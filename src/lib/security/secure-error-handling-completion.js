  };
}

/**
 * React hook for secure error handling
 * @param {string} context - Default context
 * @returns {Object} - Error handling utilities
 */
export function useSecureErrorHandling(context = 'operation') {
  const handleError = (error, specificContext) => {
    return handleSecureError(error, specificContext || context);
  };
  
  const wrapAsync = (fn, specificContext) => {
    return withSecureErrorHandling(fn, specificContext || context);
  };
  
  return {
    handleError,
    wrapAsync,
    ERROR_TYPES,
    ERROR_SEVERITY
  };
}

// ===== ERROR RECOVERY UTILITIES =====

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result or final error
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    context = 'retry_operation'
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const errorInfo = classifyError(error);
      
      // Don't retry certain error types
      if (errorInfo.type === ERROR_TYPES.AUTHENTICATION ||
          errorInfo.type === ERROR_TYPES.AUTHORIZATION ||
          errorInfo.type === ERROR_TYPES.VALIDATION) {
        throw error;
      }
      
      // Don't retry if this is the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay * (0.5 + Math.random() * 0.5);
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${jitteredDelay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  // All retries failed, throw the last error with context
  throw handleSecureError(lastError, context);
}

// ===== EXPORT ERROR UTILITIES =====

export {
  handleSecureError as default,
  classifyError,
  getUserFriendlyMessage,
  getSafeErrorCode,
  isRecoverable,
  getRecommendedAction,
  withSecureErrorHandling,
  useSecureErrorHandling,
  retryWithBackoff
};