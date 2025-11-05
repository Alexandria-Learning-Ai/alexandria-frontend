/**
 * fileValidation.ts
 *
 * File validation utility for uploads
 * Validates file size, type, and content before processing
 *
 * Features:
 * - File size validation
 * - File type validation
 * - User-friendly error messages
 * - Configurable limits
 */

import logger from './logger';

/**
 * File validation configuration
 */
export interface FileValidationConfig {
  maxSizeMB?: number; // Default 50MB
  allowedExtensions?: string[]; // Default: ['.pdf', '.txt', '.png', '.jpg', '.jpeg']
  allowedMimeTypes?: string[]; // Optional MIME types
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  errorType?: 'size' | 'type' | 'empty' | 'corrupt';
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<FileValidationConfig> = {
  maxSizeMB: 50,
  allowedExtensions: ['.pdf', '.txt', '.png', '.jpg', '.jpeg', '.epub'],
  allowedMimeTypes: [
    'application/pdf',
    'text/plain',
    'image/png',
    'image/jpeg',
    'application/epub+zip',
  ],
};

/**
 * Validate file before upload
 *
 * @param file - File object to validate
 * @param config - Optional validation configuration
 * @returns Validation result
 */
export const validateFile = (
  file: any,
  config: FileValidationConfig = {}
): FileValidationResult => {
  const maxSizeMB = config.maxSizeMB || DEFAULT_CONFIG.maxSizeMB;
  const allowedExtensions = config.allowedExtensions || DEFAULT_CONFIG.allowedExtensions;
  const allowedMimeTypes = config.allowedMimeTypes || DEFAULT_CONFIG.allowedMimeTypes;

  // Check if file exists
  if (!file) {
    logger.error('File validation failed: No file provided');
    return {
      valid: false,
      error: 'No file selected. Please choose a file to upload.',
      errorType: 'empty',
    };
  }

  // Extract file info
  const fileName = file.name || file.fileName || '';
  const fileSize = file.size || 0;
  const mimeType = file.mimeType || file.type || '';

  logger.info('Validating file', {
    name: fileName,
    size: fileSize,
    mimeType,
  });

  // 1. Validate file size (empty file)
  if (fileSize === 0) {
    logger.error('File validation failed: Empty file');
    return {
      valid: false,
      error: 'This file appears to be empty. Please choose a different file.',
      errorType: 'empty',
    };
  }

  // 2. Validate file size (too large)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (fileSize > maxSizeBytes) {
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    logger.error('File validation failed: File too large', {
      size: fileSize,
      maxSize: maxSizeBytes,
      sizeMB: fileSizeMB,
    });
    return {
      valid: false,
      error: `This file is too big (${fileSizeMB}MB). Please use a file under ${maxSizeMB}MB.`,
      errorType: 'size',
    };
  }

  // 3. Validate file extension
  const hasValidExtension = allowedExtensions.some((ext) =>
    fileName.toLowerCase().endsWith(ext.toLowerCase())
  );

  if (!hasValidExtension) {
    const extensionList = allowedExtensions.join(', ');
    logger.error('File validation failed: Invalid file type', {
      fileName,
      allowedExtensions,
    });
    return {
      valid: false,
      error: `This file type isn't supported. Please upload: ${extensionList}`,
      errorType: 'type',
    };
  }

  // 4. Validate MIME type (if available)
  if (mimeType) {
    const hasValidMimeType =
      allowedMimeTypes.some((type) => mimeType.toLowerCase().includes(type.toLowerCase())) ||
      mimeType === 'application/octet-stream'; // Generic fallback

    if (!hasValidMimeType) {
      logger.warn('File validation warning: MIME type mismatch', {
        fileName,
        mimeType,
        allowedMimeTypes,
      });
      // Don't fail, but log warning (some files have incorrect MIME types)
    }
  }

  // All validations passed
  logger.info('File validation passed', { fileName });
  return {
    valid: true,
  };
};

/**
 * Get user-friendly file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (fileName: string): string => {
  const match = fileName.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : '';
};

/**
 * Check if file is an image
 */
export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  const ext = getFileExtension(fileName);
  return imageExtensions.includes(ext);
};

/**
 * Check if file is a PDF
 */
export const isPdfFile = (fileName: string): boolean => {
  return getFileExtension(fileName) === '.pdf';
};

/**
 * Check if file is a text file
 */
export const isTextFile = (fileName: string): boolean => {
  const textExtensions = ['.txt', '.md', '.rtf'];
  const ext = getFileExtension(fileName);
  return textExtensions.includes(ext);
};

/**
 * Check if file is an EPUB
 */
export const isEpubFile = (fileName: string): boolean => {
  return getFileExtension(fileName) === '.epub';
};

/**
 * Validate multiple files
 *
 * @param files - Array of files to validate
 * @param config - Optional validation configuration
 * @returns Array of validation results
 */
export const validateFiles = (
  files: any[],
  config: FileValidationConfig = {}
): FileValidationResult[] => {
  return files.map((file) => validateFile(file, config));
};

/**
 * Get first validation error from multiple files
 *
 * @param files - Array of files to validate
 * @param config - Optional validation configuration
 * @returns First error found, or null if all valid
 */
export const getFirstValidationError = (
  files: any[],
  config: FileValidationConfig = {}
): string | null => {
  for (const file of files) {
    const result = validateFile(file, config);
    if (!result.valid) {
      return result.error || 'File validation failed';
    }
  }
  return null;
};

export default {
  validateFile,
  validateFiles,
  getFirstValidationError,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isPdfFile,
  isTextFile,
  isEpubFile,
};
