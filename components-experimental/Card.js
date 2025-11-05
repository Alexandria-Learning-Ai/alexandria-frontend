/**
 * Card - Alexandria Design System Component
 *
 * Features:
 * - Subtle navy background (#111A2B)
 * - Soft shadow / glow effect
 * - Rounded corners (16px)
 * - Delicate border stroke
 * - Optional touch functionality
 *
 * @param {ReactNode} children - Card content
 * @param {object} style - Optional custom styles
 * @param {function} onPress - Optional press handler
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useExperimentalTheme } from '../hooks/useExperimentalTheme';

export default function Card({ children, style, onPress }) {
  const { colors } = useExperimentalTheme();

  const cardStyle = [
    styles.base,
    {
      backgroundColor: colors.card || '#111A2B',
      borderColor: colors.cardStroke || 'rgba(255,255,255,0.08)',
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    // Soft shadow and glow
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
