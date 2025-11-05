/**
 * QuizLoadingScreen.tsx
 *
 * Full-screen loading overlay with Alexandria branding.
 * Displays animated book, logo, and loading messages.
 *
 * Extracted and converted to TypeScript from QuizLoadingScreen.js
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Image
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '../../types';

const { width, height } = Dimensions.get('window');

interface QuizLoadingScreenProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
  themeColors?: ThemeColors;
  isDarkMode?: boolean;
}

interface AnimatedDotProps {
  delay: number;
}

/**
 * Animated dot for loading indicator
 */
const AnimatedDot: React.FC<AnimatedDotProps> = ({ delay }) => {
  const dotAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    const timer = setTimeout(() => {
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [delay, dotAnim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { opacity: dotAnim }
      ]}
    />
  );
};

/**
 * QuizLoadingScreen Component
 *
 * Full-screen loading overlay with:
 * - Animated torch logo
 * - Book loading animation
 * - Loading text with animated dots
 * - Alexandria branding
 */
export const QuizLoadingScreen: React.FC<QuizLoadingScreenProps> = ({
  isVisible,
  message = "Alexandria is creating your quiz...",
  subMessage = "This may take a few moments",
  themeColors,
  isDarkMode = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in and scale animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();

      // Pulse animation for the torch logo
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim, scaleAnim, pulseAnim]);

  if (!isVisible) return null;

  const gradientColors: readonly [string, string, string] = themeColors
    ? [themeColors.alexandriaNavy, themeColors.alexandriaNavy, themeColors.alexandriaNavy]
    : ['#1A2C5B', '#2D4A7B', '#1A2C5B'];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <StatusBar
        backgroundColor={themeColors?.alexandriaNavy || '#1A2C5B'}
        barStyle={isDarkMode ? 'light-content' : 'light-content'}
      />

      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentContainer}>
          {/* Torch Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Image
              source={require('../../assets/alexandria-logo.png')}
              style={styles.torchLogo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Book Loading Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../assets/bookloadinganime.json')}
              autoPlay
              loop
              style={styles.bookAnimation}
              colorFilters={[
                {
                  keypath: "**",
                  color: themeColors?.alexandriaGold || "#D4AF37"
                }
              ]}
            />
          </View>

          {/* Loading Text */}
          <View style={styles.textContainer}>
            <Text style={styles.loadingText}>{message}</Text>
            <Text style={styles.subText}>{subMessage}</Text>

            {/* Animated dots */}
            <View style={styles.dotsContainer}>
              <AnimatedDot delay={0} />
              <AnimatedDot delay={300} />
              <AnimatedDot delay={600} />
            </View>
          </View>

          {/* Bottom branding */}
          <View style={styles.brandingContainer}>
            <Text style={styles.brandingText}>Powered by Alexandria AI</Text>
            <View
              style={[
                styles.brandingLine,
                { backgroundColor: themeColors?.alexandriaGold || '#D4AF37' }
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  torchLogo: {
    width: 80,
    height: 80,
    tintColor: '#D4AF37', // Alexandria Gold
  },
  animationContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookAnimation: {
    width: 200,
    height: 150,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  loadingText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 16,
    color: '#B8D4E3',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4AF37',
    marginHorizontal: 4,
  },
  brandingContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 14,
    color: '#8A9AAE',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  brandingLine: {
    width: 100,
    height: 1,
    opacity: 0.5,
  },
});

export default QuizLoadingScreen;
