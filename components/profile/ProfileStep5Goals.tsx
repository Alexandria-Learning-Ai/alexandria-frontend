import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LEARNING_STYLES, PAIN_POINTS } from '../../constants/profileOptions';

interface ProfileStep5GoalsProps {
  profile: any;
  isEditingMode: boolean;
  onProfileChange: (updates: any) => void;
  onFocus: (offset: number) => void;
  onToggleSelection: (field: string, value: string) => void;
}

/**
 * ProfileStep5Goals - Study goals and preferences
 *
 * Features:
 * - Study goals text input
 * - Learning style multi-select
 * - Pain points multi-select
 */
const ProfileStep5Goals: React.FC<ProfileStep5GoalsProps> = ({
  profile,
  isEditingMode,
  onProfileChange,
  onFocus,
  onToggleSelection,
}) => {
  return (
    <Animatable.View animation="slideInRight" style={styles.stepContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <FontAwesome5 name="bullseye" size={32} color="#D4AF37" />
          <Text style={styles.stepTitle}>
            {isEditingMode ? 'Edit Study Goals & Preferences' : 'Study Goals & Preferences'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {isEditingMode ? 'Update your study goals and preferences' : 'Help us personalize your learning experience'}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Study Goals *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.studyGoals}
            onChangeText={(text) => onProfileChange({ studyGoals: text })}
            onFocus={() => onFocus(150)}
            placeholder="e.g. Pass finals with A's, Maintain GPA 3.7+, Prep for MCAT"
            placeholderTextColor="#CBD5E0"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Learning Preferences (Optional)</Text>
          <View style={styles.chipsContainer}>
            {LEARNING_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.chip,
                  profile.learningStyles.includes(style.id) && styles.chipSelected
                ]}
                onPress={() => onToggleSelection('learningStyles', style.id)}
              >
                <FontAwesome5
                  name={style.icon}
                  size={14}
                  color={profile.learningStyles.includes(style.id) ? "#FFFFFF" : "#CBD5E0"}
                />
                <Text style={[
                  styles.chipText,
                  profile.learningStyles.includes(style.id) && styles.chipTextSelected
                ]}>
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Areas You'd Like Help With (Optional)</Text>
          <View style={styles.chipsContainer}>
            {PAIN_POINTS.map((point) => (
              <TouchableOpacity
                key={point.id}
                style={[
                  styles.chip,
                  profile.painPoints.includes(point.id) && styles.chipSelected
                ]}
                onPress={() => onToggleSelection('painPoints', point.id)}
              >
                <FontAwesome5
                  name={point.icon}
                  size={14}
                  color={profile.painPoints.includes(point.id) ? "#FFFFFF" : "#CBD5E0"}
                />
                <Text style={[
                  styles.chipText,
                  profile.painPoints.includes(point.id) && styles.chipTextSelected
                ]}>
                  {point.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8F4E3',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  preferencesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8F4E3',
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  chipSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  chipText: {
    color: '#CBD5E0',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#1A2C5B',
  },
});

export default React.memo(ProfileStep5Goals);
