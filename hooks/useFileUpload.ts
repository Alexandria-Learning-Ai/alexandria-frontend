import { useState, useCallback } from 'react';
import { Alert, Linking, Vibration } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import logger from '../utils/logger';
import { validateFile, formatFileSize } from '../utils/fileValidation';

// File size limit: 50MB (matching backend MAX_FILE_SIZE)
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 52428800 bytes
const MAX_FILE_SIZE_MB = 50;

interface File {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

interface UseFileUploadReturn {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  pickFromGallery: () => Promise<void>;
  pickDocument: () => Promise<void>;
  handleSelectFiles: () => void;
  removeFile: (fileName: string) => void;
  getFileIcon: (fileName: string) => string;
}

/**
 * Validates file using centralized validation utility
 * @param file - File to validate
 * @returns true if valid, false otherwise
 */
const validateFileForUpload = (file: { name: string; size?: number; mimeType?: string }): boolean => {
  // Use centralized validation utility
  const result = validateFile(file, {
    maxSizeMB: MAX_FILE_SIZE_MB,
  });

  if (!result.valid) {
    // Show user-friendly error
    Alert.alert(
      result.errorType === 'size' ? 'File Too Large' :
      result.errorType === 'type' ? 'Unsupported File' :
      result.errorType === 'empty' ? 'Empty File' :
      'Invalid File',
      result.error || 'Please select a valid file.',
      [{ text: 'OK', style: 'default' }]
    );
    logger.warn(`File rejected: ${file.name}`, { error: result.error, errorType: result.errorType });
    return false;
  }

  return true;
};

/**
 * Checks if a file is a duplicate based on multiple criteria
 * @param newFile - File to check
 * @param existingFiles - Array of already selected files
 * @returns true if duplicate, false otherwise
 */
const isDuplicate = (newFile: File, existingFiles: File[]): boolean => {
  for (const existing of existingFiles) {
    // Check by URI (primary check)
    if (existing.uri === newFile.uri) {
      return true;
    }

    // Check by name and size (content-based duplicate detection)
    // Files with same name and size are very likely to be the same file
    if (existing.name === newFile.name &&
        existing.size &&
        newFile.size &&
        existing.size === newFile.size) {
      logger.info(`Duplicate file detected: ${newFile.name} (${newFile.size} bytes)`);
      return true;
    }
  }

  return false;
};

/**
 * useFileUpload - Custom hook for file selection and management
 *
 * Features:
 * - Gallery image picker with permissions
 * - Document picker (PDF, images, text)
 * - File removal
 * - Duplicate detection
 * - File size validation (50MB limit)
 * - File icon detection
 * - Vibration feedback
 */
export const useFileUpload = (t: (key: string) => string, onFilesAdded?: (files: File[]) => void): UseFileUploadReturn => {
  const [files, setFiles] = useState<File[]>([]);

  const pickFromGallery = useCallback(async () => {
    logger.info('📷 pickFromGallery started');
    try {
      logger.info('🔐 Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      logger.info('✅ Permission status:', status);
      if (status !== 'granted') {
        Alert.alert(
          t('upload.accessToArchives'),
          t('upload.alexandriaNeedsAccess'),
          [
            { text: 'Not Now', style: 'cancel' },
            { text: t('upload.grantAccess'), onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (result.canceled) return;

      const mappedFiles = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || `wisdom_scroll_${Date.now()}.${asset.uri.split('.').pop()}`,
        mimeType: asset.type ? `image/${asset.type}` : 'image/jpeg',
        size: asset.fileSize,
      }));

      // Filter out duplicates using improved detection
      const uniqueFiles = mappedFiles.filter(newFile => !isDuplicate(newFile, files));
      const duplicateCount = mappedFiles.length - uniqueFiles.length;

      // Validate files before adding
      const validFiles = uniqueFiles.filter(file => validateFileForUpload(file));
      const rejectedCount = uniqueFiles.length - validFiles.length;

      if (validFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...validFiles]);
        Vibration.vibrate(50);
        
        // Notify parent component about new files
        if (onFilesAdded) {
          onFilesAdded(validFiles);
        }
      }

      // Inform user about duplicates and rejections
      if (duplicateCount > 0) {
        logger.info(`${duplicateCount} duplicate file(s) skipped`);
      }

      if (rejectedCount > 0) {
        logger.warn(`${rejectedCount} file(s) rejected due to size constraints`);
      }

    } catch (err: any) {
      // ✅ FIX Bug #6: Enhanced error handling with specific error types
      logger.error("Error accessing sacred archives: ", err);

      // Handle specific error types
      if (err.code === 'E_PERMISSION_MISSING' || err.code === 'E_NO_PERMISSIONS') {
        Alert.alert(
          'Permission Required',
          'Alexandria needs permission to access your photos. Please grant access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else if (err.code === 'E_PICKER_CANCELLED') {
        // User cancelled - no need to show error
        logger.info('User cancelled image picker');
      } else if (err.message?.includes('Network') || err.message?.includes('network')) {
        Alert.alert('Network Error', 'Unable to access photos. Please check your connection and try again.');
      } else {
        // Generic error fallback
        Alert.alert(t('upload.archiveError'), t('upload.couldNotAccessArchives'));
      }
    }
  }, [files, t, onFilesAdded]);

  const pickDocument = useCallback(async () => {
    logger.info('📄 pickDocument started');
    try {
      logger.info('📂 Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      logger.info('📝 Document picker result:', { canceled: result.canceled, assetsCount: result.assets?.length });
      if (result.canceled) {
        logger.info('❌ User cancelled document picker');
        return;
      }

      // Filter out duplicates using improved detection
      const uniqueFiles = result.assets.filter(newFile => !isDuplicate(newFile, files));
      const duplicateCount = result.assets.length - uniqueFiles.length;

      // Validate files before adding
      const validFiles = uniqueFiles.filter(file => validateFileForUpload(file));
      const rejectedCount = uniqueFiles.length - validFiles.length;

      if (validFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...validFiles]);
        
        // Notify parent component about new files
        if (onFilesAdded) {
          onFilesAdded(validFiles);
        }
        Vibration.vibrate(50);
      }

      // Inform user about duplicates and rejections
      if (duplicateCount > 0) {
        logger.info(`${duplicateCount} duplicate file(s) skipped`);
      }

      if (rejectedCount > 0) {
        logger.warn(`${rejectedCount} file(s) rejected due to size constraints`);
      }
    } catch (err: any) {
      // ✅ FIX Bug #6: Enhanced error handling with specific error types
      logger.error("Error accessing document archives: ", err);

      // Handle specific DocumentPicker error types
      if (err.code === 'DOCUMENT_PICKER_CANCELED' || err.code === 'E_DOCUMENT_PICKER_CANCELED') {
        // User cancelled - no need to show error
        logger.info('User cancelled document picker');
      } else if (err.code === 'E_PERMISSION_MISSING' || err.code === 'E_NO_PERMISSIONS') {
        Alert.alert(
          'Permission Required',
          'Alexandria needs permission to access your files. Please grant access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else if (err.message?.includes('not supported') || err.message?.includes('type')) {
        Alert.alert(
          'Unsupported File Type',
          'This file type is not supported. Please select PDF, image, or text files.'
        );
      } else if (err.message?.includes('Network') || err.message?.includes('network')) {
        Alert.alert('Network Error', 'Unable to access documents. Please check your connection and try again.');
      } else {
        // Generic error fallback
        Alert.alert(t('upload.documentError'), t('upload.couldNotAccessDocuments'));
      }
    }
  }, [files, t, onFilesAdded]);

  const handleSelectFiles = useCallback(() => {
    logger.info('📂 handleSelectFiles called - showing file picker dialog');
    try {
      Alert.alert(
        "🏛️ Select Study Materials",
        "From which archives would you like to gather wisdom?",
        [
          {
            text: "Upload Image",
            onPress: () => {
              logger.info('📷 User selected: Upload Image');
              pickFromGallery();
            },
          },
          {
            text: "Upload Document",
            onPress: () => {
              logger.info('📄 User selected: Upload Document');
              pickDocument();
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => logger.info('❌ User cancelled file selection'),
          },
        ]
      );
    } catch (error) {
      logger.error('❌ Error showing file picker alert:', error);
    }
  }, [pickFromGallery, pickDocument]);

  const removeFile = useCallback((fileName: string) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(file => file.name !== fileName);
      Vibration.vibrate(30);
      return updatedFiles;
    });
  }, []);

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'txt':
        return 'file-alt';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'file-image';
      default:
        return 'file';
    }
  };

  return {
    files,
    setFiles,
    pickFromGallery,
    pickDocument,
    handleSelectFiles,
    removeFile,
    getFileIcon,
  };
};
