/**
 * ChapterList - Displays list of chapters with progress
 *
 * Features:
 * - FlatList of chapters with virtualization
 * - Chapter number, title, status badge (Not Started/In Progress/Completed)
 * - Progress bar for each chapter
 * - Tap to navigate to chapter reader
 * - Loading state with skeleton
 * - Empty state ("No chapters yet")
 * - Alexandria theme styling
 * - Touch feedback
 *
 * @param chapters - Array of chapters
 * @param progress - Map of chapter progress (chapter_id -> progress)
 * @param onChapterPress - Callback when chapter is tapped
 * @param loading - Loading state
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Chapter, ChapterProgress } from '../../types/materials';
import ProgressBar from '../shared/ProgressBar';

interface ChapterListProps {
  chapters: Chapter[];
  progress: Map<string, ChapterProgress>;
  onChapterPress: (chapterId: string, chapterIndex: number) => void;
  loading?: boolean;
}

const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  progress,
  onChapterPress,
  loading = false,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accent,
      border: Colors.border,
      success: Colors.success,
      warning: Colors.warning,
    }),
    []
  );

  const getStatusInfo = (chapterId: string) => {
    const chapterProgress = progress.get(chapterId);

    if (!chapterProgress || chapterProgress.read_pct === 0) {
      return {
        label: 'Not Started',
        color: themeColors.textMuted,
        backgroundColor: Colors.gray200,
        progress: 0,
      };
    }

    if (chapterProgress.completed || chapterProgress.read_pct >= 0.92) {
      return {
        label: 'Completed',
        color: Colors.white,
        backgroundColor: themeColors.success,
        progress: 1,
      };
    }

    return {
      label: 'In Progress',
      color: Colors.white,
      backgroundColor: themeColors.warning,
      progress: chapterProgress.read_pct,
    };
  };

  const renderChapterItem = ({ item, index }: { item: Chapter; index: number }) => {
    const statusInfo = getStatusInfo(item.id);

    // Calculate estimated read time from word count (average 200 words per minute)
    const estimatedReadTime = Math.max(1, Math.ceil(item.word_count / 200));

    return (
      <TouchableOpacity
        style={[styles.chapterItem, { backgroundColor: themeColors.background }]}
        onPress={() => onChapterPress(item.id, item.index)}
        activeOpacity={0.7}
      >
        <View style={styles.chapterHeader}>
          <View style={styles.chapterTitleContainer}>
            <Text style={[styles.chapterNumber, { color: themeColors.accent }]}>
              {item.index}.
            </Text>
            <Text
              style={[styles.chapterTitle, { color: themeColors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
          </View>

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

        {statusInfo.progress > 0 && statusInfo.progress < 1 && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={statusInfo.progress} height={6} animated />
            <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
              {Math.round(statusInfo.progress * 100)}% complete
            </Text>
          </View>
        )}

        <View style={styles.chevronContainer}>
          <FontAwesome5 name="chevron-right" size={16} color={themeColors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="book-open" size={64} color={themeColors.textMuted} />
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        No chapters yet
      </Text>
      <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
        This material is still being processed.
      </Text>
      <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
        Chapters will appear here once ready.
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={themeColors.accent} />
      <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
        Loading chapters...
      </Text>
    </View>
  );

  if (loading) {
    return renderLoadingState();
  }

  return (
    <FlatList
      data={chapters}
      renderItem={renderChapterItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 8,
    flexGrow: 1,
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
  progressContainer: {
    marginTop: 12,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  chevronContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 16,
  },
});

export default ChapterList;
