import React from 'react';
import CustomDropdown from '../shared/CustomDropdown';

interface Course {
  key: string;
  name: string;
  code?: string;
  icon: string;
  color: string;
}

interface ProfileCourseSelectorProps {
  userCourses: Course[];
  selectedValue: string;
  onSelect: (course: Course) => void;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  styles?: any;
}

/**
 * ProfileCourseSelector - Dropdown for user's profile courses
 *
 * Features:
 * - Displays user's saved courses from onboarding
 * - Course icons and colors
 * - Modal dropdown interface
 */
const ProfileCourseSelector: React.FC<ProfileCourseSelectorProps> = ({
  userCourses,
  selectedValue,
  onSelect,
  modalVisible,
  setModalVisible,
  styles
}) => {
  const handleSelect = (value: string) => {
    const selectedCourse = userCourses.find(c => c.key === value);
    if (selectedCourse) {
      onSelect(selectedCourse);
    }
  };

  return (
    <CustomDropdown
      value={selectedValue}
      onSelect={handleSelect}
      options={userCourses.map(course => ({
        label: `📚 ${course.name}`,
        value: course.key,
        icon: course.icon,
        color: course.color
      }))}
      placeholder="Choose from your courses"
      modalVisible={modalVisible}
      setModalVisible={setModalVisible}
      icon="graduation-cap"
      styles={styles}
    />
  );
};

export default ProfileCourseSelector;
