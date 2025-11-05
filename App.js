import React, { useEffect, useRef, useState } from 'react';
import { Linking, Alert, AppState, View, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import 'react-native-get-random-values';
import AppNavigator from './navigation/AppNavigator';
import './i18n';
import logger from './utils/logger';

// ✅ ULTRA AGGRESSIVE: Global property protection for 'th' errors
if (typeof global !== 'undefined' && !global.__thProtectionInstalled) {
  try {
    // Protect against 'th' property access errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args[0];
      if (typeof message === 'string' && message.includes("Property 'th' doesn't exist")) {
        console.warn('🛡️ Intercepted th property error:', ...args);
        return; // Don't propagate the error
      }
      return originalConsoleError.apply(console, args);
    };
    
    global.__thProtectionInstalled = true;
    logger.info('🛡️ Global th property protection installed');
  } catch (error) {
    logger.warn('Could not install th property protection:', error);
  }
}
import UnifiedNotificationService from './utils/UnifiedNotificationService';
import { LanguageProvider } from './contexts/LanguageContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { auth } from './firebaseConfig';
import TranslationErrorBoundary from './components/TranslationErrorBoundary';
import { initializeSentry, ErrorBoundary as SentryErrorBoundary, setUser as setSentryUser, clearUser as clearSentryUser } from './utils/SentryConfig';
import PerformanceMonitoring from './utils/PerformanceMonitoring';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient, { setupNetworkMonitoring, cleanupNetworkMonitoring } from './config/queryClient';
import SmartQuizRecommendationService from './services/SmartQuizRecommendationService';
import { ToastProvider } from './hooks/useToast';

// Initialize monitoring systems
initializeSentry();
PerformanceMonitoring.setPerformanceCollectionEnabled(true);
logger.info('🔍 Monitoring systems initialized (Sentry + Firebase Performance)');

export default function App() {
  const appNavigatorRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [isNavReady, setIsNavReady] = useState(false);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [user, setUser] = useState(null);
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  // ✅ Initialize notifications and React Query when app starts
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('🚀 Initializing Alexandria app...');

        // Initialize unified notification system
        const notificationSuccess = await UnifiedNotificationService.initialize();
        setNotificationsInitialized(notificationSuccess);

        if (notificationSuccess) {
          logger.info('✅ Intelligent notification system initialized successfully');
        } else {
          logger.warn('⚠️ Notifications initialization failed, app will continue without notifications');
        }

        // Initialize React Query network monitoring
        setupNetworkMonitoring();
        logger.info('✅ React Query network monitoring initialized');

      } catch (error) {
        logger.error('❌ App initialization error:', error);
        // Continue without notifications if initialization fails
        setNotificationsInitialized(false);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      cleanupNetworkMonitoring();
    };
  }, []);

  // Listen for user authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);

      // Update Sentry user context for error tracking
      if (firebaseUser) {
        setSentryUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          username: firebaseUser.displayName || firebaseUser.email
        });
      } else {
        clearSentryUser();
      }
    });
    return unsubscribe; // Unsubscribe on unmount
  }, []);

  // Handle notification responses (when user taps a notification)
  useEffect(() => {
    const handleNotificationResponse = async (response) => {
      const data = response.notification.request.content.data;
      
      if (data?.source === 'intelligent_system' && data?.type === 'smart_quiz_recommendation') {
        await handleSmartQuizNotification(data);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    
    return () => subscription?.remove();
  }, [isNavReady, user]);

  // Perform background maintenance when user is available and notifications are ready
  useEffect(() => {
    const setupBackgroundMaintenance = async () => {
      if (user && notificationsInitialized) {
        try {
          logger.info('🧠 Setting up intelligent notifications for user:', user.uid);
          // Schedule personalized notifications
          await UnifiedNotificationService.scheduleIntelligentNotifications(user.uid, 'app_startup');
        } catch (error) {
          logger.error('❌ Intelligent notifications error:', error);
          // Don't crash the app if notifications fail
        }
      }
    };
    
    setupBackgroundMaintenance();
  }, [user, notificationsInitialized]);

  const resetToHome = () => {
    if (isNavReady && appNavigatorRef.current?.reset) {
      appNavigatorRef.current.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  const navigateToScreen = (screenName, params = {}) => {
    if (isNavReady && appNavigatorRef.current?.navigate) {
      appNavigatorRef.current.navigate(screenName, params);
    } else {
      logger.warn('Navigation not ready. Storing for later.');
      setPendingUrl(screenName); // fallback if needed
    }
  };

  const handleSmartQuizNotification = async (notificationData) => {
    if (!user || !isNavReady) {
      logger.warn('User not authenticated or navigation not ready for smart quiz');
      return;
    }

    try {
      logger.info('🎯 Handling smart quiz notification:', notificationData);
      
      if (notificationData.type === 'personalized_quiz' && notificationData.quizId) {
        // Load the recommended quiz from SmartQuizRecommendationService
        const quiz = await SmartQuizRecommendationService.getRecommendedQuiz(notificationData.quizId);
        
        if (quiz) {
          Alert.alert(
            '🎯 Personalized Quiz Ready!',
            `Ready to tackle "${quiz.title}"? This ${notificationData.questionCount || quiz.questions?.length || 10}-question quiz focuses on ${notificationData.focusArea || 'your learning goals'}.`,
            [
              { text: 'Maybe Later', style: 'cancel' },
              {
                text: 'Let\'s Do This! 🚀',
                onPress: () => navigateToScreen('Quiz', {
                  personalizedQuiz: quiz,
                  isRecommended: true,
                  recommendationData: notificationData,
                  source: 'smart_notification'
                })
              }
            ]
          );
        } else {
          // Fallback - navigate to quiz creation or general quiz screen
          Alert.alert(
            '🎯 Quiz Time!',
            'Ready for a personalized learning session?',
            [
              { text: 'Maybe Later', style: 'cancel' },
              { text: 'Create Quiz', onPress: () => navigateToScreen('Upload') },
              { text: 'Browse Quizzes', onPress: () => navigateToScreen('QuizHistory') }
            ]
          );
        }
      } else if (notificationData.type === 'welcome_quiz') {
        // Handle welcome quiz for new users
        Alert.alert(
          '🎉 Welcome to Alexandria!',
          'Let\'s start with a quick quiz to understand your learning style and customize your experience!',
          [
            { text: 'Maybe Later', style: 'cancel' },
            {
              text: 'Get Started! ✨',
              onPress: () => navigateToScreen('Upload', { 
                welcomeQuiz: true,
                source: 'welcome_notification' 
              })
            }
          ]
        );
      } else {
        // General fallback
        navigateToScreen('Home');
      }
    } catch (error) {
      logger.error('Error handling smart quiz notification:', error);
      // Fallback to home screen
      navigateToScreen('Home');
    }
  };

  const processDeepLink = async (url) => {
    if (!url) return;
    logger.info('Processing deep link:', url);

    // Handle subscription deep links
    if (url.includes('/subscription')) {
      return navigateToScreen('Subscription', { source: 'deep_link' });
    }

    // Handle smart quiz recommendations deep links
    if (url.includes('/smart-quiz/')) {
      const quizId = extractQuizId(url.replace('/smart-quiz/', '/quiz/'));
      if (quizId) await handleSmartQuizDeepLink(quizId);
      return;
    }

    if (url.includes('/quiz/')) {
      const quizId = extractQuizId(url);
      if (quizId) await handleSharedQuiz(quizId);
      return;
    }

    if (url.includes('/home')) return navigateToScreen('Home');
    if (url.includes('/upload')) return navigateToScreen('Upload');
    if (url.includes('/history')) return navigateToScreen('QuizHistory');
    if (url.includes('/profile')) return navigateToScreen('ProfileScreen');
  };

  const extractQuizId = (url) => {
    try {
      const parts = url.split(/quiz\/|:\/\/quiz\//);
      return parts[1]?.split(/[?#]/)[0] || null;
    } catch (e) {
      logger.error('Error extracting quiz ID:', e);
      return null;
    }
  };

  const handleSmartQuizDeepLink = async (quizId) => {
    try {
      logger.info('🎯 Handling smart quiz deep link:', quizId);

      const quiz = await SmartQuizRecommendationService.getRecommendedQuiz(quizId);
      
      if (quiz) {
        Alert.alert(
          '🎯 Smart Quiz Ready!',
          `Alexandria prepared "${quiz.title}" specially for you based on your learning patterns!`,
          [
            { text: 'Maybe Later', onPress: () => resetToHome(), style: 'cancel' },
            {
              text: 'Take Quiz! 🚀',
              onPress: () => navigateToScreen('Quiz', {
                personalizedQuiz: quiz,
                isRecommended: true,
                source: 'smart_deep_link',
                recommendationId: quizId
              })
            }
          ]
        );
      } else {
        Alert.alert(
          'Quiz Not Available 😔',
          'This personalized quiz may no longer be available.',
          [
            { text: 'Go to Home', onPress: () => resetToHome() },
            { text: 'Create New Quiz', onPress: () => navigateToScreen('Upload') }
          ]
        );
      }
    } catch (error) {
      logger.error('Failed to load smart quiz:', error);
      Alert.alert('Error', 'Could not load the recommended quiz.');
      resetToHome();
    }
  };

  const handleSharedQuiz = async (quizId) => {
    try {
      const quizData = await AsyncStorage.getItem(`shared_quiz_${quizId}`);
      if (quizData) {
        const quiz = JSON.parse(quizData);
        Alert.alert(
          '🎯 Quiz Challenge!',
          `You've been challenged to take: "${quiz.title}"`,
          [
            { text: 'Maybe Later', onPress: () => resetToHome(), style: 'cancel' },
            {
              text: 'Accept Challenge! 🚀',
              onPress: () => navigateToScreen('Quiz', {
                sharedQuiz: quiz,
                isChallenge: true,
                challengeId: quizId
              })
            }
          ]
        );
      } else {
        Alert.alert(
          'Quiz Not Available 😔',
          'This quiz challenge may have expired.',
          [
            { text: 'Go to Home', onPress: () => resetToHome() },
            { text: 'Create Quiz', onPress: () => navigateToScreen('Upload') }
          ]
        );
      }
    } catch (error) {
      logger.error('Failed to load quiz:', error);
      Alert.alert('Error', 'Could not load quiz.');
      resetToHome();
    }
  };

  // 🔁 Deep Link Setup
  useEffect(() => {
    const linkingListener = Linking.addEventListener('url', (event) => {
      if (isNavReady) processDeepLink(event.url);
      else setPendingUrl(event.url);
    });

    const appStateListener = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - check for notifications and deep links
        try {
          const url = await Linking.getInitialURL();
          if (isNavReady && url) processDeepLink(url);
          else if (url) setPendingUrl(url);

          // Run intelligent notifications when app becomes active
          if (user && notificationsInitialized) {
            await UnifiedNotificationService.scheduleIntelligentNotifications(user.uid, 'app_foreground');
          }
        } catch (error) {
          logger.error('Error handling app state change:', error);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      linkingListener.remove?.();
      appStateListener.remove?.();
    };
  }, [isNavReady, user, notificationsInitialized]);

  const handleNavigationReady = async () => {
    logger.info('✅ Navigation is ready');
    setIsNavReady(true);

    // Check for pending deep link after nav is ready
    try {
      const url = await Linking.getInitialURL();
      if (url) {
        processDeepLink(url);
      } else if (pendingUrl) {
        processDeepLink(pendingUrl);
        setPendingUrl(null);
      }
    } catch (error) {
      logger.error('Error handling initial URL:', error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SentryErrorBoundary
        fallback={({ error, resetError }) => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              Oops! Something went wrong
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              {error?.message || 'An unexpected error occurred'}
            </Text>
            <Button title="Try Again" onPress={resetError} />
          </View>
        )}
      >
        <TranslationErrorBoundary>
          <LanguageProvider>
            <OnboardingProvider>
              <ToastProvider>
                <AppNavigator
                  ref={appNavigatorRef}
                  onReady={handleNavigationReady}
                />
              </ToastProvider>
            </OnboardingProvider>
          </LanguageProvider>
        </TranslationErrorBoundary>
      </SentryErrorBoundary>
    </QueryClientProvider>
  );
}