import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { StudentProfileService } from '../services/StudentProfileService';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';
import { ExamScheduleService } from './examScheduleService';
import SmartQuizRecommendationService from '../services/SmartQuizRecommendationService';
import { useTranslation } from 'react-i18next';
import logger from '../utils/logger';


/**
 * 🧠 Intelligent Notification System
 * 
 * A unified, personalized notification system that:
 * - Uses student profile data for personalization
 * - Eliminates duplicate notifications
 * - Respects user preferences and study patterns
 * - Provides contextually relevant messages
 * - Manages notification frequency intelligently
 */
export class IntelligentNotificationSystem {
    static STORAGE_KEY = 'intelligent_notifications';
    static LAST_ANALYSIS_KEY = 'last_notification_analysis';
    static NOTIFICATION_HISTORY_KEY = 'notification_history';
    
    // Notification frequency limits per type per day
    static MAX_DAILY_NOTIFICATIONS = {
        exam_reminder: 3,
        study_motivation: 2,
        performance_feedback: 1,
        streak_maintenance: 1,
        weakness_focus: 2,
        achievement_celebration: 1,
        profile_completion: 1,
        smart_quiz_recommendation: 2  // New: Smart quiz recommendations
    };

    /**
     * 🎯 Main orchestrator - analyzes user and schedules intelligent notifications
     */
    static async schedulePersonalizedNotifications(userId, triggerContext = 'scheduled') {
        try {
            logger.info(`🧠 Starting intelligent notification analysis for ${userId}...`);
            
            // 1. Check if we should run analysis (avoid spam)
            if (!(await this.shouldRunAnalysis(userId, triggerContext))) {
                logger.info('⏭️ Skipping analysis - ran recently or user inactive');
                return { skipped: true, reason: 'Recent analysis or user inactive' };
            }

            // 2. Load comprehensive user context
            const userContext = await this.loadUserContext(userId);
            if (!userContext.isValid) {
                logger.info('⚠️ Invalid user context, scheduling basic notifications');
                return await this.scheduleBasicNotifications(userId);
            }

            // 3. Analyze notification needs
            const notificationNeeds = await this.analyzeNotificationNeeds(userContext);

            // 4. Generate personalized notification plan
            const notificationPlan = await this.createPersonalizedNotificationPlan(
                notificationNeeds, 
                userContext
            );

            // 5. Clean up existing notifications to prevent duplicates
            await this.cleanupRedundantNotifications(userId);

            // 6. Schedule the new notifications
            const scheduledCount = await this.scheduleNotificationPlan(notificationPlan, userId);

            // 7. Track analysis and results
            await this.saveAnalysisResults(userId, {
                analysis: notificationNeeds,
                plan: notificationPlan,
                scheduled: scheduledCount,
                triggerContext,
                timestamp: new Date().toISOString()
            });

            logger.info(`✅ Scheduled ${scheduledCount} personalized notifications`);
            return { 
                success: true, 
                scheduled: scheduledCount, 
                plan: notificationPlan.map(n => ({ type: n.type, timing: n.timing }))
            };

        } catch (error) {
            logger.error('❌ Error in intelligent notification system:', error);
            return { error: error.message };
        }
    }

    /**
     * 📊 Load comprehensive user context
     */
    static async loadUserContext(userId) {
        try {
            // Load all user data
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

    /**
     * 🧩 Extract user preferences from profile
     */
    static extractUserPreferences(profile) {
        if (!profile) return { timePreference: 'evening', frequency: 'moderate' };

        const preferences = {
            // Learning style influences notification content
            learningStyles: profile.learningStyles || ['multiple_choice'],
            painPoints: profile.painPoints || [],
            educationLevel: profile.educationLevel,
            
            // Inferred preferences
            timePreference: this.inferTimePreference(profile),
            frequency: this.inferNotificationFrequency(profile),
            motivationStyle: this.inferMotivationStyle(profile),
            
            // Study goals influence urgency
            hasUpcomingDeadlines: profile.courses?.length > 0,
            studyGoals: profile.studyGoals || ''
        };

        return preferences;
    }

    /**
     * 🕐 Infer best notification times from user profile
     */
    static inferTimePreference(profile) {
        // If user is a professional or graduate student, prefer evening
        if (['professional', 'phd', 'masters'].includes(profile.educationLevel)) {
            return 'evening'; // 6-8 PM
        }
        // If undergraduate or high school, prefer afternoon
        if (['undergrad', 'high_school'].includes(profile.educationLevel)) {
            return 'afternoon'; // 3-5 PM  
        }
        return 'evening'; // Default
    }

    /**
     * 📈 Infer notification frequency from user profile and pain points
     */
    static inferNotificationFrequency(profile) {
        const painPoints = profile.painPoints || [];
        
        // High frequency for users struggling with motivation or time management
        if (painPoints.includes('motivation') || painPoints.includes('time_management')) {
            return 'high';
        }
        
        // Low frequency for users with focus issues (less distraction)
        if (painPoints.includes('focus')) {
            return 'minimal';
        }
        
        return 'moderate'; // Default
    }

    /**
     * 💪 Infer motivation style from profile
     */
    static inferMotivationStyle(profile) {
        const painPoints = profile.painPoints || [];
        const studyGoals = (profile.studyGoals || '').toLowerCase();
        
        // Supportive for test anxiety or confidence issues
        if (painPoints.includes('test_anxiety') || studyGoals.includes('confidence')) {
            return 'supportive';
        }
        
        // Achievement-focused for goal-oriented users
        if (studyGoals.includes('improve') || studyGoals.includes('master') || studyGoals.includes('excel')) {
            return 'achievement';
        }
        
        // Competitive for users with high education levels
        if (['phd', 'masters'].includes(profile.educationLevel)) {
            return 'competitive';
        }
        
        return 'encouraging'; // Default
    }

    /**
     * 🔍 Analyze what notifications the user actually needs
     */
    static async analyzeNotificationNeeds(userContext) {
        const needs = {
            urgentExamPrep: [],
            performanceIssues: [],
            motivationBoosts: [],
            streakMaintenance: null,
            weaknessAlerts: [],
            achievements: [],
            profileCompletion: null,
            smartQuizRecommendations: []  // New: Smart quiz recommendations
        };

        // 1. Urgent exam preparation
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

        // 2. Performance issues detection  
        const recentPerformance = this.analyzeRecentPerformance(userContext.quizHistory);
        if (recentPerformance.trend < -15) { // 15% decline
            needs.performanceIssues.push({
                type: 'performance_decline',
                decline: Math.abs(recentPerformance.trend),
                category: recentPerformance.worstCategory
            });
        }

        // 3. Motivation needed?
        const daysSinceLastActivity = this.daysSinceLastQuiz(userContext.quizHistory);
        if (daysSinceLastActivity >= 3) {
            needs.motivationBoosts.push({
                type: 'return_motivation',
                daysSince: daysSinceLastActivity,
                lastScore: userContext.quizHistory[0]?.results?.percentage || 0
            });
        }

        // 4. Streak maintenance
        const currentStreak = this.calculateCurrentStreak(userContext.quizHistory);
        if (currentStreak >= 3) {
            needs.streakMaintenance = {
                streak: currentStreak,
                risk: daysSinceLastActivity >= 1 ? 'high' : 'low'
            };
        }

        // 5. Profile completion
        if (userContext.profileCompletion < 80) {
            needs.profileCompletion = {
                completion: userContext.profileCompletion,
                missingAreas: this.identifyMissingProfileAreas(userContext.profile)
            };
        }

        // 6. Weakness alerts
        if (userContext.quizHistory.length >= 3) {
            const weaknesses = await this.identifyCurrentWeaknesses(
                userContext.userId, 
                userContext.quizHistory
            );
            needs.weaknessAlerts = weaknesses.filter(w => w.severity === 'high').slice(0, 2);
        }

        // 7. Smart quiz recommendations
        if (userContext.quizHistory.length >= 2) {
            const quizRecs = await SmartQuizRecommendationService.getRecommendationsForNotification(
                userContext.userId, 
                2 // Max 2 recommendations
            );
            
            if (quizRecs.length > 0) {
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
        } else if (userContext.quizHistory.length === 0) {
            // New user - offer welcome quiz
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

    /**
     * 📋 Create personalized notification plan
     */
    static async createPersonalizedNotificationPlan(needs, userContext) {
        const plan = [];
        const now = new Date();
        const preferences = userContext.preferences;
        
        // 1. Critical exam notifications (highest priority)
        needs.urgentExamPrep.forEach(examNeed => {
            if (examNeed.urgency === 'critical') {
                plan.push({
                    type: 'exam_reminder',
                    priority: 10,
                    timing: this.getOptimalNotificationTime(now, 2, preferences), // 2 hours
                    content: this.generateExamReminderContent(examNeed, userContext, 'critical'),
                    data: { examId: examNeed.exam.id, urgency: 'critical' }
                });
            }
        });

        // 2. Performance intervention notifications
        needs.performanceIssues.forEach(issue => {
            plan.push({
                type: 'performance_feedback',
                priority: 8,
                timing: this.getOptimalNotificationTime(now, 4, preferences), // 4 hours
                content: this.generatePerformanceContent(issue, userContext),
                data: { type: issue.type, category: issue.category }
            });
        });

        // 3. Motivation notifications
        needs.motivationBoosts.forEach(motivation => {
            plan.push({
                type: 'study_motivation',
                priority: 6,
                timing: this.getOptimalNotificationTime(now, 6, preferences), // 6 hours
                content: this.generateMotivationContent(motivation, userContext),
                data: { daysSince: motivation.daysSince }
            });
        });

        // 4. Streak maintenance
        if (needs.streakMaintenance && needs.streakMaintenance.risk === 'high') {
            plan.push({
                type: 'streak_maintenance',
                priority: 7,
                timing: this.getOptimalNotificationTime(now, 12, preferences), // 12 hours
                content: this.generateStreakContent(needs.streakMaintenance, userContext),
                data: { streak: needs.streakMaintenance.streak }
            });
        }

        // 5. Profile completion (if significantly incomplete)
        if (needs.profileCompletion && needs.profileCompletion.completion < 60) {
            plan.push({
                type: 'profile_completion',
                priority: 4,
                timing: this.getOptimalNotificationTime(now, 24, preferences), // Tomorrow
                content: this.generateProfileCompletionContent(needs.profileCompletion, userContext),
                data: { completion: needs.profileCompletion.completion }
            });
        }

        // 6. Smart quiz recommendations
        needs.smartQuizRecommendations.forEach((rec, index) => {
            plan.push({
                type: 'smart_quiz_recommendation',
                priority: rec.priority || 7,
                timing: this.getOptimalNotificationTime(now, 8 + (index * 4), preferences), // Stagger by 4 hours
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

        // 7. Sort by priority and limit daily notifications
        return this.optimizeNotificationPlan(plan, userContext);
    }

    /**
     * ⏰ Get optimal notification time based on user preferences and patterns
     */
    static getOptimalNotificationTime(baseTime, hoursFromNow, preferences) {
        const notificationTime = new Date(baseTime);
        notificationTime.setHours(notificationTime.getHours() + hoursFromNow);

        // Adjust to user's preferred time
        let preferredHour = 18; // Default evening
        
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

        // If more than 2 hours difference, adjust to preferred time
        const currentHour = notificationTime.getHours();
        if (Math.abs(currentHour - preferredHour) > 2) {
            notificationTime.setHours(preferredHour, 0, 0, 0);
            
            // If that's in the past, schedule for next day
            if (notificationTime <= new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }
        }

        return notificationTime;
    }

    /**
     * 🧹 Clean up redundant notifications before scheduling new ones
     */
    static async cleanupRedundantNotifications(userId) {
        try {
            const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const userNotifications = allNotifications.filter(n => 
                n.content.data?.userId === userId || 
                n.content.data?.type?.includes('alexandria')
            );

            // Cancel all existing smart notifications
            for (const notification of userNotifications) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }

            logger.info(`🧹 Cleaned up ${userNotifications.length} existing notifications`);
        } catch (error) {
            logger.error('Error cleaning up notifications:', error);
        }
    }

    /**
     * 📅 Schedule the notification plan
     */
    static async scheduleNotificationPlan(plan, userId) {
        let scheduledCount = 0;
        const scheduledIds = [];

        for (const notification of plan) {
            try {
                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: notification.content.title,
                        body: notification.content.body,
                        data: {
                            ...notification.data,
                            userId,
                            type: notification.type,
                            priority: notification.priority,
                            source: 'intelligent_system'
                        }
                    },
                    trigger: { date: notification.timing }
                });

                scheduledIds.push({
                    id,
                    type: notification.type,
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
            `${this.STORAGE_KEY}_${userId}`, 
            JSON.stringify(scheduledIds)
        );

        return scheduledCount;
    }

    /**
     * 📊 Content generation methods
     */
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

    static calculateQuizRecommendationPriority(recommendation, userContext) {
        let priority = 5; // Base priority
        
        // Higher priority for areas where user is struggling
        if (recommendation.focusArea === 'weakness_reinforcement') {
            priority += 3;
        }
        
        // Higher priority if user hasn't taken quiz in a while
        const daysSinceLastQuiz = this.daysSinceLastQuiz(userContext.quizHistory);
        if (daysSinceLastQuiz >= 3) priority += 1;
        if (daysSinceLastQuiz >= 7) priority += 2;
        
        // Adjust based on difficulty preference
        const preferredDifficulty = userContext.preferences.learningStyles?.includes('challenging') ? 'hard' : 'medium';
        if (recommendation.difficulty === preferredDifficulty) {
            priority += 1;
        }
        
        // Higher priority for exam preparation
        if (recommendation.focusArea === 'exam_preparation') {
            priority += 2;
        }
        
        // Cap at 10
        return Math.min(priority, 10);
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

    /**
     * 🛠️ Helper analysis functions
     */
    static async shouldRunAnalysis(userId, triggerContext) {
        try {
            const lastAnalysis = await AsyncStorage.getItem(`${this.LAST_ANALYSIS_KEY}_${userId}`);
            if (!lastAnalysis) return true;
            
            const lastRun = JSON.parse(lastAnalysis);
            const hoursSinceLastRun = (Date.now() - new Date(lastRun.timestamp).getTime()) / (1000 * 60 * 60);
            
            // Different intervals based on trigger context
            const minHours = {
                quiz_completed: 2,   // Wait 2 hours after quiz
                daily_maintenance: 18, // Once per day
                user_request: 0,     // Always allow user requests
                scheduled: 6         // Every 6 hours for scheduled
            };
            
            return hoursSinceLastRun >= (minHours[triggerContext] || 6);
        } catch (error) {
            return true; // Run analysis if unsure
        }
    }

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
            const history = await AsyncStorage.getItem(`${this.NOTIFICATION_HISTORY_KEY}_${userId}`);
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
            
            // Generate basic stats from quiz history
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

    static async scheduleBasicNotifications(userId) {
        try {
            logger.info('📅 Scheduling basic notifications for', userId);
            
            // Create a simple motivational notification for tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(18, 0, 0, 0); // 6 PM tomorrow
            
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '📚 Ready to Learn?',
                    body: 'Take a quick quiz to keep your learning momentum going!',
                    data: {
                        userId,
                        type: 'basic_motivation',
                        source: 'intelligent_system'
                    }
                },
                trigger: { date: tomorrow }
            });

            // Save the scheduled notification
            await AsyncStorage.setItem(
                `${this.STORAGE_KEY}_${userId}`, 
                JSON.stringify([{
                    id,
                    type: 'basic_motivation',
                    triggerTime: tomorrow.toISOString(),
                    priority: 5
                }])
            );

            return { success: true, scheduled: 1 };
        } catch (error) {
            logger.error('Error scheduling basic notifications:', error);
            return { success: false, error: error.message };
        }
    }

    static calculateDaysLeft(examDate) {
        const now = new Date();
        const exam = new Date(examDate);
        return Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
    }

    static analyzeRecentPerformance(quizHistory) {
        if (quizHistory.length < 4) return { trend: 0, worstCategory: null };
        
        const recent = quizHistory.slice(0, 4); // Last 4 quizzes
        const older = quizHistory.slice(4, 8);  // Previous 4 quizzes
        
        const recentAvg = recent.reduce((sum, q) => sum + (q.results?.percentage || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, q) => sum + (q.results?.percentage || 0), 0) / older.length;
        
        return {
            trend: recentAvg - olderAvg,
            worstCategory: this.findWorstCategory(recent)
        };
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
        
        // Sort by most recent first
        const sortedHistory = [...quizHistory].sort((a, b) => 
            new Date(b.metadata?.completedAt || 0) - new Date(a.metadata?.completedAt || 0)
        );
        
        for (let i = 0; i < sortedHistory.length; i++) {
            const quizDate = new Date(sortedHistory[i].metadata?.completedAt);
            const daysDiff = Math.floor((today - quizDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= i + 1) { // Allow one day gap
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    static calculateExamReadiness(exam, quizHistory) {
        // Calculate readiness based on recent quiz performance in exam subjects
        if (!quizHistory || quizHistory.length === 0) return 0;
        
        const examSubjects = exam.subjects || [];
        if (examSubjects.length === 0) return 50; // Default if no subjects specified
        
        const relevantQuizzes = quizHistory.filter(quiz => 
            quiz.metadata?.subjects?.some(subject => examSubjects.includes(subject))
        ).slice(0, 5); // Last 5 relevant quizzes
        
        if (relevantQuizzes.length === 0) return 30; // Low readiness if no relevant practice
        
        const averageScore = relevantQuizzes.reduce((sum, quiz) => 
            sum + (quiz.results?.percentage || 0), 0) / relevantQuizzes.length;
        
        return Math.round(averageScore);
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

    static identifyMissingProfileAreas(profile) {
        const missing = [];
        if (!profile.courses || profile.courses.length === 0) missing.push('courses');
        if (!profile.studyGoals) missing.push('study_goals');
        if (!profile.learningStyles || profile.learningStyles.length === 0) missing.push('learning_styles');
        return missing;
    }

    static async identifyCurrentWeaknesses(userId, quizHistory) {
        try {
            // Try to use WeaknessAnalysisService if available
            if (WeaknessAnalysisService && WeaknessAnalysisService.analyzeWeaknesses) {
                return await WeaknessAnalysisService.analyzeWeaknesses(userId);
            }
            
            // Fallback: Basic weakness analysis from quiz history
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
                
                if (avgScore < 70) { // Below 70% considered weakness
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

    static analyzeStudyPatterns(quizHistory) {
        if (!quizHistory || quizHistory.length === 0) {
            return { 
                preferredTime: 'evening',
                frequency: 'low',
                averageSessionLength: 0,
                consistency: 'irregular'
            };
        }
        
        // Analyze timing patterns
        const hourCounts = {};
        let totalTime = 0;
        
        quizHistory.forEach(quiz => {
            const date = new Date(quiz.metadata?.completedAt || Date.now());
            const hour = date.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            totalTime += quiz.metadata?.timeSpent || 0;
        });
        
        // Find preferred time
        let preferredHour = 18; // Default evening
        let maxCount = 0;
        Object.keys(hourCounts).forEach(hour => {
            if (hourCounts[hour] > maxCount) {
                maxCount = hourCounts[hour];
                preferredHour = parseInt(hour);
            }
        });
        
        const preferredTime = preferredHour < 12 ? 'morning' : 
                            preferredHour < 17 ? 'afternoon' : 'evening';
        
        // Calculate frequency
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

    static optimizeNotificationPlan(plan, userContext) {
        // Sort by priority (highest first)
        const sortedPlan = [...plan].sort((a, b) => b.priority - a.priority);
        
        // Apply frequency limits
        const dailyLimits = this.MAX_DAILY_NOTIFICATIONS;
        const typeCounts = {};
        const optimizedPlan = [];
        
        sortedPlan.forEach(notification => {
            const type = notification.type;
            const currentCount = typeCounts[type] || 0;
            const limit = dailyLimits[type] || 1;
            
            if (currentCount < limit) {
                optimizedPlan.push(notification);
                typeCounts[type] = currentCount + 1;
            }
        });
        
        // Respect user frequency preference
        const maxTotal = userContext.preferences.frequency === 'minimal' ? 2 :
                        userContext.preferences.frequency === 'moderate' ? 4 : 6;
        
        return optimizedPlan.slice(0, maxTotal);
    }

    static getNextAnalysisTime(lastAnalysisString) {
        if (!lastAnalysisString) return 'Now';
        
        try {
            const lastAnalysis = JSON.parse(lastAnalysisString);
            const nextTime = new Date(lastAnalysis.timestamp);
            nextTime.setHours(nextTime.getHours() + 6); // Next analysis in 6 hours
            
            if (nextTime <= new Date()) return 'Now';
            return nextTime.toLocaleString();
        } catch (error) {
            return 'Now';
        }
    }

    /**
     * 💾 Save analysis results
     */
    static async saveAnalysisResults(userId, results) {
        try {
            await AsyncStorage.setItem(
                `${this.LAST_ANALYSIS_KEY}_${userId}`,
                JSON.stringify(results)
            );
        } catch (error) {
            logger.error('Error saving analysis results:', error);
        }
    }

    /**
     * 🚀 Public API Methods
     */
    
    // Initialize the system
    static async initialize() {
        try {
            return await Notifications.requestPermissionsAsync();
        } catch (error) {
            logger.error('Error initializing intelligent notification system:', error);
            return { status: 'denied' };
        }
    }

    // Cancel all notifications for a user
    static async cancelAllNotifications(userId) {
        try {
            await this.cleanupRedundantNotifications(userId);
            await AsyncStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
            await AsyncStorage.removeItem(`${this.LAST_ANALYSIS_KEY}_${userId}`);
            return true;
        } catch (error) {
            logger.error('Error cancelling all notifications:', error);
            return false;
        }
    }

    // Get current notification status
    static async getNotificationStatus(userId) {
        try {
            const scheduled = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
            const lastAnalysis = await AsyncStorage.getItem(`${this.LAST_ANALYSIS_KEY}_${userId}`);
            
            return {
                hasScheduledNotifications: !!scheduled,
                scheduledCount: scheduled ? JSON.parse(scheduled).length : 0,
                lastAnalysis: lastAnalysis ? JSON.parse(lastAnalysis).timestamp : null,
                nextAnalysis: this.getNextAnalysisTime(lastAnalysis)
            };
        } catch (error) {
            logger.error('Error getting notification status:', error);
            return { error: error.message };
        }
    }
}

export default IntelligentNotificationSystem;