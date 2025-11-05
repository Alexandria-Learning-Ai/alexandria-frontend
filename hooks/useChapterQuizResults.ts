/**
 * useChapterQuizResults - Hook for managing chapter-based quiz results
 *
 * Features:
 * - Stores quiz results per chapter (AsyncStorage)
 * - Tracks quiz completion and scores
 * - Determines if chapter quiz passed (>= 70%)
 * - Enables progressive chapter unlocking
 * - Auto-loads on mount
 * - Provides save and clear functions
 *
 * IMPORTANT - INDEX CONVENTION:
 * - All quiz results are stored and accessed using 0-based chapter indexes
 * - Chapter 1 quiz results are stored at key 0
 * - Chapter 2 quiz results are stored at key 1
 * - etc.
 *
 * Usage:
 * ```tsx
 * const {
 *   quizResults,
 *   saveQuizResult,
 *   hasPassedChapterQuiz,
 *   isLoading
 * } = useChapterQuizResults(materialId);
 *
 * // Save quiz result (chapterIndex is 0-based)
 * await saveQuizResult(chapterId, 0, score, totalQuestions); // For Chapter 1
 *
 * // Check if passed (chapterIndex is 0-based)
 * const passed = hasPassedChapterQuiz(0); // Check Chapter 1
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChapterQuizResult,
  ChapterQuizResultsMap,
  QUIZ_PASSING_SCORE,
} from '../utils/chapterLockUtils';
import logger from '../utils/logger';

const STORAGE_KEY_PREFIX = 'chapter_quiz_results_';

/**
 * Hook return type
 */
interface UseChapterQuizResultsReturn {
  quizResults: ChapterQuizResultsMap;
  isLoading: boolean;
  saveQuizResult: (
    chapterId: string,
    chapterIndex: number,
    score: number,
    totalQuestions: number
  ) => Promise<void>;
  hasPassedChapterQuiz: (chapterIndex: number) => boolean;
  getQuizResult: (chapterIndex: number) => ChapterQuizResult | null;
  clearAllResults: () => Promise<void>;
  clearChapterResult: (chapterIndex: number) => Promise<void>;
}

/**
 * useChapterQuizResults hook
 *
 * @param materialId - ID of the material (book), or null for regular quizzes
 * @returns Quiz results and management functions
 */
export const useChapterQuizResults = (materialId: string | null): UseChapterQuizResultsReturn => {
  const [quizResults, setQuizResults] = useState<ChapterQuizResultsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  // CRITICAL: Define storageKey BEFORE any conditional logic to ensure hooks always called in same order
  const storageKey = `${STORAGE_KEY_PREFIX}${materialId || 'null'}`;

  /**
   * Load quiz results from AsyncStorage
   * IMPORTANT: This useCallback MUST be defined before early returns to comply with Rules of Hooks
   */
  const loadQuizResults = useCallback(async () => {
    // Guard: Skip loading if no materialId
    if (!materialId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const storedData = await AsyncStorage.getItem(storageKey);

      if (storedData) {
        const parsed = JSON.parse(storedData) as ChapterQuizResultsMap;
        setQuizResults(parsed);
        logger.info('Chapter quiz results loaded', {
          materialId,
          chapterCount: Object.keys(parsed).length,
        });
      } else {
        setQuizResults({});
        logger.info('No chapter quiz results found', { materialId });
      }
    } catch (error) {
      logger.error('Failed to load chapter quiz results', { materialId, error });
      setQuizResults({});
    } finally {
      setIsLoading(false);
    }
  }, [materialId, storageKey]);

  /**
   * Save quiz results to AsyncStorage
   * IMPORTANT: This useCallback MUST be defined before early returns to comply with Rules of Hooks
   */
  const persistQuizResults = useCallback(
    async (results: ChapterQuizResultsMap) => {
      // Guard: Skip persisting if no materialId
      if (!materialId) return;

      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(results));
        logger.success('Chapter quiz results saved', {
          materialId,
          chapterCount: Object.keys(results).length,
        });
      } catch (error) {
        logger.error('Failed to save chapter quiz results', { materialId, error });
      }
    },
    [materialId, storageKey]
  );

  /**
   * Save a quiz result for a specific chapter
   *
   * @param chapterId - ID of the chapter
   * @param chapterIndex - 0-based chapter index (Chapter 1 = 0, Chapter 2 = 1, etc.)
   * @param score - Number of correct answers
   * @param totalQuestions - Total number of questions
   */
  const saveQuizResult = useCallback(
    async (
      chapterId: string,
      chapterIndex: number,
      score: number,
      totalQuestions: number
    ) => {
      // Guard: Skip saving if no materialId
      if (!materialId) return;

      const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      const passed = percentage >= QUIZ_PASSING_SCORE;

      const quizResult: ChapterQuizResult = {
        chapterId,
        chapterIndex,
        score,
        totalQuestions,
        percentage,
        passed,
        completedAt: new Date().toISOString(),
      };

      const updatedResults = {
        ...quizResults,
        [chapterIndex]: quizResult,
      };

      setQuizResults(updatedResults);
      await persistQuizResults(updatedResults);

      logger.info('Chapter quiz result saved', {
        materialId,
        chapterId,
        chapterIndex,
        score,
        totalQuestions,
        percentage,
        passed,
      });
    },
    [quizResults, persistQuizResults, materialId]
  );

  /**
   * Check if user has passed quiz for a specific chapter
   *
   * @param chapterIndex - 0-based chapter index (Chapter 1 = 0, Chapter 2 = 1, etc.)
   * @returns True if quiz passed (>= 70%), false otherwise
   */
  const hasPassedChapterQuiz = useCallback(
    (chapterIndex: number): boolean => {
      const result = quizResults[chapterIndex];
      return result ? result.passed : false;
    },
    [quizResults]
  );

  /**
   * Get quiz result for a specific chapter
   *
   * @param chapterIndex - 0-based chapter index (Chapter 1 = 0, Chapter 2 = 1, etc.)
   * @returns Quiz result if exists, null otherwise
   */
  const getQuizResult = useCallback(
    (chapterIndex: number): ChapterQuizResult | null => {
      return quizResults[chapterIndex] || null;
    },
    [quizResults]
  );

  /**
   * Clear all quiz results for this material
   */
  const clearAllResults = useCallback(async () => {
    // Guard: Skip clearing if no materialId
    if (!materialId) return;

    try {
      await AsyncStorage.removeItem(storageKey);
      setQuizResults({});
      logger.info('All chapter quiz results cleared', { materialId });
    } catch (error) {
      logger.error('Failed to clear chapter quiz results', { materialId, error });
    }
  }, [materialId, storageKey]);

  /**
   * Clear quiz result for a specific chapter
   *
   * @param chapterIndex - 0-based chapter index (Chapter 1 = 0, Chapter 2 = 1, etc.)
   */
  const clearChapterResult = useCallback(
    async (chapterIndex: number) => {
      // Guard: Skip clearing if no materialId
      if (!materialId) return;

      const updatedResults = { ...quizResults };
      delete updatedResults[chapterIndex];
      setQuizResults(updatedResults);
      await persistQuizResults(updatedResults);

      logger.info('Chapter quiz result cleared', {
        materialId,
        chapterIndex,
      });
    },
    [quizResults, persistQuizResults, materialId]
  );

  // Load quiz results on mount
  // IMPORTANT: This useEffect MUST be defined before early returns to comply with Rules of Hooks
  useEffect(() => {
    loadQuizResults();
  }, [loadQuizResults]);

  return {
    quizResults,
    isLoading,
    saveQuizResult,
    hasPassedChapterQuiz,
    getQuizResult,
    clearAllResults,
    clearChapterResult,
  };
};

export default useChapterQuizResults;
