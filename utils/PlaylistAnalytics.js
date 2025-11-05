/**
 * PlaylistAnalytics - Analytics tracking for audio playlist features
 *
 * Tracks user interactions with playlists to measure:
 * - Feature adoption (Play All, Speed Controls, Edit)
 * - User engagement (session duration, completion rate)
 * - Technical health (URL refresh success, playback errors)
 * - User behavior patterns (preferred speeds, listening times)
 */

import { AnalyticsManager } from './AnalyticsManager';
import logger from './logger';

class PlaylistAnalytics {
  constructor() {
    this.analytics = new AnalyticsManager({
      storageKey: 'playlist_analytics_events',
      batchSize: 20,
      flushInterval: 60000, // 1 minute
    });

    // Track session-level metrics
    this.sessionMetrics = {
      playlistsViewed: new Set(),
      tracksPlayed: new Set(),
      sequentialPlaybackSessions: 0,
      speedChanges: 0,
      urlRefreshAttempts: 0,
      urlRefreshSuccesses: 0,
    };
  }

  // ===== Playlist CRUD Events =====

  /**
   * Track playlist creation
   */
  trackPlaylistCreated(playlistId, metadata = {}) {
    this.analytics.track('playlist_created', {
      playlist_id: playlistId,
      has_description: !!metadata.description,
      thumbnail_color: metadata.thumbnailColor || 'default',
      category: 'playlist_management',
    });

    logger.info(`📊 Analytics: Playlist created - ${playlistId}`);
  }

  /**
   * Track playlist editing
   */
  trackPlaylistEdited(playlistId, changes = {}) {
    const changedFields = Object.keys(changes).filter(key => changes[key] !== undefined);

    this.analytics.track('playlist_edited', {
      playlist_id: playlistId,
      fields_changed: changedFields,
      changed_name: changedFields.includes('name'),
      changed_description: changedFields.includes('description'),
      changed_color: changedFields.includes('thumbnail_color'),
      category: 'playlist_management',
    });

    logger.info(`📊 Analytics: Playlist edited - ${playlistId}, changed: ${changedFields.join(', ')}`);
  }

  /**
   * Track playlist deletion
   */
  trackPlaylistDeleted(playlistId, metadata = {}) {
    this.analytics.track('playlist_deleted', {
      playlist_id: playlistId,
      item_count: metadata.itemCount || 0,
      total_duration: metadata.totalDuration || 0,
      category: 'playlist_management',
    });

    logger.info(`📊 Analytics: Playlist deleted - ${playlistId}`);
  }

  /**
   * Track viewing playlist details
   */
  trackPlaylistViewed(playlistId, metadata = {}) {
    this.sessionMetrics.playlistsViewed.add(playlistId);

    this.analytics.track('playlist_viewed', {
      playlist_id: playlistId,
      item_count: metadata.itemCount || 0,
      total_duration: metadata.totalDuration || 0,
      category: 'playlist_engagement',
    });

    logger.info(`📊 Analytics: Playlist viewed - ${playlistId}`);
  }

  // ===== Playback Events =====

  /**
   * Track single track playback start
   */
  trackTrackPlayed(playlistId, trackId, metadata = {}) {
    this.sessionMetrics.tracksPlayed.add(`${playlistId}:${trackId}`);

    this.analytics.track('track_played', {
      playlist_id: playlistId,
      track_id: trackId,
      track_title: metadata.title || 'Unknown',
      duration: metadata.duration || 0,
      playback_speed: metadata.playbackSpeed || 1.0,
      is_sequential: metadata.isSequential || false,
      track_position: metadata.trackPosition || 0,
      category: 'playback',
    });

    logger.info(`📊 Analytics: Track played - ${trackId} at ${metadata.playbackSpeed || 1}x`);
  }

  /**
   * Track "Play All" button usage
   */
  trackSequentialPlaybackStarted(playlistId, metadata = {}) {
    this.sessionMetrics.sequentialPlaybackSessions++;

    this.analytics.track('sequential_playback_started', {
      playlist_id: playlistId,
      track_count: metadata.trackCount || 0,
      total_duration: metadata.totalDuration || 0,
      playback_speed: metadata.playbackSpeed || 1.0,
      category: 'playback',
    });

    logger.info(`📊 Analytics: Sequential playback started - ${playlistId} with ${metadata.trackCount} tracks`);
  }

  /**
   * Track sequential playback completion
   */
  trackSequentialPlaybackCompleted(playlistId, metadata = {}) {
    this.analytics.track('sequential_playback_completed', {
      playlist_id: playlistId,
      tracks_played: metadata.tracksPlayed || 0,
      tracks_total: metadata.tracksTotal || 0,
      completion_rate: metadata.tracksTotal > 0
        ? (metadata.tracksPlayed / metadata.tracksTotal) * 100
        : 0,
      session_duration: metadata.sessionDuration || 0,
      average_speed: metadata.averageSpeed || 1.0,
      category: 'playback',
    });

    logger.info(`📊 Analytics: Sequential playback completed - ${metadata.tracksPlayed}/${metadata.tracksTotal} tracks`);
  }

  /**
   * Track manual stop of sequential playback
   */
  trackSequentialPlaybackStopped(playlistId, metadata = {}) {
    this.analytics.track('sequential_playback_stopped', {
      playlist_id: playlistId,
      tracks_played: metadata.tracksPlayed || 0,
      tracks_total: metadata.tracksTotal || 0,
      progress_percentage: metadata.tracksTotal > 0
        ? (metadata.tracksPlayed / metadata.tracksTotal) * 100
        : 0,
      stopped_at_track: metadata.stoppedAtTrack || 0,
      category: 'playback',
    });

    logger.info(`📊 Analytics: Sequential playback stopped - ${metadata.tracksPlayed}/${metadata.tracksTotal} completed`);
  }

  // ===== Speed Control Events =====

  /**
   * Track playback speed change
   */
  trackSpeedChanged(playlistId, fromSpeed, toSpeed, metadata = {}) {
    this.sessionMetrics.speedChanges++;

    this.analytics.track('playback_speed_changed', {
      playlist_id: playlistId,
      from_speed: fromSpeed,
      to_speed: toSpeed,
      speed_direction: toSpeed > fromSpeed ? 'increase' : 'decrease',
      is_playing: metadata.isPlaying || false,
      track_id: metadata.trackId,
      category: 'playback_control',
    });

    logger.info(`📊 Analytics: Speed changed - ${fromSpeed}x → ${toSpeed}x`);
  }

  /**
   * Track most used playback speeds (aggregated)
   */
  trackSpeedUsagePattern(speeds = {}) {
    this.analytics.track('speed_usage_pattern', {
      speeds_used: Object.keys(speeds),
      most_used_speed: this.getMostUsedSpeed(speeds),
      speed_preferences: speeds,
      category: 'playback_control',
    });
  }

  getMostUsedSpeed(speeds) {
    return Object.entries(speeds)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '1.0';
  }

  // ===== URL Refresh Events =====

  /**
   * Track audio URL refresh attempt
   */
  trackUrlRefreshAttempted(playlistId, trackId, reason) {
    this.sessionMetrics.urlRefreshAttempts++;

    this.analytics.track('audio_url_refresh_attempted', {
      playlist_id: playlistId,
      track_id: trackId,
      reason: reason || 'unknown', // 'missing_url', 'expired', '403', '404', etc.
      category: 'technical',
    });

    logger.info(`📊 Analytics: URL refresh attempted - ${trackId}, reason: ${reason}`);
  }

  /**
   * Track audio URL refresh success
   */
  trackUrlRefreshSuccess(playlistId, trackId, metadata = {}) {
    this.sessionMetrics.urlRefreshSuccesses++;

    this.analytics.track('audio_url_refresh_success', {
      playlist_id: playlistId,
      track_id: trackId,
      refresh_duration: metadata.refreshDuration || 0,
      retry_count: metadata.retryCount || 0,
      category: 'technical',
    });

    logger.info(`📊 Analytics: URL refresh success - ${trackId}`);
  }

  /**
   * Track audio URL refresh failure
   */
  trackUrlRefreshFailed(playlistId, trackId, error) {
    this.analytics.track('audio_url_refresh_failed', {
      playlist_id: playlistId,
      track_id: trackId,
      error_type: error?.type || 'unknown',
      error_message: error?.message || 'Unknown error',
      category: 'technical',
    });

    logger.error(`📊 Analytics: URL refresh failed - ${trackId}`, error);
  }

  // ===== Error Events =====

  /**
   * Track playback errors
   */
  trackPlaybackError(playlistId, trackId, error) {
    this.analytics.track('playback_error', {
      playlist_id: playlistId,
      track_id: trackId,
      error_type: error?.type || 'unknown',
      error_message: error?.message || 'Unknown error',
      error_code: error?.code,
      is_url_error: this.isUrlRelatedError(error),
      category: 'technical',
    });

    logger.error(`📊 Analytics: Playback error - ${trackId}`, error);
  }

  isUrlRelatedError(error) {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('404') ||
           message.includes('403') ||
           message.includes('expired') ||
           message.includes('networkerror');
  }

  // ===== Playlist Item Management =====

  /**
   * Track adding item to playlist
   */
  trackItemAdded(playlistId, trackId, metadata = {}) {
    this.analytics.track('playlist_item_added', {
      playlist_id: playlistId,
      track_id: trackId,
      track_title: metadata.title || 'Unknown',
      duration: metadata.duration || 0,
      new_item_count: metadata.newItemCount || 0,
      category: 'playlist_management',
    });

    logger.info(`📊 Analytics: Item added to playlist - ${trackId}`);
  }

  /**
   * Track removing item from playlist
   */
  trackItemRemoved(playlistId, trackId, metadata = {}) {
    this.analytics.track('playlist_item_removed', {
      playlist_id: playlistId,
      track_id: trackId,
      track_title: metadata.title || 'Unknown',
      remaining_item_count: metadata.remainingItemCount || 0,
      category: 'playlist_management',
    });

    logger.info(`📊 Analytics: Item removed from playlist - ${trackId}`);
  }

  /**
   * Track reordering playlist items
   */
  trackItemsReordered(playlistId, metadata = {}) {
    this.analytics.track('playlist_items_reordered', {
      playlist_id: playlistId,
      item_count: metadata.itemCount || 0,
      reorder_method: metadata.method || 'unknown', // 'drag_drop', 'manual'
      category: 'playlist_management',
    });

    logger.info(`📊 Analytics: Playlist items reordered - ${playlistId}`);
  }

  // ===== Session Summary =====

  /**
   * Get session metrics summary
   */
  getSessionSummary() {
    return {
      playlists_viewed: this.sessionMetrics.playlistsViewed.size,
      unique_tracks_played: this.sessionMetrics.tracksPlayed.size,
      sequential_sessions: this.sessionMetrics.sequentialPlaybackSessions,
      speed_changes: this.sessionMetrics.speedChanges,
      url_refresh_attempts: this.sessionMetrics.urlRefreshAttempts,
      url_refresh_successes: this.sessionMetrics.urlRefreshSuccesses,
      url_refresh_success_rate: this.sessionMetrics.urlRefreshAttempts > 0
        ? (this.sessionMetrics.urlRefreshSuccesses / this.sessionMetrics.urlRefreshAttempts) * 100
        : 0,
    };
  }

  /**
   * Track end of session and send summary
   */
  trackSessionEnd() {
    const summary = this.getSessionSummary();

    this.analytics.track('playlist_session_end', {
      ...summary,
      category: 'session',
    });

    logger.info('📊 Analytics: Playlist session ended', summary);

    // Reset session metrics
    this.sessionMetrics = {
      playlistsViewed: new Set(),
      tracksPlayed: new Set(),
      sequentialPlaybackSessions: 0,
      speedChanges: 0,
      urlRefreshAttempts: 0,
      urlRefreshSuccesses: 0,
    };
  }

  // ===== Utility Methods =====

  /**
   * Calculate engagement score (0-100)
   */
  calculateEngagementScore(metadata = {}) {
    let score = 0;

    // Sequential playback usage (40 points)
    if (metadata.usesSequentialPlayback) score += 40;

    // Speed control usage (20 points)
    if (metadata.usesSpeedControl) score += 20;

    // Playlist completion rate (20 points)
    if (metadata.completionRate) {
      score += Math.min(metadata.completionRate * 0.2, 20);
    }

    // Edit functionality usage (10 points)
    if (metadata.editsPlaylist) score += 10;

    // Session duration (10 points)
    if (metadata.sessionDuration > 900000) { // 15+ minutes
      score += 10;
    } else if (metadata.sessionDuration > 300000) { // 5+ minutes
      score += 5;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Flush all pending analytics events
   */
  async flush() {
    await this.analytics.flush();
  }
}

// Export singleton instance
export default new PlaylistAnalytics();
