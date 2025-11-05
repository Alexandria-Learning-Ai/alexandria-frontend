import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface CourseSelectionToggleProps {
  mode: 'profile' | 'hierarchical';
  onModeChange: (mode: 'profile' | 'hierarchical') => void;
  userCoursesCount: number;
  availableSubjectsCount: number;
  hasProfileCourses: boolean;
  styles: any;
}

/**
 * CourseSelectionToggle - Toggle between profile courses and hierarchical subjects
 *
 * Features:
 * - Two-button toggle (My Courses / All Subjects)
 * - Shows count for each option
 * - Disables profile option if no courses
 * - Visual active state
 * - Icons for each mode
 */
const CourseSelectionToggle: React.FC<CourseSelectionToggleProps> = ({
  mode,
  onModeChange,
  userCoursesCount,
  availableSubjectsCount,
  hasProfileCourses,
  styles
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        <FontAwesome5 name="graduation-cap" size={14} color="#D4AF37" /> 📚 Course Selection
      </Text>

      <View style={styles.toggleContainer}>
        {/* My Courses Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mode === 'profile' && styles.activeToggle
          ]}
          onPress={() => onModeChange('profile')}
          disabled={!hasProfileCourses}
        >
          <FontAwesome5
            name="user-graduate"
            size={14}
            color={mode === 'profile' ? '#FFFFFF' : (hasProfileCourses ? '#D4AF37' : '#95A5A6')}
          />
          <Text style={[
            styles.toggleText,
            { color: mode === 'profile' ? '#FFFFFF' : (hasProfileCourses ? '#D4AF37' : '#95A5A6') }
          ]}>
            My Courses ({userCoursesCount})
          </Text>
        </TouchableOpacity>

        {/* All Subjects Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mode === 'hierarchical' && styles.activeToggle
          ]}
          onPress={() => onModeChange('hierarchical')}
        >
          <FontAwesome5
            name="sitemap"
            size={14}
            color={mode === 'hierarchical' ? '#FFFFFF' : '#D4AF37'}
          />
          <Text style={[
            styles.toggleText,
            { color: mode === 'hierarchical' ? '#FFFFFF' : '#D4AF37' }
          ]}>
            All Subjects ({availableSubjectsCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CourseSelectionToggle;
