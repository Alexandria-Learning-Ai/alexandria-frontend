import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { SEMESTER_SEASONS, generateYearOptions } from '../../constants/profileOptions';
import AcademicDropdown from '../shared/AcademicDropdown';

interface ProfileStep3AcademicProps {
  profile: any;
  isEditingMode: boolean;
  availableYears: any[];
  availablePrograms: any[];
  programSuggestions: any[];
  showProgramSuggestions: boolean;
  onProfileChange: (updates: any) => void;
  onFocus: (offset: number) => void;
  onProgramChange: (text: string) => void;
  onSelectProgram: (program: string) => void;
  onUpdateSemester: (field: string, value: string) => void;
  onShowProgramSuggestions: (show: boolean) => void;
  onSetProgramSuggestions: (suggestions: any[]) => void;
}

/**
 * ProfileStep3Academic - Academic details step
 *
 * Features:
 * - Year/level selection
 * - Semester (season + year)
 * - Degree/program with autocomplete
 */
const ProfileStep3Academic: React.FC<ProfileStep3AcademicProps> = ({
  profile,
  isEditingMode,
  availableYears,
  availablePrograms,
  programSuggestions,
  showProgramSuggestions,
  onProfileChange,
  onFocus,
  onProgramChange,
  onSelectProgram,
  onUpdateSemester,
  onShowProgramSuggestions,
  onSetProgramSuggestions,
}) => {
  return (
    <Animatable.View animation="slideInRight" style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <FontAwesome5 name="calendar-alt" size={32} color="#D4AF37" />
        <Text style={styles.stepTitle}>
          {isEditingMode ? 'Edit Academic Details' : 'Academic Details'}
        </Text>
        <Text style={styles.stepSubtitle}>
          {isEditingMode ? 'Update your academic information' : 'Help us understand your current academic status'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <AcademicDropdown
          label="Year/Level *"
          value={profile.year || ''}
          onSelect={(value) => onProfileChange({ year: value })}
          options={availableYears}
          placeholder="Select your academic year/level"
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Semester *</Text>

          <View style={styles.semesterRow}>
            <View style={styles.semesterColumn}>
              <AcademicDropdown
                label="Season"
                value={profile.semesterSeason || ''}
                onSelect={(value) => onUpdateSemester('semesterSeason', value)}
                options={SEMESTER_SEASONS}
                placeholder="Select season"
              />
            </View>

            <View style={styles.semesterColumn}>
              <AcademicDropdown
                label="Year"
                value={profile.semesterYear || ''}
                onSelect={(value) => onUpdateSemester('semesterYear', value)}
                options={generateYearOptions()}
                placeholder="Select year"
              />
            </View>
          </View>

          {profile.semester && (
            <View style={styles.semesterPreview}>
              <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.semesterPreviewText}>{profile.semester}</Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Degree/Program *</Text>
          <TextInput
            style={styles.input}
            value={profile.program}
            onChangeText={onProgramChange}
            placeholder="Type or select from suggestions below"
            placeholderTextColor="#CBD5E0"
            onFocus={() => {
              onFocus(200);
              if (availablePrograms.length > 0) {
                onSetProgramSuggestions(availablePrograms);
                onShowProgramSuggestions(true);
              }
            }}
          />

          {showProgramSuggestions && programSuggestions.length > 0 && (
            <View style={styles.programSuggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Common Programs:</Text>
              <View style={styles.programSuggestions}>
                {programSuggestions.slice(0, 8).map((program, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.programSuggestionChip}
                    onPress={() => onSelectProgram(program)}
                  >
                    <Text style={styles.programSuggestionText}>{program}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
    marginBottom: 12,
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
  semesterRow: {
    flexDirection: 'row',
    gap: 16,
  },
  semesterColumn: {
    flex: 1,
  },
  semesterPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  semesterPreviewText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  programSuggestionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#CBD5E0',
    marginBottom: 8,
    fontWeight: '600',
  },
  programSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  programSuggestionChip: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  programSuggestionText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default React.memo(ProfileStep3Academic);
