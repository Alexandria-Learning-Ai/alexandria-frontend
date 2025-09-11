// QuizScreen.js - Enhanced Alexandria Version
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  BackHandler,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { NotificationManager } from '../utils/NotificationManager';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import uuid from 'react-native-uuid';
import AdvancedAnalyticsService from '../services/AdvancedAnalyticsService';
import { useTranslation } from 'react-i18next';
import NavigationHelper from '../utils/NavigationHelper';
import VisualQuestionRenderer from '../components/VisualQuestionRenderer';
import DatabaseTableVisualization from '../components/DatabaseTableVisualization';
import logger from '../utils/logger';


const { width: screenWidth } = Dimensions.get('window');

const QuizScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  // Core state variables with better organization
  const [quizState, setQuizState] = useState({
    started: false,
    submitted: false,
    showResults: false,
    loading: false,
    currentQuestionIndex: 0,
    score: 0,
  });

  const [userAnswers, setUserAnswers] = useState({});
  const [questionsState, setQuestionsState] = useState([]);
  const [quizMetadata, setQuizMetadata] = useState({
    title: '',
    startTime: null,
    completionTime: null,
  });
  const [themeState, setThemeState] = useState({
    isDarkMode: false,
    colors: null,
  });
  const [analyticsState, setAnalyticsState] = useState({
    processing: false,
    achievements: [],
    insights: null,
  });

  // Enhanced animation refs with better performance
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Route params with enhanced validation
  const routeParams = useMemo(() => ({
    backendQuizData: route?.params?.quiz || [],
    metadata: route?.params?.metadata || {},
    sharedQuiz: route?.params?.sharedQuiz || null,
    isChallenge: route?.params?.isChallenge || false,
    challengeId: route?.params?.challengeId || null,
    quizId: route?.params?.quizId || null,
    source: route?.params?.source || 'quiz',
  }), [route?.params]);

  const userId = auth?.currentUser?.uid || 'default_user_id';

  // Enhanced theme system with Alexandria colors
  const getThemeColors = useCallback((isDark) => {
    const baseColors = {
      // Alexandria Core Colors
      alexandriaGold: '#D4AF37',
      alexandriaBronze: '#CD7F32',
      alexandriaSilver: '#C0C0C0',
      alexandriaNavy: '#1A2C5B',
      alexandriaCream: '#F8F4E3',
      
      // Status Colors
      success: isDark ? '#4ade80' : '#28a745',
      error: isDark ? '#ff6b7a' : '#dc3545',
      warning: '#FFD700',
      info: '#3498DB',
    };

    return isDark ? {
      ...baseColors,
      background: '#0F1419', // Deep ancient night
      surface: '#1A2C5B',
      surfaceSecondary: '#2C3E50',
      text: '#F8F4E3',
      textSecondary: '#CBD5E0',
      textTertiary: '#9CA3AF',
      border: 'rgba(212, 175, 55, 0.3)',
      borderSecondary: 'rgba(248, 244, 227, 0.2)',
      overlay: 'rgba(26, 44, 91, 0.8)',
      shadow: '#D4AF37',
    } : {
      ...baseColors,
      background: '#F8F4E3', // Warm parchment
      surface: '#FFFFFF',
      surfaceSecondary: '#F8F9FA',
      text: '#1A2C5B',
      textSecondary: '#4A5568',
      textTertiary: '#718096',
      border: 'rgba(26, 44, 91, 0.2)',
      borderSecondary: 'rgba(26, 44, 91, 0.1)',
      overlay: 'rgba(255, 255, 255, 0.9)',
      shadow: '#1A2C5B',
    };
  }, []);

  // Initialize theme
  useEffect(() => {
    const colors = getThemeColors(themeState.isDarkMode);
    setThemeState(prev => ({ ...prev, colors }));
  }, [themeState.isDarkMode, getThemeColors]);

  // Enhanced initialization with better error handling
  useEffect(() => {
    const initializeQuiz = async () => {
      setQuizState(prev => ({ ...prev, loading: true }));
      
      try {
        const startTime = Date.now();
        setQuizMetadata(prev => ({ ...prev, startTime }));

        if (routeParams.sharedQuiz) {
          await loadSharedQuizData(routeParams.sharedQuiz);
        } else if (routeParams.quizId) {
          await loadQuizById(routeParams.quizId);
        } else if (routeParams.backendQuizData.length > 0) {
          processRegularQuiz();
        } else {
          throw new Error('No quiz data available');
        }
      } catch (error) {
        logger.error('Quiz initialization error:', error);
        showAlexandriaAlert(
          'Scroll Not Found',
          'The ancient scroll you seek could not be located in our archives. Please return to the library.',
          () => NavigationHelper.safeGoBack(navigation)
        );
      } finally {
        setQuizState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeQuiz();

    // Enhanced cleanup
    return () => {
      [progressAnim, scoreAnim, fadeAnim, scaleAnim, slideAnim].forEach(anim => {
        anim.stopAnimation();
      });
    };
  }, [routeParams]);

  // Hardware back button handling
  useEffect(() => {
    const backAction = () => {
      if (quizState.started && !quizState.submitted) {
        showAlexandriaAlert(
          (t && t('quiz.leaveSacredHalls')) || 'Leave Sacred Halls',
          (t && t('quiz.progressWillBeLost')) || 'Progress will be lost',
          null,
          [
            { text: (t && t('quiz.continueQuest')) || 'Continue Quest', style: 'cancel' },
            { text: (t && t('quiz.leave')) || 'Leave', style: 'destructive', onPress: () => NavigationHelper.safeGoBack(navigation) }
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [quizState.started, quizState.submitted, navigation]);

  // Enhanced Alexandria-themed alert system
  const showAlexandriaAlert = (title, message, onConfirm = null, buttons = null) => {
    const defaultButtons = onConfirm 
      ? [{ text: 'Understood', onPress: onConfirm }]
      : [{ text: 'Understood' }];

    Alert.alert(`🏛️ ${title}`, message, buttons || defaultButtons);
  };

  // Enhanced quiz data processing with validation
  const loadSharedQuizData = async (quiz) => {
    try {
      if (!quiz?.questions?.length) {
        throw new Error('Invalid scroll format - no wisdom found');
      }

      setQuizMetadata(prev => ({ 
        ...prev, 
        title: quiz.title || (t && t('quiz.sharedWisdomChallenge')) || 'Shared Wisdom Challenge' 
      }));

      const processedQuestions = quiz.questions.map((q, index) => ({
        id: q.id || uuid.v4(),
        questionNumber: q.questionNumber || q.question_number || index + 1,
        questionText: q.text || q.questionText || '',
        type: q.type || 'multiple_choice',
        options: processQuestionOptions(q.options),
        correctAnswer: q.correctAnswer || q.correct_answer || '',
        userAnswer: null,
        isCorrect: null,
        keywords: q.keywords || [],
        formula: q.formula || null,
        solution_steps: q.solution_steps || [],
        difficulty: q.difficulty || 'medium',
        category: q.category || 'general',
      }));

      const initialAnswers = {};
      processedQuestions.forEach(q => {
        initialAnswers[q.id] = null;
      });

      setUserAnswers(initialAnswers);
      setQuestionsState(processedQuestions);
    } catch (error) {
      logger.error('Error loading shared quiz:', error);
      throw new Error('Failed to decipher the ancient scroll');
    }
  };

  const loadQuizById = async (id) => {
    try {
      const quizData = await AsyncStorage.getItem(`shared_quiz_${id}`);
      if (!quizData) {
        throw new Error('Scroll has vanished from the archives');
      }
      
      const quiz = JSON.parse(quizData);
      await loadSharedQuizData(quiz);
    } catch (error) {
      logger.error('Error loading quiz by ID:', error);
      throw new Error('The requested scroll could not be retrieved');
    }
  };

  const processRegularQuiz = () => {
    try {
      if (!Array.isArray(routeParams.backendQuizData) || routeParams.backendQuizData.length === 0) {
        throw new Error('No wisdom to be tested');
      }

      const processedQuestions = routeParams.backendQuizData.map((q, index) => {
        // Debug logging for true/false questions to see raw backend data
        if (q.type === 'true_false') {
          logger.info(`🔍 Raw Backend True/False Question ${index + 1}:`, {
            originalData: q,
            correctAnswer: q.correct_answer,
            correctAnswerType: typeof q.correct_answer,
            questionText: q.question_text
          });
        }

        return {
          id: uuid.v4(),
          questionNumber: q.question_number || index + 1,
          questionText: q.question_text || '',
          type: q.type || 'multiple_choice',
          options: processQuestionOptions(q.options),
          correctAnswer: q.correct_answer !== undefined && q.correct_answer !== null ? q.correct_answer : '',
          userAnswer: null,
          isCorrect: null,
          keywords: q.keywords || [],
          formula: q.formula || null,
          solution_steps: q.solution_steps || [],
          difficulty: q.difficulty || 'medium',
          category: q.category || 'general',
        };
      });

      const initialAnswers = {};
      processedQuestions.forEach(q => {
        initialAnswers[q.id] = null;
      });
      
      setUserAnswers(initialAnswers);
      setQuestionsState(processedQuestions);
      setQuizMetadata(prev => ({ 
        ...prev, 
        title: routeParams.metadata.title || (t && t('quiz.trialOfKnowledge')) || 'Trial of Knowledge' 
      }));
    } catch (error) {
      logger.error('Error processing regular quiz:', error);
      throw new Error('Failed to prepare the trial');
    }
  };

  // Enhanced option processing
  const processQuestionOptions = (options) => {
    if (!options) return [];
    
    return options.map((opt, index) => ({
      id: opt.id || uuid.v4(),
      label: opt.label || String.fromCharCode(65 + index), // A, B, C, D
      text: opt.text || '',
      value: opt.value !== undefined ? opt.value : opt.text || '',
    }));
  };

  // Memoized questions with performance optimization
  const questions = useMemo(() => questionsState, [questionsState]);
  const currentQuestion = useMemo(() => 
    questions[quizState.currentQuestionIndex], 
    [questions, quizState.currentQuestionIndex]
  );

  // Enhanced progress animation with spring physics
  useEffect(() => {
    if (quizState.started && questions.length > 0) {
      Animated.spring(progressAnim, {
        toValue: (quizState.currentQuestionIndex + 1) / questions.length,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [quizState.currentQuestionIndex, quizState.started, questions.length]);

  // Enhanced answer handling with validation and feedback
  const handleSelectOption = useCallback((questionId, selectedValue) => {
    if (quizState.submitted) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: selectedValue
    }));

    // Haptic feedback for better UX
    Vibration.vibrate(50);

    // Smooth selection animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [quizState.submitted, scaleAnim]);

  const handleShortAnswer = useCallback((questionId, text) => {
    if (quizState.submitted) return;
    
    const truncatedText = text.slice(0, 1000); // Increased limit
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: truncatedText
    }));
  }, [quizState.submitted]);

  // Enhanced quiz completion with analytics
  const handleQuizComplete = async (results, finalScore, finalQuestions) => {
    try {
      const completionTime = Date.now() - quizMetadata.startTime;
      setQuizMetadata(prev => ({ ...prev, completionTime }));

      // Save challenge result with enhanced data
      if (routeParams.isChallenge && routeParams.challengeId) {
        await saveChallengeResult(finalScore, finalQuestions, completionTime);
      }

      // Enhanced notification system
      const user = auth?.currentUser;
      if (user) {
        const notificationResults = await NotificationManager.scheduleAllNotifications(
          user.uid,
          {
            score: finalScore,
            total: finalQuestions.length,
            percentage: Math.round((finalScore / finalQuestions.length) * 100),
            completionTime,
            difficulty: routeParams.metadata.difficulty,
          },
          'quiz_completed'
        );

        if (notificationResults?.summary) {
          setTimeout(() => {
            showAlexandriaAlert(
              t('quiz.wisdomFromOracle'),
              notificationResults.summary
            );
          }, 2000);
        }
      }
    } catch (error) {
      logger.error('Error in quiz completion:', error);
    }
  };

  // Enhanced challenge result saving
  const saveChallengeResult = async (finalScore, finalQuestions, completionTime) => {
    try {
      const challengeResult = {
        challengeId: routeParams.challengeId,
        completedAt: new Date().toISOString(),
        score: finalScore,
        totalQuestions: finalQuestions.length,
        percentage: Math.round((finalScore / finalQuestions.length) * 100),
        userAnswers,
        completionTime,
        difficulty: routeParams.metadata.difficulty || 'medium',
        category: routeParams.metadata.category || 'general',
        questionsBreakdown: finalQuestions.map(q => ({
          type: q.type,
          difficulty: q.difficulty,
          correct: q.isCorrect,
        })),
      };

      const key = `challengeHistory_${userId}`;
      const existingChallenges = await AsyncStorage.getItem(key);
      const challengeHistory = existingChallenges ? JSON.parse(existingChallenges) : [];
      
      challengeHistory.unshift(challengeResult);

      // Keep only the latest 100 challenges
      if (challengeHistory.length > 100) {
        challengeHistory.splice(100);
      }

      await AsyncStorage.setItem(key, JSON.stringify(challengeHistory));
    } catch (error) {
      logger.error('Error saving challenge result:', error);
    }
  };

  // Enhanced submission with improved scoring algorithm
  const handleSubmit = async () => {
    if (questionsState.length === 0) {
      showAlexandriaAlert('Error', 'No trials to complete.');
      return;
    }

    let correctCount = 0;
    const updatedQuestions = questionsState.map((q) => {
      const userAnswer = userAnswers[q.id];
      const isQuestionCorrect = evaluateAnswer(q, userAnswer);

      // Debug logging for true/false questions
      if (q.type === 'true_false') {
        logger.info(`🐛 TRUE/FALSE DEBUG - Question ${q.id}:`, {
          question: q.text || q.questionText,
          userAnswer: userAnswer,
          userAnswerType: typeof userAnswer,
          correctAnswer: q.correctAnswer,
          correctAnswerType: typeof q.correctAnswer,
          isQuestionCorrect: isQuestionCorrect,
          evaluationResult: evaluateAnswer(q, userAnswer)
        });
      }

      if (isQuestionCorrect) {
        correctCount++;
      }
      
      return { ...q, userAnswer, isCorrect: isQuestionCorrect };
    });

    setQuestionsState(updatedQuestions);
    setQuizState(prev => ({ 
      ...prev, 
      score: correctCount, 
      submitted: true, 
      showResults: true 
    }));

    // Enhanced score animation with celebration effect
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scoreAnim, {
        toValue: correctCount,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
    ]).start();

    // Celebration vibration for good scores
    const percentage = (correctCount / updatedQuestions.length) * 100;
    if (percentage >= 80) {
      Vibration.vibrate([100, 50, 100, 50, 200]);
    } else if (percentage >= 60) {
      Vibration.vibrate([100, 50, 100]);
    }

    // 🚀 Submit to Advanced Analytics and Navigate (Fixed: Single Navigation)
    const navigateToResults = (metadata) => {
      logger.info('🧭 Navigating to ResultsScreen with metadata:', metadata);
      setTimeout(() => {
        navigation.navigate('ResultsScreen', {
          questions: updatedQuestions,
          userAnswers: userAnswers,
          score: correctCount,
          metadata: metadata
        });
      }, 2000);
    };

    try {
      logger.info('📊 Submitting quiz to advanced analytics...');
      
      const analyticsMetadata = {
        ...quizMetadata,
        ...routeParams.metadata,
        quizId: routeParams.quizId || `quiz_${Date.now()}`,
        completionTime: Date.now() - quizMetadata.startTime,
        source: routeParams.source,
        isChallenge: routeParams.isChallenge,
        challengeId: routeParams.challengeId,
        sessionData: {
          device: 'mobile',
          platform: 'react-native',
          startTime: quizMetadata.startTime,
          endTime: Date.now(),
          interruptions: 0,
          navigationCount: quizState.currentQuestionIndex + 1,
          totalTimeSpent: Date.now() - quizMetadata.startTime
        }
      };

      setAnalyticsState(prev => ({ ...prev, processing: true }));

      const analyticsResult = await AdvancedAnalyticsService.submitQuizCompletion(
        updatedQuestions,
        userAnswers,
        correctCount,
        analyticsMetadata
      );

      setAnalyticsState(prev => ({ ...prev, processing: false }));

      if (analyticsResult.success) {
        logger.info('✅ Advanced analytics submitted successfully!');
        
        // Show achievement notifications if any
        if (analyticsResult.achievements && analyticsResult.achievements.length > 0) {
          const achievementNames = analyticsResult.achievements.map(a => a.name).join(', ');
          setTimeout(() => {
            showAlexandriaAlert(
              '🏆 New Achievements Unlocked!',
              `Congratulations! You've earned: ${achievementNames}`,
            );
          }, 1500);
        }

        // Show insights notification
        if (analyticsResult.insights && analyticsResult.insights.performanceInsight) {
          setTimeout(() => {
            showAlexandriaAlert(
              t('quiz.wisdomFromOracle'),
              analyticsResult.insights.performanceInsight,
            );
          }, 3000);
        }
        
        // Enhanced metadata with analytics data
        const enhancedMetadata = {
          ...analyticsMetadata,
          analytics: analyticsResult.analytics,
          achievements: analyticsResult.achievements,
          insights: analyticsResult.insights,
          updatedStats: analyticsResult.updatedStats,
          analyticsMessage: analyticsResult.message,
          completedAt: new Date().toISOString(),
          category: routeParams.metadata?.category || 'general',
          difficulty: routeParams.metadata?.difficulty || 'medium',
        };

        navigateToResults(enhancedMetadata);

      } else {
        logger.warn('⚠️ Analytics submission failed, proceeding with fallback flow');
        logger.warn('Analytics error:', analyticsResult.error);
        
        // Complete quiz processing and navigate with basic metadata
        await handleQuizComplete(updatedQuestions, correctCount, updatedQuestions);
        
        const basicMetadata = {
          ...quizMetadata,
          category: routeParams.metadata?.category || 'general',
          difficulty: routeParams.metadata?.difficulty || 'medium',
          completedAt: new Date().toISOString(),
          source: routeParams.source,
          isChallenge: routeParams.isChallenge,
          challengeId: routeParams.challengeId,
          completionTime: Date.now() - quizMetadata.startTime,
        };

        navigateToResults(basicMetadata);
      }

    } catch (error) {
      logger.error('❌ Error in analytics submission, using fallback navigation:', error);
      
      // Complete quiz processing and navigate with basic metadata  
      await handleQuizComplete(updatedQuestions, correctCount, updatedQuestions);
      
      const fallbackMetadata = {
        ...quizMetadata,
        category: routeParams.metadata?.category || 'general',
        difficulty: routeParams.metadata?.difficulty || 'medium',
        completedAt: new Date().toISOString(),
        source: routeParams.source,
        isChallenge: routeParams.isChallenge,
        challengeId: routeParams.challengeId,
        completionTime: Date.now() - quizMetadata.startTime,
      };

      navigateToResults(fallbackMetadata);
    }
  };

  // Enhanced answer evaluation with fuzzy matching
  const evaluateAnswer = (question, userAnswer) => {
    if (userAnswer === null || userAnswer === undefined) return false;

    const normalizeAnswer = (answer) => {
      if (answer === null || answer === undefined) return '';
      return String(answer).trim().toLowerCase();
    };

    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(question.correctAnswer);

    switch (question.type) {
      case 'open_ended':
        // Enhanced fuzzy matching for open-ended questions
        if (normalizedUser === normalizedCorrect) return true;
        
        // Check for keyword matching
        if (question.keywords && question.keywords.length > 0) {
          const keywordMatches = question.keywords.filter(keyword => 
            normalizedUser.includes(keyword.toLowerCase())
          );
          return keywordMatches.length >= Math.ceil(question.keywords.length / 2);
        }
        
        return false;
        
      case 'true_false':
        // Enhanced true/false evaluation with boolean support
        const normalizeForEvaluation = (answer) => {
          if (answer === null || answer === undefined) return '';
          if (typeof answer === 'boolean') return answer ? 'true' : 'false';
          return String(answer).trim().toLowerCase();
        };
        
        const userNormalized = normalizeForEvaluation(userAnswer);
        const correctNormalized = normalizeForEvaluation(question.correctAnswer);
        
        // Debug logging for true/false evaluation
        logger.info(`🔍 TRUE/FALSE EVALUATION:`, {
          questionId: question.id,
          userAnswer: userAnswer,
          userAnswerType: typeof userAnswer,
          correctAnswer: question.correctAnswer,
          correctAnswerType: typeof question.correctAnswer,
          userNormalized: userNormalized,
          correctNormalized: correctNormalized,
          evaluationResult: userNormalized === correctNormalized
        });
        
        return userNormalized === correctNormalized;
        
      case 'multiple_choice':
        return userAnswer === question.correctAnswer;
        
      case 'math':
        const numericUser = parseFloat(userAnswer);
        const numericCorrect = parseFloat(question.correctAnswer);
        
        if (!isNaN(numericUser) && !isNaN(numericCorrect)) {
          // Dynamic tolerance based on magnitude
          const tolerance = Math.max(0.01, Math.abs(numericCorrect) * 0.001);
          return Math.abs(numericUser - numericCorrect) <= tolerance;
        }
        
        return normalizedUser === normalizedCorrect;
        
      default:
        return userAnswer === question.correctAnswer;
    }
  };

  // Enhanced navigation with smooth transitions
  const navigateQuestion = useCallback((direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(quizState.currentQuestionIndex + 1, questions.length - 1)
      : Math.max(quizState.currentQuestionIndex - 1, 0);

    if (newIndex === quizState.currentQuestionIndex) return;

    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -screenWidth : screenWidth,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setQuizState(prev => ({ ...prev, currentQuestionIndex: newIndex }));
  }, [quizState.currentQuestionIndex, questions.length, slideAnim]);

  // Enhanced quiz start handler
  const handleStartQuiz = useCallback(() => {
    if (questionsState.length === 0) {
      showAlexandriaAlert('Error', 'No trials available to begin.');
      return;
    }
    
    setQuizState(prev => ({ ...prev, started: true }));
    Vibration.vibrate(100); // Start haptic feedback
  }, [questionsState.length]);

  // Enhanced retake handler
  const handleRetake = useCallback(() => {
    const resetAnswers = {};
    questionsState.forEach((q) => {
      resetAnswers[q.id] = null;
    });
    
    setUserAnswers(resetAnswers);
    setQuizState({
      started: false,
      submitted: false,
      showResults: false,
      loading: false,
      currentQuestionIndex: 0,
      score: 0,
    });
    setQuizMetadata(prev => ({ 
      ...prev, 
      startTime: Date.now(),
      completionTime: null 
    }));

    // Reset animations
    [progressAnim, scoreAnim, fadeAnim, scaleAnim, slideAnim].forEach(anim => {
      anim.setValue(anim === fadeAnim ? 1 : 0);
    });
  }, [questionsState]);

  // Enhanced question type icon system
  const getQuestionIcon = (type) => {
    const iconMap = {
      'multiple_choice': 'list-ul',
      'true_false': 'balance-scale',
      'open_ended': 'feather-alt',
      'math': 'calculator',
    };
    return iconMap[type] || 'scroll';
  };

  // Enhanced difficulty indicator
  const getDifficultyInfo = (difficulty) => {
    const difficultyMap = {
      easy: { icon: 'leaf', color: themeState.colors?.success },
      medium: { icon: 'fire', color: themeState.colors?.warning },
      hard: { icon: 'crown', color: themeState.colors?.error },
    };
    return difficultyMap[difficulty] || difficultyMap.medium;
  };

  // Enhanced progress calculation
  const progressData = useMemo(() => {
    if (questions.length === 0) return { width: '0%', percentage: 0 };
    
    const percentage = Math.round(((quizState.currentQuestionIndex + 1) / questions.length) * 100);
    const width = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    
    return { width, percentage };
  }, [questions.length, quizState.currentQuestionIndex, progressAnim]);

  // Loading screen with Alexandria theme
  if (quizState.loading || analyticsState.processing) {
    return (
      <LinearGradient
        colors={themeState.colors ? [
          themeState.colors.background,
          themeState.colors.surface
        ] : ['#F8F4E3', '#FFFFFF']}
        style={styles.container}
      >
        <StatusBar barStyle={themeState.isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.centerContent}>
          <Animatable.View
            animation="pulse"
            easing="ease-out"
            iterationCount="infinite"
            duration={2000}
          >
            <FontAwesome5 
              name={analyticsState.processing ? "chart-line" : "university"} 
              size={64} 
              color={themeState.colors?.alexandriaGold || '#D4AF37'} 
            />
          </Animatable.View>
          <ActivityIndicator 
            size="large" 
            color={themeState.colors?.alexandriaGold || '#D4AF37'}
            style={styles.loader}
          />
          <Text style={[
            styles.loadingText, 
            { color: themeState.colors?.text || '#1A2C5B' }
          ]}>
            {analyticsState.processing 
              ? 'Analyzing your wisdom journey...' 
              : 'Preparing the sacred scrolls...'
            }
          </Text>
          <Text style={[
            styles.loadingSubtext,
            { color: themeState.colors?.textSecondary || '#4A5568' }
          ]}>
            {analyticsState.processing 
              ? 'Unlocking insights and achievements' 
              : "Alexandria's wisdom awaits"
            }
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // Enhanced start screen with Alexandria theming
  const renderStartScreen = () => (
    <LinearGradient
      colors={themeState.colors ? [
        themeState.colors.background,
        themeState.colors.surface
      ] : ['#F8F4E3', '#FFFFFF']}
      style={styles.container}
    >
      <StatusBar barStyle={themeState.isDarkMode ? 'light-content' : 'dark-content'} />
      
      <Animatable.View animation="fadeInUp" duration={1000} style={styles.startContainer}>
        {/* Enhanced back button */}
        <TouchableOpacity
          style={[
            styles.backButton,
            { 
              backgroundColor: themeState.colors?.overlay || 'rgba(255, 255, 255, 0.9)',
              shadowColor: themeState.colors?.shadow || '#1A2C5B',
            }
          ]}
          onPress={() => NavigationHelper.safeGoBack(navigation)}
        >
          <FontAwesome5
            name="arrow-left"
            size={20}
            color={themeState.colors?.text || '#1A2C5B'}
          />
        </TouchableOpacity>

        {/* Enhanced challenge badge */}
        {routeParams.isChallenge && (
          <Animatable.View
            animation="bounceIn"
            delay={500}
            style={[
              styles.challengeBadge,
              { backgroundColor: themeState.colors?.alexandriaGold || '#D4AF37' }
            ]}
          >
            <FontAwesome5
              name="trophy"
              size={16}
              color={themeState.colors?.alexandriaNavy || '#1A2C5B'}
            />
            <Text style={[
              styles.challengeBadgeText,
              { color: themeState.colors?.alexandriaNavy || '#1A2C5B' }
            ]}>
              SACRED TRIAL
            </Text>
          </Animatable.View>
        )}

        {/* Enhanced start icon with animation */}
        <Animatable.View 
          animation="pulse" 
          easing="ease-out" 
          iterationCount="infinite" 
          duration={2000}
        >
          <LinearGradient
            colors={[
              themeState.colors?.alexandriaGold || '#D4AF37',
              themeState.colors?.alexandriaBronze || '#CD7F32'
            ]}
            style={styles.startIcon}
          >
            <FontAwesome5
              name={routeParams.isChallenge ? 'scroll' : 'university'}
              size={48}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Animatable.View>

        {/* Enhanced titles */}
        <Text style={[
          styles.startTitle,
          { color: themeState.colors?.text || '#1A2C5B' }
        ]}>
          {routeParams.isChallenge ? ((t && t('quiz.sacredTrialAwaits')) || 'Sacred Trial Awaits') : ((t && t('quiz.wisdomBeckons')) || 'Wisdom Beckons')}
        </Text>

        {quizMetadata.title && (
          <Text style={[
            styles.quizTitle,
            { color: themeState.colors?.textSecondary || '#4A5568' }
          ]}>
            {quizMetadata.title}
          </Text>
        )}

        {questions.length > 0 ? (
          <>
            <Text style={[
              styles.startSubtitle,
              { color: themeState.colors?.textSecondary || '#4A5568' }
            ]}>
              {questions.length} trial{questions.length !== 1 ? 's' : ''} • {
                routeParams.isChallenge 
                  ? 'Prove your mastery' 
                  : 'Test your knowledge'
              }
            </Text>

            {/* Enhanced question types preview */}
            <View style={styles.typesPreview}>
              {[...new Set(questions.map((q) => q.type))].map((type) => (
                <LinearGradient
                  key={type}
                  colors={[
                    themeState.colors?.surface || '#FFFFFF',
                    themeState.colors?.surfaceSecondary || '#F8F9FA'
                  ]}
                  style={[
                    styles.typeChip,
                    { borderColor: themeState.colors?.border || 'rgba(26, 44, 91, 0.2)' }
                  ]}
                >
                  <FontAwesome5
                    name={getQuestionIcon(type)}
                    size={14}
                    color={themeState.colors?.alexandriaGold || '#D4AF37'}
                  />
                  <Text style={[
                    styles.typeChipText,
                    { color: themeState.colors?.text || '#1A2C5B' }
                  ]}>
                    {type.replace(/_/g, ' ')}
                  </Text>
                </LinearGradient>
              ))}
            </View>

            {/* Enhanced start button */}
            <TouchableOpacity
              onPress={handleStartQuiz}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  themeState.colors?.alexandriaNavy || '#1A2C5B',
                  themeState.colors?.surfaceSecondary || '#2C3E50'
                ]}
                style={styles.startButton}
              >
                <FontAwesome5
                  name="play"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.startButtonText}>
                  {routeParams.isChallenge ? ((t && t('quiz.acceptTrial')) || 'Accept Trial') : ((t && t('quiz.beginJourney')) || 'Begin Journey')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[
              styles.noQuestionsTitle,
              { color: themeState.colors?.error || '#dc3545' }
            ]}>
              No Scrolls Available
            </Text>
            <Text style={[
              styles.noQuestionsText,
              { color: themeState.colors?.textSecondary || '#4A5568' }
            ]}>
              {routeParams.isChallenge 
                ? 'This sacred trial is no longer available in our archives.' 
                : 'Please return to the library and prepare new scrolls for study'
              }
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={[
                styles.backToUploadButton,
                { 
                  borderColor: themeState.colors?.border || 'rgba(26, 44, 91, 0.2)',
                  backgroundColor: themeState.colors?.surfaceSecondary || '#F8F9FA'
                }
              ]}
            >
              <Text style={[
                styles.backToUploadText,
                { color: themeState.colors?.text || '#1A2C5B' }
              ]}>
                Return to Library
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Animatable.View>
    </LinearGradient>
  );

  // Enhanced question rendering with improved animations
  const renderQuestion = (question, index) => {
    if (!question) return null;
    
    const userAnswer = userAnswers[question.id];
    const showFeedback = quizState.submitted;
    const difficultyInfo = getDifficultyInfo(question.difficulty);

    return (
      <Animated.View
        key={question.id}
        style={[
          { 
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={[
            themeState.colors?.surface || '#FFFFFF',
            themeState.colors?.surfaceSecondary || '#F8F9FA'
          ]}
          style={[
            styles.questionCard,
            { 
              borderColor: themeState.colors?.border || 'rgba(26, 44, 91, 0.2)',
              shadowColor: themeState.colors?.shadow || '#1A2C5B'
            }
          ]}
        >
          {/* Enhanced question header */}
          <View style={styles.questionHeader}>
            <LinearGradient
              colors={[
                themeState.colors?.alexandriaGold || '#D4AF37',
                themeState.colors?.alexandriaBronze || '#CD7F32'
              ]}
              style={styles.questionTypeIcon}
            >
              <FontAwesome5
                name={getQuestionIcon(question.type)}
                size={18}
                color="#FFFFFF"
              />
            </LinearGradient>
            
            <View style={styles.questionHeaderText}>
              <Text style={[
                styles.questionNumber,
                { color: themeState.colors?.text || '#1A2C5B' }
              ]}>
                {(t && t('quiz.trial')) || 'Trial'} {question.questionNumber || index + 1}
              </Text>
              
              {question.difficulty && (
                <View style={styles.difficultyBadge}>
                  <FontAwesome5
                    name={difficultyInfo.icon}
                    size={12}
                    color={difficultyInfo.color}
                  />
                  <Text style={[
                    styles.difficultyText,
                    { color: difficultyInfo.color }
                  ]}>
                    {question.difficulty}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[
            styles.questionText,
            { color: themeState.colors?.text || '#1A2C5B' }
          ]}>
            {question.questionText}
          </Text>

          {/* Visual Elements Rendering */}
          {question.visual_elements && question.visual_elements.length > 0 && (
            <VisualQuestionRenderer
              visualElements={question.visual_elements}
              style={styles.visualContent}
              onInteraction={(data) => {
                logger.info('Visual interaction:', data);
                // Track visual interactions for analytics
                if (data.type === 'table_cell_tap' || data.type === 'sql_query') {
                  setUserAnswers(prev => ({
                    ...prev,
                    [`${question.id}_visual`]: data
                  }));
                }
              }}
            />
          )}

          {/* Database Table Specific Rendering for Database Science */}
          {question.database_tables && question.database_tables.length > 0 && (
            <DatabaseTableVisualization
              tables={question.database_tables}
              interactive={!quizState.submitted}
              theme={themeState.isDarkMode ? 'dark' : 'light'}
              style={styles.databaseContent}
              onInteraction={(data) => {
                logger.info('Database interaction:', data);
                setUserAnswers(prev => ({
                  ...prev,
                  [`${question.id}_database`]: data
                }));
              }}
            />
          )}

          {/* Enhanced Multiple Choice Rendering */}
          {question.type === 'multiple_choice' && (
            <View style={styles.optionsContainer}>
              {question.options.map((option, optIndex) => {
                const isSelected = userAnswer === option.label;
                const isCorrect = option.label === question.correctAnswer;
                
                return (
                  <Animatable.View 
                    key={option.id} 
                    animation="slideInLeft" 
                    delay={optIndex * 100}
                  >
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        {
                          borderColor: isSelected && !showFeedback
                            ? themeState.colors?.alexandriaGold
                            : showFeedback && isCorrect
                            ? themeState.colors?.success
                            : showFeedback && isSelected && !isCorrect
                            ? themeState.colors?.error
                            : themeState.colors?.border,
                          backgroundColor: isSelected && !showFeedback
                            ? themeState.colors?.alexandriaGold + '20'
                            : showFeedback && isCorrect
                            ? themeState.colors?.success + '20'
                            : showFeedback && isSelected && !isCorrect
                            ? themeState.colors?.error + '20'
                            : themeState.colors?.surface,
                        }
                      ]}
                      onPress={() => handleSelectOption(question.id, option.label)}
                      disabled={quizState.submitted}
                      activeOpacity={0.8}
                    >
                      <Animated.View style={[
                        styles.optionContent,
                        { transform: [{ scale: scaleAnim }] }
                      ]}>
                        <LinearGradient
                          colors={[
                            isSelected && !showFeedback
                              ? themeState.colors?.alexandriaGold
                              : showFeedback && isCorrect
                              ? themeState.colors?.success
                              : showFeedback && isSelected && !isCorrect
                              ? themeState.colors?.error
                              : themeState.colors?.alexandriaBronze,
                            isSelected && !showFeedback
                              ? themeState.colors?.alexandriaBronze
                              : showFeedback && isCorrect
                              ? themeState.colors?.success
                              : showFeedback && isSelected && !isCorrect
                              ? themeState.colors?.error
                              : themeState.colors?.alexandriaGold,
                          ]}
                          style={styles.optionLetter}
                        >
                          <Text style={styles.optionLetterText}>
                            {option.label}
                          </Text>
                        </LinearGradient>
                        
                        <Text style={[
                          styles.optionText,
                          { 
                            color: isSelected && !showFeedback
                              ? themeState.colors?.alexandriaGold
                              : showFeedback && isCorrect
                              ? themeState.colors?.success
                              : showFeedback && isSelected && !isCorrect
                              ? themeState.colors?.error
                              : themeState.colors?.text
                          }
                        ]}>
                          {option.text}
                        </Text>
                      </Animated.View>
                    </TouchableOpacity>
                  </Animatable.View>
                );
              })}
            </View>
          )}

          {/* Enhanced True/False Rendering */}
          {question.type === 'true_false' && (
            <View style={styles.trueFalseContainer}>
              {['true', 'false'].map((value, index) => {
                // Enhanced true/false comparison logic
                const normalizeAnswer = (answer) => {
                  if (answer === null || answer === undefined) return '';
                  if (typeof answer === 'boolean') return answer ? 'true' : 'false';
                  return String(answer).trim().toLowerCase();
                };

                const normalizedUserAnswer = normalizeAnswer(userAnswer);
                const normalizedCorrectAnswer = normalizeAnswer(question.correctAnswer);
                
                const isSelected = normalizedUserAnswer === value;
                const isCorrect = normalizedCorrectAnswer === value;
                
                return (
                  <Animatable.View
                    key={value}
                    animation="bounceIn"
                    delay={index * 200}
                    style={styles.trueFalseButtonContainer}
                  >
                    <TouchableOpacity
                      style={[
                        styles.trueFalseButton,
                        {
                          borderColor: isSelected && !showFeedback
                            ? themeState.colors?.alexandriaGold
                            : showFeedback && isCorrect
                            ? themeState.colors?.success
                            : showFeedback && isSelected && !isCorrect
                            ? themeState.colors?.error
                            : themeState.colors?.border,
                          backgroundColor: isSelected && !showFeedback
                            ? themeState.colors?.alexandriaGold + '20'
                            : showFeedback && isCorrect
                            ? themeState.colors?.success + '20'
                            : showFeedback && isSelected && !isCorrect
                            ? themeState.colors?.error + '20'
                            : themeState.colors?.surface,
                        }
                      ]}
                      onPress={() => handleSelectOption(question.id, value)}
                      disabled={quizState.submitted}
                      activeOpacity={0.8}
                    >
                      {/* Icon for True/False */}
                      <LinearGradient
                        colors={[
                          isSelected && !showFeedback
                            ? themeState.colors?.alexandriaGold
                            : showFeedback && isCorrect
                            ? themeState.colors?.success
                            : showFeedback && isSelected && !isCorrect
                            ? themeState.colors?.error
                            : themeState.colors?.alexandriaBronze,
                          isSelected && !showFeedback
                            ? themeState.colors?.alexandriaBronze
                            : showFeedback && isCorrect
                            ? themeState.colors?.success
                            : showFeedback && isSelected && !isCorrect
                            ? themeState.colors?.error
                            : themeState.colors?.alexandriaGold,
                        ]}
                        style={styles.trueFalseIcon}
                      >
                        <FontAwesome5
                          name={value === 'true' ? 'check' : 'times'}
                          size={32}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                      
                      {/* Clear Text Label */}
                      <Text style={[
                        styles.trueFalseText,
                        {
                          color: isSelected && !showFeedback
                            ? themeState.colors?.alexandriaGold
                            : showFeedback && isCorrect
                            ? themeState.colors?.success
                            : showFeedback && isSelected && !isCorrect
                            ? themeState.colors?.error
                            : themeState.colors?.text
                        }
                      ]}>
                        {value.toUpperCase()}
                      </Text>
                      
                      {/* Show feedback text during results */}
                      {showFeedback && isCorrect && (
                        <Text style={[
                          styles.trueFalseCorrectText,
                          { color: themeState.colors?.success }
                        ]}>
                          ✓ Correct
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animatable.View>
                );
              })}
            </View>
          )}

          {/* Enhanced Open Ended and Math Questions */}
          {(question.type === 'open_ended' || question.type === 'math') && (
            <Animatable.View animation="fadeInUp" delay={300}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: themeState.colors?.border || 'rgba(26, 44, 91, 0.3)',
                    backgroundColor: themeState.colors?.surface || '#FFFFFF',
                    color: themeState.colors?.text || '#1A2C5B',
                  }
                ]}
                value={userAnswer || ''}
                editable={!quizState.submitted}
                onChangeText={(text) => handleShortAnswer(question.id, text)}
                placeholder={
                  question.type === 'math' 
                    ? 'Enter your calculation...' 
                    : 'Share your wisdom here...'
                }
                placeholderTextColor={themeState.colors?.textTertiary || '#9CA3AF'}
                multiline={question.type === 'open_ended'}
                textAlignVertical="top"
                keyboardType={question.type === 'math' ? 'numeric' : 'default'}
                maxLength={1000}
              />
              
              {question.type === 'math' && question.formula && (
                <Text style={[
                  styles.formulaHint,
                  { color: themeState.colors?.alexandriaGold || '#D4AF37' }
                ]}>
                  {t('quiz.sacredFormula')}: {question.formula}
                </Text>
              )}
            </Animatable.View>
          )}

          {/* Enhanced Feedback Section */}
          {showFeedback && (
            <Animatable.View
              animation="slideInUp"
              style={[
                styles.feedbackSection,
                {
                  backgroundColor: question.isCorrect
                    ? themeState.colors?.success + '10'
                    : themeState.colors?.error + '10',
                  borderColor: question.isCorrect
                    ? themeState.colors?.success
                    : themeState.colors?.error,
                }
              ]}
            >
              <View style={styles.feedbackHeader}>
                <FontAwesome5
                  name={question.isCorrect ? 'check-circle' : 'times-circle'}
                  size={20}
                  color={question.isCorrect ? themeState.colors?.success : themeState.colors?.error}
                />
                <Text style={[
                  styles.feedbackResult,
                  { 
                    color: question.isCorrect 
                      ? themeState.colors?.success 
                      : themeState.colors?.error 
                  }
                ]}>
                  {question.isCorrect ? t('quiz.wisdomGained') : t('quiz.learnAndGrow')}
                </Text>
              </View>
              
              <View style={styles.answerComparison}>
                <Text style={[
                  styles.answerLabel,
                  { color: themeState.colors?.textSecondary || '#4A5568' }
                ]}>
                  Your answer:{' '}
                  <Text style={[
                    styles.userAnswerText,
                    { color: themeState.colors?.text || '#1A2C5B' }
                  ]}>
                    {userAnswer || 'No answer given'}
                  </Text>
                </Text>
                
                {!question.isCorrect && (
                  <Text style={[
                    styles.answerLabel,
                    { color: themeState.colors?.textSecondary || '#4A5568' }
                  ]}>
                    Correct wisdom:{' '}
                    <Text style={[
                      styles.correctAnswerText,
                      { color: themeState.colors?.success || '#28a745' }
                    ]}>
                      {question.correctAnswer}
                    </Text>
                  </Text>
                )}
              </View>
            </Animatable.View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  // Enhanced quiz content rendering
  const renderQuizContent = () => (
    <LinearGradient
      colors={[
        themeState.colors?.background || '#F8F4E3',
        themeState.colors?.surface || '#FFFFFF'
      ]}
      style={styles.container}
    >
      <StatusBar barStyle={themeState.isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Enhanced header */}
      <LinearGradient
        colors={[
          themeState.colors?.overlay || 'rgba(255, 255, 255, 0.9)',
          themeState.colors?.surface || '#FFFFFF'
        ]}
        style={styles.quizHeader}
      >
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: themeState.colors?.alexandriaGold + '20' || 'rgba(212, 175, 55, 0.2)' }
          ]}
          onPress={() => NavigationHelper.safeGoBack(navigation)}
        >
          <FontAwesome5
            name="arrow-left"
            size={18}
            color={themeState.colors?.alexandriaGold || '#D4AF37'}
          />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[
            styles.headerTitle,
            { color: themeState.colors?.text || '#1A2C5B' }
          ]}>
            {routeParams.isChallenge ? ((t && t('quiz.sacredTrial')) || 'Sacred Trial') : ((t && t('quiz.wisdomQuest')) || 'Wisdom Quest')}
          </Text>
          {quizMetadata.title && (
            <Text style={[
              styles.headerSubtitle,
              { color: themeState.colors?.textSecondary || '#4A5568' }
            ]}>
              {quizMetadata.title}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: themeState.colors?.error + '20' || 'rgba(220, 53, 69, 0.2)' }
          ]}
          onPress={() =>
            showAlexandriaAlert(
              t('quiz.abandonQuest'),
              'Your progress through this trial will be lost forever.',
              null,
              [
                { text: 'Continue', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => NavigationHelper.safeGoBack(navigation) }
              ]
            )
          }
        >
          <FontAwesome5
            name="times"
            size={18}
            color={themeState.colors?.error || '#dc3545'}
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Enhanced progress section */}
      <LinearGradient
        colors={[
          themeState.colors?.surface || '#FFFFFF',
          themeState.colors?.surfaceSecondary || '#F8F9FA'
        ]}
        style={styles.progressContainer}
      >
        <View style={styles.progressInfo}>
          <Text style={[
            styles.progressText,
            { color: themeState.colors?.text || '#1A2C5B' }
          ]}>
            {(t && t('quiz.trial')) || 'Trial'} {quizState.currentQuestionIndex + 1} {(t && t('quiz.of')) || 'of'} {questions.length}
          </Text>
          <Text style={[
            styles.progressPercent,
            { color: themeState.colors?.alexandriaGold || '#D4AF37' }
          ]}>
            {progressData.percentage}% Complete
          </Text>
        </View>
        
        <View style={[
          styles.progressBar,
          { backgroundColor: themeState.colors?.borderSecondary || 'rgba(26, 44, 91, 0.1)' }
        ]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressData.width,
                backgroundColor: themeState.colors?.alexandriaGold || '#D4AF37'
              }
            ]}
          />
        </View>
      </LinearGradient>

      {/* Enhanced question content */}
      <ScrollView
        style={styles.questionScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {quizState.submitted
          ? questionsState.map((q, index) => renderQuestion(q, index))
          : currentQuestion && renderQuestion(currentQuestion, quizState.currentQuestionIndex)
        }
      </ScrollView>

      {/* Enhanced navigation/action buttons */}
      {!quizState.submitted ? (
        <LinearGradient
          colors={[
            themeState.colors?.surface || '#FFFFFF',
            themeState.colors?.overlay || 'rgba(255, 255, 255, 0.9)'
          ]}
          style={styles.navigationContainer}
        >
          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor: quizState.currentQuestionIndex === 0 
                  ? themeState.colors?.borderSecondary 
                  : themeState.colors?.surface,
                borderColor: themeState.colors?.border || 'rgba(26, 44, 91, 0.2)',
                opacity: quizState.currentQuestionIndex === 0 ? 0.5 : 1,
              }
            ]}
            onPress={() => navigateQuestion('prev')}
            disabled={quizState.currentQuestionIndex === 0}
          >
            <FontAwesome5
              name="chevron-left"
              size={16}
              color={themeState.colors?.text || '#1A2C5B'}
            />
            <Text style={[
              styles.navButtonText,
              { color: themeState.colors?.text || '#1A2C5B' }
            ]}>
              Previous
            </Text>
          </TouchableOpacity>

          {quizState.currentQuestionIndex === questions.length - 1 ? (
            <TouchableOpacity onPress={handleSubmit}>
              <LinearGradient
                colors={[
                  themeState.colors?.alexandriaGold || '#D4AF37',
                  themeState.colors?.alexandriaBronze || '#CD7F32'
                ]}
                style={styles.submitButton}
              >
                <FontAwesome5
                  name="scroll"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>
                  {routeParams.isChallenge ? ((t && t('quiz.completeTrial')) || 'Complete Trial') : ((t && t('quiz.submitWisdom')) || 'Submit Wisdom')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: themeState.colors?.alexandriaNavy || '#1A2C5B',
                  borderColor: themeState.colors?.alexandriaNavy || '#1A2C5B',
                }
              ]}
              onPress={() => navigateQuestion('next')}
            >
              <Text style={[
                styles.navButtonText,
                { color: '#FFFFFF' }
              ]}>
                Next
              </Text>
              <FontAwesome5
                name="chevron-right"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </LinearGradient>
      ) : (
        // Enhanced results section
        <Animatable.View
          animation="slideInUp"
          style={[
            styles.resultsContainer,
            { 
              backgroundColor: themeState.colors?.overlay || 'rgba(255, 255, 255, 0.9)',
              borderTopColor: themeState.colors?.border || 'rgba(26, 44, 91, 0.2)'
            }
          ]}
        >
          <LinearGradient
            colors={[
              themeState.colors?.alexandriaGold || '#D4AF37',
              themeState.colors?.alexandriaBronze || '#CD7F32'
            ]}
            style={styles.scoreDisplay}
          >
            <Text style={styles.scoreLabel}>
              {routeParams.isChallenge ? t('quiz.trialMastery') : t('quiz.wisdomGained')}
            </Text>
            <Animated.Text style={styles.scoreValue}>
              {quizState.score}/{questions.length}
            </Animated.Text>
            <Text style={styles.scorePercent}>
              {Math.round((quizState.score / questions.length) * 100)}%
            </Text>
            {routeParams.isChallenge && (
              <Text style={styles.challengeCompleteText}>
                {t('quiz.trialComplete')}
              </Text>
            )}
          </LinearGradient>
          
          <TouchableOpacity onPress={handleRetake}>
            <LinearGradient
              colors={[
                themeState.colors?.alexandriaNavy || '#1A2C5B',
                themeState.colors?.surfaceSecondary || '#2C3E50'
              ]}
              style={styles.retakeButton}
            >
              <FontAwesome5
                name="redo"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.retakeButtonText}>
                {routeParams.isChallenge ? t('quiz.retakeTrial') : t('quiz.seekMoreWisdom')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      )}
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      {quizState.started ? renderQuizContent() : renderStartScreen()}
    </View>
  );
};

// Enhanced styles with Alexandria theming
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Start Screen Styles
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeBadge: {
    position: 'absolute',
    top: 60,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  startIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  startTitle: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  startSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
    lineHeight: 24,
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
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    opacity: 0.8,
    lineHeight: 22,
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

  // Quiz Content Styles
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Question Styles
  questionScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  questionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  questionHeaderText: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 24,
  },

  // Option Styles
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLetterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },

  // True/False Styles
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  trueFalseButtonContainer: {
    flex: 1,
  },
  trueFalseButton: {
    alignItems: 'center',
    paddingVertical: 32, // Increased padding
    paddingHorizontal: 20,
    borderRadius: 20, // Slightly more rounded
    borderWidth: 3, // Thicker border for clarity
    gap: 8, // Reduced gap since we have icon container
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 160, // Ensure consistent height
  },
  trueFalseText: {
    fontSize: 18, // Larger text
    fontWeight: '700', // Bolder text
    letterSpacing: 1, // Letter spacing for clarity
  },
  trueFalseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trueFalseCorrectText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  // Input Styles
  textInput: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formulaHint: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Feedback Styles
  feedbackSection: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    gap: 12,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  userAnswerText: {
    fontWeight: '700',
  },
  correctAnswerText: {
    fontWeight: '700',
  },

  // Navigation Styles
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    borderTopWidth: 1,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Results Styles
  resultsContainer: {
    padding: 20,
    borderTopWidth: 1,
    gap: 20,
  },
  scoreDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  scorePercent: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  challengeCompleteText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },

  // Visual Content Styles
  visualContent: {
    marginVertical: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  databaseContent: {
    marginVertical: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default QuizScreen;