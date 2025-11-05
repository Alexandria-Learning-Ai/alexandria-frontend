/**
 * MetadataRow - Reusable component for displaying book metadata
 *
 * Features:
 * - Category badge with accent background
 * - Word count with file-word icon
 * - Chapter count with list icon
 * - Responsive layout (wraps on small screens)
 * - Proper spacing and alignment
 * - Alexandria theme styling
 *
 * @param category - Book category (optional)
 * @param wordCount - Total word count
 * @param chapterCount - Total chapter count
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface MetadataRowProps {
  category?: string;
  wordCount: number;
  chapterCount: number;
}

const MetadataRow: React.FC<MetadataRowProps> = ({
  category,
  wordCount,
  chapterCount,
}) => {
  const themeColors = useMemo(
    () => ({
      accent: Colors.accent,
      textSecondary: Colors.textSecondary,
      border: Colors.border,
      primaryLight: Colors.primaryLight,
    }),
    []
  );

  // Format large numbers (e.g., 150000 -> "150K")
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
      {/* Category Badge */}
      {category && (
        <View style={[styles.categoryContainer, { backgroundColor: themeColors.primaryLight }]}>
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

      {/* Metadata Row */}
      <View style={styles.metadataContainer}>
        {/* Word Count */}
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

        {/* Separator */}
        <View style={[styles.metadataSeparator, { backgroundColor: themeColors.border }]} />

        {/* Chapter Count */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    marginHorizontal: 12,
  },
});

export default MetadataRow;
