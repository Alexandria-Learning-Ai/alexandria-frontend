/**
 * Exam Generator Type Definitions
 *
 * Comprehensive TypeScript types for the Alexandria Exam Generator feature
 * including API requests/responses, UI state, and navigation.
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

/**
 * Exam question section types
 */
export type ExamSectionType = 'True/False' | 'Multiple Choice' | 'Written';

/**
 * Difficulty levels for exam generation
 */
export type ExamDifficulty = 'Easy' | 'Moderate' | 'Hard';

/**
 * Exam length options
 */
export type ExamLength = 'Short' | 'Standard' | 'Full-Length';

/**
 * Exam generation style/tone
 */
export type ExamStyle = 'Professor' | 'Conversational' | 'Formal' | 'Socratic';

/**
 * Question types in parsed exams
 * Phase 3: true_false, multiple_choice, written
 * Phase 1.5B: image, drag_drop, math, diagram
 * Future Phase 5: code, media
 */
export type QuestionType =
  | 'true_false'      // Phase 3
  | 'multiple_choice' // Phase 3
  | 'written'         // Phase 3
  | 'image'           // Phase 1.5B
  | 'drag_drop'       // Phase 1.5B
  | 'math'            // Phase 1.5B
  | 'diagram'         // Phase 1.5B
  | 'code'            // Future Phase 5
  | 'media';          // Future Phase 5

/**
 * Exam generation request payload
 */
export interface ExamGenerateRequest {
  topic: string;
  sections: ExamSectionType[];
  difficulty: ExamDifficulty;
  exam_length: ExamLength;
  style?: ExamStyle;
  generate_graph?: boolean; // Optional graph generation for Section 3 (Math topics + Full-Length only)
  include_code_challenge?: boolean; // Optional code challenge for Section 3 (CS topics + Full-Length only)
}

/**
 * Metadata returned from exam generation
 */
export interface ExamMetadata {
  model: string;
  tokens_used: number;
  sections_count: number;
}

/**
 * Legacy exam response format (deprecated)
 * Old format returned raw exam_text instead of structured sections
 */
export interface LegacyExamResponse {
  exam_id: string;
  exam_text: string;
  created_at: string;
  metadata: ExamMetadata;
}

/**
 * Summary of an exam (for history list)
 */
export interface ExamSummary {
  exam_id: string;
  topic: string;
  difficulty: string;
  sections: string[];
  created_at: string;
  preview: string; // First 100 chars of exam
}

/**
 * Parsed question structure from exam text
 */
/**
 * Base question interface - all questions extend this
 * metadata field allows arbitrary data for advanced question types
 */
export interface BaseQuestion {
  question_number: number;
  question_text: string;
  question_type: QuestionType;
  correct_answer: string;
  section: string;
  metadata?: Record<string, any>; // For Phase 5 advanced types
}

/**
 * True/False question (Phase 3)
 */
export interface TrueFalseQuestion extends BaseQuestion {
  question_type: 'true_false';
  correct_answer: 'TRUE' | 'FALSE';
}

/**
 * Multiple Choice question (Phase 3)
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  question_type: 'multiple_choice';
  options?: string[]; // A, B, C, D
  correct_answer: string; // Letter
}

/**
 * Written Response question (Phase 3)
 */
export interface WrittenQuestion extends BaseQuestion {
  question_type: 'written';
  correct_answer: string; // Rubric/key points
}

/**
 * Image question (Phase 1.5B)
 * Question with accompanying image
 */
export interface ImageQuestion extends BaseQuestion {
  question_type: 'image';
  metadata: {
    image_url: string;
    image_caption?: string;
  };
}

/**
 * Drag-and-Drop question (Phase 1.5B)
 * Matching items to targets
 */
export interface DragDropQuestion extends BaseQuestion {
  question_type: 'drag_drop';
  metadata: {
    items: string[];
    targets: string[];
    correct_pairs: Array<[string, string]>;
  };
}

/**
 * Math equation question (Phase 1.5B)
 * Mathematical expression input with LaTeX and graph support
 */
export interface MathQuestion extends BaseQuestion {
  question_type: 'math';
  metadata: {
    requires_latex?: boolean;
    graph_expression?: string | null;
    graph_image?: string | null;
    expression_type?: string;
    variables?: string[];
    answer_format?: string;
  };
}

/**
 * Diagram drawing question (Phase 1.5B)
 * Freeform drawing canvas
 */
export interface DiagramQuestion extends BaseQuestion {
  question_type: 'diagram';
  metadata: {
    canvas_type?: string;
    requirements?: string[];
    evaluation_criteria?: string[];
  };
}

/**
 * Code question (Phase 5 - Piston API Integration)
 */
export interface CodeQuestion extends BaseQuestion {
  question_type: 'code';
  metadata: {
    language: string;
    starter_code?: string;
    test_cases: Array<{
      input: any;
      expected: any;
      description?: string;
    }>;
    time_limit?: number; // milliseconds
  };
}

/**
 * Media (audio/video) question (Phase 5 placeholder)
 */
export interface MediaQuestion extends BaseQuestion {
  question_type: 'media';
  metadata: {
    media_url: string;
    media_type: 'audio' | 'video';
    timestamps?: Array<{ time: number; label: string }>;
  };
}

/**
 * Union type for all question types (Phase 3 + Phase 1.5B + Future Phase 5)
 */
export type ParsedQuestion =
  | TrueFalseQuestion
  | MultipleChoiceQuestion
  | WrittenQuestion
  | ImageQuestion       // Phase 1.5B
  | DragDropQuestion    // Phase 1.5B
  | MathQuestion        // Phase 1.5B
  | DiagramQuestion     // Phase 1.5B
  | CodeQuestion        // Future Phase 5
  | MediaQuestion;      // Future Phase 5

// Old ParsedQuestion interface removed - replaced with union type above
/*


/**
 * Detailed exam with parsed questions (legacy flat format)
 */
export interface ExamDetail {
  exam_id: string;
  topic: string;
  exam_text: string;
  parsed_questions: ParsedQuestion[];
  sections: string[];
  difficulty: string;
  exam_length: string;
  style: string;
  created_at: string;
}

/**
 * Structured exam section with questions
 * New format from Math Intelligence backend
 * Sections can have shared graphs (one graph per Math section)
 */
export interface StructuredExamSection {
  name: string;
  type: 'multiple_choice' | 'true_false' | 'math' | 'written' | 'image' | 'drag_drop' | 'diagram' | 'code';
  questions: ParsedQuestion[];
  graph_expression?: string | null;  // Section-level graph (Math sections only)
  graph_image?: string | null;        // Base64 PNG graph image
}

/**
 * Structured exam response format
 * New format with sections and enhanced metadata
 *
 * Matches backend ExamResponse schema
 */
export interface StructuredExamDetail {
  exam_id: string;
  title: string;
  duration_minutes?: number;
  difficulty: string;
  sections: StructuredExamSection[];
  created_at: string;
  metadata: Record<string, any>;
  // Legacy fields (may be in metadata)
  topic?: string;
  exam_length?: string;
  style?: string;
}

/**
 * ExamResponse type alias
 * POST /api/exams/generate now returns the same structured format as GET
 * This is an alias of StructuredExamDetail for consistency
 */
export type ExamResponse = StructuredExamDetail;

/**
 * User's answer to a question
 */
export interface UserAnswer {
  question_number: number;
  user_answer: any; // Flexible for any question type
  is_correct?: boolean;
  grading_result?: GradingResult; // For written responses
}

/**
 * AI grading result for written responses
 */
export interface GradingResult {
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
}

/**
 * Individual test case result from code execution
 */
export interface CodeTestResult {
  passed: boolean;
  test_case_input: string;
  expected_output: string;
  actual_output: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
}

/**
 * Code grading result from Piston API execution
 */
export interface CodeGradingResult {
  score: number; // 0-100
  is_correct: boolean;
  feedback: string;
  test_results: CodeTestResult[];
  tests_passed: number;
  tests_total: number;
}

/**
 * Exam attempt (user taking an exam)
 */
export interface ExamAttempt {
  attempt_id: string;
  exam_id: string;
  user_answers: Record<number, UserAnswer>;
  started_at: string;
  completed_at?: string;
  score?: number;
  total_questions: number;
  correct_answers?: number;
}

/**
 * Exam results summary
 */
export interface ExamResults {
  attempt_id: string;
  exam_id: string;
  exam_topic: string;
  score: number; // Overall percentage
  total_questions: number;
  correct_answers: number;
  incorrect_questions: Array<{
    question_number: number;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    explanation?: string;
  }>;
  section_scores: Record<string, {
    total: number;
    correct: number;
    percentage: number;
  }>;
  completed_at: string;
}

/**
 * File attachment for exam generation
 */
export interface ExamFile {
  uri: string;
  name: string;
  type: string; // MIME type
  size?: number;
}

/**
 * Exam history API response
 */
export interface ExamHistoryResponse {
  exams: ExamSummary[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Section header with position in exam text
 */
export interface SectionHeader {
  title: string;
  startIndex: number;
}

/**
 * Exam mode for viewer screen
 */
export type ExamMode = 'take' | 'review';

/**
 * Navigation Stack for Exam Feature
 */
export type ExamStackParamList = {
  ExamGenerator: undefined;
  ExamViewer: {
    examId: string;
    mode: ExamMode;
    attemptId?: string; // For review mode
    duration?: number; // Timer duration in minutes (optional, derived from exam_length if not provided)
  };
  ExamHistory: undefined;
  ExamResults: {
    attemptId: string;
    examId: string;
  };
};

/**
 * Navigation props for Exam Generator Screen
 */
export type ExamGeneratorScreenNavigationProp = NativeStackNavigationProp<
  ExamStackParamList,
  'ExamGenerator'
>;

export interface ExamGeneratorScreenProps {
  navigation: ExamGeneratorScreenNavigationProp;
}

/**
 * Navigation props for Exam Viewer Screen
 */
export type ExamViewerScreenNavigationProp = NativeStackNavigationProp<
  ExamStackParamList,
  'ExamViewer'
>;

export type ExamViewerScreenRouteProp = RouteProp<ExamStackParamList, 'ExamViewer'>;

export interface ExamViewerScreenProps {
  navigation: ExamViewerScreenNavigationProp;
  route: ExamViewerScreenRouteProp;
}

/**
 * Navigation props for Exam History Screen
 */
export type ExamHistoryScreenNavigationProp = NativeStackNavigationProp<
  ExamStackParamList,
  'ExamHistory'
>;

export interface ExamHistoryScreenProps {
  navigation: ExamHistoryScreenNavigationProp;
}

/**
 * Navigation props for Exam Results Screen
 */
export type ExamResultsScreenNavigationProp = NativeStackNavigationProp<
  ExamStackParamList,
  'ExamResults'
>;

export type ExamResultsScreenRouteProp = RouteProp<ExamStackParamList, 'ExamResults'>;

export interface ExamResultsScreenProps {
  navigation: ExamResultsScreenNavigationProp;
  route: ExamResultsScreenRouteProp;
}

/**
 * Component Props
 */

export interface QuestionRendererProps {
  question: ParsedQuestion;
  userAnswer?: any;
  onAnswer: (questionNumber: number, answer: any) => void;
  mode: ExamMode;
}


export interface QuestionCardProps {
  question: ParsedQuestion;
  questionNumber: number;
  userAnswer?: string;
  onAnswerChange: (answer: string) => void;
  mode: ExamMode;
  showCorrectAnswer?: boolean;
}

export interface SectionHeaderProps {
  title: string;
  sectionNumber: number;
}

export interface ExamTimerProps {
  duration: number; // seconds
  onExpire: () => void;
  isPaused?: boolean;
}

export interface GradingFeedbackProps {
  result: GradingResult;
  questionNumber: number;
}

export interface ExamCardProps {
  exam: ExamSummary;
  onPress: () => void;
  onDelete: () => void;
  onRetake: () => void;
}

/**
 * Form state for exam generation
 */
export interface ExamGenerationFormState {
  topic: string;
  sections: ExamSectionType[];
  difficulty: ExamDifficulty;
  exam_length: ExamLength;
  style: ExamStyle;
  file?: ExamFile;
}

/**
 * Validation errors for exam generation form
 */
export interface ExamGenerationFormErrors {
  topic?: string;
  sections?: string;
  file?: string;
}
