import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface ProfileStep4CoursesProps {
  profile: any;
  isEditingMode: boolean;
  courseInput: string;
  courseSuggestions: any[];
  courseValidation: any;
  validatingCourse: boolean;
  onFocus: (offset: number) => void;
  onCourseInputChange: (text: string) => void;
  onAddCourse: () => void;
  onSelectSuggestion: (suggestion: any) => void;
  onRemoveCourse: (courseId: string) => void;
}

/**
 * ProfileStep4Courses - Current courses management
 *
 * Features:
 * - Course input with validation
 * - Auto-suggestions
 * - Add/remove courses
 * - Visual validation feedback
 */
const ProfileStep4Courses: React.FC<ProfileStep4CoursesProps> = ({
  profile,
  isEditingMode,
  courseInput,
  courseSuggestions,
  courseValidation,
  validatingCourse,
  onFocus,
  onCourseInputChange,
  onAddCourse,
  onSelectSuggestion,
  onRemoveCourse,
}) => {
  return (
    <Animatable.View animation="slideInRight" style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <FontAwesome5 name="book" size={32} color="#D4AF37" />
        <Text style={styles.stepTitle}>
          {isEditingMode ? 'Edit Current Courses' : 'Current Courses'}
        </Text>
        <Text style={styles.stepSubtitle}>
          {isEditingMode ? 'Update your current courses' : 'What courses are you taking this semester?'}
        </Text>
      </View>

      <View style={styles.courseInputContainer}>
        <TextInput
          style={[
            styles.courseInput,
            courseValidation?.valid === false && styles.courseInputError,
            courseValidation?.valid === true && styles.courseInputSuccess
          ]}
          value={courseInput}
          onChangeText={onCourseInputChange}
          onFocus={() => onFocus(100)}
          placeholder="e.g. MATH 301: Linear Algebra II"
          placeholderTextColor="#CBD5E0"
          onSubmitEditing={onAddCourse}
        />
        <TouchableOpacity
          style={[styles.addCourseButton, validatingCourse && styles.addCourseButtonDisabled]}
          onPress={onAddCourse}
          disabled={validatingCourse}
        >
          {validatingCourse ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {courseValidation && !courseValidation.valid && (
        <View style={styles.validationContainer}>
          <FontAwesome5 name="exclamation-triangle" size={14} color="#ff6b7a" />
          <Text style={styles.validationText}>{courseValidation.message}</Text>
        </View>
      )}

      {courseSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggestions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {courseSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => onSelectSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>
                  {typeof suggestion === 'string' ? suggestion :
                    suggestion.name || suggestion.course_name || suggestion.code || 'Course'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.coursesContainer} showsVerticalScrollIndicator={false}>
        {profile.courses.map((course) => (
          <View key={course.id} style={styles.courseChip}>
            <FontAwesome5
              name={course.validated ? "check-circle" : "book-open"}
              size={14}
              color={course.validated ? "#4CAF50" : "#D4AF37"}
            />
            <Text style={styles.courseChipText}>{course.code}</Text>
            <TouchableOpacity onPress={() => onRemoveCourse(course.id)}>
              <FontAwesome5 name="times" size={12} color="#ff6b7a" />
            </TouchableOpacity>
          </View>
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
  courseInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  courseInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8F4E3',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  courseInputError: {
    borderColor: '#ff6b7a',
    backgroundColor: 'rgba(255, 107, 122, 0.1)',
  },
  courseInputSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  addCourseButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCourseButtonDisabled: {
    opacity: 0.5,
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 107, 122, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  validationText: {
    color: '#ff6b7a',
    fontSize: 13,
    flex: 1,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#CBD5E0',
    marginBottom: 8,
    fontWeight: '600',
  },
  suggestionChip: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  suggestionText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '600',
  },
  coursesContainer: {
    flex: 1,
  },
  courseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 12,
  },
  courseChipText: {
    flex: 1,
    color: '#F8F4E3',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default React.memo(ProfileStep4Courses);
