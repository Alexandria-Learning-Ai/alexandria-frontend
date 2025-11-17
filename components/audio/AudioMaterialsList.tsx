/**
 * AudioMaterialsList - Displays audio materials with generation status
 *
 * Features:
 * - Displays materials with audio generation status
 * - Card layout with thumbnail, title, duration, and status badges
 * - Quick actions: Play, Add to Playlist, Retry
 * - Loading skeleton for UX
 * - Empty state with helpful message
 * - Error handling with retry functionality
 *
 * Usage:
 * <AudioMaterialsList />
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { auth } from '../../firebaseConfig';
import { API_BASE_URL } from '../../config/api';
import axios from 'axios';
import logger from '../../utils/logger';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

interface AudioMaterial {
  id: string;
  title: string;
  thumbnail_url?: string;
  duration?: number;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  audio_url?: string;
  created_at: string;
}

const AudioMaterialsList: React.FC = () => {
  const [materials, setMaterials] = useState<AudioMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer();

  // Theme colors (Alexandria theme)
  const themeColors = useMemo(() => ({
    background: '#1A2C5B',
    alexandriaGold: '#D4AF37',
    alexandriaBronze: '#B8941F',
    text: '#F8F4E3',
    textSecondary: '#CBD5E0',
    success: '#28a745',
    error: '#dc3545',
    warning: '#FFD700',
    cardBackground: 'rgba(248, 244, 227, 0.08)',
    borderColor: 'rgba(212, 175, 55, 0.2)',
  }), []);

  useEffect(() => {
    loadAudioMaterials();
  }, []);

  const loadAudioMaterials = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // TODO: Replace with actual API endpoint when backend is ready
      // For now, use mock data
      logger.info('Loading audio materials (mock data)');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockMaterials: AudioMaterial[] = [
        {
          id: '1',
          title: 'Introduction to Machine Learning',
          duration: 1820, // seconds
          status: 'completed',
          audio_url: 'https://example.com/audio1.mp3',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Advanced React Patterns',
          duration: 0,
          status: 'processing',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Database Design Principles',
          duration: 2400,
          status: 'completed',
          audio_url: 'https://example.com/audio3.mp3',
          created_at: new Date().toISOString(),
        },
      ];

      setMaterials(mockMaterials);
      setLoading(false);

      /* Real API call (implement when backend is ready):
      const response = await axios.get(
        `${API_BASE_URL}/api/audio/materials`,
        {
          params: { user_id: user.uid },
          headers: { 'X-User-ID': user.uid },
          timeout: 10000,
        }
      );
      setMaterials(response.data.materials || []);
      setLoading(false);
      */
    } catch (err) {
      logger.error('Error loading audio materials:', err);
      setError('Failed to load audio materials');
      setLoading(false);
    }
  };

  const handlePlay = async (material: AudioMaterial) => {
    if (material.status !== 'completed' || !material.audio_url) {
      Alert.alert('Not Available', 'Audio is not ready for playback yet.');
      return;
    }

    try {
      await audioPlayer.playTrack({
        id: material.id,
        title: material.title,
        audio_url: material.audio_url,
        duration: material.duration || 0,
      });
      logger.info(`Playing audio: ${material.title}`);
    } catch (error) {
      logger.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Failed to play audio. Please try again.');
    }
  };

  const handleAddToPlaylist = (material: AudioMaterial) => {
    if (material.status !== 'completed') {
      Alert.alert('Not Available', 'Audio must be completed before adding to playlist.');
      return;
    }

    // TODO: Implement add to playlist functionality
    logger.info(`Add to playlist: ${material.title}`);
    Alert.alert('Coming Soon', 'Add to playlist functionality will be available soon.');
  };

  const handleRetry = async (material: AudioMaterial) => {
    // TODO: Implement retry functionality
    logger.info(`Retry audio generation: ${material.title}`);
    Alert.alert('Retry', 'Audio generation retry will be implemented soon.');
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Ready',
          color: themeColors.success,
          icon: 'check-circle',
        };
      case 'processing':
        return {
          label: 'Processing',
          color: themeColors.warning,
          icon: 'sync',
        };
      case 'failed':
        return {
          label: 'Failed',
          color: themeColors.error,
          icon: 'exclamation-circle',
        };
      default:
        return {
          label: 'Pending',
          color: themeColors.textSecondary,
          icon: 'clock',
        };
    }
  };

  const renderMaterialCard = ({ item, index }: { item: AudioMaterial; index: number }) => {
    const statusBadge = getStatusBadge(item.status);

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        duration={600}
        style={[styles.materialCard, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.borderColor }]}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnail}>
          {item.thumbnail_url ? (
            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: themeColors.alexandriaBronze }]}>
              <FontAwesome5 name="file-audio" size={32} color={themeColors.text} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Title */}
          <Text
            style={[styles.cardTitle, { color: themeColors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>

          {/* Status & Duration */}
          <View style={styles.cardMeta}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusBadge.color}20` }]}>
              <FontAwesome5
                name={statusBadge.icon}
                size={10}
                color={statusBadge.color}
              />
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>

            {item.duration && item.duration > 0 && (
              <Text style={[styles.durationText, { color: themeColors.textSecondary }]}>
                {formatDuration(item.duration)}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            {item.status === 'completed' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.playButton, { backgroundColor: themeColors.alexandriaGold }]}
                  onPress={() => handlePlay(item)}
                >
                  <FontAwesome5 name="play" size={12} color={themeColors.background} />
                  <Text style={[styles.actionButtonText, { color: themeColors.background }]}>
                    Play
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.addButton, { borderColor: themeColors.alexandriaGold }]}
                  onPress={() => handleAddToPlaylist(item)}
                >
                  <FontAwesome5 name="plus" size={12} color={themeColors.alexandriaGold} />
                  <Text style={[styles.actionButtonText, { color: themeColors.alexandriaGold }]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {item.status === 'processing' && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color={themeColors.warning} />
                <Text style={[styles.processingText, { color: themeColors.textSecondary }]}>
                  Generating audio...
                </Text>
              </View>
            )}

            {item.status === 'failed' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton, { borderColor: themeColors.error }]}
                onPress={() => handleRetry(item)}
              >
                <FontAwesome5 name="redo" size={12} color={themeColors.error} />
                <Text style={[styles.actionButtonText, { color: themeColors.error }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animatable.View>
    );
  };

  const renderEmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyState}>
      <FontAwesome5 name="file-audio" size={64} color={themeColors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
        No Audio Materials Yet
      </Text>
      <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
        Upload a document to generate audio narration and start learning on the go.
      </Text>
    </Animatable.View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={themeColors.alexandriaGold} />
      <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
        Loading audio materials...
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <FontAwesome5 name="exclamation-triangle" size={48} color={themeColors.error} />
      <Text style={[styles.errorTitle, { color: themeColors.text }]}>
        Failed to Load Materials
      </Text>
      <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
        {error || 'An unexpected error occurred'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { borderColor: themeColors.alexandriaGold }]}
        onPress={loadAudioMaterials}
      >
        <FontAwesome5 name="redo" size={14} color={themeColors.alexandriaGold} />
        <Text style={[styles.retryButtonText, { color: themeColors.alexandriaGold }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  return (
    <FlatList
      data={materials}
      keyExtractor={(item) => item.id}
      renderItem={renderMaterialCard}
      horizontal
      showsHorizontalScrollIndicator={false}
      ListEmptyComponent={renderEmptyState}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingRight: 20,
  },
  materialCard: {
    width: 280,
    marginRight: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: 150,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  playButton: {
    // Gold background
  },
  addButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  retryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  processingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AudioMaterialsList;
