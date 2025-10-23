import React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/ProfileScreenStyles';
import { useProfileState } from '../hooks/useProfileState';
import { useProfileData } from '../hooks/useProfileData';
import { useProfileValidation } from '../hooks/useProfileValidation';
import { useCourseManagement } from '../hooks/useCourseManagement';
import { useProfileNavigation } from '../hooks/useProfileNavigation';
import ProfileStepProgress from '../components/profile/ProfileStepProgress';
import ProfileStep1PersonalInfo from '../components/profile/ProfileStep1PersonalInfo';
import ProfileStep2Education from '../components/profile/ProfileStep2Education';
import ProfileStep3Academic from '../components/profile/ProfileStep3Academic';
import ProfileStep4Courses from '../components/profile/ProfileStep4Courses';
import ProfileStep5Goals from '../components/profile/ProfileStep5Goals';
import ProfileNavigation from '../components/profile/ProfileNavigation';

export default function ProfileScreen({ navigation, route }) {
  const { t } = useTranslation();

  // State management hook
  const {
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
  } = useProfileState();

  // Profile data hook
  const {
    handleCompleteProfileSetup,
    handleSaveSectionEdit,
    handleCompleteProfile,
  } = useProfileData({
    profile,
    availableYears,
    editSection,
    sectionTitle,
    routeParams: route?.params,
    navigation,
    setFirstName,
    setLastName,
    setEmail,
    setProfile,
    setIsNewUser,
    setIsEditingMode,
    setEditSection,
    setSectionTitle,
    setCurrentStep,
    setLoading,
    setAvailableYears,
    setAvailablePrograms,
    fadeAnim,
  });

  // Validation hook
  const { validateStep } = useProfileValidation({
    profile,
    currentStep,
    isEditingMode,
    t,
  });

  // Course management hook
  const {
    handleCourseInputChange,
    addCourse,
    selectSuggestion,
    removeCourse,
  } = useCourseManagement({
    courseInput,
    profile,
    setCourseInput,
    setCourseSuggestions,
    setCourseValidation,
    setValidatingCourse,
    setProfile,
  });

  // Navigation hook
  const {
    scrollToInput,
    handleNext,
    handleBack,
    handleBackPress,
    toggleSelection,
    handleProgramChange,
    selectProgram,
    updateSemester,
  } = useProfileNavigation({
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
  });

  // Helper to update profile state
  const handleProfileChange = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProfileStep1PersonalInfo
            profile={profile}
            isEditingMode={isEditingMode}
            onProfileChange={handleProfileChange}
            onFocus={scrollToInput}
          />
        );
      case 2:
        return (
          <ProfileStep2Education
            profile={profile}
            isEditingMode={isEditingMode}
            onProfileChange={handleProfileChange}
          />
        );
      case 3:
        return (
          <ProfileStep3Academic
            profile={profile}
            isEditingMode={isEditingMode}
            availableYears={availableYears}
            availablePrograms={availablePrograms}
            programSuggestions={programSuggestions}
            showProgramSuggestions={showProgramSuggestions}
            onProfileChange={handleProfileChange}
            onFocus={scrollToInput}
            onProgramChange={handleProgramChange}
            onSelectProgram={selectProgram}
            onUpdateSemester={updateSemester}
            onShowProgramSuggestions={setShowProgramSuggestions}
            onSetProgramSuggestions={setProgramSuggestions}
          />
        );
      case 4:
        return (
          <ProfileStep4Courses
            profile={profile}
            isEditingMode={isEditingMode}
            courseInput={courseInput}
            courseSuggestions={courseSuggestions}
            courseValidation={courseValidation}
            validatingCourse={validatingCourse}
            onFocus={scrollToInput}
            onCourseInputChange={handleCourseInputChange}
            onAddCourse={addCourse}
            onSelectSuggestion={selectSuggestion}
            onRemoveCourse={removeCourse}
          />
        );
      case 5:
        return (
          <ProfileStep5Goals
            profile={profile}
            isEditingMode={isEditingMode}
            onProfileChange={handleProfileChange}
            onFocus={scrollToInput}
            onToggleSelection={toggleSelection}
          />
        );
      default:
        return (
          <ProfileStep1PersonalInfo
            profile={profile}
            isEditingMode={isEditingMode}
            onProfileChange={handleProfileChange}
            onFocus={scrollToInput}
          />
        );
    }
  };

  return (
    <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={true}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Setup Your Profile</Text>
            <View style={styles.placeholder} />
          </View>

          <ProfileStepProgress currentStep={currentStep} />

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
            nestedScrollEnabled={false}
            removeClippedSubviews={false}
          >
            {renderCurrentStep()}
          </ScrollView>

          <ProfileNavigation
            currentStep={currentStep}
            loading={loading}
            isEditingMode={isEditingMode}
            editSection={editSection}
            onBack={handleBack}
            onNext={handleNext}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
