import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from './logger';

/**
 * ActivityLogger - Enhanced activity tracking for Alexandria
 * Provides comprehensive user activity logging for analytics and insights
 */
export class ActivityLogger {
    static STORAGE_KEY = 'user_activity_logs';
    static MAX_LOCAL_LOGS = 1000;
    static BATCH_SIZE = 50;
    static API_ENDPOINT = '/api/user-activity'; // Backend endpoint

    /**
     * Log a user activity with enhanced metadata
     * @param {Object} activity - Activity data
     */
    static async logActivity(activity) {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                logger.warn('Cannot log activity: User not authenticated');
                return;
            }

            const enhancedActivity = {
                id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                timestamp: new Date().toISOString(),
                sessionId: await this.getSessionId(),
                platform: 'mobile',
                appVersion: '1.0.0', // You can get this from your app config
                ...activity
            };

            // Store locally first (immediate)
            await this.storeActivityLocally(enhancedActivity);

            // Send to backend (async, non-blocking)
            this.sendActivityToBackend(enhancedActivity).catch(error => {
                logger.warn('Failed to send activity to backend:', error);
            });

            logger.info('📊 Activity logged:', enhancedActivity.type);
        } catch (error) {
            logger.error('❌ Error logging activity:', error);
        }
    }

    /**
     * Store activity in local storage
     * @param {Object} activity - Activity data
     */
    static async storeActivityLocally(activity) {
        try {
            const userId = activity.userId;
            const storageKey = `${this.STORAGE_KEY}_${userId}`;

            // Get existing activities
            const existingLogs = await AsyncStorage.getItem(storageKey);
            const activities = existingLogs ? JSON.parse(existingLogs) : [];

            // Add new activity
            activities.push(activity);

            // Keep only the most recent activities to prevent storage overflow
            if (activities.length > this.MAX_LOCAL_LOGS) {
                activities.splice(0, activities.length - this.MAX_LOCAL_LOGS);
            }

            // Save back to storage
            await AsyncStorage.setItem(storageKey, JSON.stringify(activities));
        } catch (error) {
            logger.error('❌ Error storing activity locally:', error);
        }
    }

    /**
     * Send activity to backend API
     * @param {Object} activity - Activity data
     */
    static async sendActivityToBackend(activity) {
        try {
            // This would be your actual backend endpoint
            const response = await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any auth headers if needed
                },
                body: JSON.stringify(activity)
            });

            if (!response.ok) {
                throw new Error(`Backend API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Don't throw - this is async and non-critical
            logger.warn('Backend activity logging failed:', error.message);
        }
    }

    /**
     * Get or create session ID for this app session
     * @returns {Promise<string>} Session ID
     */
    static async getSessionId() {
        try {
            let sessionId = await AsyncStorage.getItem('current_session_id');
            const sessionStart = await AsyncStorage.getItem('session_start_time');

            // Create new session if none exists or if it's been more than 30 minutes
            const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
            if (!sessionId || !sessionStart || parseInt(sessionStart) < thirtyMinutesAgo) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await AsyncStorage.setItem('current_session_id', sessionId);
                await AsyncStorage.setItem('session_start_time', Date.now().toString());
            }

            return sessionId;
        } catch (error) {
            logger.error('❌ Error getting session ID:', error);
            return `fallback_session_${Date.now()}`;
        }
    }

    /**
     * Get local activity logs for a user
     * @param {string} userId - User ID (optional, defaults to current user)
     * @param {number} limit - Number of activities to retrieve
     * @returns {Promise<Array>} Array of activities
     */
    static async getLocalActivities(userId = null, limit = 100) {
        try {
            const targetUserId = userId || auth.currentUser?.uid;
            if (!targetUserId) return [];

            const storageKey = `${this.STORAGE_KEY}_${targetUserId}`;
            const existingLogs = await AsyncStorage.getItem(storageKey);
            const activities = existingLogs ? JSON.parse(existingLogs) : [];

            // Return most recent activities first
            return activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            logger.error('❌ Error getting local activities:', error);
            return [];
        }
    }

    /**
     * Get activity statistics for analytics
     * @param {string} userId - User ID (optional, defaults to current user)
     * @param {number} days - Number of days to analyze
     * @returns {Promise<Object>} Activity statistics
     */
    static async getActivityStats(userId = null, days = 7) {
        try {
            const activities = await this.getLocalActivities(userId, 1000);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const recentActivities = activities.filter(
                activity => new Date(activity.timestamp) >= cutoffDate
            );

            const stats = {
                totalActivities: recentActivities.length,
                uniqueDays: new Set(
                    recentActivities.map(a => new Date(a.timestamp).toDateString())
                ).size,
                activityTypes: {},
                screenViews: {},
                studySessions: 0,
                flashcardSessions: 0
            };

            // Analyze activity types
            recentActivities.forEach(activity => {
                // Count by type
                stats.activityTypes[activity.type] = (stats.activityTypes[activity.type] || 0) + 1;

                // Count screen views
                if (activity.type === 'screen_view') {
                    stats.screenViews[activity.screen] = (stats.screenViews[activity.screen] || 0) + 1;
                }

                // Count study sessions
                if (activity.type === 'study_session_start') {
                    stats.studySessions++;
                }
                if (activity.type === 'flashcard_session_start') {
                    stats.flashcardSessions++;
                }
            });

            return stats;
        } catch (error) {
            logger.error('❌ Error getting activity stats:', error);
            return {
                totalActivities: 0,
                uniqueDays: 0,
                activityTypes: {},
                screenViews: {},
                studySessions: 0,
                flashcardSessions: 0
            };
        }
    }

    /**
     * Batch upload pending activities to backend
     * @returns {Promise<boolean>} Success status
     */
    static async syncPendingActivities() {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) return false;

            const activities = await this.getLocalActivities(userId, this.BATCH_SIZE);
            if (activities.length === 0) return true;

            // Send batch to backend
            const response = await fetch(`${this.API_ENDPOINT}/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ activities })
            });

            if (response.ok) {
                logger.info(`✅ Synced ${activities.length} activities to backend`);
                return true;
            } else {
                logger.warn(`❌ Failed to sync activities: ${response.status}`);
                return false;
            }
        } catch (error) {
            logger.error('❌ Error syncing activities:', error);
            return false;
        }
    }

    /**
     * Clear old local activities to free up storage
     * @param {number} daysToKeep - Number of days of activities to keep
     */
    static async clearOldActivities(daysToKeep = 30) {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) return;

            const storageKey = `${this.STORAGE_KEY}_${userId}`;
            const activities = await this.getLocalActivities(userId, 10000); // Get more for cleaning

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const recentActivities = activities.filter(
                activity => new Date(activity.timestamp) >= cutoffDate
            );

            await AsyncStorage.setItem(storageKey, JSON.stringify(recentActivities));

            logger.info(`🧹 Cleaned old activities, kept ${recentActivities.length} recent activities`);
        } catch (error) {
            logger.error('❌ Error clearing old activities:', error);
        }
    }

    /**
     * Convenience methods for common activity types
     */

    static async logScreenView(screenName, metadata = {}) {
        return this.logActivity({
            type: 'screen_view',
            screen: screenName,
            ...metadata
        });
    }

    static async logUserAction(action, metadata = {}) {
        return this.logActivity({
            type: 'user_action',
            action,
            ...metadata
        });
    }

    static async logStudySession(sessionType, metadata = {}) {
        return this.logActivity({
            type: 'study_session_start',
            sessionType,
            ...metadata
        });
    }

    static async logPerformanceMetric(metric, value, metadata = {}) {
        return this.logActivity({
            type: 'performance_metric',
            metric,
            value,
            ...metadata
        });
    }

    static async logError(error, context = {}) {
        return this.logActivity({
            type: 'error_encountered',
            error: error.message || error,
            stack: error.stack,
            ...context
        });
    }
}

export default ActivityLogger;