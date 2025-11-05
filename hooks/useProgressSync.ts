/**
 * useProgressSync - Debounced progress syncing with offline support
 *
 * Features:
 * - Debounce progress updates (5 seconds)
 * - Offline queue with AsyncStorage
 * - Retry logic (3 attempts with exponential backoff)
 * - Batch sync when online
 * - Flush queue on network reconnect
 * - Automatic cleanup on unmount
 *
 * Usage:
 * ```tsx
 * const { syncProgress, syncImmediately } = useProgressSync();
 *
 * // Debounced sync (for scroll tracking)
 * syncProgress(materialId, chapterIndex, readPct, lastPosition);
 *
 * // Immediate sync (for unmount)
 * syncImmediately(materialId, chapterIndex, readPct, lastPosition);
 * ```
 */

import { useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../config/api';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';

interface ProgressUpdate {
  materialId: string;
  chapterIndex: number;
  readPct: number;
  lastPosition: number;
  timestamp: number;
}

const QUEUE_KEY = 'progressQueue';
const DEBOUNCE_DELAY = 3000; // CRITICAL FIX: 3 seconds (was 5s) - stops duplicate API spam
const MAX_RETRIES = 3;
const MIN_SYNC_INTERVAL = 2000; // RATE LIMIT: Minimum 2 seconds between actual API calls
const MAX_QUEUE_SIZE = 10; // QUEUE LIMIT: Maximum items in offline queue (FIFO eviction)

export const useProgressSync = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queueRef = useRef<ProgressUpdate[]>([]);
  const isFlushingRef = useRef(false);
  const lastSyncTimestampRef = useRef<number>(0); // RATE LIMIT: Track last actual sync time
  const lastSyncedProgressRef = useRef<{[key: string]: number}>({}); // DELTA CHECK: Track last synced progress per chapter

  // Mutation for API call
  const syncMutation = useMutation({
    mutationFn: async (update: ProgressUpdate) => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      logger.info('Syncing progress to server', {
        materialId: update.materialId,
        chapterIndex: update.chapterIndex,
        readPct: update.readPct,
      });

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/materials/${update.materialId}/progress`,
          {
            current_chapter_index: update.chapterIndex,
            last_position: update.lastPosition,
          },
          {
            headers: {
              'X-User-ID': user.uid,
              'Content-Type': 'application/json',
            },
            timeout: 5000, // 5 second timeout
          }
        );

        logger.success('Progress synced successfully', {
          chapterIndex: update.chapterIndex,
          readPct: update.readPct,
        });

        return response.data;
      } catch (error) {
        // CRITICAL FIX: Handle 429 rate limit errors
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          logger.warn('RATE LIMITED (429) - Progress sync blocked', {
            retryAfter: retryAfter ? `${retryAfter}s` : 'unknown',
            chapterIndex: update.chapterIndex,
          });

          // Don't retry 429 errors - queue them instead
          throw new Error('RATE_LIMITED');
        }

        throw error;
      }
    },
    retry: (failureCount, error) => {
      // NEVER retry 429 errors - they go to queue
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        return false;
      }
      // Retry other errors up to MAX_RETRIES
      return failureCount < MAX_RETRIES;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Load queue from AsyncStorage
  const loadQueue = useCallback(async () => {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueJson) {
        const queue = JSON.parse(queueJson) as ProgressUpdate[];
        queueRef.current = queue;
        logger.info('Loaded progress queue from storage', { count: queue.length });
      }
    } catch (error) {
      logger.error('Failed to load progress queue', error);
    }
  }, []);

  // Save queue to AsyncStorage
  const saveQueue = useCallback(async (queue: ProgressUpdate[]) => {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      logger.info('Saved progress queue to storage', { count: queue.length });
    } catch (error) {
      logger.error('Failed to save progress queue', error);
    }
  }, []);

  // Add to offline queue
  const addToQueue = useCallback(
    async (update: ProgressUpdate) => {
      // Check if update already exists for this chapter, replace if found
      const existingIndex = queueRef.current.findIndex(
        (u) => u.materialId === update.materialId && u.chapterIndex === update.chapterIndex
      );

      if (existingIndex !== -1) {
        // Replace existing update (keep latest)
        queueRef.current[existingIndex] = update;
      } else {
        // Add new update
        queueRef.current.push(update);

        // FIFO eviction if queue exceeds max size
        if (queueRef.current.length > MAX_QUEUE_SIZE) {
          const evicted = queueRef.current.shift(); // Remove oldest item
          logger.warn('Queue full: Evicted oldest item (FIFO)', {
            evictedChapter: evicted?.chapterIndex,
            queueLength: queueRef.current.length,
          });
        }
      }

      await saveQueue(queueRef.current);
      logger.info('Added progress update to queue', {
        chapterIndex: update.chapterIndex,
        queueLength: queueRef.current.length,
      });
    },
    [saveQueue]
  );

  // Flush queue (sync all pending updates)
  const flushQueue = useCallback(async () => {
    if (isFlushingRef.current || queueRef.current.length === 0) {
      return;
    }

    isFlushingRef.current = true;
    logger.info('Flushing progress queue', { count: queueRef.current.length });

    const queue = [...queueRef.current];
    const successfulIndices: number[] = [];

    for (let i = 0; i < queue.length; i++) {
      const update = queue[i];
      try {
        await syncMutation.mutateAsync(update);

        // Update lastSyncedProgressRef for successful queue flush
        const progressKey = `${update.materialId}-${update.chapterIndex}`;
        lastSyncedProgressRef.current[progressKey] = update.readPct;

        successfulIndices.push(i);
        logger.info('Queue item synced successfully', {
          chapterIndex: update.chapterIndex,
          readPct: update.readPct,
        });
      } catch (error) {
        logger.error('Failed to sync progress from queue', {
          chapterIndex: update.chapterIndex,
          error,
        });
        // Stop flushing on first failure to preserve order
        break;
      }
    }

    // Remove successful updates from queue (proper cleanup)
    if (successfulIndices.length > 0) {
      // Filter out successful items by index
      queueRef.current = queueRef.current.filter((_, index) => !successfulIndices.includes(index));
      await saveQueue(queueRef.current);
      logger.success('Flushed progress queue', {
        synced: successfulIndices.length,
        remaining: queueRef.current.length,
      });
    }

    isFlushingRef.current = false;
  }, [syncMutation, saveQueue]);

  // Network listener effect
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let networkReconnectTimeout: NodeJS.Timeout | null = null;

    const setupNetworkListener = async () => {
      // Load queue on mount
      await loadQueue();

      // Set up network listener with debounce to prevent rapid reconnect bursts
      unsubscribe = NetInfo.addEventListener((state) => {
        if (state.isConnected) {
          // Clear any existing reconnect timeout
          if (networkReconnectTimeout) {
            clearTimeout(networkReconnectTimeout);
          }

          // Debounce network reconnect events (2-second delay)
          networkReconnectTimeout = setTimeout(() => {
            logger.info('Network connected, flushing queue');
            flushQueue();
            networkReconnectTimeout = null;
          }, 2000);
        }
      });

      // Try to flush immediately if online (no debounce needed on initial load)
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && queueRef.current.length > 0) {
        flushQueue();
      }
    };

    setupNetworkListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Clear network reconnect timeout on unmount
      if (networkReconnectTimeout) {
        clearTimeout(networkReconnectTimeout);
      }
      // Clear debounce timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadQueue, flushQueue]);

  // Store mutation and addToQueue in refs to prevent recreating debounce callback
  const syncMutationRef = useRef(syncMutation);
  const addToQueueRef = useRef(addToQueue);

  // Update refs when dependencies change (but don't recreate callback)
  useEffect(() => {
    syncMutationRef.current = syncMutation;
    addToQueueRef.current = addToQueue;
  }, [syncMutation, addToQueue]);

  // Debounced sync function (stable - no dependencies!)
  const syncProgress = useCallback(
    (materialId: string, chapterIndex: number, readPct: number, lastPosition: number) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout (3 seconds) - TRAILING edge only
      timeoutRef.current = setTimeout(async () => {
        const now = Date.now();

        // DELTA CHECK: Skip sync if progress change is less than 5% (unless at chapter boundaries)
        const progressKey = `${materialId}-${chapterIndex}`;
        const lastSynced = lastSyncedProgressRef.current[progressKey] || 0;
        const delta = Math.abs(readPct - lastSynced);

        if (delta < 0.05 && readPct > 0.01 && readPct < 0.99) {
          logger.info('Delta check: Skipping sync (change too small)', {
            delta: delta.toFixed(4),
            readPct: readPct.toFixed(4),
            lastSynced: lastSynced.toFixed(4),
            progressKey,
          });
          return; // Don't queue, don't sync
        }

        // RATE LIMIT: Enforce minimum interval between API calls
        const timeSinceLastSync = now - lastSyncTimestampRef.current;
        if (timeSinceLastSync < MIN_SYNC_INTERVAL) {
          logger.info('Rate limit: Skipping sync entirely (not queuing)', {
            timeSinceLastSync: `${timeSinceLastSync}ms`,
            minInterval: `${MIN_SYNC_INTERVAL}ms`,
          });
          return; // Don't queue, just skip
        }

        const update: ProgressUpdate = {
          materialId,
          chapterIndex,
          readPct,
          lastPosition,
          timestamp: now,
        };

        // Check network status
        const netInfo = await NetInfo.fetch();

        if (netInfo.isConnected) {
          // Sync immediately if online
          try {
            lastSyncTimestampRef.current = Date.now(); // Update before API call
            await syncMutationRef.current.mutateAsync(update);
            // Update last synced progress ONLY after successful sync
            lastSyncedProgressRef.current[progressKey] = readPct;
          } catch (error) {
            // If sync fails, add to queue
            logger.warn('Sync failed, adding to queue', error);
            await addToQueueRef.current(update);
          }
        } else {
          // Add to offline queue
          await addToQueueRef.current(update);
        }
      }, DEBOUNCE_DELAY);
    },
    [] // No dependencies - callback is stable across renders!
  );

  // Immediate sync (for unmount or manual triggers) - stable with refs
  const syncImmediately = useCallback(
    async (materialId: string, chapterIndex: number, readPct: number, lastPosition: number) => {
      // Clear any pending debounced sync
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const now = Date.now();
      const progressKey = `${materialId}-${chapterIndex}`;

      // DELTA CHECK: Skip sync if progress change is less than 5% (unless at chapter boundaries)
      const lastSynced = lastSyncedProgressRef.current[progressKey] || 0;
      const delta = Math.abs(readPct - lastSynced);

      if (delta < 0.05 && readPct > 0.01 && readPct < 0.99) {
        logger.info('Delta check (immediate): Skipping sync (change too small)', {
          delta: delta.toFixed(4),
          readPct: readPct.toFixed(4),
          lastSynced: lastSynced.toFixed(4),
          progressKey,
        });
        return; // Don't queue, don't sync
      }

      // RATE LIMIT: Check if we synced very recently
      const timeSinceLastSync = now - lastSyncTimestampRef.current;
      if (timeSinceLastSync < MIN_SYNC_INTERVAL) {
        logger.info('Rate limit: Queueing immediate sync (too soon since last sync)', {
          timeSinceLastSync: `${timeSinceLastSync}ms`,
        });
        // Queue it instead of syncing immediately
        const update: ProgressUpdate = {
          materialId,
          chapterIndex,
          readPct,
          lastPosition,
          timestamp: now,
        };
        await addToQueueRef.current(update);
        return;
      }

      const update: ProgressUpdate = {
        materialId,
        chapterIndex,
        readPct,
        lastPosition,
        timestamp: now,
      };

      // Check network status
      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected) {
        // Sync immediately if online
        try {
          lastSyncTimestampRef.current = Date.now(); // Update before API call
          await syncMutationRef.current.mutateAsync(update);
          // Update last synced progress ONLY after successful sync
          lastSyncedProgressRef.current[progressKey] = readPct;
        } catch (error) {
          // If sync fails, add to queue
          logger.warn('Immediate sync failed, adding to queue', error);
          await addToQueueRef.current(update);
        }
      } else {
        // Add to offline queue
        await addToQueueRef.current(update);
      }
    },
    [] // No dependencies - callback is stable!
  );

  return {
    syncProgress,
    syncImmediately,
    flushQueue,
  };
};
