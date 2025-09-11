import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';


export class QuizHistoryManager {
    static HISTORY_KEY = 'quiz_history';
    static MAX_HISTORY = 100;

    // Save quiz to local history
    static async saveQuizToHistory(quizData, source = 'unknown') {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const historyKey = `${this.HISTORY_KEY}_${user.uid}`;
            const existingHistory = await AsyncStorage.getItem(historyKey);
            const history = existingHistory ? JSON.parse(existingHistory) : [];

            const quizRecord = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                source: source,
                metadata: quizData.metadata || {},
                questionCount: Array.isArray(quizData.quiz) ? quizData.quiz.length : 0,
                userId: user.uid
            };

            history.unshift(quizRecord);

            // Keep only recent history
            if (history.length > this.MAX_HISTORY) {
                history.splice(this.MAX_HISTORY);
            }

            await AsyncStorage.setItem(historyKey, JSON.stringify(history));
            logger.info('✅ Quiz saved to local history');
        } catch (error) {
            logger.error('Error saving quiz to history:', error);
        }
    }

    // Get user's quiz history
    static async getUserHistory() {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const historyKey = `${this.HISTORY_KEY}_${user.uid}`;
            const history = await AsyncStorage.getItem(historyKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            logger.error('Error getting quiz history:', error);
            return [];
        }
    }

    // Check if user has taken quizzes recently (for anti-repetition awareness)
    static async hasRecentQuizActivity(topic = null, hours = 24) {
        try {
            const history = await this.getUserHistory();
            const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));

            return history.some(quiz => {
                const quizDate = new Date(quiz.timestamp);
                const isRecent = quizDate > cutoff;
                
                if (topic) {
                    const quizTopic = quiz.metadata?.topic?.toLowerCase();
                    return isRecent && quizTopic?.includes(topic.toLowerCase());
                }
                
                return isRecent;
            });
        } catch (error) {
            logger.error('Error checking recent quiz activity:', error);
            return false;
        }
    }
}