/**
 * Quiz Helper Utilities
 * Utility functions for quiz operations
 */

import logger from './logger';

/**
 * Normalize answer for comparison
 */
export const normalizeAnswer = (answer: any): string => {
  if (answer === null || answer === undefined) return '';
  return String(answer).trim().toLowerCase();
};

/**
 * Normalize answer for true/false evaluation
 */
const normalizeForEvaluation = (answer: any): string => {
  if (answer === null || answer === undefined) return '';
  if (typeof answer === 'boolean') return answer ? 'true' : 'false';
  return String(answer).trim().toLowerCase();
};

/**
 * Enhanced answer evaluation with fuzzy matching
 */
export const evaluateAnswer = (question: any, userAnswer: any): boolean => {
  if (userAnswer === null || userAnswer === undefined) return false;

  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(question.correctAnswer);

  switch (question.type) {
    case 'open_ended':
      // Enhanced fuzzy matching for open-ended questions
      if (normalizedUser === normalizedCorrect) return true;

      // Check for keyword matching
      if (question.keywords && question.keywords.length > 0) {
        const keywordMatches = question.keywords.filter((keyword: string) =>
          normalizedUser.includes(keyword.toLowerCase())
        );
        return keywordMatches.length >= Math.ceil(question.keywords.length / 2);
      }

      return false;

    case 'true_false':
      // Enhanced true/false evaluation with boolean support
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
      // Normalize answers for case-insensitive and whitespace-tolerant comparison
      return normalizedUser === normalizedCorrect;

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
      // Default to normalized comparison for any other question types
      return normalizedUser === normalizedCorrect;
  }
};

/**
 * Get icon name for question type
 */
export const getQuestionIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'multiple_choice': 'list-ul',
    'true_false': 'balance-scale',
    'open_ended': 'feather-alt',
    'math': 'calculator',
  };
  return iconMap[type] || 'scroll';
};

/**
 * Get difficulty information with icon and color
 */
export const getDifficultyInfo = (difficulty: string, colors: any): { icon: string; color: string } => {
  const difficultyMap: Record<string, { icon: string; color: string }> = {
    easy: { icon: 'leaf', color: colors?.success || '#28a745' },
    medium: { icon: 'fire', color: colors?.warning || '#FFD700' },
    hard: { icon: 'crown', color: colors?.error || '#dc3545' },
  };
  return difficultyMap[difficulty] || difficultyMap.medium;
};

/**
 * Process question options to ensure consistent format
 */
export const processQuestionOptions = (options: any): any[] => {
  if (!options || !Array.isArray(options)) return [];

  return options.map((option: any, index: number) => {
    if (typeof option === 'string') {
      return {
        label: String.fromCharCode(65 + index),
        text: option,
        value: option,
      };
    }
    return option;
  });
};
