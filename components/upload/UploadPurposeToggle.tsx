import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface UploadPurposeToggleProps {
  uploadPurpose: 'study' | 'quiz';
  setUploadPurpose: (purpose: 'study' | 'quiz') => void;
  styles: any;
}

/**
 * UploadPurposeToggle - Enhanced toggle with smooth animations
 *
 * Features:
 * - Sliding indicator animation between modes
 * - Scale animation on press
 * - Gradient background for active state
 * - Icon bounce animation on selection
 * - Enhanced visual distinction between modes
 * - Smooth transition animations
 * - Helper text fade transition
 *
 * Accessibility:
 * - accessibilityLabel for each option
 * - accessibilityRole for toggle identification
 * - accessibilityState for current selection
 * - Clear visual and textual feedback
 */
const UploadPurposeToggle: React.FC<UploadPurposeToggleProps> = ({
  uploadPurpose,
  setUploadPurpose,
  styles
}) => {
  const slideAnim = useRef(new Animated.Value(uploadPurpose === 'study' ? 0 : 1)).current;
  const studyScale = useRef(new Animated.Value(1)).current;
  const quizScale = useRef(new Animated.Value(1)).current;
  const studyIconBounce = useRef(new Animated.Value(1)).current;
  const quizIconBounce = useRef(new Animated.Value(1)).current;
  const helperFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: uploadPurpose === 'study' ? 0 : 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Bounce animation for the selected icon
    const selectedBounce = uploadPurpose === 'study' ? studyIconBounce : quizIconBounce;
    Animated.sequence([
      Animated.spring(selectedBounce, {
        toValue: 1.2,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(selectedBounce, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade helper text on change
    Animated.sequence([
      Animated.timing(helperFade, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(helperFade, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [uploadPurpose]);

  const handleStudyPress = () => {
    Animated.sequence([
      Animated.timing(studyScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(studyScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setUploadPurpose('study');
  };

  const handleQuizPress = () => {
    Animated.sequence([
      Animated.timing(quizScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(quizScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setUploadPurpose('quiz');
  };

  const slideTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 170], // Adjust based on button width
  });

  return (
    <View style={styles.inputContainer}>
      {/* Enhanced Label */}
      <View style={enhancedStyles.labelContainer}>
        <FontAwesome5 name="bullseye" size={16} color="#D4AF37" />
        <Text style={[styles.label, enhancedStyles.label]}>
          Upload Purpose
        </Text>
      </View>

      {/* Enhanced Toggle Container */}
      <View style={[styles.toggleContainer, enhancedStyles.toggleContainer]}>
        {/* Sliding Indicator */}
        <Animated.View
          style={[
            enhancedStyles.slidingIndicator,
            {
              transform: [{ translateX: slideTranslateX }],
            },
          ]}
        >
          <LinearGradient
            colors={['#D4AF37', '#B8941F']}
            style={enhancedStyles.slidingIndicatorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Study Button */}
        <Animated.View style={{ flex: 1, transform: [{ scale: studyScale }] }}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              enhancedStyles.toggleButton,
              uploadPurpose === 'study' && enhancedStyles.activeToggle,
            ]}
            onPress={handleStudyPress}
            activeOpacity={0.9}
            accessibilityLabel="Study Material mode"
            accessibilityRole="button"
            accessibilityState={{ selected: uploadPurpose === 'study' }}
            accessibilityHint="Upload files to your study library"
          >
            <Animated.View
              style={[
                enhancedStyles.iconWrapper,
                { transform: [{ scale: studyIconBounce }] },
              ]}
            >
              <FontAwesome5
                name="book-reader"
                size={18}
                color={uploadPurpose === 'study' ? '#1A2C5B' : '#D4AF37'}
              />
            </Animated.View>
            <Text
              style={[
                styles.toggleText,
                enhancedStyles.toggleText,
                {
                  color: uploadPurpose === 'study' ? '#1A2C5B' : '#CBD5E0',
                  fontWeight: uploadPurpose === 'study' ? '700' : '600',
                },
              ]}
            >
              Study
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quiz Button */}
        <Animated.View style={{ flex: 1, transform: [{ scale: quizScale }] }}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              enhancedStyles.toggleButton,
              uploadPurpose === 'quiz' && enhancedStyles.activeToggle,
            ]}
            onPress={handleQuizPress}
            activeOpacity={0.9}
            accessibilityLabel="Quiz Generation mode"
            accessibilityRole="button"
            accessibilityState={{ selected: uploadPurpose === 'quiz' }}
            accessibilityHint="Generate practice questions from files"
          >
            <Animated.View
              style={[
                enhancedStyles.iconWrapper,
                { transform: [{ scale: quizIconBounce }] },
              ]}
            >
              <FontAwesome5
                name="brain"
                size={18}
                color={uploadPurpose === 'quiz' ? '#1A2C5B' : '#D4AF37'}
              />
            </Animated.View>
            <Text
              style={[
                styles.toggleText,
                enhancedStyles.toggleText,
                {
                  color: uploadPurpose === 'quiz' ? '#1A2C5B' : '#CBD5E0',
                  fontWeight: uploadPurpose === 'quiz' ? '700' : '600',
                },
              ]}
            >
              Quiz
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* REMOVED: Verbose helper text to reduce information density */}
    </View>
  );
};

const enhancedStyles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    marginLeft: 8,
    marginBottom: 0,
  },
  toggleContainer: {
    position: 'relative',
    backgroundColor: 'rgba(44, 70, 125, 0.4)',
    padding: 4,
    borderRadius: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '48%',
    height: '87%',
    borderRadius: 12,
    zIndex: 0,
  },
  slidingIndicatorGradient: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleButton: {
    zIndex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeToggle: {
    // Active state handled by sliding indicator
  },
  iconWrapper: {
    marginRight: 8,
  },
  toggleText: {
    fontSize: 16,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  uploadHelper: {
    marginLeft: 6,
    marginTop: 0,
    lineHeight: 18,
  },
});

export default UploadPurposeToggle;
