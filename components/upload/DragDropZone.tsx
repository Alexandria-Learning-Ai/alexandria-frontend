import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import logger from '../../utils/logger';
import { colors, gradients, radius, spacing, shadow } from '../../theme/tokens';
import { validateFile as validateFileUtil } from '../../utils/fileValidation';

interface DragDropZoneProps {
  onFileSelected: (file: File) => void;
  acceptedTypes: string[];
  maxSizeMB: number;
  disabled?: boolean;
  onError?: (error: string) => void;
}

interface ValidationResult {
  valid: boolean;
  error: string | null;
}

type DragState = 'idle' | 'dragging' | 'success' | 'error';

/**
 * DragDropZone - Drag and drop file upload zone for desktop users
 *
 * Features:
 * - Drag and drop file upload with visual feedback
 * - File type and size validation
 * - Animated state transitions (idle, dragging, success, error)
 * - Fallback browse button for manual file selection
 * - Accessible keyboard navigation
 * - Theme-aware styling using Alexandria design tokens
 *
 * Platform:
 * - Web only (React Native Web provides HTML5 drag & drop APIs)
 * - Use FileUploadButton component for mobile platforms
 *
 * Validation:
 * - Accepted file types: configurable via acceptedTypes prop
 * - Maximum file size: configurable via maxSizeMB prop
 * - Friendly error messages for invalid files
 *
 * Accessibility:
 * - ARIA labels for screen readers
 * - Keyboard navigation support (Enter/Space to browse)
 * - Focus indicators
 * - Error messages announced to screen readers
 *
 * @param onFileSelected - Callback when valid file is dropped/selected
 * @param acceptedTypes - Array of accepted file extensions (e.g., ['.pdf', '.txt'])
 * @param maxSizeMB - Maximum file size in megabytes
 * @param disabled - Whether the zone is disabled
 * @param onError - Optional callback for error messages
 */
const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFileSelected,
  acceptedTypes,
  maxSizeMB,
  disabled = false,
  onError,
}) => {
  const [dragState, setDragState] = useState<DragState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderPulseAnim = useRef(new Animated.Value(1)).current;
  const successFadeAnim = useRef(new Animated.Value(0)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;

  // File input ref for fallback browse
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Drag counter to handle nested drag events
  const dragCounterRef = useRef(0);

  /**
   * Validates file against type and size constraints using centralized validation
   */
  const validateFile = useCallback(
    (file: File): ValidationResult => {
      logger.info('Validating file:', { name: file.name, size: file.size, type: file.type });

      // Use centralized validation utility
      const result = validateFileUtil(file, {
        maxSizeMB,
        allowedExtensions: acceptedTypes,
      });

      return {
        valid: result.valid,
        error: result.error || null,
      };
    },
    [acceptedTypes, maxSizeMB]
  );

  /**
   * Handles file selection (from drop or browse)
   */
  const handleFileSelection = useCallback(
    (file: File) => {
      const validation = validateFile(file);

      if (!validation.valid) {
        logger.warn('File validation failed:', validation.error);
        setDragState('error');
        setErrorMessage(validation.error);
        if (onError) {
          onError(validation.error);
        }

        // Shake animation for error
        Animated.sequence([
          Animated.timing(errorShakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(errorShakeAnim, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(errorShakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(errorShakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset error state after 5 seconds
          setTimeout(() => {
            setDragState('idle');
            setErrorMessage(null);
          }, 5000);
        });

        return;
      }

      // Valid file - show success state
      logger.info('File validated successfully:', file.name);
      setDragState('success');
      setSelectedFile(file);
      setErrorMessage(null);

      // Success fade-in animation
      Animated.spring(successFadeAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Notify parent component
      onFileSelected(file);
    },
    [validateFile, onFileSelected, onError, errorShakeAnim, successFadeAnim]
  );

  /**
   * Drag enter handler
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounterRef.current += 1;

      if (dragCounterRef.current === 1) {
        setDragState('dragging');

        // Scale up animation
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }).start();

        // Start border pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(borderPulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: false,
            }),
            Animated.timing(borderPulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }
    },
    [disabled, scaleAnim, borderPulseAnim]
  );

  /**
   * Drag over handler (required to allow drop)
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Drag leave handler
   */
  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounterRef.current -= 1;

      if (dragCounterRef.current === 0) {
        setDragState('idle');

        // Scale back to normal
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }).start();

        // Stop border pulse
        borderPulseAnim.stopAnimation();
        borderPulseAnim.setValue(1);
      }
    },
    [disabled, scaleAnim, borderPulseAnim]
  );

  /**
   * Drop handler
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounterRef.current = 0;

      // Stop animations
      borderPulseAnim.stopAnimation();
      borderPulseAnim.setValue(1);
      scaleAnim.setValue(1);

      // Get dropped files
      const files = Array.from(e.dataTransfer.files);

      if (files.length === 0) {
        logger.warn('No files dropped');
        setDragState('idle');
        return;
      }

      if (files.length > 1) {
        logger.warn('Multiple files dropped, using first file only');
        setDragState('error');
        setErrorMessage('Please drop only one file at a time.');
        if (onError) {
          onError('Please drop only one file at a time.');
        }
        setTimeout(() => {
          setDragState('idle');
          setErrorMessage(null);
        }, 3000);
        return;
      }

      // Handle single file
      const file = files[0];
      handleFileSelection(file);
    },
    [disabled, handleFileSelection, onError, borderPulseAnim, scaleAnim]
  );

  /**
   * Browse button handler (fallback)
   */
  const handleBrowseClick = useCallback(() => {
    if (disabled) return;

    // Trigger file input click
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  /**
   * File input change handler
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      handleFileSelection(file);

      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelection]
  );

  /**
   * Change file handler (when file already selected)
   */
  const handleChangeFile = useCallback(() => {
    setDragState('idle');
    setSelectedFile(null);
    setErrorMessage(null);
    successFadeAnim.setValue(0);

    // Trigger file input
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [successFadeAnim]);

  /**
   * Keyboard handler for accessibility
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleBrowseClick();
      }
    },
    [disabled, handleBrowseClick]
  );

  // Theme colors
  const themeColors = useMemo(
    () => ({
      idle: {
        border: colors.cardStroke,
        background: colors.bg2,
        backgroundLight: 'rgba(30, 42, 68, 0.5)',
      },
      dragging: {
        border: colors.gold,
        background: 'rgba(245, 196, 81, 0.1)',
        backgroundLight: 'rgba(245, 196, 81, 0.2)',
      },
      success: {
        border: colors.success,
        background: 'rgba(50, 213, 131, 0.1)',
        backgroundLight: 'rgba(50, 213, 131, 0.2)',
      },
      error: {
        border: colors.danger,
        background: 'rgba(255, 107, 107, 0.1)',
        backgroundLight: 'rgba(255, 107, 107, 0.2)',
      },
    }),
    []
  );

  // Get current state colors
  const currentColors = themeColors[dragState];

  // Border color animation
  const borderColor = borderPulseAnim.interpolate({
    inputRange: [1, 1.1],
    outputRange: [currentColors.border, colors.gold],
  });

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get icon name based on state
  const getIconName = (): string => {
    switch (dragState) {
      case 'dragging':
        return 'cloud-download-alt';
      case 'success':
        return 'check-circle';
      case 'error':
        return 'exclamation-circle';
      default:
        return 'cloud-upload-alt';
    }
  };

  // Get icon color based on state
  const getIconColor = (): string => {
    switch (dragState) {
      case 'dragging':
        return colors.gold;
      case 'success':
        return colors.success;
      case 'error':
        return colors.danger;
      default:
        return colors.goldDeep;
    }
  };

  // Accepted formats display
  const acceptedFormatsText = acceptedTypes.join(', ').toUpperCase();

  // ✅ FIX Bug #7: Cleanup animations and timers on unmount
  useEffect(() => {
    return () => {
      // Stop all running animations to prevent memory leaks
      scaleAnim.stopAnimation();
      borderPulseAnim.stopAnimation();
      successFadeAnim.stopAnimation();
      errorShakeAnim.stopAnimation();

      // Reset drag counter
      dragCounterRef.current = 0;

      logger.debug('DragDropZone: Cleaned up animations on unmount');
    };
  }, [scaleAnim, borderPulseAnim, successFadeAnim, errorShakeAnim]);

  return (
    <View style={styles.container}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <FontAwesome5 name="cloud-upload-alt" size={16} color={colors.goldDeep} />
        <Text style={styles.label}>Upload Files</Text>
      </View>

      {/* Hidden file input for browse fallback (web only) */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange as any}
          style={{ display: 'none' }}
        />
      )}

      {/* Drag & Drop Zone */}
      <Animated.View
        style={[
          styles.dropZone,
          {
            borderColor: borderColor as any,
            backgroundColor: currentColors.background,
            transform: [{ scale: scaleAnim }, { translateX: errorShakeAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onDragEnter={handleDragEnter as any}
        onDragOver={handleDragOver as any}
        onDragLeave={handleDragLeave as any}
        onDrop={handleDrop as any}
        onKeyPress={handleKeyPress as any}
        // Accessibility
        {...({
          role: 'button',
          tabIndex: disabled ? -1 : 0,
          'aria-label': 'Drag and drop file upload zone',
          'aria-disabled': disabled,
          'aria-describedby': 'drop-zone-description',
        } as any)}
      >
        {/* Gradient overlay for dragging state */}
        {dragState === 'dragging' && (
          <LinearGradient
            colors={[currentColors.background, currentColors.backgroundLight]}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {/* Content based on state */}
        {dragState === 'success' && selectedFile ? (
          // Success state - show file info
          <Animated.View
            style={[styles.successContent, { opacity: successFadeAnim }]}
          >
            <View style={styles.successIcon}>
              <FontAwesome5 name="check-circle" size={48} color={colors.success} />
            </View>

            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>

            <TouchableOpacity
              style={styles.changeFileButton}
              onPress={handleChangeFile}
              activeOpacity={0.8}
              accessibilityLabel="Change selected file"
              accessibilityRole="button"
            >
              <FontAwesome5 name="exchange-alt" size={14} color={colors.gold} />
              <Text style={styles.changeFileText}>Change File</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          // Idle, dragging, or error state
          <View style={styles.idleContent}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    dragState === 'error'
                      ? 'rgba(255, 107, 107, 0.15)'
                      : dragState === 'dragging'
                      ? 'rgba(245, 196, 81, 0.15)'
                      : 'rgba(212, 175, 55, 0.15)',
                },
              ]}
            >
              <FontAwesome5 name={getIconName()} size={48} color={getIconColor()} />
            </View>

            {/* Main text */}
            <Text style={styles.mainText}>
              {dragState === 'dragging'
                ? 'Drop your file here'
                : dragState === 'error'
                ? 'Upload Failed'
                : 'Drag & Drop Files Here'}
            </Text>

            {/* Error message */}
            {dragState === 'error' && errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            {/* Divider */}
            {dragState !== 'error' && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* Browse button */}
            <TouchableOpacity
              style={[
                styles.browseButton,
                dragState === 'error' && styles.browseButtonError,
              ]}
              onPress={dragState === 'error' ? handleChangeFile : handleBrowseClick}
              activeOpacity={0.8}
              disabled={disabled}
              accessibilityLabel={
                dragState === 'error' ? 'Try again' : 'Browse files'
              }
              accessibilityRole="button"
            >
              <LinearGradient
                colors={
                  dragState === 'error'
                    ? [colors.danger, '#CC5555']
                    : [colors.gold, colors.goldDeep]
                }
                style={styles.browseButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome5
                  name={dragState === 'error' ? 'redo' : 'folder-open'}
                  size={16}
                  color="#1A1400"
                />
                <Text style={styles.browseButtonText}>
                  {dragState === 'error' ? 'Try Again' : 'Browse Files'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* File format info */}
            {dragState !== 'error' && (
              <View style={styles.infoContainer}>
                <FontAwesome5 name="info-circle" size={12} color={colors.textMute} />
                <Text style={styles.infoText} id="drop-zone-description">
                  Supports: {acceptedFormatsText} | Max: {maxSizeMB}MB
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[16],
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.text,
    marginLeft: spacing[8],
  },
  dropZone: {
    minHeight: 240,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: spacing[24],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
  },
  idleContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[16],
  },
  mainText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing[8],
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing[16],
    paddingHorizontal: spacing[16],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: spacing[16],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardStroke,
  },
  dividerText: {
    fontSize: 14,
    color: colors.textMute,
    marginHorizontal: spacing[12],
  },
  browseButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing[12],
    ...shadow.glow,
  },
  browseButtonError: {
    shadowColor: colors.danger,
  },
  browseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[24],
    gap: spacing[8],
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1400',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  infoText: {
    fontSize: 12,
    color: colors.textMute,
    textAlign: 'center',
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    marginBottom: spacing[16],
  },
  fileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 14,
    color: colors.textDim,
    marginBottom: spacing[20],
  },
  changeFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[16],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(245, 196, 81, 0.1)',
    borderWidth: 1,
    borderColor: colors.gold,
    gap: spacing[8],
  },
  changeFileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
  },
});

export default DragDropZone;
