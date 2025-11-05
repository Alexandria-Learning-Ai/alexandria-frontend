// utils/NotificationManager.js
import { SmartProgressNotificationService } from './SmartProgressNotificationService';
import { NotificationService } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';

import * as Notifications from 'expo-notifications'; // ✅ FIXED: Use * as import

/**
 * 🎛️ Master Notification Controller
 * Coordinates both exam-based and progress-based notifications
 */
export class NotificationManager {
    static COORDINATION_KEY = 'notification_coordination';

    // ✅ MAIN ORCHESTRATOR: Handle all notification needs
    static async scheduleAllNotifications(userId, examData = null, triggerType = 'manual') {
        try {
            logger.info(`🎛️ NotificationManager: Scheduling notifications (${triggerType})`);
            
            const results = {
                examNotifications: false,
                smartNotifications: false,
                conflicts: [],
                summary: ''
            };

            // 1. Schedule exam-based notifications (if exam provided)
            if (examData) {
                results.examNotifications = await NotificationService.scheduleExamReminder(examData, userId);
                logger.info(`📅 Exam notifications: ${results.examNotifications ? 'Success' : 'Failed'}`);
            }

            // 2. Always run smart progress analysis
            const analysis = await SmartProgressNotificationService.triggerSmartAnalysis(userId);
            results.smartNotifications = !!analysis;
            logger.info(`🧠 Smart notifications: ${results.smartNotifications ? 'Success' : 'Failed'}`);

            // 3. Check for and resolve conflicts
            results.conflicts = await this.detectAndResolveConflicts(userId);

            // 4. Generate summary
            results.summary = this.generateNotificationSummary(results, analysis);

            // 5. Save coordination data
            await this.saveCoordinationData(userId, results, analysis);

            return results;

        } catch (error) {
            logger.error('❌ NotificationManager error:', error);
            return { error: error.message };
        }
    }

    // ✅ CONFLICT DETECTION: Prevent notification spam
    static async detectAndResolveConflicts(userId) {
        try {
            const conflicts = [];
            
            // Get all scheduled notifications
            const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
            
            // Group by trigger time (within 30 minutes = conflict)
            const timeGroups = new Map();
            
            allNotifications.forEach(notif => {
                if (notif.content.data?.userId === userId) {
                    const triggerTime = new Date(notif.trigger.date || Date.now() + (notif.trigger.seconds * 1000));
                    const timeKey = Math.floor(triggerTime.getTime() / (30 * 60 * 1000)); // 30-minute buckets
                    
                    if (!timeGroups.has(timeKey)) {
                        timeGroups.set(timeKey, []);
                    }
                    timeGroups.get(timeKey).push(notif);
                }
            });

            // Resolve conflicts by keeping only the highest priority notification per time slot
            for (const [timeKey, notifications] of timeGroups) {
                if (notifications.length > 1) {
                    const sorted = notifications.sort((a, b) => this.getNotificationPriority(b) - this.getNotificationPriority(a));
                    const keep = sorted[0];
                    const remove = sorted.slice(1);
                    
                    // Cancel lower priority notifications
                    for (const notif of remove) {
                        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                        conflicts.push({
                            removed: notif.content.title,
                            kept: keep.content.title,
                            reason: 'Time conflict resolved'
                        });
                    }
                }
            }

            return conflicts;

        } catch (error) {
            logger.error('Error detecting conflicts:', error);
            return [];
        }
    }

    // ✅ PRIORITY SYSTEM: Higher number = higher priority
    static getNotificationPriority(notification) {
        const data = notification.content.data || {};
        const type = data.type || '';
        
        // Priority levels (1-10)
        const priorities = {
            'exam_reminder': 10,           // Highest - exam deadlines
            'exam_readiness': 9,           // Critical - low readiness warning
            'performance_decline': 8,      // Important - performance issues
            'category_focus': 7,           // Important - weakness alerts
            'study_reminder': 6,           // Medium - regular study prompts
            'streak_motivation': 5,        // Medium - streak maintenance
            'performance_improvement': 4,  // Low - celebration
            'welcome_motivation': 3,       // Low - general motivation
            'test': 1                      // Lowest - test notifications
        };
        
        return priorities[type] || 5; // Default medium priority
    }

    // ✅ SMART SCHEDULING: Best times based on user patterns
    static async getOptimalNotificationTime(userId, baseTime, notificationType) {
        try {
            // Get user's study patterns
            const quizHistory = await AsyncStorage.getItem(`quizHistory_${userId}`); // ✅ FIX: Use user-specific key
            const quizzes = quizHistory ? JSON.parse(quizHistory) : [];
            
            if (quizzes.length === 0) {
                return baseTime; // No pattern data, use base time
            }

            // Analyze user's active hours
            const hourCounts = new Map();
            quizzes.forEach(quiz => {
                const hour = new Date(quiz.metadata?.completedAt).getHours();
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            });

            // Find user's most active hours
            const sortedHours = Array.from(hourCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([hour]) => hour);

            const preferredHours = sortedHours.slice(0, 3); // Top 3 active hours

            // Adjust base time to nearest preferred hour
            const baseHour = baseTime.getHours();
            let bestHour = baseHour;
            let minDiff = 24;

            for (const preferredHour of preferredHours) {
                const diff = Math.abs(baseHour - preferredHour);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestHour = preferredHour;
                }
            }

            // Create optimized time
            const optimizedTime = new Date(baseTime);
            optimizedTime.setHours(bestHour, 0, 0, 0);

            // Ensure it's not in the past
            if (optimizedTime <= new Date()) {
                optimizedTime.setDate(optimizedTime.getDate() + 1);
            }

            return optimizedTime;

        } catch (error) {
            logger.error('Error optimizing notification time:', error);
            return baseTime;
        }
    }

    // ✅ SUMMARY GENERATION
    static generateNotificationSummary(results, analysis) {
        let summary = '';
        
        if (results.examNotifications && results.smartNotifications) {
            summary = '🎯 Smart exam reminders and personalized insights scheduled';
        } else if (results.examNotifications) {
            summary = '📅 Exam reminders scheduled';
        } else if (results.smartNotifications) {
            summary = '🧠 Personalized study insights scheduled';
        } else {
            summary = '⚠️ Some notifications may not have been scheduled';
        }

        if (analysis && analysis.recommendations.length > 0) {
            summary += `\n💡 Top insight: ${analysis.recommendations[0]}`;
        }

        if (results.conflicts.length > 0) {
            summary += `\n🔧 Resolved ${results.conflicts.length} notification conflicts`;
        }

        return summary;
    }

    // ✅ COORDINATION DATA STORAGE
    static async saveCoordinationData(userId, results, analysis) {
        try {
            const coordinationData = {
                userId,
                lastCoordination: new Date().toISOString(),
                results,
                analysisSnapshot: analysis ? {
                    overallScore: analysis.overall.averageScore,
                    trend: analysis.trends.direction,
                    topFocusArea: analysis.focusAreas[0]?.area,
                    examReadiness: analysis.examReadiness.map(e => ({
                        title: e.examTitle,
                        readiness: e.readinessScore,
                        daysLeft: e.daysLeft
                    }))
                } : null
            };

            await AsyncStorage.setItem(`${this.COORDINATION_KEY}_${userId}`, JSON.stringify(coordinationData));
        } catch (error) {
            logger.error('Error saving coordination data:', error);
        }
    }

    // ✅ GET NOTIFICATION STATUS
    static async getNotificationStatus(userId) {
        try {
            const coordinationData = await AsyncStorage.getItem(`${this.COORDINATION_KEY}_${userId}`);
            if (!coordinationData) return null;

            const data = JSON.parse(coordinationData);
            const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
            
            // Count notifications by type
            const counts = {
                exam: 0,
                smart: 0,
                total: allNotifications.length
            };

            allNotifications.forEach(notif => {
                const type = notif.content.data?.type || '';
                if (type.includes('exam')) counts.exam++;
                else if (['performance_', 'category_', 'streak_'].some(prefix => type.startsWith(prefix))) counts.smart++;
            });

            return {
                ...data,
                activeCounts: counts,
                nextNotification: allNotifications.length > 0 ? allNotifications[0] : null
            };

        } catch (error) {
            logger.error('Error getting notification status:', error);
            return null;
        }
    }

    // ✅ NEW: Schedule a notification for a remedial quiz
    static async scheduleRemedialNotification(userId, weakness) {
        try {
            const quiz = await WeaknessAnalysisService.generateRemedialQuiz(userId, weakness);
            
            if (!quiz) return false;

            const baseTime = new Date();
            baseTime.setDate(baseTime.getDate() + 1); // Default to 24 hours from now
            const notificationTime = await this.getOptimalNotificationTime(userId, baseTime, 'remedial_quiz');

            const motivationalMessages = [
                `🎯 Ready to strengthen your ${weakness.topic.replace(/_/g, ' ')} skills?`,
                `💪 Let's tackle ${weakness.topic.replace(/_/g, ' ')} together!`,
                `🚀 Time to level up your ${weakness.topic.replace(/_/g, ' ')} knowledge!`
            ];
            
            const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🎯 Alexandria Focus Session',
                    body: randomMessage,
                    data: {
                        type: 'remedial_quiz',
                        userId,
                        quizId: quiz.id,
                        topic: weakness.topic,
                        priority: quiz.priority
                    }
                },
                trigger: { date: notificationTime }
            });

            logger.info(`📱 Remedial notification scheduled for ${notificationTime}`);
            return true;

        } catch (error) {
            logger.error('Error scheduling remedial notification:', error);
            return false;
        }
    }

    // ✅ BULK OPERATIONS
    static async cancelAllNotifications(userId) {
        try {
            // Cancel regular notifications
            await NotificationService.cancelAllNotifications(userId);
            
            // Cancel smart notifications
            await SmartProgressNotificationService.clearSmartNotifications(userId);
            
            // Clear coordination data
            await AsyncStorage.removeItem(`${this.COORDINATION_KEY}_${userId}`);
            
            return true;
        } catch (error) {
            logger.error('Error cancelling all notifications:', error);
            return false;
        }
    }

    // ✅ DAILY MAINTENANCE
    static async performDailyMaintenance(userId) {
        try {
            logger.info('🧹 Performing daily notification maintenance...');
            
            // ✅ SAFETY CHECK: Ensure Notifications is available
            if (!Notifications || !Notifications.getAllScheduledNotificationsAsync) {
                logger.warn('⚠️ Notifications API not available, skipping maintenance');
                return false;
            }
            
            // Clean up expired notifications
            const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const now = new Date();
            
            for (const notif of allNotifications) {
                const triggerTime = new Date(notif.trigger.date || Date.now() + (notif.trigger.seconds * 1000));
                if (triggerTime < now) {
                    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                }
            }

            // Trigger fresh analysis
            await this.scheduleAllNotifications(userId, null, 'daily_maintenance');
            
            logger.info('✅ Daily maintenance completed');
            return true;

        } catch (error) {
            logger.error('❌ Daily maintenance failed:', error);
            return false;
        }
    }

    // ✅ EMERGENCY OVERRIDE: Force specific notification
    static async sendEmergencyNotification(userId, title, body, data = {}) {
        try {
            // ✅ SAFETY CHECK: Ensure Notifications is available
            if (!Notifications || !Notifications.scheduleNotificationAsync) {
                logger.warn('⚠️ Notifications API not available, cannot send emergency notification');
                return false;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🚨 ${title}`,
                    body,
                    data: { ...data, type: 'emergency', userId }
                },
                trigger: { seconds: 1 }
            });
            return true;
        } catch (error) {
            logger.error('Error sending emergency notification:', error);
            return false;
        }
    }

    // ✅ INITIALIZATION CHECK: Verify notification permissions and setup
    static async initializeNotifications() {
        try {
            // Check if expo-notifications is properly installed
            if (!Notifications) {
                logger.warn('⚠️ expo-notifications not available');
                return false;
            }

            // Request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            
            if (finalStatus !== 'granted') {
                logger.warn('⚠️ Notification permissions not granted');
                return false;
            }

            // Configure notification behavior
            await Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowBanner: true,   // ✅ NEW: Replaces deprecated shouldShowAlert
                    shouldShowList: true,     // ✅ NEW: For notification center visibility
                    shouldPlaySound: true,    // Kept sound as it was enabled
                    shouldSetBadge: false,
                }),
            });

            logger.info('✅ Notifications initialized successfully');
            return true;

        } catch (error) {
            logger.error('❌ Error initializing notifications:', error);
            return false;
        }
    }
}

// ✅ NEW: Add a default export for easier importing
export default NotificationManager;

// ✅ USAGE EXAMPLES:

/*
// 0. Initialize notifications first (in App.js):
await NotificationManager.initializeNotifications();

// 1. When user schedules an exam:
const results = await NotificationManager.scheduleAllNotifications(userId, examData, 'exam_scheduled');

// 2. After quiz completion:
await NotificationManager.scheduleAllNotifications(userId, null, 'quiz_completed');

// 3. Daily background task:
await NotificationManager.performDailyMaintenance(userId);

// 4. Get current status:
const status = await NotificationManager.getNotificationStatus(userId);

// 5. Emergency alert:
await NotificationManager.sendEmergencyNotification(userId, 'System Alert', 'Important message here');
*/