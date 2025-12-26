/**
 * Upload Screen State Reducer
 *
 * Consolidates 20+ useState calls into a single, atomic state management system.
 * This provides better performance (fewer re-renders) and makes state updates
 * more predictable and easier to reason about.
 *
 * Task 2.1: Consolidate State with useReducer
 */

import type {
  UploadState,
  UploadAction,
  UploadFile,
  ModalState,
} from '../types/upload.types';
import { sanitizeNumber, sanitizeDifficulty, sanitizeQuizTypes } from '../utils/inputSanitization';
import logger from '../utils/logger';

/**
 * Initial modal state
 */
const initialModalState: ModalState = {
  subjectSelector: false,
  course: false,
  quizType: false,
  difficulty: false,
  hierarchicalCourse: false,
  textPreview: false,
};

/**
 * Initial Upload State
 * This is the starting state when UploadScreen mounts
 */
export const initialUploadState: UploadState = {
  files: [],
  uploadPurpose: 'study',
  quizConfig: {
    types: ['all'],
    difficulty: 'medium',
    numQuestions: 10,
    visualEnhancement: 'auto',
    topic: '',
    subject: '',
    details: '',
    selectedSubject: null,
    selectedCourse: null,
    selectedHierarchicalSubject: null,
    selectedHierarchicalCourse: null,
    courseSelectionMode: 'profile',
  },
  studyConfig: {
    title: '',
    description: '',
    enableStudyMode: true,
  },
  uiState: {
    uploading: false,
    isDarkMode: false,
    showFreshnessIndicator: false,
    isTransitioning: false,
  },
  modalState: initialModalState,
  textExtractionState: {
    extractedText: '',
    progress: 0,
    quality: null,
  },
  useAsyncMode: true,
  showQuickQuiz: false,
};

/**
 * Upload Reducer
 *
 * Pure function that takes current state and an action, and returns new state.
 * All state updates go through this reducer for consistency.
 *
 * @param state - Current upload state
 * @param action - Action to perform
 * @returns New state after applying action
 */
export function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    // ============================================================
    // File Actions
    // ============================================================
    case 'SET_FILES':
      return {
        ...state,
        files: action.payload,
      };

    case 'ADD_FILE':
      return {
        ...state,
        files: [...state.files, action.payload],
      };

    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter((f) => f.name !== action.payload),
      };

    case 'CLEAR_FILES':
      return {
        ...state,
        files: [],
      };

    // ============================================================
    // Upload Purpose
    // ============================================================
    case 'SET_UPLOAD_PURPOSE':
      return {
        ...state,
        uploadPurpose: action.payload,
        // Clear files when changing purpose (prevents confusion)
        files: [],
        // Reset quick quiz state
        showQuickQuiz: false,
      };

    // ============================================================
    // Quiz Configuration Updates
    // ============================================================
    case 'UPDATE_QUIZ_CONFIG':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, ...action.payload },
      };

    case 'SET_QUIZ_TYPES':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, types: action.payload },
      };

    case 'SET_DIFFICULTY':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, difficulty: action.payload },
      };

    case 'SET_NUM_QUESTIONS':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, numQuestions: action.payload },
      };

    case 'SET_VISUAL_ENHANCEMENT':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, visualEnhancement: action.payload },
      };

    case 'SET_SELECTED_SUBJECT':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, selectedSubject: action.payload },
      };

    case 'SET_SELECTED_COURSE':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, selectedCourse: action.payload },
      };

    case 'SET_HIERARCHICAL_SUBJECT':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, selectedHierarchicalSubject: action.payload },
      };

    case 'SET_HIERARCHICAL_COURSE':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, selectedHierarchicalCourse: action.payload },
      };

    case 'SET_COURSE_SELECTION_MODE':
      return {
        ...state,
        quizConfig: { ...state.quizConfig, courseSelectionMode: action.payload },
      };

    // ============================================================
    // Study Configuration Updates
    // ============================================================
    case 'UPDATE_STUDY_CONFIG':
      return {
        ...state,
        studyConfig: { ...state.studyConfig, ...action.payload },
      };

    // ============================================================
    // UI State Updates
    // ============================================================
    case 'UPDATE_UI_STATE':
      return {
        ...state,
        uiState: { ...state.uiState, ...action.payload },
      };

    case 'SET_UPLOADING':
      return {
        ...state,
        uiState: { ...state.uiState, uploading: action.payload },
      };

    case 'SET_TRANSITIONING':
      return {
        ...state,
        uiState: { ...state.uiState, isTransitioning: action.payload },
      };

    // ============================================================
    // Modal State Updates
    // ============================================================
    case 'UPDATE_MODAL_STATE':
      return {
        ...state,
        modalState: { ...state.modalState, ...action.payload },
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        modalState: { ...state.modalState, [action.payload]: true },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modalState: { ...state.modalState, [action.payload]: false },
      };

    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modalState: initialModalState,
      };

    // ============================================================
    // Text Extraction State
    // ============================================================
    case 'UPDATE_TEXT_EXTRACTION':
      return {
        ...state,
        textExtractionState: { ...state.textExtractionState, ...action.payload },
      };

    // ============================================================
    // Async Mode
    // ============================================================
    case 'SET_ASYNC_MODE':
      return {
        ...state,
        useAsyncMode: action.payload,
      };

    // ============================================================
    // Quick Quiz
    // ============================================================
    case 'SET_SHOW_QUICK_QUIZ':
      return {
        ...state,
        showQuickQuiz: action.payload,
      };

    // ============================================================
    // Smart Defaults Application
    // ============================================================
    case 'APPLY_SMART_DEFAULTS':
      // ✅ FIX Bug #11: Validate incoming smart defaults data
      const validatedNumQuestions = sanitizeNumber(
        action.payload.numQuestions,
        1,  // min
        50, // max
        10  // default
      );
      const validatedDifficulty = sanitizeDifficulty(action.payload.difficulty);
      const validatedQuizTypes = sanitizeQuizTypes(action.payload.quizTypes);

      // Log validation failures
      if (validatedNumQuestions !== action.payload.numQuestions) {
        logger.warn('APPLY_SMART_DEFAULTS: Invalid numQuestions, using sanitized value', {
          original: action.payload.numQuestions,
          sanitized: validatedNumQuestions,
        });
      }
      if (validatedDifficulty !== action.payload.difficulty) {
        logger.warn('APPLY_SMART_DEFAULTS: Invalid difficulty, using sanitized value', {
          original: action.payload.difficulty,
          sanitized: validatedDifficulty,
        });
      }
      if (JSON.stringify(validatedQuizTypes) !== JSON.stringify(action.payload.quizTypes)) {
        logger.warn('APPLY_SMART_DEFAULTS: Invalid quizTypes, using sanitized value', {
          original: action.payload.quizTypes,
          sanitized: validatedQuizTypes,
        });
      }

      return {
        ...state,
        quizConfig: {
          ...state.quizConfig,
          difficulty: validatedDifficulty,
          numQuestions: validatedNumQuestions,
          types: validatedQuizTypes,
          selectedSubject: action.payload.subject || state.quizConfig.selectedSubject,
        },
      };

    // ============================================================
    // Reset Actions
    // ============================================================
    case 'RESET_QUIZ_CONFIG':
      return {
        ...state,
        quizConfig: initialUploadState.quizConfig,
      };

    case 'RESET_AFTER_UPLOAD':
      return {
        ...state,
        files: [],
        showQuickQuiz: false,
        uiState: {
          ...state.uiState,
          uploading: false,
          isTransitioning: false,
        },
      };

    case 'RESET_STATE':
      return initialUploadState;

    default:
      return state;
  }
}
