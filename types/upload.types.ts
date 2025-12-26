/**
 * Upload Screen Type Definitions
 *
 * Comprehensive TypeScript types for the UploadScreen ecosystem
 * including screen props, state, navigation, and data structures.
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Animated } from 'react-native';

/**
 * Root navigation stack parameter list
 * Define all routes and their expected parameters
 */
export type RootStackParamList = {
  Upload: undefined;
  QuizScreen: {
    quiz: Quiz;
    source: string;
    metadata: QuizMetadata;
  };
  MaterialViewer: {
    material: StudyMaterial;
    mode: 'read' | 'listen' | 'study';
  };
  StudyMaterials: undefined;
  // Add other routes as needed
};

/**
 * Upload Screen Navigation Prop
 */
export type UploadScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Upload'>;

/**
 * Upload Screen Props
 */
export interface UploadScreenProps {
  navigation: UploadScreenNavigationProp;
}

/**
 * File Upload Types
 */
export interface UploadFile {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  fileName?: string; // Alternative name field for some pickers
}

/**
 * Upload Purpose
 */
export type UploadPurpose = 'study' | 'quiz';

/**
 * Visual Enhancement Preference
 */
export type VisualEnhancement = 'auto' | 'enabled' | 'disabled';

/**
 * Difficulty Levels
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Quiz Types
 */
export type QuizType = 'all' | 'multiple_choice' | 'open_ended' | 'true_false';

/**
 * Course Selection Mode
 */
export type CourseSelectionMode = 'profile' | 'hierarchical';

/**
 * Subject Selection
 */
export interface SelectedSubject {
  key: string;
  name: string;
  type: 'profile_course' | 'hierarchical' | 'custom' | 'guest' | 'predefined';
  icon?: string;
  color?: string;
  source?: string;
}

/**
 * Course Selection
 */
export interface SelectedCourse {
  name: string;
  code?: string;
  subject?: string;
  icon?: string;
  color?: string;
  source: 'profile' | 'hierarchical';
}

/**
 * Subject Validation Result
 */
export interface SubjectValidation {
  valid: boolean;
  message: string;
  suggestions: string[];
}

/**
 * UI State
 */
export interface UIState {
  uploading: boolean;
  isDarkMode: boolean;
  showFreshnessIndicator: boolean;
  isTransitioning: boolean;
}

/**
 * Modal State
 */
export interface ModalState {
  subjectSelector: boolean;
  course: boolean;
  quizType: boolean;
  difficulty: boolean;
  hierarchicalCourse: boolean;
  textPreview: boolean;
}

/**
 * Quiz Configuration
 */
export interface QuizConfiguration {
  types: QuizType[];
  difficulty: DifficultyLevel;
  numQuestions: number;
  visualEnhancement: VisualEnhancement;
}

/**
 * Text Extraction State
 */
export interface TextExtractionState {
  extractedText: string;
  progress: number;
  quality: number | null;
}

/**
 * Theme Colors
 */
export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;
  glass: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  alexandriaGold: string;
  alexandriaBronze: string;
  alexandriaNavy: string;
  border: string;
  borderSecondary: string;
  success: string;
  error: string;
  warning: string;
  shadow: string;
  [key: string]: string;
}

/**
 * Quiz Question
 */
export interface QuizQuestion {
  id: string;
  question: string;
  type: QuizType;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty?: DifficultyLevel;
  has_image?: boolean;
  image_url?: string;
}

/**
 * Quiz Data
 */
export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  created_at?: string;
  difficulty?: DifficultyLevel;
  subject?: string;
  topic?: string;
}

/**
 * Quiz Metadata
 */
export interface QuizMetadata {
  title: string;
  category: string;
  course?: string;
  subject?: string;
  topic?: string;
  manualSubject?: SelectedSubject;
  subjectKey?: string;
  subjectType?: string;
  subjectValidation?: SubjectValidation | null;
  fileName?: string;
  hierarchical?: {
    enabled: boolean;
    subject: string | null;
    course: string | null;
    source: string;
  };
  anti_repetition_applied?: boolean;
  visual_enhancement?: VisualEnhancement;
}

/**
 * Study Material
 */
export interface StudyMaterial {
  id: string;
  title: string;
  fileName: string;
  extractedText: string;
  extractionQuality: number;
  characterCount: number;
  subject: string;
  course: string;
  uploadDate: string;
  hasAudio: boolean;
  hasSummary: boolean;
  type: string;
  isBasicMode?: boolean;
}

/**
 * Quiz Generation Parameters
 */
export interface QuizGenerationParams {
  files: UploadFile[];
  uploadPurpose: UploadPurpose;
  quizTypes: QuizType[];
  numQuestions: number;
  difficulty: DifficultyLevel;
  language?: string;
  visualEnhancement: VisualEnhancement;
  selectedSubject: SelectedSubject | null;
  selectedCourse: SelectedCourse | null;
  selectedHierarchicalSubject: string | null;
  selectedHierarchicalCourse: string | null;
  courseSelectionMode: CourseSelectionMode;
  subjectValidation: SubjectValidation | null;
  getFileIcon: (fileName: string) => string;
  navigation: UploadScreenNavigationProp;
  containerAnim: Animated.Value;
  onFilesCleared?: () => void;
  onSubjectCleared?: () => void;
}

/**
 * Quiz Generation Result
 */
export interface QuizGenerationResult {
  success: boolean;
  data?: any;
  uploadPurpose?: UploadPurpose;
  storedMaterialId?: string;
  firstFile?: UploadFile;
  showFreshnessIndicator?: boolean;
  studyMaterial?: StudyMaterial;
  error?: string;
  errorType?: ErrorType;
}

/**
 * Error Types
 */
export type ErrorType = 'timeout' | 'network' | 'file_size' | 'file_type' | 'unknown';

/**
 * API Error
 */
export interface ApiError {
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
  code?: string;
  message?: string;
}

/**
 * Upload Options
 */
export interface UploadOptions {
  uploadPurpose: UploadPurpose;
  quizTypes: QuizType[];
  numQuestions: number;
  difficulty: DifficultyLevel;
  language: string;
  visualEnhancement: VisualEnhancement;
  selectedSubject?: SelectedSubject | null;
  selectedCourse?: SelectedCourse | null;
}

/**
 * Upload Result
 */
export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
  materialId?: string;
}

/**
 * User Course
 */
export interface UserCourse {
  key: string;
  name: string;
  code?: string;
  subject?: string;
  icon?: string;
  color?: string;
  source: string;
}

/**
 * Subject Option for Dropdown
 */
export interface SubjectOption {
  label: string;
  value: string;
  icon: string;
  color: string;
}

/**
 * Quiz Type Option for Dropdown
 */
export interface QuizTypeOption {
  label: string;
  value: string;
  icon: string;
  color: string;
}

/**
 * Difficulty Option for Dropdown
 */
export interface DifficultyOption {
  label: string;
  value: string;
  icon: string;
}

/**
 * Translation Function Type
 */
export type TranslationFunction = (key: string, options?: Record<string, any>) => string;

/**
 * Custom Hook Return Types
 */

export interface UseFileUploadReturn {
  files: UploadFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  pickFromGallery: () => Promise<void>;
  pickDocument: () => Promise<void>;
  handleSelectFiles: () => void;
  removeFile: (fileName: string) => void;
  getFileIcon: (fileName: string) => string;
}

export interface UseUploadHandlerReturn {
  isUploading: boolean;
  responseText: string | null;
  setResponseText: (text: string | null) => void;
  showFreshnessIndicator: boolean;
  uploadFile: (file: UploadFile, options: UploadOptions) => Promise<UploadResult>;
  resetUploadState: () => void;
}

export interface UseQuizGenerationReturn {
  responseText: string | null;
  setResponseText: React.Dispatch<React.SetStateAction<string | null>>;
  handleQuizGeneration: (params: QuizGenerationParams) => Promise<QuizGenerationResult>;
}

export interface UseSubjectValidationReturn {
  selectedSubject: SelectedSubject | null;
  setSelectedSubject: React.Dispatch<React.SetStateAction<SelectedSubject | null>>;
  subjectValidation: SubjectValidation | null;
  validatingSubject: boolean;
  validateSubject: (subjectText: string) => Promise<void>;
  handleSubjectSelect: (subjectData: SelectedSubject) => void;
  clearSelectedSubject: () => void;
}

export interface UseHierarchicalCoursesReturn {
  userCourses: UserCourse[];
  hasProfileCourses: boolean;
  selectedCourse: SelectedCourse | null;
  setSelectedCourse: React.Dispatch<React.SetStateAction<SelectedCourse | null>>;
  courseSelectionMode: CourseSelectionMode;
  setCourseSelectionMode: React.Dispatch<React.SetStateAction<CourseSelectionMode>>;
  availableSubjects: string[];
  selectedHierarchicalSubject: string | null;
  setSelectedHierarchicalSubject: React.Dispatch<React.SetStateAction<string | null>>;
  availableCourses: string[];
  selectedHierarchicalCourse: string | null;
  setSelectedHierarchicalCourse: React.Dispatch<React.SetStateAction<string | null>>;
  loadUserCourses: () => Promise<void>;
  loadHierarchicalSubjects: () => void;
  handleHierarchicalSubjectSelect: (subjectName: string) => void;
  handleHierarchicalCourseSelect: (courseName: string) => void;
}

/**
 * Component Props Types
 */

export interface UploadHeaderProps {
  navigation: UploadScreenNavigationProp;
  containerAnim: Animated.Value;
  themeColors: ThemeColors;
  styles: any;
  t: TranslationFunction;
}

export interface FileUploadButtonProps {
  files: UploadFile[];
  onPress: () => void;
  isDisabled: boolean;
  styles: any;
  t: TranslationFunction;
}

export interface UploadPurposeToggleProps {
  uploadPurpose: UploadPurpose;
  setUploadPurpose: (purpose: UploadPurpose) => void;
  styles: any;
}

export interface QuizConfigurationProps {
  quizTypes: QuizType[];
  setQuizTypes: (types: QuizType[]) => void;
  difficulty: DifficultyLevel;
  setDifficulty: (difficulty: DifficultyLevel) => void;
  numQuestions: number;
  setNumQuestions: (num: number) => void;
  quizTypeModalVisible: boolean;
  setQuizTypeModalVisible: (visible: boolean) => void;
  difficultyModalVisible: boolean;
  setDifficultyModalVisible: (visible: boolean) => void;
  styles: any;
}

export interface UploadSummaryProps {
  uploadPurpose: UploadPurpose;
  selectedSubject: SelectedSubject | null;
  quizTypes: QuizType[];
  difficulty: DifficultyLevel;
  numQuestions: number;
  themeColors: ThemeColors;
  styles: any;
  t: TranslationFunction;
}

export interface GenerateButtonProps {
  uploadPurpose: UploadPurpose;
  isUploading: boolean;
  isDisabled: boolean;
  filesCount: number;
  onPress: () => void;
  themeColors: ThemeColors;
  styles: any;
  t: TranslationFunction;
}

export interface FileListItemProps {
  item: UploadFile;
  index: number;
  onRemove: (fileName: string) => void;
  getFileIcon: (fileName: string) => string;
  themeColors: ThemeColors;
  styles: any;
}

export interface EmptyFilesListProps {
  themeColors: ThemeColors;
  styles: any;
  t: TranslationFunction;
}

export interface FreshnessIndicatorProps {
  isVisible: boolean;
  t: TranslationFunction;
}

export interface UploadProgressBarProps {
  isVisible: boolean;
  progressWidth: Animated.AnimatedInterpolation<number>;
  themeColors: ThemeColors;
  styles: any;
}

export interface ResponseMessageProps {
  message: string | null;
  themeColors: ThemeColors;
  styles: any;
}
