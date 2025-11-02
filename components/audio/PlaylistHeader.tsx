/**
 * PlaylistHeader Component
 *
 * Displays playlist progress, stats, and refresh controls.
 * Shows completed/total tracks, estimated time, and overall status.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PlaylistHeaderProps } from '../../types/progressiveAudio.types';
import Colors from '../../constants/Colors';

const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({
  playlist,
  statusSummary,
  onRefresh,
}) => {
  /**
   * Format duration from seconds to human readable
   */
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '--';

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  /**
   * Calculate overall progress percentage
   */
  const progressPercentage =
    playlist.total_tracks > 0
      ? Math.round((playlist.completed_tracks / playlist.total_tracks) * 100)
      : 0;

  /**
   * Determine status message and icon
   */
  const getStatusDisplay = () => {
    if (playlist.status === 'complete') {
      return {
        icon: '🎉',
        text: 'All tracks ready!',
        color: Colors.success || '#4CAF50',
      };
    }

    if (playlist.status === 'failed') {
      return {
        icon: '❌',
        text: 'Generation failed',
        color: Colors.error || '#FF3B30',
      };
    }

    if (playlist.status === 'partial') {
      return {
        icon: '⚠️',
        text: 'Some tracks failed',
        color: Colors.warning || '#FF9500',
      };
    }

    // Generating
    if (statusSummary.complete === 0) {
      return {
        icon: '⏳',
        text: 'Starting generation...',
        color: Colors.primary || '#007AFF',
      };
    }

    return {
      icon: '⏳',
      text: 'Generating tracks...',
      color: Colors.primary || '#007AFF',
    };
  };

  const statusDisplay = getStatusDisplay();

  /**
   * Estimate time remaining
   */
  const estimateTimeRemaining = (): string | null => {
    if (playlist.status === 'complete' || playlist.status === 'failed') {
      return null;
    }

    const remainingTracks = playlist.total_tracks - playlist.completed_tracks;
    if (remainingTracks === 0) return null;

    // Rough estimate: 8 seconds per track
    const estimatedSeconds = remainingTracks * 8;
    const mins = Math.ceil(estimatedSeconds / 60);

    return `~${mins} min remaining`;
  };

  return (
    <View style={styles.container}>
      {/* Title and Refresh */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {playlist.title}
        </Text>
        {onRefresh && playlist.status === 'generating' && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.refreshIcon}>🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Message */}
      <View style={styles.statusRow}>
        <Text style={styles.statusIcon}>{statusDisplay.icon}</Text>
        <Text style={[styles.statusText, { color: statusDisplay.color }]}>
          {statusDisplay.text}
        </Text>
      </View>

      {/* Progress Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {playlist.completed_tracks} / {playlist.total_tracks}
          </Text>
          <Text style={styles.statLabel}>Tracks Ready</Text>
        </View>

        {playlist.estimated_total_duration && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDuration(playlist.estimated_total_duration)}
            </Text>
            <Text style={styles.statLabel}>Total Duration</Text>
          </View>
        )}

        {statusSummary.processing > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statusSummary.processing}</Text>
            <Text style={styles.statLabel}>Processing</Text>
          </View>
        )}

        {statusSummary.failed > 0 && (
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.error }]}>
              {statusSummary.failed}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: statusDisplay.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
      </View>

      {/* Time Remaining */}
      {estimateTimeRemaining() && (
        <View style={styles.timeRemainingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.timeRemainingText}>
            {estimateTimeRemaining()}
          </Text>
        </View>
      )}

      {/* Completion Message */}
      {playlist.status === 'complete' && (
        <View style={styles.completeMessageContainer}>
          <Text style={styles.completeMessage}>
            🎧 Ready to listen! All tracks have been generated.
          </Text>
        </View>
      )}

      {/* Partial Failure Message */}
      {playlist.status === 'partial' && statusSummary.failed > 0 && (
        <View style={styles.warningMessageContainer}>
          <Text style={styles.warningMessage}>
            ⚠️ {statusSummary.failed} track(s) failed. You can still listen to the others or retry failed tracks.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text || '#000000',
    flex: 1,
    marginRight: 12,
  },
  refreshButton: {
    padding: 4,
  },
  refreshIcon: {
    fontSize: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary || '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary || '#666',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text || '#000000',
    minWidth: 45,
    textAlign: 'right',
  },
  timeRemainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  timeRemainingText: {
    fontSize: 14,
    color: Colors.textSecondary || '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  completeMessageContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success || '#4CAF50',
  },
  completeMessage: {
    fontSize: 14,
    color: Colors.success || '#4CAF50',
    fontWeight: '500',
  },
  warningMessageContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning || '#FF9500',
  },
  warningMessage: {
    fontSize: 14,
    color: Colors.warning || '#FF9500',
    fontWeight: '500',
  },
});

export default PlaylistHeader;
