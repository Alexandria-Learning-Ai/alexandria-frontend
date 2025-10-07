/**
 * PlaylistItem Component
 * Displays an audio item within a playlist
 *
 * Features:
 * - Shows audio title and duration
 * - Play button for audio playback
 * - Remove button for deletion
 * - Drag handle for reordering
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface PlaylistItemProps {
  id: string;
  title: string;
  duration: number;
  position: number;
  onPlay: () => void;
  onRemove: () => void;
  isDragging?: boolean;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  id,
  title,
  duration,
  position,
  onPlay,
  onRemove,
  isDragging = false,
}) => {
  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, isDragging && styles.dragging]}>
      {/* Position Number */}
      <View style={styles.positionContainer}>
        <Text style={styles.positionText}>{position + 1}</Text>
      </View>

      {/* Item Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={onPlay}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="play" size={14} color="#D4AF37" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="trash" size={14} color="#E74C3C" />
        </TouchableOpacity>

        {/* Drag Handle */}
        <View style={styles.dragHandle}>
          <FontAwesome5 name="grip-lines" size={14} color="#CBD5E0" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    gap: 12,
  },
  dragging: {
    opacity: 0.7,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    borderColor: '#D4AF37',
    elevation: 8,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  positionContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4AF37',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8F4E3',
    lineHeight: 18,
  },
  duration: {
    fontSize: 12,
    color: '#CBD5E0',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  dragHandle: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlaylistItem;
