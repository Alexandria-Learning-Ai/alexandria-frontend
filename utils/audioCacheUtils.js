/**
 * Audio Caching Utilities
 * Shared functions for caching and managing audio files locally
 *
 * Purpose: Fix Render ephemeral storage issue by caching audio locally
 * Used by: MaterialViewerScreen, PlaylistDetailsScreen
 */

import * as FileSystem from 'expo-file-system';
import logger from './logger';

// Audio cache directory constants
const AUDIO_CACHE_DIR = `${FileSystem.documentDirectory}audio_cache/`;
const MAX_CACHED_FILES = 20;

/**
 * Get cache file path for audio
 * @param {string} materialId - Material ID
 * @param {string} audioId - Audio ID
 * @returns {string} Local file path
 */
export const getAudioCachePath = (materialId, audioId) => {
    return `${AUDIO_CACHE_DIR}audio_${materialId}_${audioId}.mp3`;
};

/**
 * Check if audio is cached locally
 * @param {string} materialId - Material ID
 * @param {string} audioId - Audio ID
 * @returns {Promise<boolean>} True if cached
 */
export const isAudioCached = async (materialId, audioId) => {
    try {
        const cachePath = getAudioCachePath(materialId, audioId);
        const fileInfo = await FileSystem.getInfoAsync(cachePath);
        return fileInfo.exists;
    } catch (error) {
        logger.error('Error checking audio cache:', error);
        return false;
    }
};

/**
 * Download and cache audio file
 * @param {string} audioUrl - Full audio URL (with API_BASE_URL)
 * @param {string} materialId - Material ID
 * @param {string} audioId - Audio ID
 * @returns {Promise<string>} Local cache path
 */
export const downloadAndCacheAudio = async (audioUrl, materialId, audioId) => {
    try {
        // Ensure cache directory exists
        const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
        if (!dirInfo.exists) {
            logger.info('Creating audio cache directory...');
            await FileSystem.makeDirectoryAsync(AUDIO_CACHE_DIR, { intermediates: true });
        }

        const cachePath = getAudioCachePath(materialId, audioId);

        logger.info(`Downloading audio to cache: ${audioUrl} -> ${cachePath}`);

        // Download the audio file
        const downloadResult = await FileSystem.downloadAsync(audioUrl, cachePath);

        if (downloadResult.status === 200) {
            logger.info(`Audio cached successfully at: ${cachePath}`);

            // Clean up old cache files if needed
            await cleanupAudioCache();

            return cachePath;
        } else {
            throw new Error(`Download failed with status: ${downloadResult.status}`);
        }
    } catch (error) {
        logger.error('Error downloading and caching audio:', error);
        throw error;
    }
};

/**
 * Get cached audio URI or download it
 * @param {string} audioUrlPath - Audio URL path from API (e.g., /audio/123/file.mp3)
 * @param {string} apiBaseUrl - API base URL
 * @param {string} materialId - Material ID
 * @param {string} audioId - Audio ID
 * @returns {Promise<string|null>} Local cache path or null if failed
 */
export const getCachedAudioUri = async (audioUrlPath, apiBaseUrl, materialId, audioId) => {
    try {
        // Check if already cached
        const cached = await isAudioCached(materialId, audioId);

        if (cached) {
            const cachePath = getAudioCachePath(materialId, audioId);
            logger.info(`Using cached audio: ${cachePath}`);
            return cachePath;
        }

        // Not cached, download it
        logger.info('Audio not cached, downloading...');
        const fullAudioUrl = audioUrlPath.startsWith('http')
            ? audioUrlPath
            : `${apiBaseUrl}${audioUrlPath}`;
        const cachePath = await downloadAndCacheAudio(fullAudioUrl, materialId, audioId);
        return cachePath;
    } catch (error) {
        logger.error('Error getting cached audio URI:', error);
        // Return null to allow fallback to backend URL
        return null;
    }
};

/**
 * Clean up old cached audio files
 * Keeps only the most recent MAX_CACHED_FILES files
 * @returns {Promise<void>}
 */
export const cleanupAudioCache = async () => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
        if (!dirInfo.exists) return;

        const files = await FileSystem.readDirectoryAsync(AUDIO_CACHE_DIR);

        if (files.length <= MAX_CACHED_FILES) {
            logger.info(`Cache size OK: ${files.length} files`);
            return;
        }

        // Get file info with timestamps
        const fileInfos = await Promise.all(
            files.map(async (filename) => {
                const filePath = `${AUDIO_CACHE_DIR}${filename}`;
                const info = await FileSystem.getInfoAsync(filePath);
                return {
                    path: filePath,
                    modificationTime: info.modificationTime || 0,
                    filename
                };
            })
        );

        // Sort by modification time (oldest first)
        fileInfos.sort((a, b) => a.modificationTime - b.modificationTime);

        // Delete oldest files to keep only MAX_CACHED_FILES
        const filesToDelete = fileInfos.slice(0, files.length - MAX_CACHED_FILES);

        for (const file of filesToDelete) {
            await FileSystem.deleteAsync(file.path, { idempotent: true });
            logger.info(`Deleted old cached audio: ${file.filename}`);
        }

        logger.info(`Cache cleanup complete. Removed ${filesToDelete.length} files.`);
    } catch (error) {
        logger.error('Error cleaning up audio cache:', error);
    }
};

/**
 * Clear all cached audio files
 * @returns {Promise<void>}
 */
export const clearAudioCache = async () => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(AUDIO_CACHE_DIR, { idempotent: true });
            logger.info('Audio cache cleared');
        }
    } catch (error) {
        logger.error('Error clearing audio cache:', error);
    }
};
