import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../config/queryClient';
import { BackendSyncService } from '../../services/BackendSyncService';
import OfflineManager from '../../utils/OfflineManager';
import { auth } from '../../firebaseConfig';
import logger from '../../utils/logger';

/**
 * useQuizHistory
 *
 * React Query hook for managing quiz history with caching and offline support
 *
 * Features:
 * - Auto-caching with smart refetch
 * - Backend-first with local fallback
 * - Optimistic updates for delete operations
 * - Background refetching
 */
export const useQuizHistory = () => {
  const queryClient = useQueryClient();

  // Fetch quiz history
  const {
    data: quizHistory = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.quiz.history,
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) {
        logger.warn('No user logged in, returning empty quiz history');
        return [];
      }

      // Use OfflineManager's getDataWithFallback for unified offline handling
      const fetchFromBackend = async () => {
        logger.info('📚 Fetching quiz history from backend...');
        const backendResponse = await BackendSyncService.getQuizHistory({
          page: 1,
          pageSize: 100,
        });

        if (backendResponse && backendResponse.history) {
          // Convert backend format to frontend format
          const formattedHistory = backendResponse.history.map(item => {
            // Extract question data from question_details if available
            const questions = item.question_details?.questions || [];
            const userAnswers = item.question_details?.user_answers || [];

            return {
              id: item.quiz_id,
              title: item.topic || 'Quiz',
              questions: questions,  // Now populated from backend
              results: {
                score: item.questions_correct,
                totalQuestions: item.questions_total,
                percentage: item.accuracy,
                correctCount: item.questions_correct,
                incorrectCount: item.questions_total - item.questions_correct,
              },
              metadata: {
                completedAt: item.completion_date,
                source: item.source,
                subject: item.subject_key,
                difficulty: item.difficulty,
                topic: item.topic,
                performance_level: item.performance_level,
                time_taken: item.time_taken,
              },
              userAnswers: userAnswers,  // Now populated from backend
              createdAt: item.completion_date,
              backendId: item.id,
              isFromBackend: true,
            };
          });

          logger.info(`✅ Loaded ${formattedHistory.length} quizzes from backend`);
          return formattedHistory;
        }
        return null;
      };

      // Use OfflineManager's unified data fetching with cache fallback
      const { data, source } = await OfflineManager.getDataWithFallback(
        OfflineManager.CACHE_KEYS.QUIZ_HISTORY,
        fetchFromBackend
      );

      logger.info(`📊 Quiz history loaded from: ${source}`);
      return data || [];
    },
    // Keep data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Keep in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Only fetch when online
    enabled: !!auth.currentUser,
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationKey: ['deleteQuiz'],
    mutationFn: async (quizId: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const quizToDelete = quizHistory.find(quiz => quiz.id === quizId);

      // If from backend, try to delete there first
      if (quizToDelete?.isFromBackend && quizToDelete?.backendId) {
        try {
          // TODO: Implement backend delete endpoint
          logger.info(`🗑️ Would delete backend quiz ${quizToDelete.backendId}`);
        } catch (error) {
          logger.warn('⚠️ Backend delete failed, continuing with local delete');
        }
      }

      // Update OfflineManager cache
      const updatedHistory = quizHistory.filter(quiz => quiz.id !== quizId);
      await OfflineManager.cacheData(OfflineManager.CACHE_KEYS.QUIZ_HISTORY, updatedHistory);

      logger.info('✅ Quiz deleted from OfflineManager cache');
      return { quizId, updatedHistory };
    },
    // Optimistic update - immediately remove from UI
    onMutate: async (quizId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.quiz.history });

      // Snapshot current value
      const previousHistory = queryClient.getQueryData(queryKeys.quiz.history);

      // Optimistically update
      queryClient.setQueryData(queryKeys.quiz.history, (old: any[]) =>
        old?.filter(quiz => quiz.id !== quizId) || []
      );

      return { previousHistory };
    },
    // If mutation fails, rollback
    onError: (err, quizId, context) => {
      queryClient.setQueryData(queryKeys.quiz.history, context?.previousHistory);
      logger.error('❌ Failed to delete quiz:', err);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quiz.history });
    },
  });

  // Clear all history mutation
  const clearAllHistoryMutation = useMutation({
    mutationKey: ['clearQuizHistory'],
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Clear from OfflineManager cache
      await OfflineManager.clearCache(OfflineManager.CACHE_KEYS.QUIZ_HISTORY);
      logger.info('✅ All quiz history cleared from OfflineManager');
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.quiz.history, []);
      logger.info('✅ Quiz history cache updated');
    },
  });

  return {
    // Data
    quizHistory,
    isLoading,
    isError,
    error,
    isFetching,

    // Actions
    refetch,
    deleteQuiz: deleteQuizMutation.mutate,
    deleteQuizAsync: deleteQuizMutation.mutateAsync,
    isDeletingQuiz: deleteQuizMutation.isPending,
    clearAllHistory: clearAllHistoryMutation.mutate,
    isClearingHistory: clearAllHistoryMutation.isPending,
  };
};

export default useQuizHistory;
