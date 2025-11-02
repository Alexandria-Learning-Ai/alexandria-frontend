/**
 * ProgressivePlaylistScreen
 *
 * Full-screen view for progressive audio playlists with real-time updates.
 * Handles playlist loading, polling, audio playback integration, and error handling.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import ProgressivePlaylistView from '../components/audio/ProgressivePlaylistView';
import MiniPlayer from '../components/audio/MiniPlayer';
import ProgressivePlaylistService from '../services/ProgressivePlaylistService';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { ProgressivePlaylist, AudioTrack } from '../types/progressiveAudio.types';
import Colors from '../constants/Colors';
import logger from '../utils/logger';

type RootStackParamList = {
  ProgressivePlaylist: {
    materialId: string;
    materialTitle?: string;
  };
};

type ProgressivePlaylistScreenRouteProp = RouteProp<RootStackParamList, 'ProgressivePlaylist'>;
type ProgressivePlaylistScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProgressivePlaylist'>;

export default function ProgressivePlaylistScreen() {
  const navigation = useNavigation<ProgressivePlaylistScreenNavigationProp>();
  const route = useRoute<ProgressivePlaylistScreenRouteProp>();
  const { materialId, materialTitle } = route.params;

  // State
  const [playlist, setPlaylist] = useState<ProgressivePlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mounted ref for cleanup
  const isMountedRef = useRef(true);

  // Audio player integration
  const {
    currentTrack,
    isPlaying,
    playPlaylist,
    playTrack,
  } = useAudioPlayer();

  /**
   * Load playlist on mount
   */
  useEffect(() => {
    loadPlaylist();

    return () => {
      isMountedRef.current = false;
    };
  }, [materialId]);

  /**
   * Load playlist from API (or create if doesn't exist)
   */
  const loadPlaylist = async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.info(`📋 Loading progressive playlist for material: ${materialId}`);

      // Try to get existing playlist
      let playlistData = await ProgressivePlaylistService.getPlaylistStatus(materialId);

      if (!isMountedRef.current) return;

      // If playlist doesn't exist, create it
      if (!playlistData) {
        logger.info(`🎵 Playlist not found, creating new progressive playlist for material: ${materialId}`);

        playlistData = await ProgressivePlaylistService.startChunkedGeneration(materialId, {
          voice: 'default',
          speed: 1.0,
          language: 'en',
        });

        if (!isMountedRef.current) return;
      }

      setPlaylist(playlistData);
      // Note: ProgressivePlaylistView handles polling
    } catch (err) {
      logger.error('❌ Error loading/creating playlist:', err);
      if (!isMountedRef.current) return;

      setError('Failed to load playlist. Please try again.');
      Alert.alert(
        'Error',
        'Failed to load audio playlist. Would you like to retry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: loadPlaylist },
        ]
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Handle playlist updates from child component
   */
  const handlePlaylistUpdate = useCallback((updatedPlaylist: ProgressivePlaylist) => {
    if (!isMountedRef.current) return;
    setPlaylist(updatedPlaylist);
  }, []);

  /**
   * Handle track selection - play in context of playlist
   */
  const handleTrackPlay = useCallback(async (track: AudioTrack) => {
    if (!playlist) return;

    try {
      logger.info(`🎵 Playing track: ${track.title}`);

      // Get all complete tracks
      const completeTracks = playlist.tracks.filter(t => t.status === 'complete');

      if (completeTracks.length === 0) {
        Alert.alert('Not Ready', 'No tracks are ready to play yet. Please wait a moment.');
        return;
      }

      // Find the index of selected track in complete tracks
      const startIndex = completeTracks.findIndex(t => t.id === track.id);

      if (startIndex === -1) {
        Alert.alert('Not Ready', 'This track is not ready yet. Please wait for it to complete.');
        return;
      }

      // Convert to AudioPlayerService format - filter out invalid URLs
      const audioTracks = completeTracks
        .filter(t => t.audio_url && t.audio_url.trim() !== '')
        .map(t => ({
          id: t.id,
          title: t.title,
          audio_url: t.audio_url as string,
          duration: t.duration || 0,
        }));

      // Validate we have valid tracks
      if (audioTracks.length === 0) {
        Alert.alert('Playback Error', 'No valid audio tracks found. Please try refreshing the playlist.');
        logger.error('No valid audio URLs found in complete tracks');
        return;
      }

      // Recalculate start index after filtering
      const filteredStartIndex = audioTracks.findIndex(t => t.id === track.id);
      if (filteredStartIndex === -1) {
        Alert.alert('Playback Error', 'The selected track has an invalid audio URL.');
        return;
      }

      // Play playlist starting from selected track
      await playPlaylist(audioTracks, filteredStartIndex);

      logger.info(`✅ Started playlist playback from track ${startIndex + 1}`);
    } catch (err) {
      logger.error('❌ Error starting playback:', err);
      Alert.alert('Playback Error', 'Failed to start audio playback. Please try again.');
    }
  }, [playlist, playPlaylist]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    await loadPlaylist();
  }, [materialId]);

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
        <LinearGradient colors={['#1A2C5B', '#2C467D']} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Audio Playlist</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Loading */}
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Loading playlist...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  /**
   * Render error state
   */
  if (error || !playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
        <LinearGradient colors={['#1A2C5B', '#2C467D']} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Audio Playlist</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Error */}
          <View style={styles.centerContent}>
            <FontAwesome5 name="exclamation-circle" size={64} color="#dc3545" />
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorMessage}>{error || 'Failed to load playlist'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPlaylist}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  /**
   * Render playlist
   */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
      <LinearGradient colors={['#1A2C5B', '#2C467D']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {materialTitle || playlist.title}
            </Text>
            <Text style={styles.headerSubtitle}>Progressive Audio Playlist</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleRefresh}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome5 name="sync" size={18} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist Content */}
        <View style={styles.content}>
          <ProgressivePlaylistView
            materialId={materialId}
            playlist={playlist}
            onTrackPlay={handleTrackPlay}
            onRefresh={handleRefresh}
            currentlyPlayingTrackId={currentTrack?.id || null}
          />
        </View>

        {/* Mini Player */}
        {currentTrack && (
          <MiniPlayer
            onPress={() => {
              // TODO: Navigate to full player screen when implemented
              logger.info('Mini player tapped - full player not yet implemented');
            }}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C5B',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 244, 227, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8F4E3',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#CBD5E0',
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#CBD5E0',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8F4E3',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#CBD5E0',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C5B',
  },
});
