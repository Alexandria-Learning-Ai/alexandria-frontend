/**
 * Async Audio Generation Service
 *
 * Handles asynchronous audio generation with polling for long-running TTS operations.
 * Provides progress tracking and automatic retries for failed jobs.
 *
 * @example
 * ```javascript
 * import AsyncAudioService from './services/AsyncAudioService';
 *
 * // Start audio generation
 * const result = await AsyncAudioService.generateAudio(materialId, {
 *   voice: 'default',
 *   speed: 1.0,
 *   onProgress: (progress) => {
 *     console.log(`Progress: ${progress}%`);
 *   }
 * });
 *
 * console.log('Audio URL:', result.audio_url);
 * ```
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

class AsyncAudioService {
  /**
   * Generate audio asynchronously with progress tracking
   *
   * @param {string} materialId - Study material ID
   * @param {object} options - Generation options
   * @param {string} options.voice - Voice to use (default, male, female, neutral)
   * @param {number} options.speed - Speech speed (0.5 - 2.0)
   * @param {string} options.language - Language code (en, es, fr, etc.)
   * @param {string} options.contentType - Content type (full, summary, key_points)
   * @param {boolean} options.forceRegenerate - Force regeneration even if cached
   * @param {function} options.onProgress - Progress callback (progress) => void
   * @param {number} options.pollingInterval - Polling interval in ms (default: 10000)
   * @param {number} options.maxPollAttempts - Max polling attempts (default: 60)
   * @returns {Promise<object>} Audio generation result
   */
  static async generateAudio(materialId, options = {}) {
    const {
      voice = 'default',
      speed = 1.0,
      language = 'en',
      contentType = 'full',
      forceRegenerate = false,
      onProgress = null,
      pollingInterval = 10000, // Poll every 10 seconds
      maxPollAttempts = 60, // Max 10 minutes
    } = options;

    try {
      // Start async audio generation
      const formData = new FormData();
      formData.append('voice', voice);
      formData.append('speed', speed.toString());
      formData.append('language', language);
      formData.append('content_type', contentType);
      formData.append('force_regenerate', forceRegenerate.toString());

      const startResponse = await axios.post(
        `${API_BASE_URL}/api/study/materials/${materialId}/audio/async`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { job_id, status, progress, audio_url } = startResponse.data;

      // If already complete (cached), return immediately
      if (status === 'complete' && audio_url) {
        if (onProgress) onProgress(100);
        return startResponse.data;
      }

      // Poll for status until complete
      console.log(`🔊 Started audio generation job: ${job_id}`);
      const result = await this._pollJobStatus(
        materialId,
        job_id,
        onProgress,
        pollingInterval,
        maxPollAttempts
      );

      return result;
    } catch (error) {
      console.error('❌ Audio generation failed:', error);

      if (error.response) {
        throw new Error(
          error.response.data?.detail ||
            error.response.data?.message ||
            'Audio generation failed'
        );
      }

      throw error;
    }
  }

  /**
   * Poll job status until complete or failed
   *
   * @private
   * @param {string} materialId - Material ID
   * @param {string} jobId - Job ID to poll
   * @param {function} onProgress - Progress callback
   * @param {number} pollingInterval - Interval between polls in ms
   * @param {number} maxAttempts - Maximum polling attempts
   * @returns {Promise<object>} Final job result
   */
  static async _pollJobStatus(
    materialId,
    jobId,
    onProgress,
    pollingInterval,
    maxAttempts
  ) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        // Wait before polling (except first attempt)
        if (attempts > 0) {
          await this._sleep(pollingInterval);
        }

        // Get job status
        const statusResponse = await axios.get(
          `${API_BASE_URL}/api/study/materials/${materialId}/audio/status/${jobId}`
        );

        const { status, progress, audio_url, error_message } = statusResponse.data;

        // Update progress
        if (onProgress && progress !== undefined) {
          onProgress(progress);
        }

        // Check if complete
        if (status === 'complete') {
          console.log('✅ Audio generation complete!');
          return statusResponse.data;
        }

        // Check if failed
        if (status === 'failed') {
          const errorMsg = error_message || 'Audio generation failed';
          console.error(`❌ Audio generation failed: ${errorMsg}`);
          throw new Error(errorMsg);
        }

        // Log progress
        console.log(`⏳ Audio generation ${status}: ${progress}%`);

        attempts++;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          throw new Error('Audio generation job not found');
        }

        // If not a 404, continue polling
        console.warn(`Polling attempt ${attempts} failed:`, error.message);
        attempts++;
      }
    }

    throw new Error('Audio generation timeout - maximum polling attempts reached');
  }

  /**
   * Get audio generation job status
   *
   * @param {string} materialId - Material ID
   * @param {string} jobId - Job ID
   * @returns {Promise<object>} Job status
   */
  static async getJobStatus(materialId, jobId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/study/materials/${materialId}/audio/status/${jobId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Get existing audio for material (cached)
   *
   * @param {string} materialId - Material ID
   * @param {object} options - Audio options
   * @returns {Promise<object|null>} Cached audio or null
   */
  static async getCachedAudio(materialId, options = {}) {
    const {
      voice = 'default',
      speed = 1.0,
      contentType = 'full',
    } = options;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/study/materials/${materialId}/audio`,
        {
          params: {
            voice,
            speed,
            content_type: contentType,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // No cached audio available
        return null;
      }

      throw error;
    }
  }

  /**
   * Sleep helper
   *
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default AsyncAudioService;
