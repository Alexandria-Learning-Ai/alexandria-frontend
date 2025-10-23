import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ViewStyle,
  TextStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import SafeBackButton from '../components/SafeBackButton';
import NavigationHelper from '../utils/NavigationHelper';
import { ExamScheduleService } from '../utils/examScheduleService';
import { NotificationManager } from '../utils/NotificationManager';
import { auth } from '../firebaseConfig';
import { UserService } from '../utils/UserService';
import logger from '../utils/logger';
import { RootStackParamList } from '../types';

// Type definitions
type ScheduleExamScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ScheduleExam'
>;

interface ScheduleExamScreenProps {
  navigation: ScheduleExamScreenNavigationProp;
  route?: {
    params?: {
      examToEdit?: SavedExam;
    };
  };
}

interface ExamData {
  userId: string;
  examTitle: string;
  subject: string;
  examDate: Date;
  reminderEnabled: boolean;
  isRecurring: boolean;
  createdAt: Date;
}

interface SavedExam extends ExamData {
  id: string;
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerTitle: TextStyle;
  placeholder: ViewStyle;
  content: ViewStyle;
  formContainer: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  inputContainer: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  dateTimeButton: ViewStyle;
  dateTimeText: TextStyle;
  optionRow: ViewStyle;
  optionInfo: ViewStyle;
  optionTextContainer: ViewStyle;
  optionLabel: TextStyle;
  optionDescription: TextStyle;
  testNotificationButton: ViewStyle;
  testNotificationText: TextStyle;
  previewSection: ViewStyle;
  previewTitle: TextStyle;
  previewCard: ViewStyle;
  previewExamTitle: TextStyle;
  previewDate: TextStyle;
  previewSubject: TextStyle;
  previewCountdown: TextStyle;
  reminderPreview: ViewStyle;
  reminderPreviewTitle: TextStyle;
  reminderPreviewText: TextStyle;
  scheduleButton: ViewStyle;
  disabledButton: ViewStyle;
  scheduleButtonGradient: ViewStyle;
  scheduleButtonText: TextStyle;
  disabledButtonText: TextStyle;
  modalContainer: ViewStyle;
  pickerContainer: ViewStyle;
  pickerHeader: ViewStyle;
  pickerTitle: TextStyle;
  pickerButton: ViewStyle;
  pickerButtonText: TextStyle;
  confirmText: TextStyle;
  picker: ViewStyle;
}

/**
 * ScheduleExamScreen - Schedule exams with smart reminders
 *
 * Features:
 * - Date and time selection with native pickers
 * - Smart reminder system integration
 * - Recurring exam support
 * - Real-time countdown preview
 * - Adaptive reminder frequency based on exam proximity
 * - Cross-platform date/time picker handling
 */
const ScheduleExamScreen: React.FC<ScheduleExamScreenProps> = ({ navigation, route }) => {
  const examToEdit = route?.params?.examToEdit;

  // Initialize state with exam data if editing
  const [examTitle, setExamTitle] = useState<string>(examToEdit?.examTitle || examToEdit?.title || '');
  const [subject, setSubject] = useState<string>(examToEdit?.subject || '');
  const [examDate, setExamDate] = useState<Date>(examToEdit?.examDate ? new Date(examToEdit.examDate) : new Date());
  const [examTime, setExamTime] = useState<Date>(examToEdit?.examDate ? new Date(examToEdit.examDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(examToEdit?.reminderEnabled ?? true);
  const [isRecurring, setIsRecurring] = useState<boolean>(examToEdit?.isRecurring ?? false);
  const [loading, setLoading] = useState<boolean>(false);

  // Temporary states for pickers
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const handleScheduleExam = async (): Promise<void> => {
    if (!examTitle.trim()) {
      Alert.alert('Missing Information', 'Please enter an exam title.');
      return;
    }

    // Combine date and time
    const combinedDateTime = new Date(examDate);
    combinedDateTime.setHours(examTime.getHours());
    combinedDateTime.setMinutes(examTime.getMinutes());

    // Check if date is in the future
    if (combinedDateTime <= new Date()) {
      Alert.alert('Invalid Date', 'Please select a future date and time.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'You must be logged in to schedule an exam.');
        setLoading(false);
        return;
      }

      // Create exam data object
      const examData: ExamData = {
        userId: user.uid,
        examTitle: examTitle.trim(),
        subject: subject.trim(),
        examDate: combinedDateTime,
        reminderEnabled,
        isRecurring,
        createdAt: examToEdit?.createdAt || new Date(),
      };

      // Save to ExamScheduleService (update if editing, create if new)
      let savedExam: SavedExam;
      if (examToEdit) {
        savedExam = await ExamScheduleService.updateExam(examToEdit.id, examData) as SavedExam;
      } else {
        savedExam = await ExamScheduleService.saveExam(examData) as SavedExam;
      }

      // Use NotificationManager for comprehensive scheduling
      if (reminderEnabled && savedExam) {
        const notificationResults = await NotificationManager.scheduleAllNotifications(
          user.uid,
          {
            id: savedExam.id,
            examTitle: examData.examTitle,
            examDate: combinedDateTime,
            subject: examData.subject
          },
          'exam_scheduled'
        );

        logger.info('📱 Notification Results:', notificationResults);
      }

      const daysUntilExam = Math.ceil((combinedDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      Alert.alert(
        examToEdit ? 'Exam Updated! 📅' : 'Exam Scheduled! 📅',
        `"${examTitle}" has been ${examToEdit ? 'updated' : 'scheduled'} for ${combinedDateTime.toLocaleDateString()} at ${combinedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${reminderEnabled ? `\n\n🧠 Alexandria will send you smart reminders based on your progress!` : ''}`,
        [
          { text: 'View All Exams', onPress: () => navigation.navigate('ExamListScreen' as any) },
          ...(examToEdit ? [] : [{ text: 'Schedule Another', onPress: resetForm }]),
          { text: 'Done', onPress: () => NavigationHelper.safeGoBack(navigation) }
        ]
      );

    } catch (error) {
      logger.error('Error scheduling exam:', error);
      Alert.alert('Error', 'Failed to schedule exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setExamTitle('');
    setSubject('');
    setExamDate(new Date());
    setExamTime(new Date());
    setReminderEnabled(true);
    setIsRecurring(false);
  };

  // Handle date picker
  const openDatePicker = (): void => {
    setTempDate(new Date(examDate));
    setShowDatePicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setExamDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmDateSelection = (): void => {
    setExamDate(tempDate);
    setShowDatePicker(false);
  };

  const cancelDateSelection = (): void => {
    setTempDate(examDate);
    setShowDatePicker(false);
  };

  // Handle time picker
  const openTimePicker = (): void => {
    setTempTime(new Date(examTime));
    setShowTimePicker(true);
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date): void => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selectedTime) {
        setExamTime(selectedTime);
      }
    } else {
      if (selectedTime) {
        setTempTime(selectedTime);
      }
    }
  };

  const confirmTimeSelection = (): void => {
    setExamTime(tempTime);
    setShowTimePicker(false);
  };

  const cancelTimeSelection = (): void => {
    setTempTime(examTime);
    setShowTimePicker(false);
  };

  // Calculate days until exam more safely
  const getDaysUntilExam = (): number => {
    try {
      const combinedDateTime = new Date(examDate);
      combinedDateTime.setHours(examTime.getHours());
      combinedDateTime.setMinutes(examTime.getMinutes());

      const now = new Date();
      const diffTime = combinedDateTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 0;
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  // Get reminder frequency description
  const getReminderDescription = (): string => {
    const daysUntil = getDaysUntilExam();
    if (daysUntil <= 3) return "Frequent reminders (2x daily)";
    if (daysUntil <= 7) return "Daily study reminders";
    if (daysUntil <= 14) return "Regular reminders";
    return "Smart weekly reminders";
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
        <Text style={styles.headerTitle}>{examToEdit ? 'Edit Exam' : 'Schedule Exam'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Title Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Exam Details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Exam Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Math Final, Biology Midterm"
                placeholderTextColor="#CBD5E0"
                value={examTitle}
                onChangeText={setExamTitle}
                maxLength={50}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Subject (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mathematics, Biology"
                placeholderTextColor="#CBD5E0"
                value={subject}
                onChangeText={setSubject}
                maxLength={30}
              />
            </View>
          </View>

          {/* Date & Time Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 When is your exam?</Text>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={openDatePicker}
            >
              <FontAwesome5 name="calendar-day" size={16} color="#D4AF37" />
              <Text style={styles.dateTimeText}>
                {examDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={openTimePicker}
            >
              <FontAwesome5 name="clock" size={16} color="#D4AF37" />
              <Text style={styles.dateTimeText}>
                {examTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Options Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Options</Text>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <FontAwesome5 name="bell" size={16} color="#D4AF37" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionLabel}>Smart Reminders</Text>
                  <Text style={styles.optionDescription}>
                    {reminderEnabled ? getReminderDescription() : "No reminders"}
                  </Text>
                </View>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: '#3e4d5c', true: '#D4AF37' }}
                thumbColor={reminderEnabled ? '#F8F4E3' : '#8a9ba8'}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <FontAwesome5 name="redo" size={16} color="#D4AF37" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionLabel}>Recurring Exam</Text>
                  <Text style={styles.optionDescription}>Weekly/monthly repeat</Text>
                </View>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: '#3e4d5c', true: '#D4AF37' }}
                thumbColor={isRecurring ? '#F8F4E3' : '#8a9ba8'}
              />
            </View>
          </View>

          {/* Preview Section */}
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>📋 Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewExamTitle}>{examTitle || 'Your Exam'}</Text>
              <Text style={styles.previewDate}>
                📅 {examDate.toLocaleDateString()} at {examTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {subject && (
                <Text style={styles.previewSubject}>📚 {subject}</Text>
              )}
              <Text style={styles.previewCountdown}>
                ⏰ {getDaysUntilExam()} days to go!
              </Text>

              {/* Reminder preview */}
              {reminderEnabled && (
                <View style={styles.reminderPreview}>
                  <Text style={styles.reminderPreviewTitle}>🔔 Reminder Schedule:</Text>
                  <Text style={styles.reminderPreviewText}>
                    • {getReminderDescription()}
                  </Text>
                  <Text style={styles.reminderPreviewText}>
                    • Personalized study suggestions
                  </Text>
                  <Text style={styles.reminderPreviewText}>
                    • Smart timing (avoids quiet hours)
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Schedule Button */}
          <TouchableOpacity
            style={[styles.scheduleButton, (!examTitle.trim() || loading) && styles.disabledButton]}
            onPress={handleScheduleExam}
            disabled={!examTitle.trim() || loading}
          >
            <LinearGradient
              colors={(!examTitle.trim() || loading) ? ["#666", "#555"] : ["#D4AF37", "#B8941F"]}
              style={styles.scheduleButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1A2C5B" />
              ) : (
                <>
                  <FontAwesome5 name={examToEdit ? "check" : "calendar-plus"} size={16} color={(!examTitle.trim() || loading) ? "#888" : "#1A2C5B"} />
                  <Text style={[styles.scheduleButtonText, (!examTitle.trim() || loading) && styles.disabledButtonText]}>
                    {examToEdit ? 'Update Exam' : 'Schedule Exam'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={cancelDateSelection} style={styles.pickerButton}>
                  <Text style={styles.pickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={confirmDateSelection} style={styles.pickerButton}>
                  <Text style={[styles.pickerButtonText, styles.confirmText]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* iOS Time Picker Modal */}
      {Platform.OS === 'ios' && showTimePicker && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={cancelTimeSelection} style={styles.pickerButton}>
                  <Text style={styles.pickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={confirmTimeSelection} style={styles.pickerButton}>
                  <Text style={[styles.pickerButtonText, styles.confirmText]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date/Time Pickers */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={examDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={examTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
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
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8F4E3',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#F8F4E3',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  dateTimeButton: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#F8F4E3',
    marginLeft: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  optionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTextContainer: {
    marginLeft: 10,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8F4E3',
  },
  optionDescription: {
    fontSize: 12,
    color: '#CBD5E0',
    marginTop: 2,
  },
  testNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  testNotificationText: {
    fontSize: 14,
    color: '#D4AF37',
    marginLeft: 6,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8F4E3',
    marginBottom: 15,
  },
  previewCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  previewExamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  previewDate: {
    fontSize: 14,
    color: '#F8F4E3',
    marginBottom: 5,
  },
  previewSubject: {
    fontSize: 14,
    color: '#F8F4E3',
    marginBottom: 5,
  },
  previewCountdown: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginTop: 10,
  },
  reminderPreview: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  reminderPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8F4E3',
    marginBottom: 8,
  },
  reminderPreviewText: {
    fontSize: 12,
    color: '#CBD5E0',
    marginBottom: 4,
  },
  scheduleButton: {
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  scheduleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2C5B',
    marginLeft: 8,
  },
  disabledButtonText: {
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#1A2C5B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8F4E3',
  },
  pickerButton: {
    padding: 10,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#CBD5E0',
  },
  confirmText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  picker: {
    backgroundColor: '#1A2C5B',
  },
});

export default ScheduleExamScreen;
