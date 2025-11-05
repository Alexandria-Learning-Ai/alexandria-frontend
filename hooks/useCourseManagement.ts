/**
 * useCourseManagement Hook
 * Manages course input, validation, and suggestions
 */

import { useCallback } from 'react';
import { StudentProfileService } from '../services/StudentProfileService';
import logger from '../utils/logger';
import { ProfileData } from './useProfileState';

interface CourseManagementParams {
  courseInput: string;
  profile: ProfileData;
  setCourseInput: (input: string) => void;
  setCourseSuggestions: (suggestions: any[]) => void;
  setCourseValidation: (validation: any) => void;
  setValidatingCourse: (validating: boolean) => void;
  setProfile: (profile: ProfileData | ((prev: ProfileData) => ProfileData)) => void;
}

export const useCourseManagement = (params: CourseManagementParams) => {
  const {
    courseInput,
    profile,
    setCourseInput,
    setCourseSuggestions,
    setCourseValidation,
    setValidatingCourse,
    setProfile,
  } = params;

  /**
   * Handle course input change with suggestions
   */
  const handleCourseInputChange = useCallback(async (text: string) => {
    setCourseInput(text);
    setCourseValidation(null);

    if (text.length > 2) {
      try {
        const suggestions = await StudentProfileService.getCourseSuggestions(text);
        setCourseSuggestions(suggestions);
      } catch (error) {
        logger.warn('Failed to get course suggestions:', error);
        setCourseSuggestions([]);
      }
    } else {
      setCourseSuggestions([]);
    }
  }, [setCourseInput, setCourseValidation, setCourseSuggestions]);

  /**
   * Validate and add course
   */
  const validateAndAddCourse = useCallback(async (courseName: string = courseInput) => {
    if (!courseName.trim()) return;

    setValidatingCourse(true);
    try {
      const validation = await StudentProfileService.validateCourse(courseName.trim());
      setCourseValidation(validation);

      if (validation.valid) {
        const newCourse = {
          id: Date.now().toString(),
          code: courseName.toUpperCase().trim(),
          name: courseName.trim(),
          validated: true
        };
        setProfile(prev => ({
          ...prev,
          courses: [...prev.courses, newCourse]
        }));
        setCourseInput('');
        setCourseSuggestions([]);
        setCourseValidation(null);
      }
    } catch (error) {
      logger.warn('Course validation failed:', error);
      // Add anyway if validation service is down
      const newCourse = {
        id: Date.now().toString(),
        code: courseName.toUpperCase().trim(),
        name: courseName.trim(),
        validated: false
      };
      setProfile(prev => ({
        ...prev,
        courses: [...prev.courses, newCourse]
      }));
      setCourseInput('');
    } finally {
      setValidatingCourse(false);
    }
  }, [courseInput, setValidatingCourse, setCourseValidation, setProfile, setCourseInput, setCourseSuggestions]);

  /**
   * Add course
   */
  const addCourse = useCallback(() => validateAndAddCourse(), [validateAndAddCourse]);

  /**
   * Select course suggestion
   */
  const selectSuggestion = useCallback((suggestion: any) => {
    const courseName = typeof suggestion === 'string' ? suggestion :
      suggestion.name || suggestion.course_name || suggestion.code || '';
    setCourseInput(courseName);
    setCourseSuggestions([]);
    validateAndAddCourse(courseName);
  }, [setCourseInput, setCourseSuggestions, validateAndAddCourse]);

  /**
   * Remove course
   */
  const removeCourse = useCallback((courseId: string) => {
    setProfile(prev => ({
      ...prev,
      courses: prev.courses.filter(course => course.id !== courseId)
    }));
  }, [setProfile]);

  return {
    handleCourseInputChange,
    validateAndAddCourse,
    addCourse,
    selectSuggestion,
    removeCourse,
  };
};
