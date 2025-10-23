import { useCallback } from 'react';
import { Alert, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import UnifiedNotificationService from '../utils/UnifiedNotificationService';
import AdvancedAnalyticsService from '../services/AdvancedAnalyticsService';
import { evaluateAnswer } from '../utils/quizHelpers';
import logger from '../utils/logger';
import { QUIZ_PASSING_SCORE } from '../utils/chapterLockUtils';

interface QuizHandlersParams {
  quizState: any;
  userAnswers: Record<string, any>;
  questionsState: any[];
  quizMetadata: any;
  routeParams: any;
  userId: string;
  setUserAnswers: (answers: any) => void;
  setQuestionsState: (questions: any) => void;
  setQuizState: (state: any) => void;
  setQuizMetadata: (metadata: any) => void;
  setAnalyticsState: (state: any) => void;
  animateSelection: () => void;
  animateSubmission: (correctCount: number) => void;
  animateQuestionTransition: (direction: 'next' | 'prev') => void;
  navigation: any;
  t: (key: string) => string;
  showAlexandriaAlert: (title: string, message: string, onConfirm?: any, buttons?: any) => void;
  saveChapterQuizResult?: (chapterId: string, chapterIndex: number, score: number, totalQuestions: number) => Promise<void>;
}

export const useQuizHandlers = (params: QuizHandlersParams) => {
  const {
    quizState,
    userAnswers,
    questionsState,
    quizMetadata,
    routeParams,
    userId,
    setUserAnswers,
    setQuestionsState,
    setQuizState,
    setQuizMetadata,
    setAnalyticsState,
    animateSelection,
    animateSubmission,
    animateQuestionTransition,
    navigation,
    t,
    showAlexandriaAlert,
    saveChapterQuizResult,
  } = params;

  /**
   * Handle selecting an answer option
   */
  const handleSelectOption = useCallback((questionId: string, selectedValue: any) => {
    if (quizState.submitted) return;

    setUserAnswers(prev => ({
      ...prev,
      [questionId]: selectedValue
    }));

    // Haptic feedback for better UX
    Vibration.vibrate(50);

    // Smooth selection animation
    animateSelection();
  }, [quizState.submitted, setUserAnswers, animateSelection]);

  /**
   * Handle short answer input
   */
  const handleShortAnswer = useCallback((questionId: string, text: string) => {
    if (quizState.submitted) return;

    const truncatedText = text.slice(0, 1000); // Increased limit
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: truncatedText
    }));
  }, [quizState.submitted, setUserAnswers]);

  /**
   * Save challenge result
   */
  const saveChallengeResult = async (finalScore: number, finalQuestions: any[], completionTime: number) => {
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

  /**
   * Handle quiz completion
   */
  const handleQuizComplete = async (results: any[], finalScore: number, finalQuestions: any[]) => {
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
        const notificationResults = await UnifiedNotificationService.scheduleIntelligentNotifications(
          user.uid,
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

  /**
   * Handle quiz submission with analytics
   */
  const handleSubmit = async () => {
    if (questionsState.length === 0) {
      showAlexandriaAlert('Error', 'No trials to complete.');
      return;
    }

    // Check if all questions have been answered
    const unansweredQuestions = questionsState.filter(q => {
      const answer = userAnswers[q.id];
      return answer === null || answer === undefined || answer === '';
    });

    if (unansweredQuestions.length > 0) {
      showAlexandriaAlert(
        'Incomplete Quiz',
        `Please answer all questions before submitting. You have ${unansweredQuestions.length} unanswered question${unansweredQuestions.length > 1 ? 's' : ''}.`
      );
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
    animateSubmission(correctCount);

    // Celebration vibration for good scores
    const percentage = (correctCount / updatedQuestions.length) * 100;
    if (percentage >= 80) {
      Vibration.vibrate([100, 50, 100, 50, 200]);
    } else if (percentage >= 60) {
      Vibration.vibrate([100, 50, 100]);
    }

    // Save chapter quiz result if this is a Book Study quiz
    if (routeParams.source === 'book_study' && routeParams.materialId && routeParams.chapterIndex !== undefined) {
      try {
        if (!saveChapterQuizResult) {
          logger.error('saveChapterQuizResult function not provided for Book Study quiz');
          showAlexandriaAlert(
            'Error',
            'Unable to save quiz result. Please return to the chapter and try again.',
            () => {
              navigation.navigate('BookDetail', {
                materialId: routeParams.materialId
              });
            }
          );
          return;
        } else {
          // Use the hook-based save function with 0-based chapterIndex
          await saveChapterQuizResult(
            routeParams.chapterId || `chapter_${routeParams.chapterIndex}`,
            routeParams.chapterIndex, // Already 0-based from navigation
            correctCount,
            updatedQuestions.length
          );

          const passed = percentage >= QUIZ_PASSING_SCORE;

          // Show success/failure message
          if (passed) {
            setTimeout(() => {
              showAlexandriaAlert(
                'Chapter Unlocked!',
                `Excellent work! You scored ${percentage.toFixed(0)}% and unlocked the next chapter.`,
                () => {
                  // Navigate to BookDetailScreen after user dismisses alert
                  navigation.navigate('BookDetail', {
                    materialId: routeParams.materialId
                  });
                }
              );
            }, 1000);
          } else {
            setTimeout(() => {
              showAlexandriaAlert(
                'Keep Studying!',
                `You scored ${percentage.toFixed(0)}%. You need ${QUIZ_PASSING_SCORE}% to unlock the next chapter. Review the material and try again!`,
                () => {
                  // Navigate to BookDetailScreen to review chapters
                  navigation.navigate('BookDetail', {
                    materialId: routeParams.materialId
                  });
                }
              );
            }, 1000);
          }

          // Skip the normal ResultsScreen navigation for Book Study quizzes
          return;
        }
      } catch (error) {
        logger.error('Failed to save chapter quiz result', error);
        showAlexandriaAlert(
          'Error',
          'Failed to save your quiz result. Please try again.',
          () => {
            // Still navigate back to BookDetailScreen on error
            navigation.navigate('BookDetail', {
              materialId: routeParams.materialId
            });
          }
        );
        return;
      }
    }

    // Submit to Advanced Analytics and Navigate
    const navigateToResults = (metadata: any) => {
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
          subject: routeParams.metadata?.subject || routeParams.metadata?.topic || routeParams.subject,
          topic: routeParams.metadata?.topic || routeParams.metadata?.subject || routeParams.subject,
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
          subject: routeParams.metadata?.subject || routeParams.metadata?.topic || routeParams.subject,
          topic: routeParams.metadata?.topic || routeParams.metadata?.subject || routeParams.subject,
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
        subject: routeParams.metadata?.subject || routeParams.metadata?.topic || routeParams.subject,
        topic: routeParams.metadata?.topic || routeParams.metadata?.subject || routeParams.subject,
      };

      navigateToResults(fallbackMetadata);
    }
  };

  /**
   * Navigate between questions
   */
  const navigateQuestion = useCallback((direction: 'next' | 'prev', questionsLength: number) => {
    // ✅ FIX: Add validation and logging
    const safeQuestionsLength = typeof questionsLength === 'number' && questionsLength > 0 ? questionsLength : 0;
    const safeCurrentIndex = typeof quizState.currentQuestionIndex === 'number' ? quizState.currentQuestionIndex : 0;

    if (safeQuestionsLength === 0) {
      logger.warn('⚠️ Cannot navigate: No questions available');
      return;
    }

    const newIndex = direction === 'next'
      ? Math.min(safeCurrentIndex + 1, safeQuestionsLength - 1)
      : Math.max(safeCurrentIndex - 1, 0);

    if (newIndex === safeCurrentIndex) {
      logger.info(`📍 Already at ${direction === 'next' ? 'last' : 'first'} question`);
      return;
    }

    // Verify the new index is within bounds
    if (newIndex < 0 || newIndex >= safeQuestionsLength) {
      logger.error(`❌ Invalid navigation: index ${newIndex} out of bounds (0-${safeQuestionsLength - 1})`);
      return;
    }

    logger.info(`🧭 Navigating ${direction}: ${safeCurrentIndex} → ${newIndex} (of ${safeQuestionsLength})`);
    animateQuestionTransition(direction);
    setQuizState(prev => ({ ...prev, currentQuestionIndex: newIndex }));
  }, [quizState.currentQuestionIndex, setQuizState, animateQuestionTransition]);

  /**
   * Start the quiz
   */
  const handleStartQuiz = useCallback(() => {
    if (questionsState.length === 0) {
      Alert.alert('Error', 'No questions available to start the quiz.');
      return;
    }

    setQuizState(prev => ({
      ...prev,
      started: true,
      startTime: Date.now()
    }));

    setQuizMetadata(prev => ({
      ...prev,
      startTime: Date.now()
    }));

    Vibration.vibrate(100);
  }, [questionsState.length, setQuizState, setQuizMetadata]);

  return {
    handleSelectOption,
    handleShortAnswer,
    handleQuizComplete,
    handleSubmit,
    navigateQuestion,
    handleStartQuiz,
  };
};
