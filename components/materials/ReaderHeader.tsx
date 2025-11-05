/**
 * ReaderHeader - Sticky header for chapter reader
 *
 * Features:
 * - Back button to navigate to BookDetailScreen
 * - Chapter title (truncated if long)
 * - Circular progress indicator showing read percentage
 * - Sticky positioning at top
 * - Alexandria theme styling
 * - Shadow and elevation
 *
 * @param chapterTitle - Title of current chapter
 * @param readPercentage - Reading progress (0-100)
 * @param onBackPress - Callback for back button
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import CircularProgress from '../shared/CircularProgress';

interface ReaderHeaderProps {
  chapterTitle: string;
  readPercentage: number;
  onBackPress: () => void;
}

const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  chapterTitle,
  readPercentage,
  onBackPress,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      accent: Colors.accent,
      border: Colors.border,
    }),
    []
  );

  return (
    <View style={[styles.header, { backgroundColor: themeColors.background }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBackPress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FontAwesome5 name="chevron-left" size={20} color={themeColors.text} />
      </TouchableOpacity>

      <Text
        style={[styles.title, { color: themeColors.text }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {chapterTitle}
      </Text>

      <View style={styles.progressContainer}>
        <CircularProgress
          size={36}
          progress={readPercentage / 100}
          strokeWidth={3}
          color={themeColors.accent}
          showPercentage
          percentageStyle={styles.percentageText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  progressContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default ReaderHeader;
