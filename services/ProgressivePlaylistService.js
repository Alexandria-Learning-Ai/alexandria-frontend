/**
 * Progressive Playlist Service
 *
 * Handles chunked audio generation with progressive track delivery.
 * Users start listening to Track 1 within seconds while others generate.
 *
 * @example
 * ```javascript
 * import ProgressivePlaylistService from './services/ProgressivePlaylistService';
 *
 * // Start generation
 * const playlist = await ProgressivePlaylistService.startChunkedGeneration(materialId);
 *
 * // Poll for updates
 * ProgressivePlaylistService.pollPlaylistStatus(
 *   materialId,
 *   (updatedPlaylist) => {
 *     console.log(`${updatedPlaylist.completed_tracks}/${updatedPlaylist.total_tracks} ready`);
 *   },
 *   (finalPlaylist) => {
 *     console.log('All tracks ready!');
 *   }
 * );
 * ```
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

class ProgressivePlaylistService {
  /**
   * Start chunked audio generation
   *
   * @param {string} materialId - Study material ID
   * @param {object} options - Generation options
   * @param {string} options.voice - Voice to use (default, male, female)
   * @param {number} options.speed - Speech speed (0.5 - 2.0)
   * @param {string} options.language - Language code (en, es, fr, etc.)
   * @returns {Promise<object>} Playlist data with tracks
   */
  static async startChunkedGeneration(materialId, options = {}) {
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

      const response = await axios.post(
        `${API_BASE_URL}/api/study/materials/${materialId}/audio/playlist`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const playlist = response.data;

      console.log(`🎵 Chunked playlist created: ${playlist.title}`);
      console.log(`   Total tracks: ${playlist.total_tracks}`);
      console.log(`   Estimated duration: ${Math.round(playlist.estimated_total_duration / 60)} minutes`);

      return playlist;
    } catch (error) {
      console.error('❌ Failed to start chunked generation:', error);

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
   * @param {string} materialId - Study material ID
   * @returns {Promise<object>} Current playlist with track statuses
   */
  static async getPlaylistStatus(materialId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/study/materials/${materialId}/audio/playlist`
      );

      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Playlist doesn't exist yet
        return null;
      }

      console.error('Failed to get playlist status:', error);
      throw error;
    }
  }

  /**
   * Poll playlist status until all tracks complete
   *
   * @param {string} materialId - Material ID
   * @param {function} onUpdate - Callback for status updates: (playlist) => void
   * @param {function} onComplete - Callback when all tracks complete: (playlist) => void
   * @param {object} options - Polling options
   * @param {number} options.pollInterval - Interval in ms (default: 10000)
   * @param {number} options.maxAttempts - Max attempts (default: 120)
   * @returns {function} Stop polling function
   */
  static pollPlaylistStatus(
    materialId,
    onUpdate,
    onComplete,
    options = {}
  ) {
    const {
      pollInterval = 10000, // 10 seconds
      maxAttempts = 120,    // 20 minutes max
    } = options;

    let attempts = 0;
    let timeoutId = null;
    let stopped = false;

    const poll = async () => {
      if (stopped || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          console.warn('⏱️ Polling timeout reached');
          onComplete({ error: 'Timeout' });
        }
        return;
      }

      try {
        const playlist = await this.getPlaylistStatus(materialId);

        if (!playlist) {
          console.warn('Playlist not found, stopping poll');
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
          console.log(`🎉 Playlist polling complete: ${playlist.completed_tracks}/${playlist.total_tracks} tracks`);
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
        console.error('Polling error:', error);

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
   * @param {string} trackId - Track ID to retry
   * @returns {Promise<object>} Retry status
   */
  static async retryFailedTrack(trackId) {
    try {
      const formData = new FormData();

      const response = await axios.post(
        `${API_BASE_URL}/api/study/audio/tracks/${trackId}/retry`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log(`🔄 Retrying track: ${trackId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to retry track:', error);
      throw error;
    }
  }

  /**
   * Get track status summary
   *
   * @param {object} playlist - Playlist object
   * @returns {object} Status summary
   */
  static getTrackStatusSummary(playlist) {
    if (!playlist || !playlist.tracks) {
      return {
        complete: 0,
        processing: 0,
        queued: 0,
        failed: 0,
        total: 0,
      };
    }

    const summary = {
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
   * @param {object} playlist - Playlist object
   * @returns {object|null} First complete track, or null
   */
  static getFirstPlayableTrack(playlist) {
    if (!playlist || !playlist.tracks) {
      return null;
    }

    return playlist.tracks.find((track) => track.status === 'complete');
  }

  /**
   * Format duration from seconds
   *
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration (e.g., "5:43")
   */
  static formatDuration(seconds) {
    if (!seconds) return '--:--';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate progress percentage
   *
   * @param {object} playlist - Playlist object
   * @returns {number} Progress 0-100
   */
  static calculateProgress(playlist) {
    if (!playlist || !playlist.total_tracks) {
      return 0;
    }

    return Math.round((playlist.completed_tracks / playlist.total_tracks) * 100);
  }
}

export default ProgressivePlaylistService;
