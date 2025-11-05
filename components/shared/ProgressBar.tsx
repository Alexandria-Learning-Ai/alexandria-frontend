/**
 * ProgressBar - Customizable progress indicator
 *
 * Features:
 * - Animated progress transitions
 * - Customizable colors (Alexandria theme)
 * - Optional percentage label
 * - Rounded corners
 * - Smooth fill animation
 *
 * @param progress - Progress value (0.0 to 1.0)
 * @param height - Bar height (default: 8)
 * @param color - Fill color (default: Alexandria gold)
 * @param backgroundColor - Background color (default: gray)
 * @param showPercentage - Show percentage label (default: false)
 * @param animated - Enable animation (default: true)
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ProgressBarProps {
  progress: number; // 0.0 to 1.0
  height?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color,
  backgroundColor,
  showPercentage = false,
  animated = true,
  style,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const themeColors = useMemo(
    () => ({
      fill: color || Colors.accent,
      background: backgroundColor || Colors.gray300,
      text: Colors.text,
    }),
    [color, backgroundColor]
  );

  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 400,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animatedWidth]);

  const fillWidth = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.background,
          {
            height,
            backgroundColor: themeColors.background,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: fillWidth,
              height,
              backgroundColor: themeColors.fill,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>

      {showPercentage && (
        <Text style={[styles.percentageText, { color: themeColors.text }]}>
          {percentage}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  background: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percentageText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProgressBar;
