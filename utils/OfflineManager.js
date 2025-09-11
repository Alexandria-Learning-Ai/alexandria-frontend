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
      logger.info(`📦 Cached data for key: ${key}`);
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
        logger.info(`🕒 Cache expired for key: ${key}`);
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      logger.info(`✅ Retrieved cached data for key: ${key}`);
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
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    logger.info(`🔄 Processing ${this.offlineQueue.length} offline actions`);

    const processedActions = [];
    const failedActions = [];

    for (const action of this.offlineQueue) {
      try {
        const success = await this.executeOfflineAction(action);
        if (success) {
          processedActions.push(action.id);
        } else {
          failedActions.push(action);
        }
      } catch (error) {
        logger.error(`Error processing offline action ${action.id}:`, error);
        failedActions.push(action);
      }
    }

    // Remove processed actions
    this.offlineQueue = failedActions;
    await AsyncStorage.setItem(
      this.CACHE_KEYS.OFFLINE_ACTIONS,
      JSON.stringify(this.offlineQueue)
    );

    logger.info(`✅ Processed ${processedActions.length} actions, ${failedActions.length} failed`);

    // Update last sync time
    await AsyncStorage.setItem(this.CACHE_KEYS.LAST_SYNC, Date.now().toString());
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
    // Implementation would depend on your API
    logger.info('Syncing quiz completion:', data);
    return true; // Placeholder
  }

  static async syncProfileUpdate(data) {
    logger.info('Syncing profile update:', data);
    return true; // Placeholder
  }

  static async syncFlashcardProgress(data) {
    logger.info('Syncing flashcard progress:', data);
    return true; // Placeholder
  }

  static async syncExamSchedule(data) {
    logger.info('Syncing exam schedule:', data);
    return true; // Placeholder
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
}

export default OfflineManager;