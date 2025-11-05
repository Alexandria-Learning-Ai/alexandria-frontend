import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FreshnessIndicatorProps {
  isVisible: boolean;
  t: (key: string, options?: any) => string;
}

/**
 * FreshnessIndicator - Enhanced success celebration with animations
 *
 * Features:
 * - Multi-layer animation entrance (slide + fade + bounce)
 * - Confetti-like particle effects simulation
 * - Pulsing star icon with glow
 * - Gradient background with shimmer
 * - Auto-dismiss animation
 * - Celebratory visual design
 * - Accessibility announcements
 *
 * Accessibility:
 * - accessibilityLabel for success message
 * - accessibilityRole for alert identification
 * - accessibilityLiveRegion for immediate announcement
 */
const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  isVisible,
  t
}) => {
  const starScale = useRef(new Animated.Value(0.5)).current;
  const starRotate = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.8)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  // Particle animations (simulated confetti)
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Star entrance animation
      Animated.sequence([
        Animated.spring(starScale, {
          toValue: 1.2,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(starScale, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Star rotation
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // Glow pulse loop
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();

      // Shimmer effect
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerLoop.start();

      // Particle animations
      Animated.parallel([
        Animated.timing(particle1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(particle2, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(particle3, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        glowLoop.stop();
        shimmerLoop.stop();
      };
    } else {
      // Reset animations
      starScale.setValue(0.5);
      starRotate.setValue(0);
      particle1.setValue(0);
      particle2.setValue(0);
      particle3.setValue(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const starRotation = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  // Particle positions
  const particle1Y = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });
  const particle1Opacity = particle1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });

  const particle2Y = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });
  const particle2X = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });
  const particle2Opacity = particle2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });

  const particle3Y = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -45],
  });
  const particle3X = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });
  const particle3Opacity = particle3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animatable.View
      animation="slideInDown"
      duration={500}
      style={enhancedStyles.container}
      accessibilityRole="alert"
      accessibilityLabel={t('upload.freshWisdomForged')}
      accessibilityLiveRegion="assertive"
    >
      <LinearGradient
        colors={['#D4AF37', '#B8941F', '#D4AF37']}
        style={enhancedStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Shimmer Overlay */}
        <Animated.View
          style={[
            enhancedStyles.shimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            style={enhancedStyles.shimmerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Content Container */}
        <View style={enhancedStyles.content}>
          {/* Animated Star Icon with Glow */}
          <Animated.View
            style={[
              enhancedStyles.starContainer,
              {
                transform: [
                  { scale: Animated.multiply(starScale, glowPulse) },
                  { rotate: starRotation },
                ],
              },
            ]}
          >
            <View style={enhancedStyles.glowOuter}>
              <View style={enhancedStyles.glowInner}>
                <FontAwesome5 name="star" size={20} color="#1A2C5B" solid />
              </View>
            </View>
          </Animated.View>

          {/* Success Message */}
          <Text style={enhancedStyles.messageText}>
            {t('upload.freshWisdomForged')}
          </Text>

          {/* Check Icon */}
          <View style={enhancedStyles.checkIconContainer}>
            <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" solid />
          </View>
        </View>

        {/* Floating Particles (Confetti Effect) */}
        <Animated.View
          style={[
            enhancedStyles.particle,
            enhancedStyles.particle1,
            {
              opacity: particle1Opacity,
              transform: [{ translateY: particle1Y }],
            },
          ]}
        >
          <FontAwesome5 name="star" size={10} color="#FFFFFF" solid />
        </Animated.View>

        <Animated.View
          style={[
            enhancedStyles.particle,
            enhancedStyles.particle2,
            {
              opacity: particle2Opacity,
              transform: [{ translateY: particle2Y }, { translateX: particle2X }],
            },
          ]}
        >
          <FontAwesome5 name="star" size={8} color="#FFFFFF" solid />
        </Animated.View>

        <Animated.View
          style={[
            enhancedStyles.particle,
            enhancedStyles.particle3,
            {
              opacity: particle3Opacity,
              transform: [{ translateY: particle3Y }, { translateX: particle3X }],
            },
          ]}
        >
          <FontAwesome5 name="star" size={12} color="#FFFFFF" solid />
        </Animated.View>
      </LinearGradient>
    </Animatable.View>
  );
};

const enhancedStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starContainer: {
    marginRight: 12,
  },
  glowOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    color: '#1A2C5B',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkIconContainer: {
    marginLeft: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 44, 91, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  particle1: {
    top: 20,
    left: '30%',
  },
  particle2: {
    top: 18,
    right: '25%',
  },
  particle3: {
    top: 22,
    left: '60%',
  },
});

export default FreshnessIndicator;
