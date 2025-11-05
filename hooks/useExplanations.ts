/**
 * useExplanations Hook
 * Handles AI-powered explanations and coach message generation
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import logger from '../utils/logger';
import { EnhancedExplanationService } from '../services/EnhancedExplanationService';
import { determineQuestionCategory, generateLocalExplanation } from '../utils/explanationGenerators';
import { generateLocalCoachMessage } from '../utils/coachMessageGenerators';

interface Question {
  id: string;
  text?: string;
  questionText?: string;
  type?: string;
  difficulty?: string;
  options?: any[];
  correctAnswer: any;
  isCorrect?: boolean;
  [key: string]: any;
}

interface Config {
  ENABLE_AI_COACH: boolean;
  [key: string]: any;
}

interface ExplanationParams {
  incorrectQuestions: Question[];
  questions: Question[];
  userAnswers: Record<string, any>;
  metadata: Record<string, any>;
  setExplanations: (explanations: Record<string, any>) => void;
  setShowExplanations: (show: boolean) => void;
  setLoadingExplanations: (loading: boolean) => void;
  setUsageStats: (stats: any) => void;
  isMountedRef: React.RefObject<boolean>;
}

interface CoachMessageParams {
  score: number;
  totalQuestions: number;
  percentage: number;
  questions: Question[];
  metadata: Record<string, any>;
  determineCategorySync: (metadata: any, keywords: any[], questions: any[]) => string;
  setCoachMessage: (message: any) => void;
  setLoadingCoachMessage: (loading: boolean) => void;
  isMountedRef: React.RefObject<boolean>;
  CONFIG: Config;
}

export const useExplanations = () => {
  /**
   * Generate AI-powered explanations for all incorrect questions
   */
  const generateAllEnhancedExplanations = useCallback(
    async (params: ExplanationParams) => {
      const {
        incorrectQuestions,
        questions,
        userAnswers,
        metadata,
        setExplanations,
        setShowExplanations,
        setLoadingExplanations,
        setUsageStats,
        isMountedRef,
      } = params;

      if (incorrectQuestions.length === 0) {
        Alert.alert('Perfect Score!', 'Great job! All answers were correct, so no explanations are needed.');
        return;
      }

      setLoadingExplanations(true);

      try {
        // Get current tier before using it
        const currentTier = await EnhancedExplanationService.getCurrentTier();

        const enhancedExplanations: Record<string, any> = {};

        // Generate explanations for all incorrect questions
        for (const question of incorrectQuestions) {
          try {
            const userAnswer = userAnswers[question.id];
            const correctAnswer = question.correctAnswer;

            const enhancedExplanation = await EnhancedExplanationService.getEnhancedExplanation(
              {
                question: question.text || question.questionText,
                questionText: question.text || question.questionText,
                subject: determineQuestionCategory(question.text || question.questionText || ''),
                difficulty: question.difficulty || metadata.difficulty || 'medium',
                options: question.options || [],
                id: question.id,
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
                keyPoints: ['Review this topic area', 'Practice similar questions'],
              },
            };
          }
        }

        if (isMountedRef.current) {
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
        }
      } catch (error) {
        logger.error('Error generating all explanations:', error);
        Alert.alert('Error', 'Failed to generate enhanced explanations. Please try again.');
      } finally {
        if (isMountedRef.current) {
          setLoadingExplanations(false);
        }
      }
    },
    []
  );

  /**
   * Generate personalized coach message
   */
  const generateCoachMessage = useCallback(async (params: CoachMessageParams) => {
    const {
      score,
      totalQuestions,
      percentage,
      questions,
      metadata,
      determineCategorySync,
      setCoachMessage,
      setLoadingCoachMessage,
      isMountedRef,
      CONFIG,
    } = params;

    if (!CONFIG.ENABLE_AI_COACH) return;

    setLoadingCoachMessage(true);

    try {
      const coachData = {
        currentQuiz: {
          score,
          totalQuestions,
          percentage,
          questions,
          category: determineCategorySync(metadata, [], questions),
          difficulty: metadata.difficulty || 'medium',
        },
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
  }, []);

  return {
    generateAllEnhancedExplanations,
    generateCoachMessage,
  };
};
