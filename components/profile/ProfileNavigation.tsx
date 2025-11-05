import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

interface ProfileNavigationProps {
  currentStep: number;
  loading: boolean;
  isEditingMode: boolean;
  editSection?: string;
  onBack: () => void;
  onNext: () => void;
}

/**
 * ProfileNavigation - Bottom navigation for profile setup
 *
 * Features:
 * - Back button (hidden on step 1)
 * - Next/Complete button with loading state
 * - Dynamic button text based on step/mode
 * - Gradient styling
 */
const ProfileNavigation: React.FC<ProfileNavigationProps> = ({
  currentStep,
  loading,
  isEditingMode,
  editSection,
  onBack,
  onNext,
}) => {
  const getNextButtonText = () => {
    if (isEditingMode) {
      return editSection && editSection !== 'all' ? 'Save Changes' : 'Save Changes';
    }
    return currentStep === 5 ? 'Complete Setup' : 'Continue';
  };

  const getNextButtonIcon = () => {
    return currentStep === 5 ? 'check' : 'arrow-right';
  };

  return (
    <View style={styles.navigationContainer}>
      {currentStep > 1 && (
        <TouchableOpacity style={styles.backNavButton} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={16} color="#CBD5E0" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.nextButton}
        onPress={onNext}
        disabled={loading}
      >
        <LinearGradient colors={["#D4AF37", "#B8941F"]} style={styles.nextButtonGradient}>
          {loading ? (
            <ActivityIndicator size="small" color="#1A2C5B" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {getNextButtonText()}
              </Text>
              <FontAwesome5
                name={getNextButtonIcon()}
                size={16}
                color="#1A2C5B"
              />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  backButtonText: {
    color: '#CBD5E0',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#1A2C5B',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default React.memo(ProfileNavigation);
