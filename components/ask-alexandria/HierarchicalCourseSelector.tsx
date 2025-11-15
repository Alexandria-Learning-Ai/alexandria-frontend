import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomDropdown from '../shared/CustomDropdown';

interface HierarchicalCourseSelectorProps {
  availableSubjects: string[];
  selectedSubject: string | null;
  availableCourses: string[];
  selectedCourse: string | null;
  onSubjectSelect: (subject: string) => void;
  onCourseSelect: (course: string) => void;
  subjectModalVisible: boolean;
  setSubjectModalVisible: (visible: boolean) => void;
  courseModalVisible: boolean;
  setCourseModalVisible: (visible: boolean) => void;
  HierarchicalSubjectService: any;
  styles: any;
}

/**
 * HierarchicalCourseSelector - Two-step hierarchical subject and course selection
 *
 * Features:
 * - Step 1: Select subject from all available subjects
 * - Step 2: Select course within chosen subject
 * - Selection summary display
 * - Icons and colors from HierarchicalSubjectService
 * - Conditional rendering based on selection state
 */
const HierarchicalCourseSelector: React.FC<HierarchicalCourseSelectorProps> = ({
  availableSubjects,
  selectedSubject,
  availableCourses,
  selectedCourse,
  onSubjectSelect,
  onCourseSelect,
  subjectModalVisible,
  setSubjectModalVisible,
  courseModalVisible,
  setCourseModalVisible,
  HierarchicalSubjectService,
  styles
}) => {
  return (
    <>
      {/* Step 1: Subject Selection */}
      <View style={styles.hierarchicalStep}>
        <Text style={styles.stepLabel}>
          <FontAwesome5 name="book" size={12} color="#D4AF37" /> Step 1: Choose Subject
        </Text>
        <CustomDropdown
          value={selectedSubject || ""}
          onSelect={onSubjectSelect}
          options={availableSubjects.map(subject => ({
            label: `🎓 ${subject}`,
            value: subject,
            icon: HierarchicalSubjectService.getSubjectIcon(subject),
            color: HierarchicalSubjectService.getSubjectColor(subject)
          }))}
          placeholder="Select a subject"
          modalVisible={subjectModalVisible}
          setModalVisible={setSubjectModalVisible}
          icon="book"
          styles={styles}
        />
      </View>

      {/* Step 2: Course Selection */}
      {selectedSubject && availableCourses.length > 0 && (
        <View style={styles.hierarchicalStep}>
          <Text style={styles.stepLabel}>
            <FontAwesome5 name="graduation-cap" size={12} color="#D4AF37" /> Step 2: Choose Course
          </Text>
          <CustomDropdown
            value={selectedCourse || ""}
            onSelect={onCourseSelect}
            options={availableCourses.map(course => ({
              label: `📚 ${course}`,
              value: course,
              icon: 'book-open',
              color: HierarchicalSubjectService.getSubjectColor(selectedSubject)
            }))}
            placeholder={`Choose a course in ${selectedSubject}`}
            modalVisible={courseModalVisible}
            setModalVisible={setCourseModalVisible}
            icon="graduation-cap"
            styles={styles}
          />
        </View>
      )}

      {/* Selection Summary */}
      {selectedSubject && selectedCourse && (
        <View style={styles.selectionSummary}>
          <Text style={styles.summaryText}>
            <FontAwesome5 name="check-circle" size={16} color="#28a745" />
            {` ${selectedSubject} → ${selectedCourse}`}
            
          </Text>
        </View>
      )}
    </>
  );
};

export default HierarchicalCourseSelector;
