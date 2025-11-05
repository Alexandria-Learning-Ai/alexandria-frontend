/**
 * useProfileState Hook
 * Manages all state for profile creation and editing
 */

import { useState, useRef } from 'react';
import { Animated } from 'react-native';

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string;
  birthDateObject: Date | null;
  educationLevel: string;
  year: string;
  semester: string;
  semesterSeason: string;
  semesterYear: string;
  program: string;
  courses: any[];
  studyGoals: string;
  learningStyles: string[];
  painPoints: string[];
  notes: string;
}

export const useProfileState = () => {
  // Basic states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Section-based editing states
  const [editSection, setEditSection] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');

  // Enhanced profile states
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthDate: '',
    birthDateObject: null,
    educationLevel: '',
    year: '',
    semester: '',
    semesterSeason: '',
    semesterYear: '',
    program: '',
    courses: [],
    studyGoals: '',
    learningStyles: [],
    painPoints: [],
    notes: '',
  });

  // Dropdown states
  const [availableYears, setAvailableYears] = useState<any[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [programSuggestions, setProgramSuggestions] = useState<string[]>([]);
  const [showProgramSuggestions, setShowProgramSuggestions] = useState(false);

  // Course input states
  const [courseInput, setCourseInput] = useState('');
  const [courseSuggestions, setCourseSuggestions] = useState<any[]>([]);
  const [courseValidation, setCourseValidation] = useState<any>(null);
  const [validatingCourse, setValidatingCourse] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  return {
    // Basic states
    firstName,
    lastName,
    email,
    loading,
    isNewUser,
    isEditingMode,
    editSection,
    sectionTitle,
    currentStep,
    profile,
    availableYears,
    availablePrograms,
    programSuggestions,
    showProgramSuggestions,
    courseInput,
    courseSuggestions,
    courseValidation,
    validatingCourse,
    fadeAnim,
    scrollViewRef,

    // Setters
    setFirstName,
    setLastName,
    setEmail,
    setLoading,
    setIsNewUser,
    setIsEditingMode,
    setEditSection,
    setSectionTitle,
    setCurrentStep,
    setProfile,
    setAvailableYears,
    setAvailablePrograms,
    setProgramSuggestions,
    setShowProgramSuggestions,
    setCourseInput,
    setCourseSuggestions,
    setCourseValidation,
    setValidatingCourse,
  };
};
