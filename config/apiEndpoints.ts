/**
 * API Endpoints Configuration
 *
 * Centralized API endpoint definitions for type-safe access throughout the app.
 * All endpoints are derived from the base API URL configured in api.ts.
 *
 * Usage:
 * ```typescript
 * import { API_ENDPOINTS } from '../config/apiEndpoints';
 *
 * const response = await axios.post(API_ENDPOINTS.study.extractText, formData);
 * ```
 *
 * Benefits:
 * - Single source of truth for all endpoints
 * - Type-safe endpoint access with autocomplete
 * - Easy to update or version endpoints
 * - Documentation in one place
 */

import { API_BASE_URL } from './api';

export const API_ENDPOINTS = {
  /**
   * Study Material Endpoints
   * Handles study material upload, text extraction, and management
   */
  study: {
    /** POST - Upload and extract text from study material */
    extractText: `${API_BASE_URL}/api/study/extract-text`,

    /** GET - Retrieve all study materials for a user */
    materials: `${API_BASE_URL}/api/study/materials`,

    /** GET - Get specific study material by ID */
    material: (materialId: string) => `${API_BASE_URL}/api/study/materials/${materialId}`,

    /** POST - Track study progress */
    progress: `${API_BASE_URL}/api/study/progress`,

    /** POST - Generate summary for study material */
    generateSummary: `${API_BASE_URL}/api/study/generate-summary`,

    /** POST - Generate audio for study material (synchronous - may timeout for long texts) */
    generateAudio: `${API_BASE_URL}/api/study/generate-audio`,

    /** POST - Generate audio asynchronously (recommended for long texts) */
    generateAudioAsync: (materialId: string) => `${API_BASE_URL}/api/study/materials/${materialId}/audio/async`,

    /** GET - Poll audio generation job status */
    audioStatus: (materialId: string, jobId: string) => `${API_BASE_URL}/api/study/materials/${materialId}/audio/status/${jobId}`,

    /** GET - Get existing audio for material (cached) */
    getAudio: (materialId: string) => `${API_BASE_URL}/api/study/materials/${materialId}/audio`,

    /** POST - Generate chunked audio playlist (progressive delivery - RECOMMENDED) */
    generateAudioPlaylist: (materialId: string) => `${API_BASE_URL}/api/study/materials/${materialId}/audio/playlist`,

    /** GET - Get chunked audio playlist status */
    getAudioPlaylist: (materialId: string) => `${API_BASE_URL}/api/study/materials/${materialId}/audio/playlist`,

    /** POST - Retry failed track */
    retryTrack: (trackId: string) => `${API_BASE_URL}/api/study/audio/tracks/${trackId}/retry`,

    /** DELETE - Delete study material */
    deleteMaterial: (materialId: string) => `${API_BASE_URL}/api/study/materials/${materialId}`,
  },

  /**
   * Quiz Endpoints
   * Handles quiz generation, submission, and history
   */
  quiz: {
    /** POST - Generate quiz from uploaded file */
    generate: `${API_BASE_URL}/api/v1/upload/upload`,

    /** POST - Submit quiz answers and get results */
    submit: `${API_BASE_URL}/api/quiz/submit`,

    /** GET - Get quiz history for user */
    history: `${API_BASE_URL}/api/quiz/history`,

    /** GET - Get specific quiz by ID */
    getQuiz: (quizId: string) => `${API_BASE_URL}/api/quiz/${quizId}`,

    /** POST - Generate quiz from Ask Alexandria (text-based) */
    generateFromText: `${API_BASE_URL}/api/quiz/generate-from-text`,
  },

  /**
   * User Profile Endpoints
   * Handles user profile data, courses, and preferences
   */
  user: {
    /** GET - Get user profile */
    profile: `${API_BASE_URL}/api/user/profile`,

    /** PUT - Update user profile */
    updateProfile: `${API_BASE_URL}/api/user/profile`,

    /** GET - Get user courses */
    courses: `${API_BASE_URL}/api/user/courses`,

    /** POST - Add course to user profile */
    addCourse: `${API_BASE_URL}/api/user/courses`,

    /** DELETE - Remove course from user profile */
    removeCourse: (courseId: string) => `${API_BASE_URL}/api/user/courses/${courseId}`,

    /** POST - Validate course/subject name */
    validateCourse: `${API_BASE_URL}/api/user/validate-course`,
  },

  /**
   * Book Study Endpoints
   * Handles book-based study features (chapters, highlights, notes)
   */
  book: {
    /** POST - Upload book for study */
    upload: `${API_BASE_URL}/api/book/upload`,

    /** GET - Get all books for user */
    list: `${API_BASE_URL}/api/book/list`,

    /** GET - Get specific book by ID */
    getBook: (bookId: string) => `${API_BASE_URL}/api/book/${bookId}`,

    /** GET - Get book chapters */
    chapters: (bookId: string) => `${API_BASE_URL}/api/book/${bookId}/chapters`,

    /** POST - Add highlight to book */
    addHighlight: `${API_BASE_URL}/api/book/highlight`,

    /** POST - Add note to book */
    addNote: `${API_BASE_URL}/api/book/note`,

    /** POST - Update reading progress */
    updateProgress: `${API_BASE_URL}/api/book/progress`,
  },

  /**
   * Ask Alexandria Endpoints
   * AI chat and question answering
   */
  askAlexandria: {
    /** POST - Send message to Alexandria AI */
    chat: `${API_BASE_URL}/api/ask-alexandria/chat`,

    /** GET - Get chat history */
    history: `${API_BASE_URL}/api/ask-alexandria/history`,

    /** POST - Get AI explanation for a concept */
    explain: `${API_BASE_URL}/api/ask-alexandria/explain`,
  },

  /**
   * Analytics Endpoints
   * Usage tracking and performance metrics
   */
  analytics: {
    /** POST - Track user event */
    trackEvent: `${API_BASE_URL}/api/analytics/event`,

    /** GET - Get user statistics */
    stats: `${API_BASE_URL}/api/analytics/stats`,

    /** GET - Get learning progress over time */
    progress: `${API_BASE_URL}/api/analytics/progress`,
  },

  /**
   * Health Check Endpoints
   */
  health: {
    /** GET - Check API health */
    status: `${API_BASE_URL}/health`,

    /** GET - Get API version */
    version: `${API_BASE_URL}/version`,
  },
} as const;

/**
 * Type-safe endpoint access
 * Extracts the type of all endpoints for use in type annotations
 */
export type ApiEndpoint = typeof API_ENDPOINTS;

/**
 * Helper function to build query parameters
 *
 * @param params - Object of query parameters
 * @returns Formatted query string
 *
 * @example
 * ```typescript
 * buildQueryParams({ page: 1, limit: 10 }) // "?page=1&limit=10"
 * ```
 */
export const buildQueryParams = (params: Record<string, any>): string => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return queryString ? `?${queryString}` : '';
};

/**
 * Helper function to build full URL with query params
 *
 * @param endpoint - Base endpoint URL
 * @param params - Query parameters object
 * @returns Full URL with query string
 *
 * @example
 * ```typescript
 * buildUrl(API_ENDPOINTS.study.materials, { page: 1, limit: 10 })
 * // "https://api.example.com/api/study/materials?page=1&limit=10"
 * ```
 */
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  return `${endpoint}${buildQueryParams(params)}`;
};

/**
 * Export individual endpoint groups for convenience
 */
export const {
  study: STUDY_ENDPOINTS,
  quiz: QUIZ_ENDPOINTS,
  user: USER_ENDPOINTS,
  book: BOOK_ENDPOINTS,
  askAlexandria: ASK_ALEXANDRIA_ENDPOINTS,
  analytics: ANALYTICS_ENDPOINTS,
  health: HEALTH_ENDPOINTS,
} = API_ENDPOINTS;
