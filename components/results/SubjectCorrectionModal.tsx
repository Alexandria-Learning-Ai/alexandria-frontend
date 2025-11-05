import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ThemeStyles } from '../../types';

interface SubjectCorrectionModalProps {
  visible: boolean;
  onClose: () => void;
  currentSubject: string;
  onCorrectSubject: (subject: string) => void;
  isDarkMode: boolean;
  submitting: boolean;
}

const SubjectCorrectionModal: React.FC<SubjectCorrectionModalProps> = ({
  visible,
  onClose,
  currentSubject,
  onCorrectSubject,
  isDarkMode,
  submitting,
}) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const availableSubjects = [
    'Computer Science',
    'Mathematics',
    'Psychology',
    'History',
    'Biology',
    'Physics',
    'Chemistry',
    'English',
    'Geography',
    'Art',
    'Music',
    'Medicine',
    'General Knowledge',
  ];

  // Simple theme styles
  const currentThemeStyles: Partial<ThemeStyles> = isDarkMode
    ? {
        modalContainer: { backgroundColor: '#1E1E1E' },
        modalTitle: { color: '#FFFFFF' },
        modalText: { color: '#B0B0B0' },
        optionButton: { backgroundColor: '#2A2A2A', borderColor: '#444444' },
        optionText: { color: '#FFFFFF' },
        cancelButton: { backgroundColor: '#444444' },
        cancelButtonText: { color: '#FFFFFF' },
        submitButton: { backgroundColor: '#D4AF37' },
        submitButtonText: { color: '#FFFFFF' },
        textInput: { backgroundColor: '#2A2A2A', color: '#FFFFFF', borderColor: '#444444' },
        placeholderText: { color: '#666666' },
        inputContainer: { backgroundColor: '#2A2A2A' },
      }
    : {
        modalContainer: { backgroundColor: '#FFFFFF' },
        modalTitle: { color: '#1A1A1A' },
        modalText: { color: '#666666' },
        optionButton: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
        optionText: { color: '#1A1A1A' },
        cancelButton: { backgroundColor: '#E0E0E0' },
        cancelButtonText: { color: '#333333' },
        submitButton: { backgroundColor: '#D4AF37' },
        submitButtonText: { color: '#FFFFFF' },
        textInput: { backgroundColor: '#FFFFFF', color: '#1A1A1A', borderColor: '#E0E0E0' },
        placeholderText: { color: '#999999' },
        inputContainer: { backgroundColor: '#FFFFFF' },
      };

  const handleSubmit = () => {
    const subjectToSubmit = showCustomInput ? customSubject : selectedSubject;
    if (subjectToSubmit.trim()) {
      onCorrectSubject(subjectToSubmit.trim());
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.subjectCorrectionModalOverlay}>
        <View style={[styles.subjectCorrectionModalContainer, currentThemeStyles.modalContainer]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, currentThemeStyles.modalTitle]}>Correct Subject</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <FontAwesome5
                name="times"
                size={20}
                color={(currentThemeStyles.modalTitle as any)?.color || '#333'}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalDescription, currentThemeStyles.modalText]}>
            Alexandria detected "{currentSubject?.replace(/_/g, ' ')}" as the subject. If this is
            wrong, please select the correct subject:
          </Text>

          <ScrollView style={styles.subjectOptions} showsVerticalScrollIndicator={false}>
            {availableSubjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.subjectOption,
                  currentThemeStyles.optionButton,
                  selectedSubject === subject && styles.selectedSubjectOption,
                ]}
                onPress={() => {
                  setSelectedSubject(subject);
                  setShowCustomInput(false);
                  setCustomSubject('');
                }}
              >
                <Text
                  style={[
                    styles.subjectOptionText,
                    currentThemeStyles.optionText,
                    selectedSubject === subject && styles.selectedSubjectOptionText,
                  ]}
                >
                  {subject}
                </Text>
                {selectedSubject === subject && <FontAwesome5 name="check" size={16} color="#00C851" />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.subjectOption,
                currentThemeStyles.optionButton,
                showCustomInput && styles.selectedSubjectOption,
              ]}
              onPress={() => {
                setShowCustomInput(true);
                setSelectedSubject('');
              }}
            >
              <Text
                style={[
                  styles.subjectOptionText,
                  currentThemeStyles.optionText,
                  showCustomInput && styles.selectedSubjectOptionText,
                ]}
              >
                Other (specify)
              </Text>
            </TouchableOpacity>

            {showCustomInput && (
              <View style={[styles.customSubjectInput, currentThemeStyles.inputContainer]}>
                <Text style={[styles.inputLabel, currentThemeStyles.modalText]}>
                  Enter subject:
                </Text>
                <TextInput
                  style={[styles.textInput, currentThemeStyles.textInput]}
                  value={customSubject}
                  onChangeText={setCustomSubject}
                  placeholder="e.g., User Interface Design"
                  placeholderTextColor={(currentThemeStyles.placeholderText as any)?.color || '#999'}
                  autoFocus={true}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalCancelButton, currentThemeStyles.cancelButton]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.modalCancelButtonText, currentThemeStyles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                currentThemeStyles.submitButton,
                (!selectedSubject && !customSubject.trim()) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={submitting || (!selectedSubject && !customSubject.trim())}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.modalSubmitButtonText, currentThemeStyles.submitButtonText]}>
                  Submit Correction
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  subjectCorrectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subjectCorrectionModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  subjectOptions: {
    maxHeight: 300,
    marginBottom: 16,
  },
  subjectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  selectedSubjectOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#00C851',
  },
  subjectOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  selectedSubjectOptionText: {
    fontWeight: '700',
    color: '#00C851',
  },
  customSubjectInput: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  modalSubmitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default SubjectCorrectionModal;
