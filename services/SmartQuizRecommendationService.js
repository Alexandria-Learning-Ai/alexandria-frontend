import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudentProfileService } from './StudentProfileService';
import { WeaknessAnalysisService } from './WeaknessAnalysisService';
import { API_BASE_URL } from '../config/api';
import uuid from 'react-native-uuid';
import logger from '../utils/logger';


/**
 * 🎯 Smart Quiz Recommendation Service
 * 
 * Automatically generates personalized quizzes based on:
 * - User's weakness patterns
 * - Subjects needing improvement
 * - Learning style preferences
 * - Recent performance trends
 * - Upcoming exam focus areas
 */
export class SmartQuizRecommendationService {
    static STORAGE_KEY = 'smart_quiz_recommendations';
    static GENERATED_QUIZZES_KEY = 'generated_smart_quizzes';
    static QUIZ_HISTORY_KEY = 'smart_quiz_history';

    /**
     * 🧠 Generate a personalized quiz recommendation
     */
    static async generateSmartQuizRecommendation(userId, context = 'general') {
        try {
            logger.info(`🎯 Generating smart quiz recommendation for ${userId} (${context})`);
            
            // 1. Analyze user's current needs
            const userAnalysis = await this.analyzeUserQuizNeeds(userId);
            if (!userAnalysis.hasData) {
                logger.info('📝 New user - generating welcome quiz');
                return await this.generateWelcomeQuiz(userId);
            }

            // 2. Identify focus areas
            const focusAreas = await this.identifyFocusAreas(userAnalysis, context);
            if (focusAreas.length === 0) {
                logger.info('🎉 No weaknesses found - generating challenge quiz');
                return await this.generateChallengeQuiz(userAnalysis);
            }

            // 3. Generate targeted quiz
            const targetArea = this.selectPriorityFocusArea(focusAreas, context);
            const smartQuiz = await this.generateTargetedQuiz(userId, targetArea, userAnalysis);

            // 4. Save recommendation
            await this.saveQuizRecommendation(userId, smartQuiz, targetArea, context);

            return smartQuiz;

        } catch (error) {
            logger.error('❌ Error generating smart quiz recommendation:', error);
            return null;
        }
    }

    /**
     * 📊 Analyze user's quiz needs and patterns
     */
    static async analyzeUserQuizNeeds(userId) {
        try {
            const [profile, quizHistory, weeklyStats] = await Promise.all([
                StudentProfileService.getProfile(userId),
                this.getQuizHistory(userId),
                this.getWeeklyStats(userId)
            ]);

            if (!profile || quizHistory.length === 0) {
                return { hasData: false, profile };
            }

            // Analyze recent performance (last 10 quizzes)
            const recentQuizzes = quizHistory.slice(0, 10);
            const performanceAnalysis = this.analyzePerformancePatterns(recentQuizzes);
            
            // Identify subject weaknesses
            const subjectAnalysis = this.analyzeSubjectPerformance(recentQuizzes);
            
            // Analyze question type struggles
            const questionTypeAnalysis = this.analyzeQuestionTypeStrengths(recentQuizzes);
            
            // Get upcoming exams context
            const examContext = await this.getUpcomingExamContext(userId, profile);

            return {
                hasData: true,
                profile,
                quizHistory: recentQuizzes,
                performance: performanceAnalysis,
                subjects: subjectAnalysis,
                questionTypes: questionTypeAnalysis,
                exams: examContext,
                weeklyStats: weeklyStats || this.getDefaultWeeklyStats()
            };

        } catch (error) {
            logger.error('Error analyzing user quiz needs:', error);
            return { hasData: false };
        }
    }

    /**
     * 🎯 Identify specific focus areas for quiz generation
     */
    static async identifyFocusAreas(userAnalysis, context) {
        const focusAreas = [];
        
        // 1. Subject-based focus areas (struggling subjects)
        // ✅ FIXED: Add safety check for undefined arrays
        if (userAnalysis.subjects?.struggling && Array.isArray(userAnalysis.subjects.struggling)) {
            userAnalysis.subjects.struggling.forEach(subject => {
                focusAreas.push({
                    type: 'subject_weakness',
                    area: subject.name,
                    priority: this.calculateSubjectPriority(subject, context),
                    accuracy: subject.accuracy,
                    reason: `Low accuracy in ${subject.name} (${subject.accuracy}%)`,
                    recommendedDifficulty: this.getRecommendedDifficulty(subject.accuracy),
                    questionCount: this.getRecommendedQuestionCount(subject, context)
                });
            });
        }

        // 2. Question type focus areas
        // ✅ FIXED: Add safety check for undefined arrays
        if (userAnalysis.questionTypes?.weakAreas && Array.isArray(userAnalysis.questionTypes.weakAreas)) {
            userAnalysis.questionTypes.weakAreas.forEach(questionType => {
                focusAreas.push({
                    type: 'question_type_weakness',
                    area: questionType.type,
                    priority: this.calculateQuestionTypePriority(questionType, context),
                    accuracy: questionType.accuracy,
                    reason: `Struggles with ${questionType.type} questions (${questionType.accuracy}%)`,
                    recommendedDifficulty: this.getRecommendedDifficulty(questionType.accuracy),
                    questionCount: this.getRecommendedQuestionCount(questionType, context)
                });
            });
        }

        // 3. Exam preparation focus areas
        // ✅ FIXED: Add safety check for undefined arrays
        if ((context === 'exam_prep' || (userAnalysis.exams?.urgent && userAnalysis.exams.urgent.length > 0)) &&
            Array.isArray(userAnalysis.exams?.urgent)) {
            userAnalysis.exams.urgent.forEach(exam => {
                focusAreas.push({
                    type: 'exam_preparation',
                    area: exam.subject,
                    priority: 10, // Highest priority
                    examDate: exam.date,
                    daysLeft: exam.daysLeft,
                    reason: `Urgent exam preparation for ${exam.title} (${exam.daysLeft} days left)`,
                    recommendedDifficulty: 'medium', // Balanced for exam prep
                    questionCount: Math.min(20, Math.max(10, Math.floor(exam.daysLeft * 2)))
                });
            });
        }

        // 4. Consistency improvement areas
        // ✅ FIXED: Add safety check for undefined arrays
        if (userAnalysis.performance?.consistency && userAnalysis.performance.consistency < 60) {
            const inconsistentAreas = this.identifyInconsistentAreas(userAnalysis);
            if (inconsistentAreas && Array.isArray(inconsistentAreas)) {
                inconsistentAreas.forEach(area => {
                    focusAreas.push({
                        type: 'consistency_improvement',
                        area: area.name,
                        priority: 6,
                        consistency: area.consistency,
                        reason: `Inconsistent performance in ${area.name}`,
                        recommendedDifficulty: 'easy', // Build confidence
                        questionCount: 8
                    });
                });
            }
        }

        // Sort by priority and return top focus areas
        return focusAreas
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5); // Limit to top 5 focus areas
    }

    /**
     * 🎯 Generate a targeted quiz based on focus area
     */
    static async generateTargetedQuiz(userId, focusArea, userAnalysis) {
        try {
            const quizConfig = this.buildQuizConfiguration(focusArea, userAnalysis);
            const quiz = await this.requestQuizGeneration(quizConfig, userId);
            
            if (!quiz) {
                // Fallback to local quiz generation
                return this.generateFallbackQuiz(focusArea, userAnalysis);
            }

            // Enhance quiz with metadata
            return this.enhanceQuizWithMetadata(quiz, focusArea, userAnalysis);

        } catch (error) {
            logger.error('Error generating targeted quiz:', error);
            return this.generateFallbackQuiz(focusArea, userAnalysis);
        }
    }

    /**
     * ⚙️ Build quiz configuration for API request
     */
    static buildQuizConfiguration(focusArea, userAnalysis) {
        const profile = userAnalysis.profile;

        return {
            userId: userAnalysis.profile.userId,
            focusArea: {
                type: focusArea.type,
                subject: focusArea.area,
                difficulty: focusArea.recommendedDifficulty,
                questionCount: focusArea.questionCount
            },
            userPreferences: {
                learningStyles: profile.learningStyles || ['multiple_choice'],
                preferredQuestionTypes: this.getPreferredQuestionTypes(userAnalysis),
                avoidQuestionTypes: this.getWeakQuestionTypes(userAnalysis)
            },
            context: {
                recentPerformance: userAnalysis.performance?.average || 0,
                strongAreas: userAnalysis.subjects?.strong?.map(s => s.name) || [],
                weakAreas: userAnalysis.subjects?.struggling?.map(s => s.name) || [],
                upcomingExams: userAnalysis.exams?.urgent?.map(e => e.title) || []
            },
            quizStyle: {
                explanationLevel: this.getOptimalExplanationLevel(profile),
                includeHints: (userAnalysis.performance?.average || 0) < 70,
                adaptiveDifficulty: true,
                timeLimit: this.calculateOptimalTimeLimit(focusArea.questionCount, profile)
            }
        };
    }

    /**
     * 🌐 Request quiz generation from backend API
     */
    static async requestQuizGeneration(config, userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/generate-smart-quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId
                },
                body: JSON.stringify(config),
                timeout: 30000
            });

            if (!response.ok) {
                logger.warn(`API returned ${response.status}, using fallback`);
                return null;
            }

            const data = await response.json();
            return data.quiz;

        } catch (error) {
            logger.warn('API quiz generation failed, using fallback:', error);
            return null;
        }
    }

    /**
     * 🛠️ Generate fallback quiz when API is unavailable
     */
    static generateFallbackQuiz(focusArea, userAnalysis) {
        const questionBank = this.getLocalQuestionBank(focusArea.area);
        const selectedQuestions = this.selectQuestionsForFocusArea(questionBank, focusArea);

        return {
            id: `smart_quiz_${uuid.v4()}`,
            title: this.generateQuizTitle(focusArea),
            description: `Personalized quiz focusing on ${focusArea.area}`,
            questions: selectedQuestions,
            metadata: {
                type: 'smart_recommendation',
                focusArea: focusArea.area,
                focusType: focusArea.type,
                difficulty: focusArea.recommendedDifficulty,
                estimatedTime: Math.ceil(selectedQuestions.length * 1.5), // 1.5 minutes per question
                generatedAt: new Date().toISOString(),
                source: 'fallback_generation'
            },
            smartFeatures: {
                isPersonalized: true,
                targetWeakness: focusArea.area,
                explanationLevel: this.getOptimalExplanationLevel(userAnalysis.profile),
                adaptiveScoring: true
            }
        };
    }

    /**
     * ✨ Enhance quiz with smart metadata
     */
    static enhanceQuizWithMetadata(quiz, focusArea, userAnalysis) {
        return {
            ...quiz,
            metadata: {
                ...quiz.metadata,
                type: 'smart_recommendation',
                focusArea: focusArea.area,
                focusType: focusArea.type,
                personalizedFor: userAnalysis.profile.fullName || 'Student',
                targetImprovement: focusArea.reason,
                difficulty: focusArea.recommendedDifficulty,
                generatedAt: new Date().toISOString(),
                source: 'api_generation'
            },
            smartFeatures: {
                isPersonalized: true,
                targetWeakness: focusArea.area,
                explanationLevel: this.getOptimalExplanationLevel(userAnalysis.profile),
                adaptiveScoring: true,
                contextualFeedback: true,
                progressTracking: true
            },
            notification: {
                title: this.generateNotificationTitle(focusArea, userAnalysis.profile),
                body: this.generateNotificationBody(focusArea, userAnalysis.profile),
                actionText: 'Start Smart Quiz'
            }
        };
    }

    /**
     * 🎨 Generate engaging notification content
     */
    static generateNotificationTitle(focusArea, profile) {
        const firstName = profile.fullName ? profile.fullName.split(' ')[0] : 'Student';
        const area = focusArea.area.replace(/_/g, ' ');
        
        const titles = {
            subject_weakness: `🎯 ${firstName}, Ready to Master ${area}?`,
            question_type_weakness: `💪 ${firstName}, Let's Improve Your ${area} Skills!`,
            exam_preparation: `📚 ${firstName}, ${area} Exam Prep Time!`,
            consistency_improvement: `🔥 ${firstName}, Build Your ${area} Confidence!`
        };

        return titles[focusArea.type] || `🌟 ${firstName}, Your Personalized Quiz is Ready!`;
    }

    static generateNotificationBody(focusArea, profile) {
        const area = focusArea.area.replace(/_/g, ' ');
        const questionCount = focusArea.questionCount || 10;
        
        const bodies = {
            subject_weakness: `I've created a ${questionCount}-question ${area} quiz targeting your specific improvement areas. Ready to boost your understanding? 📈`,
            question_type_weakness: `Time to strengthen your ${area} skills! I've prepared ${questionCount} targeted questions just for you. 🚀`,
            exam_preparation: `With ${focusArea.daysLeft} days until your exam, here's a focused ${area} practice session to boost your readiness! 💯`,
            consistency_improvement: `Let's build steady improvement in ${area}! I've crafted ${questionCount} confidence-building questions for you. ✨`
        };

        return bodies[focusArea.type] || `Your personalized ${area} quiz with ${questionCount} questions is ready! Tap to start your focused learning session. 🎯`;
    }

    /**
     * 💾 Save quiz recommendation for tracking
     */
    static async saveQuizRecommendation(userId, quiz, focusArea, context) {
        try {
            const recommendation = {
                id: quiz.id,
                userId,
                focusArea,
                context,
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    questionCount: quiz.questions?.length || focusArea.questionCount,
                    difficulty: focusArea.recommendedDifficulty
                },
                createdAt: new Date().toISOString(),
                status: 'generated',
                notificationSent: false
            };

            // Save individual recommendation
            await AsyncStorage.setItem(
                `${this.STORAGE_KEY}_${quiz.id}`, 
                JSON.stringify(recommendation)
            );

            // Update user's recommendation history
            await this.updateRecommendationHistory(userId, recommendation);

            // Store the full quiz for quick access
            await AsyncStorage.setItem(
                `${this.GENERATED_QUIZZES_KEY}_${quiz.id}`,
                JSON.stringify(quiz)
            );

        } catch (error) {
            logger.error('Error saving quiz recommendation:', error);
        }
    }

    /**
     * 📋 Get smart quiz by ID (for notification clicks)
     */
    static async getSmartQuiz(quizId) {
        try {
            const quizData = await AsyncStorage.getItem(`${this.GENERATED_QUIZZES_KEY}_${quizId}`);
            if (quizData) {
                const quiz = JSON.parse(quizData);
                // Mark as accessed
                await this.markQuizAsAccessed(quizId);
                return quiz;
            }
            return null;
        } catch (error) {
            logger.error('Error getting smart quiz:', error);
            return null;
        }
    }

    /**
     * 📊 Track quiz recommendation performance
     */
    static async trackQuizRecommendationPerformance(userId, quizId, results) {
        try {
            const performance = {
                userId,
                quizId,
                completedAt: new Date().toISOString(),
                score: results.percentage,
                timeSpent: results.timeSpent,
                questionsAnswered: results.totalQuestions,
                correctAnswers: results.score,
                improvementAreas: results.weakAreas || [],
                strengths: results.strongAreas || []
            };

            // Save performance data
            await AsyncStorage.setItem(
                `${this.QUIZ_HISTORY_KEY}_${quizId}`,
                JSON.stringify(performance)
            );

            // Update recommendation status
            await this.updateRecommendationStatus(quizId, 'completed', performance);

            logger.info(`📊 Smart quiz performance tracked: ${results.percentage}%`);
            return performance;

        } catch (error) {
            logger.error('Error tracking quiz performance:', error);
            return null;
        }
    }

    /**
     * 🎯 Get personalized quiz recommendations for notifications
     */
    static async getRecommendationsForNotification(userId, limit = 1) {
        try {
            // Check if we have recent, unused recommendations
            const recentRecs = await this.getRecentRecommendations(userId, 24); // Last 24 hours
            const unused = recentRecs.filter(rec => rec.status === 'generated' && !rec.notificationSent);
            
            if (unused.length > 0) {
                return unused.slice(0, limit);
            }

            // Generate new recommendations
            const recommendations = [];
            for (let i = 0; i < limit; i++) {
                const rec = await this.generateSmartQuizRecommendation(userId, 'notification');
                if (rec) {
                    recommendations.push(rec);
                }
            }

            return recommendations;
        } catch (error) {
            logger.error('Error getting recommendations for notification:', error);
            return [];
        }
    }

    /**
     * 🛠️ Helper Methods
     */
    static async getQuizHistory(userId) {
        try {
            const history = await AsyncStorage.getItem(`quizHistory_${userId}`);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    }

    static analyzePerformancePatterns(quizzes) {
        if (quizzes.length === 0) return { average: 0, trend: 0, consistency: 0 };

        const scores = quizzes.map(q => q.results?.percentage || 0);
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        // Calculate trend (recent vs older scores)
        const recentScores = scores.slice(0, Math.ceil(scores.length / 2));
        const olderScores = scores.slice(Math.ceil(scores.length / 2));
        const trend = recentScores.length > 0 && olderScores.length > 0 ? 
            (recentScores.reduce((s, score) => s + score, 0) / recentScores.length) - 
            (olderScores.reduce((s, score) => s + score, 0) / olderScores.length) : 0;

        // Calculate consistency (lower variance = higher consistency)
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
        const consistency = Math.max(0, 100 - Math.sqrt(variance));

        return { average: Math.round(average), trend: Math.round(trend), consistency: Math.round(consistency) };
    }

    static analyzeSubjectPerformance(quizzes) {
        const subjectMap = new Map();

        quizzes.forEach(quiz => {
            const subject = quiz.metadata?.category || quiz.metadata?.subject || 'General';
            const score = quiz.results?.percentage || 0;

            if (!subjectMap.has(subject)) {
                subjectMap.set(subject, { scores: [], total: 0 });
            }
            
            subjectMap.get(subject).scores.push(score);
            subjectMap.get(subject).total++;
        });

        const subjects = Array.from(subjectMap.entries()).map(([name, data]) => ({
            name,
            accuracy: Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length),
            attempts: data.total,
            trend: this.calculateTrend(data.scores)
        }));

        return {
            all: subjects,
            strong: subjects.filter(s => s.accuracy >= 80),
            struggling: subjects.filter(s => s.accuracy < 65),
            improving: subjects.filter(s => s.trend > 10)
        };
    }

    /**
     * Analyze question type strengths and weaknesses
     */
    static analyzeQuestionTypeStrengths(quizzes) {
        const typeMap = new Map();

        quizzes.forEach(quiz => {
            const questions = quiz.questions || [];
            questions.forEach(question => {
                const type = question.type || 'unknown';
                const isCorrect = question.isCorrect || false;

                if (!typeMap.has(type)) {
                    typeMap.set(type, { correct: 0, total: 0 });
                }

                typeMap.get(type).total++;
                if (isCorrect) {
                    typeMap.get(type).correct++;
                }
            });
        });

        const questionTypes = Array.from(typeMap.entries()).map(([type, data]) => ({
            type,
            accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
            attempts: data.total,
            correct: data.correct
        }));

        return {
            all: questionTypes,
            strong: questionTypes.filter(qt => qt.accuracy >= 80),
            struggling: questionTypes.filter(qt => qt.accuracy < 65 && qt.attempts >= 3),
            weakAreas: questionTypes.filter(qt => qt.accuracy < 65 && qt.attempts >= 3)
        };
    }

    /**
     * Update user's recommendation history
     */
    static async updateRecommendationHistory(userId, recommendation) {
        try {
            const historyKey = `${this.HISTORY_KEY}_${userId}`;
            const existing = await AsyncStorage.getItem(historyKey);
            const history = existing ? JSON.parse(existing) : [];

            // Add new recommendation to history
            history.unshift({
                ...recommendation,
                recommendedAt: new Date().toISOString()
            });

            // Keep only last 50 recommendations
            const trimmedHistory = history.slice(0, 50);

            await AsyncStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
        } catch (error) {
            logger.error('Error updating recommendation history:', error);
        }
    }

    /**
     * Get upcoming exam context for the user
     */
    static async getUpcomingExamContext(userId, profile) {
        try {
            // Check for upcoming exams in user profile
            const exams = profile?.upcomingExams || [];

            // Filter exams happening in the next 30 days
            const now = Date.now();
            const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);

            const upcomingExams = exams.filter(exam => {
                const examDate = new Date(exam.date).getTime();
                return examDate >= now && examDate <= thirtyDaysFromNow;
            }).map(exam => {
                const examDate = new Date(exam.date).getTime();
                const daysLeft = Math.ceil((examDate - now) / (24 * 60 * 60 * 1000));
                return {
                    ...exam,
                    daysLeft,
                    title: exam.title || exam.name || exam.subject
                };
            });

            // Sort by date (earliest first)
            upcomingExams.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Identify urgent exams (within 7 days)
            const urgentExams = upcomingExams.filter(exam => exam.daysLeft <= 7);

            return {
                hasUpcomingExams: upcomingExams.length > 0,
                exams: upcomingExams,
                urgent: urgentExams,
                nextExam: upcomingExams[0] || null,
                examSubjects: upcomingExams.map(exam => exam.subject).filter(Boolean)
            };
        } catch (error) {
            logger.error('Error getting upcoming exam context:', error);
            return {
                hasUpcomingExams: false,
                exams: [],
                urgent: [],
                nextExam: null,
                examSubjects: []
            };
        }
    }

    static calculateTrend(scores) {
        if (scores.length < 2) return 0;
        const midpoint = Math.floor(scores.length / 2);
        const recent = scores.slice(0, midpoint);
        const older = scores.slice(midpoint);
        const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
        const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
        return Math.round(recentAvg - olderAvg);
    }

    static getRecommendedDifficulty(accuracy) {
        if (accuracy < 50) return 'easy';
        if (accuracy < 75) return 'medium';
        return 'hard';
    }

    static getRecommendedQuestionCount(item, context) {
        const base = {
            'notification': 8,
            'exam_prep': 15,
            'general': 10,
            'weakness_focus': 12
        }[context] || 10;

        // Adjust based on accuracy
        if (item.accuracy < 40) return Math.max(5, base - 3); // Shorter for very weak areas
        if (item.accuracy > 80) return base + 2; // Slightly longer for strong areas
        return base;
    }

    static calculateSubjectPriority(subject, context) {
        let priority = 5; // Base priority

        // Higher priority for lower accuracy
        if (subject.accuracy < 40) priority += 4;
        else if (subject.accuracy < 60) priority += 2;

        // Context-based adjustments
        if (context === 'exam_prep') priority += 3;
        if (context === 'notification') priority += 1;

        // Trend adjustments
        if (subject.trend < -10) priority += 2; // Declining performance

        return Math.min(10, priority);
    }

    /**
     * 🎯 Select the highest priority focus area for quiz generation
     */
    static selectPriorityFocusArea(focusAreas, context) {
        if (!focusAreas || focusAreas.length === 0) {
            return null;
        }

        // Already sorted by priority in identifyFocusAreas
        // Return the top priority area
        return focusAreas[0];
    }

    static calculateQuestionTypePriority(questionType, context) {
        let priority = 4; // Base priority (slightly lower than subject weaknesses)

        // Higher priority for lower accuracy
        if (questionType.accuracy < 40) priority += 3;
        else if (questionType.accuracy < 60) priority += 2;

        // Context-based adjustments
        if (context === 'exam_prep') priority += 2;

        return Math.min(10, priority);
    }

    static identifyInconsistentAreas(userAnalysis) {
        const inconsistentAreas = [];

        if (!userAnalysis.subjects || !userAnalysis.subjects.all) {
            return inconsistentAreas;
        }

        // Find subjects with high variance in scores
        userAnalysis.subjects.all.forEach(subject => {
            if (subject.variance && subject.variance > 20) {
                inconsistentAreas.push({
                    name: subject.name,
                    consistency: 100 - subject.variance
                });
            }
        });

        return inconsistentAreas;
    }

    /**
     * ✅ Get preferred question types based on user performance
     */
    static getPreferredQuestionTypes(userAnalysis) {
        if (!userAnalysis?.questionTypes?.strong) {
            return ['multiple_choice', 'true_false']; // Default safe types
        }
        return userAnalysis.questionTypes.strong.map(qt => qt.type);
    }

    /**
     * ✅ Get weak question types to avoid/target
     */
    static getWeakQuestionTypes(userAnalysis) {
        if (!userAnalysis?.questionTypes?.weak) {
            return []; // No types to avoid by default
        }
        return userAnalysis.questionTypes.weak.map(qt => qt.type);
    }

    /**
     * ✅ Get optimal explanation level based on profile
     */
    static getOptimalExplanationLevel(profile) {
        if (!profile) return 'medium';

        const educationLevel = profile.educationLevel || 'college';

        if (educationLevel === 'elementary' || educationLevel === 'middle_school') {
            return 'detailed';
        } else if (educationLevel === 'high_school') {
            return 'medium';
        } else {
            return 'concise';
        }
    }

    /**
     * ✅ Calculate optimal time limit for quiz
     */
    static calculateOptimalTimeLimit(questionCount, profile) {
        const baseTimePerQuestion = 1.5; // 1.5 minutes per question
        const totalMinutes = questionCount * baseTimePerQuestion;

        // Add buffer for reading/thinking time
        const buffer = profile?.learningPace === 'slow' ? 0.5 : 0.3;
        return Math.ceil(totalMinutes * (1 + buffer));
    }

    /**
     * ✅ Get local question bank for fallback generation
     */
    static getLocalQuestionBank(focusArea) {
        // Return empty array - backend should handle quiz generation
        logger.info(`📚 Local question bank requested for: ${focusArea}`);
        return [];
    }

    /**
     * ✅ Select questions from question bank for focus area
     */
    static selectQuestionsForFocusArea(questionBank, focusArea) {
        // Return empty array - backend should handle question selection
        logger.info(`🎯 Selecting questions for focus area: ${focusArea.area}`);
        return [];
    }

    /**
     * ✅ Generate engaging quiz title
     */
    static generateQuizTitle(focusArea) {
        const area = focusArea.area.replace(/_/g, ' ');
        const titles = {
            subject_weakness: `Master ${area} - Targeted Practice`,
            question_type_weakness: `${area} Skills Builder`,
            exam_preparation: `${area} Exam Preparation`,
            consistency_improvement: `${area} Confidence Booster`
        };
        return titles[focusArea.type] || `${area} Practice Quiz`;
    }


    /**
     * ✅ Get default weekly stats when none available
     */
    static getDefaultWeeklyStats() {
        return {
            quizzesCompleted: 0,
            averageScore: 0,
            totalQuestions: 0,
            streak: 0,
            studyTime: 0
        };
    }

    /**
     * 📖 Get a specific recommended quiz by ID
     */
    static async getRecommendedQuiz(quizId) {
        try {
            logger.info(`🔍 Retrieving recommended quiz: ${quizId}`);
            
            // First try to get from local storage
            const storedQuizzes = await AsyncStorage.getItem(this.GENERATED_QUIZZES_KEY);
            if (storedQuizzes) {
                const quizzes = JSON.parse(storedQuizzes);
                const quiz = quizzes.find(q => q.id === quizId);
                if (quiz) {
                    logger.info(`✅ Found quiz in local storage: ${quiz.title}`);
                    return quiz;
                }
            }

            // Try API endpoint if available
            if (API_BASE_URL) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/smart-quiz/${quizId}`);
                    if (response.ok) {
                        const quiz = await response.json();
                        logger.info(`✅ Retrieved quiz from API: ${quiz.title}`);
                        return quiz;
                    }
                } catch (apiError) {
                    logger.info('API not available, using fallback');
                }
            }

            logger.info(`⚠️ Quiz not found: ${quizId}`);
            return null;

        } catch (error) {
            logger.error('Error retrieving recommended quiz:', error);
            return null;
        }
    }

    /**
     * Get recent quiz recommendations for a user within specified hours
     */
    static async getRecentRecommendations(userId, hoursBack = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
            const storageKey = `quiz_recommendations_${userId}`;

            const stored = await AsyncStorage.getItem(storageKey);
            if (!stored) {
                return [];
            }

            const recommendations = JSON.parse(stored);

            // Filter recommendations from the last N hours
            const recent = recommendations.filter(rec => {
                const recTime = new Date(rec.generatedAt || rec.timestamp);
                return recTime >= cutoffTime;
            });

            logger.info(`📊 Found ${recent.length} recommendations in last ${hoursBack} hours for user ${userId}`);
            return recent;

        } catch (error) {
            logger.error('Error getting recent recommendations:', error);
            return [];
        }
    }

    /**
     * Get weekly stats for user analysis
     */
    static async getWeeklyStats(userId) {
        try {
            const stats = await AsyncStorage.getItem(`weekly_stats_${userId}`);
            if (!stats) {
                return {
                    totalQuizzes: 0,
                    averageScore: 0,
                    improvementTrend: 0,
                    consistencyScore: 0,
                    lastActivityDate: null
                };
            }
            return JSON.parse(stats);
        } catch (error) {
            logger.error('Error getting weekly stats:', error);
            return {
                totalQuizzes: 0,
                averageScore: 0,
                improvementTrend: 0,
                consistencyScore: 0,
                lastActivityDate: null
            };
        }
    }

    /**
     * Generate a welcome quiz for new users
     */
    static async generateWelcomeQuiz(userId) {
        try {
            logger.info(`🎉 Generating welcome quiz for new user: ${userId}`);

            const welcomeQuiz = {
                id: `welcome_${userId}_${Date.now()}`,
                title: "Welcome to Alexandria! 🏛️",
                description: "Let's discover your learning style with this personalized quiz",
                questions: [
                    {
                        question_number: 1,
                        question_text: "What's your preferred way to learn new concepts?",
                        type: "multiple_choice",
                        options: [
                            { label: "A", text: "Reading and taking notes" },
                            { label: "B", text: "Visual diagrams and charts" },
                            { label: "C", text: "Practice problems and exercises" },
                            { label: "D", text: "Discussion and explanation" }
                        ],
                        correct_answer: "C",
                        difficulty: "easy"
                    },
                    {
                        question_number: 2,
                        question_text: "How often do you prefer to study?",
                        type: "multiple_choice",
                        options: [
                            { label: "A", text: "Daily short sessions" },
                            { label: "B", text: "Long sessions 2-3 times per week" },
                            { label: "C", text: "Intensive sessions before exams" },
                            { label: "D", text: "Flexible based on my schedule" }
                        ],
                        correct_answer: "A",
                        difficulty: "easy"
                    },
                    {
                        question_number: 3,
                        question_text: "What motivates you most in learning?",
                        type: "multiple_choice",
                        options: [
                            { label: "A", text: "Achieving high scores" },
                            { label: "B", text: "Understanding concepts deeply" },
                            { label: "C", text: "Preparing for real-world applications" },
                            { label: "D", text: "Competing with peers" }
                        ],
                        correct_answer: "B",
                        difficulty: "easy"
                    }
                ],
                metadata: {
                    isWelcomeQuiz: true,
                    personalizedFor: userId,
                    generatedAt: new Date().toISOString(),
                    source: 'welcome_generation'
                },
                smartFeatures: {
                    isPersonalized: true,
                    adaptiveScoring: false,
                    contextualFeedback: true,
                    progressTracking: true
                },
                notification: {
                    title: "🎉 Welcome to Alexandria!",
                    body: "Take your first quiz to help us personalize your learning experience",
                    actionText: "Start Welcome Quiz"
                }
            };

            // Save the welcome quiz
            await this.saveQuizRecommendation(userId, welcomeQuiz, 'welcome', 'new_user');

            logger.info('✅ Welcome quiz generated successfully');
            return welcomeQuiz;

        } catch (error) {
            logger.error('Error generating welcome quiz:', error);
            return null;
        }
    }
}

export default SmartQuizRecommendationService;