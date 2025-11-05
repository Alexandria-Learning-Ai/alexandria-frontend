/**
 * useProfileValidation Hook
 * Handles all profile form validation
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { ProfileData } from './useProfileState';

interface ValidationParams {
  profile: ProfileData;
  currentStep: number;
  isEditingMode: boolean;
  t: (key: string) => string;
}

export const useProfileValidation = ({ profile, currentStep, isEditingMode, t }: ValidationParams) => {
  /**
   * Validate current step
   */
  const validateStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        if (!profile.firstName.trim() || !profile.lastName.trim()) {
          Alert.alert(t('profile.validation.required'), 'Please enter both your first and last name.');
          return false;
        }

        // Email/Password validation (only for new users, not editing mode)
        if (!isEditingMode) {
          if (!profile.email.trim()) {
            Alert.alert('Email Required', 'Please enter your email address.');
            return false;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(profile.email.trim())) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return false;
          }

          if (!profile.password.trim()) {
            Alert.alert('Password Required', 'Please create a password.');
            return false;
          }
          if (profile.password.length < 6) {
            Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
            return false;
          }
        }

        // Enhanced birthday validation
        if (!profile.birthDate || !profile.birthDate.trim()) {
          Alert.alert('Birthday Required', 'Please select or enter your birth date.');
          return false;
        }

        break;
      case 2:
        if (!profile.educationLevel) {
          Alert.alert(t('profile.validation.required'), t('profile.validation.educationRequired'));
          return false;
        }
        break;
      case 3:
        if (!profile.year || !profile.semesterSeason || !profile.semesterYear || !profile.program.trim()) {
          Alert.alert(t('profile.validation.required'), 'Please complete all academic details: Year/Level, Current Semester, and Degree/Program.');
          return false;
        }
        break;
      case 4:
        if (profile.courses.length === 0) {
          Alert.alert(t('profile.validation.required'), t('profile.validation.coursesRequired'));
          return false;
        }
        break;
      case 5:
        if (!profile.studyGoals.trim()) {
          Alert.alert(t('profile.validation.required'), t('profile.validation.goalsRequired'));
          return false;
        }
        break;
    }
    return true;
  }, [profile, currentStep, isEditingMode, t]);

  return {
    validateStep,
  };
};
