/**
 * useBookStudyQuiz - Hook for generating quizzes from chapter content
 *
 * Calls dedicated Book Study quiz generation API that:
 * - Fetches actual chapter content from S3
 * - Uses pedagogy-focused prompts (Bloom's Taxonomy)
 * - Implements difficulty progression
 * - Generates chapter-specific questions
 *
 * This replaces the AskAlexandria navigation for Book Study mode.
 *
 * Created: 2025-10-09
 * Author: Frontend UI Specialist (via Coordinator Agent)
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';

export interface QuizQuestion {
  question_number: number;
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
  difficulty: string;
  options?: Array<{
    label: string;
    text: string;
    value?: boolean | string;
  }>;
  correct_answer: string | boolean;
  explanation?: string;
  keywords?: string[];
}

export interface QuizMetadata {
  material_id: string;
  chapter_id: string;
  chapter_index: number;
  chapter_title: string;
  difficulty: string;
  question_count: number;
  generated_at: string;
  source: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  metadata: QuizMetadata;
}

export interface UseBookStudyQuizResult {
  generateQuiz: (chapterId: string) => Promise<QuizData | null>;
  isGenerating: boolean;
  error: string | null;
  retry: (chapterId: string) => Promise<QuizData | null>;
}

/**
 * Hook for generating Book Study quizzes from chapter content
 *
 * @param materialId - ID of the material containing the chapter
 * @returns Quiz generation utilities
 */
export function useBookStudyQuiz(materialId: string): UseBookStudyQuizResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 2;

  const generateQuiz = useCallback(
    async (chapterId: string): Promise<QuizData | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const user = auth.currentUser;

        if (!user) {
          throw new Error('User not authenticated');
        }

        logger.info('Generating Book Study quiz', {
          materialId,
          chapterId,
          retryCount,
        });

        // Call dedicated Book Study quiz generation endpoint
        const response = await axios.post<QuizData>(
          `${API_BASE_URL}/api/book-study/materials/${materialId}/chapters/${chapterId}/generate-quiz`,
          null,
          {
            params: {
              question_count: 10,
              difficulty: 'auto',
            },
            headers: {
              'X-User-ID': user.uid,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data) {
          throw new Error('No quiz data returned from server');
        }

        const { questions, metadata } = response.data;

        if (!questions || questions.length === 0) {
          throw new Error('Quiz generation returned no questions');
        }

        logger.success('Book Study quiz generated successfully', {
          questionCount: questions.length,
          chapterId: metadata.chapter_id,
          difficulty: metadata.difficulty,
        });

        // Reset retry count on success
        setRetryCount(0);

        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail ||
          err.message ||
          'Failed to generate quiz. Please try again.';

        logger.error('Quiz generation failed', {
          materialId,
          chapterId,
          error: errorMessage,
          retryCount,
        });

        setError(errorMessage);

        // Auto-retry on network errors (up to MAX_RETRIES)
        if (
          retryCount < MAX_RETRIES &&
          (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK')
        ) {
          logger.info('Auto-retrying quiz generation', { retryCount: retryCount + 1 });
          setRetryCount(retryCount + 1);

          // Wait 1 second before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));

          return generateQuiz(chapterId);
        }

        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [materialId, retryCount]
  );

  const retry = useCallback(
    async (chapterId: string): Promise<QuizData | null> => {
      logger.info('Manual retry of quiz generation', { materialId, chapterId });
      setRetryCount(0); // Reset retry count on manual retry
      return generateQuiz(chapterId);
    },
    [generateQuiz, materialId]
  );

  return {
    generateQuiz,
    isGenerating,
    error,
    retry,
  };
}
