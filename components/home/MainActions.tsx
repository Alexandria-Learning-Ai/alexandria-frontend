import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ViewStyle, TextStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import UnifiedNotificationService from '../../utils/UnifiedNotificationService';
import logger from '../../utils/logger';

// Type definitions
interface ThemeStyles {
  primaryAction: ViewStyle;
  primaryActionIcon: ViewStyle;
  primaryActionIconColor: { color: string };
  primaryActionTitle: TextStyle;
  primaryActionSubtitle: TextStyle;
  secondaryAction: ViewStyle;
  secondaryActionTitle: TextStyle;
  secondaryActionSubtitle: TextStyle;
  additionalFeatureButton: ViewStyle;
  additionalFeatureIcon: { color: string };
  additionalFeatureText: TextStyle;
  askAlexandriaButton: ViewStyle;
  askAlexandriaText: TextStyle;
  askAlexandriaIcon: { color: string };
}

interface MainActionsProps {
  navigation: NavigationProp<any>;
  themeStyles: ThemeStyles;
  t: (key: string) => string;
  onShowFlashcardDashboard: () => void;
}

interface Styles {
  actionsContainer: ViewStyle;
  primaryActionContainer: ViewStyle;
  primaryAction: ViewStyle;
  primaryActionIcon: ViewStyle;
  primaryActionTitle: TextStyle;
  primaryActionSubtitle: TextStyle;
  symmetricalActionsRow: ViewStyle;
  symmetricalActionCard: ViewStyle;
  secondaryActionIcon: ViewStyle;
  historyIcon: ViewStyle;
  studyMaterialsIcon: ViewStyle;
  scheduleExamIcon: ViewStyle;
  audioPlaylistsIcon: ViewStyle;
  bookStudyIcon: ViewStyle;
  secondaryActionTitle: TextStyle;
  secondaryActionSubtitle: TextStyle;
  additionalFeaturesRow: ViewStyle;
  additionalFeature: ViewStyle;
  additionalFeatureButton: ViewStyle;
  additionalFeatureText: TextStyle;
  askAlexandriaContainer: ViewStyle;
  askAlexandriaButton: ViewStyle;
  askAlexandriaText: TextStyle;
}

/**
 * SmartInsightsButton - Shows AI-powered learning insights and notifications
 */
const SmartInsightsButton: React.FC<{
  navigation: NavigationProp<any>;
  themeStyles: ThemeStyles;
  t: (key: string) => string;
}> = ({ navigation, themeStyles, t }) => (
  <Animatable.View animation="fadeInUp" delay={1650} style={styles.additionalFeature}>
    <TouchableOpacity
      style={[styles.additionalFeatureButton, themeStyles.additionalFeatureButton]}
      onPress={async () => {
        const user = auth.currentUser;
        if (user) {
          try {
            const status = await UnifiedNotificationService.getNotificationStatus(user.uid);

            if (status && status.analysisSnapshot) {
              const analysis = status.analysisSnapshot;
              let message = `Progress: ${analysis.trend || 'Stable'}\n`;
              message += `Overall Score: ${analysis.overallScore || 'N/A'}%\n`;

              if (analysis.topFocusArea) {
                message += `\nFocus Area: ${analysis.topFocusArea}`;
              }

              if (analysis.examReadiness && analysis.examReadiness.length > 0) {
                const nextExam = analysis.examReadiness[0];
                message += `\nNext Exam: ${nextExam.title} (${nextExam.readiness}% ready)`;
              }

              message += `\n\nActive Notifications: ${status.activeCounts?.total || 0}`;

              Alert.alert('🧠 Your Learning Dashboard', message, [
                { text: 'View Details', onPress: () => navigation.navigate('ProgressTracker') },
                {
                  text: 'Refresh Analysis',
                  onPress: async () => {
                    await UnifiedNotificationService.scheduleIntelligentNotifications(
                      user.uid,
                      'manual'
                    );
                    Alert.alert(
                      '✨ Analysis Updated!',
                      'Your learning insights have been refreshed.'
                    );
                  },
                },
                { text: 'Got it!', style: 'default' },
              ]);
            } else {
              Alert.alert(
                '🌟 Keep Learning!',
                'Take more quizzes to unlock personalized insights from Alexandria!',
                [
                  {
                    text: t('home.actions.takeQuiz'),
                    onPress: () => navigation.navigate('Upload'),
                  },
                  { text: 'OK', style: 'default' },
                ]
              );
            }
          } catch (error) {
            logger.error('Error getting insights:', error);
            Alert.alert('Error', 'Could not load insights. Please try again.');
          }
        }
      }}
      activeOpacity={0.8}
    >
      <FontAwesome5
        name="brain"
        size={20}
        color={themeStyles.additionalFeatureIcon.color}
      />
      <Text style={[styles.additionalFeatureText, themeStyles.additionalFeatureText]}>
        Smart Insights
      </Text>
    </TouchableOpacity>
  </Animatable.View>
);

/**
 * MainActions - Primary action buttons and navigation shortcuts
 *
 * Features:
 * - Take Quiz primary action
 * - Ask Alexandria AI button
 * - Quiz History, Study Materials, Schedule Exam cards
 * - Smart Insights, Flashcards, Exam List buttons
 * - Staggered animations for visual appeal
 */
const MainActions: React.FC<MainActionsProps> = ({
  navigation,
  themeStyles,
  t,
  onShowFlashcardDashboard,
}) => {
  return (
    <View style={styles.actionsContainer}>
      {/* Primary Action - Take Quiz */}
      <Animatable.View animation="bounceIn" delay={900} style={styles.primaryActionContainer}>
        <TouchableOpacity
          style={[styles.primaryAction, themeStyles.primaryAction]}
          onPress={() => navigation.navigate('Upload')}
          activeOpacity={0.8}
        >
          <View style={[styles.primaryActionIcon, themeStyles.primaryActionIcon]}>
            <FontAwesome5
              name="plus"
              size={32}
              color={themeStyles.primaryActionIconColor.color}
            />
          </View>
          <Text style={[styles.primaryActionTitle, themeStyles.primaryActionTitle]}>
            {t('home.actions.takeNewQuiz')}
          </Text>
          <Text style={[styles.primaryActionSubtitle, themeStyles.primaryActionSubtitle]}>
            {t('home.actions.uploadAndStartLearning')}
          </Text>
        </TouchableOpacity>
      </Animatable.View>

      {/* Ask Alexandria Button */}
      <Animatable.View animation="fadeInUp" delay={1000} style={styles.askAlexandriaContainer}>
        <TouchableOpacity
          style={[styles.askAlexandriaButton, themeStyles.askAlexandriaButton]}
          onPress={() => navigation.navigate('AskAlexandria')}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="comments"
            size={18}
            color={themeStyles.askAlexandriaIcon.color}
          />
          <Text style={[styles.askAlexandriaText, themeStyles.askAlexandriaText]}>
            {t('home.actions.askAlexandriaForQuiz')}
          </Text>
          <FontAwesome5
            name="arrow-right"
            size={14}
            color={themeStyles.askAlexandriaIcon.color}
          />
        </TouchableOpacity>
      </Animatable.View>

      {/* First Row: Quiz History & Study Materials */}
      <View style={styles.symmetricalActionsRow}>
        <Animatable.View animation="slideInLeft" delay={1100} style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.symmetricalActionCard, themeStyles.secondaryAction]}
            onPress={() => navigation.navigate('QuizHistory')}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryActionIcon, styles.historyIcon]}>
              <FontAwesome5 name="history" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.secondaryActionTitle, themeStyles.secondaryActionTitle]}>
              Quiz History
            </Text>
            <Text
              style={[styles.secondaryActionSubtitle, themeStyles.secondaryActionSubtitle]}
            >
              Review past quizzes
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="slideInRight" delay={1200} style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.symmetricalActionCard, themeStyles.secondaryAction]}
            onPress={() => navigation.navigate('StudyMaterials')}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryActionIcon, styles.studyMaterialsIcon]}>
              <FontAwesome5 name="book-open" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.secondaryActionTitle, themeStyles.secondaryActionTitle]}>
              Study Materials
            </Text>
            <Text
              style={[styles.secondaryActionSubtitle, themeStyles.secondaryActionSubtitle]}
            >
              Browse extracted content
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>

      {/* Second Row: Schedule Exam & Audio Playlists */}
      <View style={styles.symmetricalActionsRow}>
        <Animatable.View animation="slideInLeft" delay={1300} style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.symmetricalActionCard, themeStyles.secondaryAction]}
            onPress={() => navigation.navigate('ScheduleExamScreen')}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryActionIcon, styles.scheduleExamIcon]}>
              <FontAwesome5 name="calendar-plus" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.secondaryActionTitle, themeStyles.secondaryActionTitle]}>
              Schedule Exam
            </Text>
            <Text
              style={[styles.secondaryActionSubtitle, themeStyles.secondaryActionSubtitle]}
            >
              Set exam reminders
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="slideInRight" delay={1400} style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.symmetricalActionCard, themeStyles.secondaryAction]}
            onPress={() => navigation.navigate('AudioPlaylists')}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryActionIcon, styles.audioPlaylistsIcon]}>
              <FontAwesome5 name="headphones" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.secondaryActionTitle, themeStyles.secondaryActionTitle]}>
              Audio Playlists
            </Text>
            <Text
              style={[styles.secondaryActionSubtitle, themeStyles.secondaryActionSubtitle]}
            >
              Manage audio playlists
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>

      {/* Third Row: Book Study Mode & Flashcards */}
      <View style={styles.symmetricalActionsRow}>
        <Animatable.View animation="slideInLeft" delay={1500} style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.symmetricalActionCard, themeStyles.secondaryAction]}
            onPress={() => navigation.navigate('MaterialLibrary')}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryActionIcon, styles.bookStudyIcon]}>
              <FontAwesome5 name="book-reader" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.secondaryActionTitle, themeStyles.secondaryActionTitle]}>
              Book Study
            </Text>
            <Text
              style={[styles.secondaryActionSubtitle, themeStyles.secondaryActionSubtitle]}
            >
              Read and study materials
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="slideInRight" delay={1600} style={{ flex: 1 }}>
          {/* Empty slot for future feature */}
        </Animatable.View>
      </View>

      {/* Additional Features Row */}
      <View style={styles.additionalFeaturesRow}>
        <SmartInsightsButton navigation={navigation} themeStyles={themeStyles} t={t} />

        <Animatable.View animation="fadeInUp" delay={1700} style={styles.additionalFeature}>
          <TouchableOpacity
            style={[styles.additionalFeatureButton, themeStyles.additionalFeatureButton]}
            onPress={onShowFlashcardDashboard}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="layer-group"
              size={20}
              color={themeStyles.additionalFeatureIcon.color}
            />
            <Text style={[styles.additionalFeatureText, themeStyles.additionalFeatureText]}>
              Study Cards
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={1750} style={styles.additionalFeature}>
          <TouchableOpacity
            style={[styles.additionalFeatureButton, themeStyles.additionalFeatureButton]}
            onPress={() => navigation.navigate('ExamListScreen')}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="list"
              size={20}
              color={themeStyles.additionalFeatureIcon.color}
            />
            <Text style={[styles.additionalFeatureText, themeStyles.additionalFeatureText]}>
              {t('home.exam.viewExams')}
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create<Styles>({
  actionsContainer: {
    marginBottom: 30,
  },
  primaryActionContainer: {
    marginBottom: 24,
  },
  primaryAction: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryActionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  primaryActionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  symmetricalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  symmetricalActionCard: {
    flex: 1,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  secondaryActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyIcon: {
    backgroundColor: '#1A2C5B',
  },
  studyMaterialsIcon: {
    backgroundColor: '#6F4E37',
  },
  scheduleExamIcon: {
    backgroundColor: '#28a745',
  },
  audioPlaylistsIcon: {
    backgroundColor: '#D4AF37',
  },
  bookStudyIcon: {
    backgroundColor: '#8B4513',
  },
  secondaryActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  secondaryActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 16,
  },
  additionalFeaturesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  additionalFeature: {
    flex: 1,
  },
  additionalFeatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  additionalFeatureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  askAlexandriaContainer: {
    marginBottom: 24,
  },
  askAlexandriaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  askAlexandriaText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});

export default MainActions;
