import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { EDUCATION_LEVELS } from '../../constants/profileOptions';

interface ProfileStep2EducationProps {
  profile: any;
  isEditingMode: boolean;
  onProfileChange: (updates: any) => void;
}

/**
 * ProfileStep2Education - Education level selection
 *
 * Features:
 * - Scrollable education level options
 * - Visual selection indicators
 * - Icon representation for each level
 */
const ProfileStep2Education: React.FC<ProfileStep2EducationProps> = ({
  profile,
  isEditingMode,
  onProfileChange,
}) => {
  return (
    <Animatable.View animation="slideInRight" style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <FontAwesome5 name="graduation-cap" size={32} color="#D4AF37" />
        <Text style={styles.stepTitle}>
          {isEditingMode ? 'Edit Education Level' : 'Education Level'}
        </Text>
        <Text style={styles.stepSubtitle}>
          {isEditingMode ? 'Update your education level' : 'What level are you currently studying at?'}
        </Text>
      </View>

      <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {EDUCATION_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionCard,
              profile.educationLevel === level.id && styles.optionCardSelected
            ]}
            onPress={() => onProfileChange({ educationLevel: level.id })}
          >
            <FontAwesome5
              name={level.icon}
              size={24}
              color={profile.educationLevel === level.id ? "#D4AF37" : "#CBD5E0"}
            />
            <Text style={[
              styles.optionLabel,
              profile.educationLevel === level.id && styles.optionLabelSelected
            ]}>
              {level.label}
            </Text>
            <Text style={styles.optionDescription}>{level.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8F4E3',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#CBD5E0',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#D4AF37',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8F4E3',
    marginTop: 12,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#D4AF37',
  },
  optionDescription: {
    fontSize: 13,
    color: '#CBD5E0',
    textAlign: 'center',
  },
});

export default React.memo(ProfileStep2Education);
