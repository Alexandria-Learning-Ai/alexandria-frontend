/**
 * Pluggable Grading System
 *
 * Extensible grader architecture for Phase 3 and Phase 1.5B question types
 *
 * Features:
 * - Interface-based grader pattern
 * - Registry for easy extension
 * - Local grading for auto-gradable types
 * - API grading for subjective types
 * - Batch grading support
 *
 * Phase 3: true_false, multiple_choice, written
 * Phase 1.5B: image, drag_drop, math, diagram
 * Phase 1.6: code (deferred)
 */

import { ParsedQuestion, GradingResult } from '../../types/exam';
import {
  gradeWrittenResponse,
  gradeImageResponse,
  gradeDragDropResponse,
  gradeMathResponse,
  gradeDiagramResponse
} from '../../services/examService';
import logger from '../logger';

/**
 * Grader Interface
 *
 * All question type graders must implement this interface
 */
export interface QuestionGrader {
  /**
   * Grade a question
   * @returns GradingResult if gradable locally, null if needs API grading
   */
  grade(question: ParsedQuestion, userAnswer: any): GradingResult | null;
}

/**
 * True/False Grader
 *
 * Instant local grading for binary questions
 */
export const trueFalseGrader: QuestionGrader = {
  grade(question, userAnswer): GradingResult | null {
    if (question.question_type !== 'true_false') return null;

    if (!userAnswer) {
      return {
        score: 0,
        feedback: 'No answer provided.',
        strengths: [],
        areas_for_improvement: ['Please provide an answer before submitting.'],
      };
    }

    const correct = userAnswer === question.correct_answer;

    return {
      score: correct ? 100 : 0,
      feedback: correct
        ? 'Correct! Well done.'
        : `Incorrect. The correct answer is ${question.correct_answer}.`,
      strengths: correct ? ['Accurate answer'] : [],
      areas_for_improvement: correct
        ? []
        : [`Review the concept: ${question.question_text.substring(0, 50)}...`],
    };
  }
};

/**
 * Multiple Choice Grader
 *
 * Instant local grading for multiple choice questions
 */
export const multipleChoiceGrader: QuestionGrader = {
  grade(question, userAnswer): GradingResult | null {
    if (question.question_type !== 'multiple_choice') return null;

    if (!userAnswer) {
      return {
        score: 0,
        feedback: 'No answer provided.',
        strengths: [],
        areas_for_improvement: ['Please select an answer before submitting.'],
      };
    }

    const correct = userAnswer === question.correct_answer;

    return {
      score: correct ? 100 : 0,
      feedback: correct
        ? 'Correct! Well done.'
        : `Incorrect. The correct answer is ${question.correct_answer}.`,
      strengths: correct ? ['Accurate answer'] : [],
      areas_for_improvement: correct
        ? []
        : [`Review the concept and try to understand why ${question.correct_answer} is the correct answer.`],
    };
  }
};

/**
 * Written Response Grader
 *
 * Returns null to indicate API grading needed
 * Actual grading happens via backend AI
 */
export const writtenGrader: QuestionGrader = {
  grade(question, userAnswer): GradingResult | null {
    if (question.question_type !== 'written') return null;

    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        score: 0,
        feedback: 'No answer provided.',
        strengths: [],
        areas_for_improvement: ['Please write a response before submitting.'],
      };
    }

    // Return null to signal that API grading is required
    return null;
  }
};

/**
 * Phase 1.5B Graders
 *
 * Image, Drag-Drop, Math, and Diagram question graders
 */

/**
 * Image Question Grader
 *
 * Returns null to indicate API grading needed
 * Backend uses AI to evaluate answer considering image context
 */
export const imageGrader: QuestionGrader = {
  grade(question, userAnswer): GradingResult | null {
    if (question.question_type !== 'image') return null;

    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        score: 0,
        feedback: 'No answer provided.',
        strengths: [],
        areas_for_improvement: ['Please write a response before submitting.'],
      };
    }

    // Return null to signal that API grading is required
    return null;
  }
};

/**
 * Drag-Drop Grader
 *
 * Local grading by comparing user pairs with correct pairs
 * Deterministic and instant
 */
export const dragDropGrader: QuestionGrader = {
  grade(question, userAnswer): GradingResult | null {
    if (question.question_type !== 'drag_drop') return null;

    if (!userAnswer || userAnswer.length === 0) {
      return {
        score: 0,
        feedback: 'No pairs matched.',
        strengths: [],
        areas_for_improvement: ['Please match items to targets before submitting.'],
      };
    }

    // Get correct pairs from metadata
    const correctPairs = (question.metadata as any)?.correct_pairs || [];
    const userPairs = userAnswer as Array<[string, string]>;

    // Normalize and compare (case-insensitive, trimmed)
    const normalizeStr = (s: string) => s.toLowerCase().trim();

    const correctSet = new Set(
      correctPairs.map(([item, target]: [string, string]) =>
        `${normalizeStr(item)}::${normalizeStr(target)}`
      )
    );

    const correctCount = userPairs.filter(([item, target]) =>
      correctSet.has(`${normalizeStr(item)}::${normalizeStr(target)}`)
    ).length;

    const score = Math.round((correctCount / correctPairs.length) * 100);

    return {
      score,
      feedback: score === 100
        ? 'Perfect! All items matched correctly.'
        : `You matched ${correctCount} out of ${correctPairs.length} pairs correctly.`,
      strengths: score >= 70 ? ['Good understanding of relationships'] : [],
      areas_for_improvement: score < 70
        ? ['Review the relationships between items and their correct matches']
        : [],
    };
  }
};

/**
 * Math Expression Grader
 *
 * Returns null to indicate API grading needed
 * Backend uses normalization + AI for symbolic equivalence
 */
export const mathGrader: QuestionGrader = {
  grade(question, userAnswer): GradingResult | null {
    if (question.question_type !== 'math') return null;

    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        score: 0,
        feedback: 'No answer provided.',
        strengths: [],
        areas_for_improvement: ['Please enter a mathematical expression before submitting.'],
      };
    }

    // Return null for backend symbolic math evaluation
    return null;
  }
};

/**
 * Diagram Drawing Grader
 *
 * Returns null to indicate API grading needed
 * Backend uses AI to evaluate based on evaluation criteria
 */
export const diagramGrader: QuestionGrader = {
  grade(question, userAnswer): GradingResult | null {
    if (question.question_type !== 'diagram') return null;

    if (!userAnswer || !userAnswer.paths || userAnswer.paths.length === 0) {
      return {
        score: 0,
        feedback: 'No diagram provided.',
        strengths: [],
        areas_for_improvement: ['Please draw a diagram before submitting.'],
      };
    }

    // Return null to signal that API grading is required
    return null;
  }
};

/**
 * Code Execution Grader (Phase 1.6 - Deferred)
 *
 * Will use Piston API for sandboxed code execution
 */
/*
export const codeGrader: QuestionGrader = {
  grade(question, userAnswer): GradingResult | null {
    if (question.question_type !== 'code') return null;

    // Return null to indicate backend test runner needed
    // Backend will execute code against test cases using Piston API
    return null;
  }
};
*/

/**
 * Grader Registry
 *
 * Central registry mapping question types to graders
 * Phase 3 + Phase 1.5B graders active
 */
export const graderRegistry: Record<string, QuestionGrader> = {
  // Phase 3 (Original)
  'true_false': trueFalseGrader,
  'multiple_choice': multipleChoiceGrader,
  'written': writtenGrader,

  // Phase 1.5B (Interactive Question Types)
  'image': imageGrader,
  'drag_drop': dragDropGrader,
  'math': mathGrader,
  'diagram': diagramGrader,

  // Phase 1.6 (Deferred)
  // 'code': codeGrader,
};

/**
 * Grade a single question
 *
 * Attempts local grading first, returns null if API grading needed
 *
 * @param question - Question to grade
 * @param userAnswer - User's answer
 * @returns GradingResult or null if API grading required
 */
export function gradeQuestion(
  question: ParsedQuestion,
  userAnswer: any
): GradingResult | null {
  const grader = graderRegistry[question.question_type];

  if (!grader) {
    logger.warn('No grader found for question type:', question.question_type);
    return {
      score: 0,
      feedback: 'Unable to grade this question type.',
      strengths: [],
      areas_for_improvement: [],
    };
  }

  try {
    return grader.grade(question, userAnswer);
  } catch (error) {
    logger.error('Error grading question:', error, {
      questionNumber: question.question_number,
      questionType: question.question_type
    });
    return {
      score: 0,
      feedback: 'Error occurred while grading.',
      strengths: [],
      areas_for_improvement: [],
    };
  }
}

/**
 * Grade all questions in an exam
 *
 * Combines local grading with API grading for written responses
 *
 * @param questions - Array of questions
 * @param answers - Map of question numbers to user answers
 * @param examId - Exam ID for API grading calls
 * @returns Overall score and per-question breakdown
 */
export async function gradeExam(
  questions: ParsedQuestion[],
  answers: Record<number, any>,
  examId: string
): Promise<{
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  breakdown: Array<{
    questionNumber: number;
    result: GradingResult;
  }>;
}> {
  const results: Array<{
    questionNumber: number;
    result: GradingResult;
  }> = [];

  let totalScore = 0;
  let gradedCount = 0;

  logger.info('Starting exam grading:', {
    examId,
    totalQuestions: questions.length,
    answeredQuestions: Object.keys(answers).length
  });

  for (const question of questions) {
    const userAnswer = answers[question.question_number];

    // Attempt local grading
    let result = gradeQuestion(question, userAnswer);

    // If local grading returned null, needs API grading
    if (result === null) {
      try {
        logger.info('Requesting API grading:', {
          examId,
          questionNumber: question.question_number,
          questionType: question.question_type
        });

        // Route to appropriate API grading endpoint
        switch (question.question_type) {
          case 'written':
            result = await gradeWrittenResponse(
              examId,
              question.question_number,
              userAnswer || ''
            );
            break;

          case 'image':
            result = await gradeImageResponse(
              examId,
              question.question_number,
              userAnswer || ''
            );
            break;

          case 'math':
            result = await gradeMathResponse(
              examId,
              question.question_number,
              userAnswer || ''
            );
            break;

          case 'diagram':
            result = await gradeDiagramResponse(
              examId,
              question.question_number,
              userAnswer || { paths: [], timestamp: new Date().toISOString() }
            );
            break;

          default:
            logger.warn('No API grading available for question type:', question.question_type);
            result = {
              score: 0,
              feedback: 'Unable to grade this question type.',
              strengths: [],
              areas_for_improvement: [],
            };
        }
      } catch (error) {
        logger.error('API grading failed for question:', error, {
          questionNumber: question.question_number,
          questionType: question.question_type
        });

        // Fallback result for API failure
        result = {
          score: 0,
          feedback: 'Unable to grade this response. Please contact support.',
          strengths: [],
          areas_for_improvement: [],
        };
      }
    }

    // If still null (shouldn't happen), provide default
    if (!result) {
      result = {
        score: 0,
        feedback: 'Unable to grade this question.',
        strengths: [],
        areas_for_improvement: [],
      };
    }

    results.push({
      questionNumber: question.question_number,
      result
    });

    totalScore += result.score;
    gradedCount++;
  }

  const averageScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;
  const correctAnswers = results.filter(r => r.result.score === 100).length;

  logger.info('Exam grading complete:', {
    examId,
    averageScore,
    correctAnswers,
    totalQuestions: questions.length
  });

  return {
    score: averageScore,
    totalQuestions: questions.length,
    correctAnswers,
    breakdown: results
  };
}

/**
 * Calculate section-level scores
 *
 * Groups results by section and calculates percentage for each
 *
 * @param questions - Array of questions
 * @param breakdown - Grading results per question
 * @returns Map of section names to scores
 */
export function calculateSectionScores(
  questions: ParsedQuestion[],
  breakdown: Array<{ questionNumber: number; result: GradingResult }>
): Record<string, { total: number; correct: number; percentage: number }> {
  const sectionScores: Record<string, { total: number; correct: number; percentage: number }> = {};

  questions.forEach((question) => {
    const section = question.section || 'Unknown';
    const result = breakdown.find(b => b.questionNumber === question.question_number);

    if (!sectionScores[section]) {
      sectionScores[section] = { total: 0, correct: 0, percentage: 0 };
    }

    sectionScores[section].total++;

    if (result && result.result.score === 100) {
      sectionScores[section].correct++;
    }
  });

  // Calculate percentages
  Object.keys(sectionScores).forEach((section) => {
    const { total, correct } = sectionScores[section];
    sectionScores[section].percentage = total > 0
      ? Math.round((correct / total) * 100)
      : 0;
  });

  return sectionScores;
}
