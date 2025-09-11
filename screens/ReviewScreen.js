import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import SafeBackButton from '../components/SafeBackButton';
import logger from '../utils/logger';


const { width: screenWidth } = Dimensions.get('window');

const ReviewScreen = ({ route, navigation }) => {
    const { quiz, metadata } = route.params;
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // States for explanations
    const [showExplanations, setShowExplanations] = useState(false);
    const [explanations, setExplanations] = useState({});
    const [loadingExplanations, setLoadingExplanations] = useState(false);
    
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(1)).current;
    
    // Process quiz data for display
    const questions = quiz.questions || [];
    const userAnswers = quiz.userAnswers || {};
    const results = quiz.results || {};
    
    // Calculate metrics
    const totalQuestions = questions.length;
    const score = results.score || 0;
    const percentage = results.percentage || 0;
    const correctCount = results.correctCount || 0;
    const incorrectCount = results.incorrectCount || 0;
    
    // Get incorrect questions for explanations
    const incorrectQuestions = questions.filter(q => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = userAnswer === q.correctAnswer;
        return !isCorrect;
    });
    
    // Determine performance level
    const getPerformanceLevel = () => {
        if (percentage >= 90) return { level: 'Excellent', icon: 'trophy', color: '#D4AF37' };
        if (percentage >= 80) return { level: 'Great', icon: 'star', color: '#28a745' };
        if (percentage >= 70) return { level: 'Good', icon: 'thumbs-up', color: '#17a2b8' };
        if (percentage >= 60) return { level: 'Fair', icon: 'check-circle', color: '#ffc107' };
        return { level: 'Keep Learning', icon: 'book-open', color: '#dc3545' };
    };
    
    const performance = getPerformanceLevel();
    
    // Get question icon based on type
    const getQuestionIcon = (type) => {
        switch (type) {
            case 'multiple_choice': return 'list-ul';
            case 'true_false': return 'check-circle';
            case 'open_ended': return 'edit';
            case 'math': return 'calculator';
            default: return 'question';
        }
    };

    // Generate explanations for incorrect answers
    const generateExplanations = async () => {
        if (incorrectQuestions.length === 0) {
            Alert.alert("Perfect Score!", "All answers were correct! No explanations needed. 🎉");
            return;
        }

        setLoadingExplanations(true);
        
        try {
            const explanationPromises = incorrectQuestions.map(async (question) => {
                const userAnswer = userAnswers[question.id];
                
                const prompt = `Explain why the correct answer to this question is "${question.correctAnswer}" and why "${userAnswer || 'no answer'}" is incorrect.

Question: ${question.questionText}
${question.type === 'multiple_choice' && question.options ? 
    `Options: ${question.options.map(opt => `${opt.label}) ${opt.text}`).join(', ')}` : ''}
Correct Answer: ${question.correctAnswer}
User's Answer: ${userAnswer || 'No answer provided'}
${question.formula ? `Formula: ${question.formula}` : ''}
${question.solution_steps?.length > 0 ? `Solution Steps: ${question.solution_steps.join(', ')}` : ''}

Provide a clear, educational explanation in 2-3 sentences.`;

                try {
                    const response = await axios.post(`${API_BASE_URL}/generate-explanation`, {
                        prompt: prompt
                    }, {
                        timeout: 30000,
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    return {
                        questionId: question.id,
                        explanation: response.data.explanation || "Explanation not available."
                    };
                } catch (error) {
                    logger.error('Error generating explanation:', error);
                    return {
                        questionId: question.id,
                        explanation: `The correct answer is "${question.correctAnswer}". ${
                            question.type === 'math' && question.solution_steps?.length > 0 ? 
                            `Solution: ${question.solution_steps.join(' → ')}` : 
                            'Review the material to understand why this is the correct choice.'
                        }`
                    };
                }
            });

            const explanationResults = await Promise.all(explanationPromises);
            const explanationsMap = {};
            explanationResults.forEach(result => {
                explanationsMap[result.questionId] = result.explanation;
            });

            setExplanations(explanationsMap);
            setShowExplanations(true);
            
        } catch (error) {
            logger.error('Error generating explanations:', error);
            Alert.alert("Error", "Failed to generate explanations. Please try again.");
        } finally {
            setLoadingExplanations(false);
        }
    };

    const currentThemeStyles = isDarkMode ? darkStyles : lightStyles;
    const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

    const Header = () => (
        <Animatable.View animation="fadeInDown" duration={800} style={styles.headerContainer}>
            {/* Back Button */}
            <SafeBackButton 
                style={[styles.backButton, currentThemeStyles.backButton]}
                color={currentThemeStyles.backButtonText.color}
                size={20}
            />
            
            {/* Title Section */}
            <Animatable.View animation="fadeIn" delay={300} style={styles.titleSection}>
                <View style={[styles.titleIcon, currentThemeStyles.titleIcon]}>
                    <FontAwesome5 name="eye" size={32} color={currentThemeStyles.titleIconColor.color} />
                </View>
                <Text style={[styles.title, currentThemeStyles.title]}>Quiz Review</Text>
                <Text style={[styles.subtitle, currentThemeStyles.subtitle]}>
                    Review your answers and learn from mistakes
                </Text>
            </Animatable.View>
        </Animatable.View>
    );

    const ScoreCard = () => (
        <Animatable.View animation="bounceIn" delay={600} style={[styles.scoreCard, currentThemeStyles.scoreCard]}>
            {/* Performance Badge */}
            <View style={[styles.performanceBadge, { backgroundColor: performance.color }]}>
                <FontAwesome5 name={performance.icon} size={20} color="#FFFFFF" />
                <Text style={styles.performanceText}>{performance.level}</Text>
            </View>
            
            {/* Score Display */}
            <View style={styles.scoreDisplay}>
                <Text style={[styles.scoreNumber, currentThemeStyles.scoreNumber, { color: performance.color }]}>
                    {percentage}%
                </Text>
                <Text style={[styles.scoreLabel, currentThemeStyles.scoreLabel]}>
                    {score} out of {totalQuestions} correct
                </Text>
            </View>
            
            {/* Original Date */}
            <Text style={[styles.originalDate, currentThemeStyles.originalDate]}>
                Originally completed: {new Date(metadata.originalDate).toLocaleDateString()}
            </Text>
            
            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={[styles.statItem, currentThemeStyles.statItem]}>
                    <FontAwesome5 name="check-circle" size={20} color="#28a745" />
                    <Text style={[styles.statNumber, { color: '#28a745' }]}>{correctCount}</Text>
                    <Text style={[styles.statLabel, currentThemeStyles.statLabel]}>Correct</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={[styles.statItem, currentThemeStyles.statItem]}>
                    <FontAwesome5 name="times-circle" size={20} color="#dc3545" />
                    <Text style={[styles.statNumber, { color: '#dc3545' }]}>{incorrectCount}</Text>
                    <Text style={[styles.statLabel, currentThemeStyles.statLabel]}>Incorrect</Text>
                </View>
            </View>
        </Animatable.View>
    );

    const renderQuestion = (question, index) => {
        const userAnswer = userAnswers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        const hasExplanation = showExplanations && explanations[question.id] && !isCorrect;

        return (
            <Animatable.View 
                key={question.id} 
                animation="slideInUp" 
                delay={800 + (index * 100)}
                style={[
                    styles.questionCard,
                    currentThemeStyles.questionCard,
                    isCorrect ? currentThemeStyles.correctCard : currentThemeStyles.incorrectCard
                ]}
            >
                {/* Question Header */}
                <View style={styles.questionHeader}>
                    <View style={[styles.questionTypeIcon, currentThemeStyles.questionTypeIcon]}>
                        <FontAwesome5 
                            name={getQuestionIcon(question.type)} 
                            size={18} 
                            color={currentThemeStyles.questionTypeIconColor.color} 
                        />
                    </View>
                    <Text style={[styles.questionNumber, currentThemeStyles.questionNumber]}>
                        Question {question.questionNumber || index + 1}
                    </Text>
                    
                    {/* Result Indicator */}
                    <View style={[
                        styles.resultIndicator,
                        isCorrect ? styles.correctIndicator : styles.incorrectIndicator
                    ]}>
                        <FontAwesome5 
                            name={isCorrect ? "check" : "times"} 
                            size={16} 
                            color="#FFFFFF" 
                        />
                    </View>
                </View>

                {/* Question Text */}
                <Text style={[styles.questionText, currentThemeStyles.questionText]}>
                    {question.questionText}
                </Text>

                {/* Multiple Choice Options */}
                {question.type === 'multiple_choice' && question.options && (
                    <View style={styles.optionsContainer}>
                        {question.options.map((option, optIndex) => {
                            const isUserSelected = userAnswer === option.label;
                            const isCorrectOption = option.label === question.correctAnswer;
                            
                            let optionStyle = [styles.optionButton, currentThemeStyles.optionButton];
                            if (isCorrectOption) {
                                optionStyle.push(currentThemeStyles.correctOption);
                            } else if (isUserSelected && !isCorrectOption) {
                                optionStyle.push(currentThemeStyles.incorrectOption);
                            }

                            return (
                                <View key={option.id || optIndex} style={optionStyle}>
                                    <View style={styles.optionContent}>
                                        <View style={[
                                            styles.optionLetter,
                                            isCorrectOption ? currentThemeStyles.correctOptionLetter :
                                            isUserSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionLetter :
                                            currentThemeStyles.optionLetter
                                        ]}>
                                            <Text style={[
                                                styles.optionLetterText,
                                                isCorrectOption ? currentThemeStyles.correctOptionLetterText :
                                                isUserSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionLetterText :
                                                currentThemeStyles.optionLetterText
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            isCorrectOption ? currentThemeStyles.correctOptionText :
                                            isUserSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionText :
                                            currentThemeStyles.optionText
                                        ]}>
                                            {option.text}
                                        </Text>
                                        
                                        {/* Selection Indicators */}
                                        {isUserSelected && (
                                            <View style={[styles.selectionIndicator, styles.userSelection]}>
                                                <FontAwesome5 name="user" size={12} color="#FFFFFF" />
                                            </View>
                                        )}
                                        {isCorrectOption && (
                                            <View style={[styles.selectionIndicator, styles.correctSelection]}>
                                                <FontAwesome5 name="check" size={12} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* True/False Options */}
                {question.type === 'true_false' && question.options && (
                    <View style={styles.trueFalseContainer}>
                        {question.options.map((option, optIndex) => {
                            const isUserSelected = userAnswer === option.value;
                            const isCorrectOption = option.value === question.correctAnswer;
                            
                            let optionStyle = [styles.trueFalseButton, currentThemeStyles.optionButton];
                            if (isCorrectOption) {
                                optionStyle.push(currentThemeStyles.correctOption);
                            } else if (isUserSelected && !isCorrectOption) {
                                optionStyle.push(currentThemeStyles.incorrectOption);
                            }

                            return (
                                <View key={option.id || optIndex} style={styles.trueFalseButtonContainer}>
                                    <View style={optionStyle}>
                                        <FontAwesome5 
                                            name={option.value === true || option.value === 'true' ? 'check' : 'times'} 
                                            size={24} 
                                            color={
                                                isCorrectOption ? currentThemeStyles.correctOptionText.color :
                                                isUserSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionText.color :
                                                currentThemeStyles.optionText.color
                                            }
                                        />
                                        <Text style={[
                                            styles.trueFalseText,
                                            isCorrectOption ? currentThemeStyles.correctOptionText :
                                            isUserSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionText :
                                            currentThemeStyles.optionText
                                        ]}>
                                            {option.text}
                                        </Text>
                                        
                                        {/* Selection Indicators */}
                                        {isUserSelected && (
                                            <View style={[styles.selectionIndicator, styles.userSelection]}>
                                                <FontAwesome5 name="user" size={12} color="#FFFFFF" />
                                            </View>
                                        )}
                                        {isCorrectOption && (
                                            <View style={[styles.selectionIndicator, styles.correctSelection]}>
                                                <FontAwesome5 name="check" size={12} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Open Ended and Math Questions */}
                {(question.type === 'open_ended' || question.type === 'math') && (
                    <View style={styles.textAnswerContainer}>
                        <View style={[styles.textAnswerBox, currentThemeStyles.textAnswerBox]}>
                            <Text style={[styles.answerLabel, currentThemeStyles.answerLabel]}>Your Answer:</Text>
                            <Text style={[
                                styles.userAnswerText,
                                isCorrect ? styles.correctAnswerText : styles.incorrectAnswerText
                            ]}>
                                {userAnswer || 'No answer provided'}
                            </Text>
                        </View>
                        
                        {!isCorrect && (
                            <View style={[styles.textAnswerBox, currentThemeStyles.correctAnswerBox]}>
                                <Text style={[styles.answerLabel, currentThemeStyles.answerLabel]}>Correct Answer:</Text>
                                <Text style={[styles.correctAnswerDisplay, currentThemeStyles.correctAnswerDisplay]}>
                                    {question.correctAnswer}
                                </Text>
                            </View>
                        )}

                        {/* Show formula hint for math questions */}
                        {question.type === 'math' && question.formula && (
                            <View style={[styles.formulaContainer, currentThemeStyles.formulaContainer]}>
                                <Text style={[styles.formulaLabel, currentThemeStyles.formulaLabel]}>Formula:</Text>
                                <Text style={[styles.formulaText, currentThemeStyles.formulaText]}>
                                    {question.formula}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Show explanation if available */}
                {hasExplanation && (
                    <View style={[styles.explanationContainer, currentThemeStyles.explanationContainer]}>
                        <View style={styles.explanationHeader}>
                            <FontAwesome5 
                                name="lightbulb" 
                                size={16} 
                                color={currentThemeStyles.explanationIcon.color} 
                            />
                            <Text style={[styles.explanationTitle, currentThemeStyles.explanationTitle]}>
                                Explanation
                            </Text>
                        </View>
                        <Text style={[styles.explanationText, currentThemeStyles.explanationText]}>
                            {explanations[question.id]}
                        </Text>
                    </View>
                )}

                {/* Show solution steps for math questions */}
                {question.type === 'math' && question.solution_steps && question.solution_steps.length > 0 && (
                    <View style={[styles.solutionContainer, currentThemeStyles.solutionContainer]}>
                        <Text style={[styles.solutionTitle, currentThemeStyles.solutionTitle]}>
                            Solution Steps:
                        </Text>
                        {question.solution_steps.map((step, stepIndex) => (
                            <Text key={stepIndex} style={[styles.solutionStep, currentThemeStyles.solutionStep]}>
                                {stepIndex + 1}. {step}
                            </Text>
                        ))}
                    </View>
                )}
            </Animatable.View>
        );
    };

    const ActionButtons = () => (
        <Animatable.View animation="fadeInUp" delay={1200} style={styles.actionContainer}>
            {/* Explanations Button */}
            <TouchableOpacity
                style={[styles.explanationButton, currentThemeStyles.explanationButton]}
                onPress={() => showExplanations ? setShowExplanations(false) : generateExplanations()}
                disabled={loadingExplanations}
                activeOpacity={0.8}
            >
                {loadingExplanations ? (
                    <ActivityIndicator size="small" color={currentThemeStyles.explanationButtonText.color} />
                ) : (
                    <FontAwesome5 
                        name={showExplanations ? "eye-slash" : "lightbulb"} 
                        size={18} 
                        color={currentThemeStyles.explanationButtonText.color} 
                    />
                )}
                <Text style={[styles.buttonText, currentThemeStyles.explanationButtonText]}>
                    {loadingExplanations ? 'Loading...' : 
                     showExplanations ? 'Hide Explanations' : 'Show Explanations'}
                </Text>
            </TouchableOpacity>

            {/* Navigation Buttons */}
            <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, currentThemeStyles.primaryButton]}
                onPress={() => navigation.navigate('QuizHistory')}
                activeOpacity={0.8}
            >
                <FontAwesome5 name="history" size={20} color={currentThemeStyles.primaryButtonText.color} />
                <Text style={[styles.buttonText, currentThemeStyles.primaryButtonText]}>
                    Back to History
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, currentThemeStyles.secondaryButton]}
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.8}
            >
                <FontAwesome5 name="home" size={20} color={currentThemeStyles.secondaryButtonText.color} />
                <Text style={[styles.buttonText, currentThemeStyles.secondaryButtonText]}>
                    Back to Home
                </Text>
            </TouchableOpacity>
        </Animatable.View>
    );

    return (
        <View style={[styles.container, currentThemeStyles.container]}>
            <StatusBar barStyle={statusBarStyle} />
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <Header />
                <ScoreCard />
                
                {/* Questions Section */}
                <View style={styles.questionsSection}>
                    <Text style={[styles.sectionTitle, currentThemeStyles.sectionTitle]}>
                        Question Review
                    </Text>
                    
                    {questions.map((question, index) => renderQuestion(question, index))}
                </View>
                
                <ActionButtons />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 30,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    titleIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    scoreCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 30,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    performanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
        gap: 8,
    },
    performanceText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    scoreDisplay: {
        alignItems: 'center',
        marginBottom: 12,
    },
    scoreNumber: {
        fontSize: 48,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: -1,
    },
    scoreLabel: {
        fontSize: 16,
        opacity: 0.8,
        marginBottom: 8,
    },
    originalDate: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 14,
        opacity: 0.7,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 20,
    },
    questionsSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    questionCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 2,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        justifyContent: 'space-between',
    },
    questionTypeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    resultIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    correctIndicator: {
        backgroundColor: '#28a745',
    },
    incorrectIndicator: {
        backgroundColor: '#dc3545',
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 12,
        marginBottom: 16,
    },
    optionButton: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        position: 'relative',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    optionLetter: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionLetterText: {
        fontSize: 16,
        fontWeight: '700',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    selectionIndicator: {
        position: 'absolute',
        right: 12,
        top: '50%',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: -12 }],
    },
    userSelection: {
        backgroundColor: '#6c757d',
    },
    correctSelection: {
        backgroundColor: '#28a745',
    },
    trueFalseContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    trueFalseButtonContainer: {
        flex: 1,
    },
    trueFalseButton: {
        alignItems: 'center',
        paddingVertical: 24,
        borderRadius: 16,
        borderWidth: 2,
        gap: 12,
        position: 'relative',
    },
    trueFalseText: {
        fontSize: 16,
        fontWeight: '600',
    },
    textAnswerContainer: {
        gap: 12,
        marginBottom: 16,
    },
    textAnswerBox: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    answerLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.8,
    },
    userAnswerText: {
        fontSize: 16,
        fontWeight: '600',
    },
    correctAnswerText: {
        color: '#28a745',
    },
    incorrectAnswerText: {
        color: '#dc3545',
    },
    correctAnswerDisplay: {
        fontSize: 16,
        fontWeight: '600',
    },
    formulaContainer: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    formulaLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    formulaText: {
        fontSize: 16,
        fontFamily: 'monospace',
    },
    explanationContainer: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    explanationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    explanationTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    explanationText: {
        fontSize: 14,
        lineHeight: 20,
    },
    solutionContainer: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    solutionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    solutionStep: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    actionContainer: {
        gap: 12,
        marginTop: 20,
    },
    explanationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 12,
        marginBottom: 12,
        borderWidth: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 12,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

// Light Mode Styles
const lightStyles = StyleSheet.create({
    container: {
        backgroundColor: '#F8F4E3',
    },
    backButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#1A2C5B',
    },
    backButtonText: {
        color: '#1A2C5B',
    },
    titleIcon: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
        shadowColor: '#1A2C5B',
    },
    titleIconColor: {
        color: '#1A2C5B',
    },
    title: {
        color: '#1A2C5B',
    },
    subtitle: {
        color: '#4A5568',
    },
    scoreCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        shadowColor: '#1A2C5B',
    },
    scoreNumber: {
        color: '#1A2C5B',
    },
    scoreLabel: {
        color: '#4A5568',
    },
    originalDate: {
        color: '#4A5568',
    },
    statItem: {
        backgroundColor: 'transparent',
    },
    statLabel: {
        color: '#4A5568',
    },
    sectionTitle: {
        color: '#1A2C5B',
    },
    questionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        shadowColor: '#1A2C5B',
    },
    correctCard: {
        borderColor: '#28a745',
    },
    incorrectCard: {
        borderColor: '#dc3545',
    },
    questionTypeIcon: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
    },
    questionTypeIconColor: {
        color: '#1A2C5B',
    },
    questionNumber: {
        color: '#1A2C5B',
    },
    questionText: {
        color: '#1A2C5B',
    },
    optionButton: {
        backgroundColor: 'rgba(248, 244, 227, 0.8)',
        borderColor: 'rgba(26, 44, 91, 0.2)',
    },
    correctOption: {
        backgroundColor: '#28a745',
        borderColor: '#28a745',
    },
    incorrectOption: {
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
    },
    optionLetter: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
    },
    correctOptionLetter: {
        backgroundColor: '#FFFFFF',
    },
    incorrectOptionLetter: {
        backgroundColor: '#FFFFFF',
    },
    optionLetterText: {
        color: '#1A2C5B',
    },
    correctOptionLetterText: {
        color: '#28a745',
    },
    incorrectOptionLetterText: {
        color: '#dc3545',
    },
    optionText: {
        color: '#1A2C5B',
    },
    correctOptionText: {
        color: '#FFFFFF',
    },
    incorrectOptionText: {
        color: '#FFFFFF',
    },
    textAnswerBox: {
        backgroundColor: 'rgba(248, 244, 227, 0.5)',
        borderColor: 'rgba(26, 44, 91, 0.2)',
    },
    correctAnswerBox: {
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderColor: 'rgba(40, 167, 69, 0.3)',
    },
    answerLabel: {
        color: '#4A5568',
    },
    correctAnswerDisplay: {
        color: '#155724',
    },
    formulaContainer: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    formulaLabel: {
        color: '#1A2C5B',
    },
    formulaText: {
        color: '#D4AF37',
    },
    explanationContainer: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    explanationIcon: {
        color: '#D4AF37',
    },
    explanationTitle: {
        color: '#1A2C5B',
    },
    explanationText: {
        color: '#1A2C5B',
    },
    solutionContainer: {
        backgroundColor: 'rgba(26, 44, 91, 0.05)',
        borderColor: 'rgba(26, 44, 91, 0.2)',
    },
    solutionTitle: {
        color: '#1A2C5B',
    },
    solutionStep: {
        color: '#4A5568',
    },
    explanationButton: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: '#D4AF37',
        shadowColor: '#D4AF37',
    },
    explanationButtonText: {
        color: '#D4AF37',
    },
    primaryButton: {
        backgroundColor: '#1A2C5B',
        shadowColor: '#1A2C5B',
    },
    primaryButtonText: {
        color: '#FFFFFF',
    },
    secondaryButton: {
        backgroundColor: '#D4AF37',
        shadowColor: '#D4AF37',
    },
    secondaryButtonText: {
        color: '#1A2C5B',
    },
});

// Dark Mode Styles
const darkStyles = StyleSheet.create({
    container: {
        backgroundColor: '#1A2C5B',
    },
    backButton: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
        shadowColor: '#D4AF37',
    },
    backButtonText: {
        color: '#F8F4E3',
    },
    titleIcon: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        shadowColor: '#D4AF37',
    },
    titleIconColor: {
        color: '#D4AF37',
    },
    title: {
        color: '#F8F4E3',
    },
    subtitle: {
        color: '#CBD5E0',
    },
    scoreCard: {
        backgroundColor: 'rgba(44, 70, 125, 0.9)',
        shadowColor: '#D4AF37',
    },
    scoreNumber: {
        color: '#F8F4E3',
    },
    scoreLabel: {
        color: '#CBD5E0',
    },
    originalDate: {
        color: '#CBD5E0',
    },
    statItem: {
        backgroundColor: 'transparent',
    },
    statLabel: {
        color: '#CBD5E0',
    },
    sectionTitle: {
        color: '#F8F4E3',
    },
    questionCard: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
        shadowColor: '#D4AF37',
    },
    correctCard: {
        borderColor: '#28a745',
    },
    incorrectCard: {
        borderColor: '#dc3545',
    },
    questionTypeIcon: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
    },
    questionTypeIconColor: {
        color: '#D4AF37',
    },
    questionNumber: {
        color: '#F8F4E3',
    },
    questionText: {
        color: '#F8F4E3',
    },
    optionButton: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderColor: 'rgba(248, 244, 227, 0.3)',
    },
    correctOption: {
        backgroundColor: '#28a745',
        borderColor: '#28a745',
    },
    incorrectOption: {
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
    },
    optionLetter: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
    },
    correctOptionLetter: {
        backgroundColor: '#FFFFFF',
    },
    incorrectOptionLetter: {
        backgroundColor: '#FFFFFF',
    },
    optionLetterText: {
        color: '#F8F4E3',
    },
    correctOptionLetterText: {
        color: '#28a745',
    },
    incorrectOptionLetterText: {
        color: '#dc3545',
    },
    optionText: {
        color: '#F8F4E3',
    },
    correctOptionText: {
        color: '#FFFFFF',
    },
    incorrectOptionText: {
        color: '#FFFFFF',
    },
    textAnswerBox: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderColor: 'rgba(248, 244, 227, 0.3)',
    },
    correctAnswerBox: {
        backgroundColor: 'rgba(40, 167, 69, 0.15)',
        borderColor: 'rgba(40, 167, 69, 0.4)',
    },
    answerLabel: {
        color: '#CBD5E0',
    },
    correctAnswerDisplay: {
        color: '#20c997',
    },
    formulaContainer: {
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        borderColor: 'rgba(212, 175, 55, 0.4)',
    },
    formulaLabel: {
        color: '#F8F4E3',
    },
    formulaText: {
        color: '#D4AF37',
    },
    explanationContainer: {
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        borderColor: 'rgba(212, 175, 55, 0.4)',
    },
    explanationIcon: {
        color: '#D4AF37',
    },
    explanationTitle: {
        color: '#F8F4E3',
    },
    explanationText: {
        color: '#F8F4E3',
    },
    solutionContainer: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderColor: 'rgba(248, 244, 227, 0.3)',
    },
    solutionTitle: {
        color: '#F8F4E3',
    },
    solutionStep: {
        color: '#CBD5E0',
    },
    explanationButton: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderColor: '#D4AF37',
        shadowColor: '#D4AF37',
    },
    explanationButtonText: {
        color: '#D4AF37',
    },
    primaryButton: {
        backgroundColor: '#F8F4E3',
        shadowColor: '#F8F4E3',
    },
    primaryButtonText: {
        color: '#1A2C5B',
    },
    secondaryButton: {
        backgroundColor: '#D4AF37',
        shadowColor: '#D4AF37',
    },
    secondaryButtonText: {
        color: '#1A2C5B',
    },
});

export default ReviewScreen;