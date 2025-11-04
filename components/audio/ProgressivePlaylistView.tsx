/**
 * ProgressivePlaylistView Component
 *
 * Main container for progressive audio playlist with real-time updates.
 * Polls for track status and provides smooth UX during generation.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import { ProgressivePlaylistProps, AudioTrack, TrackStatusSummary, ProgressivePlaylist } from '../../types/progressiveAudio.types';
import TrackListItem from './TrackListItem';
import PlaylistHeader from './PlaylistHeader';
import ProgressivePlaylistService from '../../services/ProgressivePlaylistService';
import logger from '../../utils/logger';

const ProgressivePlaylistView: React.FC<ProgressivePlaylistProps> = ({
  materialId,
  playlist: initialPlaylist,
  onTrackPlay,
  onRefresh,
  currentlyPlayingTrackId,
}) => {
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const stopPollingRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Update local state when parent passes new playlist data
   * FIX: Sync with parent when initialPlaylist prop changes
   */
  useEffect(() => {
    logger.info('📝 Parent playlist prop updated', {
      newStatus: initialPlaylist.status,
      newCompleted: initialPlaylist.completed_tracks,
      newTotal: initialPlaylist.total_tracks,
    });
    setPlaylist(initialPlaylist);
  }, [initialPlaylist]);

  // Alexandria theme colors
  const themeColors = useMemo(() => ({
    background: '#1A2C5B',
    backgroundSecondary: '#2C467D',
    alexandriaGold: '#D4AF37',
    alexandriaBronze: '#B8941F',
    text: '#F8F4E3',
    textSecondary: '#CBD5E0',
    success: '#28a745',
    error: '#dc3545',
  }), []);

  /**
   * Calculate track status summary
   */
  const getStatusSummary = useCallback((): TrackStatusSummary => {
    return ProgressivePlaylistService.getTrackStatusSummary(playlist);
  }, [playlist]);

  /**
   * Start polling for updates
   */
  const startPolling = useCallback(() => {
    if (isPolling || !isMountedRef.current) return;

    logger.info('🔄 Starting playlist polling', {
      materialId,
      currentStatus: playlist?.status,
      currentCompleted: playlist?.completed_tracks,
      currentTotal: playlist?.total_tracks,
    });
    setIsPolling(true);

    const stopPolling = ProgressivePlaylistService.pollPlaylistStatus(
      materialId,
      (updatedPlaylist: ProgressivePlaylist) => {
        if (!isMountedRef.current) return;

        logger.info('📥 Playlist update received', {
          status: updatedPlaylist.status,
          completed: updatedPlaylist.completed_tracks,
          total: updatedPlaylist.total_tracks,
          trackStatuses: updatedPlaylist.tracks.map(t => ({
            num: t.track_num,
            status: t.status,
            hasAudioUrl: !!t.audio_url,
          })),
        });

        setPlaylist(updatedPlaylist);
      },
      (finalPlaylist: ProgressivePlaylist | { error: string }) => {
        if (!isMountedRef.current) return;

        if ('error' in finalPlaylist) {
          logger.error('❌ Playlist polling failed', { error: finalPlaylist.error });
        } else {
          logger.info('✅ Playlist polling complete', {
            playlistId: finalPlaylist.chunked_playlist_id,
            status: finalPlaylist.status,
            completed: finalPlaylist.completed_tracks,
            total: finalPlaylist.total_tracks,
          });
          setPlaylist(finalPlaylist);
        }

        setIsPolling(false);
      },
      {
        pollInterval: 10000, // 10 seconds
        maxAttempts: 120,    // 20 minutes max
      }
    ) as () => void;

    stopPollingRef.current = stopPolling;
  }, [materialId, isPolling]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (stopPollingRef.current) {
      logger.info('Stopping playlist polling', { materialId });
      stopPollingRef.current();
      stopPollingRef.current = null;
      setIsPolling(false);
    }
  }, [materialId]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsRefreshing(true);

    try {
      const updatedPlaylist = await ProgressivePlaylistService.getPlaylistStatus(materialId);
      if (updatedPlaylist && isMountedRef.current) {
        setPlaylist(updatedPlaylist);
      }

      if (onRefresh && isMountedRef.current) {
        onRefresh();
      }
    } catch (error) {
      logger.error('Failed to refresh playlist', { error, materialId });
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [materialId, onRefresh]);

  /**
   * Handle track retry
   */
  const handleRetry = useCallback(async (trackId: string) => {
    try {
      logger.info('Retrying failed track', { trackId });
      await ProgressivePlaylistService.retryFailedTrack(trackId);

      // Refresh playlist to get updated status
      const updatedPlaylist = await ProgressivePlaylistService.getPlaylistStatus(materialId);
      if (updatedPlaylist && isMountedRef.current) {
        setPlaylist(updatedPlaylist);
      }
    } catch (error) {
      logger.error('Failed to retry track', { error, trackId });
    }
  }, [materialId]);

  /**
   * Render individual track
   */
  const renderTrack = useCallback(
    ({ item }: { item: AudioTrack }) => {
      const isPlaying = currentlyPlayingTrackId === item.id;
      const isDisabled = item.status !== 'complete';

      return (
        <TrackListItem
          track={item}
          onPlay={() => onTrackPlay(item)}
          onRetry={handleRetry}
          isPlaying={isPlaying}
          isDisabled={isDisabled}
        />
      );
    },
    [onTrackPlay, currentlyPlayingTrackId, handleRetry]
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎵</Text>
      <Text style={styles.emptyTitle}>No tracks yet</Text>
      <Text style={styles.emptySubtitle}>
        Tracks will appear here as they're generated
      </Text>
    </View>
  );

  /**
   * Render list header (playlist stats)
   */
  const renderHeader = useCallback(() => {
    return (
      <PlaylistHeader
        playlist={playlist}
        statusSummary={getStatusSummary()}
        onRefresh={handleRefresh}
      />
    );
  }, [playlist, getStatusSummary, handleRefresh]);

  /**
   * Render list footer
   */
  const renderFooter = () => {
    if (!isPolling) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={themeColors.alexandriaGold} />
        <Text style={styles.footerText}>Checking for updates...</Text>
      </View>
    );
  };

  /**
   * Start polling when component mounts or when playlist is not fully complete
   *
   * FIX: Improved polling logic to handle all states correctly:
   * - Polls when status is 'generating' OR 'complete' (backend might be complete but state not updated)
   * - Continues until ALL tracks show status='complete' in the local state
   * - Stops only when truly done: status='complete' AND all tracks are complete
   * - Also stops for 'failed' status
   */
  useEffect(() => {
    // Poll if:
    // 1. Playlist is actively generating, OR
    // 2. Playlist status is 'complete' but not all tracks are marked complete yet (state sync issue)
    // 3. NOT if status is 'failed' or 'partial' (error states)
    const isGenerating = playlist.status === 'generating';
    const isCompleteButNotAllTracks =
      playlist.status === 'complete' &&
      playlist.completed_tracks < playlist.total_tracks;
    const allTracksComplete = playlist.tracks.every(track => track.status === 'complete');

    const shouldPoll =
      (isGenerating || isCompleteButNotAllTracks) &&
      !allTracksComplete &&
      playlist.status !== 'failed';

    logger.info('📊 Polling decision', {
      shouldPoll,
      playlistStatus: playlist.status,
      completedTracks: playlist.completed_tracks,
      totalTracks: playlist.total_tracks,
      allTracksComplete,
      isPolling,
    });

    if (shouldPoll && !isPolling) {
      logger.info('▶️ Starting polling');
      startPolling();
    } else if (!shouldPoll && isPolling) {
      logger.info('⏹️ Stopping polling - all tracks complete');
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      // Set unmounted flag FIRST to prevent callbacks from executing
      isMountedRef.current = false;

      // Then stop polling
      if (stopPollingRef.current) {
        stopPollingRef.current();
        stopPollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist.status, playlist.completed_tracks, playlist.total_tracks, playlist.tracks.length, isPolling]);
  // Only depend on primitive values, not callback functions

  /**
   * Auto-scroll to first playable track when it becomes available
   */
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledToFirst, setHasScrolledToFirst] = useState(false);

  useEffect(() => {
    if (hasScrolledToFirst) return;

    const firstPlayable = ProgressivePlaylistService.getFirstPlayableTrack(playlist);
    if (firstPlayable) {
      const index = playlist.tracks.findIndex((t) => t.id === firstPlayable.id);
      if (index > 0 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 500);
        setHasScrolledToFirst(true);
      }
    }
  }, [playlist, hasScrolledToFirst]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={playlist.tracks}
        renderItem={renderTrack}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.alexandriaGold}
            colors={[themeColors.alexandriaGold]}
          />
        }
        onScrollToIndexFailed={(info) => {
          // Handle scroll failure gracefully
          logger.warn('Scroll to index failed', { info });
        }}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C5B', // Alexandria Navy
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8F4E3', // Alexandria Cream
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#CBD5E0', // Alexandria Secondary Text
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#CBD5E0', // Alexandria Secondary Text
    marginLeft: 8,
    fontStyle: 'italic',
  },
});

export default ProgressivePlaylistView;
