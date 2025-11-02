/**
 * TrackListItem Component
 *
 * Displays individual audio track with status indicator and play controls.
 * Supports multiple states: complete, processing, queued, failed.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AudioTrack, TrackListItemProps } from '../../types/progressiveAudio.types';
import Colors from '../../constants/Colors';

const TrackListItem: React.FC<TrackListItemProps> = ({
  track,
  onPlay,
  isPlaying,
  isDisabled = false,
}) => {
  /**
   * Format duration from seconds to MM:SS
   */
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Format file size to human readable
   */
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  /**
   * Render status-specific content
   */
  const renderStatusContent = () => {
    switch (track.status) {
      case 'complete':
        return (
          <TouchableOpacity
            style={[styles.trackCard, styles.completeTrack]}
            onPress={onPlay}
            disabled={isDisabled}
            activeOpacity={0.7}
          >
            <View style={styles.trackHeader}>
              <View style={styles.trackInfo}>
                <View style={styles.trackNumberBadge}>
                  <Text style={styles.trackNumberText}>{track.track_num}</Text>
                </View>
                <View style={styles.trackTitleContainer}>
                  <Text style={styles.trackTitle} numberOfLines={2}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackDuration}>
                    {formatDuration(track.duration)}
                    {track.file_size && ` • ${formatFileSize(track.file_size)}`}
                  </Text>
                </View>
              </View>
              <View style={styles.playButtonContainer}>
                {isPlaying ? (
                  <View style={[styles.playButton, styles.nowPlaying]}>
                    <Text style={styles.playIcon}>❚❚</Text>
                  </View>
                ) : (
                  <View style={styles.playButton}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.statusIndicator}>
              <Text style={styles.completeIcon}>✅</Text>
              <Text style={styles.completeText}>Ready to play</Text>
            </View>
          </TouchableOpacity>
        );

      case 'processing':
        return (
          <View style={[styles.trackCard, styles.processingTrack]}>
            <View style={styles.trackHeader}>
              <View style={styles.trackInfo}>
                <View style={[styles.trackNumberBadge, styles.processingBadge]}>
                  <Text style={styles.trackNumberText}>{track.track_num}</Text>
                </View>
                <View style={styles.trackTitleContainer}>
                  <Text style={styles.trackTitle} numberOfLines={2}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackDuration}>
                    ~{formatDuration(track.character_count / 12.5)} estimated
                  </Text>
                </View>
              </View>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${track.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{track.progress}%</Text>
            </View>
            <View style={styles.statusIndicator}>
              <Text style={styles.processingIcon}>⏳</Text>
              <Text style={styles.processingText}>Generating audio...</Text>
            </View>
          </View>
        );

      case 'queued':
        return (
          <View style={[styles.trackCard, styles.queuedTrack]}>
            <View style={styles.trackHeader}>
              <View style={styles.trackInfo}>
                <View style={[styles.trackNumberBadge, styles.queuedBadge]}>
                  <Text style={styles.trackNumberText}>{track.track_num}</Text>
                </View>
                <View style={styles.trackTitleContainer}>
                  <Text style={[styles.trackTitle, styles.queuedTitle]} numberOfLines={2}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackDuration}>
                    ~{formatDuration(track.character_count / 12.5)} estimated
                  </Text>
                </View>
              </View>
              <View style={styles.queuedIcon}>
                <Text style={styles.queuedIconText}>⌛</Text>
              </View>
            </View>
            <View style={styles.statusIndicator}>
              <Text style={styles.queuedText}>Waiting in queue...</Text>
            </View>
          </View>
        );

      case 'failed':
        return (
          <View style={[styles.trackCard, styles.failedTrack]}>
            <View style={styles.trackHeader}>
              <View style={styles.trackInfo}>
                <View style={[styles.trackNumberBadge, styles.failedBadge]}>
                  <Text style={styles.trackNumberText}>{track.track_num}</Text>
                </View>
                <View style={styles.trackTitleContainer}>
                  <Text style={styles.trackTitle} numberOfLines={2}>
                    {track.title}
                  </Text>
                  {track.error_message && (
                    <Text style={styles.errorMessage} numberOfLines={2}>
                      {track.error_message}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  // TODO: Implement retry
                  console.log('Retry track:', track.id);
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statusIndicator}>
              <Text style={styles.failedIcon}>❌</Text>
              <Text style={styles.failedText}>Generation failed</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderStatusContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeTrack: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success || '#4CAF50',
  },
  processingTrack: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary || '#007AFF',
  },
  queuedTrack: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.textSecondary || '#999',
    opacity: 0.8,
  },
  failedTrack: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error || '#FF3B30',
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success || '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  processingBadge: {
    backgroundColor: Colors.primary || '#007AFF',
  },
  queuedBadge: {
    backgroundColor: Colors.textSecondary || '#999',
  },
  failedBadge: {
    backgroundColor: Colors.error || '#FF3B30',
  },
  trackNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackTitleContainer: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text || '#000000',
    marginBottom: 4,
  },
  queuedTitle: {
    color: Colors.textSecondary || '#999',
  },
  trackDuration: {
    fontSize: 13,
    color: Colors.textSecondary || '#666',
  },
  playButtonContainer: {
    marginLeft: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary || '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlaying: {
    backgroundColor: Colors.success || '#4CAF50',
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  completeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  completeText: {
    fontSize: 13,
    color: Colors.success || '#4CAF50',
    fontWeight: '500',
  },
  processingIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  processingText: {
    fontSize: 13,
    color: Colors.primary || '#007AFF',
  },
  queuedIcon: {
    marginLeft: 12,
  },
  queuedIconText: {
    fontSize: 24,
  },
  queuedText: {
    fontSize: 13,
    color: Colors.textSecondary || '#999',
  },
  failedIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  failedText: {
    fontSize: 13,
    color: Colors.error || '#FF3B30',
  },
  errorMessage: {
    fontSize: 12,
    color: Colors.error || '#FF3B30',
    marginTop: 2,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary || '#007AFF',
    borderRadius: 8,
    marginLeft: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary || '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: Colors.textSecondary || '#666',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});

export default TrackListItem;
