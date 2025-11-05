import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  ViewStyle,
  TextStyle
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';
import { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

// Type definitions
type WeaknessAnalysisScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'WeaknessAnalysis'
>;

interface WeaknessAnalysisScreenProps {
  navigation: WeaknessAnalysisScreenNavigationProp;
  user?: any;
  subscription?: any;
  theme?: 'light' | 'dark';
}

interface ColorScheme {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
}

interface Weakness {
  topic: string;
  severity: number;
  totalIncorrect: number;
  totalQuestions: number;
}

interface WeaknessHistory {
  overallAccuracy: number;
  recommendations: Array<{ message: string }>;
}

interface RemedialQuiz {
  id: string;
  title: string;
  description: string;
  scheduledFor: string;
  questionCount: number;
}

interface WeaknessCardProps {
  weakness: Weakness;
  index: number;
}

interface PendingQuizCardProps {
  quiz: RemedialQuiz;
  index: number;
}

interface Styles {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  header: ViewStyle;
  headerContent: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  overviewCard: ViewStyle;
  overviewTitle: TextStyle;
  progressStats: ViewStyle;
  progressStat: ViewStyle;
  progressValue: TextStyle;
  progressLabel: TextStyle;
  trendContainer: ViewStyle;
  recommendationContainer: ViewStyle;
  recommendationTitle: TextStyle;
  recommendationText: TextStyle;
  weaknessCard: ViewStyle;
  cardHeader: ViewStyle;
  topicInfo: ViewStyle;
  topicName: TextStyle;
  severityBadge: ViewStyle;
  severityText: TextStyle;
  statsContainer: ViewStyle;
  statItem: ViewStyle;
  statValue: TextStyle;
  statLabel: TextStyle;
  focusButton: ViewStyle;
  focusButtonText: TextStyle;
  pendingCard: ViewStyle;
  pendingHeader: ViewStyle;
  pendingTitle: TextStyle;
  pendingDescription: TextStyle;
  pendingFooter: ViewStyle;
  scheduledTime: TextStyle;
  takeNowButton: ViewStyle;
  takeNowText: TextStyle;
  emptyCard: ViewStyle;
  emptyTitle: TextStyle;
  emptyText: TextStyle;
  actionButtons: ViewStyle;
  actionButton: ViewStyle;
  actionButtonText: TextStyle;
  footer: ViewStyle;
  footerText: TextStyle;
}

/**
 * WeaknessAnalysisScreen - AI-powered learning pattern analysis
 *
 * Features:
 * - Identifies student weaknesses from quiz history
 * - Generates targeted remedial quizzes
 * - Tracks improvement trends
 * - Provides personalized recommendations
 * - Displays scheduled focus quizzes
 */
const WeaknessAnalysisScreen: React.FC<WeaknessAnalysisScreenProps> = ({
  navigation,
  user,
  subscription,
  theme = 'light'
}) => {
  const [currentWeaknesses, setCurrentWeaknesses] = useState<Weakness[]>([]);
  const [weaknessHistory, setWeaknessHistory] = useState<WeaknessHistory[]>([]);
  const [pendingQuizzes, setPendingQuizzes] = useState<RemedialQuiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const colors: ColorScheme = theme === 'dark'
    ? {
        background: '#1A2C5B',
        surface: '#2C3E50',
        text: '#FFFFFF',
        textSecondary: '#BDC3C7',
        accent: '#E74C3C',
        success: '#22C55E',
        warning: '#FFD700',
        danger: '#E74C3C'
      }
    : {
        background: '#F8F4E3',
        surface: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        accent: '#E74C3C',
        success: '#28A745',
        warning: '#FFD700',
        danger: '#DC3545'
      };

  useEffect(() => {
    loadWeaknessData();
  }, []);

  const loadWeaknessData = async (): Promise<void> => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (currentUser) {
        const [weaknesses, history, pending] = await Promise.all([
          WeaknessAnalysisService.getCurrentWeaknesses(currentUser.uid),
          WeaknessAnalysisService.getWeaknessHistory(currentUser.uid),
          WeaknessAnalysisService.getPendingRemedialQuizzes(currentUser.uid)
        ]);

        setCurrentWeaknesses(weaknesses);
        setWeaknessHistory(history);
        setPendingQuizzes(pending);
      }
    } catch (error) {
      logger.error('Error loading weakness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: number): string => {
    if (severity > 70) return colors.danger;
    if (severity > 50) return colors.warning;
    if (severity > 30) return '#FF8C42';
    return colors.success;
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity > 70) return 'Critical';
    if (severity > 50) return 'High';
    if (severity > 30) return 'Medium';
    return 'Low';
  };

  const getPriorityIcon = (severity: number): string => {
    if (severity > 70) return 'exclamation-triangle';
    if (severity > 50) return 'exclamation-circle';
    return 'info-circle';
  };

  const requestFocusQuiz = async (weakness: Weakness): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const remedialQuiz = await WeaknessAnalysisService.generateRemedialQuiz(currentUser.uid, weakness);

      Alert.alert(
        '🎯 Focus Quiz Generated!',
        `Alexandria has prepared a ${remedialQuiz.questionCount}-question quiz focused on ${weakness.topic.replace('_', ' ')}.`,
        [
          { text: 'Schedule for Later', style: 'cancel' },
          {
            text: 'Start Now! 🚀',
            onPress: () => navigation.navigate('QuizScreen', {
              remedialQuiz: remedialQuiz,
              isRemedial: true,
              targetTopic: weakness.topic
            } as any)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not generate focus quiz. Please try again.');
    }
  };

  const WeaknessCard: React.FC<WeaknessCardProps> = ({ weakness, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 150}
      style={[styles.weaknessCard, { backgroundColor: colors.surface }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.topicInfo}>
          <FontAwesome5
            name={getPriorityIcon(weakness.severity)}
            size={20}
            color={getSeverityColor(weakness.severity)}
          />
          <Text style={[styles.topicName, { color: colors.text }]}>
            {weakness.topic.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(weakness.severity) }]}>
          <Text style={styles.severityText}>{getSeverityLabel(weakness.severity)}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {weakness.totalIncorrect}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Missed
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {weakness.totalQuestions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getSeverityColor(weakness.severity) }]}>
            {weakness.severity.toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Miss Rate
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.focusButton, { borderColor: colors.accent }]}
        onPress={() => requestFocusQuiz(weakness)}
      >
        <FontAwesome5 name="target" size={16} color={colors.accent} />
        <Text style={[styles.focusButtonText, { color: colors.accent }]}>
          Request Focus Quiz
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  const PendingQuizCard: React.FC<PendingQuizCardProps> = ({ quiz, index }) => (
    <Animatable.View
      animation="slideInRight"
      delay={index * 100}
      style={[styles.pendingCard, { backgroundColor: colors.surface }]}
    >
      <View style={styles.pendingHeader}>
        <FontAwesome5 name="clock" size={16} color={colors.warning} />
        <Text style={[styles.pendingTitle, { color: colors.text }]}>
          {quiz.title}
        </Text>
      </View>
      <Text style={[styles.pendingDescription, { color: colors.textSecondary }]}>
        {quiz.description}
      </Text>
      <View style={styles.pendingFooter}>
        <Text style={[styles.scheduledTime, { color: colors.textSecondary }]}>
          Scheduled: {new Date(quiz.scheduledFor).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={[styles.takeNowButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('QuizScreen', {
            remedialQuiz: quiz,
            isRemedial: true
          } as any)}
        >
          <Text style={styles.takeNowText}>Take Now</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  const ProgressOverview: React.FC = () => {
    if (weaknessHistory.length === 0) return null;

    const recentAnalysis = weaknessHistory[0];
    const improvementTrend = weaknessHistory.length > 1
      ? recentAnalysis.overallAccuracy - weaknessHistory[1].overallAccuracy
      : 0;

    return (
      <Animatable.View
        animation="fadeIn"
        style={[styles.overviewCard, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.overviewTitle, { color: colors.text }]}>
          📊 Learning Progress Overview
        </Text>

        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={[styles.progressValue, { color: colors.text }]}>
              {(recentAnalysis.overallAccuracy * 100).toFixed(0)}%
            </Text>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Latest Score
            </Text>
          </View>

          <View style={styles.progressStat}>
            <View style={styles.trendContainer}>
              <FontAwesome5
                name={improvementTrend > 0 ? 'arrow-up' : improvementTrend < 0 ? 'arrow-down' : 'minus'}
                size={16}
                color={improvementTrend > 0 ? colors.success : improvementTrend < 0 ? colors.danger : colors.textSecondary}
              />
              <Text style={[
                styles.progressValue,
                { color: improvementTrend > 0 ? colors.success : improvementTrend < 0 ? colors.danger : colors.textSecondary }
              ]}>
                {Math.abs(improvementTrend * 100).toFixed(0)}%
              </Text>
            </View>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Trend
            </Text>
          </View>

          <View style={styles.progressStat}>
            <Text style={[styles.progressValue, { color: colors.text }]}>
              {currentWeaknesses.length}
            </Text>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Focus Areas
            </Text>
          </View>
        </View>

        {recentAnalysis.recommendations.length > 0 && (
          <View style={styles.recommendationContainer}>
            <Text style={[styles.recommendationTitle, { color: colors.text }]}>
              🎯 Alexandria's Recommendation:
            </Text>
            <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
              {recentAnalysis.recommendations[0].message}
            </Text>
          </View>
        )}
      </Animatable.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Analyzing your learning patterns...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={theme === 'dark'
          ? ['#1A2C5B', '#2C3E50']
          : ['#F8F4E3', '#ECF0F1']
        }
        style={styles.header}
      >
        <Animatable.View animation="fadeInDown" style={styles.headerContent}>
          <FontAwesome5 name="brain" size={32} color={colors.accent} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Alexandria's Analysis
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            AI-powered insights into your learning patterns
          </Text>
        </Animatable.View>
      </LinearGradient>

      <ProgressOverview />

      {/* Current Weaknesses Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🎯 Current Focus Areas ({currentWeaknesses.length})
        </Text>

        {currentWeaknesses.length > 0 ? (
          currentWeaknesses.map((weakness, index) => (
            <WeaknessCard key={weakness.topic} weakness={weakness} index={index} />
          ))
        ) : (
          <Animatable.View
            animation="fadeIn"
            style={[styles.emptyCard, { backgroundColor: colors.surface }]}
          >
            <FontAwesome5 name="trophy" size={48} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Great Work!
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No major weaknesses detected. Keep taking quizzes to maintain your progress!
            </Text>
          </Animatable.View>
        )}
      </View>

      {/* Pending Quizzes Section */}
      {pendingQuizzes.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ⏰ Scheduled Focus Quizzes ({pendingQuizzes.length})
          </Text>

          {pendingQuizzes.map((quiz, index) => (
            <PendingQuizCard key={quiz.id} quiz={quiz} index={index} />
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          ⚡ Quick Actions
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Upload')}
          >
            <FontAwesome5 name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Take New Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={loadWeaknessData}
          >
            <FontAwesome5 name="sync" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Refresh Analysis</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Alexandria analyzes your quiz patterns to identify areas for improvement and generates targeted practice quizzes.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  overviewCard: {
    margin: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 18,
  },
  weaknessCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  focusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  focusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  pendingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pendingDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  pendingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduledTime: {
    fontSize: 12,
  },
  takeNowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  takeNowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default WeaknessAnalysisScreen;
