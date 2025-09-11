

// CoachMessage.js - Standalone Coach Message Component
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

import { auth } from '../firebaseConfig'; // ✅ Import auth

const { width: screenWidth } = Dimensions.get('window');

const CoachMessage = ({ 
    currentScore = 0, 
    totalQuestions = 0, 
    quizCategory = 'General', 
    isDarkMode = false,
    style = {},
    onCoachTap = null 
}) => {
    const [coachMessage, setCoachMessage] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userProgress, setUserProgress] = useState(null);

    const percentage = totalQuestions > 0 ? Math.round((currentScore / totalQuestions) * 100) : 0;
    const currentThemeStyles = isDarkMode ? darkCoachStyles : lightCoachStyles;

    useEffect(() => {
        generateCoachMessage();
    }, [currentScore, totalQuestions, quizCategory]);

    // Local Coach Message Engine
    const generateCoachMessage = async () => {
        setLoading(true);
        try {
            // Get user's historical performance for comparison
            const progress = await getUserProgress();
            setUserProgress(progress);

            // Generate personalized message based on current performance and history
            const message = await createPersonalizedMessage(percentage, progress);
            setCoachMessage(message);
        } catch (error) {
            logger.error('Error generating coach message:', error);
            // Fallback to basic message
            setCoachMessage(createBasicMessage(percentage));
        } finally {
            setLoading(false);
        }
    };

    // Get user's progress data from AsyncStorage
    const getUserProgress = async () => {
        try {
            const user = auth.currentUser; // ✅ Get current user
            if (!user) return null; // ✅ Return null if no user

            const [quizHistory, learningMetrics] = await Promise.all([
                AsyncStorage.getItem(`quizHistory_${user.uid}`), // ✅ Use user-specific key
                AsyncStorage.getItem(`learningMetrics_${user.uid}`), // ✅ Use user-specific key
            ]);

            const history = quizHistory ? JSON.parse(quizHistory) : [];
            const metrics = learningMetrics ? JSON.parse(learningMetrics) : {};

            // Calculate recent performance trends
            const recentQuizzes = history.slice(0, 5);
            const categoryQuizzes = history.filter(q => 
                q.metadata?.category?.toLowerCase() === quizCategory.toLowerCase()
            ).slice(0, 5);

            const recentAverage = recentQuizzes.length > 0 
                ? recentQuizzes.reduce((sum, quiz) => sum + (quiz.results?.percentage || 0), 0) / recentQuizzes.length
                : 0;

            const categoryAverage = categoryQuizzes.length > 0
                ? categoryQuizzes.reduce((sum, quiz) => sum + (quiz.results?.percentage || 0), 0) / categoryQuizzes.length
                : 0;

            const lastQuizScore = recentQuizzes.length > 0 ? recentQuizzes[0].results?.percentage || 0 : 0;

            return {
                totalQuizzes: history.length,
                recentAverage,
                categoryAverage,
                lastQuizScore,
                currentStreak: metrics.currentStreak || 0,
                bestStreak: metrics.bestStreak || 0,
                improvementTrend: percentage > recentAverage,
                categoryImprovement: percentage > categoryAverage,
                recentQuizzes: recentQuizzes.length,
                categoryQuizzes: categoryQuizzes.length,
            };
        } catch (error) {
            logger.error('Error getting user progress:', error);
            return null;
        }
    };

    // Create personalized message based on performance and history
    const createPersonalizedMessage = async (currentPercentage, progress) => {
        const messages = [];
        const insights = [];
        const tips = [];
        let motivationLevel = 'encouraging';

        // Performance-based primary message
        if (currentPercentage >= 90) {
            messages.push("🌟 Outstanding work! You're absolutely crushing it!");
            motivationLevel = 'celebration';
        } else if (currentPercentage >= 80) {
            messages.push("🎉 Excellent job! You're really getting the hang of this!");
            motivationLevel = 'praise';
        } else if (currentPercentage >= 70) {
            messages.push("👍 Good work! You're making solid progress!");
            motivationLevel = 'encouraging';
        } else if (currentPercentage >= 60) {
            messages.push("💪 You're getting there! Keep pushing forward!");
            motivationLevel = 'motivating';
        } else {
            messages.push("🌱 Every expert was once a beginner. Don't give up!");
            motivationLevel = 'supportive';
        }

        // Add progress comparison insights if we have historical data
        if (progress && progress.recentQuizzes > 0) {
            if (progress.improvementTrend) {
                const improvement = Math.round(currentPercentage - progress.recentAverage);
                insights.push(`📈 You've improved by ${improvement}% since your recent quizzes!`);
            }

            if (progress.categoryImprovement && progress.categoryQuizzes > 1) {
                const categoryImprovement = Math.round(currentPercentage - progress.categoryAverage);
                insights.push(`🎯 Your ${quizCategory} skills are up ${categoryImprovement}% from your average!`);
            }

            // Streak-based insights
            if (progress.currentStreak >= 7) {
                insights.push(`🔥 Amazing ${progress.currentStreak}-day learning streak!`);
            } else if (progress.currentStreak >= 3) {
                insights.push(`⚡ Keep that ${progress.currentStreak}-day streak alive!`);
            }
        }

        // Performance-specific tips
        if (currentPercentage >= 80) {
            tips.push("Try challenging yourself with harder difficulty levels");
            tips.push("Explore related topics to broaden your knowledge");
        } else if (currentPercentage >= 60) {
            tips.push("Review the questions you missed");
            tips.push("Focus on understanding concepts, not just memorization");
        } else {
            tips.push("Start with the fundamentals and build up");
            tips.push("Take your time - understanding beats speed");
        }

        // Category-specific advice
        const categoryTips = getCategorySpecificTips(quizCategory, currentPercentage);
        if (categoryTips.length > 0) {
            tips.push(...categoryTips);
        }

        // Save this message to coach history
        await saveCoachMessage({
            date: new Date().toISOString(),
            score: currentPercentage,
            category: quizCategory,
            message: messages[0],
            insights,
            tips: tips.slice(0, 3),
            motivationLevel,
        });

        return {
            primaryMessage: messages[0],
            insights: insights.slice(0, 2),
            tips: tips.slice(0, 3),
            motivationLevel,
            hasProgress: progress && progress.recentQuizzes > 0,
        };
    };

    // Get category-specific tips
    const getCategorySpecificTips = (category, percentage) => {
        const categoryAdvice = {
            'Math': [
                "Practice mental math daily for speed",
                "Review formulas before each session",
                "Break complex problems into smaller steps"
            ],
            'Science': [
                "Connect concepts to real-world examples",
                "Create visual diagrams for processes",
                "Review the scientific method steps"
            ],
            'Literature': [
                "Read actively, taking notes on themes",
                "Practice identifying literary devices",
                "Discuss interpretations with others"
            ],
            'History': [
                "Create timelines to visualize events",
                "Connect causes and effects",
                "Study primary source documents"
            ],
            'Geography': [
                "Use maps while studying",
                "Learn about cultural contexts",
                "Practice with physical geography"
            ]
        };

        const tips = categoryAdvice[category] || [
            "Practice regularly for best results",
            "Review your mistakes to learn from them",
            "Stay curious and keep exploring"
        ];

        // Return different tips based on performance
        if (percentage >= 80) {
            return tips.slice(0, 1); // Just one advanced tip
        } else {
            return tips.slice(0, 2); // More guidance needed
        }
    };

    // Create basic fallback message
    const createBasicMessage = (percentage) => {
        if (percentage >= 90) {
            return {
                primaryMessage: "🌟 Outstanding work! You're absolutely crushing it!",
                insights: ["You're performing at an exceptional level!"],
                tips: ["Try exploring more advanced topics"],
                motivationLevel: 'celebration',
                hasProgress: false,
            };
        } else if (percentage >= 80) {
            return {
                primaryMessage: "🎉 Excellent job! You're really getting the hang of this!",
                insights: ["You're demonstrating strong understanding"],
                tips: ["Keep practicing to maintain this level"],
                motivationLevel: 'praise',
                hasProgress: false,
            };
        } else if (percentage >= 60) {
            return {
                primaryMessage: "👍 Good work! You're making solid progress!",
                insights: ["You're on the right track"],
                tips: ["Focus on your weak areas", "Review the material regularly"],
                motivationLevel: 'encouraging',
                hasProgress: false,
            };
        } else {
            return {
                primaryMessage: "🌱 Every expert was once a beginner. Don't give up!",
                insights: ["Learning takes time and practice"],
                tips: ["Start with basics", "Practice little and often", "Don't be hard on yourself"],
                motivationLevel: 'supportive',
                hasProgress: false,
            };
        }
    };

    // Save coach message to history
    const saveCoachMessage = async (message) => {
        try {
            const user = auth.currentUser; // ✅ Get current user
            if (!user) return; // ✅ Do nothing if no user

            const key = `coachHistory_${user.uid}`; // ✅ Use user-specific key
            const existingMessages = await AsyncStorage.getItem(key);
            const coachHistory = existingMessages ? JSON.parse(existingMessages) : [];
            
            coachHistory.unshift(message);
            
            // Keep only last 50 messages
            if (coachHistory.length > 50) {
                coachHistory.splice(50);
            }
            
            await AsyncStorage.setItem(key, JSON.stringify(coachHistory));
        } catch (error) {
            logger.error('Error saving coach message:', error);
        }
    };

    // Get motivation color based on level
    const getMotivationColor = (level) => {
        switch (level) {
            case 'celebration': return '#D4AF37';
            case 'praise': return '#28a745';
            case 'encouraging': return '#17a2b8';
            case 'motivating': return '#ffc107';
            case 'supportive': return '#6f42c1';
            default: return '#6c757d';
        }
    };

    // Handle coach card tap
    const handleCoachTap = () => {
        if (onCoachTap) {
            onCoachTap(coachMessage);
        } else {
            setShowDetails(!showDetails);
        }
    };

    if (loading) {
        return (
            <View style={[styles.coachCard, currentThemeStyles.coachCard, style]}>
                <View style={styles.loadingContainer}>
                    <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite">
                        <FontAwesome5 name="user-graduate" size={24} color={currentThemeStyles.coachIcon.color} />
                    </Animatable.View>
                    <Text style={[styles.loadingText, currentThemeStyles.loadingText]}>
                        Your coach is analyzing your performance...
                    </Text>
                </View>
            </View>
        );
    }

    if (!coachMessage) {
        return null;
    }

    return (
        <Animatable.View 
            animation="slideInUp" 
            duration={800}
            style={[styles.coachCard, currentThemeStyles.coachCard, style]}
        >
            <TouchableOpacity
                onPress={handleCoachTap}
                activeOpacity={0.8}
                style={styles.coachHeader}
            >
                <View style={[styles.coachAvatar, { backgroundColor: getMotivationColor(coachMessage.motivationLevel) }]}>
                    <FontAwesome5 name="user-graduate" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.coachInfo}>
                    <Text style={[styles.coachTitle, currentThemeStyles.coachTitle]}>
                        Your AI Learning Coach
                    </Text>
                    <Text style={[styles.coachSubtitle, currentThemeStyles.coachSubtitle]}>
                        {coachMessage.hasProgress ? 'Personalized insights ready' : 'Motivation & tips'}
                    </Text>
                </View>
                <FontAwesome5 
                    name={showDetails ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={currentThemeStyles.chevronColor.color} 
                />
            </TouchableOpacity>

            {/* Primary Message */}
            <View style={[styles.messageContainer, currentThemeStyles.messageContainer]}>
                <Text style={[styles.primaryMessage, currentThemeStyles.primaryMessage]}>
                    {coachMessage.primaryMessage}
                </Text>
            </View>

            {/* Expandable Details */}
            {showDetails && (
                <Animatable.View animation="fadeInDown" duration={300}>
                    {/* Insights */}
                    {coachMessage.insights && coachMessage.insights.length > 0 && (
                        <View style={[styles.section, currentThemeStyles.section]}>
                            <Text style={[styles.sectionTitle, currentThemeStyles.sectionTitle]}>
                                📊 Your Progress
                            </Text>
                            {coachMessage.insights.map((insight, index) => (
                                <View key={index} style={styles.insightItem}>
                                    <FontAwesome5 name="chart-line" size={12} color={getMotivationColor(coachMessage.motivationLevel)} />
                                    <Text style={[styles.insightText, currentThemeStyles.insightText]}>
                                        {insight}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Tips */}
                    {coachMessage.tips && coachMessage.tips.length > 0 && (
                        <View style={[styles.section, currentThemeStyles.section]}>
                            <Text style={[styles.sectionTitle, currentThemeStyles.sectionTitle]}>
                                💡 Study Tips
                            </Text>
                            {coachMessage.tips.map((tip, index) => (
                                <View key={index} style={styles.tipItem}>
                                    <View style={[styles.tipBullet, { backgroundColor: getMotivationColor(coachMessage.motivationLevel) }]}>
                                        <Text style={styles.tipBulletText}>{index + 1}</Text>
                                    </View>
                                    <Text style={[styles.tipText, currentThemeStyles.tipText]}>
                                        {tip}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: getMotivationColor(coachMessage.motivationLevel) }]}
                        onPress={() => {
                            // Could navigate to study recommendations, etc.
                            logger.info('Coach action button pressed');
                        }}
                    >
                        <FontAwesome5 name="rocket" size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Keep Learning</Text>
                    </TouchableOpacity>
                </Animatable.View>
            )}
        </Animatable.View>
    );
};

// Base Styles
const styles = StyleSheet.create({
    coachCard: {
        borderRadius: 16,
        padding: 20,
        marginVertical: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        fontSize: 16,
        marginLeft: 12,
        fontStyle: 'italic',
    },
    coachHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    coachAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    coachInfo: {
        flex: 1,
    },
    coachTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
    },
    coachSubtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
    messageContainer: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#D4AF37',
    },
    primaryMessage: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    section: {
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    insightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingLeft: 4,
    },
    insightText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    tipBullet: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    tipBulletText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    tipText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 8,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

// Light Theme Styles
const lightCoachStyles = StyleSheet.create({
    coachCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        shadowColor: '#1A2C5B',
    },
    coachTitle: {
        color: '#1A2C5B',
    },
    coachSubtitle: {
        color: '#4A5568',
    },
    chevronColor: {
        color: '#D4AF37',
    },
    loadingText: {
        color: '#4A5568',
    },
    coachIcon: {
        color: '#D4AF37',
    },
    messageContainer: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    primaryMessage: {
        color: '#1A2C5B',
    },
    section: {
        backgroundColor: 'rgba(248, 244, 227, 0.5)',
    },
    sectionTitle: {
        color: '#1A2C5B',
    },
    insightText: {
        color: '#4A5568',
    },
    tipText: {
        color: '#4A5568',
    },
});

// Dark Theme Styles
const darkCoachStyles = StyleSheet.create({
    coachCard: {
        backgroundColor: '#2D3748',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        shadowColor: '#D4AF37',
    },
    coachTitle: {
        color: '#F8F4E3',
    },
    coachSubtitle: {
        color: '#CBD5E0',
    },
    chevronColor: {
        color: '#D4AF37',
    },
    loadingText: {
        color: '#CBD5E0',
    },
    coachIcon: {
        color: '#D4AF37',
    },
    messageContainer: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
    },
    primaryMessage: {
        color: '#F8F4E3',
    },
    section: {
        backgroundColor: 'rgba(44, 70, 125, 0.3)',
    },
    sectionTitle: {
        color: '#F8F4E3',
    },
    insightText: {
        color: '#CBD5E0',
    },
    tipText: {
        color: '#CBD5E0',
    },
});

export default CoachMessage;