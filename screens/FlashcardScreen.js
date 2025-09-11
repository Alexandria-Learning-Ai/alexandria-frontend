import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ScrollView,
    Alert,
    Modal,
    PanResponder
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FlashcardService } from '../services/FlashcardService';
import { auth } from '../firebaseConfig';
import SafeBackButton from '../components/SafeBackButton';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper function to safely decode and display text
const safeDisplayText = (text) => {
    if (!text) return 'No content available';
    
    if (typeof text === 'object') {
        return text.text || text.content || text.value || text.label || JSON.stringify(text);
    }
    
    if (typeof text !== 'string') {
        return String(text);
    }
    
    try {
        // Handle HTML entities and special characters
        return text
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\\n/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();
    } catch (error) {
        logger.warn('Error formatting text:', error);
        return text;
    }
};

// Helper function to safely extract option text
const getOptionText = (option) => {
    if (typeof option === 'string') return option;
    if (typeof option === 'object') {
        return option.text || option.content || option.value || option.answer || option.label || '[Invalid Option]';
    }
    return String(option);
};

// Motivational feedback based on answer correctness
const getMotivationalFeedback = (isCorrect, subject) => {
    if (isCorrect) {
        return `👍 You're improving in ${subject || 'this topic'} — keep practicing!`;
    } else {
        return `💡 Review the basics of ${subject || 'this topic'} and try again`;
    }
};

const FlashcardScreen = ({ navigation, route }) => {
    // State
    const [flashcards, setFlashcards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        studied: 0,
        correct: 0,
        startTime: Date.now()
    });
    const [showingAnswer, setShowingAnswer] = useState(false);
    const [studyMode, setStudyMode] = useState('review'); // 'review', 'learn', 'cram'
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Animation values
    const flipAnimation = useRef(new Animated.Value(0)).current;
    const slideAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(1)).current;

    // Load flashcards on mount
    useEffect(() => {
        loadFlashcards();
    }, []);

    const loadFlashcards = async () => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                Alert.alert('Error', 'Please log in to access flashcards');
                return;
            }

            const mode = route.params?.mode || 'review';
            const filters = route.params?.filters || {};
            
            let cards = await FlashcardService.getFlashcardsByMode(userId, mode, filters);

            if (cards.length === 0) {
                Alert.alert(
                    'No Flashcards',
                    'No flashcards available. Complete some quizzes to automatically generate flashcards from your mistakes!',
                    [{ text: 'OK', onPress: () => NavigationHelper.safeGoBack(navigation) }]
                );
                return;
            }

            setFlashcards(cards);
            logger.info(`📚 Loaded ${cards.length} flashcards for study`);
        } catch (error) {
            logger.error('❌ Error loading flashcards:', error);
            Alert.alert('Error', 'Failed to load flashcards. Please try again.');
        }
    };

    // Card flip animation
    const flipCard = () => {
        Animated.timing(flipAnimation, {
            toValue: isFlipped ? 0 : 1,
            duration: 600,
            useNativeDriver: true
        }).start();
        setIsFlipped(!isFlipped);
        setShowingAnswer(!showingAnswer);
    };

    // Handle answer quality (spaced repetition)
    const handleAnswerQuality = async (quality) => {
        try {
            const currentCard = flashcards[currentCardIndex];
            const userId = auth.currentUser?.uid;

            // Record the review
            await FlashcardService.recordFlashcardReview(userId, currentCard.id, quality);

            // Update session stats
            setSessionStats(prev => ({
                ...prev,
                studied: prev.studied + 1,
                correct: quality >= 3 ? prev.correct + 1 : prev.correct
            }));

            // Move to next card
            nextCard();
        } catch (error) {
            logger.error('❌ Error recording answer quality:', error);
            Alert.alert('Error', 'Failed to record your response. Please try again.');
        }
    };

    // Move to next card
    const nextCard = () => {
        if (currentCardIndex < flashcards.length - 1) {
            // Slide out current card
            Animated.timing(slideAnimation, {
                toValue: -screenWidth,
                duration: 300,
                useNativeDriver: true
            }).start(() => {
                // Reset animations and move to next card
                setCurrentCardIndex(currentCardIndex + 1);
                setIsFlipped(false);
                setShowingAnswer(false);
                flipAnimation.setValue(0);
                slideAnimation.setValue(screenWidth);
                
                // Slide in new card
                Animated.timing(slideAnimation, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }).start();
            });
        } else {
            // End of session
            completeSession();
        }
    };

    // Complete study session
    const completeSession = async () => {
        const sessionTime = Math.round((Date.now() - sessionStats.startTime) / 1000);
        const accuracy = sessionStats.studied > 0 ? Math.round((sessionStats.correct / sessionStats.studied) * 100) : 0;

        try {
            // Record session
            await FlashcardService.recordStudySession(auth.currentUser?.uid, {
                cardsStudied: sessionStats.studied,
                timeSpent: sessionTime
            });

            Alert.alert(
                'Session Complete! 🎉',
                `Great work! You studied ${sessionStats.studied} cards with ${accuracy}% accuracy in ${Math.round(sessionTime / 60)} minutes.`,
                [
                    { text: 'Study More', onPress: () => loadFlashcards() },
                    { text: 'Finish', onPress: () => NavigationHelper.safeGoBack(navigation) }
                ]
            );
        } catch (error) {
            logger.error('❌ Error completing session:', error);
            NavigationHelper.safeGoBack(navigation);
        }
    };

    // Render clean answer content
    const renderAnswerContent = (card, themeColors) => {
        const answerData = typeof card.back === 'object' ? card.back : {
            correctAnswer: 'View answer',
            explanation: typeof card.back === 'string' ? card.back : 'Study this concept carefully.'
        };

        return (
            <View style={styles.flashcardAnswerLayout}>
                {/* Correct Answer - Clean and prominent */}
                <View style={styles.correctAnswerSection}>
                    <Text style={[styles.correctAnswerText, { color: themeColors.success }]}>
                        ✅ {safeDisplayText(answerData.correctAnswer)}
                    </Text>
                </View>

                {/* Explanation - Simple and focused */}
                {answerData.explanation && (
                    <View style={styles.explanationSection}>
                        <Text style={[styles.explanationLabel, { color: themeColors.text, opacity: 0.8 }]}>
                            💡 Explanation:
                        </Text>
                        <Text style={[styles.explanationText, { color: themeColors.text }]}>
                            {safeDisplayText(answerData.explanation)}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // Get current card
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return null;

    // Theme styles
    const themeColors = isDarkMode ? {
        background: '#1A2C5B',
        cardBackground: '#2A3F73',
        text: '#F8F4E3',
        accent: '#D4AF37', // Alexandria Gold (Review)
        success: '#014421', // Forest Green (Study)
        warning: '#CD7F32', // Alexandria Bronze (Auto Gen)
        error: '#800020'   // Maroon Red (Struggling)
    } : {
        background: '#F8F4E3',
        cardBackground: '#FFFFFF',
        text: '#1A2C5B',
        accent: '#1A2C5B',
        success: '#014421', // Forest Green (Study)
        warning: '#CD7F32', // Alexandria Bronze (Auto Gen)
        error: '#800020'   // Maroon Red (Struggling)
    };

    // Card front/back interpolation
    const frontInterpolate = flipAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });
    const backInterpolate = flipAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    return (
        <LinearGradient
            colors={isDarkMode ? ['#1A2C5B', '#2A3F73'] : ['#F8F4E3', '#E8E0C8']}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <SafeBackButton 
                    color={themeColors.text}
                    size={20}
                    fallbackScreen="Home"
                    style={styles.backButton}
                />
                
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                    Flashcards ({currentCardIndex + 1}/{flashcards.length})
                </Text>
                
                <View style={styles.statsContainer}>
                    <Text style={[styles.statsText, { color: themeColors.accent }]}>
                        {sessionStats.correct}/{sessionStats.studied}
                    </Text>
                </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: themeColors.cardBackground }]}>
                    <Animated.View 
                        style={[
                            styles.progressFill,
                            { 
                                backgroundColor: themeColors.accent,
                                width: `${((currentCardIndex + 1) / flashcards.length) * 100}%`
                            }
                        ]} 
                    />
                </View>
            </View>

            {/* Flashcard */}
            <View style={styles.cardContainer}>
                <Animated.View 
                    style={[
                        styles.cardWrapper,
                        { transform: [{ translateX: slideAnimation }] }
                    ]}
                >
                    {/* Card Front */}
                    <Animated.View
                        style={[
                            styles.card,
                            { backgroundColor: themeColors.cardBackground },
                            { transform: [{ rotateY: frontInterpolate }] },
                            !showingAnswer && styles.cardVisible
                        ]}
                    >
                        <View style={styles.cardContent}>
                            {/* Simple subject indicator */}
                            <View style={styles.subjectIndicator}>
                                <Text style={[styles.subjectLabel, { color: themeColors.accent }]}>
                                    {currentCard.subject} • {currentCard.difficulty}
                                </Text>
                            </View>

                            {/* Main question - clean and prominent */}
                            <View style={styles.questionContainer}>
                                <Text style={[styles.cardQuestion, { color: themeColors.text }]}>
                                    {safeDisplayText(currentCard.front)}
                                </Text>
                            </View>

                            {/* Think prompt */}
                            <View style={styles.thinkPrompt}>
                                <Text style={[styles.thinkText, { color: themeColors.text, opacity: 0.7 }]}>
                                    💭 Think about your answer...
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.showAnswerButton, { backgroundColor: themeColors.accent }]}
                            onPress={flipCard}
                        >
                            <Text style={[styles.showAnswerText, { color: isDarkMode ? '#1A2C5B' : '#F8F4E3' }]}>
                                Show Answer
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Card Back - Clean Design */}
                    <Animated.View
                        style={[
                            styles.card,
                            styles.cardBack,
                            { backgroundColor: themeColors.cardBackground },
                            { transform: [{ rotateY: backInterpolate }] },
                            showingAnswer && styles.cardVisible
                        ]}
                    >
                        <View style={styles.cardContent}>
                            {/* Clean Answer Display */}
                            <View style={styles.answerSection}>
                                {renderAnswerContent(currentCard, themeColors)}
                            </View>

                            {/* Self-Assessment Footer - Fixed positioning */}
                            <View style={[styles.selfAssessmentFooter, { 
                                borderTopWidth: 1, 
                                borderTopColor: 'rgba(212, 175, 55, 0.3)',
                                marginTop: 20,
                                paddingTop: 16
                            }]}>
                                <Text style={[styles.assessmentPrompt, { color: themeColors.text, marginBottom: 12 }]}>
                                    👉 How well did you know this topic?
                                </Text>
                                <View style={styles.assessmentButtons}>
                                    <TouchableOpacity 
                                        style={[styles.assessmentButton, { backgroundColor: '#800020' }]}
                                        onPress={() => handleAnswerQuality(1)}
                                    >
                                        <Text style={styles.assessmentEmoji}>😰</Text>
                                        <Text style={[styles.assessmentText, { color: '#FFFFFF' }]}>Hard</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={[styles.assessmentButton, { backgroundColor: '#D4AF37' }]}
                                        onPress={() => handleAnswerQuality(3)}
                                    >
                                        <Text style={styles.assessmentEmoji}>😐</Text>
                                        <Text style={[styles.assessmentText, { color: '#FFFFFF' }]}>Good</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={[styles.assessmentButton, { backgroundColor: '#014421' }]}
                                        onPress={() => handleAnswerQuality(5)}
                                    >
                                        <Text style={styles.assessmentEmoji}>✅</Text>
                                        <Text style={[styles.assessmentText, { color: '#FFFFFF' }]}>Easy</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </Animated.View>

            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 20,
    },
    statsContainer: {
        alignItems: 'center',
    },
    statsText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    cardContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    cardWrapper: {
        flex: 1,
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '70%',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        backfaceVisibility: 'hidden',
    },
    cardVisible: {
        zIndex: 1,
    },
    cardBack: {
        zIndex: 0,
    },
    cardContent: {
        flex: 1,
        padding: 25,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    subjectTag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    subjectText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    difficultyTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    cardQuestion: {
        fontSize: 20,
        fontWeight: '500',
        lineHeight: 28,
        textAlign: 'center',
        flex: 1,
    },
    answerLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    cardAnswer: {
        fontSize: 18,
        lineHeight: 26,
        flex: 1,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 15,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 4,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    answerSection: {
        flex: 1,
        justifyContent: 'center',
    },
    cleanAnswerLayout: {
        paddingVertical: 20,
    },
    answerRow: {
        marginBottom: 15,
    },
    answerLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 5,
    },
    answerValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    correctAnswer: {
        color: '#28a745',
    },
    wrongAnswer: {
        color: '#dc3545',
    },
    optionsSection: {
        marginTop: 20,
        marginBottom: 15,
    },
    optionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '600',
        width: 25,
    },
    optionText: {
        fontSize: 14,
        flex: 1,
    },
    correctOption: {
        fontWeight: '600',
    },
    wrongOption: {
        fontWeight: '600',
    },
    explanationSection: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#D4AF37',
    },
    explanation: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    selfAssessmentFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.2)',
        paddingTop: 20,
        alignItems: 'center',
    },
    assessmentPrompt: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
    },
    assessmentButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    assessmentButton: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(128, 128, 128, 0.2)',
        minWidth: 80,
    },
    assessmentHard: {
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderColor: 'rgba(220, 53, 69, 0.3)',
    },
    assessmentGood: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    assessmentEasy: {
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderColor: 'rgba(40, 167, 69, 0.3)',
    },
    assessmentEmoji: {
        fontSize: 20,
        marginBottom: 5,
    },
    assessmentText: {
        fontSize: 14,
        fontWeight: '700',
    },
    flipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        margin: 20,
        borderRadius: 10,
    },
    flipButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    // Enhanced styles for improved layout
    explanationLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    motivationalSection: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: -8,
    },
    motivationalText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        overflow: 'hidden',
    },

    // New flashcard-specific styles
    subjectIndicator: {
        alignItems: 'center',
        marginBottom: 20,
    },
    subjectLabel: {
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.8,
    },
    questionContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    thinkPrompt: {
        alignItems: 'center',
        marginTop: 20,
    },
    thinkText: {
        fontSize: 16,
        fontStyle: 'italic',
    },
    showAnswerButton: {
        backgroundColor: '#D4AF37',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    showAnswerText: {
        fontSize: 18,
        fontWeight: '600',
    },
    flashcardAnswerLayout: {
        flex: 1,
        padding: 20,
    },
    correctAnswerSection: {
        alignItems: 'center',
        marginBottom: 30,
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(1, 68, 33, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(1, 68, 33, 0.3)',
    },
    correctAnswerText: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 32,
    },
    explanationText: {
        fontSize: 16,
        lineHeight: 24,
        marginTop: 8,
    },
});

export default FlashcardScreen;