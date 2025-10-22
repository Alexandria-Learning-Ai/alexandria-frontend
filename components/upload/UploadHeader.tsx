import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp } from '@react-navigation/native';
import NavigationHelper from '../../utils/NavigationHelper';

interface ThemeColors {
  text: string;
  textSecondary: string;
  alexandriaGold: string;
  alexandriaBronze: string;
  [key: string]: string;
}

interface UploadHeaderProps {
  navigation: NavigationProp<any>;
  containerAnim: Animated.Value;
  themeColors: ThemeColors;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * UploadHeader - Enhanced header with modern styling and animations
 *
 * Features:
 * - Animated back button with scale effect on press
 * - Gradient icon container for visual prominence
 * - Animated title entrance with fade and slide
 * - Subtitle with icon and improved typography
 * - Theme-aware styling with gold accents
 * - Enhanced shadow and depth
 *
 * Accessibility:
 * - accessibilityLabel for back button
 * - accessibilityRole for proper screen reader support
 * - Clear visual hierarchy
 */
const UploadHeader: React.FC<UploadHeaderProps> = ({
  navigation,
  containerAnim,
  themeColors,
  styles,
  t
}) => {
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(-20)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.8)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(titleSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBackPress = () => {
    Animated.sequence([
      Animated.timing(backButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(containerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => NavigationHelper.safeGoBack(navigation));
  };

  return (
    <>
      {/* Enhanced Back Button */}
      <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
        <TouchableOpacity
          style={[styles.backButton, enhancedStyles.backButton]}
          onPress={handleBackPress}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          accessibilityHint="Navigate back to the previous screen"
        >
          <FontAwesome5
            name="arrow-left"
            size={20}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Enhanced Header with Icon and Animations */}
      <Animated.View
        style={[
          styles.header,
          enhancedStyles.header,
          {
            opacity: titleFadeAnim,
            transform: [{ translateY: titleSlideAnim }]
          }
        ]}
      >
        {/* Gradient Icon Container */}
        <Animated.View style={{ transform: [{ scale: iconScaleAnim }] }}>
          <LinearGradient
            colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
            style={enhancedStyles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5
              name="university"
              size={24} // TERTIARY: Reduced from 32 (25% smaller)
              color="#1A2C5B"
            />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Text
          style={[styles.title, enhancedStyles.title, { color: themeColors.text }]}
          accessibilityRole="header"
        >
          {t('upload.title')}
        </Text>

        {/* REMOVED: Verbose subtitle for cleaner information density */}
      </Animated.View>
    </>
  );
};

const enhancedStyles = StyleSheet.create({
  backButton: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    paddingVertical: 8,
  },
  iconContainer: {
    width: 60, // TERTIARY: Reduced from 80 (25% smaller)
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12, // Reduced spacing
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 }, // Reduced shadow
    shadowOpacity: 0.15, // Much lighter shadow
    shadowRadius: 4, // Smaller glow
    elevation: 3, // Lower elevation
  },
  title: {
    fontSize: 28, // TERTIARY: Reduced from 34 (18% smaller)
    fontWeight: '600', // TERTIARY: Lighter weight from 800
    letterSpacing: 0.3, // Less letter spacing
    marginBottom: 6, // Tighter spacing
    opacity: 0.85, // Slightly muted
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleIcon: {
    marginRight: 6,
    opacity: 0.7, // TERTIARY: Muted icon
  },
  subtitle: {
    fontSize: 13, // TERTIARY: Reduced from 16 (19% smaller)
    lineHeight: 18, // Tighter line height
    opacity: 0.7, // TERTIARY: Muted text
  },
});

export default UploadHeader;
