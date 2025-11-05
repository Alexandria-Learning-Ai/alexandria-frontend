/**
 * CircularProgress - Circular progress indicator
 *
 * Features:
 * - Animated circular progress ring
 * - Percentage display in center
 * - Customizable size, stroke, and colors
 * - Optional custom text style via `percentageStyle`
 * - Alexandria theme styling
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface CircularProgressProps {
  progress: number; // 0.0 to 1.0
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  percentageStyle?: TextStyle; // ✅ New prop
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
  color,
  backgroundColor,
  showPercentage = true,
  percentageStyle, // ✅ Destructure it
}) => {
  const themeColors = useMemo(
    () => ({
      fill: color || Colors.accent,
      background: backgroundColor || Colors.gray300,
      text: Colors.text,
    }),
    [color, backgroundColor]
  );

  // Clamp progress safely between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, isNaN(progress) ? 0 : progress));
  const percentage = Math.round(clampedProgress * 100);

  // Circle geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={themeColors.background}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Foreground ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={themeColors.fill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {showPercentage && (
        <View style={styles.percentageContainer}>
          <Text
            style={[
              styles.percentageText,
              { color: themeColors.text, fontSize: Math.max(8, size * 0.25) },
              percentageStyle, // ✅ Allow custom styling
            ]}
          >
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontWeight: '700',
  },
});

export default CircularProgress;
