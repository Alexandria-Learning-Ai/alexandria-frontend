/**
 * useMaterialStatusSSE - Real-time material status updates via Server-Sent Events
 *
 * Features:
 * - Instant status updates when processing completes
 * - Auto-reconnect on connection failure
 * - Graceful fallback to polling
 * - Automatic cleanup on unmount
 * - Integration with React Query cache
 *
 * Usage:
 * ```typescript
 * const { status, isConnected, isUsingSSE } = useMaterialStatusSSE(
 *   materialId,
 *   currentStatus,
 *   {
 *     enabled: true,
 *     onComplete: () => console.log('Processing complete'),
 *   }
 * );
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// @ts-ignore - react-native-sse doesn't have TypeScript definitions
import EventSource from 'react-native-sse';
import { API_BASE_URL } from '../config/api';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';
import { MaterialStatus, MaterialListItem } from '../types/materials';

/**
 * SSE status data from backend
 */
interface SSEStatusData {
  material_id: string;
  status: MaterialStatus;
  progress?: number;
  message?: string;
  chapter_count?: number;
  word_count?: number;
  updated_at: string;
}

/**
 * Hook options
 */
interface UseMaterialStatusSSEOptions {
  enabled?: boolean;
  onStatusChange?: (status: MaterialStatus) => void;
  onComplete?: () => void;
  fallbackPollingInterval?: number;
}

/**
 * Check if a material status requires monitoring
 */
const requiresMonitoring = (status: MaterialStatus): boolean => {
  return status === 'uploading' || status === 'processing';
};

/**
 * Hook for real-time material status updates via SSE
 */
export const useMaterialStatusSSE = (
  materialId: string,
  currentStatus: MaterialStatus,
  options: UseMaterialStatusSSEOptions = {}
) => {
  const {
    enabled = true,
    onStatusChange,
    onComplete,
    fallbackPollingInterval = 15000,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<any>(null); // EventSource from react-native-sse
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastStatus, setLastStatus] = useState<MaterialStatus>(currentStatus);
  const [error, setError] = useState<Error | null>(null);

  // Should we use SSE? (only for processing materials)
  const shouldUseSSE = enabled && requiresMonitoring(currentStatus);

  useEffect(() => {
    if (!shouldUseSSE || !materialId) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      logger.error('No authenticated user for SSE connection');
      return;
    }

    logger.info('Opening SSE connection for material status', { materialId });

    // Create SSE connection
    const url = `${API_BASE_URL}/api/materials/${materialId}/status/stream`;
    const eventSource = new EventSource(url, {
      headers: {
        'X-User-ID': user.uid,
      },
      pollingInterval: 0, // Disable polling in favor of SSE
    }) as any; // Type assertion for react-native-sse

    eventSourceRef.current = eventSource;

    // Handle status updates
    eventSource.addEventListener('status', (event: any) => {
      try {
        const data: SSEStatusData = JSON.parse(event.data);
        logger.info('SSE status update received', data);

        const newStatus = data.status;
        setLastStatus(newStatus);

        // Update React Query cache
        queryClient.setQueryData(['materialStatus', materialId], data);

        // Update material in materials list cache
        queryClient.setQueriesData<MaterialListItem[]>(
          { queryKey: ['materials'] },
          (oldData) => {
            if (!oldData) return oldData;

            return oldData.map((material) =>
              material.id === materialId
                ? {
                    ...material,
                    status: newStatus,
                    chapter_count: data.chapter_count || material.chapter_count,
                    word_count: data.word_count || material.word_count,
                  }
                : material
            );
          }
        );

        // Trigger callbacks
        onStatusChange?.(newStatus);

        // If terminal status, close connection and trigger completion
        if (newStatus === 'ready' || newStatus === 'failed' || newStatus === 'needs_verification') {
          logger.success('Material processing complete, closing SSE', {
            materialId,
            status: newStatus,
          });

          eventSource.close();
          onComplete?.();
        }
      } catch (err) {
        logger.error('Failed to parse SSE status event', err);
      }
    });

    // Handle connection open
    eventSource.addEventListener('open', (event: any) => {
      logger.success('SSE connection opened', { materialId });
      setIsConnected(true);
      setError(null);

      // Clear fallback polling if it was running
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    });

    // Handle errors
    eventSource.addEventListener('error', (event: any) => {
      logger.error('SSE connection error', event);
      setIsConnected(false);
      setError(new Error('SSE connection failed'));

      // Fall back to polling after error
      startFallbackPolling();
    });

    // Handle timeout event from backend
    eventSource.addEventListener('timeout', (event: any) => {
      logger.warn('SSE connection timeout, reconnecting...');
      eventSource.close();
      // React Native SSE will auto-reconnect
    });

    // Cleanup on unmount
    return () => {
      logger.info('Closing SSE connection', { materialId });
      eventSource.close();
      eventSourceRef.current = null;

      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [shouldUseSSE, materialId, queryClient, onStatusChange, onComplete]);

  // Fallback polling if SSE fails
  const startFallbackPolling = () => {
    if (fallbackIntervalRef.current) return; // Already polling

    logger.warn('Starting fallback polling due to SSE failure', { materialId });

    fallbackIntervalRef.current = setInterval(async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(
          `${API_BASE_URL}/api/materials/${materialId}/status`,
          {
            headers: {
              'X-User-ID': user.uid,
            },
          }
        );

        const data: SSEStatusData = await response.json();
        const newStatus = data.status;

        if (newStatus !== lastStatus) {
          logger.info('Fallback polling detected status change', {
            materialId,
            oldStatus: lastStatus,
            newStatus,
          });

          setLastStatus(newStatus);
          queryClient.setQueryData(['materialStatus', materialId], data);
          onStatusChange?.(newStatus);

          // Stop polling if terminal
          if (newStatus === 'ready' || newStatus === 'failed' || newStatus === 'needs_verification') {
            if (fallbackIntervalRef.current) {
              clearInterval(fallbackIntervalRef.current);
              fallbackIntervalRef.current = null;
            }
            onComplete?.();
          }
        }
      } catch (err) {
        logger.error('Fallback polling error', err);
      }
    }, fallbackPollingInterval);
  };

  return {
    status: lastStatus,
    isConnected,
    error,
    isUsingSSE: shouldUseSSE && isConnected,
    isFallbackPolling: !!fallbackIntervalRef.current,
  };
};
