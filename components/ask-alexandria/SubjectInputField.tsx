import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface SubjectValidation {
  valid: boolean;
  message?: string;
}

interface Subject {
  name: string;
  key?: string;
  type?: string;
}

interface SubjectInputFieldProps {
  value: string;
  onChange: (text: string) => void;
  onBlur: () => void;
  onClear: () => void;
  selectedSubject: Subject | null;
  subjectValidation: SubjectValidation | null;
  validatingSubject: boolean;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * SubjectInputField - Subject/topic text input with validation
 *
 * Features:
 * - Text input for subject/topic entry
 * - Real-time validation indicators
 * - Clear button when text present
 * - Validation on blur
 * - Success/error styling
 * - Loading state during validation
 */
const SubjectInputField: React.FC<SubjectInputFieldProps> = ({
  value,
  onChange,
  onBlur,
  onClear,
  selectedSubject,
  subjectValidation,
  validatingSubject,
  styles,
  t
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        <FontAwesome5 name="book" size={14} color="#D4AF37" /> {t('askAlexandria.subjectTopic')}
      </Text>
      <View style={styles.subjectInputWrapper}>
        <TextInput
          style={[
            styles.input,
            selectedSubject && styles.inputWithSelection,
            subjectValidation?.valid === false && styles.inputError,
            subjectValidation?.valid === true && styles.inputValid
          ]}
          placeholder={
            selectedSubject
              ? `Enter topic within ${selectedSubject.name}...`
              : t('askAlexandria.enterSubjectPlaceholder')
          }
          placeholderTextColor="#CBD5E0"
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          multiline={false}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        {/* Validation indicator */}
        <View style={styles.inputValidationContainer}>
          {validatingSubject && (
            <View style={styles.validationIndicator}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.validatingText}>Validating...</Text>
            </View>
          )}
          {subjectValidation?.valid === true && !validatingSubject && (
            <View style={styles.validationIndicator}>
              <FontAwesome5 name="check-circle" size={16} color="#28a745" />
              <Text style={styles.validationSuccessText}>Valid course!</Text>
            </View>
          )}
          {subjectValidation?.valid === false && !validatingSubject && (
            <View style={styles.validationIndicator}>
              <FontAwesome5 name="exclamation-triangle" size={16} color="#dc3545" />
              <Text style={styles.validationErrorText}>
                {subjectValidation.message || 'Course not recognized'}
              </Text>
            </View>
          )}
        </View>

        {/* Clear button */}
        {(value || selectedSubject) && (
          <TouchableOpacity
            style={styles.clearSubjectInputButton}
            onPress={onClear}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="times-circle" size={16} color="#95A5A6" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SubjectInputField;
