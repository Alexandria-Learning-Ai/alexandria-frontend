/**
 * PrimaryButton - Alexandria CTA (V2)
 *
 * Final mock-up match:
 * - Premium gold gradient (#FFE27A → #E8A93A)
 * - Subtle inner gloss highlight
 * - Soft glowing shadow for depth
 * - Balanced text hierarchy and micro-letterspacing
 * - Slight press animation scaling
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useExperimentalTheme } from '../hooks/useExperimentalTheme';

export default function PrimaryButton({ title, onPress, style }) {
  const { gradients } = useExperimentalTheme();
  const [scale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.shadowWrapper,
        style,
        { transform: [{ scale }] }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={['#FFE27A', '#E8A93A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.text}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    shadowColor: '#FFD15C',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  gradient: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle inner reflection
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1400',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowRadius: 3,
  },
});
