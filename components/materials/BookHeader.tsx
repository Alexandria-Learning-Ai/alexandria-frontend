/**
 * BookHeader - Displays book cover and metadata
 *
 * Features:
 * - Cover image placeholder with gradient using thumbnail_color
 * - Title (large, bold typography)
 * - Author (muted secondary color)
 * - Metadata row (word count, chapter count with icons)
 * - Responsive sizing
 * - Alexandria theme styling
 *
 * @param title - Book title
 * @param author - Book author (optional)
 * @param thumbnailColor - Color for gradient cover placeholder
 * @param wordCount - Total word count
 * @param chapterCount - Total chapter count
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface BookHeaderProps {
  title: string;
  author?: string;
  publisher?: string;
  published_date?: string;
  description?: string;
  category?: string;
  thumbnailColor: string;
  wordCount: number;
  chapterCount: number;
}

const BookHeader: React.FC<BookHeaderProps> = ({
  title,
  author,
  publisher,
  published_date,
  description,
  category,
  thumbnailColor,
  wordCount,
  chapterCount,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accent,
      border: Colors.border,
    }),
    []
  );

  // Create gradient colors from thumbnail color
  const gradientColors = useMemo(() => {
    const baseColor = thumbnailColor || Colors.primary;
    return [baseColor, `${baseColor}CC`, `${baseColor}99`];
  }, [thumbnailColor]);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.coverContainer}>
        <LinearGradient
          colors={gradientColors}
          style={styles.coverGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome5 name="book" size={48} color={Colors.white} />
        </LinearGradient>
      </View>

      <View style={styles.infoContainer}>
        <Text
          style={[styles.title, { color: themeColors.text }]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        {author && (
          <Text
            style={[styles.author, { color: themeColors.textMuted }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {author}
          </Text>
        )}

        {/* Publisher and Publication Date */}
        {(publisher || published_date) && (
          <View style={styles.publisherRow}>
            {publisher && (
              <Text style={[styles.publisherText, { color: themeColors.textSecondary }]}>
                {publisher}
              </Text>
            )}
            {publisher && published_date && (
              <Text style={[styles.publisherText, { color: themeColors.textSecondary }]}> • </Text>
            )}
            {published_date && (
              <Text style={[styles.publisherText, { color: themeColors.textSecondary }]}>
                {published_date}
              </Text>
            )}
          </View>
        )}

        {/* Category */}
        {category && (
          <View style={styles.categoryContainer}>
            <FontAwesome5
              name="tag"
              size={12}
              color={themeColors.accent}
              style={styles.categoryIcon}
            />
            <Text style={[styles.categoryText, { color: themeColors.accent }]}>
              {category}
            </Text>
          </View>
        )}

        {/* Description */}
        {description && (
          <Text
            style={[styles.description, { color: themeColors.textSecondary }]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {description}
          </Text>
        )}

        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <FontAwesome5
              name="file-word"
              size={16}
              color={themeColors.textSecondary}
              style={styles.metadataIcon}
            />
            <Text style={[styles.metadataText, { color: themeColors.textSecondary }]}>
              {formatNumber(wordCount)} words
            </Text>
          </View>

          <View style={styles.metadataSeparator} />

          <View style={styles.metadataItem}>
            <FontAwesome5
              name="list"
              size={16}
              color={themeColors.textSecondary}
              style={styles.metadataIcon}
            />
            <Text style={[styles.metadataText, { color: themeColors.textSecondary }]}>
              {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coverContainer: {
    marginRight: 16,
  },
  coverGradient: {
    width: 100,
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  author: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 24,
  },
  publisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  publisherText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    marginRight: 6,
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metadataSeparator: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
});

export default BookHeader;
