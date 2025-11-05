/**
 * ProgressBar - Animated reading progress indicator
 *
 * Features:
 * - Thin progress bar at bottom of screen
 * - Smooth width animation based on scroll percentage
 * - Optional percentage text display
 * - Alexandria gold accent color
 * - Positioned absolutely at bottom
 * - Minimal, unobtrusive design
 *
 * @param progress - Reading progress (0-100)
 * @param showPercentage - Whether to show percentage text (default: true)
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, showPercentage = true }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      accent: Colors.accent,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
    }),
    []
  );

  // Animate progress bar width when progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false, // width animation requires false
    }).start();
  }, [progress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Progress Bar Track */}
      <View style={[styles.track, { backgroundColor: `${themeColors.accent}20` }]}>
        {/* Progress Bar Fill */}
        <Animated.View
          style={[
            styles.fill,
            { width: progressWidth, backgroundColor: themeColors.accent },
          ]}
        />
      </View>

      {/* Percentage Text */}
      {showPercentage && (
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentageText, { color: themeColors.textSecondary }]}>
            {Math.round(progress)}% read
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  track: {
    height: 3,
    width: '100%',
  },
  fill: {
    height: '100%',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  percentageContainer: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ProgressBar;
