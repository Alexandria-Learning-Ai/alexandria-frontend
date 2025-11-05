import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../config/queryClient';
import { BackendSyncService } from '../../services/BackendSyncService';
import OfflineManager from '../../utils/OfflineManager';
import { auth } from '../../firebaseConfig';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

interface SaveQuizData {
  questions: any[];
  userAnswers: Record<string, any>;
  score: number;
  totalQuestions: number;
  percentage: number;
  metadata: any;
}

/**
 * useSaveQuiz
 *
 * React Query mutation hook for saving quiz results
 *
 * Features:
 * - Optimistic updates (immediate UI feedback)
 * - Background sync to backend
 * - Local storage persistence
 * - Retry logic for failed saves
 * - Queue for offline saves
 */
export const useSaveQuiz = () => {
  const queryClient = useQueryClient();

  const saveQuizMutation = useMutation({
    mutationKey: ['saveQuiz'],
    mutationFn: async (quizData: SaveQuizData) => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const quizId = uuid.v4().toString();
      const now = new Date().toISOString();

      // Format quiz for storage
      const formattedQuiz: any = {
        id: quizId,
        title: quizData.metadata?.title || `Quiz - ${new Date().toLocaleDateString()}`,
        questions: quizData.questions,
        userAnswers: quizData.userAnswers,
        results: {
          score: quizData.score,
          totalQuestions: quizData.totalQuestions,
          percentage: quizData.percentage,
          correctCount: quizData.score,
          incorrectCount: quizData.totalQuestions - quizData.score,
          completedAt: now,
        },
        metadata: {
          ...quizData.metadata,
          completedAt: now,
          savedAt: now,
        },
        createdAt: now,
      };

      // If offline, queue the action for later sync
      if (!OfflineManager.isOnline) {
        await OfflineManager.queueOfflineAction({
          type: 'QUIZ_COMPLETED',
          data: formattedQuiz,
        });
        logger.info('📝 Quiz queued for offline sync');
      }

      // Cache the quiz using OfflineManager (works offline and online)
      // This updates the cached quiz history automatically
      const cachedHistory = await OfflineManager.getCachedData(OfflineManager.CACHE_KEYS.QUIZ_HISTORY);
      const updatedHistory = [formattedQuiz, ...(cachedHistory || [])];
      await OfflineManager.cacheData(OfflineManager.CACHE_KEYS.QUIZ_HISTORY, updatedHistory);

      logger.info('✅ Quiz saved via OfflineManager');

      // TODO: If online, attempt to sync to backend immediately
      // This will be handled by the backend sync service
      if (OfflineManager.isOnline) {
        logger.info('📡 Online - quiz will sync to backend via BackendSyncService');
      }

      return formattedQuiz;
    },
    // Optimistic update - add quiz to UI immediately
    onMutate: async (quizData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.quiz.history });

      // Snapshot the previous value
      const previousHistory = queryClient.getQueryData(queryKeys.quiz.history);

      // Optimistically update the cache
      const tempQuiz = {
        id: 'temp-' + Date.now(),
        title: quizData.metadata?.title || 'Saving...',
        results: {
          score: quizData.score,
          totalQuestions: quizData.totalQuestions,
          percentage: quizData.percentage,
        },
        metadata: {
          ...quizData.metadata,
          completedAt: new Date().toISOString(),
        },
        questions: quizData.questions,
        userAnswers: quizData.userAnswers,
      };

      queryClient.setQueryData(queryKeys.quiz.history, (old: any[]) =>
        [tempQuiz, ...(old || [])]
      );

      return { previousHistory, tempQuiz };
    },
    // If mutation fails, rollback the optimistic update
    onError: (err, quizData, context) => {
      logger.error('❌ Failed to save quiz:', err);
      if (context?.previousHistory) {
        queryClient.setQueryData(queryKeys.quiz.history, context.previousHistory);
      }
    },
    // Replace temp quiz with real one on success
    onSuccess: (savedQuiz, quizData, context) => {
      queryClient.setQueryData(queryKeys.quiz.history, (old: any[]) => {
        if (!old) return [savedQuiz];
        // Replace temp quiz with real one
        return old.map(quiz =>
          quiz.id === context?.tempQuiz.id ? savedQuiz : quiz
        );
      });

      logger.info('✅ Quiz saved successfully:', savedQuiz.id);
    },
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quiz.history });
    },
    // Retry failed saves up to 3 times
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    saveQuiz: saveQuizMutation.mutate,
    saveQuizAsync: saveQuizMutation.mutateAsync,
    isSaving: saveQuizMutation.isPending,
    isError: saveQuizMutation.isError,
    error: saveQuizMutation.error,
    isSuccess: saveQuizMutation.isSuccess,
  };
};

export default useSaveQuiz;
