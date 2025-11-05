/**
 * QuizHeader.tsx
 *
 * Quiz header with back button, title, and exit button.
 * Displays quiz title, subtitle, and navigation controls with Alexandria styling.
 *
 * Extracted from QuizScreen.js for better maintainability and testing.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import type { ThemeColors } from '../../types';

interface QuizHeaderProps {
  title: string;
  subtitle?: string;
  isChallenge?: boolean;
  themeColors: ThemeColors;
  isDarkMode?: boolean;
  onBack: () => void;
  onExit: () => void;
  translate?: (key: string) => string;
}

/**
 * QuizHeader Component (Optimized with React.memo)
 *
 * Displays:
 * - Back button (left)
 * - Quiz title and subtitle (center)
 * - Exit button (right)
 * - Status bar with theme-aware style
 */
const QuizHeaderComponent: React.FC<QuizHeaderProps> = ({
  title,
  subtitle,
  isChallenge = false,
  themeColors,
  isDarkMode = false,
  onBack,
  onExit,
  translate = (key) => key.split('.').pop() || key,
}) => {
  const displayTitle = isChallenge
    ? translate('quiz.sacredTrial') || 'Sacred Trial'
    : translate('quiz.wisdomQuest') || 'Wisdom Quest';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={[themeColors.overlay, themeColors.surface]}
        style={styles.quizHeader}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: `${themeColors.alexandriaGold}20` }
          ]}
          onPress={onBack}
          activeOpacity={0.7}
          testID="quiz-header-back-button"
        >
          <FontAwesome5
            name="arrow-left"
            size={18}
            color={themeColors.alexandriaGold}
          />
        </TouchableOpacity>

        {/* Title Section */}
        <View style={styles.headerTitleContainer}>
          <View style={styles.titleWithIcon}>
            <FontAwesome5
              name={isChallenge ? "scroll" : "book-open"}
              size={14}
              color={themeColors.alexandriaGold}
              style={styles.titleIcon}
            />
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              {displayTitle}
            </Text>
            <FontAwesome5
              name={isChallenge ? "scroll" : "book-open"}
              size={14}
              color={themeColors.alexandriaGold}
              style={styles.titleIcon}
            />
          </View>
          {subtitle && (
            <Text
              style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Exit Button */}
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: `${themeColors.error}20` }
          ]}
          onPress={onExit}
          activeOpacity={0.7}
          testID="quiz-header-exit-button"
        >
          <FontAwesome5
            name="times"
            size={18}
            color={themeColors.error}
          />
        </TouchableOpacity>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    opacity: 0.8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});

// Memoized export to prevent unnecessary re-renders
// Only re-renders when title, subtitle, isChallenge, or theme colors change
const QuizHeader = React.memo(QuizHeaderComponent);

export { QuizHeader };
export default QuizHeader;
