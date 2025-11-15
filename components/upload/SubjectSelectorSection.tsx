import React from 'react';
import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface ThemeColors {
  alexandriaGold: string;
  text: string;
  textSecondary: string;
  [key: string]: string;
}

interface Subject {
  key: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  source?: string;
}

interface Course {
  id: string;
  key: string;
  name: string;
  icon: string;
  color: string;
}

interface PredefinedSubject {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface SubjectSelectorSectionProps {
  isVisible: boolean;
  selectedSubject: Subject | null;
  userCourses: Course[];
  hasProfileCourses: boolean;
  predefinedSubjects: PredefinedSubject[];
  onSubjectSelect: (subject: Subject) => void;
  onOpenFullSelector: () => void;
  isDisabled: boolean;
  themeColors: ThemeColors;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * SubjectSelectorSection - Subject/course selection interface
 *
 * Features:
 * - User's profile courses displayed first (top 4)
 * - Predefined subjects as quick select options
 * - Full selector button to browse all subjects
 * - Helper text for auto-detection
 * - Vibration feedback on selection
 * - Theme-aware styling
 * - Only shows when files are selected
 */
const SubjectSelectorSection: React.FC<SubjectSelectorSectionProps> = ({
  isVisible,
  selectedSubject,
  userCourses,
  hasProfileCourses,
  predefinedSubjects,
  onSubjectSelect,
  onOpenFullSelector,
  isDisabled,
  themeColors,
  styles,
  t
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        <FontAwesome5 name="tags" size={14} color="#D4AF37" /> {t('upload.documentSubject')}
      </Text>


      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={onOpenFullSelector}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <View style={styles.dropdownContent}>
          <FontAwesome5
            name="tags"
            size={16}
            color="#D4AF37"
            style={styles.dropdownIcon}
          />
          <Text style={[
            styles.dropdownText,
            !selectedSubject && styles.dropdownPlaceholder
          ]}>
            {selectedSubject && selectedSubject.name
              ? `📚 ${selectedSubject.name}`
              : t('upload.browseAllSubjects')
            }
          </Text>
          <FontAwesome5 name="chevron-down" size={14} color="#CBD5E0" />
        </View>
      </TouchableOpacity>

      <Text style={styles.uploadHelper}>
        💡 Manually categorize your document for better progress tracking, or let Alexandria auto-detect the subject
      </Text>
    </View>
  );
};

export default SubjectSelectorSection;
