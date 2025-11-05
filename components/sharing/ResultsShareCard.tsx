/**
 * ResultsShareCard.tsx
 *
 * Shareable card component for quiz results.
 * Displays score, quiz details, and social sharing options.
 *
 * Features:
 * - Beautiful card layout with quiz score
 * - Subject and quiz metadata
 * - Challenge message ("Can you beat my score?")
 * - Alexandria branding
 * - Share to social media
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share as RNShare,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import logger from '../../utils/logger';
import type { ThemeColors } from '../../types';

export interface ResultsShareCardProps {
  score: number; // User's score (0-100 or actual points)
  totalQuestions: number; // Total number of questions
  quizTitle: string; // Quiz title
  subject: string; // Subject (e.g., "Database Science")
  timeSpent?: number; // Time spent in minutes
  shareUrl: string; // URL to share
  themeColors: ThemeColors; // Alexandria theme colors
}

/**
 * Get performance emoji and message based on score percentage
 */
const getPerformanceData = (percentage: number) => {
  if (percentage >= 90) {
    return { emoji: '🏆', label: 'Excellent!', color: '#D4AF37' };
  } else if (percentage >= 80) {
    return { emoji: '🌟', label: 'Great Job!', color: '#FFD700' };
  } else if (percentage >= 70) {
    return { emoji: '👍', label: 'Good Work!', color: '#28a745' };
  } else if (percentage >= 60) {
    return { emoji: '📚', label: 'Keep Learning!', color: '#FFA500' };
  } else {
    return { emoji: '💪', label: 'Keep Trying!', color: '#dc3545' };
  }
};

export const ResultsShareCard: React.FC<ResultsShareCardProps> = ({
  score,
  totalQuestions,
  quizTitle,
  subject,
  timeSpent,
  shareUrl,
  themeColors,
}) => {
  // Calculate percentage
  const percentage = useMemo(() => {
    return Math.round((score / totalQuestions) * 100);
  }, [score, totalQuestions]);

  // Get performance data
  const performance = useMemo(() => {
    return getPerformanceData(percentage);
  }, [percentage]);

  /**
   * Share to social media
   */
  const handleShare = async () => {
    const message = `${performance.emoji} I scored ${percentage}% on "${quizTitle}"!\n\nSubject: ${subject}\nQuestions: ${totalQuestions}${
      timeSpent ? `\nTime: ${timeSpent} minutes` : ''
    }\n\n💪 Can you beat my score?\n\n${shareUrl}\n\nvia Alexandria 📚`;

    try {
      const result = await RNShare.share({
        message,
        url: shareUrl,
        title: `My ${quizTitle} Results`,
      });

      if (result.action === RNShare.sharedAction) {
        logger.info('Results shared successfully');
      }
    } catch (error) {
      logger.error('Failed to share results', error);
    }
  };

  return (
    <Animatable.View animation="fadeInUp" duration={500}>
      <LinearGradient
        colors={[themeColors.alexandriaNavy, themeColors.alexandriaBronze + '40']}
        style={[
          styles.container,
          {
            borderColor: themeColors.alexandriaGold,
            shadowColor: themeColors.alexandriaGold,
          },
        ]}
      >
        {/* Alexandria Branding */}
        <View style={styles.brandingContainer}>
          <FontAwesome5
            name="book-open"
            size={16}
            color={themeColors.alexandriaGold}
            style={styles.brandIcon}
          />
          <Text style={[styles.brandText, { color: themeColors.alexandriaGold }]}>
            Alexandria
          </Text>
        </View>

        {/* Performance Emoji & Label */}
        <View style={styles.performanceContainer}>
          <Text style={styles.performanceEmoji}>{performance.emoji}</Text>
          <Text style={[styles.performanceLabel, { color: performance.color }]}>
            {performance.label}
          </Text>
        </View>

        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: themeColors.text }]}>I scored</Text>
          <LinearGradient
            colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
            style={styles.scoreBox}
          >
            <Text style={styles.scorePercentage}>{percentage}%</Text>
            <Text style={styles.scoreDetails}>
              {score}/{totalQuestions} correct
            </Text>
          </LinearGradient>
        </View>

        {/* Quiz Title */}
        <Text style={[styles.quizTitle, { color: themeColors.text }]} numberOfLines={2}>
          {quizTitle}
        </Text>

        {/* Quiz Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <FontAwesome5
              name="book"
              size={14}
              color={themeColors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
              {subject}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <FontAwesome5
              name="question-circle"
              size={14}
              color={themeColors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
              {totalQuestions} Questions
            </Text>
          </View>

          {timeSpent !== undefined && (
            <View style={styles.detailItem}>
              <FontAwesome5
                name="clock"
                size={14}
                color={themeColors.textSecondary}
                style={styles.detailIcon}
              />
              <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                {timeSpent} minutes
              </Text>
            </View>
          )}
        </View>

        {/* Challenge Message */}
        <View
          style={[
            styles.challengeContainer,
            {
              backgroundColor: themeColors.alexandriaGold + '20',
              borderColor: themeColors.alexandriaGold,
            },
          ]}
        >
          <Text style={[styles.challengeEmoji]}>💪</Text>
          <Text style={[styles.challengeText, { color: themeColors.text }]}>
            Can you beat my score?
          </Text>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: themeColors.alexandriaGold }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="share-alt" size={16} color="#FFFFFF" style={styles.shareIcon} />
          <Text style={styles.shareButtonText}>Share Results</Text>
        </TouchableOpacity>

        {/* Footer Branding */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: themeColors.textTertiary }]}>
            via Alexandria 📚
          </Text>
        </View>
      </LinearGradient>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandIcon: {
    marginRight: 6,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  performanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  scoreBox: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 150,
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
  },
  detailsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  challengeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  challengeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerContainer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ResultsShareCard;
