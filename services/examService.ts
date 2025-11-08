/**
 * Exam Service
 *
 * Service layer for Alexandria Exam Generator API interactions
 * Handles all HTTP requests for exam generation, retrieval, and grading
 *
 * Features:
 * - Exam generation with file upload support
 * - Exam history with pagination
 * - Individual exam retrieval
 * - Written response AI grading
 * - Exam deletion
 * - Type-safe API calls
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import {
  ExamGenerateRequest,
  ExamResponse,
  ExamHistoryResponse,
  ExamDetail,
  StructuredExamDetail,
  GradingResult,
  ExamFile,
  ParsedQuestion
} from '../types/exam';

// Backend API base URL
const API_BASE_URL = 'https://alexandria-api-ywcw.onrender.com';
const EXAMS_API_BASE = `${API_BASE_URL}/api/exams`;

/**
 * Get authentication headers with user ID
 * @returns Headers object with X-User-ID
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const userId = await AsyncStorage.getItem('userId');

    if (!userId) {
      logger.warn('No userId found in AsyncStorage for exam API call');
      return {};
    }

    return {
      'X-User-ID': userId,
    };
  } catch (error) {
    logger.error('Error getting auth headers:', error);
    return {};
  }
}

/**
 * Generate a new exam
 *
 * @param request - Exam generation parameters
 * @param file - Optional file attachment (PDF, image)
 * @returns Generated exam with ID and text
 * @throws Error if generation fails
 */
export async function generateExam(
  request: ExamGenerateRequest,
  file?: ExamFile
): Promise<ExamResponse> {
  try {
    logger.info('Generating exam:', {
      topic: request.topic,
      difficulty: request.difficulty,
      sections: request.sections,
      hasFile: !!file
    });

    const headers = await getAuthHeaders();

    // Build FormData for multipart/form-data request
    const formData = new FormData();
    formData.append('topic', request.topic);
    formData.append('sections', JSON.stringify(request.sections));
    formData.append('difficulty', request.difficulty);
    formData.append('exam_length', request.exam_length);

    if (request.style) {
      formData.append('style', request.style);
    }

    // Attach file if provided
    if (file) {
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    }

    const response = await axios.post(`${EXAMS_API_BASE}/generate`, formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minute timeout for AI generation
    });

    logger.info('Exam generated successfully:', {
      examId: response.data.exam_id,
      tokensUsed: response.data.metadata?.tokens_used
    });

    return response.data;
  } catch (error) {
    logger.error('Error generating exam:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;

      if (status === 400) {
        throw new Error(`Invalid request: ${message}`);
      } else if (status === 413) {
        throw new Error('File too large. Maximum size is 10MB.');
      } else if (status === 429) {
        throw new Error('Too many requests. Please try again later.');
      } else if (status === 500) {
        throw new Error('Server error. Please try again.');
      }
    }

    throw new Error('Failed to generate exam. Please check your connection and try again.');
  }
}

/**
 * Fetch exam history with pagination
 *
 * @param offset - Starting index (default: 0)
 * @param limit - Number of exams to fetch (default: 20)
 * @returns List of exam summaries with pagination info
 */
export async function fetchExamHistory(
  offset: number = 0,
  limit: number = 20
): Promise<ExamHistoryResponse> {
  try {
    logger.info('Fetching exam history:', { offset, limit });

    const headers = await getAuthHeaders();

    const response = await axios.get(EXAMS_API_BASE, {
      headers,
      params: { offset, limit },
      timeout: 10000,
    });

    logger.info('Exam history fetched:', {
      total: response.data.data.total,
      fetched: response.data.data.exams.length
    });

    return response.data.data;
  } catch (error) {
    logger.error('Error fetching exam history:', error);
    throw new Error('Failed to load exam history. Please try again.');
  }
}

/**
 * Fetch single exam by ID with parsed questions (legacy flat format)
 *
 * @param examId - UUID of the exam
 * @returns Detailed exam with parsed questions
 */
export async function fetchExamById(examId: string): Promise<ExamDetail> {
  try {
    logger.info('Fetching exam:', { examId });

    const headers = await getAuthHeaders();

    const response = await axios.get(`${EXAMS_API_BASE}/${examId}`, {
      headers,
      timeout: 10000,
    });

    logger.info('Exam fetched successfully:', {
      examId,
      questionsCount: response.data.data.parsed_questions.length
    });

    return response.data.data;
  } catch (error) {
    logger.error('Error fetching exam:', error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Exam not found.');
    }

    throw new Error('Failed to load exam. Please try again.');
  }
}

/**
 * Fetch exam with structured format (Math Intelligence)
 *
 * @param examId - UUID of the exam
 * @returns Structured exam with sections and enhanced metadata
 */
export async function fetchStructuredExam(examId: string): Promise<StructuredExamDetail> {
  try {
    logger.info('Fetching structured exam:', { examId });

    const headers = await getAuthHeaders();

    const response = await axios.get(`${EXAMS_API_BASE}/${examId}`, {
      headers,
      params: { format: 'structured' },
      timeout: 10000,
    });

    const data = response.data.data;

    // Validate structure
    if (!data.sections || !Array.isArray(data.sections)) {
      logger.warn('Backend did not return structured format, falling back to legacy');
      throw new Error('Invalid exam format: missing sections');
    }

    logger.info('Structured exam fetched successfully:', {
      examId,
      sectionsCount: data.sections.length,
      totalQuestions: data.sections.reduce(
        (sum: number, s: any) => sum + (s.questions?.length || 0),
        0
      )
    });

    data.sections.forEach((section: any, i: number) => {
      logger.debug(`  Section ${i + 1}: ${section.name} (${section.questions?.length || 0} questions)`);
    });

    return data;
  } catch (error) {
    logger.error('Error fetching structured exam:', error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Exam not found.');
    }

    throw new Error('Failed to load exam. Please try again.');
  }
}

/**
 * Flatten structured exam sections into single question array
 * Helper for compatibility with existing components
 *
 * @param exam - Structured exam with sections
 * @returns Flat array of questions with section context
 */
export function flattenExamSections(exam: StructuredExamDetail): ParsedQuestion[] {
  // Safety check: ensure exam has sections array
  if (!exam || !exam.sections || !Array.isArray(exam.sections)) {
    logger.error('flattenExamSections called with invalid exam', { exam });
    return [];
  }

  try {
    const flattened = exam.sections.flatMap((section, sectionIndex) => {
      // Safety check: ensure section has questions array
      if (!section || !section.questions || !Array.isArray(section.questions)) {
        logger.warn('Section missing questions array', { sectionIndex, section });
        return [];
      }

      return section.questions.map((q) => ({
        ...q,
        // Ensure section field is set from section name
        section: section.name,
      }));
    });

    logger.debug('Flattened exam sections', {
      sectionsCount: exam.sections.length,
      questionsCount: flattened.length
    });

    return flattened;
  } catch (error) {
    logger.error('Error flattening exam sections:', error);
    return [];
  }
}

/**
 * Delete an exam
 *
 * @param examId - UUID of the exam to delete
 */
export async function deleteExam(examId: string): Promise<void> {
  try {
    logger.info('Deleting exam:', { examId });

    const headers = await getAuthHeaders();

    await axios.delete(`${EXAMS_API_BASE}/${examId}`, {
      headers,
      timeout: 10000,
    });

    logger.info('Exam deleted successfully:', { examId });
  } catch (error) {
    logger.error('Error deleting exam:', error);
    throw new Error('Failed to delete exam. Please try again.');
  }
}

/**
 * Grade a written response using AI
 *
 * @param examId - UUID of the exam
 * @param questionNumber - Question number (1-indexed)
 * @param studentAnswer - User's written answer
 * @returns AI grading with score and feedback
 */
export async function gradeWrittenResponse(
  examId: string,
  questionNumber: number,
  studentAnswer: string
): Promise<GradingResult> {
  try {
    logger.info('Grading written response:', {
      examId,
      questionNumber,
      answerLength: studentAnswer.length
    });

    const headers = await getAuthHeaders();

    const formData = new FormData();
    formData.append('question_number', questionNumber.toString());
    formData.append('student_answer', studentAnswer);

    const response = await axios.post(
      `${EXAMS_API_BASE}/${examId}/grade-written`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 1 minute timeout for AI grading
      }
    );

    logger.info('Written response graded:', {
      examId,
      questionNumber,
      score: response.data.data.score
    });

    return response.data.data;
  } catch (error) {
    logger.error('Error grading written response:', error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Question not found.');
    }

    throw new Error('Failed to grade response. Please try again.');
  }
}

/**
 * Validate exam generation request
 *
 * @param request - Request to validate
 * @returns Validation errors or null if valid
 */
export function validateExamRequest(request: ExamGenerateRequest): Record<string, string> | null {
  const errors: Record<string, string> = {};

  // Topic validation
  if (!request.topic || request.topic.trim().length < 3) {
    errors.topic = 'Topic must be at least 3 characters';
  } else if (request.topic.trim().length > 200) {
    errors.topic = 'Topic must be less than 200 characters';
  }

  // Sections validation
  if (!request.sections || request.sections.length === 0) {
    errors.sections = 'Please select at least one section type';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Grade an image question response using AI
 *
 * @param examId - UUID of the exam
 * @param questionNumber - Question number (1-indexed)
 * @param userAnswer - User's text answer describing the image
 * @returns AI grading with score and feedback
 */
export async function gradeImageResponse(
  examId: string,
  questionNumber: number,
  userAnswer: string
): Promise<GradingResult> {
  try {
    logger.info('Grading image response:', {
      examId,
      questionNumber,
      answerLength: userAnswer.length
    });

    const headers = await getAuthHeaders();

    const formData = new FormData();
    formData.append('question_number', questionNumber.toString());
    formData.append('user_answer', userAnswer);

    const response = await axios.post(
      `${EXAMS_API_BASE}/${examId}/grade-image`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );

    logger.info('Image response graded:', {
      examId,
      questionNumber,
      score: response.data.data.score
    });

    return response.data.data;
  } catch (error) {
    logger.error('Error grading image response:', error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Question not found.');
    }

    throw new Error('Failed to grade response. Please try again.');
  }
}

/**
 * Grade a drag-drop question response
 *
 * @param examId - UUID of the exam
 * @param questionNumber - Question number (1-indexed)
 * @param userAnswer - Array of [item, target] pairs
 * @returns Grading result with correctness
 */
export async function gradeDragDropResponse(
  examId: string,
  questionNumber: number,
  userAnswer: Array<[string, string]>
): Promise<GradingResult> {
  try {
    logger.info('Grading drag-drop response:', {
      examId,
      questionNumber,
      pairCount: userAnswer.length
    });

    const headers = await getAuthHeaders();

    const formData = new FormData();
    formData.append('question_number', questionNumber.toString());
    formData.append('user_answer', JSON.stringify(userAnswer));

    const response = await axios.post(
      `${EXAMS_API_BASE}/${examId}/grade-drag-drop`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    logger.info('Drag-drop response graded:', {
      examId,
      questionNumber,
      score: response.data.data.score
    });

    return response.data.data;
  } catch (error) {
    logger.error('Error grading drag-drop response:', error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Question not found.');
    }

    throw new Error('Failed to grade response. Please try again.');
  }
}

/**
 * Grade a math question response using AI
 *
 * @param examId - UUID of the exam
 * @param questionNumber - Question number (1-indexed)
 * @param userAnswer - User's mathematical expression
 * @returns AI grading with score and feedback
 */
export async function gradeMathResponse(
  examId: string,
  questionNumber: number,
  userAnswer: string
): Promise<GradingResult> {
  try {
    logger.info('Grading math response:', {
      examId,
      questionNumber,
      expression: userAnswer
    });

    const headers = await getAuthHeaders();

    const formData = new FormData();
    formData.append('question_number', questionNumber.toString());
    formData.append('user_answer', userAnswer);

    const response = await axios.post(
      `${EXAMS_API_BASE}/${examId}/grade-math`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );

    logger.info('Math response graded:', {
      examId,
      questionNumber,
      score: response.data.data.score
    });

    return response.data.data;
  } catch (error) {
    logger.error('Error grading math response:', error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Question not found.');
    }

    throw new Error('Failed to grade response. Please try again.');
  }
}

/**
 * Grade a diagram question response using AI
 *
 * @param examId - UUID of the exam
 * @param questionNumber - Question number (1-indexed)
 * @param userAnswer - Diagram data with paths array
 * @returns AI grading with score and feedback
 */
export async function gradeDiagramResponse(
  examId: string,
  questionNumber: number,
  userAnswer: { paths: any[]; timestamp: string }
): Promise<GradingResult> {
  try {
    logger.info('Grading diagram response:', {
      examId,
      questionNumber,
      pathCount: userAnswer.paths.length
    });

    const headers = await getAuthHeaders();

    const formData = new FormData();
    formData.append('question_number', questionNumber.toString());
    formData.append('user_answer', JSON.stringify(userAnswer));

    const response = await axios.post(
      `${EXAMS_API_BASE}/${examId}/grade-diagram`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );

    logger.info('Diagram response graded:', {
      examId,
      questionNumber,
      score: response.data.data.score
    });

    return response.data.data;
  } catch (error) {
    logger.error('Error grading diagram response:', error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Question not found.');
    }

    throw new Error('Failed to grade response. Please try again.');
  }
}

/**
 * Format exam creation date for display
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string
 */
export function formatExamDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    logger.warn('Error formatting exam date:', error);
    return isoDate;
  }
}
