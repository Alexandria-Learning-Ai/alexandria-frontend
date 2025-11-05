/**
 * PlaylistDetailsScreen V2
 *
 * Refactored to use AudioPlayerService for background playback support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';
import axios from 'axios';
import PlaylistItem from '../components/playlist/PlaylistItem';
import EditPlaylistModal from '../components/playlist/EditPlaylistModal';
import { usePlaylistStore, selectPlaylistById } from '../stores/playlistStore';
import PlaylistAnalytics from '../utils/PlaylistAnalytics';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import type { AudioTrack } from '../services/AudioPlayerService';

export default function PlaylistDetailsScreen({ navigation, route }) {
  const { playlist: initialPlaylist } = route.params;

  // Global playlist store
  const { playlists, updatePlaylist, updatePlaylistItems } = usePlaylistStore();

  // Audio player hook
  const {
    currentTrack,
    currentIndex,
    isSequential,
    playbackRate,
    playTrack,
    playPlaylist,
    stop,
    setPlaybackRate: setPlayerSpeed,
    error: playbackError,
  } = useAudioPlayer();

  // Get current playlist from store (with fallback to initial)
  const storePlaylist = playlists.find(p => p.id === initialPlaylist.id);
  const playlist = storePlaylist || initialPlaylist;

  // Local UI state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Theme colors
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

  // Load playlist details on screen focus
  useFocusEffect(
    useCallback(() => {
      loadPlaylistDetails();

      // Track playlist view
      PlaylistAnalytics.trackPlaylistViewed(playlist.id, {
        itemCount: playlist.item_count,
        totalDuration: playlist.total_duration,
      });
    }, [playlist.id])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      PlaylistAnalytics.trackSessionEnd();
    };
  }, []);

  // Handle playback errors
  useEffect(() => {
    if (playbackError) {
      Alert.alert(
        'Playback Error',
        'Unable to play this audio file. Please check your internet connection.',
        [{ text: 'OK' }]
      );
    }
  }, [playbackError]);

  // Load playlist details with items
  const loadPlaylistDetails = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/audio/playlists/${playlist.id}`,
        {
          params: { user_id: user.uid },
          headers: { 'X-User-ID': user.uid },
          timeout: 30000,
        }
      );

      if (response.data) {
        updatePlaylistItems(
          playlist.id,
          response.data.items || [],
          response.data.item_count,
          response.data.total_duration
        );

        setItems(response.data.items || []);
        logger.info(`🎵 Loaded playlist: ${response.data.name} with ${response.data.items?.length || 0} items`);
      }
    } catch (error) {
      logger.error('❌ Error loading playlist:', error);

      if (error.response?.status === 404) {
        Alert.alert('Playlist Not Found', 'This playlist no longer exists.', [
          { text: 'OK', onPress: () => NavigationHelper.safeGoBack(navigation) },
        ]);
      } else {
        Alert.alert('Error', 'Failed to load playlist details.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Refresh audio URL for expired/missing URLs
  const refreshAudioUrl = async (item) => {
    try {
      logger.info(`🔄 Refreshing audio URL for ${item.title}`);

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const response = await axios.post(
        `${API_BASE_URL}/api/audio/playlists/${playlist.id}/items/${item.id}/refresh-audio`,
        {},
        {
          params: { user_id: user.uid },
          headers: { 'X-User-ID': user.uid },
          timeout: 30000,
        }
      );

      if (response.data?.audio_url) {
        logger.info(`✅ Refreshed audio URL`);

        // Update items with new URL
        const updatedItems = items.map(i =>
          i.id === item.id ? { ...i, audio_url: response.data.audio_url } : i
        );
        setItems(updatedItems);
        updatePlaylistItems(playlist.id, updatedItems, playlist.item_count, playlist.total_duration);

        return response.data.audio_url;
      }

      return null;
    } catch (error) {
      logger.error('❌ Error refreshing URL:', error);
      return null;
    }
  };

  // Play single audio track
  const handlePlayAudio = async (item) => {
    try {
      setIsLoadingAudio(true);

      // Check for missing URL and try to refresh
      let audioUrl = item.audio_url;
      if (!audioUrl) {
        audioUrl = await refreshAudioUrl(item);
        if (!audioUrl) {
          Alert.alert('Audio Not Available', 'Unable to load audio file.');
          setIsLoadingAudio(false);
          return;
        }
      }

      const track: AudioTrack = {
        id: item.id,
        title: item.title,
        audio_url: audioUrl,
        duration: item.duration,
        position: item.position,
      };

      await playTrack(track, true);

      // Track analytics
      const itemIndex = items.findIndex(i => i.id === item.id);
      PlaylistAnalytics.trackTrackPlayed(playlist.id, item.id, {
        title: item.title,
        duration: item.duration,
        playbackSpeed: playbackRate,
        isSequential: false,
        trackPosition: itemIndex,
      });

      setIsLoadingAudio(false);
    } catch (error) {
      logger.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Unable to play this audio file.');
      setIsLoadingAudio(false);
    }
  };

  // Play all tracks sequentially
  const handlePlayAll = async () => {
    if (items.length === 0) {
      Alert.alert('No Audio', 'This playlist has no audio items.');
      return;
    }

    try {
      setIsLoadingAudio(true);

      // Convert items to AudioTrack format
      const tracks: AudioTrack[] = items.map(item => ({
        id: item.id,
        title: item.title,
        audio_url: item.audio_url,
        duration: item.duration,
        position: item.position,
      }));

      await playPlaylist(tracks, 0);

      // Track analytics
      const totalDuration = items.reduce((sum, item) => sum + (item.duration || 0), 0);
      PlaylistAnalytics.trackSequentialPlaybackStarted(playlist.id, {
        trackCount: items.length,
        totalDuration,
        playbackSpeed: playbackRate,
      });

      setIsLoadingAudio(false);
    } catch (error) {
      logger.error('Error starting playlist:', error);
      Alert.alert('Error', 'Failed to start playlist playback.');
      setIsLoadingAudio(false);
    }
  };

  // Stop all playback
  const handleStopAll = async () => {
    await stop();

    PlaylistAnalytics.trackSequentialPlaybackStopped(playlist.id, {
      tracksPlayed: currentIndex + 1,
      tracksTotal: items.length,
      stoppedAtTrack: currentIndex,
    });
  };

  // Change playback speed
  const handleSpeedChange = async (newRate) => {
    PlaylistAnalytics.trackSpeedChanged(playlist.id, playbackRate, newRate, {
      isPlaying: !!currentTrack,
      trackId: currentTrack?.id,
    });

    await setPlayerSpeed(newRate);
    setShowSpeedMenu(false);
  };

  // Available playback speeds
  const playbackSpeeds = [
    { rate: 0.5, label: '0.5x' },
    { rate: 0.75, label: '0.75x' },
    { rate: 1.0, label: '1x' },
    { rate: 1.25, label: '1.25x' },
    { rate: 1.5, label: '1.5x' },
    { rate: 1.75, label: '1.75x' },
    { rate: 2.0, label: '2x' },
  ];

  // Remove item from playlist
  const handleRemoveItem = async (itemId, itemTitle) => {
    Alert.alert(
      'Remove from Playlist',
      `Remove "${itemTitle}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('Error', 'Please log in to remove items.');
                return;
              }

              const removedItem = items.find(i => i.id === itemId);
              const newItems = items.filter(item => item.id !== itemId);
              setItems(newItems);

              const newItemCount = playlist.item_count - 1;
              const newTotalDuration = playlist.total_duration - (removedItem?.duration || 0);

              PlaylistAnalytics.trackItemRemoved(playlist.id, itemId, {
                title: itemTitle,
                remainingItemCount: newItemCount,
              });

              updatePlaylistItems(playlist.id, newItems, newItemCount, newTotalDuration);

              await axios.delete(
                `${API_BASE_URL}/api/audio/playlists/${playlist.id}/items/${itemId}`,
                {
                  params: { user_id: user.uid },
                  headers: { 'X-User-ID': user.uid },
                  timeout: 30000,
                }
              );

              logger.info(`🗑️ Removed item: ${itemTitle}`);
            } catch (error) {
              logger.error('❌ Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item.');
              await loadPlaylistDetails();
            }
          },
        },
      ]
    );
  };

  // Share playlist
  const handleSharePlaylist = async () => {
    try {
      await Share.share({
        message: `Check out my playlist "${playlist.name}" on Alexandria!\n\n${playlist.description || 'A curated collection of audio study materials.'}`,
        title: `Share Playlist: ${playlist.name}`,
      });
    } catch (error) {
      logger.error('❌ Error sharing:', error);
    }
  };

  // Edit playlist
  const handleEditPlaylist = () => {
    setEditModalVisible(true);
  };

  // Submit edits
  const handleSubmitEdit = async (playlistId, name, description, thumbnailColor) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to edit playlists.');
        return;
      }

      const changes = {};
      if (name !== playlist.name) changes.name = name;
      if (description !== playlist.description) changes.description = description;
      if (thumbnailColor !== playlist.thumbnail_color) changes.thumbnail_color = thumbnailColor;

      PlaylistAnalytics.trackPlaylistEdited(playlistId, changes);

      updatePlaylist(playlistId, {
        name,
        description,
        thumbnail_color: thumbnailColor,
      });

      await axios.put(
        `${API_BASE_URL}/api/audio/playlists/${playlistId}`,
        { name, description, thumbnail_color: thumbnailColor },
        {
          params: { user_id: user.uid },
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.uid,
          },
          timeout: 30000,
        }
      );

      logger.info(`✏️ Updated playlist: ${name}`);
      Alert.alert('Success', 'Playlist updated successfully!');
    } catch (error) {
      logger.error('❌ Error updating playlist:', error);
      Alert.alert('Error', 'Failed to update playlist.');
      await loadPlaylistDetails();
      throw error;
    }
  };

  // Delete playlist
  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('Error', 'Please log in.');
                return;
              }

              PlaylistAnalytics.trackPlaylistDeleted(playlist.id, {
                itemCount: playlist.item_count,
                totalDuration: playlist.total_duration,
              });

              await axios.delete(
                `${API_BASE_URL}/api/audio/playlists/${playlist.id}`,
                {
                  params: { user_id: user.uid },
                  headers: { 'X-User-ID': user.uid },
                  timeout: 30000,
                }
              );

              logger.info(`🗑️ Deleted playlist: ${playlist.name}`);
              Alert.alert('Success', 'Playlist deleted.');
              NavigationHelper.safeGoBack(navigation);
            } catch (error) {
              logger.error('❌ Error deleting:', error);
              Alert.alert('Error', 'Failed to delete playlist.');
            }
          },
        },
      ]
    );
  };

  // Render playlist item
  const renderPlaylistItem = ({ item, index }) => {
    const isPlaying = currentTrack?.id === item.id;

    return (
      <Animatable.View animation="fadeInUp" delay={index * 50} duration={400}>
        <PlaylistItem
          id={item.id}
          title={item.title}
          duration={item.duration}
          position={item.position}
          onPlay={() => handlePlayAudio(item)}
          onRemove={() => handleRemoveItem(item.id, item.title)}
          isPlaying={isPlaying}
          isLoading={isLoadingAudio && currentTrack?.id === item.id}
        />
      </Animatable.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyState}>
      <FontAwesome5 name="music" size={64} color={themeColors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Audio Items</Text>
      <Text style={styles.emptyStateText}>
        Add audio files to this playlist to get started.
      </Text>
    </Animatable.View>
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.playlistHeader}>
      {/* Thumbnail */}
      <View style={[styles.thumbnail, { backgroundColor: playlist.thumbnail_color || '#D4AF37' }]}>
        <FontAwesome5 name="music" size={48} color="#FFF" />
      </View>

      {/* Info */}
      <Text style={styles.playlistName}>{playlist.name}</Text>
      {playlist.description && (
        <Text style={styles.playlistDescription}>{playlist.description}</Text>
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <FontAwesome5 name="list" size={14} color={themeColors.alexandriaGold} />
          <Text style={styles.statText}>
            {playlist.item_count} {playlist.item_count === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome5 name="clock" size={14} color={themeColors.alexandriaGold} />
          <Text style={styles.statText}>{formatDuration(playlist.total_duration)}</Text>
        </View>
      </View>

      {/* Playback Controls */}
      {items.length > 0 && (
        <View style={styles.playbackControls}>
          <View style={styles.playbackControlsRow}>
            {!isSequential ? (
              <TouchableOpacity
                style={styles.playAllButton}
                onPress={handlePlayAll}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                  style={styles.playAllButtonGradient}
                >
                  <FontAwesome5 name="play" size={18} color={themeColors.background} />
                  <Text style={styles.playAllButtonText}>Play All</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.playAllButton}
                onPress={handleStopAll}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#E74C3C', '#C0392B']}
                  style={styles.playAllButtonGradient}
                >
                  <FontAwesome5 name="stop" size={18} color="#FFF" />
                  <Text style={[styles.playAllButtonText, { color: '#FFF' }]}>Stop All</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Speed Control */}
            <TouchableOpacity
              style={styles.speedButton}
              onPress={() => setShowSpeedMenu(!showSpeedMenu)}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="tachometer-alt" size={16} color={themeColors.alexandriaGold} />
              <Text style={styles.speedButtonText}>{playbackRate}x</Text>
            </TouchableOpacity>
          </View>

          {/* Speed Menu */}
          {showSpeedMenu && (
            <Animatable.View animation="fadeInDown" duration={300} style={styles.speedMenu}>
              <Text style={styles.speedMenuTitle}>Playback Speed</Text>
              <View style={styles.speedOptions}>
                {playbackSpeeds.map((speed) => (
                  <TouchableOpacity
                    key={speed.rate}
                    style={[
                      styles.speedOption,
                      playbackRate === speed.rate && styles.speedOptionActive,
                    ]}
                    onPress={() => handleSpeedChange(speed.rate)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.speedOptionText,
                        playbackRate === speed.rate && styles.speedOptionTextActive,
                      ]}
                    >
                      {speed.label}
                    </Text>
                    {playbackRate === speed.rate && (
                      <FontAwesome5 name="check" size={14} color={themeColors.alexandriaGold} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animatable.View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEditPlaylist}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="edit" size={16} color={themeColors.alexandriaGold} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSharePlaylist}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="share-alt" size={16} color={themeColors.alexandriaGold} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeletePlaylist}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="trash" size={16} color={themeColors.error} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Items Header */}
      {items.length > 0 && (
        <View style={styles.itemsHeader}>
          <Text style={styles.itemsHeaderText}>Playlist Items</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[themeColors.background, themeColors.backgroundSecondary]}
          style={styles.innerContainer}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.alexandriaGold} />
            <Text style={styles.loadingText}>Loading playlist...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />

      <LinearGradient
        colors={[themeColors.background, themeColors.backgroundSecondary]}
        style={styles.innerContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => NavigationHelper.safeGoBack(navigation)}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="arrow-left" size={20} color={themeColors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={1}>Playlist</Text>
          </View>
        </View>

        {/* Playlist Items */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderPlaylistItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.itemsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPlaylistDetails(true)}
              tintColor={themeColors.alexandriaGold}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />

        {/* Edit Modal */}
        <EditPlaylistModal
          visible={editModalVisible}
          playlist={playlist}
          onClose={() => setEditModalVisible(false)}
          onSubmit={handleSubmitEdit}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8F4E3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#CBD5E0',
    marginTop: 16,
  },
  playlistHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playlistName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8F4E3',
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 16,
    color: '#CBD5E0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
  },
  playbackControls: {
    width: '100%',
    marginBottom: 16,
  },
  playbackControlsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  playAllButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playAllButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  playAllButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2C5B',
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    minWidth: 80,
  },
  speedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
  },
  speedMenu: {
    marginTop: 12,
    backgroundColor: 'rgba(44, 70, 125, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  speedMenuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 12,
    textAlign: 'center',
  },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    minWidth: 70,
  },
  speedOptionActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    borderColor: '#D4AF37',
    borderWidth: 2,
  },
  speedOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E0',
  },
  speedOptionTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  deleteButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  deleteButtonText: {
    color: '#E74C3C',
  },
  itemsHeader: {
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 16,
  },
  itemsHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8F4E3',
  },
  itemsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8F4E3',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#CBD5E0',
    textAlign: 'center',
    lineHeight: 24,
  },
});
