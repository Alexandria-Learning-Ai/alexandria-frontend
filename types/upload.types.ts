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
  type: 'profile_course' | 'hierarchical' | 'custom' | 'guest' | 'predefined' | 'smart_default';
  icon?: string;
  color?: string;
  source?: string;
  confidence?: number; // For smart_default type
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

/**
 * ============================================================
 * Task 2.1: useReducer State Consolidation Types
 * ============================================================
 */

/**
 * Quiz Configuration State
 */
export interface QuizConfig {
  types: QuizType[];
  difficulty: DifficultyLevel;
  numQuestions: number;
  visualEnhancement: VisualEnhancement;
  topic: string;
  subject: string;
  details: string;
  selectedSubject: SelectedSubject | null;
  selectedCourse: SelectedCourse | null;
  selectedHierarchicalSubject: string | null;
  selectedHierarchicalCourse: string | null;
  courseSelectionMode: CourseSelectionMode;
}

/**
 * Study Configuration State
 */
export interface StudyConfig {
  title: string;
  description: string;
  enableStudyMode: boolean;
}

/**
 * Consolidated Upload State for useReducer
 */
export interface UploadState {
  files: UploadFile[];
  uploadPurpose: UploadPurpose;
  quizConfig: QuizConfig;
  studyConfig: StudyConfig;
  uiState: UIState;
  modalState: ModalState;
  textExtractionState: TextExtractionState;
  useAsyncMode: boolean;
  showQuickQuiz: boolean;
}

/**
 * Upload Action Types
 */
export type UploadAction =
  // File actions
  | { type: 'SET_FILES'; payload: UploadFile[] }
  | { type: 'ADD_FILE'; payload: UploadFile }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'CLEAR_FILES' }

  // Upload purpose
  | { type: 'SET_UPLOAD_PURPOSE'; payload: UploadPurpose }

  // Quiz config updates
  | { type: 'UPDATE_QUIZ_CONFIG'; payload: Partial<QuizConfig> }
  | { type: 'SET_QUIZ_TYPES'; payload: QuizType[] }
  | { type: 'SET_DIFFICULTY'; payload: DifficultyLevel }
  | { type: 'SET_NUM_QUESTIONS'; payload: number }
  | { type: 'SET_VISUAL_ENHANCEMENT'; payload: VisualEnhancement }
  | { type: 'SET_SELECTED_SUBJECT'; payload: SelectedSubject | null }
  | { type: 'SET_SELECTED_COURSE'; payload: SelectedCourse | null }
  | { type: 'SET_HIERARCHICAL_SUBJECT'; payload: string | null }
  | { type: 'SET_HIERARCHICAL_COURSE'; payload: string | null }
  | { type: 'SET_COURSE_SELECTION_MODE'; payload: CourseSelectionMode }

  // Study config updates
  | { type: 'UPDATE_STUDY_CONFIG'; payload: Partial<StudyConfig> }

  // UI state updates
  | { type: 'UPDATE_UI_STATE'; payload: Partial<UIState> }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_TRANSITIONING'; payload: boolean }

  // Modal state updates
  | { type: 'UPDATE_MODAL_STATE'; payload: Partial<ModalState> }
  | { type: 'OPEN_MODAL'; payload: keyof ModalState }
  | { type: 'CLOSE_MODAL'; payload: keyof ModalState }
  | { type: 'CLOSE_ALL_MODALS' }

  // Text extraction
  | { type: 'UPDATE_TEXT_EXTRACTION'; payload: Partial<TextExtractionState> }

  // Async mode
  | { type: 'SET_ASYNC_MODE'; payload: boolean }

  // Quick Quiz
  | { type: 'SET_SHOW_QUICK_QUIZ'; payload: boolean }

  // Smart defaults application
  | { type: 'APPLY_SMART_DEFAULTS'; payload: SmartDefaultsPayload }

  // Reset
  | { type: 'RESET_STATE' }
  | { type: 'RESET_QUIZ_CONFIG' }
  | { type: 'RESET_AFTER_UPLOAD' };

/**
 * Smart Defaults Payload
 */
export interface SmartDefaultsPayload {
  difficulty: DifficultyLevel;
  numQuestions: number;
  quizTypes: QuizType[];
  subject?: SelectedSubject;
}
