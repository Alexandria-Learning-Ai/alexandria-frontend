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
import { Audio } from 'expo-av';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';
import axios from 'axios';
import PlaylistItem from '../components/playlist/PlaylistItem';
import { usePlaylistStore, selectPlaylistById } from '../stores/playlistStore';
import { getAudioCachePath, isAudioCached } from '../utils/audioCacheUtils';

export default function PlaylistDetailsScreen({ navigation, route }) {
  const { playlist: initialPlaylist } = route.params;

  // Global playlist store
  const { playlists, fetchPlaylists, updatePlaylistItems } = usePlaylistStore();

  // Get current playlist from store (with fallback to initial)
  const storePlaylist = selectPlaylistById({ playlists }, initialPlaylist.id);
  const playlist = storePlaylist || initialPlaylist;

  // Local UI state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState(null);
  const [currentPlayingItem, setCurrentPlayingItem] = useState(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

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
    }, [playlist.id])
  );

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (sound) {
        logger.info('Cleaning up audio on unmount');
        sound.unloadAsync().catch(err => logger.error('Error unloading sound:', err));
      }
    };
  }, [sound]);

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

      // Get playlist details with items
      const response = await axios.get(
        `${API_BASE_URL}/api/audio/playlists/${playlist.id}`,
        {
          params: {
            user_id: user.uid,
          },
          headers: {
            'X-User-ID': user.uid,
          },
          timeout: 30000,
        }
      );

      if (response.data) {
        // Update global store with playlist items
        updatePlaylistItems(
          playlist.id,
          response.data.items || [],
          response.data.item_count,
          response.data.total_duration
        );

        // Update local items state
        setItems(response.data.items || []);
        logger.info(`🎵 Loaded playlist details: ${response.data.name} with ${response.data.items?.length || 0} items`);
      }
    } catch (error) {
      logger.error('❌ Error loading playlist details:', error);

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

  // Format duration from seconds to readable format
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Play audio from local cache only
  const handlePlayAudio = async (item) => {
    try {
      setIsLoadingAudio(true);
      logger.info('Playing audio:', item.title);

      // Stop current audio if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // If clicking the same item, just stop
      if (currentPlayingItem?.id === item.id) {
        setCurrentPlayingItem(null);
        setIsLoadingAudio(false);
        return;
      }

      // Check if audio is cached locally
      const isCached = await isAudioCached(item.material_id, item.audio_id);

      if (!isCached) {
        // Audio not cached - show error
        Alert.alert(
          'Audio Not Available',
          'This audio file is not available. Please regenerate it from the study materials screen.',
          [{ text: 'OK' }]
        );
        setIsLoadingAudio(false);
        return;
      }

      // Get cached audio path
      const cachedAudioUri = getAudioCachePath(item.material_id, item.audio_id);
      logger.info(`Playing cached audio: ${cachedAudioUri}`);

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load and play the sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: cachedAudioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentPlayingItem(item);
      setIsLoadingAudio(false);

    } catch (error) {
      logger.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Unable to play this audio file.');
      setIsLoadingAudio(false);
      setCurrentPlayingItem(null);
    }
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      logger.info('Audio playback finished');
      setCurrentPlayingItem(null);
      if (sound) {
        sound.unloadAsync().catch(err => logger.error('Error unloading sound:', err));
        setSound(null);
      }
    }
  };

  // Remove item from playlist with optimistic update
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

              // Get item duration before removing
              const removedItem = items.find(i => i.id === itemId);
              const removedDuration = removedItem?.duration || 0;

              // Optimistic update - remove from local state immediately
              const newItems = items.filter(item => item.id !== itemId);
              setItems(newItems);

              // Calculate new counts
              const newItemCount = playlist.item_count - 1;
              const newTotalDuration = playlist.total_duration - removedDuration;

              // Update global store
              updatePlaylistItems(playlist.id, newItems, newItemCount, newTotalDuration);

              // Make API call
              await axios.delete(
                `${API_BASE_URL}/api/audio/playlists/${playlist.id}/items/${itemId}`,
                {
                  params: {
                    user_id: user.uid,
                  },
                  headers: {
                    'X-User-ID': user.uid,
                  },
                  timeout: 30000,
                }
              );

              logger.info(`🗑️ Removed item from playlist: ${itemTitle}`);
            } catch (error) {
              logger.error('❌ Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item. Please try again.');
              // Re-fetch to restore state on error
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
      logger.error('❌ Error sharing playlist:', error);
    }
  };

  // Edit playlist
  const handleEditPlaylist = () => {
    Alert.alert('Edit Playlist', 'Edit playlist feature coming soon!');
    // TODO: Implement edit modal
  };

  // Delete playlist
  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"? This will remove all items from the playlist.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('Error', 'Please log in to delete playlists.');
                return;
              }

              await axios.delete(
                `${API_BASE_URL}/api/audio/playlists/${playlist.id}`,
                {
                  params: {
                    user_id: user.uid,
                  },
                  headers: {
                    'X-User-ID': user.uid,
                  },
                  timeout: 30000,
                }
              );

              logger.info(`🗑️ Deleted playlist: ${playlist.name}`);
              Alert.alert('Success', 'Playlist deleted successfully.');
              NavigationHelper.safeGoBack(navigation);
            } catch (error) {
              logger.error('❌ Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Render playlist item
  const renderPlaylistItem = ({ item, index }) => {
    const isPlaying = currentPlayingItem?.id === item.id;
    const isLoading = isLoadingAudio && currentPlayingItem?.id === item.id;

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 50}
        duration={400}
      >
        <PlaylistItem
          id={item.id}
          title={item.title}
          duration={item.duration}
          position={item.position}
          onPlay={() => handlePlayAudio(item)}
          onRemove={() => handleRemoveItem(item.id, item.title)}
          isPlaying={isPlaying}
          isLoading={isLoading}
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
          <Text style={styles.statText}>
            {formatDuration(playlist.total_duration)}
          </Text>
        </View>
      </View>

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
