import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import UploadProgressBar from './UploadProgressBar';
import { getStageName, getStageIcon } from '../../hooks/useAsyncQuizGeneration';

interface AsyncQuizProgressProps {
  isVisible: boolean;
  progress: number; // 0-100
  stage: string;
  message: string;
  onCancel?: () => void;
  themeColors: any;
  styles: any;
}

export const AsyncQuizProgress: React.FC<AsyncQuizProgressProps> = ({
  isVisible,
  progress,
  stage,
  message,
  onCancel,
  themeColors,
  styles,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animate progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Interpolate to percentage string for progressWidth
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (!isVisible) return null;

  const getProgressBarStage = (): 'upload' | 'extract' | 'process' | 'generate' => {
    if (stage === 'uploading' || stage === 'queued' || stage === 'hashing') return 'upload';
    if (stage === 'extraction') return 'extract';
    if (stage === 'generation') return 'generate';
    if (stage === 'storing' || stage === 'caching') return 'process';
    return 'upload';
  };

  const getEstimatedTime = (): number => {
    if (progress >= 90) return 5;
    if (progress >= 50) return 15;
    if (progress >= 20) return 30;
    return 45;
  };

  return (
    <View style={asyncProgressStyles.container}>
      {/* Header */}
      <View style={asyncProgressStyles.header}>
        <View style={asyncProgressStyles.headerContent}>
          <View style={asyncProgressStyles.iconBadge}>
            <FontAwesome5
              name={getStageIcon(stage)}
              size={16}
              color="#D4AF37"
            />
          </View>
          <View style={asyncProgressStyles.headerText}>
            <Text style={asyncProgressStyles.title}>
              {getStageName(stage)}
            </Text>
            <Text style={asyncProgressStyles.subtitle}>
              {Math.round(progress)}% complete
            </Text>
          </View>
        </View>

        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={asyncProgressStyles.cancelButton}
            accessibilityLabel="Cancel quiz generation"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <FontAwesome5 name="times" size={14} color="#666666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Message */}
      <Text style={asyncProgressStyles.message}>
        {message}
      </Text>

      {/* Enhanced Progress Bar */}
      <UploadProgressBar
        isVisible={true}
        progressWidth={progressWidth}
        themeColors={themeColors}
        styles={styles} // Ensure UploadProgressBar handles its own internal styling or adapts
        currentStage={getProgressBarStage()}
        progress={progress}
        estimatedTime={getEstimatedTime()}
      />

      {/* Progress Details Grid */}
      <View style={asyncProgressStyles.detailsGrid}>
        <View style={asyncProgressStyles.detailRow}>
          <FontAwesome5 name="clock" size={12} color="#8A95B5" />
          <Text style={asyncProgressStyles.detailText}>
            ~{getEstimatedTime()}s remaining
          </Text>
        </View>

        <View style={asyncProgressStyles.verticalDivider} />

        <View style={asyncProgressStyles.detailRow}>
          <FontAwesome5 name="server" size={12} color="#8A95B5" />
          <Text style={asyncProgressStyles.detailText}>
            Background Processing
          </Text>
        </View>
      </View>

      {/* Info Box (Matching SmartQuizCard Reasoning Box) */}
      <View style={asyncProgressStyles.infoBox}>
        <FontAwesome5 name="info-circle" size={14} color="#D4AF37" style={{ marginTop: 2 }} />
        <Text style={asyncProgressStyles.infoText}>
          You can minimize this screen. We'll notify you when your quiz is ready!
        </Text>
      </View>
    </View>
  );
};

const asyncProgressStyles = StyleSheet.create({
  // --- 3D Lift Card Style ---
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginVertical: 16,
    marginHorizontal: 16, // Consistent margin
    
    // 3D Effect
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)', // Gold tint bottom
    
    // Shadow
    shadowColor: '#1A2C5B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2C5B', // Navy
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A95B5', // Muted Blue/Grey
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Content ---
  message: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
    color: '#1A2C5B', // Navy
    fontWeight: '500',
  },

  // --- Details Grid ---
  detailsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', // Spread nicely
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E0E0E0',
  },

  // --- Info Box ---
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFDF5', // Gold Tint
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5D4037', // Brownish dark text
    flex: 1,
  },
});

export default AsyncQuizProgress;