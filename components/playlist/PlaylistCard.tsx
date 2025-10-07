/**
 * PlaylistCard Component
 * Displays a playlist with thumbnail, name, item count, and duration
 *
 * Features:
 * - Color-coded thumbnail
 * - Shows playlist name, item count, total duration
 * - Long-press for context menu (edit/delete)
 * - Alexandria theme styling
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface PlaylistCardProps {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  totalDuration: number;
  thumbnailColor: string;
  onPress: () => void;
  onLongPress?: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  id,
  name,
  description,
  itemCount,
  totalDuration,
  thumbnailColor,
  onPress,
  onLongPress,
}) => {
  // Format duration from seconds to readable format
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* Thumbnail */}
        <View style={[styles.thumbnail, { backgroundColor: thumbnailColor || '#D4AF37' }]}>
          <FontAwesome5 name="music" size={24} color="#FFF" />
        </View>

        {/* Playlist Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {description && (
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          )}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <FontAwesome5 name="list" size={12} color="#CBD5E0" />
              <Text style={styles.statText}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="clock" size={12} color="#CBD5E0" />
              <Text style={styles.statText}>
                {formatDuration(totalDuration)}
              </Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <FontAwesome5 name="chevron-right" size={16} color="#CBD5E0" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#CBD5E0',
    marginBottom: 6,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#CBD5E0',
  },
});

export default PlaylistCard;
