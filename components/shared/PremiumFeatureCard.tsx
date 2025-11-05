/**
 * PremiumFeatureCard - Modern compact feature card with triggered shimmer effect
 *
 * Features:
 * - Shimmer effect triggers once on screen focus (1.5s duration, not continuous loop)
 * - Compact modern design (15% smaller than original)
 * - Sophisticated depth with multi-layer shadows (3 layers)
 * - Inner shadow gradient overlay for depth
 * - Subtle gold border gradient
 * - Spring physics animations on press
 * - Haptic feedback on interaction
 * - Icon glow animations
 * - Gradient backgrounds with neumorphic styling
 * - Smooth 60fps animations with native driver
 * - Alexandria theme styling
 *
 * Accessibility:
 * - Descriptive labels
 * - Proper button role
 * - Minimum 44x44 touch targets maintained
 *
 * @param id - Unique identifier
 * @param title - Feature title
 * @param subtitle - Feature description
 * @param icon - FontAwesome5 icon name
 * @param color - Icon container background color
 * @param onPress - Handler for card press
 * @param delay - Entrance animation delay
 * @param triggerShimmer - Number that triggers shimmer when value changes
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PremiumFeatureCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
  delay: number;
  triggerShimmer?: number;
}

const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({
  id,
  title,
  subtitle,
  icon,
  color,
  onPress,
  delay,
  triggerShimmer,
}) => {
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const iconGlowAnim = useRef(new Animated.Value(0.3)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;

  // Theme colors
  const themeColors = {
    alexandriaGold: '#D4AF37',
    backgroundSecondary: '#2C467D',
    text: '#F8F4E3',
    textSecondary: '#CBD5E0',
  };

  // Entrance animation on mount
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [delay]);

  // Trigger-based shimmer effect (plays once when triggerShimmer changes)
  useEffect(() => {
    if (triggerShimmer !== undefined && triggerShimmer > 0) {
      // Reset shimmer to start position
      shimmerAnim.setValue(0);

      // Play shimmer animation once (1.5 seconds)
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500, // 1.5 seconds
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0, // Instant reset for next trigger
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [triggerShimmer]);

  // Icon glow animation (subtle pulse)
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(iconGlowAnim, {
          toValue: 0.6,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(iconGlowAnim, {
          toValue: 0.3,
          duration: 1800,
          useNativeDriver: false,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  const handlePressIn = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Scale down animation
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0.95,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1.1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    // Scale back animation
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    // Haptic feedback for selection
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPress();
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.98}
        accessibilityLabel={`${title}. ${subtitle}`}
        accessibilityRole="button"
        accessibilityHint={`Navigate to ${title} feature`}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ scale: pressAnim }],
            },
          ]}
        >
          {/* Border gradient (subtle gold edge) */}
          <View style={styles.borderGradient}>
            {/* Multi-layer gradient background */}
            <LinearGradient
              colors={[themeColors.backgroundSecondary, '#1A2C5B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Inner shadow overlay (top darker, bottom lighter) */}
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.3)', 'transparent', 'rgba(212, 175, 55, 0.1)']}
                style={styles.innerShadowOverlay}
                pointerEvents="none"
              />

              {/* Shimmer overlay */}
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslateX }],
                  },
                ]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(212, 175, 55, 0.25)', // Alexandria gold shimmer
                    'transparent',
                  ]}
                  style={styles.shimmerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>

              {/* Icon container with glow */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: color,
                    shadowOpacity: iconGlowAnim,
                    transform: [{ scale: iconScaleAnim }],
                  },
                ]}
              >
                <FontAwesome5 name={icon} size={27} color="#FFFFFF" />
              </Animated.View>

              {/* Text content */}
              <Text
                style={[styles.featureTitle, { color: themeColors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              <Text
                style={[styles.featureSubtitle, { color: themeColors.textSecondary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>

              {/* Bottom accent line */}
              <View style={styles.accentLineContainer}>
                <View
                  style={[
                    styles.accentLine,
                    { backgroundColor: themeColors.alexandriaGold },
                  ]}
                />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    // No marginBottom - spacing handled by grid gap in parent
  },
  cardContainer: {
    borderRadius: 17, // 20 * 0.85 = 17
    overflow: 'hidden',
    // Multi-layer shadow system (Layer 1: Outer gold glow)
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  borderGradient: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)', // Subtle gold border
    overflow: 'hidden',
    // Layer 2: Depth shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    padding: 20, // 24 * 0.85 ≈ 20
    height: 153, // Fixed height for uniform card size (180 * 0.85 = 153)
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    // Layer 3: Contact shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  innerShadowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 17,
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
  iconContainer: {
    width: 61, // 72 * 0.85 ≈ 61
    height: 61,
    borderRadius: 30.5, // 36 * 0.85 = 30.5
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17, // 20 * 0.85 = 17
    // Icon glow effect
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  featureTitle: {
    fontSize: 15, // 18 * 0.85 ≈ 15
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  featureSubtitle: {
    fontSize: 11, // 13 * 0.85 ≈ 11
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 15, // Adjusted for smaller font
    paddingHorizontal: 8,
  },
  accentLineContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    alignItems: 'center',
  },
  accentLine: {
    width: 51, // 60 * 0.85 = 51
    height: 3, // 4 * 0.85 ≈ 3
    borderRadius: 2,
    opacity: 0.6,
  },
});

export default PremiumFeatureCard;
