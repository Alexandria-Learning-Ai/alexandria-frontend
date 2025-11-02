/**
 * Progressive Playlist Service
 *
 * Handles chunked audio generation with progressive track delivery.
 * Users start listening to Track 1 within seconds while others generate.
 *
 * @example
 * ```typescript
 * import ProgressivePlaylistService from './services/ProgressivePlaylistService';
 *
 * // Start generation
 * const playlist = await ProgressivePlaylistService.startChunkedGeneration(materialId);
 *
 * // Poll for updates
 * ProgressivePlaylistService.pollPlaylistStatus(
 *   materialId,
 *   (updatedPlaylist) => {
 *     logger.info(`${updatedPlaylist.completed_tracks}/${updatedPlaylist.total_tracks} ready`);
 *   },
 *   (finalPlaylist) => {
 *     logger.info('All tracks ready!');
 *   }
 * );
 * ```
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { ProgressivePlaylist, AudioTrack, TrackStatusSummary } from '../types/progressiveAudio.types';
import logger from '../utils/logger';

interface GenerationOptions {
  voice?: string;
  speed?: number;
  language?: string;
}

interface PollingOptions {
  pollInterval?: number;
  maxAttempts?: number;
}

class ProgressivePlaylistService {
  /**
   * Start chunked audio generation
   *
   * @param materialId - Study material ID
   * @param options - Generation options
   * @returns Playlist data with tracks
   */
  static async startChunkedGeneration(
    materialId: string,
    options: GenerationOptions = {}
  ): Promise<ProgressivePlaylist> {
    const {
      voice = 'default',
      speed = 1.0,
      language = 'en',
    } = options;

    try {
      const formData = new FormData();
      formData.append('voice', voice);
      formData.append('speed', speed.toString());
      formData.append('language', language);

      const response = await axios.post<ProgressivePlaylist>(
        `${API_BASE_URL}/api/study/materials/${materialId}/audio/playlist`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const playlist = response.data;

      logger.info('🎵 Chunked playlist created', {
        title: playlist.title,
        totalTracks: playlist.total_tracks,
        estimatedDuration: Math.round((playlist.estimated_total_duration || 0) / 60),
      });

      return playlist;
    } catch (error: any) {
      logger.error('❌ Failed to start chunked generation', { error, materialId });

      if (error.response) {
        throw new Error(
          error.response.data?.detail ||
            error.response.data?.message ||
            'Failed to generate audio playlist'
        );
      }

      throw error;
    }
  }

  /**
   * Get current playlist status
   *
   * @param materialId - Study material ID
   * @returns Current playlist with track statuses
   */
  static async getPlaylistStatus(materialId: string): Promise<ProgressivePlaylist | null> {
    try {
      const response = await axios.get<ProgressivePlaylist>(
        `${API_BASE_URL}/api/study/materials/${materialId}/audio/playlist`
      );

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // Playlist doesn't exist yet
        return null;
      }

      logger.error('Failed to get playlist status', { error, materialId });
      throw error;
    }
  }

  /**
   * Poll playlist status until all tracks complete
   *
   * @param materialId - Material ID
   * @param onUpdate - Callback for status updates: (playlist) => void
   * @param onComplete - Callback when all tracks complete: (playlist) => void
   * @param options - Polling options
   * @returns Stop polling function
   */
  static pollPlaylistStatus(
    materialId: string,
    onUpdate: (playlist: ProgressivePlaylist) => void,
    onComplete: (playlist: ProgressivePlaylist | { error: string }) => void,
    options: PollingOptions = {}
  ): () => void {
    const {
      pollInterval = 10000, // 10 seconds
      maxAttempts = 120,    // 20 minutes max
    } = options;

    let attempts = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let stopped = false;

    const poll = async (): Promise<void> => {
      if (stopped || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          logger.warn('⏱️ Polling timeout reached', { materialId, attempts });
          onComplete({ error: 'Timeout' });
        }
        return;
      }

      try {
        const playlist = await this.getPlaylistStatus(materialId);

        if (!playlist) {
          logger.warn('Playlist not found, stopping poll', { materialId });
          return;
        }

        // Call update callback
        if (onUpdate) {
          onUpdate(playlist);
        }

        // Check if all tracks complete
        const allComplete = playlist.completed_tracks === playlist.total_tracks;
        const hasFailed = playlist.status === 'failed';

        if (allComplete || hasFailed) {
          logger.info('🎉 Playlist polling complete', {
            completedTracks: playlist.completed_tracks,
            totalTracks: playlist.total_tracks,
            status: playlist.status,
          });
          if (onComplete) {
            onComplete(playlist);
          }
          return;
        }

        // Continue polling
        attempts++;
        if (!stopped) {
          timeoutId = setTimeout(poll, pollInterval);
        }

      } catch (error) {
        logger.error('Polling error', { error, materialId, attempts });

        // Continue polling despite errors
        attempts++;
        if (!stopped) {
          timeoutId = setTimeout(poll, pollInterval);
        }
      }
    };

    // Start polling
    poll();

    // Return stop function
    return () => {
      stopped = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  /**
   * Retry a failed track
   *
   * @param trackId - Track ID to retry
   * @returns Retry status
   */
  static async retryFailedTrack(trackId: string): Promise<AudioTrack> {
    try {
      const formData = new FormData();

      const response = await axios.post<AudioTrack>(
        `${API_BASE_URL}/api/study/audio/tracks/${trackId}/retry`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      logger.info('🔄 Retrying track', { trackId });
      return response.data;
    } catch (error) {
      logger.error('Failed to retry track', { error, trackId });
      throw error;
    }
  }

  /**
   * Get track status summary
   *
   * @param playlist - Playlist object
   * @returns Status summary
   */
  static getTrackStatusSummary(playlist: ProgressivePlaylist | null): TrackStatusSummary {
    if (!playlist || !playlist.tracks) {
      return {
        complete: 0,
        processing: 0,
        queued: 0,
        failed: 0,
        total: 0,
      };
    }

    const summary: TrackStatusSummary = {
      complete: 0,
      processing: 0,
      queued: 0,
      failed: 0,
      total: playlist.tracks.length,
    };

    playlist.tracks.forEach((track) => {
      summary[track.status] = (summary[track.status] || 0) + 1;
    });

    return summary;
  }

  /**
   * Get first playable track
   *
   * @param playlist - Playlist object
   * @returns First complete track, or null
   */
  static getFirstPlayableTrack(playlist: ProgressivePlaylist | null): AudioTrack | null {
    if (!playlist || !playlist.tracks) {
      return null;
    }

    return playlist.tracks.find((track) => track.status === 'complete') || null;
  }

  /**
   * Format duration from seconds
   *
   * @param seconds - Duration in seconds
   * @returns Formatted duration (e.g., "5:43")
   */
  static formatDuration(seconds: number | null): string {
    if (!seconds) return '--:--';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate progress percentage
   *
   * @param playlist - Playlist object
   * @returns Progress 0-100
   */
  static calculateProgress(playlist: ProgressivePlaylist | null): number {
    if (!playlist || !playlist.total_tracks) {
      return 0;
    }

    return Math.round((playlist.completed_tracks / playlist.total_tracks) * 100);
  }
}

export default ProgressivePlaylistService;
