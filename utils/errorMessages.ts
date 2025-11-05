/**
 * errorMessages.ts
 *
 * User-friendly error message utility
 * Converts technical errors into helpful, actionable messages
 *
 * Features:
 * - Friendly error messages for common error types
 * - Network, auth, server, and file errors
 * - Consistent tone across the app
 * - Logs technical details while showing user-friendly messages
 */

import logger from './logger';

/**
 * Error types that can occur in the app
 */
export type ErrorType =
  | 'network'
  | 'auth'
  | 'not_found'
  | 'server'
  | 'timeout'
  | 'file_size'
  | 'file_type'
  | 'permission'
  | 'rate_limit'
  | 'unknown';

/**
 * Error context for enhanced messaging
 */
export interface ErrorContext {
  operation?: string; // What the user was trying to do
  resource?: string; // What resource was involved
  suggestion?: string; // Custom suggestion
}

/**
 * Convert technical error to user-friendly message
 *
 * @param error - Error object or error string
 * @param context - Optional context for more specific messaging
 * @returns User-friendly error message
 */
export const getUserFriendlyError = (
  error: Error | string,
  context?: ErrorContext
): string => {
  const errorStr = typeof error === 'string' ? error : error.message;
  const errorType = detectErrorType(errorStr);

  // Log technical details for debugging
  logger.error('Error occurred', {
    type: errorType,
    message: errorStr,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Return user-friendly message
  return getFriendlyMessage(errorType, context);
};

/**
 * Detect error type from error message
 */
const detectErrorType = (errorMessage: string): ErrorType => {
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('network request failed')
  ) {
    return 'network';
  }

  // Auth errors
  if (
    lowerMessage.includes('401') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('token') ||
    lowerMessage.includes('session')
  ) {
    return 'auth';
  }

  // Not found
  if (
    lowerMessage.includes('404') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('does not exist')
  ) {
    return 'not_found';
  }

  // Server errors
  if (
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('server error') ||
    lowerMessage.includes('internal error')
  ) {
    return 'server';
  }

  // Timeout
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('econnaborted')
  ) {
    return 'timeout';
  }

  // File size
  if (
    lowerMessage.includes('413') ||
    lowerMessage.includes('too large') ||
    lowerMessage.includes('file size') ||
    lowerMessage.includes('max size')
  ) {
    return 'file_size';
  }

  // File type
  if (
    lowerMessage.includes('415') ||
    lowerMessage.includes('unsupported') ||
    lowerMessage.includes('file type') ||
    lowerMessage.includes('invalid file')
  ) {
    return 'file_type';
  }

  // Permission
  if (
    lowerMessage.includes('403') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('permission')
  ) {
    return 'permission';
  }

  // Rate limiting
  if (
    lowerMessage.includes('429') ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many requests')
  ) {
    return 'rate_limit';
  }

  return 'unknown';
};

/**
 * Get friendly message for error type
 */
const getFriendlyMessage = (
  errorType: ErrorType,
  context?: ErrorContext
): string => {
  const operation = context?.operation || 'complete your request';
  const resource = context?.resource || 'content';

  switch (errorType) {
    case 'network':
      return context?.suggestion ||
        "Can't connect right now. Check your internet and try again.";

    case 'auth':
      return context?.suggestion ||
        "Your session expired. Please sign in again to continue.";

    case 'not_found':
      return context?.suggestion ||
        `We couldn't find that ${resource}. It may have been removed.`;

    case 'server':
      return context?.suggestion ||
        "Our servers are having a moment. Try again in a few seconds.";

    case 'timeout':
      return context?.suggestion ||
        `This is taking longer than expected. Try again?`;

    case 'file_size':
      return context?.suggestion ||
        "This file is too big. Try a file under 50MB.";

    case 'file_type':
      return context?.suggestion ||
        "This file type isn't supported. Try a PDF, image (PNG/JPG), or text file.";

    case 'permission':
      return context?.suggestion ||
        "You don't have permission to access this. Contact support if you think this is wrong.";

    case 'rate_limit':
      return context?.suggestion ||
        "You're going too fast! Please wait a moment before trying again.";

    case 'unknown':
    default:
      return context?.suggestion ||
        "Something went wrong. Please try again.";
  }
};

/**
 * Get retry-friendly message (includes action suggestion)
 */
export const getRetryMessage = (
  error: Error | string,
  context?: ErrorContext
): { message: string; canRetry: boolean; retryDelay?: number } => {
  const errorType = detectErrorType(
    typeof error === 'string' ? error : error.message
  );
  const friendlyMessage = getUserFriendlyError(error, context);

  switch (errorType) {
    case 'network':
      return {
        message: friendlyMessage,
        canRetry: true,
        retryDelay: 0,
      };

    case 'auth':
      return {
        message: friendlyMessage,
        canRetry: false, // Need to sign in, not just retry
      };

    case 'not_found':
      return {
        message: friendlyMessage,
        canRetry: false, // Won't exist on retry
      };

    case 'server':
      return {
        message: friendlyMessage,
        canRetry: true,
        retryDelay: 3000, // Wait 3 seconds before retry
      };

    case 'timeout':
      return {
        message: friendlyMessage,
        canRetry: true,
        retryDelay: 1000,
      };

    case 'rate_limit':
      return {
        message: friendlyMessage,
        canRetry: true,
        retryDelay: 5000, // Wait 5 seconds
      };

    case 'file_size':
    case 'file_type':
    case 'permission':
      return {
        message: friendlyMessage,
        canRetry: false, // User needs to fix issue first
      };

    case 'unknown':
    default:
      return {
        message: friendlyMessage,
        canRetry: true,
        retryDelay: 0,
      };
  }
};

/**
 * Get contextual error message for specific operations
 */
export const getOperationError = (
  operation: 'upload' | 'quiz_generation' | 'share' | 'leaderboard' | 'save',
  error: Error | string
): string => {
  const errorType = detectErrorType(
    typeof error === 'string' ? error : error.message
  );

  const contexts: Record<string, ErrorContext> = {
    upload: {
      operation: 'upload your file',
      resource: 'file',
    },
    quiz_generation: {
      operation: 'generate your quiz',
      resource: 'quiz',
    },
    share: {
      operation: 'share this quiz',
      resource: 'share link',
    },
    leaderboard: {
      operation: 'load the leaderboard',
      resource: 'leaderboard',
    },
    save: {
      operation: 'save your progress',
      resource: 'progress',
    },
  };

  return getUserFriendlyError(error, contexts[operation]);
};

/**
 * Format error for Alert dialog
 */
export const formatErrorAlert = (
  error: Error | string,
  context?: ErrorContext
): { title: string; message: string } => {
  const errorType = detectErrorType(
    typeof error === 'string' ? error : error.message
  );
  const friendlyMessage = getUserFriendlyError(error, context);

  const titles: Record<ErrorType, string> = {
    network: 'Connection Issue',
    auth: 'Session Expired',
    not_found: 'Not Found',
    server: 'Server Issue',
    timeout: 'Taking Too Long',
    file_size: 'File Too Large',
    file_type: 'Unsupported File',
    permission: 'Access Denied',
    rate_limit: 'Slow Down',
    unknown: 'Something Went Wrong',
  };

  return {
    title: titles[errorType],
    message: friendlyMessage,
  };
};

export default {
  getUserFriendlyError,
  getRetryMessage,
  getOperationError,
  formatErrorAlert,
};
