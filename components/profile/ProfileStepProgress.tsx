import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileStepProgressProps {
  currentStep: number;
  totalSteps?: number;
}

/**
 * ProfileStepProgress - Progress indicator for profile setup
 *
 * Features:
 * - Shows current step number
 * - Visual progress bar
 * - Responsive to step changes
 */
const ProfileStepProgress: React.FC<ProfileStepProgressProps> = ({
  currentStep,
  totalSteps = 5,
}) => {
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Step {currentStep} of {totalSteps}
      </Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / totalSteps) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressText: {
    color: '#CBD5E0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
});

// Memoized export - only re-renders when step changes
export default React.memo(ProfileStepProgress);
