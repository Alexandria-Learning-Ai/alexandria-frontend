/**
 * useMaterialStatus - Hook for polling material processing status
 *
 * Features:
 * - Auto-polls materials with status "uploading" or "processing"
 * - Configurable polling interval (default: 5 seconds)
 * - Stops polling when status becomes "ready", "failed", or "needs_verification"
 * - Automatically updates React Query cache
 * - Efficient: only polls when materials are in processing state
 * - Returns list of materials being polled
 *
 * Usage:
 * ```typescript
 * const { pollingMaterials } = useMaterialStatus(materials);
 * ```
 *
 * @param materials - Array of materials to monitor
 * @param pollingInterval - Polling interval in milliseconds (default: 5000)
 */

import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { MaterialListItem, MaterialStatus } from '../types/materials';
import { useMaterialStatusSSE } from './useMaterialStatusSSE';

interface MaterialStatusResponse {
  material_id: string;
  status: MaterialStatus;
  job_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UseMaterialStatusOptions {
  materials: MaterialListItem[] | undefined;
  pollingInterval?: number;
  enabled?: boolean;
}

/**
 * Check if a material status requires polling
 */
const requiresPolling = (status: MaterialStatus): boolean => {
  return status === 'uploading' || status === 'processing';
};

/**
 * Fetch status for a single material
 */
const fetchMaterialStatus = async (materialId: string): Promise<MaterialStatusResponse> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await axios.get<MaterialStatusResponse>(
    `${API_BASE_URL}/api/materials/${materialId}/status`,
    {
      headers: {
        'X-User-ID': user.uid,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

/**
 * Hook for polling material status
 */
export const useMaterialStatus = ({
  materials,
  pollingInterval = 15000, // CRITICAL FIX: Increased from 5s to 15s to reduce API load
  enabled = true,
}: UseMaterialStatusOptions) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure materials is ALWAYS an array using useMemo and Array.isArray
  // This is more robust than || [] because it handles null, undefined, and non-array values
  const safeMaterials = React.useMemo(() => {
    if (Array.isArray(materials)) {
      return materials;
    }
    logger.warn('useMaterialStatus: materials is not an array', {
      type: typeof materials,
      value: materials,
    });
    return [];
  }, [materials]);

  // Get materials that need polling
  const pollingMaterials = React.useMemo(() => {
    return safeMaterials.filter((material) =>
      requiresPolling(material.status)
    );
  }, [safeMaterials]);

  const shouldPoll = enabled && pollingMaterials.length > 0;

  useEffect(() => {
    if (!shouldPoll) {
      // Clear interval if no materials need polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    logger.info('Starting status polling', {
      count: pollingMaterials.length,
      materialIds: pollingMaterials.map((m) => m.id),
      intervalMs: pollingInterval,
    });

    // Poll immediately on mount
    pollAllMaterials();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      pollAllMaterials();
    }, pollingInterval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        logger.info('Stopping status polling');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldPoll, pollingMaterials.length, pollingInterval]);

  /**
   * Poll all materials that need status updates
   */
  const pollAllMaterials = async () => {
    // Extra defensive check inside the polling function
    if (!Array.isArray(safeMaterials)) {
      logger.error('pollAllMaterials: safeMaterials is not an array', {
        type: typeof safeMaterials,
        value: safeMaterials,
      });
      return;
    }

    const materialsToPoll = safeMaterials.filter((material) =>
      requiresPolling(material.status)
    );

    if (materialsToPoll.length === 0) {
      return;
    }

    logger.debug('Polling material status', {
      count: materialsToPoll.length,
    });

    // Poll all materials in parallel
    const statusPromises = materialsToPoll.map(async (material) => {
      try {
        const statusData = await fetchMaterialStatus(material.id);

        // Check if status changed
        if (statusData.status !== material.status) {
          logger.info('Material status changed', {
            materialId: material.id,
            oldStatus: material.status,
            newStatus: statusData.status,
          });

          // Update materials cache
          updateMaterialInCache(material.id, statusData.status);

          // Stop polling if status is terminal
          if (!requiresPolling(statusData.status)) {
            logger.success('Material processing complete', {
              materialId: material.id,
              status: statusData.status,
            });

            // CRITICAL FIX: Remove cache invalidation storm
            // Instead of triggering immediate refetches, just update the status in cache
            // and let natural refetch cycles handle the rest
            // This prevents cascade of requests that trigger rate limiting
          }
        }

        return statusData;
      } catch (error) {
        logger.error('Failed to poll material status', {
          materialId: material.id,
          error,
        });
        return null;
      }
    });

    await Promise.all(statusPromises);
  };

  /**
   * Update material status in all relevant caches
   */
  const updateMaterialInCache = (materialId: string, newStatus: MaterialStatus) => {
    // Update all materials queries
    queryClient.setQueriesData<MaterialListItem[]>(
      { queryKey: ['materials'] },
      (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((material) =>
          material.id === materialId
            ? { ...material, status: newStatus }
            : material
        );
      }
    );

    // CRITICAL FIX: Remove cache invalidation to prevent request storms
    // The status update in cache above is sufficient
    // Natural refetch cycles will handle fetching complete data
    // queryClient.invalidateQueries() removed to prevent cascading refetches
  };

  return {
    pollingMaterials,
    isPolling: shouldPoll,
    pollingCount: pollingMaterials.length,
  };
};

/**
 * Hook for polling a single material
 * Useful for detail screens
 *
 * Now enhanced with SSE support for instant updates!
 * - Tries SSE first for real-time status updates
 * - Falls back to polling if SSE fails
 * - Automatically switches between SSE and polling
 */
export const useSingleMaterialStatus = (
  materialId: string,
  currentStatus: MaterialStatus,
  options: { enabled?: boolean; pollingInterval?: number } = {}
) => {
  const { enabled = true, pollingInterval = 15000 } = options; // CRITICAL FIX: Increased from 5s to 15s
  const queryClient = useQueryClient();

  // Try SSE first, fall back to polling
  const {
    status: sseStatus,
    isConnected: sseConnected,
    isUsingSSE,
    isFallbackPolling,
  } = useMaterialStatusSSE(materialId, currentStatus, {
    enabled,
    onComplete: () => {
      // Refetch material details when complete
      logger.info('SSE processing complete, invalidating queries', { materialId });
      queryClient.invalidateQueries({ queryKey: ['material', materialId] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  // Only use polling if SSE is not connected AND not using fallback polling
  const shouldPoll = enabled && !isUsingSSE && !isFallbackPolling && requiresPolling(currentStatus);

  const { data: statusData, isLoading } = useQuery<MaterialStatusResponse>({
    queryKey: ['materialStatus', materialId],
    queryFn: () => fetchMaterialStatus(materialId),
    enabled: shouldPoll && !!materialId && !!auth.currentUser,
    // CRITICAL FIX: Stop polling when status becomes terminal (ready/failed)
    refetchInterval: (data) => {
      if (!shouldPoll) return false;
      if (data && !requiresPolling(data.status)) {
        return false; // Stop polling if status is terminal
      }
      return pollingInterval;
    },
    refetchIntervalInBackground: false,
    retry: 1,
  });

  // Handle status changes from polling
  useEffect(() => {
    if (statusData && statusData.status !== currentStatus && !isUsingSSE) {
      logger.info('Material status changed (polling)', {
        materialId,
        oldStatus: currentStatus,
        newStatus: statusData.status,
      });

      // Update material in cache
      queryClient.setQueriesData<MaterialListItem[]>(
        { queryKey: ['materials'] },
        (oldData) => {
          if (!oldData) return oldData;

          return oldData.map((material) =>
            material.id === materialId
              ? { ...material, status: statusData.status }
              : material
          );
        }
      );

      // CRITICAL FIX: Don't invalidate queries - causes request storm
      // Cache update above is sufficient for UI updates
      // queryClient.invalidateQueries() removed
    }
  }, [statusData, currentStatus, materialId, queryClient, isUsingSSE]);

  return {
    status: isUsingSSE ? sseStatus : (statusData?.status || currentStatus),
    isPolling: shouldPoll,
    isUsingSSE,
    sseConnected,
    isFallbackPolling,
    isLoading,
    jobId: statusData?.job_id || null,
    updatedAt: statusData?.updated_at || null,
  };
};
