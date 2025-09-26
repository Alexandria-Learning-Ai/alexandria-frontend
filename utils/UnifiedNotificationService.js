/**
 * 🎛️ Unified Notification Service
 *
 * Consolidates all notification functionality from:
 * - NotificationManager.js
 * - notificationService.js
 * - IntelligentNotificationSystem.js
 * - EnhancedNotificationManager.js
 * - SmartProgressNotificationService.js
 * - RemedialNotificationHandler.js
 *
 * Provides a single, efficient, conflict-free notification system.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, Vibration } from 'react-native';
import { StudentProfileService } from '../services/StudentProfileService';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';
import { ExamScheduleService } from './examScheduleService';
import { UserService } from './UserService';
import SmartQuizRecommendationService from '../services/SmartQuizRecommendationService';
import logger from '../utils/logger';

export class UnifiedNotificationService {
    static STORAGE_KEY = 'unified_notifications';
    static PREFERENCES_KEY = 'notification_preferences';
    static ANALYSIS_KEY = 'notification_analysis';
    static ENGAGEMENT_KEY = 'notification_engagement';

    static isInitialized = false;
    static pendingActions = new Map();

    // Notification categories with priority and settings
    static CATEGORIES = {
        EXAM_ALERT: {
            id: 'exam_alert',
            name: 'Exam Alerts',
            priority: 10,
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibration: [0, 1000, 500, 1000],
            maxDaily: 3
        },
        PERFORMANCE_ALERT: {
            id: 'performance_alert',
            name: 'Performance Alerts',
            priority: 8,
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibration: [0, 250, 250, 250],
            maxDaily: 2
        },
        STUDY_REMINDER: {
            id: 'study_reminder',
            name: 'Study Reminders',
            priority: 6,
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibration: [0, 150, 150, 150],
            maxDaily: 2
        },
        QUIZ_RECOMMENDATION: {
            id: 'quiz_recommendation',
            name: 'Quiz Recommendations',
            priority: 7,
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibration: [0, 200, 100, 200],
            maxDaily: 2
        },
        PROGRESS_UPDATE: {
            id: 'progress_update',
            name: 'Progress Updates',
            priority: 4,
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'default',
            vibration: [0, 100, 100, 100],
            maxDaily: 1
        },
        ACHIEVEMENT: {
            id: 'achievement',
            name: 'Achievements',
            priority: 5,
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibration: [0, 200, 100, 200],
            maxDaily: 1
        },
        REMEDIAL_FOCUS: {
            id: 'remedial_focus',
            name: 'Focus Sessions',
            priority: 7,
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibration: [0, 150, 150, 150],
            maxDaily: 2
        }
    };

    /**
     * 🚀 Initialize the unified notification system
     */
    static async initialize() {
        try {
            if (this.isInitialized) return true;

            logger.info('🚀 Initializing Unified Notification Service...');

            // Request permissions
            const permissionResult = await this.requestPermissions();
            if (!permissionResult.granted) {
                logger.warn('⚠️ Notification permissions not granted');
                return false;
            }

            // Setup notification categories (Android channels)
            await this.setupNotificationCategories();

            // Configure notification handler
            await this.setupNotificationHandler();

            // Setup action handlers
            this.setupActionHandlers();

            this.isInitialized = true;
            logger.info('✅ Unified Notification Service initialized successfully');
            return true;

        } catch (error) {
            logger.error('❌ Failed to initialize Unified Notification Service:', error);
            return false;
        }
    }

    /**
     * 🔑 Request notification permissions
     */
    static async requestPermissions() {
        try {
            if (Platform.OS === 'android') {
                // Setup Android notification channels
                for (const category of Object.values(this.CATEGORIES)) {
                    await Notifications.setNotificationChannelAsync(category.id, {
                        name: category.name,
                        importance: category.importance,
                        vibrationPattern: category.vibration,
                        lightColor: '#D4AF37',
                        description: `Notifications for ${category.name.toLowerCase()}`,
                    });
                }
            }

            const { status } = await Notifications.requestPermissionsAsync();
            return { granted: status === 'granted', status };
        } catch (error) {
            logger.error('Error requesting notification permissions:', error);
            return { granted: false, status: 'error' };
        }
    }

    /**
     * 📱 Setup notification categories
     */
    static async setupNotificationCategories() {
        try {
            for (const category of Object.values(this.CATEGORIES)) {
                await Notifications.setNotificationChannelAsync(category.id, {
                    name: category.name,
                    importance: category.importance,
                    sound: category.sound,
                    vibrationPattern: category.vibration,
                    lightColor: '#D4AF37',
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                });
            }
            logger.info('📱 Notification categories configured');
        } catch (error) {
            logger.error('Error setting up notification categories:', error);
        }
    }

    /**
     * 🎛️ Setup notification handler
     */
    static async setupNotificationHandler() {
        try {
            await Notifications.setNotificationHandler({
                handleNotification: async (notification) => {
                    const { data } = notification.request.content;
                    const category = this.CATEGORIES[data?.category?.toUpperCase()] || this.CATEGORIES.STUDY_REMINDER;

                    return {
                        shouldShowBanner: true,
                        shouldShowList: true,
                        shouldPlaySound: true,
                        shouldSetBadge: data?.setBadge !== false,
                        priority: category.importance,
                    };
                },
            });
        } catch (error) {
            logger.error('Error setting up notification handler:', error);
        }
    }

    /**
     * 🎯 Setup action handlers for interactive notifications
     */
    static setupActionHandlers() {
        // Handle notification responses (when user taps actions)
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            this.handleNotificationResponse(response);
        });

        // Handle notifications received while app is in foreground
        const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
            UnifiedNotificationService.handleForegroundNotification(notification);
        });

        return () => {
            subscription.remove();
            foregroundSubscription.remove();
        };
    }

    /**
     * Handle notifications received while app is in foreground
     */
    static async handleForegroundNotification(notification) {
        try {
            const data = notification.request.content.data;
            const category = data?.category || 'study_reminder';

            logger.info('📱 Foreground notification received:', category, data);

            // Play custom sound for high-priority notifications
            if (category === 'exam_alert') {
                // High priority notification handling
                Vibration.vibrate([0, 1000, 500, 1000]);
            }

            // Show in-app notification banner for critical notifications
            if (data?.showInApp) {
                Alert.alert(
                    notification.request.content.title || 'Alexandria',
                    notification.request.content.body || 'You have a new notification',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            logger.error('Error handling foreground notification:', error);
        }
    }

    /**
     * 🧠 Main entry point - Schedule intelligent notifications
     */
    static async scheduleIntelligentNotifications(userId, triggerContext = 'manual', examData = null) {
        try {
            logger.info(`🧠 Starting intelligent notification scheduling for ${userId}...`);

            // Check if we should run analysis (avoid spam)
            if (!(await this.shouldRunAnalysis(userId, triggerContext))) {
                logger.info('⏭️ Skipping analysis - ran recently');
                return { skipped: true, reason: 'Recent analysis' };
            }

            // Load comprehensive user context
            const userContext = await UserAnalyzer.loadUserContext(userId);
            if (!userContext.isValid) {
                logger.info('⚠️ Invalid user context, scheduling basic notifications');
                return await this.scheduleBasicNotifications(userId);
            }

            // Analyze notification needs
            const notificationNeeds = await UserAnalyzer.analyzeNotificationNeeds(userContext, examData);

            // Generate personalized notification plan
            const notificationPlan = await ContentGenerator.createNotificationPlan(notificationNeeds, userContext);

            // Resolve conflicts and clean up existing notifications
            await ConflictResolver.cleanupAndResolveConflicts(userId);

            // Schedule the new notifications
            const scheduledCount = await CoreScheduler.scheduleNotificationPlan(notificationPlan, userId);

            // Save analysis results
            await this.saveAnalysisResults(userId, {
                analysis: notificationNeeds,
                plan: notificationPlan,
                scheduled: scheduledCount,
                triggerContext,
                timestamp: new Date().toISOString()
            });

            logger.info(`✅ Scheduled ${scheduledCount} intelligent notifications`);
            return {
                success: true,
                scheduled: scheduledCount,
                plan: notificationPlan.map(n => ({ type: n.type, timing: n.timing }))
            };

        } catch (error) {
            logger.error('❌ Error in intelligent notification scheduling:', error);
            return { error: error.message };
        }
    }

    /**
     * 📅 Schedule exam reminders (legacy compatibility)
     */
    static async scheduleExamReminder(examData, userId) {
        return await this.scheduleIntelligentNotifications(userId, 'exam_scheduled', examData);
    }

    /**
     * 🎯 Schedule remedial quiz notifications
     */
    static async scheduleRemedialNotification(userId, weakness) {
        try {
            const quiz = await WeaknessAnalysisService.generateRemedialQuiz(userId, weakness);
            if (!quiz) return false;

            const userContext = await UserAnalyzer.loadUserContext(userId);
            const baseTime = new Date();
            baseTime.setHours(baseTime.getHours() + 2);

            const notificationTime = await this.getOptimalNotificationTime(userId, baseTime, 'remedial_quiz');
            const content = ContentGenerator.generateRemedialContent(quiz, weakness, userContext);

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: content.title,
                    body: content.body,
                    data: {
                        type: 'remedial_quiz',
                        userId,
                        quizId: quiz.id,
                        topic: weakness.topic,
                        priority: quiz.priority,
                        category: 'REMEDIAL_FOCUS'
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

    /**
     * 📊 Get notification status
     */
    static async getNotificationStatus(userId) {
        try {
            const [scheduled, analysis, preferences] = await Promise.all([
                AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`),
                AsyncStorage.getItem(`${this.ANALYSIS_KEY}_${userId}`),
                AsyncStorage.getItem(`${this.PREFERENCES_KEY}_${userId}`)
            ]);

            const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const userNotifications = allNotifications.filter(n =>
                n.content.data?.userId === userId
            );

            return {
                hasScheduledNotifications: !!scheduled,
                scheduledCount: scheduled ? JSON.parse(scheduled).length : 0,
                activeCount: userNotifications.length,
                lastAnalysis: analysis ? JSON.parse(analysis).timestamp : null,
                preferences: preferences ? JSON.parse(preferences) : null,
                nextNotification: userNotifications.length > 0 ? userNotifications[0] : null
            };

        } catch (error) {
            logger.error('Error getting notification status:', error);
            return { error: error.message };
        }
    }

    /**
     * 🧹 Cancel all notifications for a user
     */
    static async cancelAllNotifications(userId) {
        try {
            await ConflictResolver.cleanupAndResolveConflicts(userId);
            await AsyncStorage.multiRemove([
                `${this.STORAGE_KEY}_${userId}`,
                `${this.ANALYSIS_KEY}_${userId}`,
                `${this.ENGAGEMENT_KEY}_${userId}`
            ]);
            return true;
        } catch (error) {
            logger.error('Error cancelling all notifications:', error);
            return false;
        }
    }

    /**
     * 📱 Handle notification responses
     */
    static async handleNotificationResponse(response) {
        const { actionIdentifier, userText, notification } = response;
        const data = notification.request.content.data;

        logger.info('📱 Notification response:', actionIdentifier, data?.type);

        try {
            switch (actionIdentifier) {
                case 'take_quiz':
                case 'default':
                    await this.handleTakeQuizAction(data);
                    break;
                case 'schedule_later':
                    await this.handleScheduleLaterAction(data, userText);
                    break;
                case 'view_progress':
                    await this.handleViewProgressAction(data);
                    break;
                case 'focus_session':
                    await this.handleFocusSessionAction(data);
                    break;
                default:
                    await this.handleDefaultTap(data);
            }

            // Track engagement
            await this.trackNotificationEngagement(data, actionIdentifier);

        } catch (error) {
            logger.error('Error handling notification response:', error);
        }
    }

    /**
     * 🎮 Action handlers
     */
    static async handleTakeQuizAction(data) {
        const pendingActionKey = `pendingAction_${data.userId}`;
        await AsyncStorage.setItem(pendingActionKey, JSON.stringify({
            type: 'TAKE_QUIZ',
            data,
            timestamp: Date.now()
        }));
    }

    static async handleScheduleLaterAction(data, userText) {
        const delayMinutes = this.parseDelayTime(userText) || 60;
        const newTriggerTime = new Date();
        newTriggerTime.setMinutes(newTriggerTime.getMinutes() + delayMinutes);

        await this.scheduleRichNotification({
            title: data.originalTitle || 'Study Reminder',
            body: `Reminder: ${data.originalBody || 'Time for a quick study session!'}`,
            categoryId: data.category || 'STUDY_REMINDER',
            data,
            trigger: { date: newTriggerTime }
        });
    }

    static async handleViewProgressAction(data) {
        const pendingActionKey = `pendingAction_${data.userId}`;
        await AsyncStorage.setItem(pendingActionKey, JSON.stringify({
            type: 'VIEW_PROGRESS',
            data,
            timestamp: Date.now()
        }));
    }

    static async handleFocusSessionAction(data) {
        const pendingActionKey = `pendingAction_${data.userId}`;
        await AsyncStorage.setItem(pendingActionKey, JSON.stringify({
            type: 'FOCUS_SESSION',
            data,
            timestamp: Date.now()
        }));
    }

    static async handleDefaultTap(data) {
        const pendingActionKey = `pendingAction_${data.userId}`;
        await AsyncStorage.setItem(pendingActionKey, JSON.stringify({
            type: 'DEFAULT_NOTIFICATION_TAP',
            data,
            timestamp: Date.now()
        }));
    }

    /**
     * 📊 Track notification engagement
     */
    static async trackNotificationEngagement(data, action, metadata = {}) {
        try {
            const engagement = {
                userId: data.userId,
                notificationType: data.type,
                category: data.category,
                action,
                timestamp: Date.now(),
                metadata
            };

            const engagementKey = `${this.ENGAGEMENT_KEY}_${data.userId}`;
            const history = await AsyncStorage.getItem(engagementKey);
            const engagementHistory = history ? JSON.parse(history) : [];

            engagementHistory.push(engagement);

            // Keep only last 100 engagements
            if (engagementHistory.length > 100) {
                engagementHistory.splice(0, engagementHistory.length - 100);
            }

            await AsyncStorage.setItem(engagementKey, JSON.stringify(engagementHistory));
            logger.info('📊 Tracked notification engagement:', action);
        } catch (error) {
            logger.error('Error tracking notification engagement:', error);
        }
    }

    /**
     * ⏰ Get optimal notification time based on user patterns
     */
    static async getOptimalNotificationTime(userId, baseTime, notificationType) {
        try {
            const quizHistory = await AsyncStorage.getItem(`quizHistory_${userId}`);
            const quizzes = quizHistory ? JSON.parse(quizHistory) : [];

            if (quizzes.length === 0) {
                return baseTime;
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

            const preferredHours = sortedHours.slice(0, 3);

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

    /**
     * 🛡️ Helper methods
     */
    static async shouldRunAnalysis(userId, triggerContext) {
        try {
            const lastAnalysis = await AsyncStorage.getItem(`${this.ANALYSIS_KEY}_${userId}`);
            if (!lastAnalysis) return true;

            const lastRun = JSON.parse(lastAnalysis);
            const hoursSinceLastRun = (Date.now() - new Date(lastRun.timestamp).getTime()) / (1000 * 60 * 60);

            const minHours = {
                quiz_completed: 2,
                daily_maintenance: 18,
                user_request: 0,
                manual: 0,
                exam_scheduled: 0,
                scheduled: 6
            };

            return hoursSinceLastRun >= (minHours[triggerContext] || 6);
        } catch (error) {
            return true;
        }
    }

    static async scheduleBasicNotifications(userId) {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(18, 0, 0, 0);

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '📚 Ready to Learn?',
                    body: 'Take a quick quiz to keep your learning momentum going!',
                    data: {
                        userId,
                        type: 'basic_motivation',
                        category: 'STUDY_REMINDER'
                    }
                },
                trigger: { date: tomorrow }
            });

            await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify([{
                id,
                type: 'basic_motivation',
                triggerTime: tomorrow.toISOString(),
                priority: 5
            }]));

            return { success: true, scheduled: 1 };
        } catch (error) {
            logger.error('Error scheduling basic notifications:', error);
            return { success: false, error: error.message };
        }
    }

    static async saveAnalysisResults(userId, results) {
        try {
            await AsyncStorage.setItem(`${this.ANALYSIS_KEY}_${userId}`, JSON.stringify(results));
        } catch (error) {
            logger.error('Error saving analysis results:', error);
        }
    }

    static parseDelayTime(userText) {
        if (!userText) return null;

        const text = userText.toLowerCase();
        const hourMatch = text.match(/(\d+)\s*hour/);
        const minuteMatch = text.match(/(\d+)\s*min/);

        if (hourMatch) return parseInt(hourMatch[1]) * 60;
        if (minuteMatch) return parseInt(minuteMatch[1]);

        return null;
    }

    /**
     * 📱 Get pending action (to be called when app opens)
     */
    static async getPendingAction(userId) {
        try {
            if (!userId) return null;

            const pendingActionKey = `pendingAction_${userId}`;
            const pendingAction = await AsyncStorage.getItem(pendingActionKey);
            if (pendingAction) {
                await AsyncStorage.removeItem(pendingActionKey);
                return JSON.parse(pendingAction);
            }
            return null;
        } catch (error) {
            logger.error('Error getting pending action:', error);
            return null;
        }
    }

    /**
     * 🧹 Daily maintenance
     */
    static async performDailyMaintenance(userId) {
        try {
            logger.info('🧹 Performing daily notification maintenance...');

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
            await this.scheduleIntelligentNotifications(userId, 'daily_maintenance');

            logger.info('✅ Daily maintenance completed');
            return true;

        } catch (error) {
            logger.error('❌ Daily maintenance failed:', error);
            return false;
        }
    }

    /**
     * 🚨 Emergency notification
     */
    static async sendEmergencyNotification(userId, title, body, data = {}) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🚨 ${title}`,
                    body,
                    data: { ...data, type: 'emergency', userId, category: 'EXAM_ALERT' }
                },
                trigger: { seconds: 1 }
            });
            return true;
        } catch (error) {
            logger.error('Error sending emergency notification:', error);
            return false;
        }
    }
}

/**
 * 🧠 User Analysis Module
 */
class UserAnalyzer {
    static async loadUserContext(userId) {
        try {
            const [
                studentProfile,
                quizHistory,
                upcomingExams,
                notificationHistory,
                weeklyStats
            ] = await Promise.all([
                StudentProfileService.getProfile(userId),
                this.getQuizHistory(userId),
                ExamScheduleService.getUserExams(userId),
                this.getNotificationHistory(userId),
                this.getWeeklyStats(userId)
            ]);

            const profileCompletion = studentProfile ?
                StudentProfileService.getProfileCompletionPercentage(studentProfile) : 0;

            return {
                isValid: !!studentProfile,
                userId,
                profile: studentProfile,
                profileCompletion,
                quizHistory: quizHistory || [],
                upcomingExams: upcomingExams || [],
                notificationHistory: notificationHistory || [],
                weeklyStats,
                preferences: this.extractUserPreferences(studentProfile),
                studyPatterns: this.analyzeStudyPatterns(quizHistory || []),
                currentTime: new Date()
            };
        } catch (error) {
            logger.error('Error loading user context:', error);
            return { isValid: false };
        }
    }

    static async analyzeNotificationNeeds(userContext, examData = null) {
        const needs = {
            urgentExamPrep: [],
            performanceIssues: [],
            motivationBoosts: [],
            streakMaintenance: null,
            weaknessAlerts: [],
            achievements: [],
            profileCompletion: null,
            smartQuizRecommendations: []
        };

        // Add exam data if provided
        if (examData) {
            const daysLeft = this.calculateDaysLeft(examData.examDate);
            const userReadiness = this.calculateExamReadiness(examData, userContext.quizHistory);

            if (daysLeft <= 7 && userReadiness < 70) {
                needs.urgentExamPrep.push({
                    exam: examData,
                    daysLeft,
                    readiness: userReadiness,
                    urgency: daysLeft <= 2 ? 'critical' : 'high'
                });
            }
        }

        // Analyze upcoming exams
        userContext.upcomingExams.forEach(exam => {
            const daysLeft = this.calculateDaysLeft(exam.examDate);
            const userReadiness = this.calculateExamReadiness(exam, userContext.quizHistory);

            if (daysLeft <= 7 && userReadiness < 70) {
                needs.urgentExamPrep.push({
                    exam,
                    daysLeft,
                    readiness: userReadiness,
                    urgency: daysLeft <= 2 ? 'critical' : 'high'
                });
            }
        });

        // Performance issues detection
        const recentPerformance = this.analyzeRecentPerformance(userContext.quizHistory);
        if (recentPerformance.trend < -15) {
            needs.performanceIssues.push({
                type: 'performance_decline',
                decline: Math.abs(recentPerformance.trend),
                category: recentPerformance.worstCategory
            });
        }

        // Motivation needed?
        const daysSinceLastActivity = this.daysSinceLastQuiz(userContext.quizHistory);
        if (daysSinceLastActivity >= 3) {
            needs.motivationBoosts.push({
                type: 'return_motivation',
                daysSince: daysSinceLastActivity,
                lastScore: userContext.quizHistory[0]?.results?.percentage || 0
            });
        }

        // Streak maintenance
        const currentStreak = this.calculateCurrentStreak(userContext.quizHistory);
        if (currentStreak >= 3) {
            needs.streakMaintenance = {
                streak: currentStreak,
                risk: daysSinceLastActivity >= 1 ? 'high' : 'low'
            };
        }

        // Profile completion
        if (userContext.profileCompletion < 80) {
            needs.profileCompletion = {
                completion: userContext.profileCompletion,
                missingAreas: this.identifyMissingProfileAreas(userContext.profile)
            };
        }

        // Weakness alerts
        if (userContext.quizHistory.length >= 3) {
            const weaknesses = await this.identifyCurrentWeaknesses(userContext.userId, userContext.quizHistory);
            needs.weaknessAlerts = weaknesses.filter(w => w.severity === 'high').slice(0, 2);
        }

        // Smart quiz recommendations
        if (userContext.quizHistory.length >= 2) {
            try {
                const quizRecs = await SmartQuizRecommendationService.getRecommendationsForNotification(
                    userContext.userId,
                    2
                );

                if (quizRecs && quizRecs.length > 0) {
                    needs.smartQuizRecommendations = quizRecs.map(quiz => ({
                        quizId: quiz.id,
                        title: quiz.title,
                        focusArea: quiz.metadata?.focusArea,
                        questionCount: quiz.questions?.length || quiz.metadata?.questionCount,
                        difficulty: quiz.metadata?.difficulty,
                        notificationContent: quiz.notification,
                        priority: this.calculateQuizRecommendationPriority(quiz, userContext)
                    }));
                }
            } catch (error) {
                logger.warn('Smart quiz recommendations not available:', error.message);
            }
        } else if (userContext.quizHistory.length === 0) {
            needs.smartQuizRecommendations.push({
                type: 'welcome_quiz',
                priority: 8,
                title: 'Welcome to Alexandria',
                focusArea: 'getting_started',
                questionCount: 5,
                difficulty: 'easy'
            });
        }

        return needs;
    }

    static extractUserPreferences(profile) {
        if (!profile) return { timePreference: 'evening', frequency: 'moderate' };

        return {
            learningStyles: profile.learningStyles || ['multiple_choice'],
            painPoints: profile.painPoints || [],
            educationLevel: profile.educationLevel,
            timePreference: this.inferTimePreference(profile),
            frequency: this.inferNotificationFrequency(profile),
            motivationStyle: this.inferMotivationStyle(profile),
            hasUpcomingDeadlines: profile.courses?.length > 0,
            studyGoals: profile.studyGoals || ''
        };
    }

    static inferTimePreference(profile) {
        if (['professional', 'phd', 'masters'].includes(profile.educationLevel)) {
            return 'evening';
        }
        if (['undergrad', 'high_school'].includes(profile.educationLevel)) {
            return 'afternoon';
        }
        return 'evening';
    }

    static inferNotificationFrequency(profile) {
        const painPoints = profile.painPoints || [];

        if (painPoints.includes('motivation') || painPoints.includes('time_management')) {
            return 'high';
        }

        if (painPoints.includes('focus')) {
            return 'minimal';
        }

        return 'moderate';
    }

    static inferMotivationStyle(profile) {
        const painPoints = profile.painPoints || [];
        const studyGoals = (profile.studyGoals || '').toLowerCase();

        if (painPoints.includes('test_anxiety') || studyGoals.includes('confidence')) {
            return 'supportive';
        }

        if (studyGoals.includes('improve') || studyGoals.includes('master') || studyGoals.includes('excel')) {
            return 'achievement';
        }

        if (['phd', 'masters'].includes(profile.educationLevel)) {
            return 'competitive';
        }

        return 'encouraging';
    }

    // Helper methods
    static async getQuizHistory(userId) {
        try {
            const history = await AsyncStorage.getItem(`quizHistory_${userId}`);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    }

    static async getNotificationHistory(userId) {
        try {
            const history = await AsyncStorage.getItem(`${UnifiedNotificationService.ENGAGEMENT_KEY}_${userId}`);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    }

    static async getWeeklyStats(userId) {
        try {
            const stats = await AsyncStorage.getItem(`weekly_stats_${userId}`);
            if (stats) {
                return JSON.parse(stats);
            }

            const quizHistory = await this.getQuizHistory(userId);
            const lastWeek = quizHistory.filter(quiz => {
                const quizDate = new Date(quiz.metadata?.completedAt || Date.now());
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return quizDate >= weekAgo;
            });

            return {
                quizzesTaken: lastWeek.length,
                averageScore: lastWeek.length > 0 ?
                    lastWeek.reduce((sum, q) => sum + (q.results?.percentage || 0), 0) / lastWeek.length : 0,
                totalTime: lastWeek.reduce((sum, q) => sum + (q.metadata?.timeSpent || 0), 0),
                streak: this.calculateCurrentStreak(quizHistory)
            };
        } catch (error) {
            return { quizzesTaken: 0, averageScore: 0, totalTime: 0, streak: 0 };
        }
    }

    static analyzeStudyPatterns(quizHistory) {
        if (!quizHistory || quizHistory.length === 0) {
            return {
                preferredTime: 'evening',
                frequency: 'low',
                averageSessionLength: 0,
                consistency: 'irregular'
            };
        }

        const hourCounts = {};
        let totalTime = 0;

        quizHistory.forEach(quiz => {
            const date = new Date(quiz.metadata?.completedAt || Date.now());
            const hour = date.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            totalTime += quiz.metadata?.timeSpent || 0;
        });

        let preferredHour = 18;
        let maxCount = 0;
        Object.keys(hourCounts).forEach(hour => {
            if (hourCounts[hour] > maxCount) {
                maxCount = hourCounts[hour];
                preferredHour = parseInt(hour);
            }
        });

        const preferredTime = preferredHour < 12 ? 'morning' :
                            preferredHour < 17 ? 'afternoon' : 'evening';

        const daysSpan = quizHistory.length > 1 ?
            (new Date(quizHistory[0].metadata?.completedAt) -
             new Date(quizHistory[quizHistory.length - 1].metadata?.completedAt)) /
            (1000 * 60 * 60 * 24) : 1;

        const frequency = quizHistory.length / Math.max(daysSpan, 1);
        const frequencyLevel = frequency > 1 ? 'high' : frequency > 0.5 ? 'moderate' : 'low';

        return {
            preferredTime,
            frequency: frequencyLevel,
            averageSessionLength: Math.round(totalTime / quizHistory.length),
            consistency: frequency > 0.8 ? 'consistent' : 'irregular'
        };
    }

    static calculateDaysLeft(examDate) {
        const now = new Date();
        const exam = new Date(examDate);
        return Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
    }

    static calculateExamReadiness(exam, quizHistory) {
        if (!quizHistory || quizHistory.length === 0) return 0;

        const examSubjects = exam.subjects || [];
        if (examSubjects.length === 0) return 50;

        const relevantQuizzes = quizHistory.filter(quiz =>
            quiz.metadata?.subjects?.some(subject => examSubjects.includes(subject))
        ).slice(0, 5);

        if (relevantQuizzes.length === 0) return 30;

        const averageScore = relevantQuizzes.reduce((sum, quiz) =>
            sum + (quiz.results?.percentage || 0), 0) / relevantQuizzes.length;

        return Math.round(averageScore);
    }

    static analyzeRecentPerformance(quizHistory) {
        if (quizHistory.length < 4) return { trend: 0, worstCategory: null };

        const recent = quizHistory.slice(0, 4);
        const older = quizHistory.slice(4, 8);

        const recentAvg = recent.reduce((sum, q) => sum + (q.results?.percentage || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, q) => sum + (q.results?.percentage || 0), 0) / older.length;

        return {
            trend: recentAvg - olderAvg,
            worstCategory: this.findWorstCategory(recent)
        };
    }

    static findWorstCategory(quizzes) {
        if (!quizzes || quizzes.length === 0) return null;

        const categoryScores = {};

        quizzes.forEach(quiz => {
            const subjects = quiz.metadata?.subjects || ['general'];
            const score = quiz.results?.percentage || 0;

            subjects.forEach(subject => {
                if (!categoryScores[subject]) {
                    categoryScores[subject] = { total: 0, count: 0 };
                }
                categoryScores[subject].total += score;
                categoryScores[subject].count++;
            });
        });

        let worstCategory = null;
        let worstScore = 100;

        Object.keys(categoryScores).forEach(category => {
            const avg = categoryScores[category].total / categoryScores[category].count;
            if (avg < worstScore) {
                worstScore = avg;
                worstCategory = category;
            }
        });

        return worstCategory;
    }

    static daysSinceLastQuiz(quizHistory) {
        if (quizHistory.length === 0) return 999;

        const lastQuizDate = new Date(quizHistory[0].metadata?.completedAt || Date.now());
        const now = new Date();
        return Math.floor((now - lastQuizDate) / (1000 * 60 * 60 * 24));
    }

    static calculateCurrentStreak(quizHistory) {
        if (!quizHistory || quizHistory.length === 0) return 0;

        let streak = 0;
        const today = new Date();

        const sortedHistory = [...quizHistory].sort((a, b) =>
            new Date(b.metadata?.completedAt || 0) - new Date(a.metadata?.completedAt || 0)
        );

        for (let i = 0; i < sortedHistory.length; i++) {
            const quizDate = new Date(sortedHistory[i].metadata?.completedAt);
            const daysDiff = Math.floor((today - quizDate) / (1000 * 60 * 60 * 24));

            if (daysDiff <= i + 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    static identifyMissingProfileAreas(profile) {
        const missing = [];
        if (!profile.courses || profile.courses.length === 0) missing.push('courses');
        if (!profile.studyGoals) missing.push('study_goals');
        if (!profile.learningStyles || profile.learningStyles.length === 0) missing.push('learning_styles');
        return missing;
    }

    static async identifyCurrentWeaknesses(userId, quizHistory) {
        try {
            if (WeaknessAnalysisService && WeaknessAnalysisService.analyzeWeaknesses) {
                return await WeaknessAnalysisService.analyzeWeaknesses(userId);
            }

            if (!quizHistory || quizHistory.length < 3) return [];

            const recentQuizzes = quizHistory.slice(0, 5);
            const subjectPerformance = {};

            recentQuizzes.forEach(quiz => {
                const subjects = quiz.metadata?.subjects || ['general'];
                const score = quiz.results?.percentage || 0;

                subjects.forEach(subject => {
                    if (!subjectPerformance[subject]) {
                        subjectPerformance[subject] = [];
                    }
                    subjectPerformance[subject].push(score);
                });
            });

            const weaknesses = [];
            Object.keys(subjectPerformance).forEach(subject => {
                const scores = subjectPerformance[subject];
                const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

                if (avgScore < 70) {
                    weaknesses.push({
                        subject,
                        averageScore: avgScore,
                        severity: avgScore < 50 ? 'high' : 'medium',
                        occurrences: scores.length
                    });
                }
            });

            return weaknesses;
        } catch (error) {
            logger.error('Error identifying weaknesses:', error);
            return [];
        }
    }

    static calculateQuizRecommendationPriority(recommendation, userContext) {
        let priority = 5;

        if (recommendation.focusArea === 'weakness_reinforcement') {
            priority += 3;
        }

        const daysSinceLastQuiz = this.daysSinceLastQuiz(userContext.quizHistory);
        if (daysSinceLastQuiz >= 3) priority += 1;
        if (daysSinceLastQuiz >= 7) priority += 2;

        const preferredDifficulty = userContext.preferences.learningStyles?.includes('challenging') ? 'hard' : 'medium';
        if (recommendation.difficulty === preferredDifficulty) {
            priority += 1;
        }

        if (recommendation.focusArea === 'exam_preparation') {
            priority += 2;
        }

        return Math.min(priority, 10);
    }
}

/**
 * 📅 Core Scheduler Module
 */
class CoreScheduler {
    static async scheduleNotificationPlan(plan, userId) {
        let scheduledCount = 0;
        const scheduledIds = [];

        for (const notification of plan) {
            try {
                const category = UnifiedNotificationService.CATEGORIES[notification.category] ||
                               UnifiedNotificationService.CATEGORIES.STUDY_REMINDER;

                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: notification.content.title,
                        body: notification.content.body,
                        data: {
                            ...notification.data,
                            userId,
                            type: notification.type,
                            priority: notification.priority,
                            category: notification.category,
                            source: 'unified_system'
                        },
                        categoryIdentifier: category.id,
                        sound: category.sound,
                    },
                    trigger: { date: notification.timing }
                });

                scheduledIds.push({
                    id,
                    type: notification.type,
                    category: notification.category,
                    triggerTime: notification.timing.toISOString(),
                    priority: notification.priority
                });

                scheduledCount++;
            } catch (error) {
                logger.error('Error scheduling individual notification:', error);
            }
        }

        // Save scheduled notification IDs for tracking
        await AsyncStorage.setItem(
            `${UnifiedNotificationService.STORAGE_KEY}_${userId}`,
            JSON.stringify(scheduledIds)
        );

        return scheduledCount;
    }

    static async scheduleRichNotification({
        title,
        body,
        categoryId = 'STUDY_REMINDER',
        data = {},
        trigger,
        actions = [],
        customSound = null,
        badge = null,
        image = null,
        progress = null
    }) {
        try {
            const category = UnifiedNotificationService.CATEGORIES[categoryId] ||
                           UnifiedNotificationService.CATEGORIES.STUDY_REMINDER;

            const content = {
                title,
                body,
                data: {
                    ...data,
                    category: categoryId,
                    timestamp: Date.now()
                },
                categoryIdentifier: category.id,
                sound: customSound || category.sound,
            };

            if (badge !== null) {
                content.badge = badge;
            }

            if (image) {
                content.attachments = [{
                    identifier: 'image',
                    url: image,
                    options: {
                        typeHint: 'public.image'
                    }
                }];
            }

            if (progress !== null) {
                content.data.progress = progress;
            }

            const notificationId = await Notifications.scheduleNotificationAsync({
                content,
                trigger
            });

            logger.info('📬 Rich notification scheduled:', notificationId);
            return notificationId;
        } catch (error) {
            logger.error('Error scheduling rich notification:', error);
            return null;
        }
    }

    static async scheduleProgressiveSeries(userId, topic, baseTime, count = 5) {
        try {
            const notificationIds = [];
            const intervals = [1, 3, 7, 14, 30]; // Days - spaced repetition pattern

            for (let i = 0; i < Math.min(count, intervals.length); i++) {
                const triggerTime = new Date(baseTime);
                triggerTime.setDate(triggerTime.getDate() + intervals[i]);

                const motivationLevel = ['🌟', '🚀', '💪', '🎯', '🏆'][i];
                const intensity = ['gentle', 'encouraging', 'motivating', 'challenging', 'celebrating'][i];

                const notificationId = await this.scheduleRichNotification({
                    title: `${motivationLevel} ${topic} Mastery Journey`,
                    body: ContentGenerator.getProgressiveMessage(topic, i + 1, intensity),
                    categoryId: 'STUDY_REMINDER',
                    data: {
                        type: 'progressive_series',
                        userId,
                        topic,
                        seriesIndex: i + 1,
                        totalSeries: count
                    },
                    trigger: { date: triggerTime },
                });

                if (notificationId) {
                    notificationIds.push(notificationId);
                }
            }

            logger.info(`📚 Scheduled ${notificationIds.length} progressive reminders for ${topic}`);
            return notificationIds;
        } catch (error) {
            logger.error('Error scheduling progressive series:', error);
            return [];
        }
    }

    static async scheduleSmartReminders(userId, quizData, userPerformance) {
        try {
            const forgettingCurve = this.calculateForgettingCurve(userPerformance);
            const reminders = [];

            const baseScore = userPerformance.score || 0;
            const difficulty = userPerformance.difficulty || 'medium';

            const performanceMultiplier = Math.max(0.5, Math.min(2.0, (100 - baseScore) / 50));
            const difficultyMultiplier = { easy: 0.7, medium: 1.0, hard: 1.5 }[difficulty] || 1.0;

            const intervals = [
                1 * performanceMultiplier * difficultyMultiplier,
                3 * performanceMultiplier * difficultyMultiplier,
                7 * performanceMultiplier * difficultyMultiplier,
                21 * performanceMultiplier * difficultyMultiplier,
            ];

            for (let i = 0; i < intervals.length; i++) {
                const triggerTime = new Date();
                triggerTime.setDate(triggerTime.getDate() + Math.ceil(intervals[i]));

                const retention = forgettingCurve.getRetentionAt(intervals[i]);
                const urgency = retention < 0.5 ? 'high' : retention < 0.7 ? 'medium' : 'low';

                const reminder = await this.scheduleRichNotification({
                    title: ContentGenerator.getSmartReminderTitle(quizData.topic, urgency),
                    body: ContentGenerator.getSmartReminderBody(retention, urgency),
                    categoryId: urgency === 'high' ? 'EXAM_ALERT' : 'STUDY_REMINDER',
                    data: {
                        type: 'smart_reminder',
                        userId,
                        quizId: quizData.id,
                        topic: quizData.topic,
                        expectedRetention: retention,
                        urgency
                    },
                    trigger: { date: triggerTime },
                    progress: Math.round(retention * 100)
                });

                if (reminder) {
                    reminders.push(reminder);
                }
            }

            logger.info(`🧠 Scheduled ${reminders.length} smart reminders based on forgetting curve`);
            return reminders;
        } catch (error) {
            logger.error('Error scheduling smart reminders:', error);
            return [];
        }
    }

    static calculateForgettingCurve(performance) {
        const initialRetention = (performance.score || 0) / 100;
        const decayRate = 0.3 * (1 - (performance.confidence || 0.5));

        return {
            getRetentionAt: (days) => {
                return initialRetention * Math.exp(-decayRate * days);
            },
            getOptimalReviewTime: (targetRetention = 0.6) => {
                return Math.log(initialRetention / targetRetention) / decayRate;
            }
        };
    }
}

/**
 * 📝 Content Generator Module
 */
class ContentGenerator {
    static async createNotificationPlan(needs, userContext) {
        const plan = [];
        const now = new Date();
        const preferences = userContext.preferences;

        // 1. Critical exam notifications (highest priority)
        needs.urgentExamPrep.forEach(examNeed => {
            if (examNeed.urgency === 'critical') {
                plan.push({
                    type: 'exam_reminder',
                    category: 'EXAM_ALERT',
                    priority: 10,
                    timing: this.getOptimalNotificationTime(now, 2, preferences),
                    content: this.generateExamReminderContent(examNeed, userContext, 'critical'),
                    data: { examId: examNeed.exam.id, urgency: 'critical' }
                });
            }
        });

        // 2. Performance intervention notifications
        needs.performanceIssues.forEach(issue => {
            plan.push({
                type: 'performance_feedback',
                category: 'PERFORMANCE_ALERT',
                priority: 8,
                timing: this.getOptimalNotificationTime(now, 4, preferences),
                content: this.generatePerformanceContent(issue, userContext),
                data: { type: issue.type, category: issue.category }
            });
        });

        // 3. Motivation notifications
        needs.motivationBoosts.forEach(motivation => {
            plan.push({
                type: 'study_motivation',
                category: 'STUDY_REMINDER',
                priority: 6,
                timing: this.getOptimalNotificationTime(now, 6, preferences),
                content: this.generateMotivationContent(motivation, userContext),
                data: { daysSince: motivation.daysSince }
            });
        });

        // 4. Streak maintenance
        if (needs.streakMaintenance && needs.streakMaintenance.risk === 'high') {
            plan.push({
                type: 'streak_maintenance',
                category: 'STUDY_REMINDER',
                priority: 7,
                timing: this.getOptimalNotificationTime(now, 12, preferences),
                content: this.generateStreakContent(needs.streakMaintenance, userContext),
                data: { streak: needs.streakMaintenance.streak }
            });
        }

        // 5. Profile completion (if significantly incomplete)
        if (needs.profileCompletion && needs.profileCompletion.completion < 60) {
            plan.push({
                type: 'profile_completion',
                category: 'PROGRESS_UPDATE',
                priority: 4,
                timing: this.getOptimalNotificationTime(now, 24, preferences),
                content: this.generateProfileCompletionContent(needs.profileCompletion, userContext),
                data: { completion: needs.profileCompletion.completion }
            });
        }

        // 6. Smart quiz recommendations
        needs.smartQuizRecommendations.forEach((rec, index) => {
            plan.push({
                type: 'smart_quiz_recommendation',
                category: 'QUIZ_RECOMMENDATION',
                priority: rec.priority || 7,
                timing: this.getOptimalNotificationTime(now, 8 + (index * 4), preferences),
                content: rec.notificationContent || this.generateQuizRecommendationContent(rec, userContext),
                data: {
                    quizId: rec.quizId,
                    focusArea: rec.focusArea,
                    questionCount: rec.questionCount,
                    difficulty: rec.difficulty,
                    type: rec.type || 'personalized_quiz'
                }
            });
        });

        // 7. Weakness alerts
        needs.weaknessAlerts.forEach(weakness => {
            plan.push({
                type: 'weakness_alert',
                category: 'REMEDIAL_FOCUS',
                priority: 8,
                timing: this.getOptimalNotificationTime(now, 4, preferences),
                content: this.generateWeaknessContent(weakness, userContext),
                data: {
                    weakness: weakness.subject,
                    severity: weakness.severity,
                    averageScore: weakness.averageScore
                }
            });
        });

        // Sort by priority and limit daily notifications
        return this.optimizeNotificationPlan(plan, userContext);
    }

    static getOptimalNotificationTime(baseTime, hoursFromNow, preferences) {
        const notificationTime = new Date(baseTime);
        notificationTime.setHours(notificationTime.getHours() + hoursFromNow);

        let preferredHour = 18;

        switch (preferences.timePreference) {
            case 'morning':
                preferredHour = 9;
                break;
            case 'afternoon':
                preferredHour = 15;
                break;
            case 'evening':
                preferredHour = 18;
                break;
        }

        const currentHour = notificationTime.getHours();
        if (Math.abs(currentHour - preferredHour) > 2) {
            notificationTime.setHours(preferredHour, 0, 0, 0);

            if (notificationTime <= new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }
        }

        return notificationTime;
    }

    static generateExamReminderContent(examNeed, userContext, urgency) {
        const profile = userContext.profile;
        const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Student';
        const motivationStyle = userContext.preferences.motivationStyle;

        let title, body;

        if (urgency === 'critical') {
            title = `🚨 ${firstName}, Exam Alert!`;

            if (motivationStyle === 'supportive') {
                body = `Your ${examNeed.exam.examTitle} is in ${examNeed.daysLeft} day${examNeed.daysLeft !== 1 ? 's' : ''}. Take a deep breath - you've got this! Ready for a focused review session?`;
            } else if (motivationStyle === 'competitive') {
                body = `${examNeed.exam.examTitle} is in ${examNeed.daysLeft} day${examNeed.daysLeft !== 1 ? 's' : ''}. Time to show what you've learned! Ready to dominate this exam?`;
            } else {
                body = `Your ${examNeed.exam.examTitle} is coming up in ${examNeed.daysLeft} day${examNeed.daysLeft !== 1 ? 's' : ''}. Let's do a final review to boost your confidence!`;
            }
        } else {
            title = `📚 ${firstName}, Exam Reminder`;
            body = `Your ${examNeed.exam.examTitle} is in ${examNeed.daysLeft} days. You're ${examNeed.readiness}% ready. Let's practice!`;
        }

        return { title, body };
    }

    static generatePerformanceContent(issue, userContext) {
        const profile = userContext.profile;
        const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Student';

        return {
            title: `📈 ${firstName}, Let's Turn This Around`,
            body: `I noticed your scores dropped ${issue.decline}% recently. No worries - everyone has rough patches! Ready to get back on track with some focused practice?`
        };
    }

    static generateMotivationContent(motivation, userContext) {
        const profile = userContext.profile;
        const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Student';
        const motivationStyle = userContext.preferences.motivationStyle;

        let body;
        if (motivationStyle === 'supportive') {
            body = `Hey ${firstName}! It's been ${motivation.daysSince} days since your last quiz. No pressure - when you're ready, Alexandria is here to support your learning journey! 🌟`;
        } else if (motivationStyle === 'competitive') {
            body = `${firstName}, it's been ${motivation.daysSince} days! Champions maintain their momentum. Ready to reclaim your study streak? 🏆`;
        } else {
            body = `${firstName}, ready to jump back in? It's been ${motivation.daysSince} days since your last quiz. Even a quick 5-minute session can reignite your learning momentum! ✨`;
        }

        return {
            title: `💪 Come Back Stronger, ${firstName}!`,
            body
        };
    }

    static generateStreakContent(streakMaintenance, userContext) {
        const profile = userContext.profile;
        const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Student';

        return {
            title: `🔥 ${firstName}, Keep That Streak Alive!`,
            body: `You're on a ${streakMaintenance.streak}-day streak! Don't let it break now - just one quick quiz to keep the momentum going! 🚀`
        };
    }

    static generateProfileCompletionContent(profileCompletion, userContext) {
        const profile = userContext.profile;
        const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Student';

        return {
            title: `⚙️ ${firstName}, Complete Your Profile`,
            body: `Your profile is ${profileCompletion.completion}% complete. Adding more details helps me provide better personalized quizzes and recommendations! 🎯`
        };
    }

    static generateQuizRecommendationContent(recommendation, userContext) {
        const profile = userContext.profile;
        const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Student';
        const motivationStyle = userContext.preferences.motivationStyle;

        let title, body;

        if (recommendation.type === 'welcome_quiz') {
            title = `🎉 Welcome to Alexandria, ${firstName}!`;
            body = `Ready to see what you know? I've prepared a quick 5-question quiz to help personalize your learning experience!`;
        } else {
            const focusAreaText = this.getFocusAreaDisplayText(recommendation.focusArea);
            const difficultyEmoji = {
                'easy': '🌱',
                'medium': '🌟',
                'hard': '🔥'
            }[recommendation.difficulty] || '📚';

            if (motivationStyle === 'supportive') {
                title = `${difficultyEmoji} ${firstName}, I Made Something for You`;
                body = `I've created a ${recommendation.questionCount}-question quiz focusing on ${focusAreaText}. Take it whenever you're ready - no pressure! 💙`;
            } else if (motivationStyle === 'competitive') {
                title = `${difficultyEmoji} Challenge Ready, ${firstName}!`;
                body = `Time to conquer ${focusAreaText}! I've prepared a ${recommendation.questionCount}-question challenge that'll push your skills. Ready to dominate? 🏆`;
            } else if (motivationStyle === 'achievement') {
                title = `${difficultyEmoji} Level Up Time, ${firstName}!`;
                body = `Master ${focusAreaText} with this ${recommendation.questionCount}-question quiz I created just for you. Each question gets you closer to your goals! 🎯`;
            } else {
                title = `${difficultyEmoji} Fresh Quiz Ready, ${firstName}!`;
                body = `I've crafted a ${recommendation.questionCount}-question quiz on ${focusAreaText} based on your learning patterns. Let's see how you do! ✨`;
            }
        }

        return { title, body };
    }

    static generateWeaknessContent(weakness, userContext) {
        const profile = userContext.profile;
        const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Student';

        return {
            title: `🎯 ${firstName}, Focus Area Alert`,
            body: `Your ${weakness.subject} average is ${Math.round(weakness.averageScore)}%. Let's boost this with targeted practice! Ready for a focused session?`
        };
    }

    static generateRemedialContent(quiz, weakness, userContext) {
        const profile = userContext.profile;
        const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Student';
        const isHighPriority = quiz.priority === 'high';
        const emoji = isHighPriority ? '🚨' : '🎯';

        return {
            title: `${emoji} ${firstName}, Focus Time`,
            body: `Ready to strengthen your ${quiz.targetTopic.replace('_', ' ')} skills? I've prepared ${quiz.questionCount} targeted questions just for you! 💪`
        };
    }

    static getFocusAreaDisplayText(focusArea) {
        const displayTexts = {
            'weakness_reinforcement': 'areas you want to strengthen',
            'exam_preparation': 'exam readiness',
            'subject_mastery': 'subject mastery',
            'question_type_practice': 'question techniques',
            'getting_started': 'the basics',
            'general': 'your learning goals'
        };

        return displayTexts[focusArea] || 'your studies';
    }

    static optimizeNotificationPlan(plan, userContext) {
        const sortedPlan = [...plan].sort((a, b) => b.priority - a.priority);

        const dailyLimits = {};
        Object.values(UnifiedNotificationService.CATEGORIES).forEach(category => {
            dailyLimits[category.id] = category.maxDaily;
        });

        const typeCounts = {};
        const optimizedPlan = [];

        sortedPlan.forEach(notification => {
            const category = notification.category;
            const currentCount = typeCounts[category] || 0;
            const limit = dailyLimits[category] || 1;

            if (currentCount < limit) {
                optimizedPlan.push(notification);
                typeCounts[category] = currentCount + 1;
            }
        });

        const maxTotal = userContext.preferences.frequency === 'minimal' ? 3 :
                        userContext.preferences.frequency === 'moderate' ? 6 : 8;

        return optimizedPlan.slice(0, maxTotal);
    }

    static getProgressiveMessage(topic, index, intensity) {
        const messages = {
            gentle: [
                `Time for a gentle review of ${topic}. No pressure! 😊`,
                `A quick ${topic} refresher might be nice today.`,
                `Ready to revisit ${topic} when you have a moment?`,
            ],
            encouraging: [
                `You're doing great! Let's keep ${topic} fresh in your mind. 💪`,
                `Your ${topic} skills are improving! Ready for another round?`,
                `Building momentum with ${topic}. You've got this! 🌟`,
            ],
            motivating: [
                `Time to power through ${topic}! You're on fire! 🔥`,
                `${topic} mastery awaits! Let's push your limits today.`,
                `Ready to dominate ${topic}? Show what you've learned! ⚡`,
            ],
            challenging: [
                `${topic} challenge mode: activated! Think you can handle it? 🎯`,
                `Time to prove your ${topic} expertise. Are you ready?`,
                `Advanced ${topic} session loading... Bring your A-game! 🚀`,
            ],
            celebrating: [
                `${topic} champion in the making! One more victory lap? 🏆`,
                `You've mastered ${topic}! Ready to show off your skills?`,
                `${topic} expert status: almost unlocked! Final push! ⭐`,
            ]
        };

        const categoryMessages = messages[intensity] || messages.gentle;
        return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
    }

    static getSmartReminderTitle(topic, urgency) {
        const titles = {
            high: [
                `⚠️ ${topic} Knowledge Fading!`,
                `🆘 Quick ${topic} Review Needed`,
                `⏰ Critical ${topic} Refresh Time`,
            ],
            medium: [
                `🔄 ${topic} Refresh Time`,
                `📚 ${topic} Review Recommended`,
                `💡 ${topic} Memory Boost`,
            ],
            low: [
                `✨ ${topic} Polish Time`,
                `🌟 ${topic} Maintenance`,
                `📖 Gentle ${topic} Review`,
            ]
        };

        const urgencyTitles = titles[urgency] || titles.medium;
        return urgencyTitles[Math.floor(Math.random() * urgencyTitles.length)];
    }

    static getSmartReminderBody(retention, urgency) {
        const retentionPercent = Math.round(retention * 100);

        if (urgency === 'high') {
            return `Your retention is at ${retentionPercent}%. Don't let this knowledge slip away! 💪`;
        } else if (urgency === 'medium') {
            return `Keep your knowledge sharp! Current retention: ${retentionPercent}%. 🎯`;
        } else {
            return `You're doing well! Retention at ${retentionPercent}%. A quick review will lock it in! ✨`;
        }
    }
}

/**
 * ⚙️ Preference Manager Module
 */
class PreferenceManager {
    static async getNotificationPreferences(userId) {
        try {
            const preferences = await AsyncStorage.getItem(`${UnifiedNotificationService.PREFERENCES_KEY}_${userId}`);
            if (preferences) {
                return JSON.parse(preferences);
            }

            return {
                examReminders: true,
                studyReminders: true,
                performanceAlerts: true,
                quizRecommendations: true,
                progressUpdates: true,
                achievements: true,
                remedialFocus: true,
                quietHoursEnabled: false,
                quietHoursStart: '22:00',
                quietHoursEnd: '08:00',
                reminderFrequency: 'moderate',
                soundEnabled: true,
                vibrationEnabled: true,
                customMessages: true,
                motivationStyle: 'encouraging'
            };
        } catch (error) {
            logger.error('Error getting notification preferences:', error);
            return {};
        }
    }

    static async saveNotificationPreferences(userId, preferences) {
        try {
            await AsyncStorage.setItem(
                `${UnifiedNotificationService.PREFERENCES_KEY}_${userId}`,
                JSON.stringify(preferences)
            );
            return true;
        } catch (error) {
            logger.error('Error saving notification preferences:', error);
            return false;
        }
    }

    static async updatePreference(userId, key, value) {
        try {
            const preferences = await this.getNotificationPreferences(userId);
            preferences[key] = value;
            return await this.saveNotificationPreferences(userId, preferences);
        } catch (error) {
            logger.error('Error updating preference:', error);
            return false;
        }
    }

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
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    static adjustForQuietHours(date, preferences) {
        const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
        const adjustedDate = new Date(date);
        adjustedDate.setHours(endHour, endMinute, 0, 0);

        if (adjustedDate <= new Date()) {
            adjustedDate.setDate(adjustedDate.getDate() + 1);
        }

        return adjustedDate;
    }
}

/**
 * 🛡️ Conflict Resolver Module
 */
class ConflictResolver {
    static async cleanupAndResolveConflicts(userId) {
        try {
            const conflicts = [];

            // Get all scheduled notifications
            const allNotifications = await Notifications.getAllScheduledNotificationsAsync();

            // Filter user notifications
            const userNotifications = allNotifications.filter(notif =>
                notif.content.data?.userId === userId ||
                notif.content.data?.source === 'unified_system'
            );

            // Group by trigger time (within 30 minutes = conflict)
            const timeGroups = new Map();

            userNotifications.forEach(notif => {
                const triggerTime = new Date(notif.trigger.date || Date.now() + (notif.trigger.seconds * 1000));
                const timeKey = Math.floor(triggerTime.getTime() / (30 * 60 * 1000)); // 30-minute buckets

                if (!timeGroups.has(timeKey)) {
                    timeGroups.set(timeKey, []);
                }
                timeGroups.get(timeKey).push(notif);
            });

            // Resolve conflicts by keeping only the highest priority notification per time slot
            for (const [timeKey, notifications] of timeGroups) {
                if (notifications.length > 1) {
                    const sorted = notifications.sort((a, b) =>
                        this.getNotificationPriority(b) - this.getNotificationPriority(a)
                    );
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

            // Remove expired notifications
            const now = new Date();
            for (const notif of userNotifications) {
                const triggerTime = new Date(notif.trigger.date || Date.now() + (notif.trigger.seconds * 1000));
                if (triggerTime < now) {
                    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                }
            }

            logger.info(`🔧 Resolved ${conflicts.length} notification conflicts`);
            return conflicts;

        } catch (error) {
            logger.error('Error resolving conflicts:', error);
            return [];
        }
    }

    static getNotificationPriority(notification) {
        const data = notification.content.data || {};
        const category = data.category || 'STUDY_REMINDER';
        const notificationCategory = UnifiedNotificationService.CATEGORIES[category];

        return notificationCategory ? notificationCategory.priority : 5;
    }

    static async cancelNotificationsByType(userId, type) {
        try {
            const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const targetNotifications = allNotifications.filter(notif =>
                notif.content.data?.userId === userId &&
                notif.content.data?.type === type
            );

            for (const notif of targetNotifications) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }

            logger.info(`Cancelled ${targetNotifications.length} notifications of type: ${type}`);
            return targetNotifications.length;
        } catch (error) {
            logger.error('Error cancelling notifications by type:', error);
            return 0;
        }
    }

    static async cancelNotificationsByCategory(userId, category) {
        try {
            const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const targetNotifications = allNotifications.filter(notif =>
                notif.content.data?.userId === userId &&
                notif.content.data?.category === category
            );

            for (const notif of targetNotifications) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }

            logger.info(`Cancelled ${targetNotifications.length} notifications of category: ${category}`);
            return targetNotifications.length;
        } catch (error) {
            logger.error('Error cancelling notifications by category:', error);
            return 0;
        }
    }
}

// Export the unified service and its modules
export { UserAnalyzer, CoreScheduler, ContentGenerator, PreferenceManager, ConflictResolver };
export default UnifiedNotificationService;