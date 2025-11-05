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
import { useAudioPlaylistSSE } from '../../hooks/useAudioPlaylistSSE';
import logger from '../../utils/logger';

const ProgressivePlaylistView: React.FC<ProgressivePlaylistProps> = ({
  materialId,
  playlist: initialPlaylist,
  onTrackPlay,
  onRefresh,
  onPlaylistUpdate,
  currentlyPlayingTrackId,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [isPlaylistSaved, setIsPlaylistSaved] = useState(false);
  const isMountedRef = useRef(true);

  /**
   * Use SSE/polling hook for real-time updates
   * This replaces the manual polling logic with an automated solution
   */
  const {
    playlist,
    isFallbackPolling,
    refresh: refreshPlaylist,
  } = useAudioPlaylistSSE(materialId, initialPlaylist, {
    enabled: true,
    onTrackComplete: (track) => {
      logger.info('🎵 Track completed', {
        trackNum: track.track_num,
        title: track.title,
      });
    },
    onPlaylistComplete: (completedPlaylist) => {
      logger.success('🎉 All tracks complete!', {
        totalTracks: completedPlaylist.total_tracks,
      });
    },
    onPlaylistUpdate: (updatedPlaylist) => {
      // Notify parent component of playlist updates
      if (onPlaylistUpdate) {
        onPlaylistUpdate(updatedPlaylist);
      }
    },
  });

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
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsRefreshing(true);

    try {
      // Use the hook's refresh method for consistency
      await refreshPlaylist();

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
  }, [materialId, onRefresh, refreshPlaylist]);

  /**
   * Handle track retry
   */
  const handleRetry = useCallback(async (trackId: string) => {
    try {
      logger.info('Retrying failed track', { trackId });
      await ProgressivePlaylistService.retryFailedTrack(trackId);

      // Refresh playlist to get updated status
      await refreshPlaylist();
    } catch (error) {
      logger.error('Failed to retry track', { error, trackId });
    }
  }, [refreshPlaylist]);

  /**
   * Handle editing track title
   */
  const handleEditTitle = useCallback(async (trackId: string, newTitle: string) => {
    try {
      logger.info('Updating track title', { trackId, newTitle });
      const updatedPlaylist = await ProgressivePlaylistService.updateTrackTitle(
        materialId,
        trackId,
        newTitle
      );

      // Update parent component with new playlist data
      if (onPlaylistUpdate && isMountedRef.current) {
        onPlaylistUpdate(updatedPlaylist);
      }
    } catch (error) {
      logger.error('Failed to update track title', { error, trackId, newTitle });
    }
  }, [materialId, onPlaylistUpdate]);

  /**
   * Handle saving playlist to My Playlists
   */
  const handleSavePlaylist = useCallback(async () => {
    if (!isMountedRef.current || isSavingPlaylist || isPlaylistSaved) return;

    setIsSavingPlaylist(true);

    try {
      logger.info('💾 Saving playlist to My Playlists', { materialId });

      const result = await ProgressivePlaylistService.finalizePlaylist(materialId);

      if (result.success && isMountedRef.current) {
        setIsPlaylistSaved(true);
        logger.success('✅ Playlist saved successfully', {
          playlistId: result.playlist_id,
          tracksAdded: result.tracks_added,
        });
      }
    } catch (error) {
      logger.error('❌ Failed to save playlist', { error, materialId });
      // Keep button visible so user can retry
    } finally {
      if (isMountedRef.current) {
        setIsSavingPlaylist(false);
      }
    }
  }, [materialId, isSavingPlaylist, isPlaylistSaved]);

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
          onEditTitle={handleEditTitle}
          isPlaying={isPlaying}
          isDisabled={isDisabled}
        />
      );
    },
    [onTrackPlay, currentlyPlayingTrackId, handleRetry, handleEditTitle]
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
    if (!playlist) return null;

    return (
      <PlaylistHeader
        playlist={playlist}
        statusSummary={getStatusSummary()}
        onRefresh={handleRefresh}
        onSavePlaylist={handleSavePlaylist}
        isSaved={isPlaylistSaved}
      />
    );
  }, [playlist, getStatusSummary, handleRefresh, handleSavePlaylist, isPlaylistSaved]);

  /**
   * Render list footer - show polling indicator
   */
  const renderFooter = () => {
    if (!isFallbackPolling) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={themeColors.alexandriaGold} />
        <Text style={styles.footerText}>Checking for updates...</Text>
      </View>
    );
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Auto-scroll to first playable track when it becomes available
   */
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledToFirst, setHasScrolledToFirst] = useState(false);

  useEffect(() => {
    if (hasScrolledToFirst || !playlist) return;

    const firstPlayable = ProgressivePlaylistService.getFirstPlayableTrack(playlist);
    if (firstPlayable && playlist.tracks) {
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
        data={playlist?.tracks || []}
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
