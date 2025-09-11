/**
 * useOffline Hook - React hook for offline state management
 * Provides easy access to offline functionality and network status
 */

import { useState, useEffect, useCallback } from 'react';
import OfflineManager from '../utils/OfflineManager';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(OfflineManager.isOnline);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    // Initialize OfflineManager and get initial network status
    const initializeOffline = async () => {
      try {
        const unsubscribe = await OfflineManager.initialize();
        const initialStatus = await OfflineManager.getNetworkStatus();
        setNetworkInfo(initialStatus);
        
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing offline hook:', error);
        return () => {};
      }
    };

    let unsubscribeNetwork;
    initializeOffline().then(unsubscribe => {
      unsubscribeNetwork = unsubscribe;
    });

    // Listen to network changes
    const removeListener = OfflineManager.addNetworkListener(({ isOnline, connectionInfo }) => {
      setIsOnline(isOnline);
      setNetworkInfo(connectionInfo);
    });

    return () => {
      removeListener();
      if (unsubscribeNetwork) {
        unsubscribeNetwork();
      }
    };
  }, []);

  // Cache data with error handling
  const cacheData = useCallback(async (key, data, expiry = null) => {
    try {
      return await OfflineManager.cacheData(key, data, expiry);
    } catch (error) {
      console.error(`Error caching data in hook:`, error);
      return false;
    }
  }, []);

  // Get cached data with error handling
  const getCachedData = useCallback(async (key, fallbackToEmpty = true) => {
    try {
      return await OfflineManager.getCachedData(key, fallbackToEmpty);
    } catch (error) {
      console.error(`Error getting cached data in hook:`, error);
      return null;
    }
  }, []);

  // Get data with automatic online/offline handling
  const getDataWithFallback = useCallback(async (key, fetchFunction, forceRefresh = false) => {
    try {
      return await OfflineManager.getDataWithFallback(key, fetchFunction, forceRefresh);
    } catch (error) {
      console.error(`Error in getDataWithFallback hook:`, error);
      return { data: null, source: 'error' };
    }
  }, []);

  // Queue action for offline processing
  const queueOfflineAction = useCallback(async (action) => {
    try {
      return await OfflineManager.queueOfflineAction(action);
    } catch (error) {
      console.error(`Error queuing offline action:`, error);
      return false;
    }
  }, []);

  // Check if cache is valid
  const isCacheValid = useCallback(async (key) => {
    try {
      return await OfflineManager.isCacheValid(key);
    } catch (error) {
      console.error(`Error checking cache validity:`, error);
      return false;
    }
  }, []);

  return {
    // Network status
    isOnline,
    networkInfo,
    
    // Cache operations
    cacheData,
    getCachedData,
    getDataWithFallback,
    isCacheValid,
    
    // Offline queue
    queueOfflineAction,
    
    // Utility functions
    clearCache: OfflineManager.clearCache,
    clearAllCache: OfflineManager.clearAllCache,
    getCacheStats: OfflineManager.getCacheStats,
    cleanupExpiredCache: OfflineManager.cleanupExpiredCache,
  };
};

export default useOffline;