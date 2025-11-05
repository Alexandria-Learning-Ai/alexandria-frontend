/**
 * Upload Validation Utilities
 *
 * Extracted validation functions for upload request validation.
 * Handles file selection, quiz settings, and upload configuration validation.
 */

import { Alert } from 'react-native';
import { UploadFile, QuizType, UploadPurpose } from '../../types/upload.types';
import { ERROR_MESSAGES } from '../../constants/uploadConstants';

/**
 * Validates that files have been selected
 *
 * @param files - Array of files to validate
 * @returns true if files are selected, false otherwise (shows alert)
 */
export const validateFilesSelected = (files: UploadFile[]): boolean => {
  if (files.length === 0) {
    Alert.alert(
      ERROR_MESSAGES.NO_FILES.title,
      ERROR_MESSAGES.NO_FILES.message
    );
    return false;
  }
  return true;
};

/**
 * Validates quiz settings when upload purpose is quiz generation
 *
 * @param uploadPurpose - Current upload purpose
 * @param quizTypes - Selected quiz types
 * @returns true if valid, false otherwise (shows alert)
 */
export const validateQuizSettings = (
  uploadPurpose: UploadPurpose,
  quizTypes: QuizType[]
): boolean => {
  // Only validate quiz settings if user chose quiz generation
  if (uploadPurpose === 'quiz' && quizTypes.length === 0) {
    Alert.alert(
      ERROR_MESSAGES.NO_QUIZ_TYPE.title,
      ERROR_MESSAGES.NO_QUIZ_TYPE.message
    );
    return false;
  }
  return true;
};

/**
 * Validates upload request before processing
 *
 * @param files - Files to upload
 * @param uploadPurpose - Upload purpose (study or quiz)
 * @param quizTypes - Selected quiz types
 * @returns true if all validations pass, false otherwise
 */
export const validateUploadRequest = (
  files: UploadFile[],
  uploadPurpose: UploadPurpose,
  quizTypes: QuizType[]
): boolean => {
  if (!validateFilesSelected(files)) {
    return false;
  }

  if (!validateQuizSettings(uploadPurpose, quizTypes)) {
    return false;
  }

  return true;
};
