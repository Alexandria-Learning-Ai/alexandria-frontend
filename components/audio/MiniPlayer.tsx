/**
 * MiniPlayer Component
 *
 * Compact audio player that appears at the bottom of screens when audio is playing.
 * Provides quick controls for play/pause, skip, and shows current track info.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

interface MiniPlayerProps {
  onPress?: () => void;
}

export default function MiniPlayer({ onPress }: MiniPlayerProps) {
  const {
    isPlaying,
    currentTrack,
    isSequential,
    playbackRate,
    positionMillis,
    durationMillis,
    togglePlayPause,
    playNext,
    playPrevious,
    formatTime,
  } = useAudioPlayer();

  // Don't show if no track is playing
  if (!currentTrack) return null;

  const progress = durationMillis > 0 ? positionMillis / durationMillis : 0;

  return (
    <Animatable.View
      animation="slideInUp"
      duration={300}
      style={styles.container}
    >
      <LinearGradient
        colors={['#2C467D', '#1A2C5B']}
        style={styles.gradient}
      >
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>

        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          activeOpacity={0.8}
        >
          {/* Track Info */}
          <View style={styles.trackInfo}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="music" size={16} color="#D4AF37" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.trackMeta}>
                  {formatTime(positionMillis)} / {formatTime(durationMillis)}
                </Text>
                {playbackRate !== 1.0 && (
                  <>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.trackMeta}>{playbackRate}x</Text>
                  </>
                )}
                {isSequential && (
                  <>
                    <Text style={styles.dot}>•</Text>
                    <FontAwesome5 name="list" size={10} color="#CBD5E0" />
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {isSequential && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={(e) => {
                  e.stopPropagation();
                  playPrevious();
                }}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="step-backward" size={18} color="#F8F4E3" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              activeOpacity={0.7}
            >
              <FontAwesome5
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#1A2C5B"
              />
            </TouchableOpacity>

            {isSequential && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={(e) => {
                  e.stopPropagation();
                  playNext();
                }}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="step-forward" size={18} color="#F8F4E3" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
  gradient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(248, 244, 227, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D4AF37',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackMeta: {
    fontSize: 12,
    color: '#CBD5E0',
  },
  dot: {
    fontSize: 12,
    color: '#CBD5E0',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});
