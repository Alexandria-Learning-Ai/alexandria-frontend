/**
 * useLeaderboard.ts
 *
 * Custom hook for managing leaderboard data and interactions.
 * Handles fetching, refreshing, and pagination of leaderboard entries.
 *
 * Features:
 * - Fetch leaderboard data by timeframe
 * - Filter by subject
 * - Friends-only mode
 * - Pagination (load more)
 * - Refresh
 * - Caching
 * - Error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { getUserFriendlyError } from '../utils/errorMessages';
import type { LeaderboardEntryData } from '../components/leaderboard/LeaderboardEntry';
import type { LeaderboardTimeframe } from '../components/leaderboard/Leaderboard';

interface UseLeaderboardOptions {
  timeframe?: LeaderboardTimeframe;
  subject?: string;
  friendsOnly?: boolean;
  pageSize?: number;
  currentUserId?: string;
}

interface UseLeaderboardReturn {
  data: LeaderboardEntryData[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  userPosition: UserPosition | null;
  refresh: (timeframe?: LeaderboardTimeframe) => Promise<void>;
  loadMore: (timeframe?: LeaderboardTimeframe) => Promise<void>;
}

interface UserPosition {
  rank: number;
  points: number;
  pointsToNextRank?: number;
}

interface LeaderboardAPIResponse {
  leaderboard: Array<{
    rank: number;
    user_id: string;
    user_name: string;
    points: number;
    quizzes_completed: number;
    average_score: number;
  }>;
  user_position?: {
    rank: number;
    points: number;
    points_to_next_rank?: number;
  };
}

/**
 * Fetch leaderboard data from backend API
 */
const fetchLeaderboardFromAPI = async (
  timeframe: LeaderboardTimeframe,
  subject?: string,
  friendsOnly?: boolean,
  page: number = 1,
  pageSize: number = 50,
  currentUserId?: string
): Promise<{ entries: LeaderboardEntryData[]; hasMore: boolean; userPosition?: UserPosition }> => {
  try {
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams({
      timeframe,
      limit: pageSize.toString(),
      offset: offset.toString(),
    });

    if (subject) {
      params.append('subject', subject);
    }

    if (friendsOnly) {
      params.append('friends_only', 'true');
    }

    // Get auth token if available
    const token = await auth.currentUser?.getIdToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/leaderboard?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Leaderboard fetch failed: ${response.status} ${response.statusText}`);
    }

    const result: LeaderboardAPIResponse = await response.json();

    // Transform API response to match LeaderboardEntryData format
    const entries: LeaderboardEntryData[] = result.leaderboard.map((entry) => ({
      rank: entry.rank,
      userId: entry.user_id,
      userName: entry.user_name,
      points: entry.points,
      quizzesCompleted: entry.quizzes_completed,
      averageScore: entry.average_score,
      isCurrentUser: currentUserId ? entry.user_id === currentUserId : false,
    }));

    // Transform user position if available
    const userPosition: UserPosition | undefined = result.user_position
      ? {
          rank: result.user_position.rank,
          points: result.user_position.points,
          pointsToNextRank: result.user_position.points_to_next_rank,
        }
      : undefined;

    return {
      entries,
      hasMore: result.leaderboard.length === pageSize,
      userPosition,
    };
  } catch (error) {
    logger.error('Failed to fetch leaderboard from API', error);
    throw error;
  }
};

/**
 * useLeaderboard Hook
 */
export const useLeaderboard = ({
  timeframe = 'weekly',
  subject,
  friendsOnly = false,
  pageSize = 50,
  currentUserId,
}: UseLeaderboardOptions): UseLeaderboardReturn => {
  const [data, setData] = useState<LeaderboardEntryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);

  /**
   * Fetch initial leaderboard data
   */
  const fetchInitial = useCallback(
    async (selectedTimeframe: LeaderboardTimeframe = timeframe) => {
      logger.info('Fetching initial leaderboard', {
        timeframe: selectedTimeframe,
        subject,
        friendsOnly,
      });

      setLoading(true);
      setError(null);
      setCurrentTimeframe(selectedTimeframe);

      try {
        const result = await fetchLeaderboardFromAPI(
          selectedTimeframe,
          subject,
          friendsOnly,
          1,
          pageSize,
          currentUserId
        );

        setData(result.entries);
        setHasMore(result.hasMore);
        setCurrentPage(1);

        // Update user position if provided
        if (result.userPosition) {
          setUserPosition(result.userPosition);
        }

        logger.info('Initial leaderboard loaded', {
          count: result.entries.length,
          userRank: result.userPosition?.rank,
        });
      } catch (err) {
        const friendlyError = getUserFriendlyError(err instanceof Error ? err : new Error(String(err)), {
          operation: 'load the leaderboard',
          resource: 'leaderboard',
        });
        logger.error('Error fetching leaderboard', err);
        setError(friendlyError);
      } finally {
        setLoading(false);
      }
    },
    [timeframe, subject, friendsOnly, pageSize, currentUserId]
  );

  /**
   * Load initial data on mount or when filters change
   */
  useEffect(() => {
    fetchInitial(timeframe);
  }, [fetchInitial, timeframe]);

  /**
   * Refresh leaderboard
   */
  const refresh = useCallback(
    async (selectedTimeframe?: LeaderboardTimeframe) => {
      const targetTimeframe = selectedTimeframe || currentTimeframe;
      logger.info('Refreshing leaderboard', { timeframe: targetTimeframe });

      await fetchInitial(targetTimeframe);
    },
    [fetchInitial, currentTimeframe]
  );

  /**
   * Load more entries (pagination)
   */
  const loadMore = useCallback(
    async (selectedTimeframe?: LeaderboardTimeframe) => {
      if (loading || !hasMore) {
        logger.info('Skip load more', { loading, hasMore });
        return;
      }

      const targetTimeframe = selectedTimeframe || currentTimeframe;
      const nextPage = currentPage + 1;

      logger.info('Loading more leaderboard entries', {
        timeframe: targetTimeframe,
        page: nextPage,
      });

      setLoading(true);
      setError(null);

      try {
        const result = await fetchLeaderboardFromAPI(
          targetTimeframe,
          subject,
          friendsOnly,
          nextPage,
          pageSize,
          currentUserId
        );

        setData((prev) => [...prev, ...result.entries]);
        setHasMore(result.hasMore);
        setCurrentPage(nextPage);

        // Update user position if provided
        if (result.userPosition) {
          setUserPosition(result.userPosition);
        }

        logger.info('More leaderboard entries loaded', { count: result.entries.length });
      } catch (err) {
        const friendlyError = getUserFriendlyError(err instanceof Error ? err : new Error(String(err)), {
          operation: 'load more leaderboard entries',
          resource: 'leaderboard entries',
        });
        logger.error('Error loading more entries', err);
        setError(friendlyError);
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      hasMore,
      currentTimeframe,
      currentPage,
      subject,
      friendsOnly,
      pageSize,
      currentUserId,
    ]
  );

  return {
    data,
    loading,
    error,
    hasMore,
    userPosition,
    refresh,
    loadMore,
  };
};

export default useLeaderboard;
