import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

const CACHE_PREFIX = 'upload_cache:';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedUploadResult {
  data: any;
  timestamp: number;
  expiresAt: number;
}

/**
 * Upload Cache Utility
 *
 * Provides client-side caching for upload results to improve performance
 * and reduce server load for duplicate uploads.
 *
 * Features:
 * - Time-based expiration (24 hours default)
 * - Automatic cache cleanup
 * - Type-safe cache retrieval
 * - Memory-efficient storage
 */
class UploadCache {
  /**
   * Store upload result in cache
   *
   * @param cacheKey - Unique cache key (generated from file hash + params)
   * @param data - Upload result data to cache
   * @param expiryMs - Cache expiry time in milliseconds (default: 24 hours)
   */
  async set(
    cacheKey: string,
    data: any,
    expiryMs: number = CACHE_EXPIRY_MS
  ): Promise<void> {
    try {
      const now = Date.now();
      const cacheData: CachedUploadResult = {
        data,
        timestamp: now,
        expiresAt: now + expiryMs,
      };

      const key = CACHE_PREFIX + cacheKey;
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));

      logger.info(`Upload result cached: ${cacheKey} (expires in ${expiryMs / 1000 / 60}min)`);
    } catch (error) {
      logger.error('Error caching upload result:', error);
      // Don't throw - cache failures shouldn't break the upload flow
    }
  }

  /**
   * Retrieve upload result from cache
   *
   * @param cacheKey - Cache key to look up
   * @returns Promise<any | null> - Cached data or null if not found/expired
   */
  async get(cacheKey: string): Promise<any | null> {
    try {
      const key = CACHE_PREFIX + cacheKey;
      const cachedString = await AsyncStorage.getItem(key);

      if (!cachedString) {
        logger.debug(`Cache miss: ${cacheKey}`);
        return null;
      }

      const cached: CachedUploadResult = JSON.parse(cachedString);
      const now = Date.now();

      // Check if cache has expired
      if (now > cached.expiresAt) {
        logger.info(`Cache expired: ${cacheKey} (expired ${Math.floor((now - cached.expiresAt) / 1000 / 60)}min ago)`);
        await this.remove(cacheKey); // Clean up expired cache
        return null;
      }

      const age = Math.floor((now - cached.timestamp) / 1000 / 60);
      logger.info(`Cache hit: ${cacheKey} (age: ${age}min)`);

      return cached.data;
    } catch (error) {
      logger.error('Error retrieving from cache:', error);
      return null; // Return null on error to allow fallback to server
    }
  }

  /**
   * Remove specific cache entry
   *
   * @param cacheKey - Cache key to remove
   */
  async remove(cacheKey: string): Promise<void> {
    try {
      const key = CACHE_PREFIX + cacheKey;
      await AsyncStorage.removeItem(key);
      logger.debug(`Cache removed: ${cacheKey}`);
    } catch (error) {
      logger.error('Error removing cache:', error);
    }
  }

  /**
   * Clear all upload caches
   * Useful for debugging or when user wants to force refresh
   */
  async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        logger.info(`Cleared ${cacheKeys.length} cached upload results`);
      }
    } catch (error) {
      logger.error('Error clearing upload cache:', error);
    }
  }

  /**
   * Clean up expired cache entries
   * Should be called periodically (e.g., on app start)
   */
  async cleanupExpired(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
      const now = Date.now();
      let expiredCount = 0;

      for (const key of cacheKeys) {
        try {
          const cachedString = await AsyncStorage.getItem(key);
          if (cachedString) {
            const cached: CachedUploadResult = JSON.parse(cachedString);
            if (now > cached.expiresAt) {
              await AsyncStorage.removeItem(key);
              expiredCount++;
            }
          }
        } catch (error) {
          // If we can't parse this cache entry, remove it
          await AsyncStorage.removeItem(key);
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        logger.info(`Cleaned up ${expiredCount} expired cache entries`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired cache:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   *
   * @returns Object with cache stats
   */
  async getStats(): Promise<{
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    totalSizeKB: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
      const now = Date.now();

      let validCount = 0;
      let expiredCount = 0;
      let totalSize = 0;

      for (const key of cacheKeys) {
        const cachedString = await AsyncStorage.getItem(key);
        if (cachedString) {
          totalSize += cachedString.length;
          try {
            const cached: CachedUploadResult = JSON.parse(cachedString);
            if (now > cached.expiresAt) {
              expiredCount++;
            } else {
              validCount++;
            }
          } catch {
            expiredCount++;
          }
        }
      }

      return {
        totalEntries: cacheKeys.length,
        validEntries: validCount,
        expiredEntries: expiredCount,
        totalSizeKB: Math.round(totalSize / 1024),
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalSizeKB: 0,
      };
    }
  }
}

// Export singleton instance
export const uploadCache = new UploadCache();

// Export for testing
export { UploadCache };
