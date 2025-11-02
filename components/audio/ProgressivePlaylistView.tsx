/**
 * ProgressivePlaylistView Component
 *
 * Main container for progressive audio playlist with real-time updates.
 * Polls for track status and provides smooth UX during generation.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import { ProgressivePlaylistProps, AudioTrack, TrackStatusSummary } from '../../types/progressiveAudio.types';
import TrackListItem from './TrackListItem';
import PlaylistHeader from './PlaylistHeader';
import ProgressivePlaylistService from '../../services/ProgressivePlaylistService';
import Colors from '../../constants/Colors';

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
    if (isPolling) return;

    console.log('🔄 Starting playlist polling');
    setIsPolling(true);

    const stopPolling = ProgressivePlaylistService.pollPlaylistStatus(
      materialId,
      (updatedPlaylist) => {
        console.log(`📊 Playlist update: ${updatedPlaylist.completed_tracks}/${updatedPlaylist.total_tracks} tracks ready`);
        setPlaylist(updatedPlaylist);
      },
      (finalPlaylist) => {
        console.log('🎉 Playlist polling complete');
        setPlaylist(finalPlaylist);
        setIsPolling(false);
      },
      {
        pollInterval: 10000, // 10 seconds
        maxAttempts: 120,    // 20 minutes max
      }
    );

    stopPollingRef.current = stopPolling;
  }, [materialId, isPolling]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (stopPollingRef.current) {
      console.log('⏹️ Stopping playlist polling');
      stopPollingRef.current();
      stopPollingRef.current = null;
      setIsPolling(false);
    }
  }, []);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const updatedPlaylist = await ProgressivePlaylistService.getPlaylistStatus(materialId);
      if (updatedPlaylist) {
        setPlaylist(updatedPlaylist);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to refresh playlist:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [materialId, onRefresh]);

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
          isPlaying={isPlaying}
          isDisabled={isDisabled}
        />
      );
    },
    [onTrackPlay, currentlyPlayingTrackId]
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
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerText}>Checking for updates...</Text>
      </View>
    );
  };

  /**
   * Start polling when component mounts or when playlist is generating
   */
  useEffect(() => {
    const shouldPoll =
      playlist.status === 'generating' &&
      playlist.completed_tracks < playlist.total_tracks;

    if (shouldPoll && !isPolling) {
      startPolling();
    } else if (!shouldPoll && isPolling) {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [playlist.status, playlist.completed_tracks, playlist.total_tracks, isPolling, startPolling, stopPolling]);

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
            tintColor={Colors.primary}
            colors={[Colors.primary || '#007AFF']}
          />
        }
        onScrollToIndexFailed={(info) => {
          // Handle scroll failure gracefully
          console.warn('Scroll to index failed:', info);
        }}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    color: Colors.text || '#000000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary || '#666',
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
    color: Colors.textSecondary || '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
});

export default ProgressivePlaylistView;
