import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService } from './UserService';
import { ExamScheduleService } from './examScheduleService';
import logger from '../utils/logger';


// ❌ REMOVED: The setNotificationHandler should not be here.
// This configuration should be done only ONCE when your app starts, 
// for example, in your main App.js or a dedicated initialization utility.
// This prevents it from being re-configured every time this service is imported.

export class NotificationService {
    static STORAGE_KEY = 'notification_preferences';
    static SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';

    // ✅ IMPROVED: Enhanced permission handling with better error handling
    static async requestPermissions(userId = null) { // ✅ Accept optional userId
        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('exam-reminders', {
                    name: 'Exam Reminders',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#D4AF37',
                    description: 'Reminders for your scheduled exams',
                });

                // Create additional channels
                await Notifications.setNotificationChannelAsync('study-sessions', {
                    name: 'Study Session Reminders',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 150, 150, 150],
                    lightColor: '#1A2C5B',
                    description: 'Reminders for your study sessions',
                });
            }

            const { status } = await Notifications.requestPermissionsAsync();
            
            // ✅ FIX: Save permission status to a user-specific key if userId is available
            const key = userId ? `notification_permission_${userId}` : 'notification_permission';
            await AsyncStorage.setItem(key, status);
            
            return status === 'granted';
        } catch (error) {
            logger.error('Error requesting notification permissions:', error);
            return false;
        }
    }

    // ✅ NEW: Get user notification preferences
    static async getNotificationPreferences(userId) {
        try {
            const preferences = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
            if (preferences) {
                return JSON.parse(preferences);
            }
            
            // Default preferences
            return {
                examReminders: true,
                studyReminders: true,
                quietHoursEnabled: false,
                quietHoursStart: '22:00',
                quietHoursEnd: '08:00',
                reminderFrequency: 'smart', // 'smart', 'daily', 'minimal'
                soundEnabled: true,
                vibrationEnabled: true,
                customMessages: true,
            };
        } catch (error) {
            logger.error('Error getting notification preferences:', error);
            return {};
        }
    }

    // ✅ NEW: Save user notification preferences
    static async saveNotificationPreferences(userId, preferences) {
        try {
            await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(preferences));
            return true;
        } catch (error) {
            logger.error('Error saving notification preferences:', error);
            return false;
        }
    }

    // ✅ IMPROVED: Enhanced exam reminder scheduling with better date handling
    static async scheduleExamReminder(examData, userId = null) {
        try {
            const hasPermission = await this.requestPermissions(userId); // ✅ Pass userId
            if (!hasPermission) {
                logger.info('Notification permissions not granted');
                return false;
            }

            // Get user preferences and profile
            const preferences = userId ? await this.getNotificationPreferences(userId) : {};
            const userProfile = userId ? await UserService.getUserProfile(userId) : null;
            const firstName = userProfile?.fullName ? UserService.getFirstName(userProfile.fullName) : 'Student';

            if (!preferences.examReminders) {
                logger.info('Exam reminders disabled by user');
                return false;
            }

            // Cancel existing notifications for this exam
            await this.cancelExamReminders(examData.id || examData.examTitle);

            const examDate = new Date(examData.examDate);
            const now = new Date();
            const daysLeft = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));

            if (daysLeft <= 0) {
                logger.info('Exam date has passed, not scheduling notifications');
                return false;
            }

            const reminderSchedule = this.getReminderSchedule(daysLeft, preferences.reminderFrequency);
            const scheduledNotifications = [];

            for (const reminder of reminderSchedule) {
                const triggerDate = new Date(examDate);
                triggerDate.setDate(triggerDate.getDate() - reminder.daysLeft);
                triggerDate.setHours(reminder.hour, reminder.minute, 0, 0);

                // Skip if trigger date is in the past
                if (triggerDate <= now) continue;

                // Check quiet hours
                if (preferences.quietHoursEnabled && this.isInQuietHours(triggerDate, preferences)) {
                    // Adjust to end of quiet hours
                    const adjustedDate = this.adjustForQuietHours(triggerDate, preferences);
                    triggerDate.setTime(adjustedDate.getTime());
                }

                const notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: this.getNotificationTitle(reminder.daysLeft, examData.examTitle),
                        body: this.getPersonalizedReminderMessage(
                            examData.examTitle, 
                            reminder.daysLeft, 
                            firstName,
                            preferences.customMessages
                        ),
                        data: { 
                            examId: examData.id,
                            examTitle: examData.examTitle, 
                            examDate: examData.examDate.toISOString(),
                            firstName,
                            type: 'exam_reminder',
                            daysLeft: reminder.daysLeft
                        },
                        sound: preferences.soundEnabled ? 'default' : null,
                    },
                    trigger: {
                        date: triggerDate,
                    },
                });

                scheduledNotifications.push({
                    id: notificationId,
                    examId: examData.id,
                    examTitle: examData.examTitle,
                    triggerDate: triggerDate.toISOString(),
                    daysLeft: reminder.daysLeft,
                });
            }

            // Save scheduled notifications for tracking
            await this.saveScheduledNotifications(userId, scheduledNotifications);
            
            logger.info(`Scheduled ${scheduledNotifications.length} notifications for ${examData.examTitle}`);
            return true;

        } catch (error) {
            logger.error('Error scheduling exam reminder:', error);
            return false;
        }
    }

    // ✅ IMPROVED: Smarter reminder scheduling based on days left and user preferences
    static getReminderSchedule(daysLeft, frequency = 'smart') {
        const schedule = [];
        
        switch (frequency) {
            case 'minimal':
                // Only critical reminders
                if (daysLeft >= 1) schedule.push({ daysLeft: 1, hour: 18, minute: 0 }); // Day before
                if (daysLeft >= 7) schedule.push({ daysLeft: 7, hour: 18, minute: 0 }); // Week before
                break;
                
            case 'daily':
                // Daily reminders for all days
                for (let day = 1; day <= Math.min(daysLeft, 14); day++) {
                    schedule.push({ daysLeft: day, hour: 18, minute: 0 });
                }
                break;
                
            case 'smart':
            default:
                // Smart scheduling based on days left
                if (daysLeft >= 1) {
                    // Day before - morning and evening
                    schedule.push({ daysLeft: 1, hour: 9, minute: 0 });
                    schedule.push({ daysLeft: 1, hour: 18, minute: 0 });
                }
                
                if (daysLeft >= 2) {
                    // 2 days before
                    schedule.push({ daysLeft: 2, hour: 18, minute: 0 });
                }
                
                if (daysLeft >= 3) {
                    // 3 days before
                    schedule.push({ daysLeft: 3, hour: 18, minute: 0 });
                }
                
                if (daysLeft >= 7) {
                    // Week before
                    schedule.push({ daysLeft: 7, hour: 18, minute: 0 });
                }
                
                if (daysLeft >= 14) {
                    // 2 weeks before
                    schedule.push({ daysLeft: 14, hour: 18, minute: 0 });
                }
                
                if (daysLeft >= 30) {
                    // Month before
                    schedule.push({ daysLeft: 30, hour: 18, minute: 0 });
                }
                break;
        }
        
        return schedule;
    }

    // ✅ IMPROVED: Better notification titles
    static getNotificationTitle(daysLeft, examTitle) {
        if (daysLeft === 0) return '🔥 Exam Day!';
        if (daysLeft === 1) return '⚡ Tomorrow\'s Exam';
        if (daysLeft <= 3) return '📚 Exam Coming Up';
        if (daysLeft <= 7) return '📅 Weekly Exam Reminder';
        return '🎓 Exam Reminder';
    }

    // ✅ IMPROVED: Enhanced personalized messages with more variety
    static getPersonalizedReminderMessage(examTitle, daysLeft, firstName, customMessages = true) {
        const standardMessages = {
            0: [`Your ${examTitle} is today! You're ready for this!`],
            1: [
                `Your ${examTitle} is tomorrow! Final review time!`,
                `Tomorrow's the big day for ${examTitle}!`,
                `One more sleep until ${examTitle}!`
            ],
            2: [
                `${examTitle} is in 2 days. Perfect time for practice!`,
                `2 days until ${examTitle}. How's your preparation going?`,
                `Quick reminder: ${examTitle} is this week!`
            ],
            3: [
                `${examTitle} is in 3 days. Time to focus!`,
                `3 days to ${examTitle}. Ready to review?`
            ],
            weekly: [
                `${examTitle} is coming up in ${daysLeft} days. Let's prepare!`,
                `Don't forget about ${examTitle} in ${daysLeft} days!`,
                `${daysLeft} days until ${examTitle}. Time to study!`
            ]
        };

        const personalizedMessages = {
            0: [
                `🔥 ${firstName}, it's exam day! Your ${examTitle} awaits!`,
                `⚡ ${firstName}, today's the day for ${examTitle}! You've got this!`,
                `🎯 ${firstName}, your ${examTitle} is here! Show them what you know!`
            ],
            1: [
                `⚡ Hey ${firstName}! Your ${examTitle} is tomorrow! Ready for one final review?`,
                `🎯 ${firstName}, it's the final countdown for ${examTitle}!`,
                `🔥 ${firstName}, tomorrow's ${examTitle} - you're prepared!`
            ],
            2: [
                `📚 Hi ${firstName}! 2 days until ${examTitle}. Time for focused study!`,
                `⏰ ${firstName}, your ${examTitle} is in 2 days. Ready to practice?`,
                `💪 Hey ${firstName}! 2 more days to ace ${examTitle}!`
            ],
            3: [
                `🌟 ${firstName}, 3 days until ${examTitle}. Let's review!`,
                `📖 Hey ${firstName}! ${examTitle} is in 3 days. Study session?`
            ],
            weekly: [
                `🌟 ${firstName}, your ${examTitle} is in ${daysLeft} days. Let's practice!`,
                `📖 Hey ${firstName}! ${daysLeft} days until ${examTitle}. Study time?`,
                `🎓 ${firstName}, ${daysLeft} days to master ${examTitle}!`
            ]
        };

        const messageBank = customMessages ? personalizedMessages : standardMessages;
        let messageArray;

        if (daysLeft === 0) messageArray = messageBank[0];
        else if (daysLeft === 1) messageArray = messageBank[1];
        else if (daysLeft === 2) messageArray = messageBank[2];
        else if (daysLeft === 3) messageArray = messageBank[3];
        else messageArray = messageBank.weekly;

        return messageArray[Math.floor(Math.random() * messageArray.length)];
    }

    // ✅ NEW: Check if time is in quiet hours
    static isInQuietHours(date, preferences) {
        if (!preferences.quietHoursEnabled) return false;
        
        const hour = date.getHours();
        const minute = date.getMinutes();
        const currentTime = hour * 60 + minute;
        
        const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
        const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
        
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        
        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Quiet hours span midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    // ✅ NEW: Adjust notification time to avoid quiet hours
    static adjustForQuietHours(date, preferences) {
        const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
        const adjustedDate = new Date(date);
        adjustedDate.setHours(endHour, endMinute, 0, 0);
        
        // If adjusted time is in the past, schedule for next day
        if (adjustedDate <= new Date()) {
            adjustedDate.setDate(adjustedDate.getDate() + 1);
        }
        
        return adjustedDate;
    }

    // ✅ IMPROVED: Better notification tracking
    static async saveScheduledNotifications(userId, notifications) {
        try {
            // ✅ FIX: Ensure userId is provided to prevent saving to a global key
            if (!userId) {
                logger.error('Cannot save scheduled notifications without a userId.');
                return;
            }
            const key = `${this.SCHEDULED_NOTIFICATIONS_KEY}_${userId}`;
            const existing = await AsyncStorage.getItem(key);
            const allNotifications = existing ? JSON.parse(existing) : [];
            
            // Add new notifications
            allNotifications.push(...notifications);
            
            await AsyncStorage.setItem(key, JSON.stringify(allNotifications));
        } catch (error) {
            logger.error('Error saving scheduled notifications:', error);
        }
    }

    // ✅ IMPROVED: Enhanced cancellation with better tracking
    static async cancelExamReminders(examIdentifier, userId = null) {
        try {
            // Get all scheduled notifications
            const notifications = await Notifications.getAllScheduledNotificationsAsync();
            
            // Find notifications for this exam (by ID or title)
            const examNotifications = notifications.filter(notif => 
                notif.content.data?.examTitle === examIdentifier ||
                notif.content.data?.examId === examIdentifier
            );
            
            // Cancel each notification
            for (const notif of examNotifications) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }

            // Remove from tracking
            if (userId) {
                await this.removeFromScheduledNotifications(userId, examIdentifier);
            }
            
            logger.info(`Cancelled ${examNotifications.length} notifications for exam: ${examIdentifier}`);
            return examNotifications.length;
        } catch (error) {
            logger.error('Error cancelling exam reminders:', error);
            return 0;
        }
    }

    // ✅ NEW: Remove notifications from tracking
    static async removeFromScheduledNotifications(userId, examIdentifier) {
        try {
            const key = `${this.SCHEDULED_NOTIFICATIONS_KEY}_${userId}`;
            const existing = await AsyncStorage.getItem(key);
            
            if (existing) {
                const notifications = JSON.parse(existing);
                const filtered = notifications.filter(notif => 
                    notif.examId !== examIdentifier && notif.examTitle !== examIdentifier
                );
                
                await AsyncStorage.setItem(key, JSON.stringify(filtered));
            }
        } catch (error) {
            logger.error('Error removing from scheduled notifications:', error);
        }
    }

    // ✅ NEW: Schedule all exams for a user
    static async scheduleAllExamReminders(userId) {
        try {
            // ✅ FIX: Pass userId to get user-specific exams
            const exams = await ExamScheduleService.getUserExams(userId);
            let scheduledCount = 0;
            
            for (const exam of exams) {
                const success = await this.scheduleExamReminder(exam, userId);
                if (success) scheduledCount++;
            }
            
            logger.info(`Scheduled reminders for ${scheduledCount} out of ${exams.length} exams`);
            return scheduledCount;
        } catch (error) {
            logger.error('Error scheduling all exam reminders:', error);
            return 0;
        }
    }

    // ✅ NEW: Get notification statistics
    static async getNotificationStats(userId) {
        try {
            // ✅ FIX: Ensure userId is provided to prevent reading from a global key
            if (!userId) {
                logger.error('Cannot get notification stats without a userId.');
                return { total: 0, upcoming: 0, past: 0, nextNotification: null };
            }
            const key = `${this.SCHEDULED_NOTIFICATIONS_KEY}_${userId}`;
            const scheduled = await AsyncStorage.getItem(key);
            const notifications = scheduled ? JSON.parse(scheduled) : [];
            
            const upcoming = notifications.filter(notif => new Date(notif.triggerDate) > new Date());
            const past = notifications.filter(notif => new Date(notif.triggerDate) <= new Date());
            
            return {
                total: notifications.length,
                upcoming: upcoming.length,
                past: past.length,
                nextNotification: upcoming.length > 0 ? upcoming.sort((a, b) => 
                    new Date(a.triggerDate) - new Date(b.triggerDate)
                )[0] : null
            };
        } catch (error) {
            logger.error('Error getting notification stats:', error);
            return { total: 0, upcoming: 0, past: 0, nextNotification: null };
        }
    }

    // ✅ NEW: Test notification
    static async sendTestNotification(firstName = 'Student') {
        try {
            const hasPermission = await this.requestPermissions(); // This is fine, will use global key
            if (!hasPermission) return false;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '📚 Alexandria Test Notification',
                    body: `Hi ${firstName}! Your notifications are working perfectly! 🎉`,
                    data: { type: 'test' },
                },
                trigger: {
                    seconds: 1,
                },
            });
            
            return true;
        } catch (error) {
            logger.error('Error sending test notification:', error);
            return false;
        }
    }
}