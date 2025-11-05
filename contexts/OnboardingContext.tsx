/**
 * OnboardingContext.tsx
 *
 * Manages first-time user experience with progressive tooltips
 * and onboarding hints that appear only on first use.
 *
 * Features:
 * - Track which onboarding steps the user has completed
 * - Show helpful hints on first visit to each screen
 * - Persist completion state in AsyncStorage
 * - Provide context for any component to check onboarding status
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';

interface OnboardingState {
  firstUpload: boolean;
  firstQuiz: boolean;
  firstResult: boolean;
  firstHistory: boolean;
  firstLeaderboard: boolean;
  firstProfile: boolean;
  welcomeSeen: boolean;
}

interface OnboardingContextType {
  onboardingState: OnboardingState;
  markAsComplete: (step: keyof OnboardingState) => Promise<void>;
  isFirstTime: (step: keyof OnboardingState) => boolean;
  resetOnboarding: () => Promise<void>;
  loading: boolean;
}

const defaultOnboardingState: OnboardingState = {
  firstUpload: false,
  firstQuiz: false,
  firstResult: false,
  firstHistory: false,
  firstLeaderboard: false,
  firstProfile: false,
  welcomeSeen: false,
};

const OnboardingContext = createContext<OnboardingContextType>({
  onboardingState: defaultOnboardingState,
  markAsComplete: async () => {},
  isFirstTime: () => true,
  resetOnboarding: async () => {},
  loading: true,
});

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(defaultOnboardingState);
  const [loading, setLoading] = useState(true);

  // Load onboarding state from AsyncStorage
  // Wait for Firebase auth to initialize before loading
  useEffect(() => {
    let isSubscribed = true; // Subscription flag to prevent stale updates

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isSubscribed) return; // Ignore if unmounted or resubscribed

      if (user) {
        await loadOnboardingState(user);
      } else {
        // Reset to default state when user logs out
        setOnboardingState(defaultOnboardingState);
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  const validateOnboardingState = (data: any): OnboardingState => {
    // Start with defaults
    const validated: OnboardingState = { ...defaultOnboardingState };

    // Only override with valid boolean values
    if (typeof data === 'object' && data !== null) {
      Object.keys(defaultOnboardingState).forEach((key) => {
        if (typeof data[key] === 'boolean') {
          validated[key as keyof OnboardingState] = data[key];
        }
      });
    }

    return validated;
  };

  const loadOnboardingState = async (user: any) => {
    try {
      if (!user || !user.uid || typeof user.uid !== 'string') {
        logger.warn('Invalid user object for onboarding load', { user });
        setLoading(false);
        return;
      }

      const key = `onboarding_${user.uid}`;
      const stored = await AsyncStorage.getItem(key);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const validatedState = validateOnboardingState(parsed);
          setOnboardingState(validatedState);
          logger.info('Onboarding state loaded', validatedState);
        } catch (parseError) {
          logger.error('Error parsing onboarding state:', parseError);
          // Continue with default state
        }
      } else {
        logger.info('New user - onboarding state initialized');
      }

      setLoading(false);
    } catch (error) {
      logger.error('Error loading onboarding state:', error);
      setLoading(false);
    }
  };

  const saveOnboardingState = async (newState: OnboardingState) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.uid || typeof user.uid !== 'string') {
        logger.warn('Cannot save onboarding state: no authenticated user or invalid uid');
        return;
      }

      const key = `onboarding_${user.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(newState));
      logger.info('Onboarding state saved', newState);
    } catch (error) {
      logger.error('Error saving onboarding state:', error);
      // Don't throw - this is a non-critical operation
    }
  };

  const markAsComplete = async (step: keyof OnboardingState) => {
    const newState = {
      ...onboardingState,
      [step]: true,
    };
    // Update state immediately (non-blocking)
    setOnboardingState(newState);
    logger.info(`Onboarding step completed: ${step}`);

    // Save to AsyncStorage asynchronously (non-blocking)
    // Using void to explicitly fire-and-forget
    void saveOnboardingState(newState);
  };

  const isFirstTime = (step: keyof OnboardingState): boolean => {
    return !onboardingState[step];
  };

  const resetOnboarding = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.uid || typeof user.uid !== 'string') {
        logger.warn('Cannot reset onboarding: no authenticated user or invalid uid');
        return;
      }

      const key = `onboarding_${user.uid}`;
      await AsyncStorage.removeItem(key);
      setOnboardingState(defaultOnboardingState);
      logger.info('Onboarding state reset');
    } catch (error) {
      logger.error('Error resetting onboarding:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingState,
        markAsComplete,
        isFirstTime,
        resetOnboarding,
        loading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
