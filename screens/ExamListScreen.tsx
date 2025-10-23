import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  ListRenderItem
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import SafeBackButton from '../components/SafeBackButton';
import { ExamScheduleService } from '../utils/examScheduleService';
import UnifiedNotificationService from '../utils/UnifiedNotificationService';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';
import { RootStackParamList } from '../types';

// Type definitions
type ExamListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ExamListScreen'
>;

interface ExamListScreenProps {
  navigation: ExamListScreenNavigationProp;
}

interface Exam {
  id: string;
  examTitle?: string;
  title?: string;
  examDate: Date;
  time?: string;
  subject?: string;
  reminderEnabled?: boolean;
  isRecurring?: boolean;
}

type UrgencyLevel = 'past' | 'today' | 'tomorrow' | 'urgent' | 'soon' | 'upcoming';

interface UrgencyColors {
  [key: string]: [string, string];
}

interface UrgencyIcons {
  [key: string]: string;
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerTitle: TextStyle;
  headerActions: ViewStyle;
  bulkButton: ViewStyle;
  addButton: ViewStyle;
  statsBar: ViewStyle;
  statItem: ViewStyle;
  statNumber: TextStyle;
  statLabel: TextStyle;
  content: ViewStyle;
  centerContent: ViewStyle;
  loadingText: TextStyle;
  emptyTitle: TextStyle;
  emptySubtitle: TextStyle;
  scheduleFirstButton: ViewStyle;
  scheduleFirstGradient: ViewStyle;
  scheduleFirstText: TextStyle;
  listContent: ViewStyle;
  examCard: ViewStyle;
  examCardGradient: ViewStyle;
  examCardContent: ViewStyle;
  examHeader: ViewStyle;
  examTitleContainer: ViewStyle;
  examTitle: TextStyle;
  examOptionsContainer: ViewStyle;
  optionsButton: ViewStyle;
  examSubject: TextStyle;
  examDate: TextStyle;
  countdownContainer: ViewStyle;
  countdownText: TextStyle;
  motivationalText: TextStyle;
  buttonContainer: ViewStyle;
  practiceButton: ViewStyle;
  practiceButtonText: TextStyle;
  uploadButton: ViewStyle;
  uploadButtonText: TextStyle;
  smartReminderContainer: ViewStyle;
  smartReminderText: TextStyle;
  reminderStatusContainer: ViewStyle;
  reminderStatusText: TextStyle;
}

/**
 * ExamListScreen - View and manage all scheduled exams
 *
 * Features:
 * - Display all scheduled exams with urgency levels
 * - Smart motivational messages based on exam proximity
 * - Edit, delete, and reschedule exam reminders
 * - Quick stats overview
 * - Pull-to-refresh
 * - Direct navigation to study tools
 * - Bulk scheduling options
 */
const ExamListScreen: React.FC<ExamListScreenProps> = ({ navigation }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadExams = async (): Promise<void> => {
    try {
      const userExams = await ExamScheduleService.getUserExams();
      setExams(userExams);
      logger.info('📚 Loaded exams:', userExams.length);
    } catch (error) {
      logger.error('Error loading exams:', error);
      Alert.alert('Error', 'Failed to load exams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExams();
    }, [])
  );

  const onRefresh = (): void => {
    setRefreshing(true);
    loadExams();
  };

  const handleDeleteExam = (exam: Exam): void => {
    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete "${exam.examTitle || exam.title}"?\n\nThis will also cancel all related reminders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the exam
              await ExamScheduleService.deleteExam(exam.id);

              // Refresh all notifications after deletion
              const user = auth.currentUser;
              if (user) {
                await UnifiedNotificationService.scheduleIntelligentNotifications(
                  user.uid,
                  null,
                  'exam_deleted'
                );
              }

              loadExams();
              Alert.alert('Deleted', 'Exam and all related reminders have been removed.');
            } catch (error) {
              logger.error('Error deleting exam:', error);
              Alert.alert('Error', 'Failed to delete exam');
            }
          }
        }
      ]
    );
  };

  const getMotivationalMessage = (daysLeft: number, examTitle: string): string => {
    const messages: { [key: string]: string[] } = {
      '0': [
        `🔥 Your ${examTitle} is TODAY! You've prepared for this moment!`,
        `⚡ It's showtime! Your ${examTitle} awaits - you're ready!`,
        `🎯 Today's the day for ${examTitle}! Trust your preparation!`
      ],
      '1': [
        `⚡ Final stretch! Your ${examTitle} is tomorrow!`,
        `🔥 One more sleep until ${examTitle} - you've got this!`,
        `🎯 Tomorrow's ${examTitle} - time for final review!`
      ],
      urgent: [
        `🎯 Crunch time! ${daysLeft} days to ace your ${examTitle}`,
        `⚡ ${daysLeft} days left - time to intensify your ${examTitle} prep!`,
        `🔥 ${daysLeft} days to show what you know in ${examTitle}!`
      ],
      soon: [
        `📚 One week left! Time to master ${examTitle}`,
        `💪 ${daysLeft} days to perfect your ${examTitle} knowledge`,
        `🌟 ${daysLeft} days - the final preparation phase for ${examTitle}`
      ],
      upcoming: [
        `🌟 ${daysLeft} days to prepare for ${examTitle}. Start strong!`,
        `📚 ${daysLeft} days until ${examTitle} - build your foundation now`,
        `💪 ${daysLeft} days ahead - perfect time to begin ${examTitle} prep`
      ],
      past: [
        `📚 Hope your ${examTitle} went well! How did it feel?`,
        `🎓 ${examTitle} is done! Time to focus on what's next`,
        `✅ ${examTitle} completed! Great job on finishing!`
      ]
    };

    let messageArray: string[];
    if (daysLeft < 0) messageArray = messages.past;
    else if (daysLeft === 0) messageArray = messages['0'];
    else if (daysLeft === 1) messageArray = messages['1'];
    else if (daysLeft <= 3) messageArray = messages.urgent;
    else if (daysLeft <= 7) messageArray = messages.soon;
    else messageArray = messages.upcoming;

    return messageArray[Math.floor(Math.random() * messageArray.length)];
  };

  const getUrgencyLevel = (daysLeft: number): UrgencyLevel => {
    if (daysLeft < 0) return 'past';
    if (daysLeft === 0) return 'today';
    if (daysLeft === 1) return 'tomorrow';
    if (daysLeft <= 3) return 'urgent';
    if (daysLeft <= 7) return 'soon';
    return 'upcoming';
  };

  const urgencyColors: UrgencyColors = {
    past: ['#6B7280', '#4B5563'],
    today: ['#DC2626', '#B91C1C'],
    tomorrow: ['#EA580C', '#C2410C'],
    urgent: ['#D97706', '#B45309'],
    soon: ['#059669', '#047857'],
    upcoming: ['#2563EB', '#1D4ED8']
  };

  const urgencyIcons: UrgencyIcons = {
    past: 'history',
    today: 'fire',
    tomorrow: 'exclamation-triangle',
    urgent: 'clock',
    soon: 'calendar-week',
    upcoming: 'calendar-alt'
  };

  const handleEditExam = (exam: Exam): void => {
    navigation.navigate('ScheduleExamScreen' as any, { examToEdit: exam });
  };

  const handleRescheduleNotifications = async (exam: Exam): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const results = await UnifiedNotificationService.scheduleIntelligentNotifications(
        user.uid,
        exam.id,
        'notifications_rescheduled'
      );

      if (results.examNotifications || results.smartNotifications) {
        Alert.alert(
          'Reminders Updated! 🔔',
          results.summary || 'Your exam reminders have been rescheduled with the latest insights!'
        );
      } else {
        Alert.alert('Permission Required', 'Please enable notifications to receive reminders.');
      }
    } catch (error) {
      logger.error('Error rescheduling notifications:', error);
      Alert.alert('Error', 'Failed to reschedule reminders.');
    }
  };

  const renderExamCard: ListRenderItem<Exam> = ({ item }) => {
    const examTitle = item.examTitle || item.title || 'Untitled Exam';
    const examDate = item.examDate;
    const examTime = item.time;
    const subject = item.subject;

    const daysLeft = ExamScheduleService.calculateDaysUntilExam(examDate);
    const urgencyLevel = getUrgencyLevel(daysLeft);
    const motivationalMessage = getMotivationalMessage(daysLeft, examTitle);

    return (
      <View style={styles.examCard}>
        <LinearGradient
          colors={urgencyColors[urgencyLevel]}
          style={styles.examCardGradient}
        >
          <View style={styles.examCardContent}>
            <View style={styles.examHeader}>
              <View style={styles.examTitleContainer}>
                <FontAwesome5
                  name={urgencyIcons[urgencyLevel]}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.examTitle}>{examTitle}</Text>
              </View>

              <View style={styles.examOptionsContainer}>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Exam Options',
                      `Options for "${examTitle}"`,
                      [
                        {
                          text: 'Edit Exam',
                          onPress: () => handleEditExam(item)
                        },
                        {
                          text: 'Reschedule Reminders',
                          onPress: () => handleRescheduleNotifications(item)
                        },
                        {
                          text: 'Delete Exam',
                          style: 'destructive',
                          onPress: () => handleDeleteExam(item)
                        },
                        {
                          text: 'Cancel',
                          style: 'cancel'
                        }
                      ]
                    );
                  }}
                  style={styles.optionsButton}
                >
                  <FontAwesome5 name="ellipsis-v" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </View>

            {subject && (
              <Text style={styles.examSubject}>📚 {subject}</Text>
            )}

            <Text style={styles.examDate}>
              📅 {examDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })} at {examTime || examDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>

            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                {daysLeft === 0 ? '🔥 TODAY!' :
                  daysLeft === 1 ? '⏰ TOMORROW' :
                    daysLeft < 0 ? `📚 ${Math.abs(daysLeft)} days ago` :
                      `⏳ ${daysLeft} days left`}
              </Text>
            </View>

            <Text style={styles.motivationalText}>{motivationalMessage}</Text>

            {daysLeft > 0 && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.practiceButton}
                  onPress={() => navigation.navigate('AskAlexandria' as any, {
                    // Pre-fill exam information for quick practice
                    suggestedTopic: subject || examTitle,
                    difficulty: 'medium',
                    numQuestions: 15,
                    details: `Practice for ${examTitle} scheduled on ${examDate.toLocaleDateString()}`,
                    autoGenerate: true, // Auto-start quiz generation
                    examMode: true,
                  })}
                >
                  <FontAwesome5 name="brain" size={14} color="#FFFFFF" />
                  <Text style={styles.practiceButtonText}>
                    Practice with Alexandria
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => navigation.navigate('Upload')}
                >
                  <FontAwesome5 name="upload" size={14} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>
                    Upload Study Material
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {daysLeft > 0 && (
              <View style={styles.smartReminderContainer}>
                <FontAwesome5 name="lightbulb" size={12} color="#FFFFFF" />
                <Text style={styles.smartReminderText}>
                  {daysLeft <= 1 ? 'Final review time!' :
                    daysLeft <= 2 ? 'Study 2x today!' :
                      daysLeft <= 7 ? 'Daily practice recommended' :
                        'Regular practice sessions'}
                </Text>
              </View>
            )}

            {item.reminderEnabled && daysLeft > 0 && (
              <View style={styles.reminderStatusContainer}>
                <FontAwesome5 name="bell" size={10} color="#FFFFFF" />
                <Text style={styles.reminderStatusText}>Smart reminders active</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const handleBulkSchedule = (): void => {
    Alert.alert(
      'Bulk Schedule',
      'Would you like to schedule multiple exams or import from calendar?',
      [
        {
          text: 'Schedule Multiple',
          onPress: () => {
            navigation.navigate('ScheduleExamScreen' as any);
          }
        },
        {
          text: 'Import from Calendar',
          onPress: () => {
            Alert.alert('Coming Soon', 'Calendar import feature will be available soon!');
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeBackButton
          style={styles.backButton}
          color="#F8F4E3"
          size={20}
        />
        <Text style={styles.headerTitle}>My Exams</Text>
        <View style={styles.headerActions}>
          {exams.length > 0 && (
            <TouchableOpacity
              onPress={handleBulkSchedule}
              style={styles.bulkButton}
            >
              <FontAwesome5 name="calendar-week" size={16} color="#F8F4E3" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('ScheduleExamScreen' as any)}
            style={styles.addButton}
          >
            <FontAwesome5 name="plus" size={20} color="#F8F4E3" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick stats bar */}
      {exams.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{exams.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {exams.filter(exam => ExamScheduleService.calculateDaysUntilExam(exam.examDate) >= 0).length}
            </Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {exams.filter(exam => ExamScheduleService.calculateDaysUntilExam(exam.examDate) <= 7 && ExamScheduleService.calculateDaysUntilExam(exam.examDate) >= 0).length}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {exams.filter(exam => exam.reminderEnabled).length}
            </Text>
            <Text style={styles.statLabel}>With Reminders</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Loading your exams...</Text>
          </View>
        ) : exams.length === 0 ? (
          <View style={styles.centerContent}>
            <FontAwesome5 name="calendar-plus" size={48} color="#D4AF37" />
            <Text style={styles.emptyTitle}>No Exams Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Schedule your first exam and let Alexandria help you prepare!
            </Text>
            <TouchableOpacity
              style={styles.scheduleFirstButton}
              onPress={() => navigation.navigate('ScheduleExamScreen' as any)}
            >
              <LinearGradient colors={["#D4AF37", "#B8941F"]} style={styles.scheduleFirstGradient}>
                <FontAwesome5 name="calendar-plus" size={16} color="#1A2C5B" />
                <Text style={styles.scheduleFirstText}>Schedule First Exam</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={exams}
            renderItem={renderExamCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#D4AF37"
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8F4E3',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkButton: {
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    padding: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  statLabel: {
    fontSize: 12,
    color: '#CBD5E0',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#F8F4E3',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8F4E3',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#CBD5E0',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  scheduleFirstButton: {
    marginTop: 30,
  },
  scheduleFirstGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  scheduleFirstText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2C5B',
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  examCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  examCardGradient: {
    padding: 20,
  },
  examCardContent: {},
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  examTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  examOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsButton: {
    padding: 8,
    marginLeft: 5,
  },
  examSubject: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  examDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
  },
  countdownContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  motivationalText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    flexWrap: 'wrap',
  },
  practiceButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  practiceButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  uploadButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  smartReminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  smartReminderText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  reminderStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reminderStatusText: {
    fontSize: 11,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ExamListScreen;
