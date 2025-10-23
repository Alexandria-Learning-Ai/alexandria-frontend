import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';
import HierarchicalSubjectService from '../../services/HierarchicalSubjectService';
import { SubjectProgressService } from '../../services/SubjectProgressService';
import logger from '../../utils/logger';

// Type definitions
interface ThemeStyles {
  progressWidget: ViewStyle;
  progressIcon: { color: string };
  progressTitle: TextStyle;
  progressStatNumber: TextStyle;
  progressStatLabel: TextStyle;
  strengthWeaknessLabel: TextStyle;
  strengthWeaknessValue: TextStyle;
  quickProgressAction: ViewStyle;
  quickProgressActionText: TextStyle;
  noProgressIcon: { color: string };
  noProgressText: TextStyle;
  startButton: ViewStyle;
  startButtonText: TextStyle;
}

interface ProgressWidgetsProps {
  navigation: NavigationProp<any>;
  themeStyles: ThemeStyles;
  t: (key: string) => string;
  hierarchicalInsights: HierarchicalInsights;
}

interface HierarchicalInsights {
  topSubject: TopSubject | null;
  recentCourse: RecentCourse | null;
  improvingSubject: any | null;
  needsAttentionSubject: NeedsAttentionSubject | null;
  totalSubjects: number;
  totalCourses: number;
}

interface TopSubject {
  name: string;
  score: number;
  courses: number;
  color: string;
  icon: string;
}

interface RecentCourse {
  name: string;
  subject: string;
  score: number;
  lastStudied: string;
  color: string;
}

interface NeedsAttentionSubject {
  name: string;
  score: number;
  color: string;
  icon: string;
}

interface ProgressData {
  recentScores: number[];
  improvementTrend: number;
  strongestCategory: string;
  weakestCategory: string;
  totalQuizzes: number;
  averageScore: number;
}

interface Styles {
  progressWidget: ViewStyle;
  progressHeader: ViewStyle;
  progressTitle: TextStyle;
  progressContent: ViewStyle;
  progressStatsRow: ViewStyle;
  progressStat: ViewStyle;
  progressStatNumber: TextStyle;
  progressStatLabel: TextStyle;
  trendContainer: ViewStyle;
  strengthsWeaknessesContainer: ViewStyle;
  strengthWeaknessItem: ViewStyle;
  strengthIndicator: ViewStyle;
  weaknessIndicator: ViewStyle;
  strengthWeaknessText: ViewStyle;
  strengthWeaknessLabel: TextStyle;
  strengthWeaknessValue: TextStyle;
  quickProgressAction: ViewStyle;
  quickProgressActionText: TextStyle;
  noProgressContainer: ViewStyle;
  noProgressText: TextStyle;
  startButton: ViewStyle;
  startButtonText: TextStyle;
  hierarchicalOverview: ViewStyle;
  hierarchicalStat: ViewStyle;
  hierarchicalStatNumber: TextStyle;
  hierarchicalStatLabel: TextStyle;
  hierarchicalInsight: ViewStyle;
  insightHeader: ViewStyle;
  insightIcon: ViewStyle;
  insightContent: ViewStyle;
  insightTitle: TextStyle;
  insightSubject: TextStyle;
  insightDetail: TextStyle;
  hierarchicalAction: ViewStyle;
  hierarchicalActionText: TextStyle;
}

/**
 * ProgressWidget - Shows quiz progress, trends, and category strengths/weaknesses
 */
export const ProgressWidget: React.FC<{
  navigation: NavigationProp<any>;
  themeStyles: ThemeStyles;
  t: (key: string) => string;
}> = ({ navigation, themeStyles, t }) => {
  const [progressData, setProgressData] = useState<ProgressData>({
    recentScores: [],
    improvementTrend: 0,
    strongestCategory: '',
    weakestCategory: '',
    totalQuizzes: 0,
    averageScore: 0,
  });

  useEffect(() => {
    loadProgressWidget();
  }, []);

  const loadProgressWidget = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const quizHistory = await AsyncStorage.getItem(`quizHistory_${user.uid}`);

      if (quizHistory) {
        const quizzes = JSON.parse(quizHistory);

        const recentScores = quizzes.slice(0, 5).map((quiz: any) => quiz.results?.percentage || 0);
        const improvementTrend = calculateTrend(recentScores);
        const categoryStats = calculateCategoryStats(quizzes);

        setProgressData({
          recentScores,
          improvementTrend,
          strongestCategory: categoryStats.strongest,
          weakestCategory: categoryStats.weakest,
          totalQuizzes: quizzes.length,
          averageScore: calculateOverallAverage(quizzes),
        });
      }
    } catch (error) {
      logger.error('Error loading progress widget:', error);
    }
  };

  const calculateTrend = (scores: number[]): number => {
    if (scores.length < 2) return 0;
    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return Math.round(recentAvg - olderAvg);
  };

  const calculateCategoryStats = (quizzes: any[]): { strongest: string; weakest: string } => {
    const categoryMap = new Map();

    quizzes.forEach((quiz) => {
      const category = quiz.metadata?.category || t('home.categories.general');
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, correct: 0 });
      }
      const stats = categoryMap.get(category);
      stats.total += quiz.results?.totalQuestions || 0;
      stats.correct += quiz.results?.score || 0;
    });

    let strongest = '';
    let weakest = '';
    let highestAccuracy = 0;
    let lowestAccuracy = 100;

    categoryMap.forEach((stats, category) => {
      if (stats.total > 0) {
        const accuracy = (stats.correct / stats.total) * 100;
        if (accuracy > highestAccuracy) {
          highestAccuracy = accuracy;
          strongest = category;
        }
        if (accuracy < lowestAccuracy) {
          lowestAccuracy = accuracy;
          weakest = category;
        }
      }
    });

    return { strongest, weakest };
  };

  const calculateOverallAverage = (quizzes: any[]): number => {
    const totalCorrect = quizzes.reduce((sum, quiz) => sum + (quiz.results?.score || 0), 0);
    const totalQuestions = quizzes.reduce(
      (sum, quiz) => sum + (quiz.results?.totalQuestions || 0),
      0
    );
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  };

  const getTrendIcon = (): { name: string; color: string } => {
    if (progressData.improvementTrend > 0) return { name: 'arrow-up', color: '#28a745' };
    if (progressData.improvementTrend < 0) return { name: 'arrow-down', color: '#dc3545' };
    return { name: 'minus', color: '#ffc107' };
  };

  const trendIcon = getTrendIcon();

  if (progressData.totalQuizzes === 0) {
    return (
      <Animatable.View
        animation="slideInUp"
        delay={700}
        style={[styles.progressWidget, themeStyles.progressWidget]}
      >
        <View style={styles.progressHeader}>
          <FontAwesome5 name="chart-line" size={20} color={themeStyles.progressIcon.color} />
          <Text style={[styles.progressTitle, themeStyles.progressTitle]}>Your Progress</Text>
        </View>
        <View style={styles.noProgressContainer}>
          <FontAwesome5 name="book-open" size={32} color={themeStyles.noProgressIcon.color} />
          <Text style={[styles.noProgressText, themeStyles.noProgressText]}>
            Take your first quiz to see your progress!
          </Text>
          <TouchableOpacity
            style={[styles.startButton, themeStyles.startButton]}
            onPress={() => navigation.navigate('Upload')}
          >
            <Text style={[styles.startButtonText, themeStyles.startButtonText]}>
              {t('home.actions.startLearning')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  }

  return (
    <Animatable.View
      animation="slideInUp"
      delay={700}
      style={[styles.progressWidget, themeStyles.progressWidget]}
    >
      <View style={styles.progressHeader}>
        <FontAwesome5 name="chart-line" size={20} color={themeStyles.progressIcon.color} />
        <Text style={[styles.progressTitle, themeStyles.progressTitle]}>Your Progress</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProgressTracker')}>
          <FontAwesome5
            name="external-link-alt"
            size={16}
            color={themeStyles.progressIcon.color}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContent}>
        <View style={styles.progressStatsRow}>
          <View style={styles.progressStat}>
            <Text style={[styles.progressStatNumber, themeStyles.progressStatNumber]}>
              {progressData.averageScore}%
            </Text>
            <Text style={[styles.progressStatLabel, themeStyles.progressStatLabel]}>Overall</Text>
          </View>

          <View style={styles.progressStat}>
            <View style={styles.trendContainer}>
              <FontAwesome5 name={trendIcon.name} size={16} color={trendIcon.color} />
              <Text style={[styles.progressStatNumber, { color: trendIcon.color }]}>
                {progressData.improvementTrend === 0 ? 0 : Math.abs(progressData.improvementTrend)}%
              </Text>
            </View>
            <Text style={[styles.progressStatLabel, themeStyles.progressStatLabel]}>Trend</Text>
          </View>

          <View style={styles.progressStat}>
            <Text style={[styles.progressStatNumber, themeStyles.progressStatNumber]}>
              {progressData.totalQuizzes}
            </Text>
            <Text style={[styles.progressStatLabel, themeStyles.progressStatLabel]}>
              {t('home.quickStats.quizzes')}
            </Text>
          </View>
        </View>

        <View style={styles.strengthsWeaknessesContainer}>
          <View style={styles.strengthWeaknessItem}>
            <View style={styles.strengthIndicator}>
              <FontAwesome5 name="trophy" size={12} color="#28a745" />
            </View>
            <View style={styles.strengthWeaknessText}>
              <Text style={[styles.strengthWeaknessLabel, themeStyles.strengthWeaknessLabel]}>
                {t('home.analysis.strengths')}
              </Text>
              <Text style={[styles.strengthWeaknessValue, themeStyles.strengthWeaknessValue]}>
                {progressData.strongestCategory || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.strengthWeaknessItem}>
            <View style={styles.weaknessIndicator}>
              <FontAwesome5 name="exclamation-triangle" size={12} color="#ffc107" />
            </View>
            <View style={styles.strengthWeaknessText}>
              <Text style={[styles.strengthWeaknessLabel, themeStyles.strengthWeaknessLabel]}>
                Focus On
              </Text>
              <Text style={[styles.strengthWeaknessValue, themeStyles.strengthWeaknessValue]}>
                {progressData.weakestCategory || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.quickProgressAction, themeStyles.quickProgressAction]}
          onPress={() => navigation.navigate('ProgressTracker')}
        >
          <Text style={[styles.quickProgressActionText, themeStyles.quickProgressActionText]}>
            View Detailed Analytics
          </Text>
          <FontAwesome5
            name="arrow-right"
            size={14}
            color={themeStyles.quickProgressActionText.color}
          />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
};

/**
 * HierarchicalInsightsWidget - Shows hierarchical course and subject insights
 */
export const HierarchicalInsightsWidget: React.FC<ProgressWidgetsProps> = ({
  navigation,
  themeStyles,
  t,
  hierarchicalInsights,
}) => {
  const { totalSubjects, totalCourses, topSubject, recentCourse, needsAttentionSubject } =
    hierarchicalInsights;

  if (totalSubjects === 0) {
    return (
      <Animatable.View
        animation="slideInUp"
        delay={750}
        style={[styles.progressWidget, themeStyles.progressWidget]}
      >
        <View style={styles.progressHeader}>
          <FontAwesome5 name="sitemap" size={20} color={themeStyles.progressIcon.color} />
          <Text style={[styles.progressTitle, themeStyles.progressTitle]}>Course Insights</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProgressTracker')}>
            <FontAwesome5
              name="external-link-alt"
              size={16}
              color={themeStyles.progressIcon.color}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.noProgressContainer}>
          <FontAwesome5 name="graduation-cap" size={32} color={themeStyles.noProgressIcon.color} />
          <Text style={[styles.noProgressText, themeStyles.noProgressText]}>
            Take hierarchical quizzes to see course-level insights!
          </Text>
          <TouchableOpacity
            style={[styles.startButton, themeStyles.startButton]}
            onPress={() => navigation.navigate('AskAlexandria', { hierarchicalMode: true })}
          >
            <Text style={[styles.startButtonText, themeStyles.startButtonText]}>
              Explore Subjects
            </Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  }

  return (
    <Animatable.View
      animation="slideInUp"
      delay={750}
      style={[styles.progressWidget, themeStyles.progressWidget]}
    >
      <View style={styles.progressHeader}>
        <FontAwesome5 name="sitemap" size={20} color={themeStyles.progressIcon.color} />
        <Text style={[styles.progressTitle, themeStyles.progressTitle]}>Course Insights</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProgressTracker', { activeTab: 'courses' })}
        >
          <FontAwesome5
            name="external-link-alt"
            size={16}
            color={themeStyles.progressIcon.color}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContent}>
        <View style={styles.hierarchicalOverview}>
          <View style={styles.hierarchicalStat}>
            <Text style={[styles.hierarchicalStatNumber, themeStyles.progressStatNumber]}>
              {totalSubjects}
            </Text>
            <Text style={[styles.hierarchicalStatLabel, themeStyles.progressStatLabel]}>
              Subjects
            </Text>
          </View>
          <View style={styles.hierarchicalStat}>
            <Text style={[styles.hierarchicalStatNumber, themeStyles.progressStatNumber]}>
              {totalCourses}
            </Text>
            <Text style={[styles.hierarchicalStatLabel, themeStyles.progressStatLabel]}>
              Courses
            </Text>
          </View>
        </View>

        {topSubject && (
          <View style={styles.hierarchicalInsight}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: topSubject.color + '20' }]}>
                <FontAwesome5 name={topSubject.icon} size={16} color={topSubject.color} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, themeStyles.progressStatLabel]}>
                  🏆 Top Subject
                </Text>
                <Text style={[styles.insightSubject, themeStyles.progressStatNumber]}>
                  {topSubject.name}
                </Text>
                <Text style={[styles.insightDetail, themeStyles.progressStatLabel]}>
                  {topSubject.score}% • {topSubject.courses} courses
                </Text>
              </View>
            </View>
          </View>
        )}

        {recentCourse && (
          <View style={styles.hierarchicalInsight}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: recentCourse.color + '20' }]}>
                <FontAwesome5 name="clock" size={16} color={recentCourse.color} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, themeStyles.progressStatLabel]}>
                  📚 Recent Course
                </Text>
                <Text style={[styles.insightSubject, themeStyles.progressStatNumber]}>
                  {recentCourse.name}
                </Text>
                <Text style={[styles.insightDetail, themeStyles.progressStatLabel]}>
                  in {recentCourse.subject} • {recentCourse.score}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {needsAttentionSubject && (
          <View style={styles.hierarchicalInsight}>
            <View style={styles.insightHeader}>
              <View
                style={[styles.insightIcon, { backgroundColor: needsAttentionSubject.color + '20' }]}
              >
                <FontAwesome5 name="exclamation-triangle" size={16} color="#F39C12" />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, themeStyles.progressStatLabel]}>
                  ⚠️ Needs Practice
                </Text>
                <Text style={[styles.insightSubject, themeStyles.progressStatNumber]}>
                  {needsAttentionSubject.name}
                </Text>
                <Text style={[styles.insightDetail, themeStyles.progressStatLabel]}>
                  {needsAttentionSubject.score}% average
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.hierarchicalAction, themeStyles.quickProgressAction]}
          onPress={() => navigation.navigate('AskAlexandria', { hierarchicalMode: true })}
        >
          <Text style={[styles.hierarchicalActionText, themeStyles.quickProgressActionText]}>
            Study More Courses
          </Text>
          <FontAwesome5
            name="arrow-right"
            size={14}
            color={themeStyles.quickProgressActionText.color}
          />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create<Styles>({
  progressWidget: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  progressContent: {
    gap: 16,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strengthsWeaknessesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  strengthWeaknessItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  strengthIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  weaknessIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  strengthWeaknessText: {
    flex: 1,
  },
  strengthWeaknessLabel: {
    fontSize: 10,
    opacity: 0.7,
    marginBottom: 2,
  },
  strengthWeaknessValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickProgressAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickProgressActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noProgressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noProgressText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
    opacity: 0.7,
  },
  startButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hierarchicalOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  hierarchicalStat: {
    alignItems: 'center',
  },
  hierarchicalStatNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  hierarchicalStatLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  hierarchicalInsight: {
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 2,
  },
  insightSubject: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightDetail: {
    fontSize: 11,
    opacity: 0.7,
  },
  hierarchicalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
  },
  hierarchicalActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
