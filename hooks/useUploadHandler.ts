import { useState } from 'react';
import { Alert, Vibration } from 'react-native';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';

interface File {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

interface Subject {
  name: string;
  key: string;
  type: string;
}

interface Course {
  name: string;
}

interface UploadOptions {
  uploadPurpose: 'study' | 'quiz';
  quizTypes: string[];
  numQuestions: number;
  difficulty: string;
  language: string;
  visualEnhancement: string;
  selectedSubject?: Subject | null;
  selectedCourse?: Course | null;
}

interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
  materialId?: string;
}

interface UseUploadHandlerReturn {
  isUploading: boolean;
  responseText: string | null;
  setResponseText: (text: string | null) => void;
  showFreshnessIndicator: boolean;
  uploadFile: (file: File, options: UploadOptions) => Promise<UploadResult>;
  resetUploadState: () => void;
}

/**
 * useUploadHandler - Custom hook for file upload and processing
 *
 * Features:
 * - Handles both study and quiz uploads
 * - Manages upload state (loading, progress, errors)
 * - FormData construction for different upload types
 * - Response handling and error management
 * - Material ID extraction for study uploads
 */
export const useUploadHandler = (): UseUploadHandlerReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [showFreshnessIndicator, setShowFreshnessIndicator] = useState(false);

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setResponseText(null);

    try {
      const user = auth.currentUser;
      let res = null;
      let materialId = null;

      if (options.uploadPurpose === 'study') {
        // Study Mode: Use dedicated study materials endpoint
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as any);
        formData.append('user_id', user?.uid || 'anonymous');
        formData.append('subject', options.selectedSubject?.name || '');
        formData.append('course', options.selectedCourse?.name || '');

        logger.info('🔗 Study Mode - Uploading to:', `${API_BASE_URL}/study/extract-text`);

        res = await axios.post(`${API_BASE_URL}/study/extract-text`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-User-ID': user?.uid || 'anonymous',
          },
          timeout: 600000,
        });

        logger.info('✅ Study material upload successful:', res.status);
        logger.info('📦 Response data:', res.data);

        materialId = res.data?.material_id;

      } else {
        // Quiz Mode: Use quiz generation endpoint
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as any);

        formData.append('quiz_types', JSON.stringify(options.quizTypes));
        formData.append('num_questions', options.numQuestions.toString());
        formData.append('difficulty', options.difficulty);
        formData.append('language', options.language);
        formData.append('upload_purpose', 'quiz');
        formData.append('visual_preference', options.visualEnhancement);

        if (user) {
          formData.append('user_id', user.uid);
        }

        if (options.selectedSubject) {
          formData.append('subject_context', JSON.stringify({
            manual_subject: options.selectedSubject.name,
            subject_key: options.selectedSubject.key,
            subject_type: options.selectedSubject.type
          }));
        }

        logger.info('🔗 Quiz Mode - Uploading to:', `${API_BASE_URL}/upload`);

        res = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-User-ID': user?.uid || 'anonymous',
          },
          timeout: 600000,
        });

        logger.info('✅ Quiz upload successful:', res.status);
      }

      // Handle anti-repetition indicator
      if (res.data?.metadata?.anti_repetition_applied) {
        setShowFreshnessIndicator(true);
        setTimeout(() => {
          setShowFreshnessIndicator(false);
        }, 3000);
      }

      setIsUploading(false);
      return {
        success: true,
        data: res.data,
        materialId,
      };

    } catch (error: any) {
      setIsUploading(false);
      logger.error("Upload error: ", error.response ? error.response.data : error.message);

      const errorDetail = error.response?.data?.detail || error.message || "Unknown error occurred";
      setResponseText(`Error: ${errorDetail}`);

      return {
        success: false,
        error: errorDetail,
      };
    }
  };

  const resetUploadState = () => {
    setIsUploading(false);
    setResponseText(null);
    setShowFreshnessIndicator(false);
  };

  return {
    isUploading,
    responseText,
    setResponseText,
    showFreshnessIndicator,
    uploadFile,
    resetUploadState,
  };
};
