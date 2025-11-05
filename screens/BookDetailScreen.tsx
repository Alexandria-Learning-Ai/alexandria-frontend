/**
 * BookDetailScreen - Displays book details and chapter list
 *
 * Features:
 * - BookHeader with cover, title, author, metadata (in ListHeaderComponent)
 * - ProgressSection with overall progress and continue reading button (in ListHeaderComponent)
 * - FlatList of chapters with status badges and navigation (virtualized for performance)
 * - Pull-to-refresh functionality
 * - Loading and error states
 * - Navigation to ChapterReaderScreen
 * - Optimized to avoid nested VirtualizedList warning
 *
 * Route Params:
 * - materialId: string - ID of the material to display
 *
 * Architecture:
 * - Uses FlatList as main scrollable container
 * - Header content (book info, progress) in ListHeaderComponent
 * - Chapters rendered as FlatList items for optimal virtualization
 * - No nested ScrollView/FlatList - single virtualized list
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NavigationProp } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { API_BASE_URL } from '../config/api';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';
import { useMaterialDetail } from '../hooks/useMaterials';
import { useSingleMaterialStatus } from '../hooks/useMaterialStatus';
import { useChapterQuizResults } from '../hooks/useChapterQuizResults';
import {
  getChapterLockState,
  getLockAlertTitle,
  getLockAlertMessage,
  getLockIconName,
  MaterialProgressResponse,
} from '../utils/chapterLockUtils';
import BookHeader from '../components/materials/BookHeader';
import ProgressSection from '../components/materials/ProgressSection';
import BookDetailSkeleton from '../components/materials/BookDetailSkeleton';
import { Chapter, ChapterProgress } from '../types/materials';

interface BookDetailScreenProps {
  route: {
    params: {
      materialId: string;
    };
  };
  navigation: NavigationProp<any>;
}

const BookDetailScreen: React.FC<BookDetailScreenProps> = ({ route, navigation }) => {
  const { materialId } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [cachedMaterial, setCachedMaterial] = useState<any>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      accent: Colors.accent,
      error: Colors.error,
      surface: Colors.surface,
    }),
    []
  );

  // Fetch material details
  const {
    data: material,
    isLoading: materialLoading,
    error: materialError,
    refetch: refetchMaterial,
  } = useMaterialDetail(materialId);

  // AsyncStorage caching - Load cached data instantly, fetch fresh in background
  useEffect(() => {
    const loadWithCache = async () => {
      try {
        const cacheKey = `book_detail_${materialId}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);

        if (cachedData) {
          try {
            // Attempt to parse cached JSON
            const parsedData = JSON.parse(cachedData);

            // Validate cache structure
            if (parsedData && parsedData.timestamp && parsedData.data) {
              const cacheAge = Date.now() - parsedData.timestamp;
              const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

              if (cacheAge < CACHE_EXPIRY) {
                logger.info(`Cache hit for material ${materialId}`, {
                  cacheAge: `${(cacheAge / 1000 / 60).toFixed(1)} minutes`,
                });
                setCachedMaterial(parsedData.data);
                setCacheLoaded(true);
              } else {
                logger.info(`Cache expired for material ${materialId}`, {
                  cacheAge: `${(cacheAge / 1000 / 60 / 60).toFixed(1)} hours`,
                });
                await AsyncStorage.removeItem(cacheKey);
              }
            } else {
              // Invalid cache structure (missing required fields)
              logger.warn(`Invalid cache structure for material ${materialId}, clearing cache`);
              await AsyncStorage.removeItem(cacheKey);
            }

          } catch (parseError) {
            // JSON parse error - corrupted cache
            logger.error(`Cache corrupted for material ${materialId}, clearing and refetching`, parseError);

            // Clear corrupted cache
            try {
              await AsyncStorage.removeItem(cacheKey);
              logger.info(`Cleared corrupted cache for material ${materialId}`);
            } catch (removeError) {
              logger.error(`Failed to remove corrupted cache: ${removeError}`);
            }
          }
        } else {
          logger.info(`No cache found for material ${materialId}, fetching from API`);
        }

      } catch (error) {
        // AsyncStorage read error (permission, disk full, etc.)
        logger.error(`Failed to read cache for material ${materialId}`, error);
      }

      // Always fetch fresh data in background (even if cache loaded)
      refetchMaterial();
    };

    loadWithCache();
  }, [materialId]);

  // Update cache when fresh data arrives
  useEffect(() => {
    const updateCache = async () => {
      if (material && !materialLoading) {
        try {
          const cacheKey = `book_detail_${materialId}`;
          const cacheData = {
            timestamp: Date.now(),
            data: material,
          };

          // Validate data before caching
          if (material.id && material.title && Array.isArray(material.chapters)) {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
            logger.info(`Updated cache for material ${materialId}`);
          } else {
            logger.warn(`Invalid material data, skipping cache update for ${materialId}`, {
              hasId: !!material.id,
              hasTitle: !!material.title,
              hasChapters: Array.isArray(material.chapters),
            });
          }

        } catch (error) {
          logger.error(`Failed to update cache for material ${materialId}`, error);
          // Don't throw - cache update is not critical
        }
      }
    };

    updateCache();
  }, [material, materialLoading, materialId]);

  // Poll material status if processing (now with SSE support!)
  const {
    status: currentStatus,
    isPolling: isStatusPolling,
    isUsingSSE,
    sseConnected,
    isFallbackPolling,
  } = useSingleMaterialStatus(
    materialId,
    material?.status || 'ready',
    {
      enabled: !!material && (material.status === 'uploading' || material.status === 'processing'),
      pollingInterval: 15000, // CRITICAL FIX: Increased from 5s to 15s to reduce API load
    }
  );

  // Log connection method (SSE or polling)
  React.useEffect(() => {
    if (isUsingSSE) {
      logger.success('Using SSE for real-time status updates', {
        materialId,
        sseConnected,
      });
    } else if (isFallbackPolling) {
      logger.warn('Using fallback polling (SSE failed)', { materialId });
    } else if (isStatusPolling) {
      logger.info('Using polling for status updates', { materialId });
    }
  }, [isUsingSSE, isStatusPolling, isFallbackPolling, sseConnected, materialId]);

  // Detect status transition from "processing" to "ready" and refetch data
  useEffect(() => {
    if (currentStatus === 'ready' && material?.status === 'processing') {
      logger.info('Status transitioned to ready, refetching material data', { materialId });

      // Clear stale cache
      AsyncStorage.removeItem(`book_detail_${materialId}`).catch((error) => {
        logger.warn('Failed to clear cache after processing complete', error);
      });

      // Refetch fresh data
      refetchMaterial();
      refetchProgress();
    }
  }, [currentStatus, material?.status, materialId, refetchMaterial, refetchProgress]);

  // Clear cache for deleted materials (404 errors)
  useEffect(() => {
    if (materialError && axios.isAxiosError(materialError) && materialError.response?.status === 404) {
      logger.info('Material not found (404), clearing cache', { materialId });
      AsyncStorage.removeItem(`book_detail_${materialId}`).catch((error) => {
        logger.warn('Failed to clear cache for deleted material', error);
      });
    }
  }, [materialError, materialId]);

  // Track chapter quiz results for progressive unlocking
  const {
    quizResults: chapterQuizResults,
    isLoading: quizResultsLoading,
  } = useChapterQuizResults(materialId);

  // Fetch material progress
  const {
    data: progressData,
    isLoading: progressLoading,
    error: progressError,
    refetch: refetchProgress,
  } = useQuery<MaterialProgressResponse | null>({
    queryKey: ['materialProgress', materialId],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      logger.info('Fetching material progress', { materialId });

      try {
        const response = await axios.get<MaterialProgressResponse>(
          `${API_BASE_URL}/api/materials/${materialId}/progress`,
          {
            headers: {
              'X-User-ID': user.uid,
              'Content-Type': 'application/json',
            },
          }
        );

        logger.success('Material progress fetched successfully', {
          currentChapterIndex: response.data.current_chapter_index,
          chaptersCompleted: response.data.chapters_completed,
          overallPercentage: response.data.overall_percentage,
        });

        return response.data;
      } catch (error) {
        // Return null if no progress found (404 = user hasn't started reading)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          logger.info('No progress found for material', { materialId });
          return null;
        }
        throw error;
      }
    },
    enabled: !!materialId && !!auth.currentUser,
    staleTime: 60000, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry 404s
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Calculate overall progress from API data (accurate)
  const overallProgress = useMemo(() => {
    const currentMaterial = material || cachedMaterial;

    if (!currentMaterial || !progressData) {
      return {
        completedChapters: 0,
        totalChapters: currentMaterial?.chapters.length || 0,
        overallPercentage: 0,
        currentChapterIndex: 0,
        currentChapterId: null,
      };
    }

    // Use actual API data (already accounts for non-sequential reading)
    // API tracks which specific chapters are completed, not just index
    return {
      completedChapters: progressData.chapters_completed || 0,
      totalChapters: currentMaterial.chapters.length,
      overallPercentage: progressData.overall_percentage || 0,
      currentChapterIndex: progressData.current_chapter_index || 0,
      currentChapterId: progressData.last_opened_chapter_id || null,
    };
  }, [material, cachedMaterial, progressData]);

  // Create empty progress map (ChapterList component expects this)
  // TODO: Update ChapterList to use simpler progress tracking
  const progressMap = useMemo(() => {
    return new Map<string, ChapterProgress>();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMaterial(), refetchProgress()]);
    } catch (error) {
      logger.error('Failed to refresh material data', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMaterial, refetchProgress]);

  // Handle chapter press
  const handleChapterPress = useCallback(
    (chapterId: string, chapterIndex: number) => {
      if (!material) return;

      logger.info('Navigating to chapter reader', { chapterId, chapterIndex });

      navigation.navigate('ChapterReader', {
        materialId,
        chapterId,
        chapterIndex,
        totalChapters: material.chapters.length,
      });
    },
    [material, materialId, navigation]
  );

  // Handle continue reading
  const handleContinueReading = useCallback(() => {
    const currentMaterial = material || cachedMaterial;
    if (!currentMaterial) return;

    if (progressData) {
      // Navigate to current chapter
      const currentIndex = progressData.current_chapter_index;
      const currentChapter = currentMaterial.chapters[currentIndex];

      if (currentChapter) {
        handleChapterPress(currentChapter.id, currentIndex);
        return;
      }
    }

    // No progress or invalid index, navigate to first chapter
    if (currentMaterial.chapters.length > 0) {
      handleChapterPress(currentMaterial.chapters[0].id, 0);
    }
  }, [material, cachedMaterial, progressData, handleChapterPress]);

  // Use cached material or fresh material
  const displayMaterial = material || cachedMaterial;

  // IMPORTANT: Get chapter status info - MUST be defined before early returns
  // to comply with Rules of Hooks (hooks must always be called in same order)
  const getChapterStatusInfo = useCallback((chapterId: string) => {
    const chapterProgress = progressMap.get(chapterId);

    if (!chapterProgress || chapterProgress.read_pct === 0) {
      return {
        label: 'Not Started',
        color: themeColors.textSecondary,
        backgroundColor: Colors.gray200,
        progress: 0,
      };
    }

    if (chapterProgress.completed || chapterProgress.read_pct >= 0.92) {
      return {
        label: 'Completed',
        color: Colors.white,
        backgroundColor: Colors.success,
        progress: 1,
      };
    }

    return {
      label: 'In Progress',
      color: Colors.white,
      backgroundColor: Colors.warning,
      progress: chapterProgress.read_pct,
    };
  }, [progressMap, themeColors]);

  // IMPORTANT: Render functions - MUST be defined before early returns
  // to comply with Rules of Hooks (hooks must always be called in same order)
  const renderListHeader = useCallback(() => (
    <>
      {/* Book Header */}
      <BookHeader
        title={displayMaterial?.title || ''}
        author={displayMaterial?.author || ''}
        publisher={displayMaterial?.publisher}
        published_date={displayMaterial?.published_date}
        description={displayMaterial?.description}
        category={displayMaterial?.category}
        thumbnailColor={Colors.primary}
        wordCount={displayMaterial?.word_count || 0}
        chapterCount={displayMaterial?.chapter_count || 0}
        cover_image_url={displayMaterial?.cover_image_url}
      />

      {/* Progress Section */}
      <ProgressSection
        completedChapters={overallProgress.completedChapters}
        totalChapters={overallProgress.totalChapters}
        overallPercentage={overallProgress.overallPercentage}
        lastOpenedChapterId={overallProgress.currentChapterId}
        lastOpenedTime={progressData?.progress?.find(p => p.chapter_id === progressData.last_opened_chapter_id)?.last_opened || null}
        onContinueReading={handleContinueReading}
      />

      {/* Chapter List Header */}
      <View style={styles.chapterListHeader}>
        <Text style={[styles.chapterListTitle, { color: themeColors.text }]}>Chapters</Text>
        <Text style={[styles.chapterListCount, { color: themeColors.textSecondary }]}>
          {displayMaterial?.chapters.length || 0}
        </Text>
      </View>
    </>
  ), [displayMaterial, overallProgress, progressData, handleContinueReading, themeColors]);

  const renderChapterItem = useCallback(({ item, index }: { item: Chapter; index: number }) => {
    // Guard: Skip if no material data
    if (!displayMaterial) return null;

    // Get lock state for this chapter
    const lockState = getChapterLockState(
      item.index,
      displayMaterial.chapters.length,
      progressData,
      chapterQuizResults,
      index > 0 ? displayMaterial.chapters[index - 1]?.title : undefined
    );

    const statusInfo = getChapterStatusInfo(item.id);
    const estimatedReadTime = Math.max(1, Math.ceil(item.word_count / 200));
    // Convert 1-based item.index to 0-based for quiz results lookup
    const hasPassedQuiz = chapterQuizResults[item.index - 1]?.passed || false;
    // current_chapter_index is 0-based, item.index is 1-based
    const isCurrentChapter = progressData?.current_chapter_index === (item.index - 1);

    return (
      <TouchableOpacity
        style={[
          styles.chapterItem,
          { backgroundColor: themeColors.surface },
          lockState.isLocked && styles.chapterCardLocked,
        ]}
        onPress={() => {
          if (lockState.isLocked) {
            Alert.alert(
              getLockAlertTitle(lockState),
              getLockAlertMessage(lockState),
              [{ text: 'OK', style: 'default' }]
            );
            return;
          }
          // Convert 1-based item.index to 0-based for navigation
          handleChapterPress(item.id, item.index - 1);
        }}
        activeOpacity={lockState.isLocked ? 1 : 0.7}
      >
        <View style={styles.chapterHeader}>
          <View style={styles.chapterTitleContainer}>
            <Text style={[styles.chapterNumber, { color: lockState.isLocked ? themeColors.textSecondary : themeColors.accent }]}>
              {item.index}.
            </Text>
            <Text
              style={[styles.chapterTitle, { color: lockState.isLocked ? themeColors.textSecondary : themeColors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title || `Chapter ${item.index}`}
            </Text>
          </View>

          {lockState.isLocked && (
            <View style={styles.lockIconContainer}>
              <FontAwesome5
                name={getLockIconName(lockState)}
                size={20}
                color={themeColors.textSecondary}
              />
            </View>
          )}

          {!lockState.isLocked && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.backgroundColor },
              ]}
            >
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chapterMeta}>
          <FontAwesome5
            name="clock"
            size={12}
            color={themeColors.textSecondary}
            style={styles.metaIcon}
          />
          <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
            {estimatedReadTime} min read
          </Text>

          <View style={styles.metaSeparator} />

          <FontAwesome5
            name="file-word"
            size={12}
            color={themeColors.textSecondary}
            style={styles.metaIcon}
          />
          <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
            {item.word_count.toLocaleString()} words
          </Text>
        </View>

        {/* Lock message */}
        {lockState.isLocked && lockState.reason && (
          <Text style={styles.lockMessage} numberOfLines={2}>
            {lockState.reason === 'not_started' && 'Read previous chapter first'}
            {lockState.reason === 'quiz_required' && 'Complete previous chapter quiz to unlock'}
            {lockState.reason === 'quiz_failed' && `Score ${lockState.requiredQuizScore}% or higher to unlock`}
          </Text>
        )}

        {/* Status indicators */}
        <View style={styles.chapterStatus}>
          {/* Completed & Quiz Passed */}
          {!lockState.isLocked && hasPassedQuiz && (
            <View style={styles.completionBadge}>
              <FontAwesome5 name="check-circle" size={14} color={Colors.success} />
              <Text style={styles.completionText}>Completed</Text>
            </View>
          )}

          {/* Current Chapter */}
          {isCurrentChapter && !lockState.isLocked && (
            <View style={[styles.completionBadge, styles.currentBadge]}>
              <FontAwesome5 name="book-open" size={14} color={Colors.primary} />
              <Text style={[styles.completionText, styles.currentText]}>Reading</Text>
            </View>
          )}

          {/* Locked */}
          {lockState.isLocked && (
            <View style={[styles.completionBadge, styles.lockedBadge]}>
              <FontAwesome5 name="lock" size={14} color={themeColors.textSecondary} />
              <Text style={[styles.completionText, styles.lockedText]}>Locked</Text>
            </View>
          )}
        </View>

        {!lockState.isLocked && (
          <View style={styles.chevronContainer}>
            <FontAwesome5 name="chevron-right" size={16} color={themeColors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handleChapterPress, progressMap, themeColors, displayMaterial, progressData, chapterQuizResults, getChapterStatusInfo]);

  // Check if material is currently processing
  const isProcessing = displayMaterial?.status === 'uploading' || displayMaterial?.status === 'processing';

  // Show processing UI if status is "uploading" or "processing"
  if (isProcessing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          {displayMaterial.status === 'uploading' ? 'Uploading book...' : 'Processing chapters...'}
        </Text>
        <Text style={[styles.processingSubtext, { color: themeColors.textSecondary }]}>
          This usually takes 1-2 minutes
        </Text>

        {/* SSE Connection Status Indicator */}
        <View style={styles.connectionStatus}>
          <View style={[
            styles.connectionDot,
            { backgroundColor: isUsingSSE ? Colors.success : (isFallbackPolling ? Colors.warning : Colors.textSecondary) }
          ]} />
          <Text style={[styles.connectionText, { color: themeColors.textSecondary }]}>
            {isUsingSSE ? 'Real-time updates (SSE)' : (isFallbackPolling ? 'Fallback polling' : 'Connecting...')}
          </Text>
        </View>

        {/* Show book cover while processing if available */}
        {displayMaterial.cover_image_url && (
          <Image
            source={{ uri: displayMaterial.cover_image_url }}
            style={styles.processingCover}
            resizeMode="cover"
          />
        )}

        {/* Show book title while processing */}
        <Text style={[styles.processingTitle, { color: themeColors.text }]}>
          {displayMaterial.title}
        </Text>
      </View>
    );
  }

  // Loading state with skeleton - skip if cache is loaded or processing
  if ((materialLoading || progressLoading) && !cacheLoaded && !isProcessing) {
    return <BookDetailSkeleton chapterCount={8} />;
  }

  // Error state
  if (materialError || progressError) {
    const error = materialError || progressError;
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name="exclamation-triangle" size={64} color={themeColors.error} />
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>
          Failed to load book
        </Text>
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: themeColors.accent }]}
          onPress={onRefresh}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="redo" size={16} color={Colors.white} style={styles.retryIcon} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No material data
  if (!displayMaterial) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          Material not found
        </Text>
      </View>
    );
  }

  // All hooks defined above - now render the component
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={displayMaterial.chapters}
        renderItem={renderChapterItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.accent}
            colors={[themeColors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  processingCover: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  chapterListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    marginTop: 8,
  },
  chapterListTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chapterListCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  chapterItem: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chapterTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  chapterNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaSeparator: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  chevronContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  chapterCardLocked: {
    opacity: 0.5,
    backgroundColor: Colors.gray100,
  },
  lockIconContainer: {
    marginRight: 12,
  },
  lockMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  chapterStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.gray200,
    marginRight: 8,
    marginTop: 4,
  },
  currentBadge: {
    backgroundColor: Colors.primaryLight,
  },
  lockedBadge: {
    backgroundColor: Colors.gray300,
  },
  completionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 4,
  },
  currentText: {
    color: Colors.white,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
});

export default BookDetailScreen;
