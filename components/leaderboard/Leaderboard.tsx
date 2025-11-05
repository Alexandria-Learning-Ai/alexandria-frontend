/**
 * Leaderboard.tsx
 *
 * Main leaderboard component with tab navigation and infinite scroll.
 * Displays ranked list of users based on points and quiz performance.
 *
 * Features:
 * - Tab navigation (Daily, Weekly, Monthly, All-Time)
 * - Filter by subject
 * - Friends-only mode
 * - Pull-to-refresh
 * - Infinite scroll
 * - Highlight current user
 * - Stagger animations
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import LeaderboardEntry, { LeaderboardEntryData } from './LeaderboardEntry';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import logger from '../../utils/logger';
import type { ThemeColors } from '../../types';

export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardProps {
  subject?: string; // Filter by subject (optional)
  timeframe?: LeaderboardTimeframe; // Initial timeframe
  showFriendsOnly?: boolean; // Show only friends
  currentUserId?: string; // Current user's ID
  themeColors: ThemeColors; // Alexandria theme colors
}

/**
 * Tab configuration
 */
const TABS: Array<{ key: LeaderboardTimeframe; label: string; icon: string }> = [
  { key: 'daily', label: 'Daily', icon: 'calendar-day' },
  { key: 'weekly', label: 'Weekly', icon: 'calendar-week' },
  { key: 'monthly', label: 'Monthly', icon: 'calendar-alt' },
  { key: 'all_time', label: 'All-Time', icon: 'infinity' },
];

export const Leaderboard: React.FC<LeaderboardProps> = ({
  subject,
  timeframe: initialTimeframe = 'weekly',
  showFriendsOnly = false,
  currentUserId,
  themeColors,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<LeaderboardTimeframe>(initialTimeframe);
  const [refreshing, setRefreshing] = useState(false);

  // Use the leaderboard hook to fetch data
  const {
    data,
    loading,
    error,
    hasMore,
    userPosition,
    refresh,
    loadMore,
  } = useLeaderboard({
    timeframe: selectedTimeframe,
    subject,
    friendsOnly: showFriendsOnly,
    currentUserId,
  });

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((newTimeframe: LeaderboardTimeframe) => {
    logger.info('Leaderboard timeframe changed', { timeframe: newTimeframe });
    setSelectedTimeframe(newTimeframe);
  }, []);

  /**
   * Refresh data when timeframe changes
   */
  useEffect(() => {
    refresh(selectedTimeframe);
  }, [selectedTimeframe]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh(selectedTimeframe);
      logger.info('Leaderboard refreshed');
    } catch (error) {
      logger.error('Failed to refresh leaderboard', error);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, selectedTimeframe]);

  /**
   * Handle load more
   */
  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      await loadMore(selectedTimeframe);
      logger.info('Loaded more leaderboard entries');
    } catch (error) {
      logger.error('Failed to load more entries', error);
    }
  }, [loadMore, loading, hasMore, selectedTimeframe]);

  /**
   * Calculate points to next rank for current user from data
   */
  const pointsToNextRankFromData = useMemo(() => {
    const currentUserEntry = data.find((entry) => entry.userId === currentUserId);
    if (!currentUserEntry || currentUserEntry.rank === 1) return undefined;

    const nextRankEntry = data.find((entry) => entry.rank === currentUserEntry.rank - 1);
    if (!nextRankEntry) return undefined;

    return nextRankEntry.points - currentUserEntry.points;
  }, [data, currentUserId]);

  // Use user position from API if available, otherwise calculate from data
  const pointsToNextRank = userPosition?.pointsToNextRank ?? pointsToNextRankFromData;

  /**
   * Render tab button
   */
  const renderTabButton = (tab: typeof TABS[0]) => {
    const isActive = selectedTimeframe === tab.key;

    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tabButton,
          {
            borderBottomColor: isActive ? themeColors.alexandriaGold : 'transparent',
          },
        ]}
        onPress={() => handleTabChange(tab.key)}
        activeOpacity={0.7}
      >
        <FontAwesome5
          name={tab.icon}
          size={14}
          color={isActive ? themeColors.alexandriaGold : themeColors.textSecondary}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: isActive ? themeColors.alexandriaGold : themeColors.textSecondary,
            },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render leaderboard entry
   */
  const renderEntry = useCallback(
    ({ item, index }: { item: LeaderboardEntryData; index: number }) => {
      const entryWithCurrentUser = {
        ...item,
        isCurrentUser: item.userId === currentUserId,
      };

      const currentUserEntry = data.find((entry) => entry.userId === currentUserId);
      const isCurrentUserEntry = item.userId === currentUserId;
      const pointsGap = isCurrentUserEntry ? pointsToNextRank : undefined;

      return (
        <LeaderboardEntry
          entry={entryWithCurrentUser}
          themeColors={themeColors}
          animationDelay={index * 100}
          pointsToNextRank={pointsGap}
        />
      );
    },
    [currentUserId, themeColors, data, pointsToNextRank]
  );

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <FontAwesome5
          name="trophy"
          size={24}
          color={themeColors.alexandriaGold}
          style={styles.trophyIcon}
        />
        <Text style={[styles.title, { color: themeColors.text }]}>
          {subject ? `${subject} Leaders` : 'Leaderboard'}
        </Text>
      </View>
      {showFriendsOnly && (
        <View
          style={[
            styles.friendsBadge,
            {
              backgroundColor: themeColors.alexandriaGold + '20',
              borderColor: themeColors.alexandriaGold,
            },
          ]}
        >
          <FontAwesome5
            name="user-friends"
            size={12}
            color={themeColors.alexandriaGold}
            style={styles.friendsIcon}
          />
          <Text style={[styles.friendsText, { color: themeColors.alexandriaGold }]}>
            Friends Only
          </Text>
        </View>
      )}
    </View>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5
        name="trophy"
        size={64}
        color={themeColors.alexandriaGold}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyText, { color: themeColors.text }]}>
        Leaderboard Coming Soon
      </Text>
      <Text style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
        Complete quizzes to see your ranking and compete with fellow scholars
      </Text>
    </View>
  );

  /**
   * Render user position banner
   */
  const renderUserPosition = () => {
    if (!userPosition) return null;

    return (
      <View
        style={[
          styles.userPositionBanner,
          {
            backgroundColor: themeColors.alexandriaGold + '15',
            borderColor: themeColors.alexandriaGold,
          },
        ]}
      >
        <View style={styles.userPositionContent}>
          <FontAwesome5 name="medal" size={20} color={themeColors.alexandriaGold} />
          <View style={styles.userPositionText}>
            <Text style={[styles.userRankText, { color: themeColors.text }]}>
              Your Rank: #{userPosition.rank}
            </Text>
            <Text style={[styles.userPointsText, { color: themeColors.textSecondary }]}>
              {userPosition.points} points
            </Text>
          </View>
          {userPosition.pointsToNextRank && (
            <Text style={[styles.pointsToNextText, { color: themeColors.alexandriaGold }]}>
              {userPosition.pointsToNextRank} to next
            </Text>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render error banner
   */
  const renderError = () => {
    if (!error) return null;

    return (
      <View
        style={[
          styles.errorBanner,
          {
            backgroundColor: themeColors.error + '20',
            borderColor: themeColors.error,
          },
        ]}
      >
        <FontAwesome5 name="exclamation-circle" size={18} color={themeColors.error} />
        <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={[styles.retryButtonText, { color: themeColors.alexandriaGold }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render footer (loading indicator)
   */
  const renderFooter = () => {
    if (!loading || !hasMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={themeColors.alexandriaGold} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {renderHeader()}

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: themeColors.border }]}>
        {TABS.map(renderTabButton)}
      </View>

      {/* User Position Banner */}
      {renderUserPosition()}

      {/* Error Banner */}
      {renderError()}

      {/* Leaderboard List */}
      <FlatList
        data={data}
        renderItem={renderEntry}
        keyExtractor={(item) => `${item.userId}-${item.rank}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.alexandriaGold}
            colors={[themeColors.alexandriaGold]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trophyIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  friendsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  friendsIcon: {
    marginRight: 6,
  },
  friendsText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  userPositionBanner: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  userPositionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userPositionText: {
    flex: 1,
  },
  userRankText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  userPointsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pointsToNextText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  errorBanner: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default Leaderboard;
