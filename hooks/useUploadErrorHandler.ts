import { useCallback } from 'react';
import { Alert } from 'react-native';
import logger from '../utils/logger';

/**
 * useUploadErrorHandler - Centralized error handling for upload operations
 *
 * Features:
 * - User-friendly error messages based on error type
 * - Error logging with full context
 * - Analytics tracking for error events
 * - Support for retry actions
 * - Handles network, auth, file size, rate limit, and server errors
 *
 * @example
 * const { handleError } = useUploadErrorHandler();
 *
 * try {
 *   await uploadFile();
 * } catch (error) {
 *   handleError(error, {
 *     operation: 'file_upload',
 *     userId: auth.currentUser?.uid,
 *     fileName: file.name,
 *   }, {
 *     retryAction: () => uploadFile(),
 *   });
 * }
 */

interface ErrorContext {
  operation: string;
  userId?: string;
  fileName?: string;
  [key: string]: any;
}

interface ErrorHandlerOptions {
  showAlert?: boolean;
  trackAnalytics?: boolean;
  retryAction?: () => void | Promise<void>;
}

interface ErrorResponse {
  status?: number;
  message?: string;
  name?: string;
}

export const useUploadErrorHandler = () => {
  const handleError = useCallback((
    error: any,
    context: ErrorContext,
    options: ErrorHandlerOptions = {}
  ): string => {
    const {
      showAlert = true,
      trackAnalytics = true,
      retryAction,
    } = options;

    // Extract error details
    const errorMessage = error?.message || String(error);
    const errorStatus = (error as ErrorResponse)?.status;
    const errorName = (error as ErrorResponse)?.name;

    // Log error with full context
    logger.error(`Upload error in ${context.operation}:`, {
      error: errorMessage,
      errorName,
      errorStatus,
      stack: error?.stack,
      context,
    });

    // Track in analytics (placeholder for future implementation)
    if (trackAnalytics) {
      try {
        // TODO: Integrate with analytics service (e.g., Firebase Analytics)
        logger.info('Analytics tracked:', {
          event: 'upload_error',
          operation: context.operation,
          error_message: errorMessage,
          error_type: errorName || 'Unknown',
          error_status: errorStatus,
          ...context,
        });
      } catch (analyticsError) {
        logger.warn('Failed to track analytics:', analyticsError);
      }
    }

    // Get user-friendly error message
    const friendlyMessage = getUserFriendlyErrorMessage(error, context);

    // Show alert to user
    if (showAlert) {
      const buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }> = [
        { text: 'Cancel', style: 'cancel' },
      ];

      if (retryAction) {
        buttons.unshift({
          text: 'Retry',
          onPress: () => {
            logger.info(`User initiated retry for: ${context.operation}`);
            retryAction();
          },
        });
      }

      Alert.alert('Upload Error', friendlyMessage, buttons);
    }

    return friendlyMessage;
  }, []);

  return { handleError };
};

/**
 * Converts technical error messages to user-friendly descriptions
 */
function getUserFriendlyErrorMessage(error: any, context: ErrorContext): string {
  const errorMessage = error?.message || String(error);
  const errorStatus = (error as ErrorResponse)?.status;

  // Network errors
  if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  // File size errors
  if (errorMessage.includes('too large') || errorMessage.includes('size') || errorMessage.includes('exceeds')) {
    return 'File is too large. Maximum file size is 50MB.';
  }

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorStatus === 401) {
    return 'Please sign in to upload files and generate quizzes.';
  }

  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many') || errorStatus === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // File type errors
  if (errorMessage.includes('file type') || errorMessage.includes('format') || errorMessage.includes('not supported')) {
    return 'File type not supported. Please upload PDF, TXT, DOCX, or EPUB files.';
  }

  // Server errors (5xx)
  if (errorStatus && errorStatus >= 500) {
    return 'Server error occurred. Our team has been notified. Please try again later.';
  }

  // Client errors (4xx)
  if (errorStatus && errorStatus >= 400 && errorStatus < 500) {
    return `Request failed: ${errorMessage}. Please check your input and try again.`;
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'Request timed out. Please try again.';
  }

  // Analysis timeout (specific to file analysis)
  if (errorMessage.includes('Analysis timeout')) {
    return 'File analysis took too long. The file may be too complex. Try uploading a smaller file or continue without analysis.';
  }

  // Generic fallback with sanitized error message
  const sanitizedMessage = errorMessage.length > 100
    ? errorMessage.substring(0, 100) + '...'
    : errorMessage;

  return `Upload failed: ${sanitizedMessage}. Please try again.`;
}
