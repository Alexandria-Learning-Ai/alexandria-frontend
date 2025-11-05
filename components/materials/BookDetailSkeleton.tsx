/**
 * BookDetailSkeleton - Loading skeleton for BookDetailScreen
 *
 * Features:
 * - Book header skeleton with cover placeholder and metadata shimmer
 * - Progress section skeleton
 * - Chapter list skeleton with configurable item count
 * - Smooth shimmer animations
 * - Theme-consistent colors
 * - Mimics actual layout for seamless loading experience
 *
 * @param chapterCount - Number of chapter skeleton items to show (default: 5)
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';
import { Colors } from '../../constants/Colors';

interface BookDetailSkeletonProps {
  chapterCount?: number;
}

const BookDetailSkeleton: React.FC<BookDetailSkeletonProps> = ({ chapterCount = 5 }) => {
  const themeColors = useMemo(
    () => ({
      surface: Colors.surface,
      background: Colors.background,
      border: Colors.border,
      skeletonBase: Colors.gray200,
      skeletonHighlight: Colors.gray300,
    }),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Book Header Skeleton */}
      <View style={[styles.headerContainer, { backgroundColor: themeColors.surface }]}>
        <View style={styles.headerContent}>
          {/* Cover Skeleton */}
          <SkeletonLoader
            width={100}
            height={140}
            borderRadius={12}
            style={styles.coverSkeleton}
          />

          {/* Info Skeleton */}
          <View style={styles.infoContainer}>
            {/* Title */}
            <SkeletonLoader
              width="90%"
              height={24}
              borderRadius={4}
              style={styles.titleSkeleton}
            />
            <SkeletonLoader
              width="70%"
              height={20}
              borderRadius={4}
              style={styles.titleSecondLineSkeleton}
            />

            {/* Author */}
            <SkeletonLoader
              width="60%"
              height={16}
              borderRadius={4}
              style={styles.authorSkeleton}
            />

            {/* Publisher/Date */}
            <SkeletonLoader
              width="50%"
              height={13}
              borderRadius={4}
              style={styles.publisherSkeleton}
            />

            {/* Category Badge */}
            <SkeletonLoader
              width={80}
              height={24}
              borderRadius={12}
              style={styles.categorySkeleton}
            />

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <SkeletonLoader
                width="100%"
                height={13}
                borderRadius={4}
                style={styles.descriptionLine}
              />
              <SkeletonLoader
                width="95%"
                height={13}
                borderRadius={4}
                style={styles.descriptionLine}
              />
              <SkeletonLoader
                width="80%"
                height={13}
                borderRadius={4}
                style={styles.descriptionLine}
              />
            </View>

            {/* Metadata Row */}
            <View style={styles.metadataRow}>
              <SkeletonLoader width={90} height={16} borderRadius={4} />
              <View style={[styles.metadataSeparator, { backgroundColor: themeColors.border }]} />
              <SkeletonLoader width={80} height={16} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>

      {/* Progress Section Skeleton */}
      <View style={[styles.progressContainer, { backgroundColor: themeColors.surface }]}>
        {/* Progress Bar */}
        <SkeletonLoader
          width="100%"
          height={10}
          borderRadius={5}
          style={styles.progressBar}
        />

        {/* Progress Text Row */}
        <View style={styles.progressTextRow}>
          <SkeletonLoader width="50%" height={16} borderRadius={4} />
          <SkeletonLoader width={50} height={18} borderRadius={4} />
        </View>

        {/* Continue Button */}
        <SkeletonLoader
          width="100%"
          height={52}
          borderRadius={12}
          style={styles.continueButton}
        />

        {/* Timestamp */}
        <SkeletonLoader
          width={120}
          height={13}
          borderRadius={4}
          style={styles.timestamp}
        />
      </View>

      {/* Chapter List Header Skeleton */}
      <View style={[styles.chapterListHeader, { backgroundColor: themeColors.surface }]}>
        <SkeletonLoader width={80} height={18} borderRadius={4} />
        <SkeletonLoader width={30} height={16} borderRadius={4} />
      </View>

      {/* Chapter Items Skeleton */}
      <View style={styles.chapterList}>
        {Array.from({ length: chapterCount }).map((_, index) => (
          <View
            key={`chapter-skeleton-${index}`}
            style={[styles.chapterItem, { backgroundColor: themeColors.surface }]}
          >
            {/* Chapter Header */}
            <View style={styles.chapterHeader}>
              <View style={styles.chapterTitleRow}>
                <SkeletonLoader width={30} height={18} borderRadius={4} style={styles.chapterNumber} />
                <SkeletonLoader width="70%" height={16} borderRadius={4} />
              </View>
              <SkeletonLoader width={70} height={24} borderRadius={12} />
            </View>

            {/* Chapter Meta */}
            <View style={styles.chapterMeta}>
              <SkeletonLoader width={80} height={12} borderRadius={4} />
              <View style={[styles.metadataSeparator, { backgroundColor: themeColors.border }]} />
              <SkeletonLoader width={90} height={12} borderRadius={4} />
            </View>

            {/* Status Badge */}
            <SkeletonLoader
              width={90}
              height={28}
              borderRadius={12}
              style={styles.statusBadge}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header Skeleton
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    padding: 20,
  },
  coverSkeleton: {
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  titleSecondLineSkeleton: {
    marginBottom: 8,
  },
  authorSkeleton: {
    marginBottom: 8,
  },
  publisherSkeleton: {
    marginBottom: 8,
  },
  categorySkeleton: {
    marginBottom: 8,
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionLine: {
    marginBottom: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metadataSeparator: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
  },
  // Progress Skeleton
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBar: {
    marginBottom: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButton: {
    marginBottom: 12,
  },
  timestamp: {
    alignSelf: 'center',
  },
  // Chapter List Skeleton
  chapterListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chapterList: {
    paddingBottom: 20,
  },
  chapterItem: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  chapterNumber: {
    marginRight: 8,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  statusBadge: {
    marginTop: 4,
  },
});

export default BookDetailSkeleton;
