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

// Alexandria theme colors
const themeColors = {
  background: '#1A2C5B',
  backgroundSecondary: '#2C467D',
  alexandriaGold: '#D4AF37',
  alexandriaBronze: '#B8941F',
  text: '#F8F4E3',
  textSecondary: '#CBD5E0',
  success: '#28a745',
  error: '#dc3545',
};

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
              <ActivityIndicator size="small" color={themeColors.alexandriaGold} />
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
    backgroundColor: '#2C467D', // Alexandria Navy Secondary
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  completeTrack: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.success,
  },
  processingTrack: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.alexandriaGold,
  },
  queuedTrack: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.textSecondary,
    opacity: 0.8,
  },
  failedTrack: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.error,
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
    backgroundColor: themeColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  processingBadge: {
    backgroundColor: themeColors.alexandriaGold,
  },
  queuedBadge: {
    backgroundColor: themeColors.textSecondary,
  },
  failedBadge: {
    backgroundColor: themeColors.error,
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
    color: themeColors.text,
    marginBottom: 4,
  },
  queuedTitle: {
    color: themeColors.textSecondary,
  },
  trackDuration: {
    fontSize: 13,
    color: themeColors.textSecondary,
  },
  playButtonContainer: {
    marginLeft: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.alexandriaGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlaying: {
    backgroundColor: themeColors.success,
  },
  playIcon: {
    color: '#1A2C5B',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  completeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  completeText: {
    fontSize: 13,
    color: themeColors.success,
    fontWeight: '500',
  },
  processingIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  processingText: {
    fontSize: 13,
    color: themeColors.alexandriaGold,
  },
  queuedIcon: {
    marginLeft: 12,
  },
  queuedIconText: {
    fontSize: 24,
  },
  queuedText: {
    fontSize: 13,
    color: themeColors.textSecondary,
  },
  failedIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  failedText: {
    fontSize: 13,
    color: themeColors.error,
  },
  errorMessage: {
    fontSize: 12,
    color: themeColors.error,
    marginTop: 2,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: themeColors.alexandriaGold,
    borderRadius: 8,
    marginLeft: 12,
  },
  retryButtonText: {
    color: '#1A2C5B',
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
    backgroundColor: 'rgba(248, 244, 227, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: themeColors.alexandriaGold,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: themeColors.textSecondary,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(TrackListItem, (prevProps, nextProps) => {
  return (
    prevProps.track.id === nextProps.track.id &&
    prevProps.track.status === nextProps.track.status &&
    prevProps.track.progress === nextProps.track.progress &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.isDisabled === nextProps.isDisabled
  );
});
