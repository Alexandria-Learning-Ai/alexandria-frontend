/**
 * SharedQuizScreen.tsx
 *
 * Public quiz view for shared quizzes.
 * Displays quiz preview and allows users to start the quiz.
 *
 * Features:
 * - Quiz preview with metadata
 * - Share code display
 * - Creator information
 * - Start quiz button
 * - Share button
 * - Alexandria theme styling
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import logger from '../utils/logger';
import { useQuizSharing } from '../hooks/useQuizSharing';

interface SharedQuizScreenProps {
  route: {
    params: {
      shareCode: string; // Share code from URL
      quizId?: string; // Optional quiz ID
    };
  };
  navigation: any; // React Navigation prop
}

/**
 * Mock theme colors (in production, use useTheme hook)
 */
const themeColors = {
  background: '#1A2C5B',
  backgroundSecondary: '#2C467D',
  alexandriaGold: '#D4AF37',
  alexandriaBronze: '#B8941F',
  alexandriaNavy: '#1A2C5B',
  text: '#F8F4E3',
  textSecondary: '#CBD5E0',
  textTertiary: '#A0AEC0',
  success: '#28a745',
  error: '#dc3545',
  surface: '#2C467D',
  surfaceSecondary: '#3A5A9F',
  border: 'rgba(248, 244, 227, 0.2)',
  shadow: '#000000',
};

export const SharedQuizScreen: React.FC<SharedQuizScreenProps> = ({ route, navigation }) => {
  const { shareCode } = route.params;
  const { getSharedQuiz, loading, error } = useQuizSharing();
  const [quizData, setQuizData] = useState<any>(null);

  /**
   * Load shared quiz
   */
  useEffect(() => {
    const loadQuiz = async () => {
      logger.info('Loading shared quiz', { shareCode });

      const data = await getSharedQuiz(shareCode);
      if (data) {
        setQuizData(data);
        logger.info('Shared quiz loaded', { quizId: data.quiz.id });
      }
    };

    loadQuiz();
  }, [shareCode, getSharedQuiz]);

  /**
   * Handle start quiz
   */
  const handleStartQuiz = () => {
    if (!quizData) return;

    logger.info('Starting shared quiz', { quizId: quizData.quiz.id, shareCode });
    // Navigate to QuizScreen with shared quiz data
    navigation.navigate('Quiz', {
      sharedQuizCode: shareCode,
      quizData: quizData.quiz,
      isSharedQuiz: true,
    });
  };

  /**
   * Difficulty badge color
   */
  const difficultyColor = useMemo(() => {
    switch (quizData?.quiz?.difficulty) {
      case 'easy':
        return themeColors.success;
      case 'medium':
        return '#FFD700';
      case 'hard':
        return themeColors.error;
      default:
        return themeColors.textSecondary;
    }
  }, [quizData?.quiz?.difficulty]);

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
        <LinearGradient
          colors={[themeColors.background, themeColors.backgroundSecondary]}
          style={styles.container}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.alexandriaGold} />
            <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
              Loading quiz...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  /**
   * Render error state
   */
  if (error || (!loading && !quizData)) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
        <LinearGradient
          colors={[themeColors.background, themeColors.backgroundSecondary]}
          style={styles.container}
        >
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={64} color={themeColors.error} />
            <Text style={[styles.errorText, { color: themeColors.text }]}>
              {error || 'This quiz may have been removed or the link is no longer valid'}
            </Text>
            <TouchableOpacity
              style={[styles.backToHomeButton, { backgroundColor: themeColors.alexandriaGold }]}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.backToHomeButtonText}>Explore Quizzes</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!quizData) {
    return null;
  }

  const quiz = quizData.quiz;
  const stats = quizData.stats;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />

      <LinearGradient
        colors={[themeColors.background, themeColors.backgroundSecondary]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="arrow-left" size={20} color={themeColors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Shared Quiz</Text>

          <TouchableOpacity style={styles.shareButton} activeOpacity={0.7}>
            <FontAwesome5 name="share-alt" size={20} color={themeColors.alexandriaGold} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Share Code */}
          <Animatable.View animation="fadeInDown" delay={100}>
            <View
              style={[
                styles.shareCodeContainer,
                {
                  backgroundColor: themeColors.alexandriaGold + '20',
                  borderColor: themeColors.alexandriaGold,
                },
              ]}
            >
              <Text style={[styles.shareCodeLabel, { color: themeColors.textSecondary }]}>
                Share Code
              </Text>
              <Text style={[styles.shareCode, { color: themeColors.alexandriaGold }]}>
                {shareCode}
              </Text>
            </View>
          </Animatable.View>

          {/* Quiz Info Card */}
          <Animatable.View animation="fadeInUp" delay={200}>
            <LinearGradient
              colors={[themeColors.surface, themeColors.surfaceSecondary]}
              style={[styles.quizCard, { borderColor: themeColors.border }]}
            >
              {/* Subject Badge */}
              <View
                style={[
                  styles.subjectBadge,
                  {
                    backgroundColor: themeColors.alexandriaGold + '20',
                    borderColor: themeColors.alexandriaGold,
                  },
                ]}
              >
                <FontAwesome5
                  name="book"
                  size={14}
                  color={themeColors.alexandriaGold}
                  style={styles.badgeIcon}
                />
                <Text style={[styles.subjectText, { color: themeColors.alexandriaGold }]}>
                  {quiz.subject}
                </Text>
              </View>

              {/* Quiz Title */}
              <Text style={[styles.quizTitle, { color: themeColors.text }]}>{quiz.title}</Text>

              {/* Description */}
              <Text style={[styles.quizDescription, { color: themeColors.textSecondary }]}>
                {quiz.description}
              </Text>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <FontAwesome5
                    name="question-circle"
                    size={20}
                    color={themeColors.alexandriaGold}
                  />
                  <Text style={[styles.statValue, { color: themeColors.text }]}>
                    {quiz.total_questions}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                    Questions
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <FontAwesome5 name="clock" size={20} color={themeColors.alexandriaGold} />
                  <Text style={[styles.statValue, { color: themeColors.text }]}>
                    {quiz.estimated_time || 15}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                    Minutes
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor: difficultyColor + '20',
                        borderColor: difficultyColor,
                      },
                    ]}
                  >
                    <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                      {(quiz.difficulty || 'medium').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animatable.View>

          {/* Creator Info */}
          {quizData.creator && (
            <Animatable.View animation="fadeInUp" delay={300}>
              <View
                style={[
                  styles.creatorContainer,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <View style={styles.creatorHeader}>
                  <FontAwesome5
                    name="user-circle"
                    size={40}
                    color={themeColors.alexandriaGold}
                  />
                  <View style={styles.creatorInfo}>
                    <Text style={[styles.creatorLabel, { color: themeColors.textSecondary }]}>
                      Created by
                    </Text>
                    <Text style={[styles.creatorName, { color: themeColors.text }]}>
                      {quizData.creator.user_name}
                    </Text>
                    {quizData.creator.rank && quizData.creator.points && (
                      <Text style={[styles.creatorRank, { color: themeColors.alexandriaGold }]}>
                        #{quizData.creator.rank} • {quizData.creator.points.toLocaleString()} pts
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </Animatable.View>
          )}

          {/* Community Stats */}
          <Animatable.View animation="fadeInUp" delay={400}>
            <View style={styles.communityStats}>
              <View style={styles.communityStatItem}>
                <FontAwesome5
                  name="users"
                  size={16}
                  color={themeColors.textSecondary}
                  style={styles.communityStatIcon}
                />
                <Text style={[styles.communityStatText, { color: themeColors.textSecondary }]}>
                  {stats.total_attempts || 0} attempts
                </Text>
              </View>
              <View style={styles.communityStatItem}>
                <FontAwesome5
                  name="chart-line"
                  size={16}
                  color={themeColors.textSecondary}
                  style={styles.communityStatIcon}
                />
                <Text style={[styles.communityStatText, { color: themeColors.textSecondary }]}>
                  {stats.average_score?.toFixed(1) || '0.0'}% avg score
                </Text>
              </View>
            </View>
          </Animatable.View>

          {/* Start Button */}
          <Animatable.View animation="bounceIn" delay={500}>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: themeColors.alexandriaGold }]}
              onPress={handleStartQuiz}
              activeOpacity={0.8}
            >
              <FontAwesome5
                name="play"
                size={20}
                color="#FFFFFF"
                style={styles.startIcon}
              />
              <Text style={styles.startButtonText}>Take This Quiz</Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 + 16 : 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  backToHomeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backToHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareCodeContainer: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  shareCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  shareCode: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
  },
  quizCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeIcon: {
    marginRight: 6,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 32,
  },
  quizDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  creatorContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  creatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  creatorRank: {
    fontSize: 14,
    fontWeight: '600',
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  communityStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityStatIcon: {
    marginRight: 6,
  },
  communityStatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  startIcon: {
    marginRight: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default SharedQuizScreen;
