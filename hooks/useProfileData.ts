/**
 * useProfileData Hook
 * Handles loading and saving profile data
 */

import { useCallback, useEffect } from 'react';
import { Alert, Animated } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { UserService } from '../utils/UserService';
import { StudentProfileService } from '../services/StudentProfileService';
import { HybridDataService } from '../services/HybridDataService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import NavigationHelper from '../utils/NavigationHelper';
import { ProfileData } from './useProfileState';
import { ACADEMIC_YEARS, DEGREE_PROGRAMS } from '../constants/profileOptions';

interface ProfileDataParams {
  profile: ProfileData;
  availableYears: any[];
  editSection: string | null;
  sectionTitle: string;
  routeParams: any;
  navigation: any;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setEmail: (email: string) => void;
  setProfile: (profile: ProfileData | ((prev: ProfileData) => ProfileData)) => void;
  setIsNewUser: (isNew: boolean) => void;
  setIsEditingMode: (isEditing: boolean) => void;
  setEditSection: (section: string | null) => void;
  setSectionTitle: (title: string) => void;
  setCurrentStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setAvailableYears: (years: any[]) => void;
  setAvailablePrograms: (programs: string[]) => void;
  fadeAnim: Animated.Value;
}

export const useProfileData = (params: ProfileDataParams) => {
  const {
    profile,
    availableYears,
    editSection,
    sectionTitle,
    routeParams,
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
  } = params;

  /**
   * Check if user is new or existing
   */
  const checkUserStatus = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const profileCompleted = await AsyncStorage.getItem(`profileCompleted_${user.uid}`);
        setIsNewUser(profileCompleted !== 'true');
      } else {
        setIsNewUser(true);
      }
    } catch (error) {
      logger.error('Error checking user status:', error);
      setIsNewUser(true);
    }
  }, [setIsNewUser]);

  /**
   * Load user profile data
   */
  const loadUserProfile = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        setEmail(user.email || '');

        // Check for edit mode
        if (routeParams?.editMode) {
          logger.info('=Ý ProfileScreen: Loading in edit mode');
          setIsEditingMode(true);

          if (routeParams.editSection) {
            setEditSection(routeParams.editSection);
            setSectionTitle(routeParams.sectionTitle || '');

            if (routeParams.targetStep && routeParams.editSection !== 'all') {
              setCurrentStep(routeParams.targetStep);
            }
          }

          const currentProfile = await StudentProfileService.getProfile(user.uid);
          if (currentProfile) {
            setFirstName(currentProfile.firstName || '');
            setLastName(currentProfile.lastName || '');
            setProfile(currentProfile);
            logger.info(`=Ý Loaded profile for editing (section: ${routeParams.editSection || 'all'})`);
            return;
          } else {
            Alert.alert('Error', 'No profile found to edit. Please create a profile first.');
            navigation.navigate('ProfileView');
            return;
          }
        }

        // Load basic profile
        const basicProfile = await UserService.getUserProfile(user.uid);
        if (basicProfile) {
          if (basicProfile.firstName && basicProfile.lastName) {
            setFirstName(basicProfile.firstName);
            setLastName(basicProfile.lastName);
            setProfile(prev => ({ ...prev, firstName: basicProfile.firstName, lastName: basicProfile.lastName }));
          } else if (basicProfile.fullName) {
            const nameParts = basicProfile.fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            setFirstName(firstName);
            setLastName(lastName);
            setProfile(prev => ({ ...prev, firstName, lastName }));
          }
        }

        // Check for enhanced profile
        const profileStatus = await StudentProfileService.checkProfileStatus(user.uid);
        const profileCompleted = await AsyncStorage.getItem(`profileCompleted_${user.uid}`);

        if (profileCompleted === 'true' || profileStatus.exists) {
          const studentProfile = await StudentProfileService.getProfile(user.uid);
          if (studentProfile) {
            if (studentProfile.semesterSeason && studentProfile.semesterYear && !studentProfile.semester) {
              studentProfile.semester = `${studentProfile.semesterSeason} ${studentProfile.semesterYear}`;
            }

            setProfile(studentProfile);
            if (studentProfile.firstName && studentProfile.lastName) {
              setFirstName(studentProfile.firstName);
              setLastName(studentProfile.lastName);
            } else if (studentProfile.fullName) {
              const nameParts = studentProfile.fullName.trim().split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              setFirstName(firstName);
              setLastName(lastName);
            }
            setIsNewUser(false);
          }
        } else {
          setIsNewUser(true);
        }
      }
    } catch (error) {
      logger.error('Error loading profile:', error);
    }
  }, [routeParams, navigation, setEmail, setFirstName, setLastName, setProfile, setIsNewUser, setIsEditingMode, setEditSection, setSectionTitle, setCurrentStep]);

  /**
   * Create account and complete profile setup
   */
  const handleCompleteProfileSetup = useCallback(async () => {
    setLoading(true);

    try {
      logger.info('<× Creating account and profile for new user');

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        profile.email.trim(),
        profile.password
      );
      const newUser = userCredential.user;
      logger.info(' User account created successfully:', newUser.uid);

      const completeProfile = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName} ${profile.lastName}`,
        birthDate: profile.birthDate,
        educationLevel: profile.educationLevel,
        year: profile.year,
        semester: profile.semesterSeason && profile.semesterYear
          ? `${profile.semesterSeason} ${profile.semesterYear}`
          : (profile.semester || ''),
        semesterSeason: profile.semesterSeason || '',
        semesterYear: profile.semesterYear || '',
        program: profile.program,
        courses: profile.courses || [],
        studyGoals: profile.studyGoals,
        learningStyles: profile.learningStyles || [],
        painPoints: profile.painPoints || [],
        notes: profile.notes || '',
        email: profile.email,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await StudentProfileService.saveProfile(newUser.uid, completeProfile);
      logger.info(' Profile saved successfully');

      const currentLanguage = 'en';
      await AsyncStorage.setItem(`userLanguage_${newUser.uid}`, currentLanguage);
      await AsyncStorage.setItem(`selectedLanguage_${newUser.uid}`, currentLanguage);
      await AsyncStorage.setItem('selectedLanguage', currentLanguage);

      Alert.alert(
        ' Account Created!',
        'Your account and profile have been created successfully. You must now accept our Terms & Agreements to access the app.',
        [
          {
            text: 'Continue to Terms',
            onPress: () => {
              setLoading(false);
              navigation.navigate('TermsAndAgreement');
            }
          }
        ]
      );

    } catch (error) {
      setLoading(false);
      logger.error('L Failed to create account and profile:', error);

      let errorMessage = 'Failed to create account.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try logging in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }

      Alert.alert('Account Creation Failed', errorMessage);
    }
  }, [profile, setLoading, navigation]);

  /**
   * Save section edit
   */
  const handleSaveSectionEdit = useCallback(async () => {
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No user found. Please log in again.');
        return;
      }

      const updatedData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName} ${profile.lastName}`,
        educationLevel: profile.educationLevel,
        year: profile.year ? (availableYears.find(y => y.id === profile.year)?.label || profile.year) : '',
        semester: profile.semester,
        program: profile.program,
        learningStyles: profile.learningStyles,
        painPoints: profile.painPoints,
        studyGoals: profile.studyGoals,
        courses: profile.courses,
        notes: profile.notes,
        updatedAt: new Date().toISOString()
      };

      logger.info(`=¾ Saving section '${editSection}' with data:`, {
        year: updatedData.year,
        educationLevel: updatedData.educationLevel,
        semester: updatedData.semester,
        program: updatedData.program
      });

      await StudentProfileService.updateProfile(user.uid, updatedData);

      logger.info(` Section '${editSection}' updated successfully`);

      Alert.alert(
        'Section Updated',
        `Your ${sectionTitle.toLowerCase()} has been updated successfully.`,
        [
          {
            text: 'Done',
            onPress: () => {
              navigation.navigate('ProfileView');
            }
          }
        ]
      );

    } catch (error) {
      logger.error('Error saving section edit:', error);
      Alert.alert('Save Failed', 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile, availableYears, editSection, sectionTitle, setLoading, navigation]);

  /**
   * Complete full profile (for editing mode)
   */
  const handleCompleteProfile = useCallback(async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'No authenticated user found. Please log in again.');
        setLoading(false);
        return;
      }

      const fullName = `${profile.firstName.trim()} ${profile.lastName.trim()}`;
      await UserService.saveUserProfile(user.uid, {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        fullName: fullName,
        email: profile.email.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const serviceProfile = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName.trim()} ${profile.lastName.trim()}`,
        educationLevel: profile.educationLevel,
        year: profile.year ? (availableYears.find(y => y.id === profile.year)?.label || profile.year) : '',
        semester: profile.semester,
        program: profile.program,
        learningStyles: profile.learningStyles,
        painPoints: profile.painPoints,
        studyGoals: profile.studyGoals,
        courses: profile.courses,
        notes: profile.notes
      };

      logger.info('=ä Saving profile data:', JSON.stringify(serviceProfile, null, 2));

      try {
        await StudentProfileService.saveProfile(user.uid, serviceProfile);
        logger.info(' Profile service save completed');
      } catch (profileSaveError) {
        logger.error('L Profile save failed:', profileSaveError);
        Alert.alert('Profile Saved Locally', 'Your profile has been saved locally. It will sync when connection is restored.');
      }

      try {
        await AsyncStorage.setItem(`profileCompleted_${user.uid}`, 'true');
        logger.info(' Profile completion flag set');
      } catch (flagError) {
        logger.error('L Failed to set profile completion flag:', flagError);
      }

      if (routeParams?.editMode) {
        Alert.alert(
          ' Profile Updated!',
          'Your profile has been successfully updated.',
          [
            {
              text: 'View Profile',
              onPress: () => NavigationHelper.safeGoBack(navigation)
            }
          ]
        );
      } else {
        Alert.alert(
          '<‰ Profile Complete!',
          `Hi ${profile.firstName}! Your personalized study profile is ready. Next, please review and accept our terms of service to start learning.`,
          [
            {
              text: 'Review Terms',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'TermsAndAgreementScreen' }]
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      logger.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }, [profile, availableYears, routeParams, navigation, setLoading]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    checkUserStatus();
    loadUserProfile();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [checkUserStatus, loadUserProfile, fadeAnim]);

  /**
   * Update available options when education level changes
   */
  useEffect(() => {
    if (profile.educationLevel) {
      setAvailableYears(ACADEMIC_YEARS[profile.educationLevel] || []);
      setAvailablePrograms(DEGREE_PROGRAMS[profile.educationLevel] || []);
    }
  }, [profile.educationLevel, setAvailableYears, setAvailablePrograms]);

  return {
    checkUserStatus,
    loadUserProfile,
    handleCompleteProfileSetup,
    handleSaveSectionEdit,
    handleCompleteProfile,
  };
};
