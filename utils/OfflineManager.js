/**
 * OfflineManager - Handles offline data caching and synchronization
 * Provides seamless offline experience by caching critical data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';


class OfflineManager {
  static CACHE_KEYS = {
    USER_PROFILE: 'cached_user_profile',
    QUIZ_HISTORY: 'cached_quiz_history',
    FLASHCARDS: 'cached_flashcards',
    EXAM_SCHEDULE: 'cached_exam_schedule',
    APP_CONFIG: 'cached_app_config',
    OFFLINE_ACTIONS: 'offline_actions_queue',
    LAST_SYNC: 'last_sync_timestamp',
    NETWORK_STATUS: 'network_status'
  };

  static CACHE_EXPIRY = {
    USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
    QUIZ_HISTORY: 7 * 24 * 60 * 60 * 1000, // 7 days
    FLASHCARDS: 24 * 60 * 60 * 1000, // 24 hours
    EXAM_SCHEDULE: 12 * 60 * 60 * 1000, // 12 hours
    APP_CONFIG: 60 * 60 * 1000, // 1 hour
  };

  static isOnline = true;
  static listeners = new Set();
  static offlineQueue = [];

  static async initialize() {
    try {
      // Subscribe to network changes
      const unsubscribe = NetInfo.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected;
        
        // Store network status
        AsyncStorage.setItem(this.CACHE_KEYS.NETWORK_STATUS, JSON.stringify({
          isConnected: state.isConnected,
          type: state.type,
          timestamp: Date.now()
        }));

        // Notify listeners of network change
        this.listeners.forEach(listener => {
          try {
            listener({ isOnline: this.isOnline, wasOffline, connectionInfo: state });
          } catch (error) {
            logger.error('Error in network listener:', error);
          }
        });

        // Process offline queue when coming back online
        if (wasOffline && this.isOnline) {
          this.processOfflineQueue();
        }
      });

      // Load offline queue
      await this.loadOfflineQueue();

      return unsubscribe;
    } catch (error) {
      logger.error('Error initializing OfflineManager:', error);
      return () => {};
    }
  }

  static addNetworkListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static async getNetworkStatus() {
    try {
      const cachedStatus = await AsyncStorage.getItem(this.CACHE_KEYS.NETWORK_STATUS);
      if (cachedStatus) {
        return JSON.parse(cachedStatus);
      }
    } catch (error) {
      logger.error('Error getting cached network status:', error);
    }
    return { isConnected: this.isOnline, timestamp: Date.now() };
  }

  // Cache data with expiry
  static async cacheData(key, data, customExpiry = null) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiry: customExpiry || this.CACHE_EXPIRY[key] || (24 * 60 * 60 * 1000)
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      logger.debug(`📦 Cached data for key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Error caching data for ${key}:`, error);
      return false;
    }
  }

  // Retrieve cached data
  static async getCachedData(key, fallbackToEmpty = true) {
    try {
      const cachedItem = await AsyncStorage.getItem(`cache_${key}`);
      if (!cachedItem) {
        return fallbackToEmpty ? null : undefined;
      }

      const { data, timestamp, expiry } = JSON.parse(cachedItem);
      const isExpired = Date.now() - timestamp > expiry;

      if (isExpired) {
        logger.debug(`🕒 Cache expired for key: ${key}`);
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      logger.debug(`✅ Retrieved cached data for key: ${key}`);
      return data;
    } catch (error) {
      logger.error(`Error retrieving cached data for ${key}:`, error);
      return null;
    }
  }

  // Check if data is cached and valid
  static async isCacheValid(key) {
    try {
      const cachedItem = await AsyncStorage.getItem(`cache_${key}`);
      if (!cachedItem) return false;

      const { timestamp, expiry } = JSON.parse(cachedItem);
      return Date.now() - timestamp <= expiry;
    } catch (error) {
      return false;
    }
  }

  // Queue actions for when back online
  static async queueOfflineAction(action) {
    try {
      this.offlineQueue.push({
        ...action,
        timestamp: Date.now(),
        id: Date.now().toString()
      });

      await AsyncStorage.setItem(
        this.CACHE_KEYS.OFFLINE_ACTIONS,
        JSON.stringify(this.offlineQueue)
      );

      logger.info(`📝 Queued offline action: ${action.type}`);
      return true;
    } catch (error) {
      logger.error('Error queuing offline action:', error);
      return false;
    }
  }

  // Load offline queue from storage
  static async loadOfflineQueue() {
    try {
      const queueData = await AsyncStorage.getItem(this.CACHE_KEYS.OFFLINE_ACTIONS);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        logger.info(`📥 Loaded ${this.offlineQueue.length} offline actions`);
      }
    } catch (error) {
      logger.error('Error loading offline queue:', error);
      this.offlineQueue = [];
    }
  }

  // Process queued actions when back online
  static async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      logger.info('📭 No offline actions to process');
      return;
    }

    logger.info(`🔄 Processing ${this.offlineQueue.length} offline actions`);

    const processedActions = [];
    const failedActions = [];
    const errors = [];

    for (const action of this.offlineQueue) {
      try {
        // Add retry count if not present
        if (!action.retryCount) {
          action.retryCount = 0;
        }

        logger.info(`⚙️ Processing action: ${action.type} (attempt ${action.retryCount + 1})`);

        const success = await this.executeOfflineAction(action);

        if (success) {
          processedActions.push(action.id);
          logger.info(`✅ Successfully processed: ${action.type}`);
        } else {
          // Increment retry count
          action.retryCount++;

          // Max retries: 5 attempts
          if (action.retryCount >= 5) {
            logger.error(`❌ Max retries exceeded for action ${action.id}:${action.type}`);
            errors.push({
              action: action.type,
              id: action.id,
              reason: 'Max retries exceeded',
              retryCount: action.retryCount,
            });
            // Remove from queue after max retries
          } else {
            logger.warn(`⚠️ Action failed, will retry (${action.retryCount}/5): ${action.type}`);
            failedActions.push(action);
          }
        }
      } catch (error) {
        logger.error(`❌ Error processing offline action ${action.id}:`, error);

        action.retryCount = (action.retryCount || 0) + 1;

        if (action.retryCount >= 5) {
          logger.error(`❌ Max retries exceeded for action ${action.id}`);
          errors.push({
            action: action.type,
            id: action.id,
            reason: error.message,
            retryCount: action.retryCount,
          });
        } else {
          failedActions.push(action);
        }
      }
    }

    // Update queue with only failed actions that haven't exceeded retry limit
    this.offlineQueue = failedActions;
    await AsyncStorage.setItem(
      this.CACHE_KEYS.OFFLINE_ACTIONS,
      JSON.stringify(this.offlineQueue)
    );

    // Log summary
    logger.info(`
      ✅ Offline Queue Processing Summary:
      - Processed: ${processedActions.length}
      - Failed (will retry): ${failedActions.length}
      - Permanently failed: ${errors.length}
    `);

    // Store errors for debugging
    if (errors.length > 0) {
      const errorLog = await AsyncStorage.getItem('offline_sync_errors') || '[]';
      const existingErrors = JSON.parse(errorLog);
      existingErrors.push({
        timestamp: Date.now(),
        errors,
      });
      await AsyncStorage.setItem('offline_sync_errors', JSON.stringify(existingErrors));
    }

    // Update last sync time
    await AsyncStorage.setItem(this.CACHE_KEYS.LAST_SYNC, Date.now().toString());

    return {
      processed: processedActions.length,
      failed: failedActions.length,
      errors: errors.length,
    };
  }

  // Execute individual offline action
  static async executeOfflineAction(action) {
    try {
      switch (action.type) {
        case 'QUIZ_COMPLETED':
          return await this.syncQuizCompletion(action.data);
        case 'PROFILE_UPDATED':
          return await this.syncProfileUpdate(action.data);
        case 'FLASHCARD_PROGRESS':
          return await this.syncFlashcardProgress(action.data);
        case 'EXAM_SCHEDULED':
          return await this.syncExamSchedule(action.data);
        default:
          logger.warn(`Unknown offline action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      logger.error(`Error executing offline action ${action.type}:`, error);
      return false;
    }
  }

  // Sync methods for different data types
  static async syncQuizCompletion(data) {
    try {
      logger.info('🔄 Syncing quiz completion to backend:', {
        id: data.id,
        title: data.title,
      });

      // Dynamically import to avoid circular dependency
      const { BackendSyncService } = await import('../services/BackendSyncService');

      // Prepare quiz data for backend
      const quizData = {
        id: data.id,
        questions: data.questions || [],
        userAnswers: data.userAnswers || {},
        totalQuestions: data.results?.totalQuestions || data.totalQuestions,
        correctCount: data.results?.correctCount || data.score,
        percentage: data.results?.percentage || data.percentage,
        title: data.title,
        metadata: data.metadata || {},
        timeSpent: data.metadata?.timeSpent || 0,
      };

      // Prepare progress data
      const progressData = {
        questionsAnswered: quizData.totalQuestions,
        questionsCorrect: quizData.correctCount,
        accuracy: quizData.percentage,
        timeSpent: quizData.timeSpent,
        subject: quizData.metadata?.subject,
        difficulty: quizData.metadata?.difficulty,
      };

      // Sync to backend
      const result = await BackendSyncService.syncQuizCompletion(
        quizData,
        progressData
      );

      if (result.success) {
        logger.info('✅ Quiz completion synced successfully');
        return true;
      } else {
        logger.warn('⚠️ Quiz sync returned unsuccessful result');
        return false;
      }
    } catch (error) {
      logger.error('❌ Failed to sync quiz completion:', error);
      return false;
    }
  }

  static async syncProfileUpdate(data) {
    try {
      logger.info('🔄 Syncing profile update to backend:', {
        fields: Object.keys(data),
      });

      // Dynamically import to avoid circular dependency
      const { BackendSyncService } = await import('../services/BackendSyncService');

      // Sync to backend
      const result = await BackendSyncService.updateUserProfile(data);

      if (result) {
        logger.info('✅ Profile update synced successfully');
        return true;
      } else {
        logger.warn('⚠️ Profile sync returned unsuccessful result');
        return false;
      }
    } catch (error) {
      logger.error('❌ Failed to sync profile update:', error);
      return false;
    }
  }

  static async syncFlashcardProgress(data) {
    try {
      logger.info('🔄 Syncing flashcard progress to backend:', {
        flashcardSetId: data.flashcardSetId,
        cardsReviewed: data.cardsReviewed,
      });

      // Dynamically import to avoid circular dependency
      const { BackendSyncService } = await import('../services/BackendSyncService');

      // Sync to backend
      const result = await BackendSyncService.updateFlashcardProgress(data);

      if (result && result.success) {
        logger.info('✅ Flashcard progress synced successfully');
        return true;
      } else {
        logger.warn('⚠️ Flashcard sync returned unsuccessful result');
        return false;
      }
    } catch (error) {
      logger.error('❌ Failed to sync flashcard progress:', error);
      return false;
    }
  }

  static async syncExamSchedule(data) {
    try {
      logger.info('🔄 Syncing exam schedule to backend:', {
        examId: data.examId,
        subject: data.subject,
        date: data.date,
      });

      // Dynamically import to avoid circular dependency
      const { BackendSyncService } = await import('../services/BackendSyncService');

      // Sync to backend
      const result = await BackendSyncService.updateExamSchedule(data);

      if (result) {
        logger.info('✅ Exam schedule synced successfully');
        return true;
      } else {
        logger.warn('⚠️ Exam schedule sync returned unsuccessful result');
        return false;
      }
    } catch (error) {
      logger.error('❌ Failed to sync exam schedule:', error);
      return false;
    }
  }

  // Get data with offline fallback
  static async getDataWithFallback(key, fetchFunction, forceRefresh = false) {
    try {
      // If online and not forcing refresh, try to fetch fresh data
      if (this.isOnline && !forceRefresh) {
        try {
          const freshData = await fetchFunction();
          if (freshData) {
            await this.cacheData(key, freshData);
            return { data: freshData, source: 'network' };
          }
        } catch (networkError) {
          logger.warn(`Network fetch failed for ${key}, falling back to cache:`, networkError);
        }
      }

      // Fallback to cached data
      const cachedData = await this.getCachedData(key);
      if (cachedData) {
        return { data: cachedData, source: 'cache' };
      }

      // No cached data available
      return { data: null, source: 'none' };
    } catch (error) {
      logger.error(`Error in getDataWithFallback for ${key}:`, error);
      return { data: null, source: 'error' };
    }
  }

  // Clear specific cache
  static async clearCache(key) {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
      logger.info(`🗑️ Cleared cache for key: ${key}`);
    } catch (error) {
      logger.error(`Error clearing cache for ${key}:`, error);
    }
  }

  // Clear all cached data
  static async clearAllCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      logger.info(`🗑️ Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      logger.error('Error clearing all cache:', error);
    }
  }

  // Get cache statistics
  static async getCacheStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      const stats = {
        totalCacheEntries: cacheKeys.length,
        validEntries: 0,
        expiredEntries: 0,
        totalSize: 0
      };

      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          stats.totalSize += item.length;
          try {
            const { timestamp, expiry } = JSON.parse(item);
            const isExpired = Date.now() - timestamp > expiry;
            if (isExpired) {
              stats.expiredEntries++;
            } else {
              stats.validEntries++;
            }
          } catch (parseError) {
            stats.expiredEntries++; // Consider parse errors as expired
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  // Cleanup expired cache entries
  static async cleanupExpiredCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      let cleanedCount = 0;

      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          try {
            const { timestamp, expiry } = JSON.parse(item);
            const isExpired = Date.now() - timestamp > expiry;
            if (isExpired) {
              await AsyncStorage.removeItem(key);
              cleanedCount++;
            }
          } catch (parseError) {
            // Remove corrupted cache entries
            await AsyncStorage.removeItem(key);
            cleanedCount++;
          }
        }
      }

      logger.info(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up expired cache:', error);
      return 0;
    }
  }

  // Get sync errors for debugging
  static async getSyncErrors() {
    try {
      const errorLog = await AsyncStorage.getItem('offline_sync_errors');
      if (!errorLog) return [];

      const errors = JSON.parse(errorLog);
      logger.info(`📋 Retrieved ${errors.length} sync error entries`);
      return errors;
    } catch (error) {
      logger.error('Error getting sync errors:', error);
      return [];
    }
  }

  // Clear sync error log
  static async clearSyncErrors() {
    try {
      await AsyncStorage.removeItem('offline_sync_errors');
      logger.info('🗑️ Sync error log cleared');
      return true;
    } catch (error) {
      logger.error('Error clearing sync errors:', error);
      return false;
    }
  }

  // Get sync status and statistics
  static async getSyncStatus() {
    try {
      const lastSync = await AsyncStorage.getItem(this.CACHE_KEYS.LAST_SYNC);
      const queueLength = this.offlineQueue.length;
      const errors = await this.getSyncErrors();

      const status = {
        isOnline: this.isOnline,
        lastSyncTime: lastSync ? parseInt(lastSync) : null,
        lastSyncDate: lastSync ? new Date(parseInt(lastSync)).toISOString() : null,
        queuedActions: queueLength,
        totalErrors: errors.reduce((sum, entry) => sum + entry.errors.length, 0),
        recentErrors: errors.slice(-5), // Last 5 error entries
      };

      logger.info('📊 Sync status:', status);
      return status;
    } catch (error) {
      logger.error('Error getting sync status:', error);
      return null;
    }
  }

  // Manually trigger sync (useful for debugging or user-initiated sync)
  static async manualSync() {
    try {
      logger.info('🔄 Manual sync triggered');

      if (!this.isOnline) {
        logger.warn('⚠️ Cannot sync: device is offline');
        return {
          success: false,
          reason: 'offline',
          message: 'Device is offline. Sync will run automatically when connection is restored.',
        };
      }

      const result = await this.processOfflineQueue();

      return {
        success: true,
        ...result,
        message: `Sync complete: ${result.processed} processed, ${result.failed} failed`,
      };
    } catch (error) {
      logger.error('❌ Manual sync failed:', error);
      return {
        success: false,
        reason: 'error',
        message: error.message,
      };
    }
  }
}

export default OfflineManager;