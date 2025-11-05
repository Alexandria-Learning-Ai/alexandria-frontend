import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

interface ThemeColors {
  borderSecondary: string;
  alexandriaGold: string;
  alexandriaBronze: string;
  text: string;
  textSecondary: string;
  [key: string]: string;
}

interface UploadProgressBarProps {
  isVisible: boolean;
  progressWidth: Animated.AnimatedInterpolation<string | number>;
  themeColors: ThemeColors;
  styles: any;
  // New props for real progress tracking
  currentStage?: 'upload' | 'extract' | 'process' | 'generate';
  progress?: number; // 0-100
  estimatedTime?: number; // seconds remaining
}

/**
 * UploadProgressBar - Enhanced multi-stage progress visualization
 *
 * Features:
 * - Multi-stage progress indicator (upload → extract → process → generate)
 * - Real progress percentage display
 * - Estimated time remaining
 * - Stage-specific icons and labels
 * - Gradient progress bar with shimmer effect
 * - Smooth animations between stages
 * - Pulse animation on active stage
 * - Accessibility-compliant with progress announcements
 *
 * Accessibility:
 * - accessibilityLabel for progress status
 * - accessibilityRole for progress bar identification
 * - accessibilityValue for current progress percentage
 * - Live region for progress updates
 */
const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  isVisible,
  progressWidth,
  themeColors,
  styles,
  currentStage = 'upload',
  progress = 0,
  estimatedTime = 0
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [displayProgress, setDisplayProgress] = useState(0);

  const stages = [
    { id: 'upload', label: 'Uploading', icon: 'cloud-upload-alt', color: '#3498db' },
    { id: 'extract', label: 'Extracting', icon: 'file-alt', color: '#9b59b6' },
    { id: 'process', label: 'Processing', icon: 'cogs', color: '#e67e22' },
    { id: 'generate', label: 'Generating', icon: 'magic', color: '#D4AF37' },
  ];

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Shimmer effect
      const shimmer = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      shimmer.start();

      // Pulse effect
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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

      return () => {
        shimmer.stop();
        pulse.stop();
      };
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // Animate progress number changes
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev < progress) {
          return Math.min(prev + 1, progress);
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [progress]);

  const getCurrentStageIndex = () => {
    return stages.findIndex((stage) => stage.id === currentStage);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  if (!isVisible) return null;

  const currentStageData = stages[getCurrentStageIndex()];

  return (
    <Animated.View
      style={[
        enhancedStyles.container,
        { opacity: fadeAnim },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={`Upload progress: ${displayProgress}% complete, ${currentStageData.label}`}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: displayProgress,
        text: `${displayProgress} percent`,
      }}
      accessibilityLiveRegion="polite"
    >
      {/* Stage Indicators */}
      <View style={enhancedStyles.stagesContainer}>
        {stages.map((stage, index) => {
          const isActive = stage.id === currentStage;
          const isComplete = index < getCurrentStageIndex();

          return (
            <View key={stage.id} style={enhancedStyles.stageWrapper}>
              {/* Stage Icon */}
              <Animated.View
                style={[
                  enhancedStyles.stageIcon,
                  {
                    backgroundColor: isComplete
                      ? themeColors.alexandriaGold + '30'
                      : isActive
                      ? stage.color + '30'
                      : 'rgba(248, 244, 227, 0.1)',
                    borderColor: isComplete
                      ? themeColors.alexandriaGold
                      : isActive
                      ? stage.color
                      : 'rgba(248, 244, 227, 0.2)',
                    transform: [{ scale: isActive ? pulseAnim : 1 }],
                  },
                ]}
              >
                <FontAwesome5
                  name={isComplete ? 'check' : stage.icon}
                  size={12}
                  color={
                    isComplete
                      ? themeColors.alexandriaGold
                      : isActive
                      ? stage.color
                      : themeColors.textSecondary
                  }
                  solid={isComplete}
                />
              </Animated.View>

              {/* Stage Label */}
              <Text
                style={[
                  enhancedStyles.stageLabel,
                  {
                    color: isActive
                      ? themeColors.text
                      : isComplete
                      ? themeColors.alexandriaGold
                      : themeColors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {stage.label}
              </Text>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <View
                  style={[
                    enhancedStyles.stageConnector,
                    {
                      backgroundColor: isComplete
                        ? themeColors.alexandriaGold
                        : 'rgba(248, 244, 227, 0.2)',
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Progress Bar Container */}
      <View style={enhancedStyles.progressBarContainer}>
        <View
          style={[
            styles.progressContainer,
            enhancedStyles.progressTrack,
            { backgroundColor: themeColors.borderSecondary },
          ]}
        >
          {/* Animated Progress Bar with Gradient */}
          <Animated.View
            style={[
              styles.progressBar,
              enhancedStyles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          >
            <LinearGradient
              colors={[currentStageData.color, themeColors.alexandriaGold]}
              style={enhancedStyles.progressGradient}
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
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Progress Info */}
        <View style={enhancedStyles.progressInfo}>
          <View style={enhancedStyles.progressPercentage}>
            <Text style={[enhancedStyles.percentageText, { color: themeColors.alexandriaGold }]}>
              {displayProgress}%
            </Text>
          </View>

          {estimatedTime > 0 && (
            <View style={enhancedStyles.estimatedTime}>
              <FontAwesome5 name="clock" size={10} color={themeColors.textSecondary} />
              <Text style={[enhancedStyles.timeText, { color: themeColors.textSecondary }]}>
                {formatTime(estimatedTime)} remaining
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Current Stage Message */}
      <View style={enhancedStyles.statusMessage}>
        <FontAwesome5
          name={currentStageData.icon}
          size={12}
          color={currentStageData.color}
          style={enhancedStyles.statusIcon}
        />
        <Text style={[enhancedStyles.statusText, { color: themeColors.text }]}>
          {currentStageData.label} your content...
        </Text>
      </View>
    </Animated.View>
  );
};

const enhancedStyles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(44, 70, 125, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  stagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  stageWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 2,
  },
  stageLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  stageConnector: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: 1,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
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
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentage: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UploadProgressBar;
