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
import * as DocumentPicker from 'expo-document-picker';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';
import axios from 'axios';
import PlaylistCard from '../components/playlist/PlaylistCard';
import CreatePlaylistModal from '../components/playlist/CreatePlaylistModal';
import { usePlaylistStore } from '../stores/playlistStore';
import MiniAudioPlayer from '../components/audio/MiniAudioPlayer';
import AudioMaterialsList from '../components/audio/AudioMaterialsList';

export default function AudioPlaylistsScreen({ navigation }) {
  // Global playlist store
  const { playlists, loading, fetchPlaylists, addPlaylist, deletePlaylist } = usePlaylistStore();

  // Local UI state only
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [uploadingForAudio, setUploadingForAudio] = useState(false);

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
        `${API_BASE_URL}/api/audio/playlists/`,
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
              await axios.delete(`${API_BASE_URL}/api/audio/playlists/${playlistId}`, {
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

  // Upload material for audio playlist
  const handleUploadForAudio = async () => {
    try {
      setUploadingForAudio(true);
      logger.info('📤 Starting audio-focused upload flow');

      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'cancel' || result.canceled) {
        logger.info('Upload cancelled by user');
        setUploadingForAudio(false);
        return;
      }

      const file = result.assets ? result.assets[0] : result;
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'Please log in to upload materials.');
        setUploadingForAudio(false);
        return;
      }

      logger.info(`📄 Selected file: ${file.name} (${file.size} bytes)`);

      // Upload directly for audio generation (bypasses Materials Library)
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name,
      });
      formData.append('user_id', user.uid);
      formData.append('voice', 'default');
      formData.append('speed', '1.0');
      formData.append('language', 'en');

      logger.info('🎵 Uploading for audio-only generation...');

      const response = await axios.post(
        `${API_BASE_URL}/api/audio/upload-and-generate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-User-ID': user.uid,
          },
          timeout: 120000, // 2 minutes for upload and processing
        }
      );

      if (!response.data || !response.data.material_id || !response.data.playlist) {
        throw new Error('Failed to generate audio playlist');
      }

      const materialId = response.data.material_id;
      const playlist = response.data.playlist;
      const materialTitle = playlist.title || file.name;

      logger.info(`✅ Audio playlist created: ${playlist.chunked_playlist_id}`);

      setUploadingForAudio(false);

      // Navigate to Progressive Playlist Screen with existing playlist data
      navigation.navigate('ProgressivePlaylist', {
        materialId,
        materialTitle,
        initialPlaylist: playlist, // Pass the playlist data directly
      });

      Alert.alert(
        'Upload Successful!',
        `"${materialTitle}" audio generation started!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error('❌ Error uploading for audio:', error);
      setUploadingForAudio(false);

      let errorMessage = 'Failed to upload document. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
      }

      Alert.alert('Upload Error', errorMessage);
    }
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
        {/* Header - Audio Studio */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => NavigationHelper.safeGoBack(navigation)}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="arrow-left" size={20} color={themeColors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.title}>Audio Studio</Text>
            <Text style={styles.subtitle}>
              Your audio learning hub
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.uploadButton]}
            onPress={handleUploadForAudio}
            activeOpacity={0.8}
            disabled={uploadingForAudio}
          >
            {uploadingForAudio ? (
              <ActivityIndicator size="small" color={themeColors.alexandriaGold} />
            ) : (
              <>
                <FontAwesome5 name="upload" size={16} color={themeColors.alexandriaGold} />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content - 3 Sections */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPlaylists(true)}
              tintColor={themeColors.alexandriaGold}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* SECTION 1: My Audio Materials (Placeholder) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5 name="file-audio" size={18} color={themeColors.alexandriaGold} />
                <Text style={styles.sectionTitle}>My Audio Materials</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => {
                  logger.info('Navigate to Audio Materials');
                }}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <FontAwesome5 name="chevron-right" size={12} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Audio Materials List */}
            <AudioMaterialsList />
          </View>

          {/* SECTION 2: My Playlists */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5 name="list-music" size={18} color={themeColors.alexandriaGold} />
                <Text style={styles.sectionTitle}>My Playlists</Text>
              </View>
              <TouchableOpacity
                style={styles.createPlaylistButton}
                onPress={() => setCreateModalVisible(true)}
              >
                <FontAwesome5 name="plus-circle" size={14} color={themeColors.alexandriaGold} />
                <Text style={styles.createPlaylistText}>Create</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar for Playlists */}
            <View style={styles.searchContainer}>
              <FontAwesome5 name="search" size={14} color={themeColors.textSecondary} style={styles.searchIcon} />
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
                  <FontAwesome5 name="times" size={12} color={themeColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Playlists List */}
            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={themeColors.alexandriaGold} />
                <Text style={styles.loadingText}>Loading playlists...</Text>
              </View>
            ) : filteredPlaylists.length === 0 ? (
              renderEmptyState()
            ) : (
              filteredPlaylists.map((item, index) => (
                <Animatable.View
                  key={item.id}
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
              ))
            )}
          </View>

          {/* Bottom padding for mini player */}
          <View style={styles.miniPlayerSpacer} />
        </ScrollView>

        {/* Create Playlist Modal */}
        <CreatePlaylistModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onSubmit={handleCreatePlaylist}
        />

        {/* Mini Audio Player (sticky footer) */}
        <MiniAudioPlayer />
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
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  scrollContent: {
    paddingBottom: 100, // Space for mini player
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8F4E3',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E0',
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  createPlaylistText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  placeholderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#CBD5E0',
    marginTop: 12,
  },
  miniPlayerSpacer: {
    height: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  loadingState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#CBD5E0',
    marginTop: 12,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8F4E3',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#CBD5E0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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
