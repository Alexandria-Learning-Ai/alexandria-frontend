/**
 * OnboardingTooltip.tsx
 *
 * Elegant tooltip component for first-time user guidance.
 * Appears with smooth animation and auto-dismisses after reading.
 *
 * Features:
 * - Smooth fade-in animation with slide
 * - Alexandria-themed styling
 * - Auto-dismiss with manual option
 * - Position variants (top, bottom, left, right)
 * - Pulsing indicator for attention
 * - Accessibility support
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingTooltipProps {
  visible: boolean;
  message: string;
  position?: 'top' | 'bottom' | 'center';
  icon?: string;
  onDismiss: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  visible,
  message,
  position = 'top',
  icon = 'lightbulb',
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 8000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for icon
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Auto-dismiss
      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissDelay);

        return () => {
          clearTimeout(timer);
          pulse.stop();
        };
      }

      return () => pulse.stop();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: position === 'bottom' ? 20 : -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const positionStyle = position === 'bottom' ? styles.bottomPosition : styles.topPosition;

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        duration={2000}
        style={styles.tooltipCard}
      >
        {/* Decorative gold accent bar */}
        <View style={styles.accentBar} />

        <View style={styles.content}>
          {/* Icon with pulse animation */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <FontAwesome5 name={icon} size={20} color="#D4AF37" />
          </Animated.View>

          {/* Message */}
          <Text style={styles.message} accessibilityRole="text">
            {message}
          </Text>

          {/* Dismiss button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tooltip"
          >
            <Text style={styles.dismissText}>Got It</Text>
          </TouchableOpacity>
        </View>

        {/* Pointing arrow indicator */}
        {position === 'top' && <View style={[styles.arrow, styles.arrowBottom]} />}
        {position === 'bottom' && <View style={[styles.arrow, styles.arrowTop]} />}
      </Animatable.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  topPosition: {
    top: Platform.OS === 'ios' ? 100 : 80,
  },
  bottomPosition: {
    bottom: 100,
  },
  tooltipCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
    maxWidth: screenWidth - 32,
    minWidth: screenWidth * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  accentBar: {
    height: 4,
    backgroundColor: '#D4AF37',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  content: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#F8F4E3',
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dismissText: {
    color: '#1A2C5B',
    fontSize: 13,
    fontWeight: '700',
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  arrowBottom: {
    bottom: -10,
    alignSelf: 'center',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1E3A5F',
  },
  arrowTop: {
    top: -10,
    alignSelf: 'center',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E3A5F',
  },
});

export default OnboardingTooltip;
