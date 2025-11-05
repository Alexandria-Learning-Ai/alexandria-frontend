/**
 * LeaderboardEntry.tsx
 *
 * Single entry in the leaderboard list.
 * Displays user's rank, name, points, and statistics.
 *
 * Features:
 * - Medal icons for top 3
 * - Points and quiz statistics
 * - Highlight current user
 * - Show gap to next rank
 * - Stagger animation
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import type { ThemeColors } from '../../types';

export interface LeaderboardEntryData {
  rank: number; // Position in leaderboard
  userId: string; // User ID
  userName: string; // User display name
  points: number; // Total points
  quizzesCompleted: number; // Total quizzes completed
  averageScore: number; // Average quiz score (percentage)
  isCurrentUser?: boolean; // Whether this is the current user
}

export interface LeaderboardEntryProps {
  entry: LeaderboardEntryData; // Entry data
  themeColors: ThemeColors; // Alexandria theme colors
  animationDelay?: number; // Stagger animation delay (ms)
  pointsToNextRank?: number; // Points needed to reach next rank
}

/**
 * Get medal icon and color for top 3 ranks
 */
const getMedalData = (rank: number) => {
  switch (rank) {
    case 1:
      return { icon: 'medal', color: '#D4AF37', emoji: '🥇' }; // Gold
    case 2:
      return { icon: 'medal', color: '#C0C0C0', emoji: '🥈' }; // Silver
    case 3:
      return { icon: 'medal', color: '#CD7F32', emoji: '🥉' }; // Bronze
    default:
      return null;
  }
};

/**
 * Format points with comma separators
 */
const formatPoints = (points: number): string => {
  return points.toLocaleString();
};

/**
 * Get rank emoji for positions 4-10
 */
const getRankEmoji = (rank: number): string => {
  const emojiMap: Record<number, string> = {
    4: '4️⃣',
    5: '5️⃣',
    6: '6️⃣',
    7: '7️⃣',
    8: '8️⃣',
    9: '9️⃣',
    10: '🔟',
  };
  return emojiMap[rank] || `#${rank}`;
};

export const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({
  entry,
  themeColors,
  animationDelay = 0,
  pointsToNextRank,
}) => {
  const medalData = getMedalData(entry.rank);
  const isTopThree = entry.rank <= 3;

  return (
    <Animatable.View
      animation="fadeInRight"
      delay={animationDelay}
      duration={500}
    >
      <LinearGradient
        colors={
          entry.isCurrentUser
            ? [themeColors.alexandriaGold + '30', themeColors.alexandriaBronze + '30']
            : [themeColors.surface, themeColors.surfaceSecondary]
        }
        style={[
          styles.container,
          {
            borderColor: entry.isCurrentUser
              ? themeColors.alexandriaGold
              : themeColors.border,
          },
        ]}
      >
        {/* Rank Display */}
        <View style={styles.rankContainer}>
          {medalData ? (
            <Text style={styles.medalEmoji}>{medalData.emoji}</Text>
          ) : (
            <Text style={[styles.rankNumber, { color: themeColors.textSecondary }]}>
              {getRankEmoji(entry.rank)}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          {/* User Name */}
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.userName,
                {
                  color: entry.isCurrentUser
                    ? themeColors.alexandriaGold
                    : themeColors.text,
                },
              ]}
              numberOfLines={1}
            >
              {entry.userName}
              {entry.isCurrentUser && (
                <Text style={[styles.youLabel, { color: themeColors.alexandriaGold }]}>
                  {' '}
                  (YOU)
                </Text>
              )}
            </Text>
          </View>

          {/* Statistics */}
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: themeColors.textSecondary }]}>
              {entry.quizzesCompleted} quizzes • {entry.averageScore.toFixed(1)}% avg
            </Text>
          </View>

          {/* Points to Next Rank (for current user) */}
          {entry.isCurrentUser && pointsToNextRank !== undefined && pointsToNextRank > 0 && (
            <View style={styles.gapRow}>
              <FontAwesome5
                name="arrow-up"
                size={12}
                color={themeColors.success}
                style={styles.arrowIcon}
              />
              <Text style={[styles.gapText, { color: themeColors.success }]}>
                +{formatPoints(pointsToNextRank)} pts to #{entry.rank - 1}
              </Text>
            </View>
          )}
        </View>

        {/* Points Display */}
        <View style={styles.pointsContainer}>
          <Text
            style={[
              styles.points,
              {
                color: isTopThree
                  ? medalData?.color
                  : entry.isCurrentUser
                  ? themeColors.alexandriaGold
                  : themeColors.text,
              },
            ]}
          >
            {formatPoints(entry.points)}
          </Text>
          <Text style={[styles.pointsLabel, { color: themeColors.textSecondary }]}>pts</Text>
        </View>
      </LinearGradient>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rankContainer: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medalEmoji: {
    fontSize: 32,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  userInfoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  youLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },
  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  arrowIcon: {
    marginRight: 4,
  },
  gapText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pointsContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  points: {
    fontSize: 22,
    fontWeight: '700',
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default LeaderboardEntry;
