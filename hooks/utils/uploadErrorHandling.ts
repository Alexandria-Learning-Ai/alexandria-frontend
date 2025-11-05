/**
 * Upload Error Handling Utilities
 *
 * Extracted error handling functions for upload failures.
 * Categorizes errors, provides user-friendly messages, and handles fallback options.
 */

import { Alert, Animated, Vibration } from 'react-native';
import {
  ApiError,
  ErrorType,
  UploadFile,
  UploadPurpose,
  SelectedSubject,
  SelectedCourse,
  UploadScreenNavigationProp,
} from '../../types/upload.types';
import { ANIMATIONS, HAPTICS, ERROR_MESSAGES } from '../../constants/uploadConstants';
import logger from '../../utils/logger';

/**
 * Categorize error type based on error object
 *
 * @param error - Error object from axios or other source
 * @returns Error type category
 */
export const categorizeError = (error: ApiError): { type: ErrorType; detail: string } => {
  let errorDetail = 'Unknown error occurred';
  let errorType: ErrorType = 'unknown';

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    errorType = 'timeout';
    errorDetail = 'Request timed out. The file might be too large or the server is slow to respond.';
  } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    errorType = 'network';
    errorDetail = 'Network connection failed. Please check your internet connection.';
  } else if (error.response?.status === 413) {
    errorType = 'file_size';
    errorDetail = 'File is too large for the server to process.';
  } else if (error.response?.status === 415) {
    errorType = 'file_type';
    errorDetail = 'File type is not supported.';
  } else {
    errorDetail = error.response?.data?.detail || error.message || errorDetail;
  }

  return { type: errorType, detail: errorDetail };
};

/**
 * Get user-friendly error message with suggestions
 *
 * @param errorType - Categorized error type
 * @param errorDetail - Detailed error message
 * @param uploadPurpose - Upload purpose (study or quiz)
 * @returns Formatted error message with suggestions
 */
export const getErrorMessage = (
  errorType: ErrorType,
  errorDetail: string,
  uploadPurpose: UploadPurpose
): string => {
  let suggestions = '';

  switch (errorType) {
    case 'timeout':
      suggestions = '\n\nSuggestions:\n• Try a smaller file\n• Check your internet speed\n• Try again in a moment';
      break;
    case 'network':
      suggestions = '\n\nSuggestions:\n• Check your Wi-Fi or mobile data\n• Try again when connection is stable';
      break;
    case 'file_size':
      suggestions = '\n\nSuggestions:\n• Compress the file\n• Split into smaller documents';
      break;
    case 'file_type':
      suggestions = '\n\nSupported formats: PDF, images (JPG, PNG), text files';
      break;
  }

  const baseMessage = uploadPurpose === 'study'
    ? `Could not process study material: ${errorDetail}`
    : `The wisdom could not be forged: ${errorDetail}`;

  return `${baseMessage}${suggestions}`;
};

/**
 * Get error alert title based on upload purpose
 *
 * @param uploadPurpose - Upload purpose
 * @returns Alert title string
 */
export const getErrorTitle = (uploadPurpose: UploadPurpose): string => {
  return uploadPurpose === 'study' ? '📚 Study Upload Failed' : '🏛️ Quiz Creation Failed';
};

/**
 * Handle AI service fallback for study uploads
 *
 * Shows option to add material with basic functionality when AI service fails.
 *
 * @param file - File that failed to process
 * @param selectedSubject - Selected subject context
 * @param selectedCourse - Selected course context
 * @param getFileIcon - Function to get file icon
 * @param navigation - React Navigation object
 * @param containerAnim - Animation value
 * @param onFilesCleared - Callback to clear files
 * @param onSubjectCleared - Callback to clear subject
 */
export const handleAIServiceFallback = (
  file: UploadFile,
  selectedSubject: SelectedSubject | null,
  selectedCourse: SelectedCourse | null,
  getFileIcon: (fileName: string) => string,
  navigation: UploadScreenNavigationProp,
  containerAnim: Animated.Value,
  onFilesCleared?: () => void,
  onSubjectCleared?: () => void
): void => {
  Alert.alert(
    ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE.title,
    ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE.message,
    [
      {
        text: 'Add Anyway',
        onPress: () => {
          const basicStudyMaterial = {
            id: `material_${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            fileName: file.name,
            extractedText: `Material: ${file.name}\n\nThis document was added to your study library, but AI text extraction is temporarily unavailable. You can:\n\n• View the document title and details\n• Organize it by subject (${selectedSubject?.name || 'General'})\n• Try text extraction again later when the service is restored\n\nThe document is safely stored and ready for when full functionality returns.`,
            extractionQuality: 0,
            characterCount: 0,
            subject: selectedSubject?.name || 'General',
            course: selectedCourse?.name || '',
            uploadDate: new Date().toISOString(),
            hasAudio: false,
            hasSummary: false,
            type: getFileIcon(file.name),
            isBasicMode: true,
          };

          Animated.timing(containerAnim, {
            toValue: 0,
            duration: ANIMATIONS.SCREEN_TRANSITION,
            useNativeDriver: true,
          }).start(() => {
            navigation.navigate('MaterialViewer', {
              material: basicStudyMaterial,
              mode: 'read',
            });
          });

          onFilesCleared?.();
          onSubjectCleared?.();
          Vibration.vibrate(HAPTICS.SUCCESS);
        },
      },
      {
        text: 'Try Again',
        style: 'cancel',
      },
    ]
  );
};

/**
 * Handle upload error with appropriate user messaging
 *
 * @param error - Error object
 * @param uploadPurpose - Upload purpose
 * @param files - Files that were being uploaded
 * @param selectedSubject - Selected subject
 * @param selectedCourse - Selected course
 * @param getFileIcon - Function to get file icon
 * @param navigation - Navigation object
 * @param containerAnim - Animation value
 * @param onFilesCleared - Callback to clear files
 * @param onSubjectCleared - Callback to clear subject
 * @returns Error result object
 */
export const handleUploadError = (
  error: unknown,
  uploadPurpose: UploadPurpose,
  files: UploadFile[],
  selectedSubject: SelectedSubject | null,
  selectedCourse: SelectedCourse | null,
  getFileIcon: (fileName: string) => string,
  navigation: UploadScreenNavigationProp,
  containerAnim: Animated.Value,
  onFilesCleared?: () => void,
  onSubjectCleared?: () => void
): { success: false; error: string; errorType: ErrorType } => {
  const apiError = error as ApiError;
  logger.error('❌ Upload error:', apiError.response?.data ?? apiError.message);

  const { type: errorType, detail: errorDetail } = categorizeError(apiError);
  const firstFile = files && files.length > 0 ? files[0] : null;

  // Special handling for study uploads when AI service fails
  if (
    uploadPurpose === 'study' &&
    firstFile &&
    errorDetail.includes('AI response format error')
  ) {
    handleAIServiceFallback(
      firstFile,
      selectedSubject,
      selectedCourse,
      getFileIcon,
      navigation,
      containerAnim,
      onFilesCleared,
      onSubjectCleared
    );
  } else {
    // Show standard error message
    const errorMessage = getErrorMessage(errorType, errorDetail, uploadPurpose);
    const errorTitle = getErrorTitle(uploadPurpose);

    Alert.alert(errorTitle, errorMessage);
  }

  return { success: false, error: errorDetail, errorType };
};
