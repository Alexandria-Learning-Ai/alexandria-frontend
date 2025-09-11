/**
 * ApiCache - Intelligent API response caching system
 * Provides smart caching with invalidation, background refresh, and analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';


export class ApiCache {
  constructor(config = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes default
      maxCacheSize: 50, // Maximum number of cached entries
      gcInterval: 30 * 60 * 1000, // Garbage collection every 30 minutes
      backgroundRefreshThreshold: 0.8, // Refresh when 80% of TTL has passed
      retryAttempts: 3,
      retryDelay: 1000,
      storagePrefix: 'api_cache_',
      ...config
    };

    this.cache = new Map();
    this.requestQueue = new Map();
    this.invalidationRules = new Map();
    this.backgroundRefreshQueue = new Set();
    this.metrics = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      backgroundRefreshes: 0,
      errors: 0,
      networkRequests: 0,
      cacheSize: 0
    };

    this.setupGarbageCollection();
    this.setupNetworkListener();
  }

  /**
   * Get data from cache or fetch from API
   */
  async get(key, fetchFunction, options = {}) {
    const cacheKey = this.generateCacheKey(key);
    const config = { ...this.config, ...options };

    try {
      // Check cache first
      const cachedData = await this.getCachedData(cacheKey);
      
      if (cachedData && this.isDataValid(cachedData, config)) {
        this.metrics.hits++;
        
        // Schedule background refresh if needed
        if (this.shouldBackgroundRefresh(cachedData, config)) {
          this.scheduleBackgroundRefresh(cacheKey, fetchFunction, config);
        }
        
        return {
          data: cachedData.data,
          fromCache: true,
          timestamp: cachedData.timestamp,
          freshness: this.calculateFreshness(cachedData, config)
        };
      }

      // Data not in cache or expired, fetch from API
      this.metrics.misses++;
      return await this.fetchAndCache(cacheKey, fetchFunction, config);

    } catch (error) {
      this.metrics.errors++;
      
      // Try to return stale data if available
      const staleData = await this.getCachedData(cacheKey);
      if (staleData && options.returnStaleOnError) {
        logger.warn(`API fetch failed, returning stale data for ${key}:`, error);
        return {
          data: staleData.data,
          fromCache: true,
          stale: true,
          error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Fetch data and cache the result
   */
  async fetchAndCache(cacheKey, fetchFunction, config) {
    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    // Create request promise
    const requestPromise = this.performFetch(fetchFunction, config)
      .then(data => {
        this.setCachedData(cacheKey, data, config);
        this.requestQueue.delete(cacheKey);
        return {
          data,
          fromCache: false,
          timestamp: Date.now(),
          freshness: 1.0
        };
      })
      .catch(error => {
        this.requestQueue.delete(cacheKey);
        throw error;
      });

    this.requestQueue.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * Perform the actual fetch with retry logic
   */
  async performFetch(fetchFunction, config) {
    let lastError;
    
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        this.metrics.networkRequests++;
        const startTime = Date.now();
        const data = await fetchFunction();
        const duration = Date.now() - startTime;
        
        // Track performance metrics
        this.trackRequestMetrics(duration, true);
        
        return data;
      } catch (error) {
        lastError = error;
        logger.warn(`API fetch attempt ${attempt} failed:`, error);
        
        if (attempt < config.retryAttempts) {
          await this.delay(config.retryDelay * attempt); // Exponential backoff
        }
      }
    }
    
    this.trackRequestMetrics(0, false);
    throw lastError;
  }

  /**
   * Set data in cache with metadata
   */
  async setCachedData(key, data, config) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl || config.defaultTtl,
      hits: 0,
      size: this.estimateSize(data)
    };

    // Store in memory cache
    this.cache.set(key, cacheEntry);
    
    // Store in persistent storage for important data
    if (config.persistent) {
      try {
        await AsyncStorage.setItem(
          this.config.storagePrefix + key,
          JSON.stringify(cacheEntry)
        );
      } catch (error) {
        logger.warn('Failed to persist cache data:', error);
      }
    }

    // Update metrics
    this.metrics.cacheSize = this.cache.size;
    
    // Trigger garbage collection if needed
    if (this.cache.size > this.config.maxCacheSize) {
      this.garbageCollect();
    }
  }

  /**
   * Get data from cache
   */
  async getCachedData(key) {
    // Check memory cache first
    let cached = this.cache.get(key);
    
    // Check persistent storage if not in memory
    if (!cached) {
      try {
        const stored = await AsyncStorage.getItem(this.config.storagePrefix + key);
        if (stored) {
          cached = JSON.parse(stored);
          // Restore to memory cache
          this.cache.set(key, cached);
        }
      } catch (error) {
        logger.warn('Failed to load cached data from storage:', error);
      }
    }

    if (cached) {
      cached.hits = (cached.hits || 0) + 1;
    }

    return cached;
  }

  /**
   * Check if cached data is still valid
   */
  isDataValid(cachedData, config) {
    const age = Date.now() - cachedData.timestamp;
    const ttl = cachedData.ttl || config.ttl || config.defaultTtl;
    return age < ttl;
  }

  /**
   * Check if data should be refreshed in background
   */
  shouldBackgroundRefresh(cachedData, config) {
    if (!config.backgroundRefresh) return false;
    
    const age = Date.now() - cachedData.timestamp;
    const ttl = cachedData.ttl || config.ttl || config.defaultTtl;
    const threshold = ttl * config.backgroundRefreshThreshold;
    
    return age > threshold;
  }

  /**
   * Schedule background refresh
   */
  scheduleBackgroundRefresh(key, fetchFunction, config) {
    if (this.backgroundRefreshQueue.has(key)) return;
    
    this.backgroundRefreshQueue.add(key);
    
    // Use setTimeout to avoid blocking
    setTimeout(async () => {
      try {
        const data = await this.performFetch(fetchFunction, config);
        await this.setCachedData(key, data, config);
        this.metrics.backgroundRefreshes++;
      } catch (error) {
        logger.warn('Background refresh failed for', key, error);
      } finally {
        this.backgroundRefreshQueue.delete(key);
      }
    }, 100);
  }

  /**
   * Calculate data freshness (0-1, where 1 is fresh)
   */
  calculateFreshness(cachedData, config) {
    const age = Date.now() - cachedData.timestamp;
    const ttl = cachedData.ttl || config.ttl || config.defaultTtl;
    return Math.max(0, 1 - (age / ttl));
  }

  /**
   * Invalidate cache entries
   */
  async invalidate(pattern) {
    let invalidatedCount = 0;
    
    if (typeof pattern === 'string') {
      // Single key invalidation
      if (this.cache.has(pattern)) {
        this.cache.delete(pattern);
        await AsyncStorage.removeItem(this.config.storagePrefix + pattern);
        invalidatedCount++;
      }
    } else if (pattern instanceof RegExp) {
      // Pattern-based invalidation
      for (const [key] of this.cache) {
        if (pattern.test(key)) {
          this.cache.delete(key);
          await AsyncStorage.removeItem(this.config.storagePrefix + key);
          invalidatedCount++;
        }
      }
    } else if (Array.isArray(pattern)) {
      // Multiple keys invalidation
      for (const key of pattern) {
        if (this.cache.has(key)) {
          this.cache.delete(key);
          await AsyncStorage.removeItem(this.config.storagePrefix + key);
          invalidatedCount++;
        }
      }
    }

    this.metrics.invalidations += invalidatedCount;
    this.metrics.cacheSize = this.cache.size;
    
    return invalidatedCount;
  }

  /**
   * Set up cache invalidation rules
   */
  setupInvalidationRule(trigger, targets) {
    this.invalidationRules.set(trigger, targets);
  }

  /**
   * Trigger invalidation based on rules
   */
  async triggerInvalidation(event, data = null) {
    const targets = this.invalidationRules.get(event);
    if (!targets) return;

    let invalidationPatterns = targets;
    
    // Allow dynamic targets based on event data
    if (typeof targets === 'function') {
      invalidationPatterns = targets(data);
    }

    for (const pattern of invalidationPatterns) {
      await this.invalidate(pattern);
    }
  }

  /**
   * Generate cache key from various input types
   */
  generateCacheKey(input) {
    if (typeof input === 'string') {
      return input;
    }
    
    if (typeof input === 'object') {
      // Create deterministic key from object
      const sorted = Object.keys(input)
        .sort()
        .reduce((result, key) => {
          result[key] = input[key];
          return result;
        }, {});
      return JSON.stringify(sorted);
    }
    
    return String(input);
  }

  /**
   * Estimate data size for cache management
   */
  estimateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * Garbage collection - remove least recently used items
   */
  garbageCollect() {
    if (this.cache.size <= this.config.maxCacheSize) return;

    // Convert to array and sort by last hit time and hit count
    const entries = Array.from(this.cache.entries())
      .map(([key, value]) => ({
        key,
        value,
        score: value.hits / (Date.now() - value.timestamp) // Frequency/recency score
      }))
      .sort((a, b) => a.score - b.score); // Lowest score first (candidates for removal)

    // Remove bottom 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      const entry = entries[i];
      this.cache.delete(entry.key);
      
      // Also remove from persistent storage
      AsyncStorage.removeItem(this.config.storagePrefix + entry.key).catch(console.warn);
    }

    this.metrics.cacheSize = this.cache.size;
  }

  /**
   * Set up periodic garbage collection
   */
  setupGarbageCollection() {
    setInterval(() => {
      this.garbageCollect();
    }, this.config.gcInterval);
  }

  /**
   * Set up network connectivity listener
   */
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.backgroundRefreshQueue.size > 0) {
        // Trigger pending background refreshes when connectivity is restored
        logger.info('Network restored, processing background refresh queue');
      }
    });
  }

  /**
   * Track request performance metrics
   */
  trackRequestMetrics(duration, success) {
    if (!this.metrics.requests) {
      this.metrics.requests = {
        total: 0,
        successful: 0,
        failed: 0,
        totalDuration: 0,
        averageDuration: 0
      };
    }

    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.successful++;
      this.metrics.requests.totalDuration += duration;
      this.metrics.requests.averageDuration = 
        this.metrics.requests.totalDuration / this.metrics.requests.successful;
    } else {
      this.metrics.requests.failed++;
    }
  }

  /**
   * Get cache analytics and performance metrics
   */
  getAnalytics() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    
    return {
      hitRate: totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0,
      cacheSize: this.metrics.cacheSize,
      networkRequests: this.metrics.networkRequests,
      backgroundRefreshes: this.metrics.backgroundRefreshes,
      invalidations: this.metrics.invalidations,
      errors: this.metrics.errors,
      requests: this.metrics.requests,
      memoryUsage: this.getMemoryUsage(),
      topCachedItems: this.getTopCachedItems()
    };
  }

  /**
   * Get memory usage estimation
   */
  getMemoryUsage() {
    let totalSize = 0;
    for (const [, entry] of this.cache) {
      totalSize += entry.size || 0;
    }
    
    return {
      totalSize,
      averageItemSize: this.cache.size > 0 ? totalSize / this.cache.size : 0,
      itemCount: this.cache.size
    };
  }

  /**
   * Get most frequently accessed cached items
   */
  getTopCachedItems(limit = 10) {
    return Array.from(this.cache.entries())
      .map(([key, value]) => ({
        key: key.length > 50 ? key.substring(0, 50) + '...' : key,
        hits: value.hits || 0,
        age: Date.now() - value.timestamp,
        size: value.size || 0
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    this.cache.clear();
    this.requestQueue.clear();
    this.backgroundRefreshQueue.clear();
    
    // Clear persistent storage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.config.storagePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      logger.warn('Failed to clear persistent cache:', error);
    }

    // Reset metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      backgroundRefreshes: 0,
      errors: 0,
      networkRequests: 0,
      cacheSize: 0
    };
  }

  /**
   * Utility method for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Hook for using API cache in React components
 */
export const useApiCache = (config = {}) => {
  const cacheRef = React.useRef(null);

  if (!cacheRef.current) {
    cacheRef.current = new ApiCache(config);
  }

  return cacheRef.current;
};

/**
 * Higher-order component for API caching
 */
export const withApiCache = (config = {}) => (WrappedComponent) => {
  return (props) => {
    const cache = useApiCache(config);
    return <WrappedComponent {...props} apiCache={cache} />;
  };
};

/**
 * Cached fetch wrapper
 */
export const cachedFetch = async (url, options = {}, cacheOptions = {}) => {
  const cache = new ApiCache();
  const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
  
  return cache.get(
    cacheKey,
    () => fetch(url, options).then(res => res.json()),
    cacheOptions
  );
};

// Create default cache instance
const defaultCache = new ApiCache();

export { defaultCache };
export default ApiCache;