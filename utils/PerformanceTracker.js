import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from './logger';

/**
 * PerformanceTracker - Track user performance metrics for Alexandria
 * Provides study streak tracking and performance insights
 */
export class PerformanceTracker {
    static STORAGE_KEYS = {
        STUDY_STREAK: 'study_streak_data',
        PERFORMANCE_DATA: 'performance_data',
        DAILY_ACTIVITIES: 'daily_activities'
    };

    /**
     * Get current study streak for user
     * @param {string} userId - User ID (optional, defaults to current user)
     * @returns {Promise<number>} Current study streak in days
     */
    static async getStudyStreak(userId = null) {
        try {
            const targetUserId = userId || auth.currentUser?.uid;
            if (!targetUserId) return 0;

            const storageKey = `${this.STORAGE_KEYS.STUDY_STREAK}_${targetUserId}`;
            const streakData = await AsyncStorage.getItem(storageKey);

            if (!streakData) return 0;

            const { streak, lastStudyDate } = JSON.parse(streakData);
            const today = new Date().toDateString();
            const lastDate = new Date(lastStudyDate).toDateString();

            // If last study was today, return current streak
            if (lastDate === today) {
                return streak || 0;
            }

            // If last study was yesterday, streak continues
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate === yesterday.toDateString()) {
                return streak || 0;
            }

            // Streak is broken
            return 0;
        } catch (error) {
            logger.error('❌ Error getting study streak:', error);
            return 0;
        }
    }

    /**
     * Update study streak when user completes a study session
     * @param {string} userId - User ID (optional, defaults to current user)
     * @returns {Promise<number>} New streak value
     */
    static async updateStudyStreak(userId = null) {
        try {
            const targetUserId = userId || auth.currentUser?.uid;
            if (!targetUserId) return 0;

            const storageKey = `${this.STORAGE_KEYS.STUDY_STREAK}_${targetUserId}`;
            const today = new Date().toDateString();

            // Get existing streak data
            const existingData = await AsyncStorage.getItem(storageKey);
            let streakData = { streak: 0, lastStudyDate: null };

            if (existingData) {
                streakData = JSON.parse(existingData);
            }

            // If already studied today, don't update
            if (streakData.lastStudyDate === today) {
                return streakData.streak;
            }

            // Calculate new streak
            const lastDate = streakData.lastStudyDate ? new Date(streakData.lastStudyDate) : null;
            const todayDate = new Date();

            let newStreak = 1;

            if (lastDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                // If last study was yesterday, increment streak
                if (lastDate.toDateString() === yesterday.toDateString()) {
                    newStreak = (streakData.streak || 0) + 1;
                }
                // If last study was today (shouldn't happen due to check above)
                else if (lastDate.toDateString() === today) {
                    newStreak = streakData.streak || 1;
                }
                // Otherwise, streak resets to 1
            }

            // Save updated streak
            const updatedData = {
                streak: newStreak,
                lastStudyDate: today,
                updatedAt: new Date().toISOString()
            };

            await AsyncStorage.setItem(storageKey, JSON.stringify(updatedData));

            logger.info(`🔥 Study streak updated: ${newStreak} days`);
            return newStreak;
        } catch (error) {
            logger.error('❌ Error updating study streak:', error);
            return 0;
        }
    }

    /**
     * Get flashcard performance insights
     * @param {string} userId - User ID (optional, defaults to current user)
     * @returns {Promise<Object>} Performance insights
     */
    static async getFlashcardInsights(userId = null) {
        try {
            const targetUserId = userId || auth.currentUser?.uid;
            if (!targetUserId) return null;

            const storageKey = `${this.STORAGE_KEYS.PERFORMANCE_DATA}_${targetUserId}`;
            const performanceData = await AsyncStorage.getItem(storageKey);

            if (!performanceData) {
                return {
                    totalSessions: 0,
                    averageAccuracy: 0,
                    strongSubjects: [],
                    improvementAreas: [],
                    studyRecommendations: []
                };
            }

            const data = JSON.parse(performanceData);

            // Calculate insights from stored data
            const insights = {
                totalSessions: data.sessions?.length || 0,
                averageAccuracy: this.calculateAverageAccuracy(data.sessions || []),
                strongSubjects: this.identifyStrongSubjects(data.sessions || []),
                improvementAreas: this.identifyWeakSubjects(data.sessions || []),
                studyRecommendations: this.generateRecommendations(data.sessions || [])
            };

            return insights;
        } catch (error) {
            logger.error('❌ Error getting flashcard insights:', error);
            return null;
        }
    }

    /**
     * Record a flashcard session for performance tracking
     * @param {string} userId - User ID
     * @param {Object} sessionData - Session performance data
     */
    static async recordFlashcardSession(userId, sessionData) {
        try {
            const storageKey = `${this.STORAGE_KEYS.PERFORMANCE_DATA}_${userId}`;
            const existingData = await AsyncStorage.getItem(storageKey);

            let performanceData = { sessions: [] };
            if (existingData) {
                performanceData = JSON.parse(existingData);
            }

            // Add new session
            const session = {
                id: `session_${Date.now()}`,
                timestamp: new Date().toISOString(),
                ...sessionData
            };

            performanceData.sessions.push(session);

            // Keep only last 100 sessions to prevent storage bloat
            if (performanceData.sessions.length > 100) {
                performanceData.sessions = performanceData.sessions.slice(-100);
            }

            await AsyncStorage.setItem(storageKey, JSON.stringify(performanceData));

            // Update study streak
            await this.updateStudyStreak(userId);

            logger.info('📊 Flashcard session recorded for performance tracking');
        } catch (error) {
            logger.error('❌ Error recording flashcard session:', error);
        }
    }

    /**
     * Helper methods for calculating insights
     */
    static calculateAverageAccuracy(sessions) {
        if (sessions.length === 0) return 0;

        const totalAccuracy = sessions.reduce((sum, session) => {
            return sum + (session.accuracy || 0);
        }, 0);

        return Math.round(totalAccuracy / sessions.length);
    }

    static identifyStrongSubjects(sessions) {
        const subjectPerformance = {};

        sessions.forEach(session => {
            if (session.subjects) {
                session.subjects.forEach(subject => {
                    if (!subjectPerformance[subject]) {
                        subjectPerformance[subject] = { total: 0, count: 0 };
                    }
                    subjectPerformance[subject].total += session.accuracy || 0;
                    subjectPerformance[subject].count += 1;
                });
            }
        });

        // Find subjects with > 80% average accuracy
        const strongSubjects = Object.entries(subjectPerformance)
            .map(([subject, data]) => ({
                subject,
                averageAccuracy: Math.round(data.total / data.count)
            }))
            .filter(item => item.averageAccuracy > 80)
            .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
            .map(item => item.subject);

        return strongSubjects.slice(0, 3); // Top 3
    }

    static identifyWeakSubjects(sessions) {
        const subjectPerformance = {};

        sessions.forEach(session => {
            if (session.subjects) {
                session.subjects.forEach(subject => {
                    if (!subjectPerformance[subject]) {
                        subjectPerformance[subject] = { total: 0, count: 0 };
                    }
                    subjectPerformance[subject].total += session.accuracy || 0;
                    subjectPerformance[subject].count += 1;
                });
            }
        });

        // Find subjects with < 60% average accuracy
        const weakSubjects = Object.entries(subjectPerformance)
            .map(([subject, data]) => ({
                subject,
                averageAccuracy: Math.round(data.total / data.count)
            }))
            .filter(item => item.averageAccuracy < 60)
            .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
            .map(item => item.subject);

        return weakSubjects.slice(0, 3); // Bottom 3
    }

    static generateRecommendations(sessions) {
        if (sessions.length === 0) {
            return ['Complete some flashcard sessions to get personalized recommendations!'];
        }

        const recommendations = [];
        const recentSessions = sessions.slice(-5); // Last 5 sessions
        const averageAccuracy = this.calculateAverageAccuracy(recentSessions);

        if (averageAccuracy < 50) {
            recommendations.push('Focus on reviewing basic concepts before moving to advanced topics');
        } else if (averageAccuracy < 70) {
            recommendations.push('Try spacing out your study sessions for better retention');
        } else if (averageAccuracy > 90) {
            recommendations.push('Great work! Consider exploring more challenging topics');
        }

        // Check session frequency
        const lastSession = sessions[sessions.length - 1];
        const daysSinceLastSession = Math.floor((Date.now() - new Date(lastSession.timestamp)) / (1000 * 60 * 60 * 24));

        if (daysSinceLastSession > 3) {
            recommendations.push('Try to study more consistently - daily practice improves retention');
        }

        // Default recommendation if none generated
        if (recommendations.length === 0) {
            recommendations.push('Keep up the great work with regular practice!');
        }

        return recommendations.slice(0, 3); // Max 3 recommendations
    }

    /**
     * Get daily activity summary
     * @param {string} userId - User ID
     * @param {string} date - Date string (optional, defaults to today)
     * @returns {Promise<Object>} Daily activity data
     */
    static async getDailyActivity(userId = null, date = null) {
        try {
            const targetUserId = userId || auth.currentUser?.uid;
            if (!targetUserId) return null;

            const targetDate = date || new Date().toDateString();
            const storageKey = `${this.STORAGE_KEYS.DAILY_ACTIVITIES}_${targetUserId}`;

            const dailyData = await AsyncStorage.getItem(storageKey);
            if (!dailyData) return null;

            const activities = JSON.parse(dailyData);
            return activities[targetDate] || null;
        } catch (error) {
            logger.error('❌ Error getting daily activity:', error);
            return null;
        }
    }

    /**
     * Record daily activity
     * @param {string} userId - User ID
     * @param {Object} activityData - Activity data for the day
     */
    static async recordDailyActivity(userId, activityData) {
        try {
            const today = new Date().toDateString();
            const storageKey = `${this.STORAGE_KEYS.DAILY_ACTIVITIES}_${userId}`;

            const existingData = await AsyncStorage.getItem(storageKey);
            let dailyActivities = {};

            if (existingData) {
                dailyActivities = JSON.parse(existingData);
            }

            // Merge with existing data for today
            dailyActivities[today] = {
                ...dailyActivities[today],
                ...activityData,
                lastUpdated: new Date().toISOString()
            };

            await AsyncStorage.setItem(storageKey, JSON.stringify(dailyActivities));
        } catch (error) {
            logger.error('❌ Error recording daily activity:', error);
        }
    }
}

export default PerformanceTracker;