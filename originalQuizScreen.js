import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    StatusBar,
    Animated,
    Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import uuid from 'react-native-uuid';

const { width: screenWidth } = Dimensions.get('window');

const QuizScreen = ({ route, navigation }) => {
    const backendQuizData = route.params?.quiz || [];
    const [started, setStarted] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [currentQuestionIndex, setCurentQuestionIndex] = useState(0);
    const [questionsState, setQuestionsState] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false); // You might want to get this from context/props
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    // Animation refs
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scoreAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Process questions and initialize state
    const questions = useMemo(() => {
        const processedQuestions = backendQuizData.map(q => ({
            id: uuid.v4(),
            questionNumber: q.question_number,
            questionText: q.question_text,
            type: q.type,
            options: q.options ? q.options.map(opt => ({
                id: uuid.v4(),
                label: opt.label,
                text: opt.text,
                value: opt.value
            })) : [],
            correctAnswer: q.correct_answer,
            userAnswer: null,
            isCorrect: null,
        }));

        const initialUserAnswers = {};
        processedQuestions.forEach(q => {
            initialUserAnswers[q.id] = null;
        });
        setUserAnswers(initialUserAnswers);
        setQuestionsState(processedQuestions);
        return processedQuestions;
    }, [backendQuizData]);

    useEffect(() => {
        if (started && questions.length > 0) {
            // Animate progress bar
            Animated.timing(progressAnim, {
                toValue: (currentQuestionIndex + 1) / questions.length,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [currentQuestionIndex, started, questions.length]);

    const handleSelectOption = (questionId, selectedValue) => {
        if (submitted) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: selectedValue }));
    };

    const handleShortAnswer = (questionId, text) => {
        if (submitted) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const handleSubmit = () => {
        let correctCount = 0;
        const updatedQuestions = questionsState.map(q => {
            let isQuestionCorrect = false;
            const userAnswer = userAnswers[q.id];

            if (q.type === 'open_ended') {
                isQuestionCorrect = userAnswer && q.correctAnswer &&
                    userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
            } else if (q.type === 'multiple_choice') {
                isQuestionCorrect = userAnswer === q.correctAnswer;
            } else if (q.type === 'true_false') {
                isQuestionCorrect = userAnswer === q.correctAnswer;
            }

            if (isQuestionCorrect) {
                correctCount++;
            }
            return { ...q, userAnswer: userAnswer, isCorrect: isQuestionCorrect };
        });

        setQuestionsState(updatedQuestions);
        setScore(correctCount);
        setSubmitted(true);
        setShowResults(true);

        // Animate score
        Animated.spring(scoreAnim, {
            toValue: correctCount,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
        }).start();
    };

    const handleRetake = () => {
        const resetAnswers = {};
        questionsState.forEach(q => {
            resetAnswers[q.id] = null;
        });
        setUserAnswers(resetAnswers);
        setSubmitted(false);
        setStarted(false);
        setShowResults(false);
        setCurentQuestionIndex(0);
        setScore(0);
        
        // Reset animations
        progressAnim.setValue(0);
        scoreAnim.setValue(0);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
            setCurentQuestionIndex(prev => prev + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
            setCurentQuestionIndex(prev => prev - 1);
        }
    };

    const getQuestionIcon = (type) => {
        switch (type) {
            case 'multiple_choice': return 'list-ul';
            case 'true_false': return 'check-circle';
            case 'open_ended': return 'edit';
            default: return 'question';
        }
    };

    const currentThemeStyles = isDarkMode ? darkStyles : lightStyles;
    const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const renderStartScreen = () => (
        <Animatable.View animation="fadeInUp" duration={1000} style={styles.startContainer}>
            <StatusBar barStyle={statusBarStyle} />
            
            {/* Back Button */}
            <TouchableOpacity 
                style={[styles.backButton, currentThemeStyles.backButton]}
                onPress={() => navigation.goBack()}
            >
                <FontAwesome5 name="arrow-left" size={20} color={currentThemeStyles.backButtonText.color} />
            </TouchableOpacity>

            {/* Torch Icon */}
            <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite" duration={2000}>
                <View style={[styles.startIcon, currentThemeStyles.startIcon]}>
                    <FontAwesome5 name="fire" size={48} color={currentThemeStyles.startIconColor.color} />
                </View>
            </Animatable.View>

            <Text style={[styles.startTitle, currentThemeStyles.startTitle]}>Quiz Ready!</Text>
            
            {questions.length > 0 ? (
                <>
                    <Text style={[styles.startSubtitle, currentThemeStyles.startSubtitle]}>
                        {questions.length} questions • Test your knowledge
                    </Text>
                    
                    {/* Question Types Preview */}
                    <View style={[styles.typesPreview, currentThemeStyles.typesPreview]}>
                        {[...new Set(questions.map(q => q.type))].map(type => (
                            <View key={type} style={[styles.typeChip, currentThemeStyles.typeChip]}>
                                <FontAwesome5 
                                    name={getQuestionIcon(type)} 
                                    size={14} 
                                    color={currentThemeStyles.typeChipText.color} 
                                />
                                <Text style={[styles.typeChipText, currentThemeStyles.typeChipText]}>
                                    {type.replace('_', ' ')}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => setStarted(true)}
                        style={[styles.startButton, currentThemeStyles.startButton]}
                        activeOpacity={0.8}
                    >
                        <FontAwesome5 name="play" size={20} color={currentThemeStyles.startButtonText.color} />
                        <Text style={[styles.startButtonText, currentThemeStyles.startButtonText]}>
                            Begin Quiz
                        </Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={[styles.noQuestionsTitle, currentThemeStyles.noQuestionsTitle]}>
                        No Questions Generated
                    </Text>
                    <Text style={[styles.noQuestionsText, currentThemeStyles.noQuestionsText]}>
                        Please check your study material and try again
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backToUploadButton, currentThemeStyles.backToUploadButton]}
                    >
                        <Text style={[styles.backToUploadText, currentThemeStyles.backToUploadText]}>
                            Back to Upload
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </Animatable.View>
    );

    const renderQuestion = (q, index) => {
        const userAnswer = userAnswers[q.id];
        const showFeedback = submitted;

        return (
            <Animated.View key={q.id} style={[{ opacity: fadeAnim }, styles.questionCard, currentThemeStyles.questionCard]}>
                {/* Question Header */}
                <View style={styles.questionHeader}>
                    <View style={[styles.questionTypeIcon, currentThemeStyles.questionTypeIcon]}>
                        <FontAwesome5 
                            name={getQuestionIcon(q.type)} 
                            size={18} 
                            color={currentThemeStyles.questionTypeIconColor.color} 
                        />
                    </View>
                    <Text style={[styles.questionNumber, currentThemeStyles.questionNumber]}>
                        Question {q.questionNumber}
                    </Text>
                </View>

                <Text style={[styles.questionText, currentThemeStyles.questionText]}>
                    {q.questionText}
                </Text>

                {/* Multiple Choice */}
                {q.type === 'multiple_choice' && (
                    <View style={styles.optionsContainer}>
                        {q.options.map((opt, optIndex) => {
                            const isSelected = userAnswer === opt.label;
                            const isCorrectOption = opt.label === q.correctAnswer;

                            let optionStyle = [styles.optionButton, currentThemeStyles.optionButton];
                            if (isSelected && !showFeedback) {
                                optionStyle.push(currentThemeStyles.selectedOption);
                            }
                            if (showFeedback && isCorrectOption) {
                                optionStyle.push(currentThemeStyles.correctOption);
                            }
                            if (showFeedback && isSelected && !isCorrectOption) {
                                optionStyle.push(currentThemeStyles.incorrectOption);
                            }

                            return (
                                <Animatable.View 
                                    key={opt.id}
                                    animation="slideInLeft" 
                                    delay={optIndex * 100}
                                >
                                    <TouchableOpacity
                                        style={optionStyle}
                                        onPress={() => handleSelectOption(q.id, opt.label)}
                                        disabled={submitted}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.optionContent}>
                                            <View style={[styles.optionLetter, 
                                                isSelected && !showFeedback ? currentThemeStyles.selectedOptionLetter :
                                                showFeedback && isCorrectOption ? currentThemeStyles.correctOptionLetter :
                                                showFeedback && isSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionLetter :
                                                currentThemeStyles.optionLetter
                                            ]}>
                                                <Text style={[styles.optionLetterText,
                                                    isSelected && !showFeedback ? currentThemeStyles.selectedOptionLetterText :
                                                    showFeedback && isCorrectOption ? currentThemeStyles.correctOptionLetterText :
                                                    showFeedback && isSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionLetterText :
                                                    currentThemeStyles.optionLetterText
                                                ]}>
                                                    {opt.label}
                                                </Text>
                                            </View>
                                            <Text style={[styles.optionText,
                                                isSelected && !showFeedback ? currentThemeStyles.selectedOptionText :
                                                showFeedback && isCorrectOption ? currentThemeStyles.correctOptionText :
                                                showFeedback && isSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionText :
                                                currentThemeStyles.optionText
                                            ]}>
                                                {opt.text}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </Animatable.View>
                            );
                        })}
                    </View>
                )}

                {/* True/False */}
                {q.type === 'true_false' && (
                    <View style={styles.trueFalseContainer}>
                        {q.options.map((opt, optIndex) => {
                            const isSelected = userAnswer === opt.value;
                            const isCorrectOption = opt.value === q.correctAnswer;

                            let optionStyle = [styles.trueFalseButton, currentThemeStyles.optionButton];
                            if (isSelected && !showFeedback) {
                                optionStyle.push(currentThemeStyles.selectedOption);
                            }
                            if (showFeedback && isCorrectOption) {
                                optionStyle.push(currentThemeStyles.correctOption);
                            }
                            if (showFeedback && isSelected && !isCorrectOption) {
                                optionStyle.push(currentThemeStyles.incorrectOption);
                            }

                            return (
                                <Animatable.View 
                                    key={opt.id}
                                    animation="bounceIn" 
                                    delay={optIndex * 200}
                                    style={styles.trueFalseButtonContainer}
                                >
                                    <TouchableOpacity
                                        style={optionStyle}
                                        onPress={() => handleSelectOption(q.id, opt.value)}
                                        disabled={submitted}
                                        activeOpacity={0.8}
                                    >
                                        <FontAwesome5 
                                            name={opt.value === 'true' ? 'check' : 'times'} 
                                            size={24} 
                                            color={
                                                isSelected && !showFeedback ? currentThemeStyles.selectedOptionText.color :
                                                showFeedback && isCorrectOption ? currentThemeStyles.correctOptionText.color :
                                                showFeedback && isSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionText.color :
                                                currentThemeStyles.optionText.color
                                            }
                                        />
                                        <Text style={[styles.trueFalseText,
                                            isSelected && !showFeedback ? currentThemeStyles.selectedOptionText :
                                            showFeedback && isCorrectOption ? currentThemeStyles.correctOptionText :
                                            showFeedback && isSelected && !isCorrectOption ? currentThemeStyles.incorrectOptionText :
                                            currentThemeStyles.optionText
                                        ]}>
                                            {opt.text}
                                        </Text>
                                    </TouchableOpacity>
                                </Animatable.View>
                            );
                        })}
                    </View>
                )}

                {/* Open Ended */}
                {q.type === 'open_ended' && (
                    <Animatable.View animation="fadeInUp" delay={300}>
                        <TextInput
                            style={[styles.textInput, currentThemeStyles.textInput]}
                            value={userAnswer || ''}
                            editable={!submitted}
                            onChangeText={text => handleShortAnswer(q.id, text)}
                            placeholder="Type your answer here..."
                            placeholderTextColor={currentThemeStyles.placeholderText.color}
                            multiline
                            textAlignVertical="top"
                        />
                    </Animatable.View>
                )}

                {/* Feedback Section */}
                {showFeedback && (
                    <Animatable.View animation="slideInUp" style={[styles.feedbackSection, currentThemeStyles.feedbackSection]}>
                        <View style={styles.feedbackHeader}>
                            <FontAwesome5 
                                name={q.isCorrect ? 'check-circle' : 'times-circle'} 
                                size={20} 
                                color={q.isCorrect ? currentThemeStyles.correctFeedback.color : currentThemeStyles.incorrectFeedback.color} 
                            />
                            <Text style={[
                                styles.feedbackResult,
                                q.isCorrect ? currentThemeStyles.correctFeedback : currentThemeStyles.incorrectFeedback
                            ]}>
                                {q.isCorrect ? 'Correct!' : 'Incorrect'}
                            </Text>
                        </View>
                        
                        <View style={styles.answerComparison}>
                            <Text style={[styles.answerLabel, currentThemeStyles.answerLabel]}>
                                Your answer: 
                                <Text style={[styles.userAnswerText, currentThemeStyles.userAnswerText]}>
                                    {userAnswer || 'No answer'}
                                </Text>
                            </Text>
                            <Text style={[styles.answerLabel, currentThemeStyles.answerLabel]}>
                                Correct answer: 
                                <Text style={[styles.correctAnswerText, currentThemeStyles.correctAnswerText]}>
                                    {q.correctAnswer}
                                </Text>
                            </Text>
                        </View>
                    </Animatable.View>
                )}
            </Animated.View>
        );
    };

    const renderQuizContent = () => (
        <View style={[styles.quizContainer, currentThemeStyles.quizContainer]}>
            <StatusBar barStyle={statusBarStyle} />
            
            {/* Header */}
            <View style={[styles.quizHeader, currentThemeStyles.quizHeader]}>
                <TouchableOpacity 
                    style={[styles.headerButton, currentThemeStyles.headerButton]}
                    onPress={() => navigation.goBack()}
                >
                    <FontAwesome5 name="arrow-left" size={18} color={currentThemeStyles.headerButtonText.color} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, currentThemeStyles.headerTitle]}>
                    Quiz in Progress
                </Text>

                <TouchableOpacity 
                    style={[styles.headerButton, currentThemeStyles.headerButton]}
                    onPress={() => Alert.alert('Exit Quiz', 'Are you sure you want to exit?', [
                        { text: 'Cancel' },
                        { text: 'Exit', onPress: () => navigation.goBack() }
                    ])}
                >
                    <FontAwesome5 name="times" size={18} color={currentThemeStyles.headerButtonText.color} />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressContainer, currentThemeStyles.progressContainer]}>
                <View style={styles.progressInfo}>
                    <Text style={[styles.progressText, currentThemeStyles.progressText]}>
                        {currentQuestionIndex + 1} of {questions.length}
                    </Text>
                    <Text style={[styles.progressPercent, currentThemeStyles.progressPercent]}>
                        {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                    </Text>
                </View>
                <View style={[styles.progressBar, currentThemeStyles.progressBar]}>
                    <Animated.View 
                        style={[
                            styles.progressFill, 
                            currentThemeStyles.progressFill,
                            { width: progressWidth }
                        ]} 
                    />
                </View>
            </View>

            {/* Question */}
            <ScrollView 
                style={styles.questionScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {submitted ? (
                    // Show all questions with feedback
                    questionsState.map((q, index) => renderQuestion(q, index))
                ) : (
                    // Show current question
                    renderQuestion(questions[currentQuestionIndex], currentQuestionIndex)
                )}
            </ScrollView>

            {/* Navigation/Action Buttons */}
            {!submitted ? (
                <View style={[styles.navigationContainer, currentThemeStyles.navigationContainer]}>
                    <TouchableOpacity
                        style={[
                            styles.navButton, 
                            currentThemeStyles.navButton,
                            currentQuestionIndex === 0 && styles.navButtonDisabled
                        ]}
                        onPress={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        <FontAwesome5 name="chevron-left" size={16} color={currentThemeStyles.navButtonText.color} />
                        <Text style={[styles.navButtonText, currentThemeStyles.navButtonText]}>Previous</Text>
                    </TouchableOpacity>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <TouchableOpacity
                            style={[styles.submitButton, currentThemeStyles.submitButton]}
                            onPress={handleSubmit}
                        >
                            <FontAwesome5 name="check" size={16} color={currentThemeStyles.submitButtonText.color} />
                            <Text style={[styles.submitButtonText, currentThemeStyles.submitButtonText]}>Submit</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.navButton, styles.nextButton, currentThemeStyles.nextButton]}
                            onPress={nextQuestion}
                        >
                            <Text style={[styles.navButtonText, currentThemeStyles.nextButtonText]}>Next</Text>
                            <FontAwesome5 name="chevron-right" size={16} color={currentThemeStyles.nextButtonText.color} />
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                // Results Summary
                <Animatable.View animation="slideInUp" style={[styles.resultsContainer, currentThemeStyles.resultsContainer]}>
                    <View style={styles.scoreDisplay}>
                        <Text style={[styles.scoreLabel, currentThemeStyles.scoreLabel]}>Final Score</Text>
                        <Animated.Text style={[styles.scoreValue, currentThemeStyles.scoreValue]}>
                            {score}/{questions.length}
                        </Animated.Text>
                        <Text style={[styles.scorePercent, currentThemeStyles.scorePercent]}>
                            {Math.round((score / questions.length) * 100)}%
                        </Text>
                    </View>
                    
                    <TouchableOpacity
                        style={[styles.retakeButton, currentThemeStyles.retakeButton]}
                        onPress={handleRetake}
                    >
                        <FontAwesome5 name="redo" size={16} color={currentThemeStyles.retakeButtonText.color} />
                        <Text style={[styles.retakeButtonText, currentThemeStyles.retakeButtonText]}>Retake Quiz</Text>
                    </TouchableOpacity>
                </Animatable.View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, currentThemeStyles.container]}>
            {!started ? renderStartScreen() : renderQuizContent()}
        </View>
    );
};

// Enhanced Base Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    
    // Start Screen
    startContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    startIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    startTitle: {
        fontSize: 36,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    startSubtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 32,
        opacity: 0.8,
    },
    typesPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 40,
        gap: 12,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    typeChipText: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        gap: 12,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },
    noQuestionsTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    noQuestionsText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        opacity: 0.7,
    },
    backToUploadButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    backToUploadText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Quiz Content
    quizContainer: {
        flex: 1,
    },
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    progressContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    questionScrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    questionCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
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
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
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
    trueFalseContainer: {
        flexDirection: 'row',
        gap: 16,
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
    },
    trueFalseText: {
        fontSize: 16,
        fontWeight: '600',
    },
    textInput: {
        borderWidth: 2,
        borderRadius: 16,
        padding: 20,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    feedbackSection: {
        marginTop: 24,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    feedbackResult: {
        fontSize: 18,
        fontWeight: '700',
    },
    answerComparison: {
        gap: 8,
    },
    answerLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    userAnswerText: {
        fontWeight: '700',
        marginLeft: 4,
    },
    correctAnswerText: {
        fontWeight: '700',
        marginLeft: 4,
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 16,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        flex: 1,
        justifyContent: 'center',
        borderWidth: 2,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flexDirection: 'row-reverse',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        flex: 1,
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    resultsContainer: {
        padding: 20,
        borderTopWidth: 1,
    },
    scoreDisplay: {
        alignItems: 'center',
        marginBottom: 24,
    },
    scoreLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: '800',
        marginBottom: 4,
    },
    scorePercent: {
        fontSize: 20,
        fontWeight: '600',
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    retakeButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

// Light Mode Styles
const lightStyles = StyleSheet.create({
    container: {
        backgroundColor: '#F8F4E3',
    },
    
    // Start Screen
    backButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#1A2C5B',
    },
    backButtonText: {
        color: '#1A2C5B',
    },
    startIcon: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        shadowColor: '#D4AF37',
    },
    startIconColor: {
        color: '#D4AF37',
    },
    startTitle: {
        color: '#1A2C5B',
    },
    startSubtitle: {
        color: '#4A5568',
    },
    typesPreview: {
        // No specific background
    },
    typeChip: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(26, 44, 91, 0.2)',
    },
    typeChipText: {
        color: '#1A2C5B',
    },
    startButton: {
        backgroundColor: '#1A2C5B',
        shadowColor: '#1A2C5B',
    },
    startButtonText: {
        color: '#FFFFFF',
    },
    noQuestionsTitle: {
        color: '#dc3545',
    },
    noQuestionsText: {
        color: '#4A5568',
    },
    backToUploadButton: {
        borderColor: '#1A2C5B',
        backgroundColor: 'rgba(26, 44, 91, 0.05)',
    },
    backToUploadText: {
        color: '#1A2C5B',
    },

    // Quiz Content
    quizContainer: {
        backgroundColor: '#F8F4E3',
    },
    quizHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(26, 44, 91, 0.1)',
    },
    headerButton: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
    },
    headerButtonText: {
        color: '#1A2C5B',
    },
    headerTitle: {
        color: '#1A2C5B',
    },
    progressContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    progressText: {
        color: '#1A2C5B',
    },
    progressPercent: {
        color: '#D4AF37',
    },
    progressBar: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
    },
    progressFill: {
        backgroundColor: '#D4AF37',
    },
    questionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        shadowColor: '#1A2C5B',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
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
    selectedOption: {
        backgroundColor: '#1A2C5B',
        borderColor: '#1A2C5B',
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
    selectedOptionLetter: {
        backgroundColor: '#FFFFFF',
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
    selectedOptionLetterText: {
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
    selectedOptionText: {
        color: '#FFFFFF',
    },
    correctOptionText: {
        color: '#FFFFFF',
    },
    incorrectOptionText: {
        color: '#FFFFFF',
    },
    textInput: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(26, 44, 91, 0.3)',
        color: '#1A2C5B',
    },
    placeholderText: {
        color: '#4A5568',
    },
    feedbackSection: {
        backgroundColor: 'rgba(248, 244, 227, 0.5)',
        borderColor: 'rgba(26, 44, 91, 0.2)',
    },
    correctFeedback: {
        color: '#28a745',
    },
    incorrectFeedback: {
        color: '#dc3545',
    },
    answerLabel: {
        color: '#4A5568',
    },
    userAnswerText: {
        color: '#1A2C5B',
    },
    correctAnswerText: {
        color: '#28a745',
    },
    navigationContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(26, 44, 91, 0.1)',
    },
    navButton: {
        backgroundColor: 'rgba(248, 244, 227, 0.8)',
        borderColor: 'rgba(26, 44, 91, 0.3)',
    },
    navButtonText: {
        color: '#1A2C5B',
    },
    nextButton: {
        backgroundColor: '#1A2C5B',
        borderColor: '#1A2C5B',
    },
    nextButtonText: {
        color: '#FFFFFF',
    },
    submitButton: {
        backgroundColor: '#D4AF37',
        shadowColor: '#D4AF37',
    },
    submitButtonText: {
        color: '#1A2C5B',
    },
    resultsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopColor: 'rgba(26, 44, 91, 0.2)',
    },
    scoreLabel: {
        color: '#4A5568',
    },
    scoreValue: {
        color: '#1A2C5B',
    },
    scorePercent: {
        color: '#D4AF37',
    },
    retakeButton: {
        backgroundColor: '#1A2C5B',
        shadowColor: '#1A2C5B',
    },
    retakeButtonText: {
        color: '#FFFFFF',
    },
});

// Dark Mode Styles
const darkStyles = StyleSheet.create({
    container: {
        backgroundColor: '#1A2C5B',
    },
    
    // Start Screen
    backButton: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
        shadowColor: '#D4AF37',
    },
    backButtonText: {
        color: '#F8F4E3',
    },
    startIcon: {
        backgroundColor: 'rgba(212, 175, 55, 0.3)',
        shadowColor: '#D4AF37',
    },
    startIconColor: {
        color: '#D4AF37',
    },
    startTitle: {
        color: '#F8F4E3',
    },
    startSubtitle: {
        color: '#CBD5E0',
    },
    typesPreview: {
        // No specific background
    },
    typeChip: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    typeChipText: {
        color: '#F8F4E3',
    },
    startButton: {
        backgroundColor: '#D4AF37',
        shadowColor: '#D4AF37',
    },
    startButtonText: {
        color: '#1A2C5B',
    },
    noQuestionsTitle: {
        color: '#ff6b7a',
    },
    noQuestionsText: {
        color: '#CBD5E0',
    },
    backToUploadButton: {
        borderColor: '#F8F4E3',
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
    },
    backToUploadText: {
        color: '#F8F4E3',
    },

    // Quiz Content
    quizContainer: {
        backgroundColor: '#1A2C5B',
    },
    quizHeader: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    },
    headerButton: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
    },
    headerButtonText: {
        color: '#F8F4E3',
    },
    headerTitle: {
        color: '#F8F4E3',
    },
    progressContainer: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
    },
    progressText: {
        color: '#F8F4E3',
    },
    progressPercent: {
        color: '#D4AF37',
    },
    progressBar: {
        backgroundColor: 'rgba(248, 244, 227, 0.2)',
    },
    progressFill: {
        backgroundColor: '#D4AF37',
    },
    questionCard: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
        shadowColor: '#D4AF37',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
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
    selectedOption: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
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
    selectedOptionLetter: {
        backgroundColor: '#1A2C5B',
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
    selectedOptionLetterText: {
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
    selectedOptionText: {
        color: '#1A2C5B',
    },
    correctOptionText: {
        color: '#FFFFFF',
    },
    incorrectOptionText: {
        color: '#FFFFFF',
    },
    textInput: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderColor: 'rgba(248, 244, 227, 0.3)',
        color: '#F8F4E3',
    },
    placeholderText: {
        color: '#CBD5E0',
    },
    feedbackSection: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    correctFeedback: {
        color: '#4ade80',
    },
    incorrectFeedback: {
        color: '#ff6b7a',
    },
    answerLabel: {
        color: '#CBD5E0',
    },
    userAnswerText: {
        color: '#F8F4E3',
    },
    correctAnswerText: {
        color: '#4ade80',
    },
    navigationContainer: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(212, 175, 55, 0.3)',
    },
    navButton: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderColor: 'rgba(248, 244, 227, 0.3)',
    },
    navButtonText: {
        color: '#F8F4E3',
    },
    nextButton: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    nextButtonText: {
        color: '#1A2C5B',
    },
    submitButton: {
        backgroundColor: '#F8F4E3',
        shadowColor: '#F8F4E3',
    },
    submitButtonText: {
        color: '#1A2C5B',
    },
    resultsContainer: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
        borderTopColor: 'rgba(212, 175, 55, 0.3)',
    },
    scoreLabel: {
        color: '#CBD5E0',
    },
    scoreValue: {
        color: '#F8F4E3',
    },
    scorePercent: {
        color: '#D4AF37',
    },
    retakeButton: {
        backgroundColor: '#D4AF37',
        shadowColor: '#D4AF37',
    },
    retakeButtonText: {
        color: '#1A2C5B',
    },
});

export default QuizScreen;