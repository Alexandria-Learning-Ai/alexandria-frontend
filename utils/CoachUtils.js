// CoachUtils.js - Utility functions for Coach System
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';


export class CoachUtils {
    
    // Get coach history for progress tracking
    static async getCoachHistory(userId) {
        try {
            if (!userId) return []; // ✅ Return empty if no user
            const history = await AsyncStorage.getItem(`coachHistory_${userId}`); // ✅ Use user-specific key
            return history ? JSON.parse(history) : [];
        } catch (error) {
            logger.error('Error getting coach history:', error);
            return [];
        }
    }

    // Get weekly coach summary
    static async getWeeklySummary(userId) {
        try {
            if (!userId) return null; // ✅ Return null if no user
            const history = await this.getCoachHistory(userId); // ✅ Pass userId
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const weeklyMessages = history.filter(msg => 
                new Date(msg.date) >= oneWeekAgo
            );

            if (weeklyMessages.length === 0) {
                return {
                    totalQuizzes: 0,
                    averageScore: 0,
                    improvement: 0,
                    categories: [],
                    message: "Start taking quizzes to see your weekly progress!"
                };
            }

            const totalQuizzes = weeklyMessages.length;
            const averageScore = weeklyMessages.reduce((sum, msg) => sum + msg.score, 0) / totalQuizzes;
            const categories = [...new Set(weeklyMessages.map(msg => msg.category))];
            
            // Calculate improvement (compare first half vs second half of week)
            const midPoint = Math.floor(weeklyMessages.length / 2);
            const firstHalf = weeklyMessages.slice(midPoint);
            const secondHalf = weeklyMessages.slice(0, midPoint);
            
            const firstHalfAvg = firstHalf.length > 0 
                ? firstHalf.reduce((sum, msg) => sum + msg.score, 0) / firstHalf.length 
                : 0;
            const secondHalfAvg = secondHalf.length > 0 
                ? secondHalf.reduce((sum, msg) => sum + msg.score, 0) / secondHalf.length 
                : 0;
            
            const improvement = secondHalfAvg - firstHalfAvg;

            let message = `This week you completed ${totalQuizzes} quizzes with an average score of ${Math.round(averageScore)}%. `;
            
            if (improvement > 10) {
                message += `🚀 Amazing improvement of +${Math.round(improvement)}%!`;
            } else if (improvement > 5) {
                message += `📈 Great progress with +${Math.round(improvement)}% improvement!`;
            } else if (improvement > 0) {
                message += `👍 Steady improvement of +${Math.round(improvement)}%!`;
            } else if (improvement > -5) {
                message += `💪 Keep practicing to maintain your performance!`;
            } else {
                message += `🎯 Focus on reviewing your weak areas to improve!`;
            }

            return {
                totalQuizzes,
                averageScore: Math.round(averageScore),
                improvement: Math.round(improvement),
                categories,
                message
            };
        } catch (error) {
            logger.error('Error getting weekly summary:', error);
            return null;
        }
    }

    // Check if user needs a motivational nudge
    static async checkForNudge(userId) {
        try {
            if (!userId) return null; // ✅ Return null if no user
            const lastQuizDate = await AsyncStorage.getItem(`lastQuizDate_${userId}`); // ✅ Use user-specific key
            if (!lastQuizDate) return null;

            const daysSinceLastQuiz = Math.floor(
                (new Date() - new Date(lastQuizDate)) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastQuiz >= 3) {
                const nudgeMessages = [
                    "🌟 Your brain misses the challenge! Ready to learn something new?",
                    "📚 It's been a few days - time to flex those mental muscles!",
                    "🎯 Consistency is key to mastery. How about a quick quiz?",
                    "💡 Knowledge grows with practice. Take a quiz today!",
                    "🚀 Your learning journey is waiting. Let's get back to it!"
                ];

                return {
                    daysSince: daysSinceLastQuiz,
                    message: nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)],
                    urgency: daysSinceLastQuiz >= 7 ? 'high' : 'medium'
                };
            }

            return null;
        } catch (error) {
            logger.error('Error checking for nudge:', error);
            return null;
        }
    }

    // Save quiz completion for nudge tracking
    static async recordQuizCompletion(userId) {
        try {
            if (!userId) return; // ✅ Do nothing if no user
            await AsyncStorage.setItem(`lastQuizDate_${userId}`, new Date().toISOString()); // ✅ Use user-specific key
        } catch (error) {
            logger.error('Error recording quiz completion:', error);
        }
    }

    // Get motivational quote based on performance
    static getMotivationalQuote(percentage) {
        const quotes = {
            excellent: [
                "Excellence is not a skill, it's an attitude. - Ralph Marston",
                "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
                "The expert in anything was once a beginner. - Helen Hayes"
            ],
            good: [
                "Progress, not perfection. - Unknown",
                "The only way to do great work is to love what you do. - Steve Jobs",
                "Learning never exhausts the mind. - Leonardo da Vinci"
            ],
            improving: [
                "Every expert was once a beginner. - Robin Sharma",
                "It does not matter how slowly you go as long as you do not stop. - Confucius",
                "Success is a journey, not a destination. - Ben Sweetland"
            ],
            encouraging: [
                "Believe you can and you're halfway there. - Theodore Roosevelt",
                "The beautiful thing about learning is nobody can take it away from you. - B.B. King",
                "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela"
            ]
        };

        let category;
        if (percentage >= 85) category = 'excellent';
        else if (percentage >= 70) category = 'good';
        else if (percentage >= 55) category = 'improving';
        else category = 'encouraging';

        const categoryQuotes = quotes[category];
        return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
    }
}