/**
 * Exam Parser Utility
 *
 * Parses exam text into structured questions and sections
 * Handles various question formats and extracts answers
 *
 * Features:
 * - Section extraction (Section I, II, III, etc.)
 * - Question parsing by type (True/False, Multiple Choice, Written)
 * - Answer extraction from [ANSWER: ...] tags
 * - Robust regex patterns for various formats
 */

import { ParsedQuestion, SectionHeader, QuestionType } from '../types/exam';
import logger from './logger';

/**
 * Parse exam text into structured questions
 *
 * Extracts questions with their types, options, and correct answers
 *
 * @param examText - Raw exam text with [ANSWER: ...] tags
 * @returns Array of parsed questions
 */
export function parseExamText(examText: string): ParsedQuestion[] {
  try {
    const questions: ParsedQuestion[] = [];
    let currentSection = 'General';

    // Split by sections first
    const sections = extractSections(examText);

    // If no sections found, treat entire text as one section
    if (sections.length === 0) {
      sections.push({ title: 'General', startIndex: 0 });
    }

    // Process each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nextSection = sections[i + 1];
      currentSection = section.title;

      // Extract text for this section
      const sectionText = nextSection
        ? examText.slice(section.startIndex, nextSection.startIndex)
        : examText.slice(section.startIndex);

      // Parse questions in this section
      const sectionQuestions = parseQuestionsInSection(sectionText, currentSection);
      questions.push(...sectionQuestions);
    }

    // Re-number questions sequentially
    questions.forEach((q, index) => {
      q.question_number = index + 1;
    });

    logger.info('Parsed exam questions:', {
      totalQuestions: questions.length,
      sections: sections.length
    });

    return questions;
  } catch (error) {
    logger.error('Error parsing exam text:', error);
    return [];
  }
}

/**
 * Extract section headers from exam text
 *
 * @param examText - Raw exam text
 * @returns Array of section headers with positions
 */
export function extractSections(examText: string): SectionHeader[] {
  const sections: SectionHeader[] = [];

  // Regex patterns for section headers
  const patterns = [
    // Section I: True/False Questions
    /Section\s+(I+|[IVX]+|\d+):\s*([^\n]+)/gi,
    // Part A: Multiple Choice
    /Part\s+([A-Z]|\d+):\s*([^\n]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(examText)) !== null) {
      sections.push({
        title: match[0].trim(),
        startIndex: match.index,
      });
    }
  }

  // Sort by position in text
  sections.sort((a, b) => a.startIndex - b.startIndex);

  return sections;
}

/**
 * Parse questions within a section
 *
 * @param sectionText - Text for this section
 * @param sectionTitle - Title of the section
 * @returns Array of parsed questions
 */
function parseQuestionsInSection(
  sectionText: string,
  sectionTitle: string
): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Determine question type from section title
  const sectionLower = sectionTitle.toLowerCase();
  let defaultType: QuestionType = 'written';

  if (sectionLower.includes('true') || sectionLower.includes('false')) {
    defaultType = 'true_false';
  } else if (sectionLower.includes('multiple') || sectionLower.includes('choice')) {
    defaultType = 'multiple_choice';
  } else if (sectionLower.includes('essay') || sectionLower.includes('written')) {
    defaultType = 'written';
  }

  // Regex to match questions:
  // 1. What is photosynthesis?
  // [ANSWER: Photosynthesis is...]
  const questionRegex = /(\d+)\.\s*(.+?)(?=\n\d+\.\s|\n\n|\[ANSWER:|$)/gis;

  let match;
  while ((match = questionRegex.exec(sectionText)) !== null) {
    const questionNumber = parseInt(match[1], 10);
    const questionBlock = match[2].trim();

    // Extract answer if present
    const answerMatch = sectionText.match(
      new RegExp(`${questionNumber}\\.\\s*.+?\\[ANSWER:\\s*([^\\]]+)\\]`, 'is')
    );
    const correctAnswer = answerMatch ? answerMatch[1].trim() : '';

    // Remove answer tag from question text
    const questionText = questionBlock.replace(/\[ANSWER:[^\]]+\]/gi, '').trim();

    // Detect question type and extract options
    const { type, options } = detectQuestionType(questionText, defaultType);

    questions.push({
      question_number: questionNumber,
      question_text: questionText,
      question_type: type,
      options: options,
      correct_answer: correctAnswer,
      section: sectionTitle,
      metadata: {}
    } as ParsedQuestion);
  }

  return questions;
}

/**
 * Detect question type and extract options
 *
 * @param questionText - Text of the question
 * @param defaultType - Default type based on section
 * @returns Question type and options (if MCQ)
 */
function detectQuestionType(
  questionText: string,
  defaultType: QuestionType
): { type: QuestionType; options?: string[] } {
  // Check for True/False indicators
  if (
    questionText.match(/\(true\s*\/\s*false\)/i) ||
    questionText.match(/\(T\s*\/\s*F\)/i) ||
    defaultType === 'true_false'
  ) {
    return { type: 'true_false' };
  }

  // Check for Multiple Choice options (A, B, C, D)
  const optionMatches = questionText.match(/[A-D]\)\s*(.+?)(?=[A-D]\)|$)/gis);

  if (optionMatches && optionMatches.length >= 2) {
    const options = optionMatches.map(opt => {
      // Extract text after "A) " or "B) "
      return opt.replace(/^[A-D]\)\s*/i, '').trim();
    });

    return { type: 'multiple_choice', options };
  }

  // Default to written response
  return { type: defaultType };
}

/**
 * Format question for display
 *
 * Removes answer tags and cleans up formatting
 *
 * @param questionText - Raw question text
 * @returns Cleaned question text
 */
export function cleanQuestionText(questionText: string): string {
  return questionText
    .replace(/\[ANSWER:[^\]]+\]/gi, '') // Remove answer tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract answer from tagged text
 *
 * @param text - Text containing [ANSWER: ...] tag
 * @returns Extracted answer or empty string
 */
export function extractAnswer(text: string): string {
  const match = text.match(/\[ANSWER:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : '';
}

/**
 * Check if answer is correct
 *
 * Handles different question types with appropriate comparison
 *
 * @param userAnswer - User's answer
 * @param correctAnswer - Correct answer
 * @param questionType - Type of question
 * @returns True if answer is correct
 */
export function isAnswerCorrect(
  userAnswer: string,
  correctAnswer: string,
  questionType: QuestionType
): boolean {
  if (!userAnswer || !correctAnswer) return false;

  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  switch (questionType) {
    case 'true_false':
      // Accept "true", "t", "false", "f"
      return (
        normalizedUser === normalizedCorrect ||
        (normalizedUser === 't' && normalizedCorrect === 'true') ||
        (normalizedUser === 'f' && normalizedCorrect === 'false')
      );

    case 'multiple_choice':
      // Accept "A", "Option A", or the full option text
      return normalizedUser === normalizedCorrect || normalizedUser.startsWith(normalizedCorrect);

    case 'written':
      // Written responses require AI grading
      // For basic checking, just ensure answer is not empty
      return userAnswer.trim().length > 0;

    default:
      return false;
  }
}

/**
 * Get question type display name
 *
 * @param type - Question type enum
 * @returns Human-readable type name
 */
export function getQuestionTypeLabel(type: QuestionType): string {
  switch (type) {
    case 'true_false':
      return 'True/False';
    case 'multiple_choice':
      return 'Multiple Choice';
    case 'written':
      return 'Written Response';
    default:
      return 'Question';
  }
}

/**
 * Calculate section scores
 *
 * Groups questions by section and calculates score per section
 *
 * @param questions - All questions
 * @param userAnswers - User's answers map (question_number => answer)
 * @returns Section scores map
 */
export function calculateSectionScores(
  questions: ParsedQuestion[],
  userAnswers: Record<number, string>
): Record<string, { total: number; correct: number; percentage: number }> {
  const sectionScores: Record<string, { total: number; correct: number }> = {};

  // Group questions by section
  questions.forEach(question => {
    if (!sectionScores[question.section]) {
      sectionScores[question.section] = { total: 0, correct: 0 };
    }

    sectionScores[question.section].total += 1;

    const userAnswer = userAnswers[question.question_number];
    if (
      userAnswer &&
      isAnswerCorrect(userAnswer, question.correct_answer, question.question_type)
    ) {
      sectionScores[question.section].correct += 1;
    }
  });

  // Calculate percentages
  const result: Record<string, { total: number; correct: number; percentage: number }> = {};

  Object.entries(sectionScores).forEach(([section, scores]) => {
    result[section] = {
      ...scores,
      percentage: scores.total > 0 ? (scores.correct / scores.total) * 100 : 0,
    };
  });

  return result;
}
