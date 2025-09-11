import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';


export class QuizHistoryManager {
    static HISTORY_KEY = 'quiz_history';
    static MAX_HISTORY = 100;

    /**
     * Save quiz to local history
     * @param {Object} quizData - Quiz data including questions and metadata
     * @param {string} source - Source of the quiz (e.g., 'completed_quiz', 'file_upload', 'alexandria')
     */
    static async saveQuizToHistory(quizData, source = 'unknown') {
        try {
            const user = auth.currentUser;
            if (!user) {
                logger.warn('No authenticated user found for quiz history');
                return;
            }

            const historyKey = `${this.HISTORY_KEY}_${user.uid}`;
            const existingHistory = await AsyncStorage.getItem(historyKey);
            const history = existingHistory ? JSON.parse(existingHistory) : [];

            const quizRecord = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                source: source,
                metadata: quizData.metadata || {},
                questionCount: Array.isArray(quizData.quiz) ? quizData.quiz.length : 0,
                userId: user.uid,
                questions: quizData.quiz || [],
                // Add performance metrics if available
                score: quizData.score || null,
                percentage: quizData.percentage || null,
                difficulty: quizData.metadata?.difficulty || 'medium',
                category: quizData.metadata?.category || 'General',
            };

            history.unshift(quizRecord);

            // Keep only recent history
            if (history.length > this.MAX_HISTORY) {
                history.splice(this.MAX_HISTORY);
            }

            await AsyncStorage.setItem(historyKey, JSON.stringify(history));
            logger.info('✅ Quiz saved to local history:', {
                source,
                questionCount: quizRecord.questionCount,
                userId: user.uid
            });
        } catch (error) {
            logger.error('❌ Error saving quiz to history:', error);
        }
    }

    /**
     * Get user's quiz history
     * @param {number} limit - Maximum number of records to return
     * @returns {Array} Array of quiz history records
     */
    static async getUserHistory(limit = 50) {
        try {
            const user = auth.currentUser;
            if (!user) {
                logger.warn('No authenticated user found for quiz history');
                return [];
            }

            const historyKey = `${this.HISTORY_KEY}_${user.uid}`;
            const history = await AsyncStorage.getItem(historyKey);
            const parsedHistory = history ? JSON.parse(history) : [];
            
            return limit ? parsedHistory.slice(0, limit) : parsedHistory;
        } catch (error) {
            logger.error('❌ Error getting quiz history:', error);
            return [];
        }
    }

    /**
     * Get recent quiz history for flashcard generation
     * @param {string} userId - User ID 
     * @param {number} daysBack - Number of days to look back
     * @returns {Array} Array of recent quiz records with mistakes
     */
    static async getRecentHistory(userId, daysBack = 7) {
        try {
            if (!userId) {
                logger.warn('No user ID provided for recent history');
                return [];
            }

            const historyKey = `${this.HISTORY_KEY}_${userId}`;
            const history = await AsyncStorage.getItem(historyKey);
            const parsedHistory = history ? JSON.parse(history) : [];
            
            const cutoff = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000));
            
            const recentHistory = parsedHistory.filter(quiz => {
                const quizDate = new Date(quiz.timestamp);
                return quizDate > cutoff;
            });

            logger.info(`📅 Found ${recentHistory.length} quizzes from the last ${daysBack} days`);
            return recentHistory;
        } catch (error) {
            logger.error('❌ Error getting recent quiz history:', error);
            return [];
        }
    }

    /**
     * Check if user has taken quizzes recently
     * @param {string} topic - Optional topic to filter by
     * @param {number} hours - Number of hours to look back
     * @returns {boolean} True if user has recent quiz activity
     */
    static async hasRecentQuizActivity(topic = null, hours = 24) {
        try {
            const history = await this.getUserHistory();
            const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));

            return history.some(quiz => {
                const quizDate = new Date(quiz.timestamp);
                const isRecent = quizDate > cutoff;
                
                if (topic) {
                    const quizTopic = quiz.metadata?.topic?.toLowerCase() || 
                                   quiz.metadata?.category?.toLowerCase() || '';
                    return isRecent && quizTopic.includes(topic.toLowerCase());
                }
                
                return isRecent;
            });
        } catch (error) {
            logger.error('❌ Error checking recent quiz activity:', error);
            return false;
        }
    }

    /**
     * Get quiz statistics for user
     * @returns {Object} User's quiz statistics
     */
    static async getQuizStatistics() {
        try {
            const history = await this.getUserHistory();
            
            if (history.length === 0) {
                return {
                    totalQuizzes: 0,
                    averageScore: 0,
                    averagePercentage: 0,
                    favoriteCategory: 'None',
                    totalQuestions: 0,
                    recentActivity: false
                };
            }

            const validQuizzes = history.filter(quiz => quiz.score !== null && quiz.score !== undefined);
            const totalScore = validQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
            const totalPercentage = validQuizzes.reduce((sum, quiz) => sum + (quiz.percentage || 0), 0);
            const totalQuestions = history.reduce((sum, quiz) => sum + (quiz.questionCount || 0), 0);

            // Find favorite category
            const categoryCount = {};
            history.forEach(quiz => {
                const category = quiz.category || quiz.metadata?.category || 'General';
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
            
            const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
                categoryCount[a] > categoryCount[b] ? a : b, 'General'
            );

            // Check recent activity (last 7 days)
            const recentActivity = await this.hasRecentQuizActivity(null, 24 * 7);

            return {
                totalQuizzes: history.length,
                averageScore: validQuizzes.length > 0 ? Math.round(totalScore / validQuizzes.length) : 0,
                averagePercentage: validQuizzes.length > 0 ? Math.round(totalPercentage / validQuizzes.length) : 0,
                favoriteCategory,
                totalQuestions,
                recentActivity,
                categoryBreakdown: categoryCount
            };
        } catch (error) {
            logger.error('❌ Error getting quiz statistics:', error);
            return {
                totalQuizzes: 0,
                averageScore: 0,
                averagePercentage: 0,
                favoriteCategory: 'None',
                totalQuestions: 0,
                recentActivity: false
            };
        }
    }

    /**
     * Clear user's quiz history
     * @returns {boolean} Success status
     */
    static async clearHistory() {
        try {
            const user = auth.currentUser;
            if (!user) {
                logger.warn('No authenticated user found for clearing history');
                return false;
            }

            const historyKey = `${this.HISTORY_KEY}_${user.uid}`;
            await AsyncStorage.removeItem(historyKey);
            logger.info('✅ Quiz history cleared for user:', user.uid);
            return true;
        } catch (error) {
            logger.error('❌ Error clearing quiz history:', error);
            return false;
        }
    }

    /**
     * Get quizzes by category
     * @param {string} category - Category to filter by
     * @returns {Array} Filtered quiz history
     */
    static async getQuizzesByCategory(category) {
        try {
            const history = await this.getUserHistory();
            return history.filter(quiz => {
                const quizCategory = quiz.category || quiz.metadata?.category || 'General';
                return quizCategory.toLowerCase() === category.toLowerCase();
            });
        } catch (error) {
            logger.error('❌ Error getting quizzes by category:', error);
            return [];
        }
    }

    /**
     * Get performance trends over time
     * @param {number} days - Number of days to look back
     * @returns {Array} Performance data points
     */
    static async getPerformanceTrends(days = 30) {
        try {
            const history = await this.getUserHistory();
            const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
            
            const recentQuizzes = history.filter(quiz => {
                const quizDate = new Date(quiz.timestamp);
                return quizDate > cutoff && quiz.percentage !== null;
            });

            // Group by day and calculate average performance
            const dayGroups = {};
            recentQuizzes.forEach(quiz => {
                const day = new Date(quiz.timestamp).toDateString();
                if (!dayGroups[day]) {
                    dayGroups[day] = [];
                }
                dayGroups[day].push(quiz.percentage);
            });

            const trends = Object.keys(dayGroups).map(day => {
                const percentages = dayGroups[day];
                const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
                return {
                    date: day,
                    averagePercentage: Math.round(averagePercentage),
                    quizCount: percentages.length
                };
            });

            return trends.sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            logger.error('❌ Error getting performance trends:', error);
            return [];
        }
    }

    /**
     * Export history data for sharing or backup
     * @returns {Object} Exportable history data
     */
    static async exportHistory() {
        try {
            const user = auth.currentUser;
            if (!user) return null;

            const history = await this.getUserHistory();
            const statistics = await this.getQuizStatistics();

            return {
                userId: user.uid,
                exportDate: new Date().toISOString(),
                statistics,
                history: history.map(quiz => ({
                    ...quiz,
                    questions: undefined // Remove questions for smaller export size
                }))
            };
        } catch (error) {
            logger.error('❌ Error exporting history:', error);
            return null;
        }
    }
}