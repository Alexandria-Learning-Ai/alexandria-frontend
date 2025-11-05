import { useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';
import { getThemeColors } from '../utils/themeColors';
import { processQuestionOptions } from '../utils/quizHelpers';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';
import { API_BASE_URL } from '../config/api';

interface QuizInitializationParams {
  routeParams: any;
  themeState: any;
  quizState: any;
  setQuizState: (state: any) => void;
  setQuizMetadata: (metadata: any) => void;
  setUserAnswers: (answers: any) => void;
  setQuestionsState: (questions: any) => void;
  setThemeState: (state: any) => void;
  showAlexandriaAlert: (title: string, message: string, onConfirm?: any, buttons?: any) => void;
  navigation: any;
  t: (key: string) => string;
  animationRefs: any[];
}

export const useQuizInitialization = (params: QuizInitializationParams) => {
  const {
    routeParams,
    themeState,
    quizState,
    setQuizState,
    setQuizMetadata,
    setUserAnswers,
    setQuestionsState,
    setThemeState,
    showAlexandriaAlert,
    navigation,
    t,
    animationRefs,
  } = params;

  /**
   * Load shared quiz data
   */
  const loadSharedQuizData = useCallback(async (quiz: any) => {
    try {
      if (!quiz?.questions?.length) {
        throw new Error('Invalid scroll format - no wisdom found');
      }

      setQuizMetadata(prev => ({
        ...prev,
        title: quiz.title || (t && t('quiz.sharedWisdomChallenge')) || 'Shared Wisdom Challenge'
      }));

      const processedQuestions = quiz.questions.map((q: any, index: number) => ({
        id: q.id || uuid.v4(),
        questionNumber: q.questionNumber || q.question_number || index + 1,
        questionText: q.questionText || q.question_text || q.text || q.question || '',
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

      const initialAnswers: Record<string, any> = {};
      processedQuestions.forEach(q => {
        initialAnswers[q.id] = null;
      });

      setUserAnswers(initialAnswers);
      setQuestionsState(processedQuestions);
    } catch (error) {
      logger.error('Error loading shared quiz:', error);
      throw new Error('Failed to decipher the ancient scroll');
    }
  }, [setQuizMetadata, setUserAnswers, setQuestionsState, t]);

  /**
   * Check if ID is a UUID (async quiz) vs shared quiz ID
   */
  const isAsyncQuizId = (id: string): boolean => {
    // UUID format: 8-4-4-4-12 characters (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  /**
   * Load quiz by ID - supports both async quizzes (from backend) and shared quizzes (from AsyncStorage)
   */
  const loadQuizById = useCallback(async (id: string) => {
    try {
      // Check if this is an async quiz ID (UUID format)
      if (isAsyncQuizId(id)) {
        logger.info('📡 Loading async quiz from backend:', id);

        try {
          // Fetch from backend API
          const response = await axios.get(`${API_BASE_URL}/async/quiz/result/${id}`);

          logger.info('✅ Async quiz fetched successfully:', response.data);

          // Backend response structure: { quiz_id, quiz_data, file_name, created_at, ... }
          const { quiz_data, file_name, metadata } = response.data;

          if (!quiz_data) {
            throw new Error('Invalid quiz data format from backend');
          }

          // Handle two formats:
          // 1. quiz_data is array of questions (direct format)
          // 2. quiz_data is object with questions property (nested format)
          const questions = Array.isArray(quiz_data) ? quiz_data : quiz_data.questions;

          if (!questions || questions.length === 0) {
            throw new Error('No questions found in quiz data');
          }

          // Transform backend format to match shared quiz format
          const quiz = {
            title: file_name ? `Quiz: ${file_name}` : 'Alexandria Trial of Wisdom',
            questions: questions,
            metadata: metadata || {}
          };

          await loadSharedQuizData(quiz);
          return;
        } catch (apiError: any) {
          logger.error('❌ Failed to fetch async quiz from backend:', apiError);

          if (apiError.response?.status === 404) {
            throw new Error('Scroll has expired from the archives');
          } else if (apiError.response?.status >= 500) {
            throw new Error('The archives are temporarily unavailable');
          } else {
            throw new Error('Unable to retrieve scroll from the archives');
          }
        }
      }

      // Fallback to AsyncStorage for shared quizzes (legacy format)
      logger.info('📦 Loading shared quiz from AsyncStorage:', id);
      const quizData = await AsyncStorage.getItem(`shared_quiz_${id}`);
      if (!quizData) {
        throw new Error('Scroll has vanished from the archives');
      }

      const quiz = JSON.parse(quizData);
      await loadSharedQuizData(quiz);
    } catch (error) {
      logger.error('Error loading quiz by ID:', error);
      throw error; // Re-throw to preserve specific error messages
    }
  }, [loadSharedQuizData]);

  /**
   * Process regular quiz from backend
   */
  const processRegularQuiz = useCallback(() => {
    try {
      if (!Array.isArray(routeParams.backendQuizData) || routeParams.backendQuizData.length === 0) {
        throw new Error('No wisdom to be tested');
      }

      const processedQuestions = routeParams.backendQuizData.map((q: any, index: number) => {
        // Debug logging for true/false questions
        if (q.type === 'true_false') {
          logger.info(`🔍 Raw Backend True/False Question ${index + 1}:`, {
            originalData: q,
            correctAnswer: q.correct_answer,
            correctAnswerType: typeof q.correct_answer,
          });
        }

        return {
          id: q.id || uuid.v4(),
          questionNumber: q.questionNumber || q.question_number || index + 1,
          questionText: q.questionText || q.question_text || q.text || q.question || '',
          text: q.questionText || q.question_text || q.text || q.question || '',
          type: q.type || 'multiple_choice',
          options: processQuestionOptions(q.options),
          correctAnswer: q.correctAnswer || q.correct_answer || '',
          userAnswer: null,
          isCorrect: null,
          keywords: q.keywords || [],
          formula: q.formula || null,
          solution_steps: q.solution_steps || [],
          difficulty: q.difficulty || 'medium',
          category: q.category || routeParams.metadata?.category || 'general',
          visualData: q.visual_data || q.visualData || null,
          hasVisual: q.has_visual || q.hasVisual || false,
        };
      });

      const initialAnswers: Record<string, any> = {};
      processedQuestions.forEach(q => {
        initialAnswers[q.id] = null;
      });

      setUserAnswers(initialAnswers);
      setQuestionsState(processedQuestions);
    } catch (error) {
      logger.error('Error processing regular quiz:', error);
      throw new Error('Failed to prepare the trials');
    }
  }, [routeParams.backendQuizData, routeParams.metadata, setUserAnswers, setQuestionsState]);

  /**
   * Initialize quiz on mount
   */
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

    // Cleanup
    return () => {
      animationRefs.forEach(anim => {
        anim?.stopAnimation?.();
      });
    };
  }, [routeParams]);

  /**
   * Initialize theme colors
   */
  useEffect(() => {
    const colors = getThemeColors(themeState.isDarkMode);
    setThemeState(prev => ({ ...prev, colors }));
  }, [themeState.isDarkMode, setThemeState]);

  /**
   * Hardware back button handling
   */
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
  }, [quizState.started, quizState.submitted, navigation, showAlexandriaAlert, t]);

  return {
    loadSharedQuizData,
    loadQuizById,
    processRegularQuiz,
  };
};
