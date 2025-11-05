/**
 * useQuizGeneration Hook (REFACTORED VERSION)
 *
 * Handles quiz generation and study material uploads with improved structure:
 * - Extracted validation logic to uploadValidation.ts
 * - Extracted navigation logic to uploadNavigation.ts
 * - Extracted error handling to uploadErrorHandling.ts
 * - Reduced main function from 350+ lines to ~150 lines
 * - Improved testability and maintainability
 *
 * Usage:
 * ```typescript
 * const { handleQuizGeneration } = useQuizGeneration();
 *
 * const result = await handleQuizGeneration({
 *   files,
 *   uploadPurpose,
 *   quizTypes,
 *   numQuestions,
 *   difficulty,
 *   // ... other params
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import logger from '../utils/logger';
import {
  QuizGenerationParams,
  QuizGenerationResult,
  StudyMaterial,
  UseQuizGenerationReturn,
} from '../types/upload.types';
import { validateUploadRequest } from './utils/uploadValidation';
import {
  navigateToStudyMaterial,
  navigateToQuiz,
  executePostUploadCleanup,
} from './utils/uploadNavigation';
import { handleUploadError } from './utils/uploadErrorHandling';
import {
  FILE_UPLOAD,
  THRESHOLDS,
  ERROR_MESSAGES,
} from '../constants/uploadConstants';

/**
 * Create StudyMaterial object from API response
 *
 * @param responseData - API response data
 * @param file - Uploaded file
 * @param selectedSubject - Selected subject
 * @param selectedCourse - Selected course
 * @param getFileIcon - Function to get file icon
 * @returns StudyMaterial object
 */
const createStudyMaterial = (
  responseData: any,
  file: any,
  selectedSubject: any,
  selectedCourse: any,
  getFileIcon: (fileName: string) => string
): StudyMaterial => {
  const extractedText = responseData?.extracted_text || '';

  return {
    id: responseData?.material_id || `material_${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ''),
    fileName: file.name,
    extractedText,
    extractionQuality: responseData?.extraction_quality || 85,
    characterCount: extractedText?.length || 0,
    subject: selectedSubject?.name || 'General',
    course: selectedCourse?.name || '',
    uploadDate: new Date().toISOString(),
    hasAudio: false,
    hasSummary: false,
    type: getFileIcon(file.name),
  };
};

/**
 * Check if text extraction was successful
 *
 * @param extractedText - Extracted text from document
 * @returns true if extraction is valid, false otherwise
 */
const isValidExtraction = (extractedText: string): boolean => {
  return extractedText && extractedText.length >= THRESHOLDS.TEXT_EXTRACTION_MIN_CHARS;
};

/**
 * Show extraction warning alert and offer retry
 *
 * @param studyMaterial - Study material with poor extraction
 * @param onRetry - Callback to retry upload
 * @returns Promise that resolves when user makes choice
 */
const showExtractionWarning = (
  studyMaterial: StudyMaterial,
  onRetry?: () => void
): Promise<void> => {
  return new Promise((resolve) => {
    const errorInfo = ERROR_MESSAGES.EXTRACTION_FAILED(studyMaterial.fileName);

    Alert.alert(
      errorInfo.title,
      errorInfo.message,
      [
        {
          text: 'Continue Anyway',
          onPress: () => {
            studyMaterial.extractedText = `Content from ${studyMaterial.fileName}\n\nText extraction was not successful for this file type. This could be due to:\n• ${errorInfo.suggestions.join('\n• ')}\n\nYou can still use this material, but text-based features like summaries and audio may not work properly.`;
            resolve();
          },
        },
        {
          text: 'Try Again',
          style: 'cancel',
          onPress: () => {
            onRetry?.();
            resolve();
          },
        },
      ]
    );
  });
};

/**
 * Upload file for study material processing
 *
 * @param file - File to upload
 * @param userId - User ID
 * @param selectedSubject - Selected subject
 * @param selectedCourse - Selected course
 * @returns Promise with API response
 */
const uploadStudyFile = async (
  file: any,
  userId: string,
  selectedSubject: any,
  selectedCourse: any
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as any);
  formData.append('user_id', userId);
  formData.append('subject', selectedSubject?.name || '');
  formData.append('course', selectedCourse?.name || '');

  logger.info('🔗 Study Mode - Uploading to:', API_ENDPOINTS.study.extractText);

  const response = await axios.post(API_ENDPOINTS.study.extractText, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-User-ID': userId,
    },
    timeout: FILE_UPLOAD.UPLOAD_TIMEOUT_MS,
  });

  logger.info('✅ Study material upload successful:', response.status);
  logger.info('📦 Response data:', response.data);

  return response;
};

/**
 * Upload file for quiz generation
 *
 * @param file - File to upload
 * @param userId - User ID
 * @param params - Quiz generation parameters
 * @returns Promise with API response
 */
const uploadQuizFile = async (
  file: any,
  userId: string,
  params: QuizGenerationParams
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as any);

  formData.append('quiz_types', JSON.stringify(params.quizTypes));
  formData.append('num_questions', params.numQuestions.toString());
  formData.append('difficulty', params.difficulty);
  formData.append('language', params.language || 'en');
  formData.append('upload_purpose', 'quiz');
  formData.append('visual_preference', params.visualEnhancement);

  if (userId) {
    formData.append('user_id', userId);
  }

  if (params.selectedSubject) {
    formData.append('subject_context', JSON.stringify({
      manual_subject: params.selectedSubject.name,
      subject_key: params.selectedSubject.key,
      subject_type: params.selectedSubject.type,
    }));
  }

  logger.info('🔗 Quiz Mode - Uploading to:', API_ENDPOINTS.quiz.generate);

  const response = await axios.post(API_ENDPOINTS.quiz.generate, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-User-ID': userId,
    },
    timeout: FILE_UPLOAD.UPLOAD_TIMEOUT_MS,
  });

  logger.info('✅ Quiz upload successful:', response.status);

  return response;
};

/**
 * useQuizGeneration Hook
 *
 * Main hook for handling quiz generation and study material uploads
 */
export const useQuizGeneration = (): UseQuizGenerationReturn => {
  const [responseText, setResponseText] = useState<string | null>(null);

  /**
   * Handle quiz generation or study material upload
   *
   * Orchestrates the entire upload flow:
   * 1. Validates request
   * 2. Uploads file to appropriate endpoint
   * 3. Processes response
   * 4. Navigates to appropriate screen
   * 5. Handles errors gracefully
   */
  const handleQuizGeneration = useCallback(
    async (params: QuizGenerationParams): Promise<QuizGenerationResult> => {
      const {
        files,
        uploadPurpose,
        quizTypes,
        selectedSubject,
        selectedCourse,
        selectedHierarchicalSubject,
        selectedHierarchicalCourse,
        courseSelectionMode,
        subjectValidation,
        getFileIcon,
        navigation,
        containerAnim,
        onFilesCleared,
        onSubjectCleared,
      } = params;

      // Step 1: Validate request
      if (!validateUploadRequest(files, uploadPurpose, quizTypes)) {
        return { success: false };
      }

      try {
        const user = auth.currentUser;
        const userId = user?.uid || 'anonymous';
        const firstFile = files[0];

        let response = null;
        let storedMaterialId: string | null = null;

        // Step 2: Upload file based on purpose
        if (uploadPurpose === 'study') {
          response = await uploadStudyFile(firstFile, userId, selectedSubject, selectedCourse);
          storedMaterialId = response.data?.material_id;
        } else {
          response = await uploadQuizFile(firstFile, userId, params);
        }

        // Step 3: Build result object
        const result: QuizGenerationResult = {
          success: true,
          data: response.data,
          uploadPurpose,
          storedMaterialId: storedMaterialId || undefined,
          firstFile,
        };

        // Check for anti-repetition indicator
        if (response.data?.metadata?.anti_repetition_applied) {
          result.showFreshnessIndicator = true;
        }

        // Step 4: Handle navigation based on upload purpose
        if (uploadPurpose === 'study') {
          const studyMaterial = createStudyMaterial(
            response.data,
            firstFile,
            selectedSubject,
            selectedCourse,
            getFileIcon
          );

          // Check text extraction quality
          if (!isValidExtraction(studyMaterial.extractedText)) {
            await showExtractionWarning(studyMaterial, onFilesCleared);
          }

          // Navigate to MaterialViewer
          navigateToStudyMaterial(navigation, studyMaterial, containerAnim, () => {
            executePostUploadCleanup(onFilesCleared, onSubjectCleared);
          });

          result.studyMaterial = studyMaterial;
        } else if (uploadPurpose === 'quiz' && response.data?.quiz) {
          // Build quiz metadata
          const metadata = {
            title: 'Alexandria Trial of Wisdom',
            category: selectedCourse?.name || selectedSubject?.name || 'Document Study',
            course: selectedCourse?.name,
            subject: selectedHierarchicalSubject || selectedCourse?.subject || selectedSubject?.name,
            topic: selectedHierarchicalCourse || selectedCourse?.name,
            manualSubject: selectedSubject,
            subjectKey: selectedSubject?.key,
            subjectType: selectedSubject?.type,
            subjectValidation,
            fileName: firstFile.name,
            hierarchical: {
              enabled: courseSelectionMode === 'hierarchical',
              subject: selectedHierarchicalSubject,
              course: selectedHierarchicalCourse,
              source: selectedCourse?.source || 'profile',
            },
            ...response.data.metadata,
          };

          // Navigate to QuizScreen
          navigateToQuiz(navigation, response.data.quiz, metadata, containerAnim, () => {
            executePostUploadCleanup(onFilesCleared, onSubjectCleared);
          });
        } else if (response.data?.detail) {
          // Handle API response with detail message
          Alert.alert('🏛️ Processing Error', response.data.detail);
          setResponseText(`Oracle speaks: ${response.data.detail}`);
        } else {
          // Generic success
          const successMessage = response.data?.message || 'Your material has been processed successfully!';
          Alert.alert('🏛️ Success', successMessage);
          setResponseText(successMessage);

          // Cleanup
          executePostUploadCleanup(onFilesCleared, onSubjectCleared);
        }

        return result;
      } catch (error: unknown) {
        // Step 5: Handle errors
        return handleUploadError(
          error,
          uploadPurpose,
          files,
          selectedSubject,
          selectedCourse,
          getFileIcon,
          navigation,
          containerAnim,
          onFilesCleared,
          onSubjectCleared
        );
      }
    },
    []
  );

  return {
    responseText,
    setResponseText,
    handleQuizGeneration,
  };
};
