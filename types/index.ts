// =============================
// Common Type Definitions
// =============================

/**
 * Theme Styles
 */
export interface ThemeStyles {
  container?: ViewStyle;
  text?: TextStyle;
  card?: ViewStyle;
  scoreCard?: ViewStyle;
  scoreNumber?: TextStyle;
  scoreLabel?: TextStyle;
  subtitle?: TextStyle;
  cardBackground?: ViewStyle;
  [key: string]: ViewStyle | TextStyle | undefined;
}

/**
 * Performance Level
 */
export interface Performance {
  level: string;
  emoji?: string;
  color?: string;
  icon?: string;
}

/**
 * Quiz Metadata
 */
export interface QuizMetadata {
  updatedStats?: {
    overall_accuracy?: number;
    total_quizzes?: number;
    average_score?: number;
    total_questions?: number;
  };
  weaknesses?: string[];
  strengths?: string[];
  subjectKey?: string;
  topic?: string;
  difficulty?: string;
  source?: string;
  category?: string;
  [key: string]: any;
}

/**
 * Flashcard Types
 */
export type FlashcardSource = 'quiz_mistake' | 'document_upload' | 'manual' | 'test';
export type FlashcardDifficulty = 'easy' | 'medium' | 'hard';
export type StudyMode = 'due' | 'struggling' | 'review';

export interface SubjectHierarchy {
  subject: string;
  course?: string;
  topic?: string;
  confidence?: number;
  source?: string;
}

export interface DisplayInfo {
  icon: string;
  color: string;
  label?: string;
}

export interface OriginalQuestion {
  id: string | number;
  correctAnswer: string | string[];
  userAnswer?: string | string[];
  options?: string[];
}

export interface Flashcard {
  id: string;
  userId: string;
  source: FlashcardSource;

  // Subject classification
  subject: string;
  course?: string;
  topic?: string;
  subjectHierarchy?: SubjectHierarchy;
  displayInfo?: DisplayInfo;

  difficulty?: FlashcardDifficulty;

  // Flashcard content
  front: string | object;
  back: string | object | AnswerExplanation;

  // Spaced repetition data
  interval?: number;
  repetitions?: number;
  easiness?: number;
  nextReviewDate?: Date | string;

  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastReviewedAt?: Date | string | null;
  reviewCount?: number;
  averageQuality?: number;
  tags?: string[];

  // Optional fields
  firestoreId?: string;
  originalQuestion?: OriginalQuestion;
  originalDocument?: {
    excerpt: string;
    confidence: number;
  };

  // Enhanced metadata
  lastResponseTime?: number | null;
  lastSessionId?: string | null;
  lastStudyMode?: StudyMode | null;
}

export interface AnswerExplanation {
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  options?: string[] | null;
  hasUserMistake?: boolean;
}

export interface ReviewData {
  nextReviewDate: Date;
  interval: number;
  easiness: number;
  repetitions: number;
}

export interface StudyStatistics {
  totalFlashcards: number;
  dueToday: number;
  masteringCards: number;
  strugglingCards: number;
  dailyStreak: number;
  subjectBreakdown: SubjectBreakdown;
  weeklyProgress: WeeklyProgressData[];
}

export interface SubjectBreakdown {
  bySubject: Record<string, number>;
  byCourse: Record<string, number>;
  byTopic: Record<string, number>;
  hierarchical: Record<string, HierarchicalBreakdown>;
}

export interface HierarchicalBreakdown {
  total: number;
  courses: Record<string, CourseBreakdown>;
  displayInfo: DisplayInfo;
}

export interface CourseBreakdown {
  total: number;
  topics: Record<string, number>;
}

export interface WeeklyProgressData {
  date: string;
  cardsStudied: number;
  timeSpent: number;
}

export interface StudySessionData {
  cardsStudied: number;
  timeSpent: number;
  timestamp?: string;
}

export interface FlashcardFilters {
  subject?: string;
  difficulty?: FlashcardDifficulty;
  source?: FlashcardSource;
}

export interface ReviewMetadata {
  responseTime?: number;
  sessionId?: string;
  studyMode?: StudyMode;
}

export interface QuizResults {
  questions: Question[];
  metadata?: QuizMetadata;
}

/**
 * Quiz Screen Types
 */
export interface QuizState {
  started: boolean;
  submitted: boolean;
  showResults: boolean;
  loading: boolean;
  currentQuestionIndex: number;
  score: number;
}

export interface QuizMetadataState {
  title: string;
  startTime: number | null;
  completionTime: number | null;
}

export interface ThemeColors {
  // Alexandria Core Colors
  alexandriaGold: string;
  alexandriaBronze: string;
  alexandriaSilver: string;
  alexandriaNavy: string;
  alexandriaCream: string;

  // Status Colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // Theme Colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderSecondary: string;
  overlay: string;
  shadow: string;
}

export interface ThemeState {
  isDarkMode: boolean;
  colors: ThemeColors | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date | string;
}

export interface AnalyticsInsights {
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  performance?: {
    accuracy: number;
    speed: number;
    consistency: number;
  };
}

export interface AnalyticsState {
  processing: boolean;
  achievements: Achievement[];
  insights: AnalyticsInsights | null;
}

export interface RouteParams {
  backendQuizData?: Question[];
  metadata?: QuizMetadata;
  sharedQuiz?: SharedQuiz | null;
  isChallenge?: boolean;
  challengeId?: string | null;
  quizId?: string | null;
  source?: string;
  personalizedQuiz?: any;
  isRecommended?: boolean;
  recommendationData?: any;
}

export interface SharedQuiz {
  id: string;
  title: string;
  questions: Question[];
  metadata?: QuizMetadata;
  createdBy?: string;
  createdAt?: Date | string;
}

export interface UserAnswersMap {
  [questionId: string]: string | string[] | boolean;
}

export interface QuizNavigationProps {
  route: {
    params?: RouteParams;
  };
  navigation: any; // React Navigation NavigationProp
}

export interface QuizScreenProps extends QuizNavigationProps {
  // Any additional props
}

/**
 * Quiz Progress Save/Load Types
 */
export interface SaveQuizProgressRequest {
  quiz_id: string;
  quiz_source: 'quiz' | 'book_study' | 'challenge' | 'shared';
  quiz_data: {
    title: string;
    questions: any[];
    metadata?: Record<string, any>;
  };
  current_question_index: number;
  answers_so_far: Record<string, any>;
  time_spent_seconds: number;
  quiz_metadata?: {
    isChallenge?: boolean;
    challengeId?: string | null;
    materialId?: string | null;
    sharedQuizId?: string | null;
  };
}

export interface SaveQuizProgressResponse {
  success: boolean;
  saved_progress_id: string;
  expires_at: string;
  message: string;
}

export interface LoadQuizProgressResponse {
  success: boolean;
  progress: {
    quiz_id: string;
    quiz_source: string;
    quiz_data: {
      title: string;
      questions: any[];
      metadata?: Record<string, any>;
    };
    current_question_index: number;
    answers_so_far: Record<string, any>;
    time_spent_seconds: number;
    quiz_metadata?: Record<string, any>;
    created_at: string;
    expires_at: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * Results Screen Types
 */
export interface ResultsScreenRouteParams {
  score: number;
  totalQuestions: number;
  questions: Question[];
  incorrectAnswers?: Question[];
  correctAnswers?: Question[];
  quizData?: any;
  quizMetadata?: QuizMetadata;
  timeSpent?: number;
  userId?: string;
}

export interface ResultsNavigationProps {
  route: {
    params: ResultsScreenRouteParams;
  };
  navigation: any;
}

export interface PerformanceLevel {
  level: 'Excellent' | 'Great' | 'Good' | 'Needs Improvement';
  emoji: string;
  color: string;
  message: string;
}

export interface SubjectPerformance {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  color?: string;
  icon?: string;
}

export interface DetailedAnalytics {
  totalTime: number;
  averageTimePerQuestion: number;
  fastestQuestion: number;
  slowestQuestion: number;
  streak: number;
  difficulty: string;
  performanceLevel: PerformanceLevel;
  subjectBreakdown: SubjectPerformance[];
}

export interface ResultsScreenProps extends ResultsNavigationProps {
  // Any additional props
}

/**
 * Option Data (for multiple choice questions)
 */
export interface OptionData {
  id?: string | number;
  label: string;
  text: string;
}

/**
 * Question
 */
export interface Question {
  id: string | number;
  question: string;
  questionText?: string; // Alternative question text field
  text?: string; // Another alternative text field
  type: 'multiple_choice' | 'true_false' | 'open_ended' | 'fill_in_blank' | 'math';
  options?: string[] | OptionData[]; // Can be simple strings or structured option objects
  correctAnswer: string | string[];
  userAnswer?: string | string[];
  isCorrect?: boolean;
  explanation?: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'genius';
  points?: number;
  solution_steps?: string[]; // Math question solution steps
}

/**
 * Quiz
 */
export interface Quiz {
  id: string;
  questions: Question[];
  metadata: QuizMetadata;
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  completedAt?: Date;
}

/**
 * User
 */
export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

/**
 * Student Profile
 */
export interface StudentProfile {
  userId: string;
  name?: string;
  educationLevel?: string;
  year?: string;
  semester?: string;
  program?: string;
  courses?: string[];
  learningStyles?: string[];
  painPoints?: string[];
  studyGoals?: string[];
  completionPercentage?: number;
}

/**
 * Analytics
 */
export interface Analytics {
  totalQuizzes: number;
  overallAccuracy: number;
  totalQuestions: number;
  averageScore: number;
  studyStreak: number;
  subjectStats: SubjectStat[];
}

export interface SubjectStat {
  subject: string;
  quizCount: number;
  accuracy: number;
  totalQuestions: number;
}

/**
 * Achievement
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  progress?: number;
  total?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * Flashcard
 */
/**
 * Navigation Types
 */
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Quiz: { quizId?: string; questions?: Question[]; metadata?: QuizMetadata };
  QuizScreen: {
    remedialQuiz?: any;
    isRemedial?: boolean;
    targetTopic?: string;
  };
  Results: { quiz: Quiz; questions: Question[]; metadata: QuizMetadata };
  ExplanationScreen: {
    question: Question;
    userAnswer: any;
    subject?: string;
    difficulty?: string;
    questionNumber?: number;
  };
  Profile: {
    editMode?: boolean;
    editSection?: 'personal' | 'education' | 'program' | 'courses' | 'preferences' | 'all';
    targetStep?: number;
    sectionTitle?: string;
  };
  ProfileEditSelection: undefined;
  ProfileView: undefined;
  WeaknessAnalysis: undefined;
  ScheduleExam: undefined;
  ExamListScreen: undefined;
  Upload: undefined;
  QuizHistory: undefined;
  Settings: undefined;
  [key: string]: any;
};

/**
 * Style Types (Re-export from React Native)
 */
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export type { ViewStyle, TextStyle, ImageStyle };

/**
 * Component Props Types
 */
export interface BaseComponentProps {
  testID?: string;
  style?: ViewStyle | ViewStyle[];
}
