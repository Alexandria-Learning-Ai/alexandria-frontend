// Enhanced ResultsScreen.js with Tier-Based AI Explanations
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Appearance,
  Modal,
  TextInput,
} from 'react-native';
import AdvancedAnalyticsService from '../services/AdvancedAnalyticsService';
import { 
  AchievementCelebrationModal, 
  InsightsDisplay, 
  AchievementSummaryCard 
} from '../components/AchievementComponents';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';
import PropTypes from 'prop-types';
import CoachMessage from '../components/CoachMessage';
import { API_BASE_URL } from '../config/api';
import { useTranslation } from 'react-i18next';
import { CoachUtils } from '../utils/CoachUtils'; 
import { auth } from '../firebaseConfig';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';
import { QuizHistoryManager } from '../services/QuizHistoryManager';
import { SubjectProgressService } from '../services/SubjectProgressService';
import IntelligentNotificationSystem from '../utils/IntelligentNotificationSystem';
import { EnhancedExplanationService } from '../services/EnhancedExplanationService'; // 🚀 NEW
import { FlashcardService } from '../services/FlashcardService'; // 🚀 NEW: Flashcard integration
import SafeBackButton from '../components/SafeBackButton';
import { LinearGradient } from 'expo-linear-gradient';
import logger from '../utils/logger';


// Optional imports with fallbacks
let Share, Clipboard;

try {
  Share = require('react-native-share');
  if (Share.default) {
    Share = Share.default;
  }
} catch (e) {
  logger.warn('react-native-share not available:', e.message);
  Share = null;
}

try {
  Clipboard = require('@react-native-clipboard/clipboard');
  if (Clipboard.default) {
    Clipboard = Clipboard.default;
  }
} catch (e) {
  logger.warn('@react-native-clipboard/clipboard not available:', e.message);
  try {
    Clipboard = require('@react-native-community/clipboard');
    if (Clipboard.default) {
      Clipboard = Clipboard.default;
    }
  } catch (e2) {
    logger.warn('No clipboard package available:', e2.message);
    Clipboard = null;
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => this.props.navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

// ✅ REMOVED: All modal components - now using unified AI Analysis section

// Configuration
const CONFIG = {
  API_ENDPOINT: `${API_BASE_URL}/generate-explanation`,
  COACH_API_ENDPOINT: `${API_BASE_URL}/generate-coach-message`,
  MAX_QUIZ_HISTORY: 100,
  MAX_ANALYTICS_DAYS: 60,
  REQUEST_TIMEOUT: 30000,
  APP_VERSION: '1.0.0',
  ENABLE_API_EXPLANATIONS: true, // 🚀 NOW ENABLED
  ENABLE_AI_COACH: true,
  ENABLE_VOICE_FEEDBACK: false,
  ENABLE_SHARE_FEATURES: true,
  APP_SCHEME: 'quizapp',
  DEEP_LINK_DOMAIN: 'quizapp.com',
  APP_STORE_URL: 'https://apps.apple.com/app/your-quiz-app/id123456789',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.yourcompany.quizapp',
  WEB_APP_URL: 'https://quizapp.com',
};

// Helper function to get display-friendly answer text
const getDisplayAnswerText = (question, answer) => {
  if (question.type === 'multiple_choice' && question.options && Array.isArray(question.options)) {
    const option = question.options.find(opt => opt?.label === answer);
    return option ? (option.text || option.value || answer) : answer || '—';
  } else if (question.type === 'true_false') {
    return String(answer).toLowerCase() === 'true' ? 'True' : 'False';
  } else {
    return answer || '—';
  }
};

// Motivational messages based on score percentage
const getMotivationalMessage = (percentage) => {
  if (percentage < 40) {
    return "Don't worry, practice makes perfect 💪";
  } else if (percentage >= 40 && percentage < 70) {
    return "Good progress! Keep at it 🚀";
  } else {
    return "Great work! You're mastering this topic 🎉";
  }
};

// Helper function to get gradient colors for progress bar based on percentage
const getProgressGradientColors = (percentage) => {
  if (percentage >= 80) {
    // Excellent (80-100%): Rich green gradient
    return ['#22c55e', '#16a34a', '#15803d'];
  } else if (percentage >= 60) {
    // Good (60-79%): Green to yellow gradient
    return ['#84cc16', '#eab308', '#f59e0b'];
  } else if (percentage >= 40) {
    // Fair (40-59%): Yellow to orange gradient
    return ['#f59e0b', '#f97316', '#ea580c'];
  } else {
    // Poor (0-39%): Orange to red gradient
    return ['#f97316', '#ef4444', '#dc2626'];
  }
};

const ResultsScreen = ({ route, navigation }) => {
  // Safely handle translation with fallbacks
  let t = null;
  try {
    const { t: translator } = useTranslation();
    t = translator;
  } catch (error) {
    logger.warn('Translation hook not available, using fallbacks:', error);
    t = null;
  }
  // Validate route params
  if (!route?.params) {
    Alert.alert('Error', 'Quiz data not found');
    navigation.navigate('Home');
    return null;
  }

  const { questions = [], userAnswers = {}, score = 0, metadata = {} } = route.params;

  // State management
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [showExplanations, setShowExplanations] = useState(false);
  const [explanations, setExplanations] = useState({});
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [loadingSpecificExplanation, setLoadingSpecificExplanation] = useState(null); // 🚀 NEW: Track which question is loading
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [animatedPercentageValue, setAnimatedPercentageValue] = useState(0);
  const [coachMessage, setCoachMessage] = useState(null);
  const [showCoachTips, setShowCoachTips] = useState(false);
  const [loadingCoachMessage, setLoadingCoachMessage] = useState(false);
  const [showCoachCard, setShowCoachCard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weaknessAnalysis, setWeaknessAnalysis] = useState(null);
  const [analyticsAchievements, setAnalyticsAchievements] = useState([]);
  const [analyticsInsights, setAnalyticsInsights] = useState([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // 🚀 SIMPLIFIED: Removed individual explanation modal states as we now use unified explanations
  const [usageStats, setUsageStats] = useState(null);
  
  // 🚀 NEW: Subject correction states
  const [showSubjectCorrection, setShowSubjectCorrection] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Animation refs
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const cancelTokenSource = useRef(axios.CancelToken.source());

  // Calculate performance metrics
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const correctCount = score;
  const incorrectCount = totalQuestions - score;

  // Helper function for normalizing true/false answers
  const normalizeAnswer = (answer) => {
    if (answer === null || answer === undefined) return '';
    if (typeof answer === 'boolean') return answer ? 'true' : 'false';
    return String(answer).trim().toLowerCase();
  };

  // 🚀 NEW: Handle subject correction submission
  const handleSubjectCorrection = async (correctedSubject) => {
    setSubmittingCorrection(true);
    try {
      // Store correction feedback
      const correctionData = {
        userId: 'current_user', // Replace with actual user ID
        quizId: metadata.quizId || `quiz_${Date.now()}`,
        originalSubject: weaknessAnalysis?.weaknesses?.[0]?.topic || 'Unknown',
        correctedSubject: correctedSubject.toLowerCase().replace(/ /g, '_'),
        timestamp: new Date().toISOString(),
        feedback: 'user_correction'
      };
      
      // Save correction to AsyncStorage for now (could be sent to backend later)
      const existingCorrections = await AsyncStorage.getItem('subject_corrections');
      const corrections = existingCorrections ? JSON.parse(existingCorrections) : [];
      corrections.push(correctionData);
      await AsyncStorage.setItem('subject_corrections', JSON.stringify(corrections));
      
      logger.info('📝 Subject correction saved:', correctionData);
      
      // Show success message
      Alert.alert(
        'Thank you!', 
        'Your correction has been saved and will help improve Alexandria\'s subject detection.',
        [{ text: 'OK' }]
      );
      
      setShowSubjectCorrection(false);
    } catch (error) {
      logger.error('Error saving subject correction:', error);
      Alert.alert('Error', 'Failed to save correction. Please try again.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Get incorrect questions for explanations
  const incorrectQuestions = questions.filter(q => {
    const userAns = userAnswers[q?.id];
    return !q?.isCorrect || userAns !== q?.correctAnswer;
  });

  // Helper functions
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Excellent', icon: 'trophy', color: '#D4AF37' };
    if (percentage >= 80) return { level: 'Great', icon: 'star', color: '#28a745' };
    if (percentage >= 70) return { level: 'Good', icon: 'thumbs-up', color: '#17a2b8' };
    if (percentage >= 60) return { level: 'Fair', icon: 'check-circle', color: '#ffc107' };
    return { level: 'Keep Learning', icon: 'book', color: '#dc3545' };
  };

  const performance = getPerformanceLevel();


  // ✅ REMOVED: Individual explanation modal functions - now using unified AI Analysis section

  // ✅ UPDATED: Format quiz results for SubjectProgressService
  const formatQuizResultsForSubjectProgress = () => {
    logger.info('📊 Formatting quiz results for subject tracking...');
    
    return {
      answers: questions.map((question, index) => ({
        question: question.text || question.questionText || '',
        userAnswer: userAnswers[question.id],
        correctAnswer: question.correctAnswer,
        isCorrect: question.isCorrect === true,
        options: question.options || [],
        category: question.category || determineCategory(metadata, [], questions),
        difficulty: question.difficulty || metadata.difficulty || 'medium',
        questionId: question.id,
        timeSpent: question.timeSpent || 30
      })),
      score: correctCount,
      totalQuestions: totalQuestions,
      category: determineCategory(metadata, [], questions),
      difficulty: metadata.difficulty || 'medium',
      questions: questions,
      metadata: {
        completedAt: new Date().toISOString(),
        source: 'results_screen',
        title: metadata.title || `${determineCategory(metadata, [], questions)} Quiz`
      }
    };
  };

  // ✅ FIXED: Enhanced quiz completion handler with proper error handling
  const handleQuizCompletion = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        logger.warn('⚠️ No authenticated user found, skipping progress tracking');
        return;
      }

      logger.info('📊 Quiz completed, analyzing results...');
      
      // ✅ FIXED: Use properly formatted results
      const formattedResults = formatQuizResultsForSubjectProgress();
      
      logger.info('📊 Formatted results structure:', {
        answersCount: formattedResults.answers?.length || 0,
        hasAnswers: Array.isArray(formattedResults.answers),
        score: formattedResults.score,
        totalQuestions: formattedResults.totalQuestions,
        category: formattedResults.category
      });

      // Update subject progress FIRST (this feeds the dashboard)
      await SubjectProgressService.updateSubjectProgress(user.uid, formattedResults);

      // Format answers for weakness analysis
      const detailedAnswers = formattedResults.answers.map(answer => ({
        question: answer.question,
        options: answer.options,
        correctAnswer: answer.correctAnswer,
        selectedAnswer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        explanation: '',
        category: answer.category,
        difficulty: answer.difficulty,
        timeSpent: answer.timeSpent
      }));

      // Analyze weaknesses and generate recommendations
      const analysis = await WeaknessAnalysisService.analyzeQuizResults(user.uid, {
        quizId: metadata.quizId || `quiz_${Date.now()}`,
        score: correctCount,
        totalQuestions: totalQuestions,
        answers: detailedAnswers,
        timestamp: new Date().toISOString(),
        category: formattedResults.category,
        difficulty: formattedResults.difficulty
      });

      if (analysis && isMountedRef.current) {
        showWeaknessInsightsAlert(analysis);
        const currentWeaknesses = await WeaknessAnalysisService.getCurrentWeaknesses(user.uid);
        setWeaknessAnalysis(currentWeaknesses);
      }

      // Trigger smart analysis after quiz completion
      await IntelligentNotificationSystem.schedulePersonalizedNotifications(user.uid, 'quiz_completed');

      logger.info('✅ Quiz completion analysis finished successfully');

    } catch (error) {
      logger.error('❌ Error in quiz completion analysis:', error);
      logger.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  };

  // ✅ IMPROVED: Enhanced save quiz function with better error handling
  const saveQuizToHistory = async () => {
    setSavingQuiz(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'You must be logged in to save quiz history.');
        setSavingQuiz(false);
        return;
      }

      logger.info('💾 Saving quiz to history...');

      const quizData = {
        id: uuid.v4(),
        title: metadata.title || `Quiz - ${new Date().toLocaleDateString()}`,
        questions: questions,
        results: {
          score,
          totalQuestions,
          percentage,
          correctCount,
          incorrectCount,
        },
        metadata: {
          ...metadata,
          completedAt: new Date().toISOString(),
        },
        userAnswers,
        createdAt: new Date().toISOString(),
      };

      // Save to AsyncStorage
      const key = `quizHistory_${user.uid}`;
      const existingHistory = await AsyncStorage.getItem(key);
      const quizHistory = existingHistory ? JSON.parse(existingHistory) : [];
      quizHistory.unshift(quizData);

      if (quizHistory.length > CONFIG.MAX_QUIZ_HISTORY) {
        quizHistory.splice(CONFIG.MAX_QUIZ_HISTORY);
      }

      await AsyncStorage.setItem(key, JSON.stringify(quizHistory));
      
      // Record quiz completion for coach tracking
      await CoachUtils.recordQuizCompletion(user.uid);

      // Save to the new history manager
      await QuizHistoryManager.saveQuizToHistory({
        quiz: questions,
        metadata: metadata || {}
      }, metadata?.source || 'completed_quiz');

      // ✅ FIXED: Update subject progress when manually saving
      const formattedResults = formatQuizResultsForSubjectProgress();
      await SubjectProgressService.updateSubjectProgress(user.uid, formattedResults);

      // Trigger smart analysis after saving
      await IntelligentNotificationSystem.schedulePersonalizedNotifications(user.uid, 'quiz_completed');

      // ✅ NEW: Generate flashcards from quiz mistakes
      try {
        const incorrectQuestions = questions.filter(q => {
          const userAnswer = userAnswers[q?.id];
          return !q?.isCorrect || userAnswer !== q?.correctAnswer;
        });

        if (incorrectQuestions.length > 0) {
          logger.info(`📚 Generating ${incorrectQuestions.length} flashcards from quiz mistakes...`);
          
          const quizResults = {
            questions: incorrectQuestions.map(q => ({
              ...q,
              isCorrect: false,
              userAnswer: userAnswers[q?.id],
              subject: q?.subject || metadata?.subject || 'General',
              difficulty: q?.difficulty || metadata?.difficulty || 'medium'
            })),
            metadata: metadata || {}
          };

          await FlashcardService.generateFlashcardsFromMistakes(user.uid, quizResults);
          logger.info('✅ Flashcards generated successfully from quiz mistakes');
          
          // Enhanced success message
          if (isMountedRef.current) {
            Alert.alert(
              'Quiz Saved! 📊📚', 
              `Your results have been saved and progress updated. ${incorrectQuestions.length} flashcards were automatically created from your mistakes for future study!`
            );
          }
        } else {
          if (isMountedRef.current) {
            Alert.alert('Quiz Saved! 📊', 'Perfect score! Your results have been saved and progress updated.');
          }
        }
      } catch (flashcardError) {
        logger.error('❌ Error generating flashcards from mistakes:', flashcardError);
        // Fallback to original message if flashcard generation fails
        if (isMountedRef.current) {
          Alert.alert('Quiz Saved! 📊', 'Your results have been saved and progress updated.');
        }
      }
    } catch (error) {
      logger.error('❌ Error saving quiz:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to save quiz to history. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setSavingQuiz(false);
      }
    }
  };

  // Category determination
  const determineCategory = (metadataParam, keywords, questionsParam) => {
    try {
      if (metadataParam?.category) return metadataParam.category;
      if (metadataParam?.subject) return metadataParam.subject;

      const categoryMap = {
        Math: ['mathematics', 'algebra', 'calculus', 'geometry', 'arithmetic', 'equation'],
        Science: ['physics', 'chemistry', 'biology', 'anatomy', 'molecule', 'cell'],
        History: ['historical', 'ancient', 'war', 'civilization', 'empire', 'revolution'],
        Literature: ['literature', 'novel', 'poem', 'author', 'character', 'plot'],
        Language: ['grammar', 'vocabulary', 'syntax', 'language', 'word', 'sentence'],
        Geography: ['country', 'capital', 'continent', 'ocean', 'mountain', 'river'],
        Programming: ['code', 'function', 'variable', 'algorithm', 'programming', 'software'],
      };

      if (Array.isArray(keywords)) {
        for (const [category, categoryKeywords] of Object.entries(categoryMap)) {
          const matches = keywords.filter(keyword =>
            categoryKeywords.some(catKeyword => keyword?.toLowerCase().includes(catKeyword))
          ).length;
          if (matches > 0) return category;
        }
      }

      const mathTypes = questionsParam.filter(q => q?.type === 'math').length;
      if (mathTypes > questionsParam.length * 0.5) return 'Mathematics';

      return 'General Knowledge';
    } catch (error) {
      logger.error('Error determining category:', error);
      return 'General Knowledge';
    }
  };

  // ✅ IMPROVED: Show weakness insights with better messaging
  const showWeaknessInsightsAlert = (analysis) => {
    if (!analysis || !analysis.weaknesses || analysis.weaknesses.length === 0) return;

    const topWeakness = analysis.weaknesses[0];
    const recommendations = analysis.recommendations || [];

    if (topWeakness && topWeakness.severity > 50) {
      Alert.alert(
        '🎯 Alexandria\'s Insight',
        `I noticed you could improve in ${topWeakness.topic.replace(/_/g, ' ')}. ` +
        `I'll prepare a focused quiz to help you strengthen this area! ` +
        `\n\n💡 ${recommendations[0]?.message || 'Keep practicing and you\'ll see improvement!'}`,
        [
          { text: 'Thanks, Alexandria!', style: 'default' },
          { 
            text: 'Show My Progress', 
            onPress: () => navigation.navigate('ProgressTracker')
          }
        ]
      );
    }
  };

  // ✅ IMPROVED: Request focused quiz with better UX
  const requestFocusQuiz = async (weakness) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to access personalized quizzes.');
      return;
    }

    try {
      const remedialQuiz = await WeaknessAnalysisService.generateRemedialQuiz(user.uid, weakness);
      
      Alert.alert(
        '🎯 Focus Quiz Ready!',
        `I've prepared a ${remedialQuiz.questionCount}-question quiz focused on ${weakness.topic.replace(/_/g, ' ')} to help boost your skills in this area.`,
        [
          { text: 'Take Later', style: 'cancel' },
          { 
            text: 'Start Now! 🚀', 
            onPress: () => navigation.navigate('QuizScreen', { 
              questions: remedialQuiz.questions,
              metadata: { 
                title: `Focus: ${weakness.topic.replace(/_/g, ' ')}`,
                isRemedial: true,
                focusArea: weakness.topic
              }
            })
          }
        ]
      );
    } catch (error) {
      logger.error('Error generating focus quiz:', error);
      Alert.alert('Oops!', 'I couldn\'t generate a focus quiz right now. Please try again in a moment.');
    }
  };

  // Generate local explanations (fallback)
  const generateLocalExplanation = (question, userAnswer) => {
    const questionText = question.text || question.questionText;
    const correctAnswer = question.correctAnswer;
    const category = determineQuestionCategory(questionText);
    
    let explanation = '';

    if (question.type === 'multiple_choice') {
      explanation = generateContextualExplanation(questionText, correctAnswer, userAnswer, question.options);
      
      if (userAnswer && userAnswer !== correctAnswer) {
        const incorrectReason = generateIncorrectChoiceReason(questionText, userAnswer, correctAnswer);
        explanation += ` Your choice "${userAnswer}" is incorrect because ${incorrectReason}.`;
      }
    } else if (question.type === 'true_false') {
      const isCorrectTrue = correctAnswer === true || correctAnswer === 'true';
      explanation = generateTrueFalseReason(questionText, isCorrectTrue);
    } else if (question.type === 'short' || question.type === 'open_ended') {
      explanation = generateOpenEndedExplanation(questionText, correctAnswer, userAnswer);
    } else {
      explanation = generateContextualExplanation(questionText, correctAnswer, userAnswer);
    }

    const categoryTip = generateCategorySpecificTip(category, questionText, correctAnswer);
    explanation += ` ${categoryTip}`;

    return explanation;
  };

  // Helper functions for local explanations
  const generateContextualExplanation = (questionText, correctAnswer, userAnswer, options) => {
    const lowerQuestion = questionText.toLowerCase();

    if (lowerQuestion.includes('climax') || lowerQuestion.includes('dramática')) {
      if (correctAnswer.toLowerCase().includes('planteamiento')) {
        return "In dramatic structure, the climax is the moment of highest tension, but it's the 'planteamiento' (exposition/setup) that provides sufficient information about the characters, establishing who they are, their relationships, and their motivations before the main conflict develops.";
      }
    }

    if (lowerQuestion.includes('photosynthesis') || lowerQuestion.includes('fotosíntesis')) {
      return "Photosynthesis is the process by which plants convert light energy into chemical energy, requiring chlorophyll, carbon dioxide, and water to produce glucose and oxygen.";
    }

    if (lowerQuestion.includes('equation') || lowerQuestion.includes('solve')) {
      return "To solve this equation, follow the order of operations (PEMDAS/BODMAS) and isolate the variable by performing inverse operations on both sides.";
    }

    if (lowerQuestion.includes('war') || lowerQuestion.includes('battle') || lowerQuestion.includes('revolution')) {
      return "Historical events often have multiple causes and effects. Consider the political, economic, and social factors that led to this outcome.";
    }

    if (lowerQuestion.includes('capital') || lowerQuestion.includes('country') || lowerQuestion.includes('continent')) {
      return "Geographic knowledge requires understanding the relationship between political boundaries, physical features, and cultural regions.";
    }

    return "This answer is correct based on the fundamental principles and established facts in this subject area.";
  };

  const generateIncorrectChoiceReason = (questionText, userAnswer, correctAnswer) => {
    const lowerQuestion = questionText.toLowerCase();
    const lowerUser = userAnswer.toLowerCase();

    if (lowerQuestion.includes('climax') && lowerUser.includes('desenlace')) {
      return "the 'desenlace' (resolution) comes after the climax and resolves the conflict, but doesn't provide initial character information";
    }

    if (lowerQuestion.includes('photosynthesis') && lowerUser.includes('respiration')) {
      return "cellular respiration is the opposite process that breaks down glucose to release energy";
    }

    return "it doesn't align with the established principles or facts relevant to this question";
  };

  const generateTrueFalseReason = (questionText, isCorrectTrue) => {
    const lowerQuestion = questionText.toLowerCase();

    if (lowerQuestion.includes('photosynthesis')) {
      return isCorrectTrue
        ? "photosynthesis does indeed require sunlight, carbon dioxide, and water to produce glucose and oxygen"
        : "the statement contains an error about the photosynthesis process or its requirements";
    }

    if (lowerQuestion.includes('historical') || lowerQuestion.includes('year')) {
      return isCorrectTrue
        ? "this historical fact is accurate according to documented records"
        : "this contradicts established historical evidence and documented facts";
    }

    return isCorrectTrue
      ? "the statement aligns with established facts and principles"
      : "the statement contains factual errors or misconceptions";
  };

  const generateOpenEndedExplanation = (questionText, correctAnswer, userAnswer) => {
    const lowerQuestion = questionText.toLowerCase();

    if (lowerQuestion.includes('explain') || lowerQuestion.includes('describe')) {
      return `A complete answer should include: ${correctAnswer}. ${
        userAnswer ? `Your answer "${userAnswer}" may be partially correct but lacks some key elements or detail.` : ''
      }`;
    }

    if (lowerQuestion.includes('calculate') || lowerQuestion.includes('solve')) {
      return `The calculation requires specific steps and formulas. The final answer is ${correctAnswer}. ${
        userAnswer ? `Your answer "${userAnswer}" may indicate an error in calculation or method.` : ''
      }`;
    }

    return `The expected response is: ${correctAnswer}. Make sure to include all relevant details and supporting information.`;
  };

  const determineQuestionCategory = (questionText) => {
    const lowerText = questionText.toLowerCase();

    if (lowerText.includes('climax') || lowerText.includes('dramática') || lowerText.includes('literature')) return 'Literature';
    if (lowerText.includes('photosynthesis') || lowerText.includes('cell') || lowerText.includes('chemistry')) return 'Science';
    if (lowerText.includes('equation') || lowerText.includes('calculate') || lowerText.includes('solve')) return 'Math';
    if (lowerText.includes('war') || lowerText.includes('historical') || lowerText.includes('revolution')) return 'History';
    if (lowerText.includes('capital') || lowerText.includes('country') || lowerText.includes('continent')) return 'Geography';

    return 'General Knowledge';
  };

  const generateCategorySpecificTip = (category, questionText, correctAnswer) => {
    switch (category.toLowerCase()) {
      case 'literature':
        return "Literary analysis tip: Pay attention to narrative structure elements like exposition, rising action, climax, falling action, and resolution.";
      case 'science':
        return "Science tip: Understand the inputs and outputs of biological processes to identify the correct process.";
      case 'math':
        return "Math tip: Always check your work by substituting your answer back into the original equation.";
      case 'history':
        return "History tip: Consider the chronological sequence of events and cause-and-effect relationships.";
      case 'geography':
        return "Geography tip: Study maps regularly and understand relationships between physical features and cultural regions.";
      default:
        return "General tip: Look for key words in the question that point to the main concept being tested.";
    }
  };

  // Share functionality (keeping your existing share functions)
  const generateShareableQuizData = async () => {
    try {
      const shareableQuiz = {
        id: uuid.v4(),
        title: metadata.title || `${determineCategory(metadata, [], questions)} Quiz`,
        category: determineCategory(metadata, [], questions),
        difficulty: metadata.difficulty || 'medium',
        questions: questions.map(q => ({
          id: q.id,
          text: q.text || q.questionText,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          keywords: q.keywords || [],
          formula: q.formula,
          solution_steps: q.solution_steps || [],
        })),
        metadata: {
          category: determineCategory(metadata, [], questions),
          difficulty: metadata.difficulty || 'medium',
          totalQuestions: questions.length,
          subject: metadata.subject,
          createdAt: new Date().toISOString(),
          sharedBy: 'anonymous',
        }
      };

      await AsyncStorage.setItem(`shared_quiz_${shareableQuiz.id}`, JSON.stringify(shareableQuiz));
      return shareableQuiz;
    } catch (error) {
      logger.error('Error generating shareable quiz data:', error);
      return null;
    }
  };

  const generateDeepLink = (quizId) => {
    const universalLink = `https://${CONFIG.DEEP_LINK_DOMAIN}/quiz/${quizId}`;
    const schemeLink = `${CONFIG.APP_SCHEME}://quiz/${quizId}`;
    
    return {
      universalLink,
      schemeLink,
      webFallback: `${CONFIG.WEB_APP_URL}/quiz/${quizId}`,
    };
  };

  const generateAppDownloadText = () => {
    const appLinks = {
      ios: CONFIG.APP_STORE_URL,
      android: CONFIG.PLAY_STORE_URL,
      web: CONFIG.WEB_APP_URL,
    };

    let downloadText = '\n📱 Don\'t have the app? Get it here:\n';
    
    if (Platform.OS === 'ios') {
      downloadText += `📲 iOS: ${appLinks.ios}\n`;
      downloadText += `🤖 Android: ${appLinks.android}\n`;
    } else {
      downloadText += `🤖 Android: ${appLinks.android}\n`;
      downloadText += `📲 iOS: ${appLinks.ios}\n`;
    }
    
    if (appLinks.web && appLinks.web !== CONFIG.WEB_APP_URL) {
      downloadText += `🌐 Web: ${appLinks.web}\n`;
    }

    return downloadText;
  };

  const generateShareableText = async (includeQuizLink = true) => {
    const category = determineCategory(metadata, [], questions);
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let shareText = `🎯 Quiz Results - ${category}\n`;
    shareText += `📅 ${date} at ${time}\n\n`;
    
    shareText += `📊 PERFORMANCE SUMMARY\n`;
    shareText += `Score: ${score}/${totalQuestions} (${percentage}%)\n`;
    shareText += `Level: ${performance.level} ${getPerformanceEmoji(performance.level)}\n\n`;
    
    if (coachMessage) {
      shareText += `🤖 AI COACH INSIGHTS\n`;
      shareText += `${coachMessage.message}\n\n`;
      
      if (coachMessage.suggestions && coachMessage.suggestions.length > 0) {
        shareText += `💡 Quick Tips:\n`;
        coachMessage.suggestions.forEach((tip, index) => {
          shareText += `${index + 1}. ${tip}\n`;
        });
        shareText += `\n`;
      }
    }
    
    shareText += `📝 SAMPLE QUESTIONS\n`;
    questions.slice(0, 3).forEach((question, index) => {
      const userAns = userAnswers[question.id];
      const status = question.isCorrect ? '✅' : '❌';
      shareText += `${index + 1}. ${status} ${(question.text || question.questionText).substring(0, 80)}${(question.text || question.questionText).length > 80 ? '...' : ''}\n`;
    });
    
    if (questions.length > 3) {
      shareText += `... and ${questions.length - 3} more questions!\n\n`;
    } else {
      shareText += `\n`;
    }

    if (includeQuizLink) {
      try {
        const shareableQuiz = await generateShareableQuizData();
        if (shareableQuiz) {
          const deepLinks = generateDeepLink(shareableQuiz.id);
          
          shareText += `🎮 CHALLENGE YOURSELF!\n`;
          shareText += `Think you can beat my score? Take the same quiz:\n`;
          shareText += `👉 ${deepLinks.universalLink}\n\n`;
          
          shareText += `💪 Challenge your friends and see who's the smartest!\n`;
          shareText += generateAppDownloadText();
        }
      } catch (error) {
        logger.error('Error adding quiz link to share text:', error);
      }
    }
    
    shareText += `\n🚀 Keep learning and improving!`;
    shareText += `\n\n#QuizChallenge #Learning #StudyBuddy #BrainTraining`;
    
    return shareText;
  };

  const getPerformanceEmoji = (level) => {
    switch (level) {
      case 'Excellent': return '🏆';
      case 'Great': return '⭐';
      case 'Good': return '👍';
      case 'Fair': return '👌';
      default: return '🌱';
    }
  };

  const shareToSocial = async () => {
    try {
      if (!Share || typeof Share.open !== 'function') {
        await fallbackShare();
        return;
      }
      
      const shareText = await generateShareableText(true);
      const shareOptions = {
        title: 'Quiz Challenge! 🎯',
        message: shareText,
        subject: `I scored ${percentage}% on this ${determineCategory(metadata, [], questions)} quiz! Can you beat me?`,
        url: '',
      };
      
      await Share.open(shareOptions);
    } catch (error) {
      if (error.message !== 'User did not share') {
        logger.error('Error sharing to social:', error);
        await fallbackShare();
      }
    }
  };

  const fallbackShare = async () => {
    try {
      const shareText = await generateShareableText(true);
      
      const { Share: NativeShare } = require('react-native');
      await NativeShare.share({
        message: shareText,
        title: 'Quiz Challenge! 🎯',
      });
    } catch (error) {
      logger.error('Fallback share failed:', error);
      Alert.alert(
        'Share Results 📋', 
        'Would you like to copy your results to share manually?',
        [
          { text: 'Copy Results', onPress: () => copyToClipboard(false) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const shareQuizChallenge = async () => {
    try {
      const shareableQuiz = await generateShareableQuizData();
      if (!shareableQuiz) {
        Alert.alert('Error', 'Unable to create shareable quiz. Please try again.');
        return;
      }

      const deepLinks = generateDeepLink(shareableQuiz.id);
      const category = determineCategory(metadata, [], questions);
      
      let challengeText = `🎯 QUIZ CHALLENGE!\n\n`;
      challengeText += `I just completed a ${category} quiz and scored ${percentage}%!\n\n`;
      challengeText += `💪 Think you can beat my score?\n`;
      challengeText += `Take the same ${totalQuestions}-question quiz and find out!\n\n`;
      challengeText += `👉 TAP HERE TO START:\n${deepLinks.universalLink}\n\n`;
      challengeText += `🏆 Let's see who's the real quiz champion!\n`;
      challengeText += generateAppDownloadText();
      challengeText += `\n#QuizChallenge #BrainGame #Challenge #${category}`;

      if (Share && typeof Share.open === 'function') {
        await Share.open({
          title: `Beat My ${category} Quiz Score!`,
          message: challengeText,
          subject: `Quiz Challenge - Can you beat ${percentage}%?`,
        });
      } else {
        const { Share: NativeShare } = require('react-native');
        await NativeShare.share({
          message: challengeText,
          title: `Beat My ${category} Quiz Score!`,
        });
      }
    } catch (error) {
      logger.error('Error sharing quiz challenge:', error);
      Alert.alert('Share Error', 'Unable to share quiz challenge. Please try again.');
    }
  };

  // Save quiz for later viewing
  const saveQuizForLater = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to save quizzes.');
        return;
      }

      const savedQuizData = {
        id: `saved_quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${metadata?.subject || 'General'} Quiz - ${new Date().toLocaleDateString()}`,
        questions: questions.map(q => ({
          id: q.id,
          text: q.text || q.questionText,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          userAnswer: userAnswers[q.id],
          isCorrect: q.isCorrect,
          keywords: q.keywords || [],
          difficulty: q.difficulty || metadata?.difficulty || 'medium'
        })),
        metadata: {
          ...metadata,
          savedDate: new Date().toISOString(),
          totalQuestions,
          score,
          percentage,
          category: determineCategory(metadata, [], questions),
          completionTime: metadata?.completionTime || null
        },
        userAnswers,
        results: {
          score,
          totalQuestions,
          percentage,
          correctCount,
          incorrectCount,
          weaknessAnalysis
        }
      };

      // Save to AsyncStorage (use the same key as quiz history)
      const quizHistoryKey = `quizHistory_${user.uid}`;
      const existingHistory = await AsyncStorage.getItem(quizHistoryKey);
      const quizHistory = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Add completion metadata to match quiz history format
      savedQuizData.metadata.completedAt = new Date().toISOString();
      savedQuizData.results.completedAt = new Date().toISOString();
      
      quizHistory.unshift(savedQuizData);
      
      // Keep only the last 100 quizzes in history
      if (quizHistory.length > 100) {
        quizHistory.splice(100);
      }
      
      await AsyncStorage.setItem(quizHistoryKey, JSON.stringify(quizHistory));
      
      Alert.alert(
        '✅ Quiz Saved!',
        'This quiz has been saved to your collection. You can view all your saved quizzes from the home screen.',
        [
          { text: 'View Saved Quizzes', onPress: () => navigation.navigate('QuizHistory') },
          { text: 'OK' }
        ]
      );
      
    } catch (error) {
      logger.error('Error saving quiz:', error);
      Alert.alert('Error', 'Failed to save quiz. Please try again.');
    }
  };

  const copyToClipboard = async (detailed = false) => {
    try {
      const textToCopy = await generateShareableText(!detailed);
      
      if (Clipboard && typeof Clipboard.setString === 'function') {
        await Clipboard.setString(textToCopy);
        Alert.alert(
          'Copied! 📋',
          'Results with quiz link copied to clipboard',
          [{ text: 'OK' }]
        );
      } else {
        try {
          const { Clipboard: NativeClipboard } = require('react-native');
          NativeClipboard.setString(textToCopy);
          Alert.alert(
            'Copied! 📋',
            'Results with quiz link copied to clipboard',
            [{ text: 'OK' }]
          );
        } catch (clipboardError) {
          logger.error('Clipboard error:', clipboardError);
          Alert.alert(
            'Copy Results 📋', 
            textToCopy,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      logger.error('Error copying to clipboard:', error);
      Alert.alert('Copy Error', 'Unable to copy results. Please try again.');
    }
  };

  const showShareOptionsWithChallenge = () => {
    Alert.alert(
      'Share Your Results! 🚀',
      'How would you like to share your quiz results?',
      [
        { text: 'Share Results + Quiz Link', onPress: shareToSocial },
        { text: 'Copy with Link', onPress: () => copyToClipboard(false) },
        { text: 'Copy Results Only', onPress: () => copyResultsOnly() },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const copyResultsOnly = async () => {
    try {
      const textToCopy = await generateShareableText(false);
      
      if (Clipboard && typeof Clipboard.setString === 'function') {
        await Clipboard.setString(textToCopy);
      } else {
        const { Clipboard: NativeClipboard } = require('react-native');
        NativeClipboard.setString(textToCopy);
      }
      
      Alert.alert(
        'Copied! 📋',
        'Results copied to clipboard (without quiz link)',
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error('Error copying results only:', error);
      Alert.alert('Copy Error', 'Unable to copy results. Please try again.');
    }
  };

  // 🚀 NEW: Enhanced explanation generation for all incorrect questions
  const generateAllEnhancedExplanations = async () => {
    if (incorrectQuestions.length === 0) {
      Alert.alert('Perfect Score!', 'Great job! All answers were correct, so no explanations are needed.');
      return;
    }

    setLoadingExplanations(true);

    try {
      // Get current tier before using it
      const currentTier = await EnhancedExplanationService.getCurrentTier();
      
      const enhancedExplanations = {};
      
      // Generate explanations for all incorrect questions
      for (const question of incorrectQuestions) {
        try {
          const userAnswer = userAnswers[question.id];
          const correctAnswer = question.correctAnswer;
          
          const enhancedExplanation = await EnhancedExplanationService.getEnhancedExplanation(
            {
              question: question.text || question.questionText,
              questionText: question.text || question.questionText,
              subject: determineQuestionCategory(question.text || question.questionText),
              difficulty: question.difficulty || metadata.difficulty || 'medium',
              options: question.options || [],
              id: question.id
            },
            userAnswer,
            correctAnswer
          );

          enhancedExplanations[question.id] = enhancedExplanation;
        } catch (error) {
          logger.error(`Error generating explanation for question ${question.id}:`, error);
          // Use local explanation as fallback
          const userAnswer = userAnswers[question.id];
          const localExplanation = generateLocalExplanation(question, userAnswer);
          enhancedExplanations[question.id] = {
            type: 'fallback',
            tier: 0,
            sections: {
              whyWrong: localExplanation,
              correctReasoning: `The correct answer is: ${question.correctAnswer}`,
              keyPoints: ['Review this topic area', 'Practice similar questions']
            }
          };
        }
      }

      setExplanations(enhancedExplanations);
      setShowExplanations(true);

      // Update usage stats
      const updatedStats = await EnhancedExplanationService.getUsageStats();
      setUsageStats(updatedStats);

      Alert.alert(
        '✨ Enhanced Explanations Ready!',
        `Generated ${Object.keys(enhancedExplanations).length} AI-powered explanations using Tier ${currentTier}. Tap any incorrect answer to view detailed insights.`,
        [{ text: 'Got it!' }]
      );

    } catch (error) {
      logger.error('Error generating all explanations:', error);
      Alert.alert('Error', 'Failed to generate enhanced explanations. Please try again.');
    } finally {
      setLoadingExplanations(false);
    }
  };

  const generateCoachMessage = async () => {
    if (!CONFIG.ENABLE_AI_COACH) return;

    setLoadingCoachMessage(true);

    try {
      const coachData = {
        currentQuiz: {
          score,
          totalQuestions,
          percentage,
          questions,
          category: determineCategory(metadata, [], questions),
          difficulty: metadata.difficulty || 'medium',
        }
      };

      const message = generateLocalCoachMessage(coachData);

      if (isMountedRef.current) {
        setCoachMessage(message);
      }
    } catch (error) {
      logger.error('Error generating coach message:', error);
    } finally {
      if (isMountedRef.current) {
        setLoadingCoachMessage(false);
      }
    }
  };

  const generateLocalCoachMessage = (coachData) => {
    const { currentQuiz } = coachData;
    let message = '';
    let messageType = 'encouraging';
    let suggestions = [];
    let nextSteps = [];

    if (currentQuiz.percentage >= 90) {
      message = `🌟 Outstanding work! You crushed this ${currentQuiz.category} quiz with ${currentQuiz.percentage}%! `;
      messageType = 'celebration';
    } else if (currentQuiz.percentage >= 80) {
      message = `🎉 Great job! You scored ${currentQuiz.percentage}% on this ${currentQuiz.category} quiz! `;
      messageType = 'praise';
    } else if (currentQuiz.percentage >= 70) {
      message = `👍 Good effort! You got ${currentQuiz.percentage}% on this ${currentQuiz.category} quiz. `;
      messageType = 'encouraging';
    } else if (currentQuiz.percentage >= 60) {
      message = `💪 Keep pushing! You scored ${currentQuiz.percentage}% - there's room for improvement! `;
      messageType = 'motivating';
    } else {
      message = `🌱 Every expert was once a beginner! This ${currentQuiz.category} quiz was challenging. `;
      messageType = 'supportive';
    }

    if (currentQuiz.percentage >= 80) {
      suggestions = ['Continue building on your strengths', 'Try harder difficulty levels', 'Explore related topics'];
      nextSteps = ['Try a harder difficulty level', 'Explore a new subject area', 'Challenge yourself with timed quizzes'];
    } else if (currentQuiz.percentage >= 60) {
      suggestions = ['Review missed questions', 'Practice similar questions', 'Focus on one area at a time'];
      nextSteps = ['Review missed questions', 'Practice similar questions', 'Focus on one weak area'];
    } else {
      suggestions = ['Start with fundamentals', 'Take your time', 'Practice regularly'];
      nextSteps = [
        'Start with easier questions to build confidence',
        'Study the fundamentals of this topic',
        'Take your time - understanding beats speed',
      ];
    }

    message += `Consistent practice leads to mastery. You've got this! 🚀`;

    return {
      message: message.trim(),
      type: messageType,
      suggestions: suggestions.slice(0, 3),
      nextSteps: nextSteps.slice(0, 3),
      performanceLevel: currentQuiz.percentage >= 80 ? 'excellent' : currentQuiz.percentage >= 60 ? 'good' : 'developing',
    };
  };

  // Theme listener
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  // ✅ IMPROVED: Main effect with better error handling and logging
  useEffect(() => {
    logger.info('📊 ResultsScreen useEffect triggered');
    
    // Animate score counter
    const listener = scoreAnimation.addListener(({ value }) => {
      if (isMountedRef.current) {
        setAnimatedPercentageValue(Math.round(value));
      }
    });

    Animated.timing(scoreAnimation, {
      toValue: percentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Celebration animation
    if (percentage >= 80) {
      Animated.sequence([
        Animated.delay(800),
        Animated.spring(celebrationScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      celebrationScale.setValue(1);
    }

    // Generate AI Coach message and run analysis
    const runPostQuizAnalysis = async () => {
      try {
        if (CONFIG.ENABLE_AI_COACH) {
          await generateCoachMessage();
        }
        
        // Run completion analysis after a brief delay
        setTimeout(() => {
          handleQuizCompletion();
        }, 1000);
        
      } catch (error) {
        logger.error('❌ Error in post-quiz analysis:', error);
      }
    };

    runPostQuizAnalysis();

    return () => {
      isMountedRef.current = false;
      scoreAnimation.removeListener(listener);
      cancelTokenSource.current.cancel('Component unmounted');
    };
  }, [scoreAnimation, celebrationScale, percentage]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setShowExplanations(false);
      setExplanations({});
      setCoachMessage(null);
      setShowCoachTips(false);
      if (CONFIG.ENABLE_AI_COACH) {
        await generateCoachMessage();
      }
    } catch (error) {
      logger.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const currentThemeStyles = isDarkMode ? darkStyles : lightStyles;
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

  const getPerformanceLevelColor = level => {
    switch (level) {
      case 'excellent':
        return '#28a745';
      case 'good':
        return '#17a2b8';
      case 'developing':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const requestCoachingTip = async (topic) => {
    setLoadingCoachMessage(true);
    try {
      const tipMessage = generateTopicSpecificTip(topic);
      setCoachMessage(tipMessage);
      setShowCoachTips(true);
    } catch (error) {
      logger.error('Error generating coaching tip:', error);
    } finally {
      setLoadingCoachMessage(false);
    }
  };

  const generateTopicSpecificTip = (topic) => {
    const tips = {
      Math: {
        message: "🧮 Math mastery comes from practice and pattern recognition. Break complex problems into smaller steps.",
        suggestions: ['Practice mental math daily', 'Learn one new formula per week', 'Solve problems step-by-step'],
      },
      Science: {
        message: "🔬 Science is about understanding processes. Connect concepts to real-world examples.",
        suggestions: ['Watch science documentaries', 'Do hands-on experiments', 'Create concept maps'],
      },
      Literature: {
        message: "📚 Literature analysis improves with active reading. Note narrative structure and themes.",
        suggestions: ['Read diverse genres', 'Keep a reading journal', 'Discuss books with others'],
      },
      History: {
        message: "🏛️ History is about cause and effect. Create timelines and connect events to modern situations.",
        suggestions: ['Create visual timelines', 'Study primary sources', 'Connect past to present'],
      },
      Geography: {
        message: "🌍 Geography combines physical and cultural understanding. Study maps and climate patterns.",
        suggestions: ['Study world maps daily', 'Learn about different cultures', 'Understand climate patterns'],
      },
    };

    return (
      tips[topic] || {
        message: "🎯 Focused study and consistent practice are key to mastery in any subject.",
        suggestions: ['Set daily study goals', 'Use active recall techniques', 'Track your progress'],
      }
    );
  };

  const speakCoachMessage = message => {
    if (!CONFIG.ENABLE_VOICE_FEEDBACK) return;
    Alert.alert('Voice Feature', 'Text-to-speech would read the coach message here.');
  };

  // ✅ IMPROVED: Components with better error handling and fallbacks
  const Header = () => (
    <Animatable.View animation="fadeInDown" duration={800} style={styles.headerContainer}>
      <SafeBackButton 
        style={[styles.backButton, currentThemeStyles.backButton]}
        color={currentThemeStyles.backButtonText?.color || '#1A2C5B'}
        size={20}
      />
      <Animatable.View animation="fadeIn" delay={300} style={styles.titleSection}>
        <Animated.View
          style={[styles.titleIcon, currentThemeStyles.titleIcon, { transform: [{ scale: celebrationScale }] }]}
        >
          <FontAwesome5 name={performance.icon} size={32} color={performance.color || '#D4AF37'} />
        </Animated.View>
        <Text style={[styles.title, currentThemeStyles.title]}>Quiz Results</Text>
        <Text style={[styles.subtitle, currentThemeStyles.subtitle]}>Your learning progress summary</Text>
      </Animatable.View>
    </Animatable.View>
  );

  // ✅ ENHANCED: AI-powered weakness insight card showing intelligent analysis
  const WeaknessInsightCard = () => {
    if (!weaknessAnalysis || weaknessAnalysis.length === 0) return null;

    const topWeakness = weaknessAnalysis[0];
    if (!topWeakness) return null;

    // Get AI insights from the weakness analysis
    const aiInsights = topWeakness.aiAnalysis || [];
    const hasAIInsights = aiInsights.length > 0;
    const mostCommonMistakeType = hasAIInsights ? getMostCommonMistakeType(aiInsights) : null;
    const granularTopics = hasAIInsights ? getGranularTopics(aiInsights) : [];

    // Generate context-aware recommendation
    const getAIRecommendation = () => {
      if (!hasAIInsights) {
        return `Strengthen your understanding of ${topWeakness.topic?.replace(/_/g, ' ') || 'this area'}`;
      }

      switch (mostCommonMistakeType) {
        case 'conceptual':
          return `💡 Work on core concepts in ${topWeakness.topic?.replace(/_/g, ' ')}`;
        case 'procedural':
          return `⚙️ Practice step-by-step processes for ${topWeakness.topic?.replace(/_/g, ' ')}`;
        case 'factual':
          return `📚 Review key facts about ${topWeakness.topic?.replace(/_/g, ' ')}`;
        case 'analytical':
          return `🧠 Develop analytical skills for ${topWeakness.topic?.replace(/_/g, ' ')}`;
        default:
          return `🎯 Focus on ${topWeakness.topic?.replace(/_/g, ' ')} fundamentals`;
      }
    };

    // Helper functions (these would ideally be moved to utils)
    const getMostCommonMistakeType = (aiAnalyses) => {
      if (!aiAnalyses.length) return null;
      const types = {};
      aiAnalyses.forEach(analysis => {
        types[analysis.mistakeType] = (types[analysis.mistakeType] || 0) + 1;
      });
      return Object.entries(types).reduce((a, b) => types[a[0]] > types[b[0]] ? a : b)[0];
    };

    const getGranularTopics = (aiAnalyses) => {
      return [...new Set(aiAnalyses.map(analysis => analysis.granularTopic))].slice(0, 2);
    };

    return (
      <Animatable.View animation="fadeInUp" delay={1200} style={[styles.insightCard, currentThemeStyles.insightCard]}>
        <View style={styles.insightHeader}>
          <FontAwesome5 name="brain" size={20} color={currentThemeStyles.insightTitle?.color || '#D4AF37'} />
          <Text style={[styles.insightTitle, currentThemeStyles.insightTitle]}>
            {hasAIInsights ? 'AI-Powered Analysis' : 'Alexandria\'s Focus Area'}
          </Text>
        </View>
        
        <Text style={[styles.insightText, currentThemeStyles.insightText]}>
          <Text style={{fontWeight: 'bold'}}>{topWeakness.topic?.replace(/_/g, ' ') || 'General'}</Text>
        </Text>
        
        <Text style={[styles.insightDetail, currentThemeStyles.insightDetail]}>
          Accuracy: <Text style={{fontWeight: 'bold'}}>{((100 - (topWeakness.severity || 0)).toFixed(0))}%</Text> • 
          {hasAIInsights && mostCommonMistakeType && (
            <> Gap Type: <Text style={{fontWeight: 'bold'}}>{mostCommonMistakeType}</Text></>
          )}
        </Text>

        {/* AI Recommendation */}
        <View style={[styles.aiRecommendationBox, currentThemeStyles.aiRecommendationBox]}>
          <FontAwesome5 name="lightbulb" size={14} color={currentThemeStyles.insightTitle?.color || '#D4AF37'} />
          <Text style={[styles.aiRecommendationText, currentThemeStyles.aiRecommendationText]}>
            {getAIRecommendation()}
          </Text>
        </View>

        {/* Granular topics if available */}
        {granularTopics.length > 0 && (
          <View style={styles.granularTopicsContainer}>
            <Text style={[styles.granularTopicsLabel, currentThemeStyles.granularTopicsLabel]}>
              Specific areas:
            </Text>
            <View style={styles.topicsRow}>
              {granularTopics.map((topic, index) => (
                <View key={index} style={[styles.topicTag, currentThemeStyles.topicTag]}>
                  <Text style={[styles.topicTagText, currentThemeStyles.topicTagText]}>
                    {topic?.replace(/_/g, ' ') || 'General'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.focusQuizButton, currentThemeStyles.focusQuizButton]}
          onPress={() => requestFocusQuiz(topWeakness)}
        >
          <FontAwesome5 name="book-reader" size={16} color={currentThemeStyles.focusQuizButtonText?.color || '#FFFFFF'} />
          <Text style={[styles.focusQuizButtonText, currentThemeStyles.focusQuizButtonText]}>
            Generate Focus Quiz
          </Text>
        </TouchableOpacity>
        
        {/* Subject Correction Button */}
        <TouchableOpacity
          style={[styles.subjectCorrectionButton, currentThemeStyles.subjectCorrectionButton]}
          onPress={() => setShowSubjectCorrection(true)}
        >
          <FontAwesome5 name="edit" size={14} color="#D4AF37" />
          <Text style={[styles.subjectCorrectionText, currentThemeStyles.subjectCorrectionText]}>
            Wrong subject? Correct it
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

const ScoreCard = () => (
  <Animatable.View animation="bounceIn" delay={600} style={[styles.scoreCard, currentThemeStyles.scoreCard]}>
    {/* Performance Badge - Centered at top */}
    <View style={[styles.performanceBadge, { backgroundColor: '#D4AF37' }]}>
      <Text style={styles.performanceText}>{performance.level}</Text>
    </View>
    
    {/* Main Score Display - Large and prominent */}
    <View style={styles.scoreDisplay}>
      <Text style={[styles.scoreNumberLarge, currentThemeStyles.scoreNumber]}>
        {animatedPercentageValue}%
      </Text>
      <Text style={[styles.scoreLabelLarge, currentThemeStyles.scoreLabel]}>
        {score} out of {totalQuestions} correct
      </Text>
      
      {/* Progress Bar - Stunning gradient visualization */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor: currentThemeStyles.cardBackground?.backgroundColor === '#1F2937' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${percentage}%` }
            ]}
          >
            <LinearGradient
              colors={getProgressGradientColors(percentage)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBarGradient}
            />
          </View>
        </View>
      </View>
    </View>
    
    {/* Inline Stats - Side by side with icons */}
    <View style={styles.inlineStatsRow}>
      <View style={styles.inlineStatItem}>
        <View style={styles.statIconContainer}>
          <Text style={[styles.statIcon, { color: '#014421' }]}>✓</Text>
        </View>
        <Text style={[styles.inlineStatText, { color: '#014421' }]}>
          {correctCount} Correct
        </Text>
      </View>
      
      <View style={styles.inlineStatItem}>
        <View style={styles.statIconContainer}>
          <Text style={[styles.statIcon, { color: '#800020' }]}>✗</Text>
        </View>
        <Text style={[styles.inlineStatText, { color: '#800020' }]}>
          {incorrectCount} Incorrect
        </Text>
      </View>
    </View>
    
    {/* Motivational Message - Centered and stylized */}
    <Text style={[styles.motivationalMessageLarge, { color: currentThemeStyles.subtitle?.color || '#666' }]}>
      {getMotivationalMessage(percentage)}
    </Text>
    
    {/* Enhanced Analytics Summary - Smaller and subtle */}
    {metadata.updatedStats && (
      <View style={styles.analyticsStatsRowCompact}>
        <Text style={[styles.analyticsCompactText, { color: currentThemeStyles.subtitle?.color }]}>
          Overall Accuracy: {Math.round((metadata.updatedStats.overall_accuracy || 0) * 100)}% • Total Quizzes: {metadata.updatedStats.total_quizzes || 0}
        </Text>
      </View>
    )}
  </Animatable.View>
);

  // Add this new component after ScoreCard:
const AnalyticsSection = () => {
  if (loadingAnalytics) {
    return (
      <View style={[styles.loadingContainer, currentThemeStyles.questionCard]}>
        <ActivityIndicator size="small" color={currentThemeStyles.title?.color || '#1A2C5B'} />
        <Text style={[styles.loadingText, currentThemeStyles.subtitle]}>
          Loading AI insights...
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Achievement Summary */}
      {analyticsAchievements.length > 0 && (
        <AchievementSummaryCard
          achievements={analyticsAchievements}
          visible={true}
          isDarkMode={isDarkMode}
          onViewAll={() => {
            // Navigate to achievements screen or show all achievements
            logger.info('View all achievements tapped');
          }}
        />
      )}

      {/* Learning Insights */}
      {analyticsInsights.length > 0 && (
        <InsightsDisplay
          insights={analyticsInsights}
          visible={true}
          isDarkMode={isDarkMode}
          onInsightTap={(insight) => {
            // Handle insight tap - could show detailed view
            logger.info('Insight tapped:', insight);
            Alert.alert(
              insight.title,
              insight.message + '\n\n' + 
              (insight.recommendations?.join('\n• ') || ''),
              [{ text: 'Got it!' }]
            );
          }}
        />
      )}

      {/* Enhanced User Profile Stats */}
      {userProfile && (
        <Animatable.View animation="fadeInUp" delay={800}>
          <View style={[styles.profileStatsCard, currentThemeStyles.questionCard]}>
            <View style={styles.profileHeader}>
              <FontAwesome5 name="user-graduate" size={20} color={currentThemeStyles.insightTitle?.color || '#D4AF37'} />
              <Text style={[styles.profileTitle, currentThemeStyles.insightTitle]}>
                Your Learning Journey
              </Text>
            </View>
            
            <View style={styles.profileStatsGrid}>
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, currentThemeStyles.title]}>
                  {userProfile.current_streak || 0}
                </Text>
                <Text style={[styles.profileStatLabel, currentThemeStyles.subtitle]}>
                  Current Streak
                </Text>
              </View>
              
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, currentThemeStyles.title]}>
                  {userProfile.total_achievement_points || 0}
                </Text>
                <Text style={[styles.profileStatLabel, currentThemeStyles.subtitle]}>
                  Total XP
                </Text>
              </View>
              
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, currentThemeStyles.title]}>
                  {userProfile.performance_level || 'Beginner'}
                </Text>
                <Text style={[styles.profileStatLabel, currentThemeStyles.subtitle]}>
                  Level
                </Text>
              </View>
            </View>
            
            {/* Subject Progress Preview */}
            {userProfile.subject_accuracies && Object.keys(userProfile.subject_accuracies).length > 0 && (
              <View style={styles.subjectProgress}>
                <Text style={[styles.subjectProgressTitle, currentThemeStyles.explanationTitle]}>
                  Subject Mastery
                </Text>
                {Object.entries(userProfile.subject_accuracies)
                  .slice(0, 3)
                  .map(([subject, accuracy]) => (
                    <View key={subject} style={styles.subjectProgressItem}>
                      <Text style={[styles.subjectName, currentThemeStyles.text]}>
                        {subject.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { backgroundColor: currentThemeStyles.borderSecondary?.color || 'rgba(0,0,0,0.1)' }]}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${Math.round(accuracy * 100)}%`,
                                backgroundColor: currentThemeStyles.insightTitle?.color || '#D4AF37'
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.progressPercentage, currentThemeStyles.subtitle]}>
                          {Math.round(accuracy * 100)}%
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </Animatable.View>
      )}
    </>
  );
};

  // 🚀 NEW: Enhanced usage stats card
  const UsageStatsCard = () => {
    if (!usageStats) return null;

    return (
      <Animatable.View animation="fadeInUp" delay={1000} style={[styles.usageCard, currentThemeStyles.explanationContainer]}>
        <View style={styles.usageHeader}>
          <FontAwesome5 name="chart-line" size={16} color={currentThemeStyles.insightTitle?.color || '#3B82F6'} />
          <Text style={[styles.usageTitle, currentThemeStyles.explanationTitle]}>
            AI Explanations (Basic)
          </Text>
        </View>
        
        <View style={styles.usageProgress}>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageBarFill, 
                { 
                  width: `${(usageStats?.percentageUsed || 0)}%`,
                  backgroundColor: (usageStats?.percentageUsed || 0) > 80 ? '#dc3545' : '#3B82F6'
                }
              ]} 
            />
          </View>
          <Text style={[styles.usageText, currentThemeStyles.explanationText]}>
            {usageStats?.todayUsage || 0}/{usageStats?.maxUsage || 20} explanations today
          </Text>
        </View>
      </Animatable.View>
    );
  };

  const QuestionResult = ({ question, index }) => {
    if (!question) return null;

    const userAns = userAnswers[question.id];
    const isMultiUserAns = Array.isArray(userAns);

    // Debug logging for true/false questions
    if (question.type === 'true_false') {
      logger.info(`🔍 True/False Debug - Question ${index + 1}:`, {
        questionId: question.id,
        userAns: userAns,
        userAnsType: typeof userAns,
        correctAnswer: question.correctAnswer,
        correctAnswerType: typeof question.correctAnswer,
        isCorrect: question.isCorrect
      });
    }

    let displayCorrectAnswer = '';
    if (question.type === 'short' || question.type === 'open_ended' || question.type === 'math') {
      displayCorrectAnswer = question.correctAnswer || 'N/A';
    } else if (question.type === 'true_false') {
      // Handle true/false questions properly with normalization
      const normalizedCorrectAnswer = normalizeAnswer(question.correctAnswer);
      displayCorrectAnswer = normalizedCorrectAnswer === 'true' ? 'True' : 'False';
    } else if (question.options && Array.isArray(question.options)) {
      if (question.type === 'multiple_choice') {
        const correctOption = question.options.find(opt => opt?.label === question.correctAnswer);
        if (correctOption) {
          displayCorrectAnswer = correctOption.text || correctOption.value || question.correctAnswer;
        } else {
          displayCorrectAnswer =
            question.options.filter(o => o?.isCorrect).map(o => o?.text || o?.value).join(', ') ||
            question.correctAnswer;
        }
      }
    } else {
      displayCorrectAnswer = question.correctAnswer || 'N/A';
    }

    let displayUserAnswer = '';
    if (isMultiUserAns) {
      displayUserAnswer = userAns.length > 0 ? userAns.join(', ') : '—';
    } else {
      if (question.type === 'multiple_choice' && question.options && Array.isArray(question.options)) {
        const selectedOption = question.options.find(opt => opt?.label === userAns);
        displayUserAnswer = selectedOption ? selectedOption.text || selectedOption.value : userAns || '—';
      } else if (question.type === 'true_false') {
        // Enhanced true/false display with proper normalization
        const normalizedUserAnswer = normalizeAnswer(userAns);
        
        if (normalizedUserAnswer === 'true') {
          displayUserAnswer = 'True';
        } else if (normalizedUserAnswer === 'false') {
          displayUserAnswer = 'False';
        } else {
          displayUserAnswer = userAns ? String(userAns) : '—';
        }
      } else {
        displayUserAnswer = userAns || '—';
      }
    }

    const isCorrect = question.isCorrect;
    const hasEnhancedExplanation = explanations[question.id] && explanations[question.id].type !== 'fallback';
    const isLoadingThisExplanation = loadingSpecificExplanation === question.id;

    return (
      <Animatable.View
        animation="slideInUp"
        delay={800 + index * 100}
        style={[styles.questionCard, currentThemeStyles.questionCard, isCorrect ? currentThemeStyles.correctCard : currentThemeStyles.incorrectCard]}
        key={question.id}
      >
        <View style={styles.questionHeader}>
          <View
            style={[styles.questionNumber, currentThemeStyles.questionNumber, isCorrect ? currentThemeStyles.correctNumber : currentThemeStyles.incorrectNumber]}
          >
            <Text
              style={[styles.questionNumberText, isCorrect ? currentThemeStyles.correctNumberText : currentThemeStyles.incorrectNumberText]}
            >
              {index + 1}
            </Text>
          </View>
          <View style={[styles.resultIndicator, isCorrect ? styles.correctIndicator : styles.incorrectIndicator]}>
            <FontAwesome5 name={isCorrect ? 'check' : 'times'} size={16} color="#FFFFFF" />
          </View>
        </View>
        
        <Text style={[styles.questionText, currentThemeStyles.questionText]}>{question.text || question.questionText}</Text>
        
        <View style={styles.answerSection}>
          <Text style={[styles.answerLabel, currentThemeStyles.answerLabel]}>Your Answer:</Text>
          <Text
            style={[styles.userAnswer, isCorrect ? styles.correctAnswer : styles.incorrectAnswer, !isCorrect && styles.strikeThrough]}
          >
            {displayUserAnswer}
          </Text>
        </View>
        
        {!isCorrect && (
          <View style={styles.answerSection}>
            <Text style={[styles.answerLabel, currentThemeStyles.answerLabel]}>Correct Answer:</Text>
            <Text style={[styles.correctAnswerDisplay, currentThemeStyles.correctAnswerDisplay]}>{displayCorrectAnswer}</Text>
          </View>
        )}


        {question.type === 'math' && question.solution_steps && Array.isArray(question.solution_steps) && question.solution_steps.length > 0 && (
          <View style={[styles.solutionContainer, currentThemeStyles.solutionContainer]}>
            <Text style={[styles.solutionTitle, currentThemeStyles.solutionTitle]}>Solution Steps:</Text>
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
    <View style={styles.actionButtonsContainer}>
      <View style={styles.enhancedActionsRow}>
        <TouchableOpacity
          style={[styles.enhancedActionButton, currentThemeStyles.explanationButton]}
          onPress={() => {
            if (showExplanations) {
              setShowExplanations(false);
            } else {
              generateAllEnhancedExplanations();
            }
          }}
          disabled={loadingExplanations}
          activeOpacity={0.8}
        >
          {loadingExplanations ? (
            <ActivityIndicator size="small" color={currentThemeStyles.explanationButtonText?.color || '#D4AF37'} />
          ) : (
            <FontAwesome5
              name={showExplanations ? 'eye-slash' : 'magic'}
              size={18}
              color={currentThemeStyles.explanationButtonText?.color || '#D4AF37'}
            />
          )}
          <Text style={[styles.enhancedButtonText, currentThemeStyles.explanationButtonText]}>
            {loadingExplanations ? 'Analyzing All Questions...' : showExplanations ? 'Hide All Analyses' : '🧠 Analyze All Wrong Answers'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.enhancedActionButton, currentThemeStyles.saveQuizButton]}
          onPress={saveQuizToHistory}
          disabled={savingQuiz}
          activeOpacity={0.8}
        >
          {savingQuiz ? (
            <ActivityIndicator size="small" color={currentThemeStyles.saveQuizButtonText?.color || '#1A2C5B'} />
          ) : (
            <FontAwesome5 name="save" size={18} color={currentThemeStyles.saveQuizButtonText?.color || '#1A2C5B'} />
          )}
          <Text style={[styles.enhancedButtonText, currentThemeStyles.saveQuizButtonText]}>
            {savingQuiz ? 'Saving...' : 'Save with Analytics'}
          </Text>
        </TouchableOpacity>
      </View>

      {CONFIG.ENABLE_SHARE_FEATURES && (
        <View style={styles.enhancedActionsRow}>
          <TouchableOpacity
            style={[styles.enhancedActionButton, currentThemeStyles.shareButton]}
            onPress={showShareOptionsWithChallenge}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="share-alt" size={18} color={currentThemeStyles.shareButtonText?.color || '#17a2b8'} />
            <Text style={[styles.enhancedButtonText, currentThemeStyles.shareButtonText]}>
              Share & Challenge
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enhancedActionButton, currentThemeStyles.copyButton]}
            onPress={saveQuizForLater}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="bookmark" size={18} color={currentThemeStyles.copyButtonText?.color || '#28a745'} />
            <Text style={[styles.enhancedButtonText, currentThemeStyles.copyButtonText]}>
              Save Quiz
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionButton, styles.primaryButton, currentThemeStyles.primaryButton]}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <FontAwesome5 name="home" size={20} color={currentThemeStyles.primaryButtonText?.color || '#FFFFFF'} />
        <Text style={[styles.buttonText, currentThemeStyles.primaryButtonText]}>Back to Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton, currentThemeStyles.secondaryButton]}
        onPress={() => navigation.navigate('AskAlexandria')}
        activeOpacity={0.8}
      >
        <FontAwesome5 name="redo" size={20} color={currentThemeStyles.secondaryButtonText?.color || '#1A2C5B'} />
        <Text style={[styles.buttonText, currentThemeStyles.secondaryButtonText]}>Ask Alexandria</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ErrorBoundary navigation={navigation}>
      <View style={[styles.container, currentThemeStyles.container]}>
        <StatusBar barStyle={statusBarStyle} />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[currentThemeStyles.refreshColor?.color || '#1A2C5B']}
              tintColor={currentThemeStyles.refreshColor?.color || '#1A2C5B'}
            />
          }
        >
          <Header />
          <ScoreCard />
          <AnalyticsSection />
          <UsageStatsCard />
          <WeaknessInsightCard />
          
          <View style={styles.questionsSection}>
            <Text style={[styles.sectionTitle, currentThemeStyles.sectionTitle]}>Detailed Results</Text>
            {questions.map((question, index) => (
              <QuestionResult key={question?.id || index} question={question} index={index} />
            ))}
          </View>

          {/* ✨ REDESIGNED: Clean AI Analysis Section */}
          {showExplanations && Object.keys(explanations).length > 0 && (
            <View style={[styles.aiAnalysisSection, currentThemeStyles.aiAnalysisSection]}>
              <Text style={[styles.aiAnalysisTitle, currentThemeStyles.sectionTitle]}>
                🧠 AI Analysis of Wrong Answers
              </Text>
              <Text style={[styles.aiAnalysisSubtitle, currentThemeStyles.subtitle]}>
                Detailed insights on where to improve
              </Text>
              
              {Object.entries(explanations).map(([questionId, explanation]) => {
                const question = questions.find(q => q.id === questionId);
                if (!question || question.isCorrect) return null;
                
                const userAnswer = userAnswers[questionId];
                const correctAnswer = question.correctAnswer;
                const questionNumber = questions.indexOf(question) + 1;
                
                return (
                  <View key={questionId} style={[styles.analysisCard, currentThemeStyles.analysisCard]}>
                    {/* Question Header */}
                    <View style={styles.analysisHeader}>
                      <Text style={[styles.questionNumber, currentThemeStyles.questionNumber]}>
                        📌 Question {questionNumber}
                      </Text>
                    </View>
                    
                    {/* Question Text */}
                    <Text style={[styles.analysisQuestionText, currentThemeStyles.questionText]}>
                      {question.text || question.questionText}
                    </Text>
                    
                    {/* Answer Comparison */}
                    <View style={styles.answerComparison}>
                      <View style={styles.answerRow}>
                        <Text style={[styles.answerLabel, styles.wrongLabel]}>❌ Your Answer:</Text>
                        <Text style={[styles.answerValue, styles.wrongAnswer, currentThemeStyles.incorrectAnswer]}>
                          {getDisplayAnswerText(question, userAnswer)}
                        </Text>
                      </View>
                      
                      <View style={styles.answerRow}>
                        <Text style={[styles.answerLabel, styles.correctLabel]}>✅ Correct Answer:</Text>
                        <Text style={[styles.answerValue, styles.correctAnswerText, currentThemeStyles.correctAnswer]}>
                          {getDisplayAnswerText(question, correctAnswer)}
                        </Text>
                      </View>
                    </View>
                    
                    {/* AI Explanation */}
                    <View style={styles.aiExplanationContainer}>
                      {explanation.sections?.whyWrong && (
                        <View style={styles.explanationBlock}>
                          <Text style={[styles.explanationLabel, currentThemeStyles.explanationTitle]}>
                            ❌ Why Wrong:
                          </Text>
                          <Text style={[styles.explanationContent, currentThemeStyles.explanationText]}>
                            {explanation.sections.whyWrong}
                          </Text>
                        </View>
                      )}
                      
                      {explanation.sections?.correctReasoning && (
                        <View style={styles.explanationBlock}>
                          <Text style={[styles.explanationLabel, currentThemeStyles.explanationTitle]}>
                            ✅ Correct Approach:
                          </Text>
                          <Text style={[styles.explanationContent, currentThemeStyles.explanationText]}>
                            {explanation.sections.correctReasoning}
                          </Text>
                        </View>
                      )}
                      
                      {/* Learning Tips if available */}
                      {explanation.sections?.keyPoints && explanation.sections.keyPoints.length > 0 && (
                        <View style={styles.explanationBlock}>
                          <Text style={[styles.explanationLabel, currentThemeStyles.explanationTitle]}>
                            💡 Key Points:
                          </Text>
                          {explanation.sections.keyPoints.map((tip, index) => (
                            <Text key={index} style={[styles.tipItem, currentThemeStyles.explanationText]}>
                              • {tip}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          
          {showCoachCard && (
            <CoachMessage
              currentScore={score}
              totalQuestions={totalQuestions}
              quizCategory={determineCategory(metadata, [], questions)}
              isDarkMode={isDarkMode}
              style={{ marginHorizontal: 20, marginVertical: 10 }}
              onCoachTap={(coachMessage) => {
                logger.info('Coach message:', coachMessage);
              }}
            />
          )}

          <ActionButtons />
        </ScrollView>

        <AchievementCelebrationModal
        visible={showAchievementModal}
        achievements={analyticsAchievements}
        onClose={() => setShowAchievementModal(false)}
        isDarkMode={isDarkMode}
        />

        {/* ✅ REMOVED: Individual explanation modals - now using unified AI Analysis section */}
        
        {/* 🚀 NEW: Subject Correction Modal */}
        <SubjectCorrectionModal
          visible={showSubjectCorrection}
          onClose={() => setShowSubjectCorrection(false)}
          currentSubject={weaknessAnalysis?.weaknesses?.[0]?.topic || 'Unknown'}
          onCorrectSubject={handleSubjectCorrection}
          isDarkMode={isDarkMode}
          submitting={submittingCorrection}
        />
      </View>
    </ErrorBoundary>
  );
};

// 🚀 NEW: Subject Correction Modal Component
const SubjectCorrectionModal = ({ visible, onClose, currentSubject, onCorrectSubject, isDarkMode, submitting }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const availableSubjects = [
    'Computer Science',
    'Mathematics',
    'Psychology',
    'History',
    'Biology',
    'Physics',
    'Chemistry',
    'English',
    'Geography',
    'Art',
    'Music',
    'Medicine',
    'General Knowledge'
  ];

  const currentThemeStyles = isDarkMode ? darkStyles : lightStyles;

  const handleSubmit = () => {
    const subjectToSubmit = showCustomInput ? customSubject : selectedSubject;
    if (subjectToSubmit.trim()) {
      onCorrectSubject(subjectToSubmit.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.subjectCorrectionModalOverlay}>
        <View style={[styles.subjectCorrectionModalContainer, currentThemeStyles.modalContainer]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, currentThemeStyles.modalTitle]}>Correct Subject</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <FontAwesome5 name="times" size={20} color={currentThemeStyles.modalTitle?.color || '#333'} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalDescription, currentThemeStyles.modalText]}>
            Alexandria detected "{currentSubject?.replace(/_/g, ' ')}" as the subject. If this is wrong, please select the correct subject:
          </Text>

          <ScrollView style={styles.subjectOptions} showsVerticalScrollIndicator={false}>
            {availableSubjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.subjectOption,
                  currentThemeStyles.optionButton,
                  selectedSubject === subject && styles.selectedSubjectOption
                ]}
                onPress={() => {
                  setSelectedSubject(subject);
                  setShowCustomInput(false);
                  setCustomSubject('');
                }}
              >
                <Text style={[
                  styles.subjectOptionText,
                  currentThemeStyles.optionText,
                  selectedSubject === subject && styles.selectedSubjectOptionText
                ]}>
                  {subject}
                </Text>
                {selectedSubject === subject && (
                  <FontAwesome5 name="check" size={16} color="#00C851" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[
                styles.subjectOption,
                currentThemeStyles.optionButton,
                showCustomInput && styles.selectedSubjectOption
              ]}
              onPress={() => {
                setShowCustomInput(true);
                setSelectedSubject('');
              }}
            >
              <Text style={[
                styles.subjectOptionText,
                currentThemeStyles.optionText,
                showCustomInput && styles.selectedSubjectOptionText
              ]}>
                Other (specify)
              </Text>
            </TouchableOpacity>
            
            {showCustomInput && (
              <View style={[styles.customSubjectInput, currentThemeStyles.inputContainer]}>
                <Text style={[styles.inputLabel, currentThemeStyles.modalText]}>Enter subject:</Text>
                <TextInput
                  style={[styles.textInput, currentThemeStyles.textInput]}
                  value={customSubject}
                  onChangeText={setCustomSubject}
                  placeholder="e.g., User Interface Design"
                  placeholderTextColor={currentThemeStyles.placeholderText?.color || '#999'}
                  autoFocus={true}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalCancelButton, currentThemeStyles.cancelButton]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.modalCancelButtonText, currentThemeStyles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                currentThemeStyles.submitButton,
                (!selectedSubject && !customSubject.trim()) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={submitting || (!selectedSubject && !customSubject.trim())}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.modalSubmitButtonText, currentThemeStyles.submitButtonText]}>
                  Submit Correction
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// PropTypes
ResultsScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      questions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          text: PropTypes.string,
          questionText: PropTypes.string,
          type: PropTypes.string,
          correctAnswer: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
          options: PropTypes.arrayOf(
            PropTypes.shape({
              label: PropTypes.string,
              text: PropTypes.string,
              value: PropTypes.string,
              isCorrect: PropTypes.bool,
            })
          ),
          isCorrect: PropTypes.bool,
          keywords: PropTypes.arrayOf(PropTypes.string),
          formula: PropTypes.string,
          solution_steps: PropTypes.arrayOf(PropTypes.string),
          timeSpent: PropTypes.number,
          attempts: PropTypes.number,
          confidence: PropTypes.number,
        })
      ),
      userAnswers: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.arrayOf(PropTypes.string)])
      ),
      score: PropTypes.number,
      metadata: PropTypes.shape({
        title: PropTypes.string,
        category: PropTypes.string,
        subject: PropTypes.string,
        difficulty: PropTypes.string,
        startTime: PropTypes.string,
        interruptions: PropTypes.number,
        uploadMethod: PropTypes.string,
        fileType: PropTypes.string,
        processingTime: PropTypes.number,
        questionGenerationMethod: PropTypes.string,
      }),
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  explanationErrorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  explanationErrorText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  headerContainer: { marginBottom: 30 },
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
  titleSection: { alignItems: 'center', marginBottom: 30 },
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
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
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
  performanceText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scoreDisplay: { alignItems: 'center', marginBottom: 24 },
  scoreNumber: { fontSize: 48, fontWeight: '900', marginBottom: 4, letterSpacing: -1 },
  scoreLabel: { fontSize: 16, opacity: 0.8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-around', marginTop: 16 },
  statItem: { alignItems: 'center', flex: 1, gap: 8 },
  statNumber: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 14, opacity: 0.7 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 20 },
  
  // New pill badge styles
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Progress bar styles
  progressBarContainer: {
    width: '100%',
    marginTop: 12,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  
  // Motivational message style
  motivationalMessage: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Enhanced visual styles for improved card
  scoreNumberLarge: {
    fontSize: 64,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -2,
    marginBottom: 8,
  },
  scoreLabelLarge: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
  },
  performanceBadgeEnhanced: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 24,
    alignSelf: 'center',
  },
  inlineStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    gap: 32,
  },
  inlineStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  inlineStatText: {
    fontSize: 16,
    fontWeight: '600',
  },
  motivationalMessageLarge: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  analyticsStatsRowCompact: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 8,
  },
  analyticsCompactText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  
  // 🚀 NEW: Usage stats card styles
  usageCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  usageTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  usageProgress: {
    alignItems: 'center',
  },
  usageBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageText: {
    fontSize: 14,
    opacity: 0.8,
  },

  questionsSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  questionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  questionNumber: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  questionNumberText: { fontSize: 16, fontWeight: '700' },
  resultIndicator: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  correctIndicator: { backgroundColor: '#28a745' },
  incorrectIndicator: { backgroundColor: '#dc3545' },
  questionText: { fontSize: 18, fontWeight: '600', lineHeight: 24, marginBottom: 16 },
  answerSection: { marginBottom: 12 },
  answerLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4, opacity: 0.8 },
  userAnswer: { fontSize: 16, fontWeight: '600', paddingVertical: 2 },
  correctAnswer: { color: '#28a745' },
  incorrectAnswer: { color: '#dc3545' },
  strikeThrough: { textDecorationLine: 'line-through', opacity: 0.7 },
  correctAnswerDisplay: { fontSize: 16, fontWeight: '600', color: '#155724' },

  // 🚀 NEW: Enhanced explanation styles
  explanationActions: {
    marginTop: 16,
  },
  explanationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 12,
    gap: 8,
  },
  explanationButtonActive: {
    borderWidth: 3,
  },
  explanationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  explanationPreview: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  explanationPreviewText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  viewFullButton: {
    alignSelf: 'flex-end',
  },
  viewFullButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 🚀 NEW: Modal styles
  explanationModal: {
    flex: 1,
  },
  explanationModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalTitleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  tierBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalQuestionText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  explanationModalContent: {
    flex: 1,
    padding: 20,
  },
  explanationSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  aiInfoFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  aiInfoText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },

  // 🚀 NEW: Tier selection modal styles
  tierModal: {
    flex: 1,
  },
  tierModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  tierModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
  },
  tierOptions: {
    flex: 1,
    padding: 20,
  },
  tierOption: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  tierOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierModel: {
    fontSize: 14,
    opacity: 0.7,
  },
  tierCost: {
    alignItems: 'flex-end',
  },
  tierCostText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tierLimit: {
    fontSize: 12,
    opacity: 0.7,
  },
  tierFeatures: {
    marginBottom: 12,
  },
  tierFeature: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  currentTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  currentTierText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  explanationContainer: { marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  explanationTitle: { fontSize: 16, fontWeight: '600' },
  explanationText: { fontSize: 14, lineHeight: 20 },
  solutionContainer: { marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  solutionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  solutionStep: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  actionContainer: { marginTop: 20, alignItems: 'center' },
  enhancedActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, width: '100%' },
  enhancedActionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 12, 
    borderRadius: 12, 
    marginHorizontal: 4, 
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4 
  },
  enhancedButtonText: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginVertical: 8, 
    width: '100%', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4 
  },
  primaryButton: { backgroundColor: '#1A2C5B' },
  secondaryButton: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#1A2C5B' },
  buttonText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  insightCard: {
    marginVertical: 20,
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  insightText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  insightDetail: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
  },
  focusQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  focusQuizButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsContainer: { marginTop: 20, width: '100%', alignItems: 'center' },
  
  // 🚀 NEW: Subject correction modal styles
  subjectCorrectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subjectCorrectionModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
    lineHeight: 20,
  },
  subjectOptions: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subjectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSubjectOption: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  subjectOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedSubjectOptionText: {
    color: '#065F46',
    fontWeight: '600',
  },
  customSubjectInput: {
    marginTop: 12,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSubmitButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  subjectCorrectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  subjectCorrectionText: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '500',
  },
  
  // AI-powered insights styles
  aiRecommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  aiRecommendationText: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  granularTopicsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  granularTopicsLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.7,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  topicTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  
  // ✨ REDESIGNED: Clean AI Analysis Section Styles
  aiAnalysisSection: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 16,
    padding: 20,
  },
  aiAnalysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  aiAnalysisSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  analysisHeader: {
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  analysisQuestionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  answerComparison: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 120,
    flexShrink: 0,
  },
  wrongLabel: {
    color: '#DC2626',
  },
  correctLabel: {
    color: '#059669',
  },
  answerValue: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  wrongAnswer: {
    color: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  correctAnswerText: {
    color: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiExplanationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 16,
  },
  explanationBlock: {
    marginBottom: 16,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  explanationContent: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 8,
  },
  tipItem: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    paddingLeft: 8,
  },
});

const newAnalyticsStyles = {
  // Analytics message style
  analyticsMessage: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Enhanced analytics stats
  analyticsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  analyticsStat: {
    alignItems: 'center',
  },
  analyticsStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  analyticsStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  // Loading container
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Profile stats card
  profileStatsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  
  // Subject progress
  subjectProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  subjectProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  subjectProgressItem: {
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
};

// Light theme styles
const lightStyles = StyleSheet.create({
  container: { backgroundColor: '#F8F9FA' },
  backButton: { backgroundColor: '#FFFFFF' },
  backButtonText: { color: '#1A2C5B' },
  titleIcon: { backgroundColor: 'rgba(26, 44, 91, 0.1)' },
  title: { color: '#1A2C5B' },
  subtitle: { color: '#4A5568' },
  scoreCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  scoreNumber: { color: '#1A2C5B' },
  scoreLabel: { color: '#4A5568' },
  statItem: { backgroundColor: '#F1F5F9' },
  statLabel: { color: '#4A5568' },
  sectionTitle: { color: '#1A2C5B' },
  questionCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  correctCard: { borderColor: '#28a745' },
  incorrectCard: { borderColor: '#dc3545' },
  questionNumber: { backgroundColor: '#E2E8F0' },
  correctNumber: { backgroundColor: '#28a745' },
  incorrectNumber: { backgroundColor: '#dc3545' },
  questionNumberText: { color: '#1A2C5B' },
  correctNumberText: { color: '#FFFFFF' },
  incorrectNumberText: { color: '#FFFFFF' },
  questionText: { color: '#2D3748' },
  answerLabel: { color: '#4A5568' },
  correctAnswerDisplay: { color: '#155724' },
  explanationContainer: { backgroundColor: '#F8F9FA', borderColor: '#E2E8F0' },
  explanationIcon: { color: '#D4AF37' },
  explanationTitle: { color: '#1A2C5B' },
  explanationText: { color: '#4A5568' },
  solutionContainer: { backgroundColor: '#F8F9FA', borderColor: '#E2E8F0' },
  solutionTitle: { color: '#1A2C5B' },
  solutionStep: { color: '#4A5568' },
  explanationButton: { backgroundColor: '#FFF3CD', borderColor: '#D4AF37' },
  explanationButtonText: { color: '#D4AF37' },
  saveQuizButton: { backgroundColor: '#E2E8F0', borderColor: '#1A2C5B' },
  saveQuizButtonText: { color: '#1A2C5B' },
  shareButton: { backgroundColor: 'rgba(23, 162, 184, 0.1)', borderColor: '#17a2b8' },
  shareButtonText: { color: '#17a2b8' },
  copyButton: { backgroundColor: 'rgba(40, 167, 69, 0.1)', borderColor: '#28a745' },
  copyButtonText: { color: '#28a745' },
  primaryButton: { backgroundColor: '#1A2C5B' },
  primaryButtonText: { color: '#FFFFFF' },
  secondaryButton: { backgroundColor: '#F8F9FA', borderColor: '#1A2C5B' },
  secondaryButtonText: { color: '#1A2C5B' },
  insightCard: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#F6E05E' },
  insightTitle: { color: '#975A16' },
  insightText: { color: '#4A5568' },
  insightDetail: { color: '#718096' },
  focusQuizButton: { backgroundColor: '#D4AF37' },
  focusQuizButtonText: { color: '#1A2C5B' },
  refreshColor: { color: '#1A2C5B' },
  
  // AI insights light theme
  aiRecommendationBox: { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  aiRecommendationText: { color: '#4A5568' },
  granularTopicsLabel: { color: '#718096' },
  topicTag: { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: 'rgba(212, 175, 55, 0.3)' },
  topicTagText: { color: '#975A16' },
  
  // Subject correction modal theme styles
  modalContainer: { backgroundColor: '#FFFFFF' },
  modalTitle: { color: '#1F2937' },
  modalText: { color: '#6B7280' },
  optionButton: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  optionText: { color: '#1F2937' },
  inputContainer: { backgroundColor: '#FFFFFF' },
  textInput: { backgroundColor: '#F9FAFB', color: '#1F2937', borderColor: '#E5E7EB' },
  placeholderText: { color: '#9CA3AF' },
  cancelButton: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  cancelButtonText: { color: '#6B7280' },
  submitButton: { backgroundColor: '#10B981' },
  submitButtonText: { color: '#FFFFFF' },
});

// Dark theme styles
const darkStyles = StyleSheet.create({
  container: { backgroundColor: '#1A202C' },
  backButton: { backgroundColor: '#2D3748' },
  backButtonText: { color: '#E2E8F0' },
  titleIcon: { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
  title: { color: '#E2E8F0' },
  subtitle: { color: '#A0AEC0' },
  scoreCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
  scoreNumber: { color: '#E2E8F0' },
  scoreLabel: { color: '#A0AEC0' },
  statItem: { backgroundColor: '#4A5568' },
  statLabel: { color: '#A0AEC0' },
  sectionTitle: { color: '#E2E8F0' },
  questionCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
  correctCard: { borderColor: '#28a745' },
  incorrectCard: { borderColor: '#dc3545' },
  questionNumber: { backgroundColor: '#4A5568' },
  correctNumber: { backgroundColor: '#28a745' },
  incorrectNumber: { backgroundColor: '#dc3545' },
  questionNumberText: { color: '#E2E8F0' },
  correctNumberText: { color: '#FFFFFF' },
  incorrectNumberText: { color: '#FFFFFF' },
  questionText: { color: '#E2E8F0' },
  answerLabel: { color: '#A0AEC0' },
  correctAnswerDisplay: { color: '#9AE6B4' },
  explanationContainer: { backgroundColor: '#4A5568', borderColor: '#718096' },
  explanationIcon: { color: '#F6E05E' },
  explanationTitle: { color: '#E2E8F0' },
  explanationText: { color: '#A0AEC0' },
  solutionContainer: { backgroundColor: '#4A5568', borderColor: '#718096' },
  solutionTitle: { color: '#E2E8F0' },
  solutionStep: { color: '#A0AEC0' },
  explanationButton: { backgroundColor: '#744210', borderColor: '#F6E05E' },
  explanationButtonText: { color: '#F6E05E' },
  saveQuizButton: { backgroundColor: '#4A5568', borderColor: '#E2E8F0' },
  saveQuizButtonText: { color: '#E2E8F0' },
  shareButton: { backgroundColor: 'rgba(23, 162, 184, 0.2)', borderColor: '#17a2b8' },
  shareButtonText: { color: '#17a2b8' },
  copyButton: { backgroundColor: 'rgba(40, 167, 69, 0.2)', borderColor: '#28a745' },
  copyButtonText: { color: '#28a745' },
  primaryButton: { backgroundColor: '#4A5568' },
  primaryButtonText: { color: '#E2E8F0' },
  secondaryButton: { backgroundColor: '#2D3748', borderColor: '#E2E8F0' },
  secondaryButtonText: { color: '#E2E8F0' },
  insightCard: { backgroundColor: '#422C0A', borderWidth: 1, borderColor: '#F6E05E' },
  insightTitle: { color: '#F6E05E' },
  insightText: { color: '#E2E8F0' },
  insightDetail: { color: '#A0AEC0' },
  focusQuizButton: { backgroundColor: '#F6E05E' },
  focusQuizButtonText: { color: '#1A202C' },
  refreshColor: { color: '#F6E05E' },
  
  // AI insights dark theme
  aiRecommendationBox: { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
  aiRecommendationText: { color: '#E2E8F0' },
  granularTopicsLabel: { color: '#A0AEC0' },
  topicTag: { backgroundColor: 'rgba(212, 175, 55, 0.25)', borderColor: 'rgba(212, 175, 55, 0.4)' },
  topicTagText: { color: '#F6E05E' },
  
  // ✨ REDESIGNED: AI Analysis Section Dark Theme
  aiAnalysisSection: { backgroundColor: 'rgba(45, 55, 72, 0.9)' },
  aiAnalysisTitle: { color: '#E2E8F0' },
  aiAnalysisSubtitle: { color: '#A0AEC0' },
  analysisCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
  questionNumber: { color: '#60A5FA' },
  analysisQuestionText: { color: '#E2E8F0' },
  answerComparison: { backgroundColor: 'rgba(74, 85, 104, 0.5)' },
  wrongLabel: { color: '#F87171' },
  correctLabel: { color: '#34D399' },
  wrongAnswer: { color: '#F87171', backgroundColor: 'rgba(248, 113, 113, 0.2)' },
  correctAnswerText: { color: '#34D399', backgroundColor: 'rgba(52, 211, 153, 0.2)' },
  aiExplanationContainer: { backgroundColor: 'rgba(45, 55, 72, 0.7)' },
  explanationLabel: { color: '#E2E8F0' },
  explanationContent: { color: '#CBD5E0' },
  tipItem: { color: '#A0AEC0' },
  
  // Subject correction modal theme styles (dark)
  modalContainer: { backgroundColor: '#2D3748' },
  modalTitle: { color: '#E2E8F0' },
  modalText: { color: '#A0AEC0' },
  optionButton: { backgroundColor: '#4A5568', borderColor: '#718096' },
  optionText: { color: '#E2E8F0' },
  inputContainer: { backgroundColor: '#2D3748' },
  textInput: { backgroundColor: '#4A5568', color: '#E2E8F0', borderColor: '#718096' },
  placeholderText: { color: '#6B7280' },
  cancelButton: { backgroundColor: '#4A5568', borderColor: '#718096' },
  cancelButtonText: { color: '#E2E8F0' },
  submitButton: { backgroundColor: '#065F46' },
  submitButtonText: { color: '#FFFFFF' },
});

export default ResultsScreen;