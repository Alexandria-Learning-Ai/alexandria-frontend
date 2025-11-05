/**
 * Quiz Progress Service - API service for saving and loading quiz progress
 *
 * Features:
 * - Save current quiz state to backend
 * - Load saved quiz progress
 * - Delete saved progress
 * - Full TypeScript type safety
 * - Error handling with detailed messages
 * - Authentication token support
 *
 * Backend API Specification:
 * - Endpoint: POST /api/v1/quiz-progress/save
 * - Request: quiz_id, quiz_source, quiz_data, current_question_index, answers_so_far, time_spent_seconds
 * - Response: saved_progress_id, expires_at, success message
 */

import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { auth } from '../firebaseConfig';

// ==================== TYPE DEFINITIONS ====================

/**
 * Quiz progress save request payload
 */
export interface SaveQuizProgressRequest {
  quiz_id: string;
  quiz_source: 'quiz' | 'book_study' | 'challenge' | 'shared';
  quiz_data: {
    title: string;
    questions: any[];
    metadata?: Record<string, any>;
  };
  current_question_index: number;
  answers_so_far: Record<string, any>;
  time_spent_seconds: number;
  quiz_metadata?: {
    isChallenge?: boolean;
    challengeId?: string | null;
    materialId?: string | null;
    sharedQuizId?: string | null;
  };
}

/**
 * Quiz progress save response
 */
export interface SaveQuizProgressResponse {
  success: boolean;
  saved_progress_id: string;
  expires_at: string;
  message: string;
}

/**
 * Quiz progress load response
 */
export interface LoadQuizProgressResponse {
  success: boolean;
  progress: {
    quiz_id: string;
    quiz_source: string;
    quiz_data: {
      title: string;
      questions: any[];
      metadata?: Record<string, any>;
    };
    current_question_index: number;
    answers_so_far: Record<string, any>;
    time_spent_seconds: number;
    quiz_metadata?: Record<string, any>;
    created_at: string;
    expires_at: string;
  };
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

// ==================== SERVICE FUNCTIONS ====================

/**
 * Get authentication token from Firebase
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      logger.warn('No authenticated user found for quiz progress save');
      return null;
    }
    return await currentUser.getIdToken();
  } catch (error) {
    logger.error('Failed to get auth token', error);
    return null;
  }
};

/**
 * Save quiz progress to backend
 *
 * @param progressData - Quiz progress data to save
 * @returns Save response with progress ID and expiration
 * @throws Error if save fails
 */
export const saveQuizProgress = async (
  progressData: SaveQuizProgressRequest
): Promise<SaveQuizProgressResponse> => {
  try {
    logger.info('Saving quiz progress', {
      quiz_id: progressData.quiz_id,
      source: progressData.quiz_source,
      current_index: progressData.current_question_index,
      total_questions: progressData.quiz_data.questions.length,
    });

    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required to save quiz progress');
    }

    // Make API request
    const response = await fetch(`${API_BASE_URL}/api/v1/quiz-progress/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(progressData),
    });

    // Parse response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      logger.error('Failed to save quiz progress', {
        status: response.status,
        error: errorData.error,
        details: errorData.details,
      });
      throw new Error(errorData.error || 'Failed to save quiz progress');
    }

    logger.success('Quiz progress saved successfully', {
      progress_id: data.saved_progress_id,
      expires_at: data.expires_at,
    });

    return data as SaveQuizProgressResponse;
  } catch (error) {
    logger.error('Error in saveQuizProgress', error);
    throw error;
  }
};

/**
 * Load saved quiz progress from backend
 *
 * @param progressId - ID of saved progress to load
 * @returns Saved quiz progress data
 * @throws Error if load fails
 */
export const loadQuizProgress = async (
  progressId: string
): Promise<LoadQuizProgressResponse> => {
  try {
    logger.info('Loading quiz progress', { progress_id: progressId });

    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required to load quiz progress');
    }

    // Make API request
    const response = await fetch(
      `${API_BASE_URL}/api/v1/quiz-progress/load/${progressId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    // Parse response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      logger.error('Failed to load quiz progress', {
        status: response.status,
        error: errorData.error,
      });
      throw new Error(errorData.error || 'Failed to load quiz progress');
    }

    logger.success('Quiz progress loaded successfully', {
      progress_id: progressId,
      current_index: data.progress.current_question_index,
    });

    return data as LoadQuizProgressResponse;
  } catch (error) {
    logger.error('Error in loadQuizProgress', error);
    throw error;
  }
};

/**
 * Delete saved quiz progress from backend
 *
 * @param progressId - ID of saved progress to delete
 * @returns Success confirmation
 * @throws Error if delete fails
 */
export const deleteQuizProgress = async (progressId: string): Promise<void> => {
  try {
    logger.info('Deleting quiz progress', { progress_id: progressId });

    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required to delete quiz progress');
    }

    // Make API request
    const response = await fetch(
      `${API_BASE_URL}/api/v1/quiz-progress/delete/${progressId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    // Check for errors
    if (!response.ok) {
      const data = await response.json();
      const errorData = data as ApiErrorResponse;
      logger.error('Failed to delete quiz progress', {
        status: response.status,
        error: errorData.error,
      });
      throw new Error(errorData.error || 'Failed to delete quiz progress');
    }

    logger.success('Quiz progress deleted successfully', {
      progress_id: progressId,
    });
  } catch (error) {
    logger.error('Error in deleteQuizProgress', error);
    throw error;
  }
};

/**
 * List all saved quiz progress for current user
 *
 * @returns Array of saved quiz progress summaries
 * @throws Error if list fails
 */
export const listSavedQuizzes = async (): Promise<any[]> => {
  try {
    logger.info('Listing saved quiz progress');

    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required to list saved quizzes');
    }

    // Make API request
    const response = await fetch(`${API_BASE_URL}/api/v1/quiz-progress/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Parse response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      logger.error('Failed to list saved quizzes', {
        status: response.status,
        error: errorData.error,
      });
      throw new Error(errorData.error || 'Failed to list saved quizzes');
    }

    logger.success('Saved quizzes listed successfully', {
      count: data.saved_quizzes?.length || 0,
    });

    return data.saved_quizzes || [];
  } catch (error) {
    logger.error('Error in listSavedQuizzes', error);
    throw error;
  }
};

export default {
  saveQuizProgress,
  loadQuizProgress,
  deleteQuizProgress,
  listSavedQuizzes,
};
