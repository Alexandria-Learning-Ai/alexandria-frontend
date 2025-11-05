/**
 * useMaterials - Hook for fetching and managing materials
 *
 * Features:
 * - React Query integration for caching and refetching
 * - Filtering by kind and status
 * - Search functionality
 * - Loading and error states
 * - Automatic refetching
 * - User-specific materials
 *
 * @param filters - Material filter parameters
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import {
  MaterialListItem,
  MaterialsListResponse,
  MaterialFilterParams,
} from '../types/materials';

interface UseMaterialsOptions {
  kind?: 'book' | 'study_guide' | 'paper';
  status?: 'all' | 'in_progress' | 'completed';
  search?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseMaterialsResult {
  materials: MaterialListItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  data: MaterialListItem[] | undefined;
  status: 'error' | 'success' | 'pending';
  fetchStatus: 'fetching' | 'paused' | 'idle';
  isPending: boolean;
  isSuccess: boolean;
  isFetching: boolean;
}

export const useMaterials = (options: UseMaterialsOptions = {}): UseMaterialsResult => {
  const {
    kind,
    status = 'all',
    search = '',
    limit = 20,
    enabled = true,
  } = options;

  const query = useQuery<MaterialListItem[], Error>({
    queryKey: ['materials', kind, status, search, limit],
    queryFn: async () => {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        // Build query parameters
        const params: Record<string, string | number> = {
          limit,
        };

        if (kind) {
          params.kind = kind;
        }

        if (status && status !== 'all') {
          params.status = status;
        }

        if (search) {
          params.search = search;
        }

        logger.info('Fetching materials', { params });

        const response = await axios.get<MaterialsListResponse>(
          `${API_BASE_URL}/api/materials`,
          {
            params,
            headers: {
              'X-User-ID': user.uid,
              'Content-Type': 'application/json',
            },
          }
        );

        // CRITICAL: Backend returns { materials: [], total: 0 }
        // Extract the materials array from the wrapped response
        const data = response.data;

        // Validate structure
        if (data && typeof data === 'object' && Array.isArray(data.materials)) {
          logger.success('Materials fetched successfully', {
            count: data.materials.length,
            total: data.total,
            isWrappedResponse: true,
          });
          return data.materials; // Return the array
        }

        // Fallback for unexpected response structure
        if (Array.isArray(data)) {
          logger.warn('API returned unwrapped array (unexpected)', {
            count: data.length,
          });
          return data;
        }

        // Invalid response structure
        logger.error('API returned invalid response structure', {
          type: typeof data,
          hasMaterials: data && 'materials' in data,
          isArray: Array.isArray(data),
          value: data,
        });

        return [];
      } catch (error) {
        logger.error('Failed to fetch materials', error);
        throw error;
      }
    },
    enabled: enabled && !!auth.currentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
    retry: 2,
  });

  // ROBUST array guarantee: use Array.isArray instead of || []
  const materials = Array.isArray(query.data) ? query.data : [];

  // Log if we're returning a fallback empty array
  if (query.isSuccess && !Array.isArray(query.data)) {
    logger.warn('useMaterials: query.data is not an array', {
      type: typeof query.data,
      value: query.data,
      status: query.status,
    });
  }

  return {
    materials,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    data: query.data,
    status: query.status,
    fetchStatus: query.fetchStatus,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
  };
};

/**
 * useMaterialDetail - Hook for fetching single material with chapters
 */
export const useMaterialDetail = (materialId: string) => {
  return useQuery({
    queryKey: ['material', materialId],
    queryFn: async () => {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        logger.info('Fetching material detail', { materialId });

        const response = await axios.get(
          `${API_BASE_URL}/api/materials/${materialId}`,
          {
            headers: {
              'X-User-ID': user.uid,
              'Content-Type': 'application/json',
            },
          }
        );

        logger.success('Material detail fetched successfully');

        return response.data;
      } catch (error) {
        logger.error('Failed to fetch material detail', error);
        throw error;
      }
    },
    enabled: !!materialId && !!auth.currentUser,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
};

/**
 * useChapterContent - DEPRECATED - Use useChapter from hooks/useChapter.ts instead
 *
 * This hook has been replaced with a new implementation that supports
 * S3 signed URLs for chapter content.
 */
export const useChapterContent = (chapterId: string) => {
  logger.warn('useChapterContent is deprecated. Use useChapter from hooks/useChapter.ts instead');

  return useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => {
      throw new Error('useChapterContent is deprecated. Use useChapter instead.');
    },
    enabled: false,
  });
};

/**
 * useRetryMaterial - Hook for retrying failed material processing
 *
 * Features:
 * - Triggers reprocessing of failed materials
 * - Optimistic updates to show processing status
 * - Cache invalidation on success
 * - Error handling with user feedback
 *
 * @returns Mutation object with retryMaterial function
 */
export const useRetryMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (materialId: string) => {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        logger.info('Retrying material processing', { materialId });

        const response = await axios.post(
          `${API_BASE_URL}/api/materials/${materialId}/retry`,
          {},
          {
            headers: {
              'X-User-ID': user.uid,
              'Content-Type': 'application/json',
            },
          }
        );

        logger.success('Material retry initiated', {
          materialId,
          jobId: response.data.job_id,
        });

        return response.data;
      } catch (error) {
        logger.error('Failed to retry material', error);
        throw error;
      }
    },
    onMutate: async (materialId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['materials'] });

      // Snapshot previous value
      const previousMaterials = queryClient.getQueriesData({ queryKey: ['materials'] });

      // Optimistically update to processing status
      queryClient.setQueriesData<MaterialListItem[]>(
        { queryKey: ['materials'] },
        (old) => {
          if (!old) return old;
          return old.map((material) =>
            material.id === materialId
              ? { ...material, status: 'processing' as const }
              : material
          );
        }
      );

      return { previousMaterials };
    },
    onError: (error, materialId, context) => {
      // Rollback on error
      if (context?.previousMaterials) {
        context.previousMaterials.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate materials queries to refetch
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};

/**
 * useDeleteMaterial - Hook for deleting materials
 *
 * Features:
 * - Deletes material from library
 * - Optimistic updates (removes from list immediately)
 * - Cache invalidation on success
 * - Rollback on error
 * - Proper error handling
 *
 * @returns Mutation object with deleteMaterial function
 */
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (materialId: string) => {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        logger.info('Deleting material', { materialId });

        await axios.delete(
          `${API_BASE_URL}/api/materials/${materialId}`,
          {
            headers: {
              'X-User-ID': user.uid,
            },
          }
        );

        logger.success('Material deleted successfully', { materialId });

        return materialId;
      } catch (error) {
        logger.error('Failed to delete material', error);
        throw error;
      }
    },
    onMutate: async (materialId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['materials'] });

      // Snapshot previous value
      const previousMaterials = queryClient.getQueriesData({ queryKey: ['materials'] });

      // Optimistically remove from cache
      queryClient.setQueriesData<MaterialListItem[]>(
        { queryKey: ['materials'] },
        (old) => {
          if (!old) return old;
          return old.filter((material) => material.id !== materialId);
        }
      );

      return { previousMaterials };
    },
    onError: (error, materialId, context) => {
      // Rollback on error
      if (context?.previousMaterials) {
        context.previousMaterials.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate materials queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      // Also invalidate material detail in case it's open
      queryClient.invalidateQueries({ queryKey: ['material'] });
    },
  });
};
