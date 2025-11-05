import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp } from '@react-navigation/native';
import { ExamScheduleService } from '../../utils/examScheduleService';

// Type definitions
interface Exam {
  title?: string;
  examTitle?: string;
  examDate: Date;
}

type UrgencyLevel = 'past' | 'today' | 'tomorrow' | 'urgent' | 'soon' | 'upcoming';

interface ExamCountdownWidgetProps {
  exam: Exam | null;
  daysLeft: number;
  navigation: NavigationProp<any>;
  t: (key: string) => string;
}

interface Styles {
  examCountdownContainer: ViewStyle;
  examCountdownContent: ViewStyle;
  examCountdownHeader: ViewStyle;
  examCountdownTitle: TextStyle;
  examTitle: TextStyle;
  countdownContainer: ViewStyle;
  countdownText: TextStyle;
  motivationalText: TextStyle;
  practicePrompt: ViewStyle;
  practiceText: TextStyle;
}

/**
 * ExamCountdownWidget - Displays next scheduled exam with countdown and motivational message
 *
 * Features:
 * - Dynamic urgency-based gradient colors
 * - Countdown display with emoji indicators
 * - Motivational messaging based on time remaining
 * - Tap to navigate to full exam list
 * - Animated entrance
 */
const ExamCountdownWidget: React.FC<ExamCountdownWidgetProps> = ({
  exam,
  daysLeft,
  navigation,
  t,
}) => {
  if (!exam) return null;

  const examTitle = exam.title || exam.examTitle || 'Exam';
  const urgency: UrgencyLevel = ExamScheduleService.getUrgencyLevel(daysLeft);
  const message = ExamScheduleService.getMotivationalMessage(daysLeft, examTitle);

  const urgencyColors: Record<UrgencyLevel, [string, string]> = {
    past: ['#6B7280', '#4B5563'],
    today: ['#EF4444', '#DC2626'],
    tomorrow: ['#F59E0B', '#D97706'],
    urgent: ['#F59E0B', '#D97706'],
    soon: ['#10B981', '#059669'],
    upcoming: ['#3B82F6', '#2563EB'],
  };

  const getCountdownText = (): string => {
    if (daysLeft === 0) return `🔥 ${(t('home.exam.today') || 'TODAY').toUpperCase()}!`;
    if (daysLeft === 1) return `⏰ ${(t('home.exam.tomorrow') || 'TOMORROW').toUpperCase()}`;
    return `⏳ ${daysLeft} ${daysLeft === 1 ? t('home.quickStats.day') || 'day' : t('home.quickStats.days') || 'days'} left`;
  };

  return (
    <Animatable.View animation="fadeInUp" delay={1600}>
      <TouchableOpacity onPress={() => navigation.navigate('ExamListScreen')}>
        <LinearGradient
          colors={urgencyColors[urgency] || urgencyColors.upcoming}
          style={styles.examCountdownContainer}
        >
          <View style={styles.examCountdownContent}>
            <View style={styles.examCountdownHeader}>
              <FontAwesome5 name="graduation-cap" size={20} color="#FFFFFF" />
              <Text style={styles.examCountdownTitle}>{t('home.exam.nextExam')}</Text>
            </View>

            <Text style={styles.examTitle}>{examTitle}</Text>

            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{getCountdownText()}</Text>
            </View>

            <Text style={styles.motivationalText}>{message}</Text>

            <View style={styles.practicePrompt}>
              <Text style={styles.practiceText}>📚 Ready to practice?</Text>
              <FontAwesome5 name="arrow-right" size={14} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create<Styles>({
  examCountdownContainer: {
    borderRadius: 15,
    marginVertical: 10,
    overflow: 'hidden',
  },
  examCountdownContent: {
    padding: 20,
  },
  examCountdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  examCountdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  countdownContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  motivationalText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  practicePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  practiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ExamCountdownWidget;
