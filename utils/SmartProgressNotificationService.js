// utils/SmartProgressNotificationService.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './notificationService';
import { ExamScheduleService } from './examScheduleService';
import { UserService } from './UserService';
import logger from '../utils/logger';


export class SmartProgressNotificationService {
    static STORAGE_KEY = 'smart_progress_notifications';
    static LAST_ANALYSIS_KEY = 'last_progress_analysis';

    // ✅ MAIN FUNCTION: Analyze progress and schedule intelligent notifications
    static async analyzeProgressAndScheduleNotifications(userId) {
        try {
            logger.info('🧠 Analyzing user progress for smart notifications...');
            
            // Get user data
            const quizHistory = await AsyncStorage.getItem(`quizHistory_${userId}`); // ✅ FIX: Use user-specific key
            const quizzes = quizHistory ? JSON.parse(quizHistory) : [];
            const upcomingExams = await ExamScheduleService.getUserExams(userId); // Assuming this service also needs userId
            const userProfile = await UserService.getUserProfile(userId);
            const firstName = userProfile?.fullName ? UserService.getFirstName(userProfile.fullName) : 'Student';

            if (quizzes.length === 0) {
                await this.scheduleMotivationalStartNotifications(firstName, userId);
                return;
            }

            // Analyze progress patterns
            const analysis = await this.performProgressAnalysis(quizzes, upcomingExams);
            
            // Schedule smart notifications based on analysis
            await this.scheduleSmartNotifications(analysis, firstName, userId);
            
            // Save analysis for tracking
            await AsyncStorage.setItem(`${this.LAST_ANALYSIS_KEY}_${userId}`, JSON.stringify({ // ✅ FIX: Use user-specific key
                ...analysis,
                analyzedAt: new Date().toISOString()
            }));

            logger.info('✅ Smart notifications scheduled successfully!');
            return analysis;

        } catch (error) {
            logger.error('❌ Error in smart progress analysis:', error);
            return null;
        }
    }

    // ✅ DEEP PROGRESS ANALYSIS
    static async performProgressAnalysis(quizzes, upcomingExams) {
        const now = new Date();
        const last7Days = quizzes.filter(quiz => 
            (now - new Date(quiz.metadata?.completedAt)) <= (7 * 24 * 60 * 60 * 1000)
        );
        const last30Days = quizzes.filter(quiz => 
            (now - new Date(quiz.metadata?.completedAt)) <= (30 * 24 * 60 * 60 * 1000)
        );

        // Calculate trends
        const recentTrend = this.calculateScoreTrend(last7Days);
        const monthlyTrend = this.calculateScoreTrend(last30Days);
        
        // Analyze patterns
        const studyPatterns = this.analyzeStudyPatterns(quizzes);
        const categoryPerformance = this.analyzeCategoryPerformance(quizzes);
        const difficultyAnalysis = this.analyzeDifficultyProgression(quizzes);
        const streakAnalysis = this.analyzeStreakPatterns(quizzes);
        
        // Predict exam readiness
        const examReadiness = await this.predictExamReadiness(quizzes, upcomingExams);
        
        // Identify focus areas
        const focusAreas = this.identifyFocusAreas(categoryPerformance, upcomingExams);

        return {
            overall: {
                totalQuizzes: quizzes.length,
                recentActivity: last7Days.length,
                averageScore: this.calculateAverageScore(quizzes),
                recentAverageScore: this.calculateAverageScore(last7Days),
                improvement: recentTrend
            },
            trends: {
                weekly: recentTrend,
                monthly: monthlyTrend,
                direction: this.getTrendDirection(recentTrend)
            },
            patterns: studyPatterns,
            performance: {
                categories: categoryPerformance,
                difficulty: difficultyAnalysis,
                streaks: streakAnalysis
            },
            examReadiness,
            focusAreas,
            recommendations: this.generateRecommendations(
                recentTrend, categoryPerformance, upcomingExams, studyPatterns
            )
        };
    }

    // ✅ CALCULATE SCORE TRENDS
    static calculateScoreTrend(quizzes) {
        if (quizzes.length < 2) return 0;
        
        const scores = quizzes.map(quiz => quiz.results?.percentage || 0);
        const midpoint = Math.floor(scores.length / 2);
        
        const firstHalf = scores.slice(0, midpoint);
        const secondHalf = scores.slice(midpoint);
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        return Math.round(secondAvg - firstAvg);
    }

    // ✅ ANALYZE STUDY PATTERNS
    static analyzeStudyPatterns(quizzes) {
        const dayPattern = new Map();
        const timePattern = new Map();
        let lastStudyDate = null;
        let averageGapDays = 0;
        
        quizzes.forEach(quiz => {
            const date = new Date(quiz.metadata?.completedAt);
            const dayOfWeek = date.getDay(); // 0 = Sunday
            const hour = date.getHours();
            
            dayPattern.set(dayOfWeek, (dayPattern.get(dayOfWeek) || 0) + 1);
            timePattern.set(hour, (timePattern.get(hour) || 0) + 1);
            
            if (lastStudyDate) {
                const gap = Math.floor((date - lastStudyDate) / (1000 * 60 * 60 * 24));
                averageGapDays = (averageGapDays + gap) / 2;
            }
            lastStudyDate = date;
        });

        const preferredDay = Array.from(dayPattern.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        const preferredTime = Array.from(timePattern.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        return {
            preferredDay,
            preferredTime,
            averageGapDays: Math.round(averageGapDays),
            consistency: this.calculateConsistency(quizzes),
            lastActivity: lastStudyDate
        };
    }

    // ✅ ANALYZE CATEGORY PERFORMANCE
    static analyzeCategoryPerformance(quizzes) {
        const categoryMap = new Map();
        
        quizzes.forEach(quiz => {
            const category = quiz.metadata?.category || 'General';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, { 
                    scores: [], 
                    total: 0, 
                    correct: 0,
                    trend: 0,
                    lastScore: 0
                });
            }
            
            const stats = categoryMap.get(category);
            const score = quiz.results?.percentage || 0;
            
            stats.scores.push(score);
            stats.total += quiz.results?.totalQuestions || 0;
            stats.correct += quiz.results?.score || 0;
            stats.lastScore = score;
        });

        const categories = Array.from(categoryMap.entries()).map(([category, stats]) => {
            const average = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
            const trend = this.calculateScoreTrend({ 
                length: stats.scores.length,
                map: (fn) => stats.scores.map(fn),
                slice: (start, end) => stats.scores.slice(start, end)
            });
            
            return {
                category,
                average: Math.round(average),
                accuracy: Math.round((stats.correct / stats.total) * 100),
                trend,
                lastScore: stats.lastScore,
                quizCount: stats.scores.length,
                status: this.getCategoryStatus(average, trend, stats.lastScore)
            };
        });

        return categories.sort((a, b) => {
            // Sort by priority: struggling categories first, then improving ones
            if (a.status === 'struggling' && b.status !== 'struggling') return -1;
            if (b.status === 'struggling' && a.status !== 'struggling') return 1;
            if (a.status === 'improving' && b.status !== 'improving') return -1;
            if (b.status === 'improving' && a.status !== 'improving') return 1;
            return b.average - a.average;
        });
    }

    // ✅ PREDICT EXAM READINESS
    static async predictExamReadiness(quizzes, upcomingExams) {
        const readinessMap = new Map();
        
        for (const exam of upcomingExams) {
            const daysLeft = ExamScheduleService.calculateDaysUntilExam(exam.examDate);
            const examSubject = exam.subject || exam.examTitle;
            
            // Find related quizzes
            const relatedQuizzes = quizzes.filter(quiz => {
                const quizCategory = quiz.metadata?.category || '';
                return quizCategory.toLowerCase().includes(examSubject.toLowerCase()) ||
                       examSubject.toLowerCase().includes(quizCategory.toLowerCase());
            });

            let readinessScore = 0;
            let confidence = 'low';
            let recommendations = [];

            if (relatedQuizzes.length > 0) {
                const recentQuizzes = relatedQuizzes.slice(-5);
                const averageScore = this.calculateAverageScore(recentQuizzes);
                const trend = this.calculateScoreTrend(recentQuizzes);
                
                // Calculate readiness based on score, trend, and time left
                readinessScore = this.calculateReadinessScore(averageScore, trend, daysLeft, recentQuizzes.length);
                confidence = this.getConfidenceLevel(recentQuizzes.length, daysLeft);
                recommendations = this.generateExamRecommendations(averageScore, trend, daysLeft);
            } else {
                recommendations = [`Start practicing for ${examSubject} - no quiz history found!`];
            }

            readinessMap.set(exam.id, {
                examTitle: exam.examTitle,
                subject: examSubject,
                daysLeft,
                readinessScore,
                confidence,
                relatedQuizzes: relatedQuizzes.length,
                recommendations,
                status: this.getReadinessStatus(readinessScore, daysLeft)
            });
        }

        return Array.from(readinessMap.values());
    }

    // ✅ SCHEDULE SMART NOTIFICATIONS
    static async scheduleSmartNotifications(analysis, firstName, userId) {
        // Clear existing smart notifications
        await this.clearSmartNotifications(userId);
        
        const notifications = [];
        
        // 1. Performance-based notifications
        notifications.push(...this.generatePerformanceNotifications(analysis, firstName));
        
        // 2. Study pattern notifications
        notifications.push(...this.generateStudyPatternNotifications(analysis, firstName));
        
        // 3. Exam readiness notifications
        notifications.push(...this.generateExamReadinessNotifications(analysis, firstName));
        
        // 4. Category focus notifications
        notifications.push(...this.generateCategoryFocusNotifications(analysis, firstName));
        
        // 5. Motivational notifications
        notifications.push(...this.generateMotivationalNotifications(analysis, firstName));

        // Schedule all notifications
        const scheduledIds = [];
        for (const notification of notifications) {
            try {
                const id = await Notifications.scheduleNotificationAsync(notification);
                scheduledIds.push({ id, type: notification.type, triggerTime: notification.trigger });
            } catch (error) {
                logger.error('Error scheduling smart notification:', error);
            }
        }

        // Save scheduled notification IDs
        await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(scheduledIds));
        
        logger.info(`📱 Scheduled ${scheduledIds.length} smart notifications`);
        return scheduledIds;
    }

    // ✅ GENERATE PERFORMANCE NOTIFICATIONS
    static generatePerformanceNotifications(analysis, firstName) {
        const notifications = [];
        const now = new Date();
        
        // Declining performance
        if (analysis.trends.weekly < -10) {
            notifications.push({
                type: 'performance_decline',
                content: {
                    title: '📉 Performance Alert',
                    body: `${firstName}, your scores dropped ${Math.abs(analysis.trends.weekly)}% this week. Let's get back on track!`,
                    data: { type: 'performance_decline', trend: analysis.trends.weekly }
                },
                trigger: { seconds: 3600 } // 1 hour from now
            });
        }
        
        // Improving performance
        if (analysis.trends.weekly > 15) {
            notifications.push({
                type: 'performance_improvement',
                content: {
                    title: '🚀 Amazing Progress!',
                    body: `${firstName}, you've improved ${analysis.trends.weekly}% this week! Keep the momentum going!`,
                    data: { type: 'performance_improvement', trend: analysis.trends.weekly }
                },
                trigger: { seconds: 1800 } // 30 minutes from now
            });
        }
        
        return notifications;
    }

    // ✅ GENERATE STUDY PATTERN NOTIFICATIONS
    static generateStudyPatternNotifications(analysis, firstName) {
        const notifications = [];
        const now = new Date();
        const daysSinceLastStudy = Math.floor((now - new Date(analysis.patterns.lastActivity)) / (1000 * 60 * 60 * 24));
        
        // Inactivity reminders
        if (daysSinceLastStudy >= 3) {
            const nextStudyTime = new Date();
            nextStudyTime.setHours(analysis.patterns.preferredTime, 0, 0, 0);
            if (nextStudyTime <= now) nextStudyTime.setDate(nextStudyTime.getDate() + 1);
            
            notifications.push({
                type: 'study_reminder',
                content: {
                    title: '⏰ Study Time!',
                    body: `${firstName}, it's been ${daysSinceLastStudy} days since your last quiz. Ready for a quick session?`,
                    data: { type: 'study_reminder', daysSince: daysSinceLastStudy }
                },
                trigger: { date: nextStudyTime }
            });
        }
        
        return notifications;
    }

    // ✅ GENERATE EXAM READINESS NOTIFICATIONS
    static generateExamReadinessNotifications(analysis, firstName) {
        const notifications = [];
        
        analysis.examReadiness.forEach(exam => {
            if (exam.daysLeft <= 7 && exam.readinessScore < 70) {
                const urgencyMessage = exam.daysLeft <= 2 ? 'URGENT' : 'Important';
                
                notifications.push({
                    type: 'exam_readiness',
                    content: {
                        title: `⚠️ ${urgencyMessage}: Exam Alert`,
                        body: `${firstName}, your ${exam.examTitle} is in ${exam.daysLeft} day${exam.daysLeft !== 1 ? 's' : ''} and you're ${exam.readinessScore}% ready. Time to focus!`,
                        data: { 
                            type: 'exam_readiness', 
                            examId: exam.id,
                            readinessScore: exam.readinessScore 
                        }
                    },
                    trigger: { seconds: 60 * (exam.daysLeft <= 2 ? 30 : 60) }
                });
            }
        });
        
        return notifications;
    }

    // ✅ GENERATE CATEGORY FOCUS NOTIFICATIONS
    static generateCategoryFocusNotifications(analysis, firstName) {
        const notifications = [];
        const strugglingCategories = analysis.performance.categories.filter(cat => cat.status === 'struggling');
        
        if (strugglingCategories.length > 0) {
            const weakest = strugglingCategories[0];
            
            notifications.push({
                type: 'category_focus',
                content: {
                    title: '🎯 Focus Area Alert',
                    body: `${firstName}, your ${weakest.category} average is ${weakest.average}%. Let's boost this with targeted practice!`,
                    data: { 
                        type: 'category_focus', 
                        category: weakest.category,
                        average: weakest.average 
                    }
                },
                trigger: { seconds: 7200 } // 2 hours from now
            });
        }
        
        return notifications;
    }

    // ✅ GENERATE MOTIVATIONAL NOTIFICATIONS
    static generateMotivationalNotifications(analysis, firstName) {
        const notifications = [];
        
        // Streak encouragement
        if (analysis.performance.streaks.current >= 3) {
            notifications.push({
                type: 'streak_motivation',
                content: {
                    title: '🔥 Streak Alert!',
                    body: `${firstName}, you're on a ${analysis.performance.streaks.current}-day streak! Don't break it now!`,
                    data: { type: 'streak_motivation', streak: analysis.performance.streaks.current }
                },
                trigger: { seconds: 86400 } // Tomorrow
            });
        }
        
        return notifications;
    }

    // ✅ HELPER FUNCTIONS
    static calculateAverageScore(quizzes) {
        if (quizzes.length === 0) return 0;
        const total = quizzes.reduce((sum, quiz) => sum + (quiz.results?.percentage || 0), 0);
        return Math.round(total / quizzes.length);
    }

    static getTrendDirection(trend) {
        if (trend > 5) return 'improving';
        if (trend < -5) return 'declining';
        return 'stable';
    }

    static getCategoryStatus(average, trend, lastScore) {
        if (average < 60 || (trend < -10 && lastScore < 50)) return 'struggling';
        if (trend > 10 || (average > 80 && trend > 0)) return 'excelling';
        if (trend > 5) return 'improving';
        return 'stable';
    }

    static calculateReadinessScore(averageScore, trend, daysLeft, quizCount) {
        let score = averageScore;
        
        // Adjust for trend
        if (trend > 0) score += Math.min(trend, 20);
        else score += Math.max(trend, -20);
        
        // Adjust for preparation time
        if (daysLeft < 3) score -= 15;
        else if (daysLeft < 7) score -= 5;
        
        // Adjust for quiz count (more practice = better readiness)
        if (quizCount < 3) score -= 20;
        else if (quizCount < 5) score -= 10;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    static getReadinessStatus(score, daysLeft) {
        if (score >= 80) return 'ready';
        if (score >= 60 && daysLeft > 3) return 'on_track';
        if (score >= 40) return 'needs_work';
        return 'urgent_attention';
    }

    static calculateConsistency(quizzes) {
        // Implementation for consistency calculation
        if (quizzes.length < 3) return 0;
        
        const dates = quizzes.map(quiz => new Date(quiz.metadata?.completedAt));
        dates.sort((a, b) => a - b);
        
        const gaps = [];
        for (let i = 1; i < dates.length; i++) {
            const gap = Math.floor((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
            gaps.push(gap);
        }
        
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
        
        // Lower variance = higher consistency (0-100 scale)
        return Math.max(0, Math.min(100, Math.round(100 - (variance / avgGap) * 10)));
    }

    static analyzeDifficultyProgression(quizzes) {
        const difficultyMap = { easy: [], medium: [], hard: [] };
        
        quizzes.forEach(quiz => {
            const difficulty = quiz.metadata?.difficulty || 'medium';
            const score = quiz.results?.percentage || 0;
            if (difficultyMap[difficulty]) {
                difficultyMap[difficulty].push(score);
            }
        });

        return Object.entries(difficultyMap).map(([difficulty, scores]) => ({
            difficulty,
            average: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
            count: scores.length,
            trend: this.calculateScoreTrend({ length: scores.length, map: fn => scores.map(fn), slice: (s, e) => scores.slice(s, e) })
        }));
    }

    static analyzeStreakPatterns(quizzes) {
        // Implementation for streak analysis
        return {
            current: 0, // Would calculate current streak
            longest: 0, // Would calculate longest streak
            averageSessionLength: 0 // Average quiz session length
        };
    }

    static identifyFocusAreas(categoryPerformance, upcomingExams) {
        const focusAreas = [];
        
        // Add struggling categories
        categoryPerformance.filter(cat => cat.status === 'struggling').forEach(cat => {
            focusAreas.push({
                type: 'category',
                area: cat.category,
                priority: 'high',
                reason: `Low average score (${cat.average}%)`
            });
        });
        
        // Add exam-related focus areas
        upcomingExams.forEach(exam => {
            const relatedCategory = categoryPerformance.find(cat => 
                cat.category.toLowerCase().includes(exam.subject?.toLowerCase() || '') ||
                (exam.subject?.toLowerCase() || '').includes(cat.category.toLowerCase())
            );
            
            if (relatedCategory && relatedCategory.average < 70) {
                focusAreas.push({
                    type: 'exam_prep',
                    area: exam.subject || exam.examTitle,
                    priority: exam.daysLeft <= 7 ? 'urgent' : 'medium',
                    reason: `Upcoming exam with low practice scores (${relatedCategory.average}%)`
                });
            }
        });
        
        return focusAreas;
    }

    static generateRecommendations(trend, categoryPerformance, upcomingExams, studyPatterns) {
        const recommendations = [];
        
        if (trend < -10) {
            recommendations.push('Focus on reviewing fundamentals - your scores have declined recently');
        }
        
        if (studyPatterns.averageGapDays > 3) {
            recommendations.push('Try to study more consistently - shorter, regular sessions are more effective');
        }
        
        const strugglingCategories = categoryPerformance.filter(cat => cat.status === 'struggling');
        if (strugglingCategories.length > 0) {
            recommendations.push(`Focus extra attention on: ${strugglingCategories.map(cat => cat.category).join(', ')}`);
        }
        
        return recommendations;
    }

    static generateExamRecommendations(averageScore, trend, daysLeft) {
        const recommendations = [];
        
        if (averageScore < 70) {
            recommendations.push('Intensive review needed - focus on core concepts');
        }
        
        if (daysLeft <= 3) {
            recommendations.push('Final review mode - focus on quick recall and practice tests');
        }
        
        if (trend < 0) {
            recommendations.push('Address recent performance decline before exam');
        }
        
        return recommendations;
    }

    static getConfidenceLevel(quizCount, daysLeft) {
        if (quizCount >= 5 && daysLeft > 7) return 'high';
        if (quizCount >= 3 && daysLeft > 3) return 'medium';
        return 'low';
    }

    // ✅ MOTIVATIONAL NOTIFICATIONS FOR NEW USERS
    static async scheduleMotivationalStartNotifications(firstName, userId) {
        const notifications = [
            {
                type: 'welcome_motivation',
                content: {
                    title: '🌟 Welcome to Alexandria!',
                    body: `${firstName}, ready to start your learning journey? Take your first quiz to unlock personalized insights!`,
                    data: { type: 'welcome_motivation' }
                },
                trigger: { seconds: 3600 }
            }
        ];

        for (const notification of notifications) {
            await Notifications.scheduleNotificationAsync(notification);
        }
    }

    // ✅ CLEAR SMART NOTIFICATIONS
    static async clearSmartNotifications(userId) {
        try {
            const scheduledData = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
            if (scheduledData) {
                const scheduled = JSON.parse(scheduledData);
                for (const notif of scheduled) {
                    await Notifications.cancelScheduledNotificationAsync(notif.id);
                }
            }
            await AsyncStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
        } catch (error) {
            logger.error('Error clearing smart notifications:', error);
        }
    }

    // ✅ TRIGGER ANALYSIS (call this after quiz completion or daily)
    static async triggerSmartAnalysis(userId) {
        return await this.analyzeProgressAndScheduleNotifications(userId);
    }
}