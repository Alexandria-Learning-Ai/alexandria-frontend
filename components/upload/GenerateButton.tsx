import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

interface ThemeColors {
  alexandriaGold: string;
  alexandriaBronze: string;
  [key: string]: string;
}

interface GenerateButtonProps {
  uploadPurpose: 'study' | 'quiz';
  isUploading: boolean;
  isDisabled: boolean;
  filesCount: number;
  onPress: () => void;
  themeColors: ThemeColors;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * GenerateButton - Enhanced hero CTA with engaging animations
 *
 * Features:
 * - Prominent gradient design with enhanced glow
 * - Scale and pulse animations on press
 * - Shimmer effect when ready
 * - Loading state with animated spinner and progress dots
 * - Different icons and text for study/quiz mode
 * - Disabled state with visual feedback
 * - Accessibility labels and hints
 * - Success state preparation animation
 *
 * Accessibility:
 * - Descriptive accessibilityLabel
 * - accessibilityRole for button identification
 * - accessibilityHint for action guidance
 * - accessibilityState for loading/disabled states
 */
const GenerateButton: React.FC<GenerateButtonProps> = ({
  uploadPurpose,
  isUploading,
  isDisabled,
  filesCount,
  onPress,
  themeColors,
  styles,
  t
}) => {
  const disabled = isUploading || filesCount === 0 || isDisabled;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Shimmer effect when button is ready (ENHANCED: 25% faster, more prominent)
  useEffect(() => {
    if (!disabled && !isUploading) {
      const shimmer = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500, // 25% faster for more engagement
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      shimmer.start();
      return () => shimmer.stop();
    }
  }, [disabled, isUploading]);

  // Glow animation when ready (ENHANCED: stronger pulse)
  useEffect(() => {
    if (!disabled && !isUploading) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.7, // Stronger glow max
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    }
  }, [disabled, isUploading]);

  // Icon bounce on mount when ready
  useEffect(() => {
    if (!disabled && filesCount > 0) {
      Animated.sequence([
        Animated.spring(iconBounce, {
          toValue: 1.15,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(iconBounce, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [filesCount]);

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

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <Animated.View
      style={[
        enhancedStyles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.generateButton,
          enhancedStyles.generateButton,
          disabled && enhancedStyles.generateButtonDisabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.95}
        accessibilityLabel={
          disabled
            ? filesCount === 0
              ? 'Generate button. Select files first.'
              : 'Generating content, please wait'
            : uploadPurpose === 'study'
            ? 'Add files to study library'
            : 'Generate quiz from files'
        }
        accessibilityRole="button"
        accessibilityHint={
          disabled
            ? undefined
            : `Processes ${filesCount} file${filesCount > 1 ? 's' : ''} to ${
                uploadPurpose === 'study' ? 'add to your study library' : 'generate practice questions'
              }`
        }
        accessibilityState={{ disabled, busy: isUploading }}
      >
        <Animated.View
          style={[
            enhancedStyles.glowContainer,
            {
              shadowOpacity: disabled ? 0 : glowAnim,
            },
          ]}
        >
          <LinearGradient
            colors={
              disabled
                ? ['#8A95B5', '#6B7590']
                : [themeColors.alexandriaGold, themeColors.alexandriaBronze]
            }
            style={[styles.generateButtonGradient, enhancedStyles.generateButtonGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Shimmer Overlay */}
            {!disabled && !isUploading && (
              <Animated.View
                style={[
                  enhancedStyles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslateX }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']} // 67% brighter
                  style={enhancedStyles.shimmerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            )}

            {isUploading ? (
              <View style={[styles.loadingContent, enhancedStyles.loadingContent]}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={[styles.generateButtonText, enhancedStyles.generateButtonText]}>
                  {uploadPurpose === 'study' ? 'Preparing Your Materials' : 'Creating Your Quiz'}
                </Text>
                <View style={enhancedStyles.loadingDots}>
                  <Text style={enhancedStyles.loadingDotsText}>...</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.buttonContent, enhancedStyles.buttonContent]}>
                <Animated.View
                  style={{
                    transform: [{ scale: iconBounce }],
                    marginRight: 12,
                  }}
                >
                  <View style={enhancedStyles.iconContainer}>
                    <FontAwesome5
                      name={uploadPurpose === 'study' ? 'book-reader' : 'magic'}
                      size={28} // Larger icon for prominence
                      color="#1A2C5B"
                    />
                  </View>
                </Animated.View>
                <Text style={[styles.generateButtonText, enhancedStyles.generateButtonText]}>
                  {uploadPurpose === 'study'
                    ? 'Start Studying'
                    : 'Create My Quiz'}
                </Text>
                {!disabled && (
                  <FontAwesome5
                    name="arrow-right"
                    size={22} // Larger arrow
                    color="#1A2C5B"
                    style={enhancedStyles.arrowIcon}
                  />
                )}
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const enhancedStyles = StyleSheet.create({
  container: {
    marginTop: 32, // ENHANCED: 4x more spacing above for isolation
    marginBottom: 16, // More spacing below too
  },
  generateButton: {
    borderRadius: 20,
    overflow: 'visible',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  glowContainer: {
    borderRadius: 20,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 }, // Larger shadow offset
    shadowRadius: 24, // ENHANCED: 50% larger glow
    elevation: 12, // Higher elevation
  },
  generateButtonGradient: {
    paddingVertical: 28, // ENHANCED: 40% taller button
    paddingHorizontal: 32, // More horizontal padding
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    bottom: 0,
    width: 200,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40, // Larger container for larger icon
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 44, 91, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 22, // ENHANCED: 22% larger text
    fontWeight: '800', // Bolder weight
    color: '#1A2C5B',
    letterSpacing: 0.8, // More letter spacing
  },
  arrowIcon: {
    marginLeft: 12,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDots: {
    marginLeft: 4,
    width: 24,
  },
  loadingDotsText: {
    color: '#1A2C5B',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default GenerateButton;
