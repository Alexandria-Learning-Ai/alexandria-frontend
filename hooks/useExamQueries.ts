/**
 * useExamQueries
 *
 * React Query hooks for Alexandria Exam Generator
 *
 * Features:
 * - Type-safe exam API queries and mutations
 * - Automatic caching and background refetching
 * - Optimistic updates for better UX
 * - Infinite scroll pagination for exam history
 * - Error handling and retry logic
 *
 * Hooks:
 * - useGenerateExam - Generate new exam
 * - useExamHistory - Fetch paginated exam list
 * - useExam - Fetch single exam details
 * - useDeleteExam - Delete exam
 * - useGradeWritten - Grade written response
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  generateExam,
  fetchExamHistory,
  fetchExamById,
  fetchStructuredExam,
  flattenExamSections,
  deleteExam,
  gradeWrittenResponse,
  gradeImageResponse,
  gradeDragDropResponse,
  gradeMathResponse,
  gradeDiagramResponse
} from '../services/examService';
import {
  ExamGenerateRequest,
  ExamFile,
  ExamResponse,
  ExamHistoryResponse,
  ExamDetail,
  StructuredExamDetail,
  GradingResult
} from '../types/exam';
import logger from '../utils/logger';

/**
 * Query keys for React Query cache management
 */
export const examQueryKeys = {
  all: ['exams'] as const,
  lists: () => [...examQueryKeys.all, 'list'] as const,
  list: (filters: string) => [...examQueryKeys.lists(), { filters }] as const,
  details: () => [...examQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...examQueryKeys.details(), id] as const,
};

/**
 * Generate exam mutation
 *
 * Creates a new exam from topic, settings, and optional file
 *
 * @returns Mutation hook with generateExam function
 *
 * @example
 * const { mutate: generate, isPending } = useGenerateExam();
 * generate({
 *   request: { topic: 'Biology', difficulty: 'Easy', ... },
 *   file: { uri: '...', name: 'notes.pdf', type: 'application/pdf' }
 * });
 */
export function useGenerateExam() {
  const queryClient = useQueryClient();

  return useMutation<
    ExamResponse,
    Error,
    {
      request: ExamGenerateRequest;
      file?: ExamFile;
    }
  >({
    mutationFn: ({ request, file }) => generateExam(request, file),
    onSuccess: (data) => {
      logger.info('Exam generated successfully, invalidating cache', {
        examId: data.exam_id
      });

      // Invalidate exam history to show new exam
      queryClient.invalidateQueries({ queryKey: examQueryKeys.lists() });

      // DO NOT pre-populate cache - the generation response doesn't include parsed_questions
      // This would cause ExamViewer to show empty screen when navigating to the exam
      // Instead, let useExam fetch the full exam data when needed
    },
    onError: (error) => {
      logger.error('Failed to generate exam:', error);
    },
    retry: 1, // Retry once on failure
  });
}

/**
 * Fetch exam history with infinite scroll pagination
 *
 * Automatically fetches more exams as user scrolls
 *
 * @returns Infinite query with exam pages
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetching } = useExamHistory();
 */
export function useExamHistory() {
  return useInfiniteQuery<ExamHistoryResponse, Error>({
    queryKey: examQueryKeys.lists(),
    queryFn: ({ pageParam = 0 }) => fetchExamHistory(pageParam as number, 20),
    getNextPageParam: (lastPage, pages) => {
      const currentOffset = pages.length * 20;
      return currentOffset < lastPage.total ? currentOffset : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Fetch single exam by ID (legacy flat format)
 *
 * Retrieves detailed exam with parsed questions
 *
 * @param examId - UUID of the exam
 * @param options - Query options
 * @returns Query with exam details
 *
 * @example
 * const { data: exam, isLoading } = useExam(examId);
 */
export function useExam(examId: string, options?: { enabled?: boolean }) {
  return useQuery<ExamDetail, Error>({
    queryKey: examQueryKeys.detail(examId),
    queryFn: () => fetchExamById(examId),
    enabled: !!examId && (options?.enabled !== false),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

/**
 * Fetch exam with structured format (Math Intelligence)
 *
 * Retrieves exam with sections, LaTeX metadata, and graphs.
 * Falls back to legacy format if structured format not available.
 *
 * @param examId - UUID of the exam
 * @param options - Query options
 * @returns Query with structured exam details
 *
 * @example
 * const { data: exam, isLoading } = useStructuredExam(examId);
 * // Access sections: exam.sections[0].questions
 */
export function useStructuredExam(examId: string, options?: { enabled?: boolean }) {
  return useQuery<StructuredExamDetail, Error>({
    queryKey: [...examQueryKeys.detail(examId), 'structured'],
    queryFn: async () => {
      try {
        // Try structured format first
        const structuredExam = await fetchStructuredExam(examId);

        // Validate structured exam has sections
        if (!structuredExam.sections || !Array.isArray(structuredExam.sections)) {
          logger.error('Structured exam missing sections array', { examId, data: structuredExam });
          throw new Error('Invalid structured exam format');
        }

        // Extract legacy fields from metadata if not present at top level
        const enrichedExam = {
          ...structuredExam,
          topic: structuredExam.topic || structuredExam.metadata?.topic || structuredExam.title,
          exam_length: structuredExam.exam_length || structuredExam.metadata?.exam_length || 'Standard',
          style: structuredExam.style || structuredExam.metadata?.style || 'Professor',
        };

        logger.info('Successfully fetched structured exam', {
          examId,
          sectionsCount: structuredExam.sections.length,
          topic: enrichedExam.topic
        });

        return enrichedExam;
      } catch (error) {
        // Fallback to legacy format and convert
        logger.warn('Structured format failed, converting from legacy format', { examId, error });
        const legacyExam = await fetchExamById(examId);

        // Validate legacy exam has parsed_questions
        if (!legacyExam.parsed_questions) {
          logger.error('Legacy exam missing parsed_questions', { examId, data: legacyExam });
          throw new Error('Exam has no questions');
        }

        logger.info('Converting legacy exam to structured format', {
          examId,
          questionCount: legacyExam.parsed_questions.length
        });

        // Convert legacy to structured format
        const sections = groupQuestionsBySection(legacyExam.parsed_questions);

        const structuredExam: StructuredExamDetail = {
          exam_id: legacyExam.exam_id,
          title: legacyExam.topic,
          topic: legacyExam.topic,
          difficulty: legacyExam.difficulty,
          exam_length: legacyExam.exam_length,
          style: legacyExam.style,
          created_at: legacyExam.created_at,
          metadata: {},
          sections: sections,
        };

        logger.info('Legacy exam converted successfully', {
          examId,
          sectionsCount: sections.length
        });

        return structuredExam;
      }
    },
    enabled: !!examId && (options?.enabled !== false),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

/**
 * Helper: Group legacy questions by section
 */
function groupQuestionsBySection(questions: any[]): any[] {
  // Safety check: ensure questions is an array
  if (!questions || !Array.isArray(questions)) {
    logger.warn('groupQuestionsBySection called with invalid input', { questions });
    return [{
      name: 'General',
      type: 'multiple_choice',
      questions: [],
    }];
  }

  // If empty array, return default section
  if (questions.length === 0) {
    logger.warn('groupQuestionsBySection called with empty questions array');
    return [{
      name: 'General',
      type: 'multiple_choice',
      questions: [],
    }];
  }

  const sectionMap = new Map<string, any[]>();

  questions.forEach((q) => {
    const sectionName = q.section || 'General';
    if (!sectionMap.has(sectionName)) {
      sectionMap.set(sectionName, []);
    }
    sectionMap.get(sectionName)!.push(q);
  });

  const sections: any[] = [];
  sectionMap.forEach((questions, name) => {
    // Determine section type from first question
    const firstQuestion = questions[0];
    const type = firstQuestion?.question_type || 'multiple_choice';

    sections.push({
      name,
      type,
      questions,
    });
  });

  return sections;
}

/**
 * Delete exam mutation
 *
 * Removes exam and updates cache optimistically
 *
 * @returns Mutation hook with deleteExam function
 *
 * @example
 * const { mutate: remove } = useDeleteExam();
 * remove(examId);
 */
export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousExams: unknown }>({
    mutationFn: (examId: string) => deleteExam(examId),
    onMutate: async (examId) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: examQueryKeys.lists() });

      // Snapshot previous value for rollback
      const previousExams = queryClient.getQueryData(examQueryKeys.lists());

      // Optimistically update cache by removing exam
      queryClient.setQueryData(
        examQueryKeys.lists(),
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: ExamHistoryResponse) => ({
              ...page,
              exams: page.exams.filter(exam => exam.exam_id !== examId),
              total: page.total - 1,
            })),
          };
        }
      );

      return { previousExams };
    },
    onError: (error, examId, context) => {
      logger.error('Failed to delete exam:', error);

      // Rollback optimistic update
      if (context?.previousExams) {
        queryClient.setQueryData(examQueryKeys.lists(), context.previousExams);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: examQueryKeys.lists() });
    },
  });
}

/**
 * Grade written response mutation
 *
 * Sends written answer to AI for grading and feedback
 *
 * @returns Mutation hook with gradeWritten function
 *
 * @example
 * const { mutate: grade, isPending } = useGradeWritten();
 * grade({
 *   examId,
 *   questionNumber: 5,
 *   studentAnswer: 'Mitochondria is the powerhouse...'
 * });
 */
export function useGradeWritten() {
  return useMutation<
    GradingResult,
    Error,
    {
      examId: string;
      questionNumber: number;
      studentAnswer: string;
    }
  >({
    mutationFn: ({ examId, questionNumber, studentAnswer }) =>
      gradeWrittenResponse(examId, questionNumber, studentAnswer),
    onSuccess: (data, variables) => {
      logger.info('Written response graded:', {
        examId: variables.examId,
        questionNumber: variables.questionNumber,
        score: data.score
      });
    },
    onError: (error) => {
      logger.error('Failed to grade written response:', error);
    },
    retry: 1, // Retry once on failure
  });
}

/**
 * Prefetch exam for faster navigation
 *
 * Utility function to preload exam before user navigates to viewer
 *
 * @param examId - UUID of the exam to prefetch
 *
 * @example
 * const prefetch = usePrefetchExam();
 * prefetch(examId); // Preload before navigation
 */
export function usePrefetchExam() {
  const queryClient = useQueryClient();

  return (examId: string) => {
    queryClient.prefetchQuery({
      queryKey: examQueryKeys.detail(examId),
      queryFn: () => fetchExamById(examId),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Grade image response mutation
 *
 * Sends image question answer to AI for grading and feedback
 *
 * @returns Mutation hook with gradeImage function
 *
 * @example
 * const { mutate: grade, isPending } = useGradeImage();
 * grade({
 *   examId,
 *   questionNumber: 3,
 *   userAnswer: 'The diagram shows a eukaryotic cell...'
 * });
 */
export function useGradeImage() {
  return useMutation<
    GradingResult,
    Error,
    {
      examId: string;
      questionNumber: number;
      userAnswer: string;
    }
  >({
    mutationFn: ({ examId, questionNumber, userAnswer }) =>
      gradeImageResponse(examId, questionNumber, userAnswer),
    onSuccess: (data, variables) => {
      logger.info('Image response graded:', {
        examId: variables.examId,
        questionNumber: variables.questionNumber,
        score: data.score
      });
    },
    onError: (error) => {
      logger.error('Failed to grade image response:', error);
    },
    retry: 1,
  });
}

/**
 * Grade drag-drop response mutation
 *
 * Sends drag-drop pairings for grading
 *
 * @returns Mutation hook with gradeDragDrop function
 *
 * @example
 * const { mutate: grade, isPending } = useGradeDragDrop();
 * grade({
 *   examId,
 *   questionNumber: 4,
 *   userAnswer: [['Item 1', 'Target A'], ['Item 2', 'Target B']]
 * });
 */
export function useGradeDragDrop() {
  return useMutation<
    GradingResult,
    Error,
    {
      examId: string;
      questionNumber: number;
      userAnswer: Array<[string, string]>;
    }
  >({
    mutationFn: ({ examId, questionNumber, userAnswer }) =>
      gradeDragDropResponse(examId, questionNumber, userAnswer),
    onSuccess: (data, variables) => {
      logger.info('Drag-drop response graded:', {
        examId: variables.examId,
        questionNumber: variables.questionNumber,
        score: data.score
      });
    },
    onError: (error) => {
      logger.error('Failed to grade drag-drop response:', error);
    },
    retry: 1,
  });
}

/**
 * Grade math response mutation
 *
 * Sends mathematical expression to AI for grading
 *
 * @returns Mutation hook with gradeMath function
 *
 * @example
 * const { mutate: grade, isPending } = useGradeMath();
 * grade({
 *   examId,
 *   questionNumber: 7,
 *   userAnswer: 'x = 2y + 5'
 * });
 */
export function useGradeMath() {
  return useMutation<
    GradingResult,
    Error,
    {
      examId: string;
      questionNumber: number;
      userAnswer: string;
    }
  >({
    mutationFn: ({ examId, questionNumber, userAnswer }) =>
      gradeMathResponse(examId, questionNumber, userAnswer),
    onSuccess: (data, variables) => {
      logger.info('Math response graded:', {
        examId: variables.examId,
        questionNumber: variables.questionNumber,
        score: data.score
      });
    },
    onError: (error) => {
      logger.error('Failed to grade math response:', error);
    },
    retry: 1,
  });
}

/**
 * Grade diagram response mutation
 *
 * Sends diagram data to AI for grading and feedback
 *
 * @returns Mutation hook with gradeDiagram function
 *
 * @example
 * const { mutate: grade, isPending } = useGradeDiagram();
 * grade({
 *   examId,
 *   questionNumber: 9,
 *   userAnswer: { paths: [...], timestamp: '...' }
 * });
 */
export function useGradeDiagram() {
  return useMutation<
    GradingResult,
    Error,
    {
      examId: string;
      questionNumber: number;
      userAnswer: { paths: any[]; timestamp: string };
    }
  >({
    mutationFn: ({ examId, questionNumber, userAnswer }) =>
      gradeDiagramResponse(examId, questionNumber, userAnswer),
    onSuccess: (data, variables) => {
      logger.info('Diagram response graded:', {
        examId: variables.examId,
        questionNumber: variables.questionNumber,
        score: data.score
      });
    },
    onError: (error) => {
      logger.error('Failed to grade diagram response:', error);
    },
    retry: 1,
  });
}

/**
 * Invalidate all exam queries
 *
 * Utility function to force refetch of all exam data
 * Useful after bulk operations or sync
 *
 * @example
 * const invalidate = useInvalidateExams();
 * invalidate(); // Force refetch all exams
 */
export function useInvalidateExams() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: examQueryKeys.all });
  };
}
