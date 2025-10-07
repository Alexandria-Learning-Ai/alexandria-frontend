import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
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
import PlaylistCard from '../components/playlist/PlaylistCard';
import CreatePlaylistModal from '../components/playlist/CreatePlaylistModal';
import { usePlaylistStore } from '../stores/playlistStore';

export default function AudioPlaylistsScreen({ navigation }) {
  // Global playlist store
  const { playlists, loading, fetchPlaylists, addPlaylist, deletePlaylist } = usePlaylistStore();

  // Local UI state only
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);

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

  // Load playlists on screen focus
  useFocusEffect(
    useCallback(() => {
      loadPlaylists();
    }, [])
  );

  // Load playlists from global store
  const loadPlaylists = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    }

    await fetchPlaylists();

    if (refresh) {
      setRefreshing(false);
    }
  };

  // Create new playlist with optimistic update
  const handleCreatePlaylist = async (name, description, thumbnailColor) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to create playlists.');
        return;
      }

      // Make API call
      const response = await axios.post(
        `${API_BASE_URL}/audio/playlists/`,
        {
          name,
          description,
          thumbnail_color: thumbnailColor,
        },
        {
          params: {
            user_id: user.uid,
          },
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.uid,
          },
          timeout: 30000,
        }
      );

      if (response.data) {
        logger.info('✅ Created playlist:', response.data.name);
        // Optimistic update - add to global store immediately
        addPlaylist(response.data);
        Alert.alert('Success', `Playlist "${name}" created successfully!`);
      }
    } catch (error) {
      logger.error('❌ Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
      throw error; // Re-throw so modal can handle it
    }
  };

  // Delete playlist with optimistic update
  const handleDeletePlaylist = async (playlistId, playlistName) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlistName}"? This will remove all items from the playlist.`,
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

              // Optimistic update - remove from store immediately
              deletePlaylist(playlistId);

              // Make API call
              await axios.delete(`${API_BASE_URL}/audio/playlists/${playlistId}`, {
                params: {
                  user_id: user.uid,
                },
                headers: {
                  'X-User-ID': user.uid,
                },
                timeout: 30000,
              });

              logger.info(`🗑️ Deleted playlist: ${playlistName}`);
              Alert.alert('Success', 'Playlist deleted successfully.');
            } catch (error) {
              logger.error('❌ Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist. Please try again.');
              // Re-fetch to restore state on error
              await fetchPlaylists();
            }
          },
        },
      ]
    );
  };

  // Filter playlists by search query
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate to playlist details
  const handlePlaylistPress = (playlist) => {
    navigation.navigate('PlaylistDetails', { playlist });
  };

  // Show options menu for playlist
  const handlePlaylistLongPress = (playlist) => {
    Alert.alert(
      playlist.name,
      'Choose an action',
      [
        {
          text: 'View',
          onPress: () => handlePlaylistPress(playlist),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeletePlaylist(playlist.id, playlist.name),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Render playlist card
  const renderPlaylistCard = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={600}
    >
      <PlaylistCard
        id={item.id}
        name={item.name}
        description={item.description}
        itemCount={item.item_count}
        totalDuration={item.total_duration}
        thumbnailColor={item.thumbnail_color}
        onPress={() => handlePlaylistPress(item)}
        onLongPress={() => handlePlaylistLongPress(item)}
      />
    </Animatable.View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={themeColors.alexandriaGold} />
          <Text style={styles.loadingText}>Loading your playlists...</Text>
        </View>
      );
    }

    const hasSearch = searchQuery.trim();

    return (
      <Animatable.View animation="fadeIn" style={styles.emptyState}>
        <FontAwesome5
          name={hasSearch ? "search" : "music"}
          size={64}
          color={themeColors.textSecondary}
        />
        <Text style={styles.emptyStateTitle}>
          {hasSearch ? 'No Playlists Found' : 'Start Your Audio Library'}
        </Text>
        <Text style={styles.emptyStateText}>
          {hasSearch
            ? 'Try adjusting your search to find playlists.'
            : 'Create playlists to organize your audio study materials.'
          }
        </Text>
        {!hasSearch && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <LinearGradient
              colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
              style={styles.createButtonGradient}
            >
              <FontAwesome5 name="plus" size={16} color={themeColors.background} />
              <Text style={styles.createButtonText}>Create Playlist</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animatable.View>
    );
  };

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
            <Text style={styles.title}>Audio Playlists</Text>
            <Text style={styles.subtitle}>
              {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="plus" size={20} color={themeColors.alexandriaGold} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={16} color={themeColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search playlists..."
            placeholderTextColor={themeColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
            >
              <FontAwesome5 name="times" size={14} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Playlists List */}
        <FlatList
          data={filteredPlaylists}
          keyExtractor={(item) => item.id}
          renderItem={renderPlaylistCard}
          contentContainerStyle={styles.playlistsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPlaylists(true)}
              tintColor={themeColors.alexandriaGold}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />

        {/* Create Playlist Modal */}
        <CreatePlaylistModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onSubmit={handleCreatePlaylist}
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
    fontSize: 28,
    fontWeight: '800',
    color: '#F8F4E3',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#CBD5E0',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F8F4E3',
  },
  clearSearchButton: {
    padding: 4,
  },
  playlistsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#CBD5E0',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
    marginBottom: 32,
  },
  createButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C5B',
  },
});
