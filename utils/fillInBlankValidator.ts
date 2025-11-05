/**
 * Fill-in-Blank Answer Validator
 *
 * Provides flexible answer validation for fill-in-the-blank questions with:
 * - Case-insensitive matching
 * - Whitespace normalization
 * - Multiple accepted answer variants
 * - Fuzzy matching for minor typos (optional)
 *
 * This utility mirrors the backend fill_in_blank_validator.py logic
 * to ensure consistent validation across frontend and backend.
 */

import logger from './logger';

/**
 * Similarity threshold for fuzzy matching (0.0 to 1.0)
 * 0.9 = 90% similarity required (allows ~10% character differences)
 */
const DEFAULT_FUZZY_THRESHOLD = 0.90;

/**
 * Blank configuration interface
 */
export interface BlankConfig {
  position: number;
  correct_answer: string;
  accepted_answers?: string[];
  case_sensitive?: boolean;
  hint?: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isCorrect: boolean;
  similarityScore: number;
  matchedAnswer: string;
}

/**
 * Normalize answer by removing extra whitespace
 */
export const normalizeAnswer = (answer: any): string => {
  if (answer === null || answer === undefined) return '';

  const str = String(answer);

  // Remove leading/trailing whitespace
  let normalized = str.trim();

  // Collapse multiple spaces to single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Remove spaces before punctuation
  normalized = normalized.replace(/\s+([.,!?;:])/g, '$1');

  return normalized;
};

/**
 * Check for exact match between answers
 */
const exactMatch = (userAnswer: string, acceptedAnswer: string, caseSensitive: boolean): boolean => {
  if (caseSensitive) {
    return userAnswer === acceptedAnswer;
  }
  return userAnswer.toLowerCase() === acceptedAnswer.toLowerCase();
};

/**
 * Calculate fuzzy similarity score using sequence matching
 * (Simplified version - for production, consider using a library like string-similarity)
 */
const calculateSimilarity = (str1: string, str2: string, caseSensitive: boolean): number => {
  const s1 = caseSensitive ? str1 : str1.toLowerCase();
  const s2 = caseSensitive ? str2 : str2.toLowerCase();

  if (s1 === s2) return 1.0;

  // Simple Levenshtein-based similarity
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return 1.0 - (distance / maxLen);
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + 1   // substitution
        );
      }
    }
  }

  return dp[m][n];
};

/**
 * Validate a user's answer against a blank configuration
 *
 * @param userAnswer - The user's submitted answer
 * @param blankConfig - Blank configuration with correct_answer and accepted_answers
 * @param enableFuzzy - Whether to enable fuzzy matching for typos (default: true)
 * @param fuzzyThreshold - Minimum similarity score for fuzzy matching (default: 0.90)
 * @returns ValidationResult with isCorrect, similarityScore, and matchedAnswer
 */
export const validateFillInBlankAnswer = (
  userAnswer: string,
  blankConfig: BlankConfig,
  enableFuzzy: boolean = true,
  fuzzyThreshold: number = DEFAULT_FUZZY_THRESHOLD
): ValidationResult => {
  // Normalize user input
  const normalizedUserAnswer = normalizeAnswer(userAnswer);

  // Extract configuration
  const correctAnswer = blankConfig.correct_answer || '';
  const acceptedAnswers = blankConfig.accepted_answers || [correctAnswer];
  const caseSensitive = blankConfig.case_sensitive || false;

  // Ensure acceptedAnswers includes correctAnswer
  const allAcceptedAnswers = acceptedAnswers.includes(correctAnswer)
    ? acceptedAnswers
    : [correctAnswer, ...acceptedAnswers];

  // Try exact matching first (best performance)
  for (const acceptedAnswer of allAcceptedAnswers) {
    const normalizedAccepted = normalizeAnswer(acceptedAnswer);

    if (exactMatch(normalizedUserAnswer, normalizedAccepted, caseSensitive)) {
      return {
        isCorrect: true,
        similarityScore: 1.0,
        matchedAnswer: acceptedAnswer
      };
    }
  }

  // If fuzzy matching is enabled, try fuzzy matching for typos
  if (enableFuzzy) {
    let bestSimilarity = 0.0;
    let bestMatch = '';

    for (const acceptedAnswer of allAcceptedAnswers) {
      const normalizedAccepted = normalizeAnswer(acceptedAnswer);
      const similarity = calculateSimilarity(
        normalizedUserAnswer,
        normalizedAccepted,
        caseSensitive
      );

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = acceptedAnswer;
      }
    }

    // Check if similarity exceeds threshold
    if (bestSimilarity >= fuzzyThreshold) {
      logger.info(`🎯 Fuzzy match accepted: "${userAnswer}" ≈ "${bestMatch}" (${(bestSimilarity * 100).toFixed(1)}%)`);
      return {
        isCorrect: true,
        similarityScore: bestSimilarity,
        matchedAnswer: bestMatch
      };
    }

    // Even if below threshold, return the best match for feedback
    return {
      isCorrect: false,
      similarityScore: bestSimilarity,
      matchedAnswer: bestMatch
    };
  }

  // No match found
  return {
    isCorrect: false,
    similarityScore: 0.0,
    matchedAnswer: ''
  };
};

/**
 * Validate multiple blanks for a fill-in-blank question
 *
 * @param userAnswers - Array of user's answers (same length as blanks)
 * @param blanks - Array of blank configurations
 * @param enableFuzzy - Whether to enable fuzzy matching
 * @returns Object with validation results for all blanks
 */
export const validateMultipleBlanks = (
  userAnswers: string[],
  blanks: BlankConfig[],
  enableFuzzy: boolean = true
): {
  allCorrect: boolean;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  results: Array<{
    blankPosition: number;
    isCorrect: boolean;
    similarityScore: number;
    matchedAnswer: string;
    userAnswer: string;
  }>;
} => {
  if (userAnswers.length !== blanks.length) {
    logger.error(
      `Mismatch: ${userAnswers.length} answers provided but ${blanks.length} blanks expected`
    );
    return {
      allCorrect: false,
      correctCount: 0,
      totalCount: blanks.length,
      accuracy: 0,
      results: []
    };
  }

  const results = [];
  let correctCount = 0;

  for (let i = 0; i < blanks.length; i++) {
    const userAnswer = userAnswers[i];
    const blank = blanks[i];

    const validation = validateFillInBlankAnswer(userAnswer, blank, enableFuzzy);

    results.push({
      blankPosition: blank.position,
      isCorrect: validation.isCorrect,
      similarityScore: Math.round(validation.similarityScore * 1000) / 1000,
      matchedAnswer: validation.matchedAnswer,
      userAnswer: userAnswer
    });

    if (validation.isCorrect) {
      correctCount++;
    }
  }

  return {
    allCorrect: correctCount === blanks.length,
    correctCount,
    totalCount: blanks.length,
    accuracy: Math.round((correctCount / blanks.length) * 1000) / 1000,
    results
  };
};

/**
 * Get hint for incorrect answer based on similarity
 */
export const getHintForIncorrectAnswer = (
  userAnswer: string,
  blankConfig: BlankConfig
): string => {
  // Check if there's a configured hint
  if (blankConfig.hint) {
    return blankConfig.hint;
  }

  // Provide generic feedback based on similarity
  const validation = validateFillInBlankAnswer(userAnswer, blankConfig, true);

  if (validation.similarityScore >= 0.7) {
    return "You're close! Check your spelling.";
  } else if (validation.similarityScore >= 0.4) {
    return "Not quite. Review the material and try again.";
  } else {
    return "Incorrect. Make sure you understand the concept.";
  }
};
