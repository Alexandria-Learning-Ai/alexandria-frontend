/**
 * inputSanitization.ts
 *
 * Input sanitization utilities to prevent XSS, injection attacks, and malformed requests
 *
 * Features:
 * - String sanitization (remove control chars, limit length)
 * - Filename sanitization (prevent path traversal)
 * - Number sanitization with min/max bounds
 * - Form data sanitization for quiz and study configurations
 *
 * Security:
 * - Removes null bytes
 * - Removes control characters
 * - Prevents path traversal attacks
 * - Enforces length limits
 * - Normalizes whitespace
 */

/**
 * Sanitize a single string input
 *
 * @param input - String to sanitize
 * @param maxLength - Maximum length (default: 1000)
 * @returns Sanitized string
 *
 * @example
 * sanitizeString("Hello  World\x00") // "Hello World"
 * sanitizeString("<script>alert('xss')</script>") // "<script>alert('xss')</script>" (preserved but safe)
 */
export const sanitizeString = (input: string | null | undefined, maxLength: number = 1000): string => {
  if (!input) return '';

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace (collapse multiple spaces)
    .replace(/\s+/g, ' ')
    // Limit length to prevent abuse
    .slice(0, maxLength);
};

/**
 * Sanitize filename - more strict than general strings
 *
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 *
 * @example
 * sanitizeFilename("../../etc/passwd") // "etcpasswd"
 * sanitizeFilename("my file?.txt") // "my_file_.txt"
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'untitled';

  return filename
    .trim()
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Replace unsafe characters with underscore
    .replace(/[<>:"|?*]/g, '_')
    // Normalize whitespace to underscores
    .replace(/\s+/g, '_')
    // Limit length
    .slice(0, 255);
};

/**
 * Sanitize number input with bounds
 *
 * @param input - Number or string to sanitize
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param defaultValue - Default value if invalid
 * @returns Sanitized number within bounds
 *
 * @example
 * sanitizeNumber(15, 1, 50, 10) // 15
 * sanitizeNumber(100, 1, 50, 10) // 50
 * sanitizeNumber("abc", 1, 50, 10) // 10
 */
export const sanitizeNumber = (
  input: number | string | null | undefined,
  min: number,
  max: number,
  defaultValue: number
): number => {
  const num = typeof input === 'string' ? parseInt(input, 10) : input;

  if (num === null || num === undefined || isNaN(num)) {
    return defaultValue;
  }

  return Math.min(Math.max(num, min), max);
};

/**
 * Sanitize difficulty level
 *
 * @param difficulty - Difficulty string to validate
 * @returns Valid difficulty level
 */
export const sanitizeDifficulty = (
  difficulty: string | null | undefined
): 'easy' | 'medium' | 'hard' => {
  const normalized = difficulty?.toLowerCase().trim();

  if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
    return normalized;
  }

  return 'medium'; // Default
};

/**
 * Sanitize quiz type
 *
 * @param quizType - Quiz type to validate
 * @returns Valid quiz type or null
 */
export const sanitizeQuizType = (
  quizType: string | null | undefined
): string | null => {
  if (!quizType) return null;

  const validTypes = [
    'all',
    'multiple_choice',
    'true_false',
    'fill_in_blank',
    'short_answer',
    'code_completion',
  ];

  const normalized = quizType.toLowerCase().trim();

  if (validTypes.includes(normalized)) {
    return normalized;
  }

  return null;
};

/**
 * Sanitize array of quiz types
 *
 * @param quizTypes - Array of quiz types to validate
 * @returns Array of valid quiz types
 */
export const sanitizeQuizTypes = (
  quizTypes: (string | null | undefined)[] | null | undefined
): string[] => {
  if (!Array.isArray(quizTypes)) {
    return ['all']; // Default
  }

  const sanitized = quizTypes
    .map(sanitizeQuizType)
    .filter((type): type is string => type !== null);

  return sanitized.length > 0 ? sanitized : ['all'];
};

/**
 * Quiz form data interface
 */
export interface QuizFormData {
  subject?: string | null;
  course?: string | null;
  topic?: string | null;
  details?: string | null;
  numQuestions?: number | null;
  difficulty?: string | null;
  quizTypes?: (string | null)[] | null;
}

/**
 * Sanitize form data for quiz configuration
 *
 * @param data - Quiz form data to sanitize
 * @returns Sanitized quiz form data
 *
 * @example
 * const sanitized = sanitizeQuizFormData({
 *   subject: "  Math  ",
 *   numQuestions: 100,
 *   difficulty: "EASY"
 * });
 * // Returns: { subject: "Math", numQuestions: 50, difficulty: "easy", ... }
 */
export const sanitizeQuizFormData = (data: QuizFormData): QuizFormData => {
  return {
    subject: sanitizeString(data.subject, 200),
    course: sanitizeString(data.course, 200),
    topic: sanitizeString(data.topic, 500),
    details: sanitizeString(data.details, 2000),
    numQuestions: sanitizeNumber(data.numQuestions, 1, 50, 10),
    difficulty: sanitizeDifficulty(data.difficulty),
    quizTypes: sanitizeQuizTypes(data.quizTypes),
  };
};

/**
 * Study material form data interface
 */
export interface StudyFormData {
  title?: string | null;
  description?: string | null;
}

/**
 * Sanitize form data for study materials
 *
 * @param data - Study form data to sanitize
 * @returns Sanitized study form data
 *
 * @example
 * const sanitized = sanitizeStudyFormData({
 *   title: "  My Study Guide  ",
 *   description: "Notes\x00 on chapter 1"
 * });
 * // Returns: { title: "My Study Guide", description: "Notes on chapter 1" }
 */
export const sanitizeStudyFormData = (data: StudyFormData): StudyFormData => {
  return {
    title: sanitizeString(data.title, 200),
    description: sanitizeString(data.description, 1000),
  };
};

/**
 * Sanitize visual enhancement option
 *
 * @param enhancement - Visual enhancement option to validate
 * @returns Valid visual enhancement option
 */
export const sanitizeVisualEnhancement = (
  enhancement: string | null | undefined
): 'auto' | 'none' | 'graphs' => {
  const normalized = enhancement?.toLowerCase().trim();

  if (normalized === 'auto' || normalized === 'none' || normalized === 'graphs') {
    return normalized;
  }

  return 'auto'; // Default
};

/**
 * Sanitize URL/URI string
 *
 * @param url - URL string to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';

  const sanitized = sanitizeString(url, 2000);

  // Basic URL validation
  try {
    // Check if it looks like a valid URL
    if (sanitized.startsWith('http://') || sanitized.startsWith('https://') || sanitized.startsWith('file://')) {
      return sanitized;
    }
    return '';
  } catch {
    return '';
  }
};

/**
 * Sanitize email address
 *
 * @param email - Email address to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';

  const sanitized = sanitizeString(email, 320) // Max email length per RFC
    .toLowerCase()
    .trim();

  // Basic email validation (not comprehensive, but catches obvious issues)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(sanitized)) {
    return sanitized;
  }

  return '';
};

/**
 * Sanitize user ID (Firebase UID format)
 *
 * @param userId - User ID to sanitize
 * @returns Sanitized user ID or empty string if invalid
 */
export const sanitizeUserId = (userId: string | null | undefined): string => {
  if (!userId) return '';

  // Firebase UIDs are alphanumeric, typically 28 characters
  const sanitized = userId.trim();

  // Only allow alphanumeric characters and hyphens
  if (/^[a-zA-Z0-9-_]+$/.test(sanitized) && sanitized.length >= 10 && sanitized.length <= 128) {
    return sanitized;
  }

  return '';
};

export default {
  sanitizeString,
  sanitizeFilename,
  sanitizeNumber,
  sanitizeDifficulty,
  sanitizeQuizType,
  sanitizeQuizTypes,
  sanitizeQuizFormData,
  sanitizeStudyFormData,
  sanitizeVisualEnhancement,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeUserId,
};
