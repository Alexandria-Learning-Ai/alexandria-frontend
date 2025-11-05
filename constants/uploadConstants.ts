/**
 * Upload Screen Configuration Constants
 *
 * Centralized configuration for timeouts, limits, animations, and UI behavior
 * used throughout the UploadScreen ecosystem.
 *
 * Organization:
 * - FILE_UPLOAD: File size limits and upload configuration
 * - QUIZ_DEFAULTS: Default values for quiz generation
 * - ANIMATIONS: Animation durations and timings
 * - HAPTICS: Vibration feedback patterns
 * - THRESHOLDS: Quality and validation thresholds
 * - HTTP: Network timeout configurations
 * - ERROR_MESSAGES: Standardized error message templates
 */

/**
 * File Upload Configuration
 * Settings for file size limits, supported types, and upload timeouts
 */
export const FILE_UPLOAD = {
  /** Maximum file size in bytes (50 MB) */
  MAX_SIZE_BYTES: 50 * 1024 * 1024,

  /** Maximum file size in megabytes (for display) */
  MAX_SIZE_MB: 50,

  /** Upload timeout for large files (10 minutes) */
  UPLOAD_TIMEOUT_MS: 600000,

  /** Supported file types for upload */
  SUPPORTED_TYPES: {
    documents: ['application/pdf', 'text/plain'],
    images: ['image/*'],
  },

  /** File picker options */
  PICKER: {
    IMAGE_QUALITY: 1,  // Maximum quality for image selection
    ALLOW_MULTIPLE: true,
    COPY_TO_CACHE: true,
  },
} as const;

/**
 * Quiz Configuration Defaults
 * Default values and limits for quiz generation
 */
export const QUIZ_DEFAULTS = {
  /** Default number of questions */
  NUM_QUESTIONS: 10,

  /** Minimum allowed questions */
  MIN_QUESTIONS: 5,

  /** Maximum allowed questions */
  MAX_QUESTIONS: 20,

  /** Recommended minimum for optimal learning */
  RECOMMENDED_MIN: 10,

  /** Recommended maximum for optimal learning */
  RECOMMENDED_MAX: 15,

  /** Default difficulty level */
  DIFFICULTY: 'medium' as const,

  /** Default quiz types (all types) */
  QUIZ_TYPES: ['all'] as const,

  /** Default visual enhancement setting */
  VISUAL_ENHANCEMENT: 'auto' as const,
} as const;

/**
 * Animation Timings
 * All animation durations in milliseconds for consistent UX
 */
export const ANIMATIONS = {
  // Navigation and Screen Transitions
  /** Standard screen transition duration */
  SCREEN_TRANSITION: 300,

  /** Container fade-in on mount */
  CONTAINER_FADE_IN: 200,

  // User Feedback Indicators
  /** Duration to show freshness indicator */
  FRESHNESS_INDICATOR_DURATION: 3000,

  /** Delay before showing success alert (to avoid wrong screen) */
  SUCCESS_ALERT_DELAY: 300,

  // Upload Progress Animations
  /** Duration of upload progress loop animation */
  PROGRESS_LOOP_DURATION: 3000,

  /** Spring animation tension for smooth entrance */
  SPRING_TENSION: 80,

  /** Spring animation friction for smooth entrance */
  SPRING_FRICTION: 10,

  // Component Animations
  /** Quick button press feedback */
  BUTTON_PRESS: 100,

  /** Toggle switch animation */
  TOGGLE_SWITCH: 150,

  /** Header bounce animation */
  HEADER_BOUNCE: 600,

  /** Slow pulse animation (icons) */
  PULSE_SLOW: 2000,

  /** Medium pulse animation (buttons) */
  PULSE_MEDIUM: 1500,

  // Upload Delay Animation
  /** Delay before starting file upload animations */
  UPLOAD_DELAY: 600,
} as const;

/**
 * Haptic Feedback Patterns
 * Vibration patterns for different user interactions
 */
export const HAPTICS = {
  /** Short confirmation for file selection */
  FILE_SELECTED: 50,

  /** Subtle feedback for file removal */
  FILE_REMOVED: 30,

  /** Success pattern: buzz-pause-long buzz */
  SUCCESS: [100, 50, 200],

  /** Subject selection feedback */
  SUBJECT_SELECTED: 50,

  /** Subject cleared feedback */
  SUBJECT_CLEARED: 30,
} as const;

/**
 * Quality and Validation Thresholds
 * Values for determining quality, warnings, and validation
 */
export const THRESHOLDS = {
  /** Minimum characters for valid text extraction */
  TEXT_EXTRACTION_MIN_CHARS: 10,

  /** Show warning if extraction quality is below this */
  EXTRACTION_QUALITY_WARNING: 50,

  /** Default/target extraction quality percentage */
  EXTRACTION_QUALITY_GOOD: 85,

  /** Characters to show in text preview modal */
  TEXT_PREVIEW_CHARS: 500,

  /** Maximum length for exam description input */
  DETAILS_INPUT_MAX_LENGTH: 400,

  /** Maximum number of lines for multiline input */
  DETAILS_INPUT_LINES: 3,
} as const;

/**
 * HTTP Configuration
 * Network timeouts and retry settings
 */
export const HTTP = {
  /** Default HTTP timeout (30 seconds) */
  TIMEOUT_DEFAULT: 30000,

  /** Timeout for file uploads (10 minutes for large files) */
  TIMEOUT_UPLOAD: 600000,

  /** Timeout for AI quiz generation (2 minutes) */
  TIMEOUT_AI_GENERATION: 120000,

  /** Retry attempts for failed requests */
  RETRY_ATTEMPTS: 3,

  /** Delay between retry attempts (milliseconds) */
  RETRY_DELAY: 1000,
} as const;

/**
 * UI Layout Constants
 * Spacing, sizing, and layout values
 */
export const UI_LAYOUT = {
  /** Slider configuration */
  SLIDER: {
    MIN_VALUE: 5,
    MAX_VALUE: 20,
    STEP: 1,
  },

  /** Border radius values */
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 16,
    EXTRA_LARGE: 20,
  },

  /** Standard spacing values */
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 24,
  },
} as const;

/**
 * Error Message Templates
 * Standardized error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  /** No files selected */
  NO_FILES: {
    title: 'No Sacred Texts Found',
    message: 'Please select study materials from the archives to begin your journey.',
  },

  /** No quiz type selected */
  NO_QUIZ_TYPE: {
    title: 'Select Quiz Type',
    message: 'Please select at least one quiz type.',
  },

  /** File too large error */
  FILE_TOO_LARGE: (sizeMB: number, maxMB: number = FILE_UPLOAD.MAX_SIZE_MB) => ({
    title: 'File Too Large',
    message: `File is ${sizeMB}MB, which exceeds the ${maxMB}MB limit.\n\nPlease select a smaller file or compress it before uploading.`,
  }),

  /** Network error */
  NETWORK_ERROR: {
    title: 'Network Error',
    message: 'Could not connect to the server. Please check your internet connection and try again.',
  },

  /** Timeout error */
  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The request took too long. The file might be too large or the server is slow to respond.',
  },

  /** Unsupported file type */
  UNSUPPORTED_FILE_TYPE: {
    title: 'Unsupported File Type',
    message: 'This file type is not supported. Please select a PDF, image, or text file.',
  },

  /** Text extraction failed */
  EXTRACTION_FAILED: (fileName: string) => ({
    title: 'Text Extraction Issue',
    message: `We had trouble extracting readable text from "${fileName}". You can still view it, but some study features may be limited.`,
    suggestions: [
      'Image-based PDF without OCR',
      'Unsupported file format',
      'File corruption',
    ],
  }),

  /** AI service unavailable */
  AI_SERVICE_UNAVAILABLE: {
    title: 'AI Service Temporarily Unavailable',
    message: 'The AI processing service is currently having issues, but we can still add your material to the study library with basic functionality.',
  },
} as const;

/**
 * Success Message Templates
 * Standardized success messages
 */
export const SUCCESS_MESSAGES = {
  /** Study material uploaded successfully */
  STUDY_MATERIAL_ADDED: (title: string) => ({
    title: 'Study Material Added!',
    message: `"${title}" has been added to your study library. You can now read, listen, or use deep study modes!`,
  }),

  /** Quiz generated successfully */
  QUIZ_GENERATED: {
    title: 'Quiz Generated!',
    message: 'Your practice quiz is ready. Test your knowledge!',
  },

  /** Material processing complete */
  PROCESSING_COMPLETE: {
    title: 'Success',
    message: 'Your material has been processed successfully!',
  },
} as const;

/**
 * Upload Purpose Options
 * Available upload modes
 */
export const UPLOAD_PURPOSE = {
  STUDY: 'study' as const,
  QUIZ: 'quiz' as const,
} as const;

/**
 * Visual Enhancement Modes
 * Options for visual element generation
 */
export const VISUAL_ENHANCEMENT_MODES = {
  AUTO: 'auto' as const,
  ENABLED: 'enabled' as const,
  DISABLED: 'disabled' as const,
} as const;

/**
 * Visual subjects that benefit from enhanced visuals
 * Subjects where visual elements are more frequently useful
 */
export const VISUAL_SUBJECTS = [
  'Database Science',
  'Mathematics',
  'Statistics',
  'Physics',
  'Calculus',
  'Chemistry',
  'Biology',
  'Geometry',
  'Computer Science',
] as const;

/**
 * Helper function to check if a subject benefits from visual enhancements
 *
 * @param subjectName - Name of the subject to check
 * @returns true if subject is visual-heavy, false otherwise
 */
export const isVisualSubject = (subjectName: string): boolean => {
  return VISUAL_SUBJECTS.some(subject =>
    subjectName.toLowerCase().includes(subject.toLowerCase())
  );
};

/**
 * Get recommended visual enhancement description based on subject
 *
 * @param selectedSubject - Currently selected subject (optional)
 * @returns Description string for visual enhancement feature
 */
export const getVisualEnhancementDescription = (selectedSubject?: { name: string } | null): string => {
  if (!selectedSubject) {
    return 'Automatically adds visual elements based on subject and content';
  }

  if (isVisualSubject(selectedSubject.name)) {
    return `Great for ${selectedSubject.name} - adds visual elements to ~60% of relevant questions`;
  }

  return 'Adds visual elements when helpful for understanding concepts (~15% of questions)';
};

/**
 * Type exports for TypeScript support
 */
export type UploadPurpose = typeof UPLOAD_PURPOSE[keyof typeof UPLOAD_PURPOSE];
export type VisualEnhancementMode = typeof VISUAL_ENHANCEMENT_MODES[keyof typeof VISUAL_ENHANCEMENT_MODES];
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
export type QuizType = 'all' | 'multiple_choice' | 'open_ended' | 'true_false';
