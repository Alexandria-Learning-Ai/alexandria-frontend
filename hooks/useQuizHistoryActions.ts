/**
 * ⚠️ DEPRECATED - Use hooks/api/useQuizHistory.ts instead
 *
 * This hook will be removed in a future version.
 * The new useQuizHistory hook provides deleteQuiz() and clearAllHistory().
 *
 * Migration guide: See SCREEN_MIGRATION_AUDIT.md
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';

// Log deprecation warning
if (__DEV__) {
  logger.warn(
    '⚠️ useQuizHistoryActions is deprecated. Please migrate to hooks/api/useQuizHistory.ts\n' +
    'See SCREEN_MIGRATION_AUDIT.md for migration guide.'
  );
}

interface QuizHistoryItem {
  id: string;
  title: string;
  questions: any[];
  results: any;
  metadata: any;
  userAnswers: any[];
  createdAt: string;
  backendId?: string;
  isFromBackend?: boolean;
}

interface UseQuizHistoryActionsProps {
  history: QuizHistoryItem[];
  setHistory: (history: QuizHistoryItem[]) => void;
  selectedFilter: string;
  applyFilter: (history: QuizHistoryItem[], filter: string) => void;
  navigation: any;
}

/**
 * useQuizHistoryActions - Manages quiz history actions (delete, retake, review, clear)
 *
 * Features:
 * - Delete individual quizzes with backend sync
 * - Retake quiz with original data
 * - Review quiz answers
 * - Clear all history with confirmation
 * - Automatic filter reapplication after mutations
 */
export const useQuizHistoryActions = ({
  history,
  setHistory,
  selectedFilter,
  applyFilter,
  navigation,
}: UseQuizHistoryActionsProps) => {
  // Delete quiz from history
  const deleteQuiz = useCallback(async (quizId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Find the quiz to determine if it's from backend
      const quizToDelete = history.find(quiz => quiz.id === quizId);

      if (quizToDelete?.isFromBackend && quizToDelete?.backendId) {
        // Delete from backend if it's a backend quiz
        try {
          logger.info(`🗑️ Deleting backend quiz ${quizToDelete.backendId}`);
          // TODO: await BackendSyncService.deleteQuiz(quizToDelete.backendId);
        } catch (backendError) {
          logger.warn('⚠️ Failed to delete from backend, removing locally only:', backendError);
        }
      }

      // Always remove from local storage and state
      const updatedHistory = history.filter(quiz => quiz.id !== quizId);
      await AsyncStorage.setItem(`quizHistory_${user.uid}`, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);

      // Update filtered history as well
      applyFilter(updatedHistory, selectedFilter);

      logger.info(`✅ Quiz deleted: ${quizId}`);
    } catch (error) {
      logger.error('❌ Error deleting quiz:', error);
      Alert.alert('Error', 'Failed to delete quiz');
    }
  }, [history, setHistory, selectedFilter, applyFilter]);

  // Confirm delete
  const confirmDelete = useCallback((quiz: QuizHistoryItem) => {
    const completedDate = new Date(quiz.metadata?.completedAt || quiz.results?.completedAt).toLocaleDateString();
    Alert.alert(
      'Delete Quiz',
      `Are you sure you want to delete this quiz from ${completedDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteQuiz(quiz.id)
        }
      ]
    );
  }, [deleteQuiz]);

  // Clear all history
  const clearAllHistory = useCallback(() => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all quiz history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;

              await AsyncStorage.removeItem(`quizHistory_${user.uid}`);
              setHistory([]);
              applyFilter([], selectedFilter);
              logger.info('✅ All quiz history cleared');
            } catch (error) {
              logger.error('❌ Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history');
            }
          }
        }
      ]
    );
  }, [setHistory, selectedFilter, applyFilter]);

  // Retake quiz function
  const retakeQuiz = useCallback((quiz: QuizHistoryItem) => {
    logger.info('🔄 Retaking quiz:', quiz.id);

    // Validate that quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      logger.error('❌ Cannot retake quiz: No questions available', {
        quizId: quiz.id,
        isFromBackend: quiz.isFromBackend,
        backendId: quiz.backendId
      });
      Alert.alert(
        'Cannot Retake Quiz',
        'The questions for this quiz are no longer available. This may happen with older quizzes. Please create a new quiz instead.',
        [{ text: 'Understood' }]
      );
      return;
    }

    logger.info('📝 First question data:', quiz.questions[0]);

    // Properly map question data with correct field names
    const quizData = quiz.questions.map((q: any) => {
      logger.info('Question mapping:', {
        questionText: q.questionText || q.text,
        options: q.options
      });

      return {
        question_number: q.questionNumber || 1,
        question_text: q.questionText || q.text,
        type: q.type,
        options: q.options || [],
        correct_answer: q.correctAnswer,
        keywords: q.keywords || [],
        formula: q.formula || null,
        solution_steps: q.solution_steps || [],
      };
    });

    logger.info('🚀 Navigating with quiz data:', quizData[0]);

    navigation.navigate('QuizScreen', {
      quiz: quizData,
      metadata: {
        ...quiz.metadata,
        mode: 'retake',
        originalScore: quiz.results?.score,
        originalPercentage: quiz.results?.percentage,
        originalDate: quiz.metadata?.completedAt
      }
    });
  }, [navigation]);

  // Review quiz function
  const reviewQuiz = useCallback((quiz: QuizHistoryItem) => {
    logger.info('👁️ Reviewing quiz:', quiz.id);
    logger.info('📝 Quiz data for review:', quiz);

    // Navigate to dedicated ReviewScreen
    navigation.navigate('ReviewScreen', {
      quiz: quiz,
      metadata: {
        ...quiz.metadata,
        mode: 'review',
        originalScore: quiz.results?.score,
        originalPercentage: quiz.results?.percentage,
        originalDate: quiz.metadata?.completedAt
      }
    });
  }, [navigation]);

  return {
    deleteQuiz,
    confirmDelete,
    clearAllHistory,
    retakeQuiz,
    reviewQuiz,
  };
};
