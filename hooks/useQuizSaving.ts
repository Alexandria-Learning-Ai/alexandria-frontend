/**
 * ⚠️ DEPRECATED - Use hooks/api/useSaveQuiz.ts instead
 *
 * This hook will be removed in a future version.
 * The new useSaveQuiz hook provides better offline support and automatic sync.
 *
 * Migration guide: See SCREEN_MIGRATION_AUDIT.md
 */

import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { auth } from '../firebaseConfig';
import { CoachUtils } from '../utils/CoachUtils';
import { QuizHistoryManager } from '../services/QuizHistoryManager';
import { SubjectProgressService } from '../services/SubjectProgressService';
import UnifiedNotificationService from '../utils/UnifiedNotificationService';
import { FlashcardService } from '../services/FlashcardService';

// Log deprecation warning
if (__DEV__) {
  logger.warn(
    '⚠️ useQuizSaving is deprecated. Please migrate to hooks/api/useSaveQuiz.ts\n' +
    'See SCREEN_MIGRATION_AUDIT.md for migration guide.'
  );
}
import { BackendSyncService } from '../services/BackendSyncService';
import logger from '../utils/logger';
import { normalizeAnswer } from '../utils/quizHelpers';

interface QuizSavingParams {
  questions: any[];
  userAnswers: Record<string, any>;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
  metadata: any;
  CONFIG: {
    MAX_QUIZ_HISTORY: number;
  };
}

export const useQuizSaving = ({
  questions,
  userAnswers,
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  percentage,
  metadata,
  CONFIG,
}: QuizSavingParams) => {
  const [savingQuiz, setSavingQuiz] = useState(false);

  const saveQuizToHistory = async (
    formattedResults: any,
    isMountedRef: React.MutableRefObject<boolean>
  ) => {
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
        totalQuestions,
        correctCount,
        incorrectCount,
        percentage,
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

      // Prepare progress data for backend sync
      const progressData = {
        questionsAnswered: totalQuestions,
        questionsCorrect: correctCount,
        accuracy: percentage,
        studyTimeSeconds: metadata?.timeSpent || 0,
        subject: metadata?.subject || metadata?.course_code,
        subjectKey: metadata?.subject || metadata?.course_code,
        difficulty: metadata?.difficulty || 'medium',
        source: metadata?.source || 'quiz_completion',
        sessionData: {
          quiz_id: quizData.id,
          completion_time: new Date().toISOString(),
          device_type: 'mobile',
        },
      };

      // Sync with backend APIs (primary data store)
      let backendSyncResult = null;
      try {
        backendSyncResult = await BackendSyncService.syncQuizCompletion(quizData, progressData);

        if (backendSyncResult.success) {
          logger.info('✅ Quiz data synced to backend successfully');
        } else {
          logger.warn('⚠️ Backend sync failed, using local storage fallback');
        }
      } catch (backendError) {
        logger.error('❌ Backend sync error:', backendError);
        // Continue with local storage as fallback
      }

      // FALLBACK: Save to AsyncStorage (for offline support)
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

      // LEGACY: Keep existing local services for backward compatibility
      await QuizHistoryManager.saveQuizToHistory(
        {
          quiz: questions,
          metadata: metadata || {},
        },
        metadata?.source || 'completed_quiz'
      );

      await SubjectProgressService.updateSubjectProgress(user.uid, formattedResults);

      // Trigger smart analysis after saving
      await UnifiedNotificationService.scheduleIntelligentNotifications(user.uid, 'quiz_completed');

      // Generate flashcards from quiz mistakes
      try {
        const incorrectQuestions = questions.filter((q) => {
          const userAnswer = userAnswers[q?.id];
          // Use normalized comparison as a fallback check
          const normalizedMatch = normalizeAnswer(userAnswer) === normalizeAnswer(q?.correctAnswer);
          return !q?.isCorrect && !normalizedMatch;
        });

        if (incorrectQuestions.length > 0) {
          logger.info(`📚 Generating ${incorrectQuestions.length} flashcards from quiz mistakes...`);

          const quizResults = {
            questions: incorrectQuestions.map((q) => ({
              ...q,
              isCorrect: false,
              userAnswer: userAnswers[q?.id],
              subject: q?.subject || metadata?.subject || 'General',
              difficulty: q?.difficulty || metadata?.difficulty || 'medium',
            })),
            metadata: metadata || {},
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

  return {
    savingQuiz,
    saveQuizToHistory,
  };
};
