/**
 * RankBadge.tsx
 *
 * Small component to display user's rank and points.
 * Can be used anywhere in the app (header, profile, etc.)
 *
 * Features:
 * - Compact rank display (#4 • 1,890 pts)
 * - Medal icons for top 3
 * - Alexandria theme colors
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import type { ThemeColors } from '../../types';

export interface RankBadgeProps {
  rank: number; // User's rank position
  points: number; // User's total points
  themeColors: ThemeColors; // Alexandria theme colors
  compact?: boolean; // Compact mode (smaller text)
}

/**
 * Get medal icon and color for top 3 ranks
 */
const getMedalData = (rank: number) => {
  switch (rank) {
    case 1:
      return { icon: 'medal', color: '#D4AF37' }; // Gold
    case 2:
      return { icon: 'medal', color: '#C0C0C0' }; // Silver
    case 3:
      return { icon: 'medal', color: '#CD7F32' }; // Bronze
    default:
      return null;
  }
};

/**
 * Format points with comma separators (e.g., 1890 -> "1,890")
 */
const formatPoints = (points: number): string => {
  return points.toLocaleString();
};

export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  points,
  themeColors,
  compact = false,
}) => {
  const medalData = getMedalData(rank);

  return (
    <View style={styles.container}>
      {/* Medal or Rank Number */}
      {medalData ? (
        <FontAwesome5
          name={medalData.icon}
          size={compact ? 16 : 20}
          color={medalData.color}
          style={styles.medalIcon}
        />
      ) : (
        <Text
          style={[
            styles.rankText,
            { color: themeColors.alexandriaGold },
            compact && styles.rankTextCompact,
          ]}
        >
          #{rank}
        </Text>
      )}

      {/* Separator */}
      <Text
        style={[
          styles.separator,
          { color: themeColors.textSecondary },
          compact && styles.separatorCompact,
        ]}
      >
        •
      </Text>

      {/* Points */}
      <Text
        style={[
          styles.pointsText,
          { color: themeColors.text },
          compact && styles.pointsTextCompact,
        ]}
      >
        {formatPoints(points)} pts
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medalIcon: {
    marginRight: 6,
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
  },
  rankTextCompact: {
    fontSize: 14,
  },
  separator: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  separatorCompact: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointsTextCompact: {
    fontSize: 13,
  },
});

export default RankBadge;
