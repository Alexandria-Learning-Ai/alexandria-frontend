import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';
import OfflineManager from '../utils/OfflineManager';

/**
 * React Query Configuration
 *
 * Centralized caching and data fetching configuration for the entire app.
 *
 * Features:
 * - Smart retry logic with exponential backoff
 * - Network-aware refetching (pauses when offline)
 * - Stale time optimization for different data types
 * - Cache time configuration
 * - Error handling and logging
 */

// Default configuration for all queries
const defaultQueryConfig = {
  queries: {
    // How long data stays fresh (no refetch during this time)
    // CRITICAL FIX: Increased from 60s to 5 minutes to prevent excessive refetches
    staleTime: 5 * 60 * 1000, // 5 minutes (prevents rapid-fire refetches)

    // How long inactive data stays in cache
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

    // Retry failed requests
    retry: (failureCount: number, error: any) => {
      const status = error?.response?.status;

      // CRITICAL FIX: 429 (Rate Limited): Don't retry - circuit breaker
      if (status === 429) {
        logger.error('Rate limit hit - circuit breaker activated, no retries', {
          failureCount,
          status
        });
        return false; // Don't retry 429s - let circuit breaker handle it
      }

      // Other 4xx errors (client errors like 400, 401, 403, 404): Don't retry
      if (status >= 400 && status < 500) {
        return false;
      }

      // 5xx errors (server errors) or network errors: Retry up to 2 times (reduced from 3)
      return failureCount < 2;
    },

    // Exponential backoff for retries (2s, 4s, 8s, up to 30s max)
    retryDelay: (attemptIndex: number, error: any) => {
      const status = error?.response?.status;

      // For 429 errors, respect Retry-After header if present
      if (status === 429) {
        const retryAfter = error?.response?.headers?.['retry-after'];
        if (retryAfter) {
          const delaySeconds = parseInt(retryAfter, 10);
          if (!isNaN(delaySeconds)) {
            logger.info('Rate limited - respecting Retry-After header', {
              retryAfter: delaySeconds,
              attemptIndex
            });
            return delaySeconds * 1000; // Convert to ms
          }
        }
        // If no Retry-After header, use longer backoff for rate limits
        logger.info('Rate limited - using exponential backoff', { attemptIndex });
        return Math.min(5000 * 2 ** attemptIndex, 60000); // 5s, 10s, 20s, ... up to 60s
      }

      // Standard exponential backoff for other errors (1s, 2s, 4s, ...)
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },

    // Refetch behavior
    // CRITICAL FIX: Disable refetchOnWindowFocus to prevent cascade of requests
    refetchOnWindowFocus: false,  // Disabled - was causing request storms
    refetchOnReconnect: false,    // Keep disabled - already handled with debounce in useProgressSync
    refetchOnMount: false,        // CRITICAL FIX: Disabled - rely on cache for initial render

    // Network mode - determines query behavior when offline
    networkMode: 'online' as const, // Only run queries when online
  },

  mutations: {
    // Retry mutations once by default
    retry: 1,
    retryDelay: 1000,

    // Network mode for mutations
    networkMode: 'online' as const,
  },
};

// Create query client instance
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryConfig,
});

/**
 * Integrate React Query with OfflineManager
 *
 * This persists query cache to OfflineManager for offline support
 * and hydrates cache on app startup
 */

// Map query keys to OfflineManager cache keys for better organization
const getOfflineManagerKey = (queryKey: readonly unknown[]): string | null => {
  const keyStr = JSON.stringify(queryKey);

  // Map specific query keys to OfflineManager cache keys
  if (keyStr.includes('"user","profile"')) {
    return OfflineManager.CACHE_KEYS.USER_PROFILE;
  }
  if (keyStr.includes('"quizzes","history"')) {
    return OfflineManager.CACHE_KEYS.QUIZ_HISTORY;
  }
  if (keyStr.includes('"flashcards"')) {
    return OfflineManager.CACHE_KEYS.FLASHCARDS;
  }

  // For other queries, use a generic cache key
  return `REACT_QUERY_${keyStr}`;
};

// Subscribe to query cache updates and persist to OfflineManager
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event?.query?.state?.data) {
    const queryKey = event.query.queryKey;
    const data = event.query.state.data;
    const cacheKey = getOfflineManagerKey(queryKey);

    if (cacheKey) {
      // Save to OfflineManager cache for persistence
      OfflineManager.cacheData(cacheKey, data).catch((error) => {
        logger.warn('Failed to persist query cache:', error);
      });
    }
  }
});

/**
 * Subscribe to mutation cache for offline queue integration
 *
 * When a mutation fails due to network issues, queue it in OfflineManager
 * for retry when network is restored
 */
queryClient.getMutationCache().subscribe((event) => {
  const mutation = event?.mutation;

  if (event?.type === 'updated' && mutation) {
    const { state, options } = mutation;

    // Check if mutation failed due to network error
    if (state.status === 'error' && !OfflineManager.isOnline) {
      const variables = state.variables;
      const mutationKey = options.mutationKey;

      // Determine action type from mutation key
      let actionType = 'UNKNOWN';
      if (mutationKey && Array.isArray(mutationKey)) {
        const keyStr = JSON.stringify(mutationKey);
        if (keyStr.includes('saveQuiz') || keyStr.includes('quiz')) {
          actionType = 'QUIZ_COMPLETED';
        } else if (keyStr.includes('profile')) {
          actionType = 'PROFILE_UPDATED';
        } else if (keyStr.includes('flashcard')) {
          actionType = 'FLASHCARD_PROGRESS';
        }
      }

      // Queue the failed mutation for offline retry
      if (actionType !== 'UNKNOWN') {
        OfflineManager.queueOfflineAction({
          type: actionType,
          data: variables,
          mutationKey,
        }).then(() => {
          logger.info(`📝 Queued failed ${actionType} mutation for offline retry`);
        }).catch((error) => {
          logger.error('Failed to queue offline action:', error);
        });
      }
    }
  }
});

/**
 * Hydrate React Query cache from OfflineManager on startup
 *
 * This loads previously cached data into React Query's cache
 * for instant offline access
 */
export const hydrateQueryCache = async () => {
  try {
    logger.info('💧 Hydrating React Query cache from OfflineManager...');

    // Hydrate user profile
    const userProfile = await OfflineManager.getCachedData(OfflineManager.CACHE_KEYS.USER_PROFILE);
    if (userProfile) {
      queryClient.setQueryData(queryKeys.user.profile, userProfile);
      logger.info('✅ Hydrated user profile cache');
    }

    // Hydrate quiz history
    const quizHistory = await OfflineManager.getCachedData(OfflineManager.CACHE_KEYS.QUIZ_HISTORY);
    if (quizHistory) {
      queryClient.setQueryData(queryKeys.quiz.history, quizHistory);
      logger.info('✅ Hydrated quiz history cache');
    }

    // Hydrate flashcards
    const flashcards = await OfflineManager.getCachedData(OfflineManager.CACHE_KEYS.FLASHCARDS);
    if (flashcards) {
      queryClient.setQueryData(queryKeys.flashcard.all, flashcards);
      logger.info('✅ Hydrated flashcards cache');
    }

    logger.info('✅ Query cache hydration complete');
  } catch (error) {
    logger.error('❌ Error hydrating query cache:', error);
  }
};

/**
 * Query Keys
 *
 * Centralized query key factory for consistent cache management
 */
export const queryKeys = {
  // User queries
  user: {
    profile: ['user', 'profile'] as const,
    settings: ['user', 'settings'] as const,
    subscription: ['user', 'subscription'] as const,
  },

  // Quiz queries
  quiz: {
    all: ['quizzes'] as const,
    history: ['quizzes', 'history'] as const,
    detail: (id: string) => ['quizzes', 'detail', id] as const,
    results: (id: string) => ['quizzes', 'results', id] as const,
  },

  // Flashcard queries
  flashcard: {
    all: ['flashcards'] as const,
    sets: ['flashcards', 'sets'] as const,
    detail: (id: string) => ['flashcards', 'detail', id] as const,
  },

  // Progress queries
  progress: {
    analytics: ['progress', 'analytics'] as const,
    subject: (subject: string) => ['progress', 'subject', subject] as const,
    overall: ['progress', 'overall'] as const,
    weaknesses: ['progress', 'weaknesses'] as const,
  },

  // Study materials
  materials: {
    all: ['materials'] as const,
    detail: (id: string) => ['materials', 'detail', id] as const,
  },

  // Courses
  courses: {
    all: ['courses'] as const,
    detail: (id: string) => ['courses', 'detail', id] as const,
    suggestions: ['courses', 'suggestions'] as const,
  },
};

/**
 * Cache invalidation helpers
 */
export const cacheHelpers = {
  // Invalidate all quiz-related queries
  invalidateQuizzes: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.quiz.all });
  },

  // Invalidate user profile
  invalidateUserProfile: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
  },

  // Invalidate progress analytics
  invalidateProgress: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.analytics });
  },

  // Invalidate all data (useful for logout)
  invalidateAll: () => {
    queryClient.invalidateQueries();
  },

  // Clear all cache (hard reset)
  clearCache: () => {
    queryClient.clear();
  },
};

/**
 * Network status monitoring
 *
 * Integrates with OfflineManager for unified network handling
 */
let unsubscribe: (() => void) | null = null;
let offlineUnsubscribe: (() => void) | null = null;

export const setupNetworkMonitoring = async () => {
  // Clean up existing listeners
  if (unsubscribe) {
    unsubscribe();
  }

  // Initialize OfflineManager
  await OfflineManager.initialize();

  // Hydrate React Query cache from OfflineManager
  await hydrateQueryCache();

  // Subscribe to OfflineManager's network listener
  offlineUnsubscribe = OfflineManager.addNetworkListener(({ isOnline, wasOffline }) => {
    logger.info(`📡 Network status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

    if (isOnline) {
      // Resume paused mutations when back online
      queryClient.resumePausedMutations();

      // Refetch active queries
      queryClient.refetchQueries({
        type: 'active',
      });

      // Process OfflineManager queue
      OfflineManager.processOfflineQueue();

      logger.info('✅ React Query + OfflineManager synced');
    }
  });

  // Also keep NetInfo listener for React Query's internal use
  unsubscribe = NetInfo.addEventListener(state => {
    const isOnline = state.isConnected && state.isInternetReachable;

    if (isOnline) {
      queryClient.resumePausedMutations();
      queryClient.refetchQueries({ type: 'active' });
    }
  });
};

// Clean up network monitoring
export const cleanupNetworkMonitoring = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

/**
 * Prefetch helpers for better UX
 */
export const prefetchHelpers = {
  // Prefetch user profile before navigating to profile screen
  prefetchUserProfile: async () => {
    // Implementation will be added when we create the profile query hook
    logger.info('Prefetching user profile...');
  },

  // Prefetch quiz history before navigating to history screen
  prefetchQuizHistory: async () => {
    logger.info('Prefetching quiz history...');
  },
};

export default queryClient;
