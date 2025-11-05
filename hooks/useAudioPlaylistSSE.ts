/**
 * useAudioPlaylistSSE - Real-time audio playlist updates via Server-Sent Events
 *
 * Features:
 * - Instant track status updates when generation completes
 * - Auto-reconnect on connection failure
 * - Graceful fallback to polling
 * - Automatic cleanup on unmount
 * - Integration with React Query cache
 *
 * Usage:
 * ```typescript
 * const { playlist, isConnected, isUsingSSE } = useAudioPlaylistSSE(
 *   materialId,
 *   initialPlaylist,
 *   {
 *     enabled: true,
 *     onTrackComplete: (track) => console.log('Track ready:', track.title),
 *     onPlaylistComplete: () => console.log('All tracks ready!'),
 *   }
 * );
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore - react-native-sse doesn't have TypeScript definitions
import EventSource from 'react-native-sse';
import { API_BASE_URL } from '../config/api';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';
import { ProgressivePlaylist, AudioTrack } from '../types/progressiveAudio.types';
import ProgressivePlaylistService from '../services/ProgressivePlaylistService';

/**
 * SSE playlist update data from backend
 */
interface SSEPlaylistUpdate {
  chunked_playlist_id: string;
  playlist_id: string;
  material_id: string;
  status: 'generating' | 'complete' | 'partial' | 'failed';
  completed_tracks: number;
  total_tracks: number;
  updated_track?: AudioTrack;
  updated_at: string;
}

/**
 * Hook options
 */
interface UseAudioPlaylistSSEOptions {
  enabled?: boolean;
  onTrackComplete?: (track: AudioTrack) => void;
  onPlaylistComplete?: (playlist: ProgressivePlaylist) => void;
  onStatusChange?: (status: string) => void;
  onPlaylistUpdate?: (playlist: ProgressivePlaylist) => void;
  fallbackPollingInterval?: number;
}

/**
 * Check if a playlist requires monitoring
 */
const requiresMonitoring = (playlist: ProgressivePlaylist | null): boolean => {
  if (!playlist) return false;
  return (
    playlist.status === 'generating' ||
    playlist.completed_tracks < playlist.total_tracks
  );
};

/**
 * Hook for real-time audio playlist updates via SSE with fallback to polling
 */
export const useAudioPlaylistSSE = (
  materialId: string,
  initialPlaylist: ProgressivePlaylist | null,
  options: UseAudioPlaylistSSEOptions = {}
) => {
  const {
    enabled = true,
    onTrackComplete,
    onPlaylistComplete,
    onStatusChange,
    onPlaylistUpdate,
    fallbackPollingInterval = 10000,
  } = options;

  const eventSourceRef = useRef<any>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const [playlist, setPlaylist] = useState<ProgressivePlaylist | null>(initialPlaylist);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Should we use SSE? (only for playlists that are still generating)
  const shouldMonitor = enabled && requiresMonitoring(playlist);

  /**
   * Update playlist state and trigger callbacks
   */
  const updatePlaylist = useCallback((updatedPlaylist: ProgressivePlaylist) => {
    if (!isMountedRef.current) return;

    setPlaylist(updatedPlaylist);

    // Trigger playlist update callback (notifies parent of changes)
    if (onPlaylistUpdate) {
      onPlaylistUpdate(updatedPlaylist);
    }

    // Trigger status change callback
    if (onStatusChange) {
      onStatusChange(updatedPlaylist.status);
    }

    // Check if all tracks are complete
    if (
      updatedPlaylist.status === 'complete' ||
      updatedPlaylist.completed_tracks === updatedPlaylist.total_tracks
    ) {
      if (onPlaylistComplete) {
        onPlaylistComplete(updatedPlaylist);
      }
    }
  }, [onStatusChange, onPlaylistComplete, onPlaylistUpdate]);

  /**
   * Fallback polling if SSE is not available or fails
   */
  const startFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current || !isMountedRef.current) return;

    logger.warn('🔄 Starting fallback polling for audio playlist', { materialId });
    setIsUsingFallback(true);

    fallbackIntervalRef.current = setInterval(async () => {
      try {
        if (!isMountedRef.current) return;

        const updatedPlaylist = await ProgressivePlaylistService.getPlaylistStatus(materialId);

        if (updatedPlaylist && isMountedRef.current) {
          updatePlaylist(updatedPlaylist);

          // Stop polling if complete
          if (
            updatedPlaylist.status === 'complete' ||
            updatedPlaylist.status === 'failed' ||
            updatedPlaylist.completed_tracks === updatedPlaylist.total_tracks
          ) {
            if (fallbackIntervalRef.current) {
              clearInterval(fallbackIntervalRef.current);
              fallbackIntervalRef.current = null;
              setIsUsingFallback(false);
            }
          }
        }
      } catch (err) {
        logger.error('❌ Fallback polling error', err);
      }
    }, fallbackPollingInterval);
  }, [materialId, fallbackPollingInterval, updatePlaylist]);

  /**
   * Stop fallback polling
   */
  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
      setIsUsingFallback(false);
    }
  }, []);

  /**
   * SSE connection management with fallback to polling
   */
  useEffect(() => {
    // Update local playlist when prop changes
    if (initialPlaylist) {
      setPlaylist(initialPlaylist);
    }

    if (!shouldMonitor || !materialId) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      logger.error('No authenticated user for SSE connection');
      // Fall back to polling
      startFallbackPolling();
      return;
    }

    // Try SSE first, fall back to polling on error
    logger.info('📡 Attempting SSE connection for audio playlist updates', { materialId });

    try {
      const url = `${API_BASE_URL}/api/study/materials/${materialId}/audio/playlist/stream`;
      const eventSource = new EventSource(url, {
        headers: {
          'X-User-ID': user.uid,
        },
        pollingInterval: 0, // Disable polling in favor of SSE
      }) as any;

      eventSourceRef.current = eventSource;

      // Handle successful connection
      eventSource.addEventListener('open', (event: any) => {
        logger.success('✅ SSE connection opened', { materialId });
        setIsConnected(true);
        setError(null);

        // Stop fallback polling since SSE is working
        stopFallbackPolling();
      });

      // Handle playlist updates
      eventSource.addEventListener('message', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          logger.info('📥 SSE update received', {
            status: data.status,
            playlistStatus: data.playlist?.status,
            completedTracks: data.playlist?.completed_tracks,
          });

          // Handle connection confirmation
          if (data.status === 'connected' && data.playlist) {
            updatePlaylist(data.playlist);
            return;
          }

          // Handle playlist updates
          if (data.playlist) {
            updatePlaylist(data.playlist);

            // Notify about completed track
            if (data.track && data.track.status === 'complete' && onTrackComplete) {
              onTrackComplete(data.track);
            }

            // Close connection if playlist is complete or failed
            if (data.playlist.status === 'complete' || data.playlist.status === 'failed') {
              logger.info('🎉 Playlist reached terminal state, closing SSE', {
                status: data.playlist.status,
              });
              eventSource.close();
            }
          }
        } catch (err) {
          logger.error('Failed to parse SSE message', err);
        }
      });

      // Handle errors - fall back to polling
      eventSource.addEventListener('error', (event: any) => {
        logger.warn('⚠️ SSE connection error, falling back to polling', event);
        setIsConnected(false);
        setError(new Error('SSE connection failed'));

        // Close the failed SSE connection
        eventSource.close();
        eventSourceRef.current = null;

        // Start polling as fallback
        startFallbackPolling();
      });

    } catch (err) {
      logger.error('Failed to create SSE connection, using polling fallback', err);
      startFallbackPolling();
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      stopFallbackPolling();

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [shouldMonitor, materialId, initialPlaylist, startFallbackPolling, stopFallbackPolling, updatePlaylist, onTrackComplete]);

  /**
   * Manually refresh playlist
   */
  const refresh = useCallback(async () => {
    try {
      const updatedPlaylist = await ProgressivePlaylistService.getPlaylistStatus(materialId);
      if (updatedPlaylist && isMountedRef.current) {
        updatePlaylist(updatedPlaylist);
      }
    } catch (err) {
      logger.error('Failed to refresh playlist', err);
    }
  }, [materialId, updatePlaylist]);

  return {
    playlist,
    isConnected,
    error,
    isUsingSSE: isConnected && !isUsingFallback, // True when SSE is active
    isFallbackPolling: isUsingFallback,
    refresh,
  };
};
