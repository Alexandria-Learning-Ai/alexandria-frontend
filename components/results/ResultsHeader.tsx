import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import SafeBackButton from '../SafeBackButton';
import { ThemeStyles, Performance } from '../../types';

interface ResultsHeaderProps {
  performance: Performance;
  celebrationScale: Animated.Value;
  themeStyles: ThemeStyles;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  performance,
  celebrationScale,
  themeStyles,
}) => {
  return (
    <Animatable.View animation="fadeInDown" duration={800} style={styles.headerContainer}>
      <SafeBackButton
        style={[styles.backButton, themeStyles.backButton]}
        color={(themeStyles.backButtonText as any)?.color || '#1A2C5B'}
        size={20}
      />
      <Animatable.View animation="fadeIn" delay={300} style={styles.titleSection}>
        <Animated.View
          style={[
            styles.titleIcon,
            themeStyles.titleIcon,
            { transform: [{ scale: celebrationScale }] },
          ]}
        >
          <FontAwesome5
            name={performance.icon || 'check-circle'}
            size={32}
            color={performance.color || '#D4AF37'}
          />
        </Animated.View>
        <Text style={[styles.title, themeStyles.title]}>Quiz Results</Text>
        <Text style={[styles.subtitle, themeStyles.subtitle]}>
          Your learning progress summary
        </Text>
      </Animatable.View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  titleSection: {
    alignItems: 'center',
  },
  titleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default ResultsHeader;
