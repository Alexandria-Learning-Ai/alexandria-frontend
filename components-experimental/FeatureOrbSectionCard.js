/**
 * FeatureOrbSectionCard - Alexandria Design System Component (Refined Neutral Version)
 *
 * A lifted background surface for orb buttons.
 * Replaces gold glow with subtle cool highlights and dark depth,
 * giving a premium but balanced feel.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useExperimentalTheme } from '../hooks/useExperimentalTheme';

export default function FeatureOrbSectionCard({ children, style }) {
  const { colors } = useExperimentalTheme();

  return (
    <View style={styles.outerWrapper}>
      <LinearGradient
        colors={[
          'rgba(20, 30, 50, 0.98)', // top — slightly lighter navy
          'rgba(8, 12, 24, 0.98)',  // bottom — deep navy for contrast
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: colors.cardStroke || 'rgba(255,255,255,0.06)',
            backgroundColor: colors.card || 'rgba(15, 23, 42, 0.95)',
          },
          style,
        ]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
    marginTop: 28,
    marginBottom: 48,
    borderRadius: 26,
    // Subtle outer blue-gray glow to separate from background
    shadowColor: '#0A1020',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    // Soft inner depth for lifted “glass panel” feel
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});


