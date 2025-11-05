/**
 * useProfileNavigation Hook
 * Handles step navigation and form flow
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import NavigationHelper from '../utils/NavigationHelper';
import { ProfileData } from './useProfileState';

interface NavigationParams {
  currentStep: number;
  isEditingMode: boolean;
  editSection: string | null;
  isNewUser: boolean;
  profile: ProfileData;
  availablePrograms: string[];
  validateStep: () => boolean;
  handleSaveSectionEdit: () => Promise<void>;
  handleCompleteProfile: () => Promise<void>;
  handleCompleteProfileSetup: () => Promise<void>;
  setCurrentStep: (step: number) => void;
  setProfile: (profile: ProfileData | ((prev: ProfileData) => ProfileData)) => void;
  setProgramSuggestions: (suggestions: string[]) => void;
  setShowProgramSuggestions: (show: boolean) => void;
  setIsEditingMode: (isEditing: boolean) => void;
  setIsNewUser: (isNew: boolean) => void;
  scrollViewRef: React.RefObject<any>;
  navigation: any;
}

export const useProfileNavigation = (params: NavigationParams) => {
  const {
    currentStep,
    isEditingMode,
    editSection,
    isNewUser,
    profile,
    availablePrograms,
    validateStep,
    handleSaveSectionEdit,
    handleCompleteProfile,
    handleCompleteProfileSetup,
    setCurrentStep,
    setProfile,
    setProgramSuggestions,
    setShowProgramSuggestions,
    setIsEditingMode,
    setIsNewUser,
    scrollViewRef,
    navigation,
  } = params;

  /**
   * Scroll to input field
   */
  const scrollToInput = useCallback((inputOffset: number = 0) => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        const baseOffset = currentStep > 1 ? (currentStep - 1) * 100 : 0;
        const totalOffset = baseOffset + inputOffset;

        scrollViewRef.current.scrollTo({
          y: totalOffset,
          animated: true,
        });
      }, 150);
    }
  }, [currentStep, scrollViewRef]);

  /**
   * Handle next step
   */
  const handleNext = useCallback(() => {
    if (validateStep()) {
      if (isEditingMode) {
        if (editSection && editSection !== 'all') {
          handleSaveSectionEdit();
        } else {
          if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
          } else {
            handleCompleteProfile();
          }
        }
      } else if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleCompleteProfileSetup();
      }
    }
  }, [validateStep, isEditingMode, editSection, currentStep, handleSaveSectionEdit, handleCompleteProfile, handleCompleteProfileSetup, setCurrentStep]);

  /**
   * Handle back
   */
  const handleBack = useCallback(() => {
    if (isEditingMode && editSection && editSection !== 'all') {
      navigation.navigate('ProfileView');
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [isEditingMode, editSection, currentStep, setCurrentStep, navigation]);

  /**
   * Handle back button press
   */
  const handleBackPress = useCallback(() => {
    if (isEditingMode) {
      setIsEditingMode(false);
      setIsNewUser(false);
      setCurrentStep(1);
    } else if (isNewUser && currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (isNewUser && !auth.currentUser) {
      navigation.navigate('SignUp');
    } else if (isNewUser) {
      Alert.alert(
        'Profile Setup Required',
        'You need to complete your profile setup to continue. Are you sure you want to go back?',
        [
          { text: 'Continue Setup', style: 'cancel' },
          {
            text: 'Go Back',
            style: 'destructive',
            onPress: () => NavigationHelper.safeGoBack(navigation)
          }
        ]
      );
    } else {
      NavigationHelper.safeGoBack(navigation);
    }
  }, [isEditingMode, isNewUser, currentStep, setIsEditingMode, setIsNewUser, setCurrentStep, navigation]);

  /**
   * Toggle selection for multi-select fields
   */
  const toggleSelection = useCallback((field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item: string) => item !== value)
        : [...prev[field], value]
    }));
  }, [setProfile]);

  /**
   * Handle program input change with suggestions
   */
  const handleProgramChange = useCallback((text: string) => {
    setProfile(prev => ({ ...prev, program: text }));

    if (text.length > 0 && availablePrograms.length > 0) {
      const filtered = availablePrograms.filter(program =>
        program.toLowerCase().includes(text.toLowerCase())
      );
      setProgramSuggestions(filtered);
      setShowProgramSuggestions(filtered.length > 0 && text !== '');
    } else {
      setShowProgramSuggestions(false);
    }
  }, [availablePrograms, setProfile, setProgramSuggestions, setShowProgramSuggestions]);

  /**
   * Select program from suggestions
   */
  const selectProgram = useCallback((program: string) => {
    setProfile(prev => ({ ...prev, program }));
    setShowProgramSuggestions(false);
  }, [setProfile, setShowProgramSuggestions]);

  /**
   * Update semester when season or year changes
   */
  const updateSemester = useCallback((field: string, value: string) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
      if (updated.semesterSeason && updated.semesterYear) {
        updated.semester = `${updated.semesterSeason} ${updated.semesterYear}`;
      }
      return updated;
    });
  }, [setProfile]);

  return {
    scrollToInput,
    handleNext,
    handleBack,
    handleBackPress,
    toggleSelection,
    handleProgramChange,
    selectProgram,
    updateSemester,
  };
};
