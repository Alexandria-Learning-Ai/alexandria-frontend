import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { StudentProfileService } from '../services/StudentProfileService';
import { UserService } from '../utils/UserService';
import logger from '../utils/logger';

interface UserProfileData {
  userName: string;
  fullName: string;
  userProfile: any | null;
  profileCompletion: number;
  isLoading: boolean;
}

export const useUserProfile = (): UserProfileData => {
  const [userName, setUserName] = useState<string>('Student');
  const [fullName, setFullName] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const user = auth?.currentUser;
      if (user) {
        try {
          // Use StudentProfileService to get the latest profile data
          const profile = await StudentProfileService.getProfile(user.uid);
          if (profile) {
            // Try different name sources in order of preference
            let fullNameToUse = '';
            if (profile.firstName && profile.lastName) {
              fullNameToUse = `${profile.firstName} ${profile.lastName}`;
            } else if (profile.fullName) {
              fullNameToUse = profile.fullName;
            } else if (profile.name) {
              fullNameToUse = profile.name;
            }

            if (fullNameToUse) {
              setFullName(fullNameToUse);
              setUserName(UserService.getFirstName(fullNameToUse));
              logger.info('📱 HomeScreen: User name loaded:', UserService.getFirstName(fullNameToUse));
            } else {
              setUserName('Student');
              logger.warn('📱 HomeScreen: No name found in profile, using default');
            }
          } else {
            setUserName('Student');
            logger.warn('📱 HomeScreen: No profile found, using default name');
          }
        } catch (error) {
          logger.error('📱 HomeScreen: Error loading profile for greeting:', error);
          setUserName('Student');
        }

        // Check if student profile exists first
        try {
          // Small delay to ensure any concurrent saves are completed
          await new Promise(resolve => setTimeout(resolve, 100));
          const profileStatus = await StudentProfileService.checkProfileStatus(user.uid);

          if (profileStatus.exists) {
            // Profile exists, load full profile
            const studentProfile = await StudentProfileService.getProfile(user.uid);
            setUserProfile(studentProfile);
            if (studentProfile) {
              const completion = StudentProfileService.getProfileCompletionPercentage(studentProfile);
              setProfileCompletion(completion);
            }
          } else {
            // Profile doesn't exist - new user needs to create profile
            logger.info('👤 New user detected - profile needs to be created');
            setUserProfile(null);
            setProfileCompletion(0);
          }
        } catch (profileError) {
          logger.warn('Error loading student profile:', profileError);
          setProfileCompletion(0);
        }
      } else {
        // If no user is logged in, just default to 'Student'
        setUserName('Student');
        setProfileCompletion(0);
      }
    } catch (error) {
      logger.error('Error loading user data:', error);
      setUserName('Student');
      setProfileCompletion(0);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userName,
    fullName,
    userProfile,
    profileCompletion,
    isLoading,
  };
};
