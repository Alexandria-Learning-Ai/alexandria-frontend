/**
 * MiniAudioPlayer - Sticky footer audio player
 *
 * Features:
 * - Displays current track information
 * - Play/pause controls
 * - Progress bar
 * - Next/previous buttons (when in playlist mode)
 * - Tap to navigate to full playlist view
 * - Slide up animation on mount
 * - Connects to AudioPlayerService
 *
 * Usage:
 * <MiniAudioPlayer navigation={navigation} />
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useNavigation } from '@react-navigation/native';
import logger from '../../utils/logger';

const { width } = Dimensions.get('window');

interface MiniAudioPlayerProps {
  onPress?: () => void;
}

const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({ onPress }) => {
  const navigation = useNavigation();
  const audioPlayer = useAudioPlayer();

  // Theme colors (Alexandria theme)
  const themeColors = useMemo(() => ({
    background: 'rgba(26, 44, 91, 0.95)',
    alexandriaGold: '#D4AF37',
    text: '#F8F4E3',
    textSecondary: '#CBD5E0',
    progressBackground: 'rgba(248, 244, 227, 0.2)',
    progressFill: '#D4AF37',
  }), []);

  // Don't render if no track is loaded
  if (!audioPlayer.currentTrack) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default: Navigate to PlaylistDetails if available
      logger.info('MiniAudioPlayer pressed - navigate to playlist details');
      // Note: Navigation logic can be customized based on your app structure
    }
  };

  const handlePlayPause = async () => {
    try {
      await audioPlayer.togglePlayPause();
    } catch (error) {
      logger.error('Error toggling play/pause:', error);
    }
  };

  const handlePrevious = async () => {
    try {
      await audioPlayer.playPrevious();
    } catch (error) {
      logger.error('Error playing previous track:', error);
    }
  };

  const handleNext = async () => {
    try {
      await audioPlayer.playNext();
    } catch (error) {
      logger.error('Error playing next track:', error);
    }
  };

  const progress = audioPlayer.durationMillis > 0
    ? (audioPlayer.positionMillis / audioPlayer.durationMillis) * 100
    : 0;

  return (
    <Animatable.View
      animation="slideInUp"
      duration={400}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: themeColors.progressBackground }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: themeColors.progressFill,
            },
          ]}
        />
      </View>

      {/* Main Content */}
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Track Info */}
        <View style={styles.trackInfo}>
          <FontAwesome5
            name="music"
            size={14}
            color={themeColors.alexandriaGold}
            style={styles.musicIcon}
          />
          <View style={styles.trackTextContainer}>
            <Text
              style={[styles.trackTitle, { color: themeColors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {audioPlayer.currentTrack.title}
            </Text>
            <Text style={[styles.trackTime, { color: themeColors.textSecondary }]}>
              {audioPlayer.formatTime(audioPlayer.positionMillis)} / {audioPlayer.formatTime(audioPlayer.durationMillis)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Previous Button (only show if in playlist mode) */}
          {audioPlayer.isSequential && audioPlayer.currentIndex > 0 && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePrevious}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome5
                name="step-backward"
                size={18}
                color={themeColors.text}
              />
            </TouchableOpacity>
          )}

          {/* Play/Pause Button */}
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: themeColors.alexandriaGold }]}
            onPress={handlePlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome5
              name={audioPlayer.isPlaying ? 'pause' : 'play'}
              size={16}
              color="#1A2C5B"
            />
          </TouchableOpacity>

          {/* Next Button (only show if in playlist mode) */}
          {audioPlayer.isSequential && audioPlayer.currentIndex < audioPlayer.playlist.length - 1 && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleNext}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome5
                name="step-forward"
                size={18}
                color={themeColors.text}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  musicIcon: {
    marginRight: 12,
  },
  trackTextContainer: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackTime: {
    fontSize: 12,
    fontWeight: '400',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default MiniAudioPlayer;
