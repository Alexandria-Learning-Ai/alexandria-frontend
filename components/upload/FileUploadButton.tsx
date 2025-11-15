import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FileUploadButtonProps {
  files: any[];
  onPress: () => void;
  isDisabled: boolean;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * FileUploadButton - Enhanced file upload trigger with engaging interactions
 *
 * Features:
 * - Animated scale and glow on press
 * - Gradient border effect when files selected
 * - Badge counter with animation
 * - Icon transitions between states
 * - Pulse animation when empty
 * - Disabled state with reduced opacity
 * - Helper text with icon
 *
 * Accessibility:
 * - accessibilityLabel with file count
 * - accessibilityRole for button identification
 * - accessibilityHint for action guidance
 * - accessibilityState for disabled state
 */
const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  files,
  onPress,
  isDisabled,
  styles,
  t
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  
  // Badge animation when files selected
  useEffect(() => {
    if (files.length > 0) {
      Animated.spring(badgeScale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      badgeScale.setValue(0);
    }
  }, [files.length]);


  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.inputContainer}>
      {/* Enhanced Label with Icon */}
      <View style={enhancedStyles.labelContainer}>
        <FontAwesome5 name="cloud-upload-alt" size={16} color="#D4AF37" />
        <Text style={[styles.label, enhancedStyles.label]}>
          {t('upload.selectTexts')}
        </Text>
      </View>

      {/* Enhanced Upload Button */}
      <Animated.View
        style={{
          transform: [{ scale: files.length === 0 ? pulseAnim : scaleAnim }],
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <TouchableOpacity
          style={[
            styles.uploadButton,
            enhancedStyles.uploadButton,
            files.length > 0 && enhancedStyles.uploadButtonActive,
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          disabled={isDisabled}
          accessibilityLabel={
            files.length > 0
              ? `${files.length} file${files.length > 1 ? 's' : ''} selected. Tap to add more files.`
              : 'Select files to upload'
          }
          accessibilityRole="button"
          accessibilityHint="Opens file picker to select documents"
          accessibilityState={{ disabled: isDisabled }}
        >
          {/* Gradient Border Effect */}
          {files.length > 0 && (
            <LinearGradient
              colors={['#D4AF37', '#B8941F']}
              style={enhancedStyles.gradientBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          <View style={[styles.uploadButtonContent, enhancedStyles.uploadButtonContent]}>
            {/* Icon with Animation */}
            <Animated.View
              style={{
                marginRight: 12,
              }}
            >
              <View style={enhancedStyles.iconContainer}>
                <FontAwesome5
                  name={files.length > 0 ? 'check-circle' : 'plus-circle'}
                  size={20}
                  color={files.length > 0 ? '#28a745' : '#D4AF37'}
                />
              </View>
            </Animated.View>

            {/* Text */}
            <Text
              style={[
                styles.uploadButtonText,
                enhancedStyles.uploadButtonText,
                files.length > 0 && styles.uploadButtonTextActive,
              ]}
            >
              {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected`:t('upload.selectTexts')}
            </Text>          
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Enhanced Helper Text */}
      {files.length > 0 && (
        <View style={enhancedStyles.helperContainer}>
          <FontAwesome5 name="info-circle" size={12} color="#8A95B5" />
          <Text style={[styles.uploadHelper, enhancedStyles.uploadHelper]}>
            {t('upload.supportedFormats')}
          </Text>
        </View>
      )}
    </View>
  );
};

const enhancedStyles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    marginLeft: 8,
    marginBottom: 0,
  },
  uploadButton: {
    position: 'relative',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButtonActive: {
    borderColor: '#D4AF37',
    borderWidth: 2,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    opacity: 0.3,
  },
  uploadButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -14,
  },
  badgeGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A2C5B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 8,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  uploadHelper: {
    marginLeft: 6,
    marginTop: 0,
  },
});

export default FileUploadButton;
