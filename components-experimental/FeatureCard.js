/**
 * FeatureCard - Alexandria Design System Component
 *
 * Elegant horizontal feature card for HomeScreen actions.
 * Matches mockup aesthetics: navy background, soft stroke,
 * subtle glow, gold accent icon, and balanced layout.
 *
 * Visual Specs:
 * - Background: #111A2B (deep navy)
 * - Border: rgba(255,255,255,0.08)
 * - Radius: 18–20px
 * - Padding: 20px
 * - Min height: 120px
 * - Icon: 48px, gradient gold accent
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useExperimentalTheme } from '../hooks/useExperimentalTheme';

export default function FeatureCard({ title, subtitle, metadata, icon, onPress }) {
  const { colors } = useExperimentalTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card || '#111A2B',
          borderColor: colors.cardStroke || 'rgba(255,255,255,0.08)',
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left Side — Text Section */}
        <View style={styles.textSection}>
          <Text style={[styles.title, { color: colors.text || '#FFFFFF' }]}>
            {title}
          </Text>

          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textDim || 'rgba(255,255,255,0.7)' }]}>
              {subtitle}
            </Text>
          ) : null}

          {metadata ? (
            <Text style={[styles.metadata, { color: colors.textMute || 'rgba(255,255,255,0.5)' }]}>
              {metadata}
            </Text>
          ) : null}
        </View>

        {/* Right Side — Icon Section */}
        {icon ? (
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={['#FFD15C', '#E8A93A']} // gold gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBackground}
            >
              <FontAwesome5 name={icon} size={28} color="#111A2B" />
            </LinearGradient>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '40%',
    minHeight: 60,
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    // Soft shadow / glow
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  textSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  metadata: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 16,
    alignItems: 'column',
    justifyContent: 'flex-end',
  },
  iconBackground: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
