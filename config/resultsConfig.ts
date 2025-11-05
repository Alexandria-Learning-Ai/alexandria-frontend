import { API_BASE_URL } from './api';

/**
 * Results Screen Configuration
 *
 * Centralized configuration for quiz results functionality
 */
export const resultsConfig = {
  // API Endpoints
  API_ENDPOINT: `${API_BASE_URL}/generate-explanation`,
  COACH_API_ENDPOINT: `${API_BASE_URL}/generate-coach-message`,

  // Data Limits
  MAX_QUIZ_HISTORY: 100,
  MAX_ANALYTICS_DAYS: 60,

  // Request Settings
  REQUEST_TIMEOUT: 30000,

  // App Information
  APP_VERSION: '1.0.0',
  APP_SCHEME: 'quizapp',
  DEEP_LINK_DOMAIN: 'quizapp.com',

  // Store URLs
  APP_STORE_URL: 'https://apps.apple.com/app/your-quiz-app/id123456789',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.yourcompany.quizapp',
  WEB_APP_URL: 'https://quizapp.com',

  // Feature Flags
  ENABLE_API_EXPLANATIONS: true,
  ENABLE_AI_COACH: true,
  ENABLE_VOICE_FEEDBACK: false,
  ENABLE_SHARE_FEATURES: true,
} as const;

export type ResultsConfig = typeof resultsConfig;
