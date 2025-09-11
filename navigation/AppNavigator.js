// navigation/AppNavigator.js
import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { View, Image, Animated, ActivityIndicator, Alert, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { StudentProfileService } from '../services/StudentProfileService';
import { HybridDataService } from '../services/HybridDataService';
import { FirebaseMigration } from '../utils/FirebaseMigration';

// Existing screens
import HomeScreen from '../screens/HomeScreen';
import UploadScreen from '../screens/UploadScreen';
import QuizScreen from '../screens/QuizScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import QuizHistoryScreen from '../screens/QuizHistoryScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ProgressTrackerScreen from '../screens/ProgressTrackerScreen';
import CoachScreen from '../screens/CoachScreen';
import AskAlexandriaScreen from '../screens/AskAlexandriaScreen';
import ScheduleExamScreen from '../screens/ScheduleExamScreen';
import ExamListScreen from '../screens/ExamListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileViewScreen from '../screens/ProfileViewScreen';
import WeaknessAnalysisScreen from '../screens/WeaknessAnalysisScreen';
import TermsAndAgreementScreen from '../screens/TermsAndAgreementScreen';
import FlashcardScreen from '../screens/FlashcardScreen';

// New subscription screens
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SubscriptionManagementScreen from '../screens/SubscriptionManagementScreen';

// Subscription context and services
import { SubscriptionProvider, useSubscription } from '../contexts/SubscriptionContext';
import logger from '../utils/logger';


const Stack = createStackNavigator();

// Enhanced Loading Screen with Custom Flame Animation
const LoadingScreen = () => {
  // Animation references
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameOpacity = useRef(new Animated.Value(1)).current;
  const flameRotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  
  // Additional flame effects
  const innerFlameScale = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Complex flame flicker animation
    const createFlameFlicker = () => {
      return Animated.loop(
        Animated.parallel([
          // Main flame scale flicker (realistic fire movement)
          Animated.sequence([
            Animated.timing(flameScale, {
              toValue: 1.08,
              duration: 180 + Math.random() * 100, // Random timing for realism
              useNativeDriver: true,
            }),
            Animated.timing(flameScale, {
              toValue: 0.96,
              duration: 120 + Math.random() * 80,
              useNativeDriver: true,
            }),
            Animated.timing(flameScale, {
              toValue: 1.05,
              duration: 200 + Math.random() * 100,
              useNativeDriver: true,
            }),
            Animated.timing(flameScale, {
              toValue: 0.98,
              duration: 150 + Math.random() * 60,
              useNativeDriver: true,
            }),
            Animated.timing(flameScale, {
              toValue: 1.02,
              duration: 160 + Math.random() * 90,
              useNativeDriver: true,
            }),
            Animated.timing(flameScale, {
              toValue: 1,
              duration: 140 + Math.random() * 70,
              useNativeDriver: true,
            }),
          ]),
          
          // Opacity flicker (flame intensity)
          Animated.sequence([
            Animated.timing(flameOpacity, {
              toValue: 0.85,
              duration: 160,
              useNativeDriver: true,
            }),
            Animated.timing(flameOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(flameOpacity, {
              toValue: 0.92,
              duration: 140,
              useNativeDriver: true,
            }),
            Animated.timing(flameOpacity, {
              toValue: 0.98,
              duration: 180,
              useNativeDriver: true,
            }),
          ]),
          
          // Subtle rotation (like wind effect)
          Animated.sequence([
            Animated.timing(flameRotation, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(flameRotation, {
              toValue: -1,
              duration: 3500,
              useNativeDriver: true,
            }),
            Animated.timing(flameRotation, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    // Inner flame animation (additional depth)
    const createInnerFlameAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(innerFlameScale, {
            toValue: 1.12,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(innerFlameScale, {
            toValue: 0.94,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(innerFlameScale, {
            toValue: 1.06,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(innerFlameScale, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Sparkle effect animation
    const createSparkleAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 0.6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 0.8,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Text fade-in animation
    const textAnimation = Animated.timing(textOpacity, {
      toValue: 1,
      duration: 2000,
      delay: 800,
      useNativeDriver: true,
    });

    // Start all animations
    const flameAnimation = createFlameFlicker();
    const innerAnimation = createInnerFlameAnimation();
    const sparkleAnimation = createSparkleAnimation();

    flameAnimation.start();
    innerAnimation.start();
    sparkleAnimation.start();
    textAnimation.start();

    return () => {
      flameAnimation.stop();
      innerAnimation.stop();
      sparkleAnimation.stop();
    };
  }, []);

  // Rotation interpolation
  const rotationInterpolation = flameRotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2deg', '0deg', '2deg'],
  });

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#1A2C5B',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Main Torch Logo with Advanced Flame Effects */}
      <View style={{ position: 'relative' }}>
        {/* Background glow effect */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: '#FF6B35',
            opacity: sparkleOpacity,
            transform: [
              { scale: innerFlameScale },
            ],
            top: -25,
            left: -25,
            zIndex: 0,
          }}
        />
        
        {/* Main logo with flame animation */}
        <Animated.View
          style={{
            transform: [
              { scale: flameScale },
              { rotate: rotationInterpolation },
            ],
            opacity: flameOpacity,
            zIndex: 1,
          }}
        >
          <Image 
            source={require('../assets/alexandria-logo.png')} // Your PNG logo
            style={{ 
              width: 150, 
              height: 150, 
              resizeMode: 'contain' 
            }}
          />
        </Animated.View>

        {/* Additional sparkle effects around the flame */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#FFD700',
            opacity: sparkleOpacity,
            top: 20,
            right: 30,
            zIndex: 2,
          }}
        />
        
        <Animated.View
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#FF8C42',
            opacity: sparkleOpacity,
            top: 40,
            left: 25,
            zIndex: 2,
          }}
        />
      </View>

      {/* App Name with Fade In */}
      <Animated.Text 
        style={{ 
          color: '#F8F4E3', 
          marginTop: 32, 
          fontSize: 32, 
          fontWeight: 'bold',
          letterSpacing: 2,
          opacity: textOpacity,
          textShadowColor: '#FF6B35',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        }}
      >
        Alexandria
      </Animated.Text>
      
      {/* Tagline */}
      <Animated.Text 
        style={{ 
          color: '#D4AF37', 
          marginTop: 12, 
          fontSize: 16, 
          fontWeight: '600',
          letterSpacing: 1,
          opacity: textOpacity,
        }}
      >
        Ignite Your Learning
      </Animated.Text>

      {/* Loading indicator */}
      <Animated.View
        style={{
          marginTop: 40,
          opacity: textOpacity
        }}
      >
        <ActivityIndicator size="small" color="#D4AF37" />
      </Animated.View>
    </View>
  );
};

// Premium badge component for navigation headers
const PremiumBadge = ({ tier }) => {
  const getBadgeInfo = () => {
    switch (tier?.id) {
      case 'mastermind':
        return { icon: 'crown', color: '#FFD700' };
      case 'scholar':
        return { icon: 'gem', color: '#3498DB' };
      default:
        return null;
    }
  };

  const badgeInfo = getBadgeInfo();
  
  if (!badgeInfo) return null;

  return (
    <FontAwesome5 
      name={badgeInfo.icon}
      size={20}
      color={badgeInfo.color}
      style={{ marginRight: 15 }}
    />
  );
};

// ✅ NEW: Wrapper component that contains the Stack.Navigator
const NavigationStackWrapper = ({ user, userState }) => {
  const subscription = useSubscription(); // ✅ Now this is inside SubscriptionProvider
  const { currentTier, hasActiveSubscription, isLoading: subscriptionLoading } = subscription;

  // Theme colors
  const colors = {
    background: '#F8F4E3',
    surface: '#FFFFFF',
    text: '#2C3E50',
    accent: '#E74C3C'
  };

  // Common screen options with subscription awareness
  const getScreenOptions = (title, options = {}) => ({
    title,
    headerStyle: {
      backgroundColor: colors.surface,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    cardStyle: { backgroundColor: colors.background },
    ...options
  });

  // Function to get the appropriate stack based on user state
  const renderNavigationStack = () => {
    switch (userState) {
      case 'authenticated':
        // User is fully authenticated and has completed profile
        return (
          <>
            <Stack.Screen
              name="Home"
              options={{
                ...getScreenOptions('Alexandria', { 
                  gestureEnabled: false,
                  headerRight: () => <PremiumBadge tier={currentTier} />
                })
              }}
            >
              {(props) => <HomeScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="Upload" 
              options={{
                ...getScreenOptions('Create Quiz', { gestureEnabled: true })
              }}
            >
              {(props) => <UploadScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="QuizScreen" 
              options={{
                ...getScreenOptions('Quiz', { 
                  gestureEnabled: false,
                  headerRight: () => currentTier?.id === 'explorer' && (
                    <FontAwesome5 name="info-circle" size={20} color={colors.accent} style={{ marginRight: 15 }} />
                  )
                })
              }}
            >
              {(props) => <QuizScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="Quiz" 
              options={{
                ...getScreenOptions('Challenge Quiz', { gestureEnabled: false })
              }}
            >
              {(props) => <QuizScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ResultsScreen" 
              options={{
                ...getScreenOptions('Results', { gestureEnabled: true })
              }}
            >
              {(props) => <ResultsScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="QuizHistory" 
              options={{
                ...getScreenOptions('Quiz History', { gestureEnabled: true })
              }}
            >
              {(props) => <QuizHistoryScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ReviewScreen" 
              options={{
                ...getScreenOptions('Review', { 
                  gestureEnabled: true,
                  headerRight: () => subscription.canAccessFeature && subscription.canAccessFeature('ai_explanations') && (
                    <FontAwesome5 name="brain" size={20} color={colors.accent} style={{ marginRight: 15 }} />
                  )
                })
              }}
            >
              {(props) => <ReviewScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ProgressTracker" 
              options={{
                ...getScreenOptions('Progress', { gestureEnabled: true })
              }}
            >
              {(props) => <ProgressTrackerScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="WeaknessAnalysis" 
              options={{
                ...getScreenOptions('Learning Analysis', { gestureEnabled: true })
              }}
            >
              {(props) => <WeaknessAnalysisScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="FlashcardScreen" 
              options={{
                ...getScreenOptions('Study Flashcards', { gestureEnabled: true })
              }}
              component={FlashcardScreen}
            />

            <Stack.Screen 
              name="Coach" 
              options={{
                ...getScreenOptions('Coach', { gestureEnabled: true })
              }}
            >
              {(props) => <CoachScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="AskAlexandria" 
              options={{
                ...getScreenOptions('Ask Alexandria', { 
                  gestureEnabled: true,
                  headerRight: () => subscription.hasPriorityGeneration && (
                    <FontAwesome5 name="bolt" size={20} color="#FFD700" style={{ marginRight: 15 }} />
                  )
                })
              }}
            >
              {(props) => <AskAlexandriaScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ScheduleExamScreen" 
              options={{ headerShown: false }}
            >
              {(props) => <ScheduleExamScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ExamListScreen" 
              options={{ headerShown: false }}
            >
              {(props) => <ExamListScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ProfileScreen" 
              options={{ headerShown: false }}
            >
              {(props) => <ProfileScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ProfileView" 
              options={{ headerShown: false }}
            >
              {(props) => <ProfileViewScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="TermsAndAgreement" 
              options={{ 
                headerShown: false,
                gestureEnabled: true // ✅ FIXED: Allow swipe back gesture now that we have proper back button
              }}
            >
              {(props) => <TermsAndAgreementScreen {...props} user={user} />}
            </Stack.Screen>

            {/* Subscription Screens */}
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionScreen}
              options={{
                title: 'Choose Your Plan',
                presentation: 'modal',
                gestureEnabled: true,
                headerBackTitleVisible: false,
                headerRight: () => (
                  <FontAwesome5 name="crown" size={20} color="#FFD700" style={{ marginRight: 15 }} />
                )
              }}
            />

            <Stack.Screen 
              name="SubscriptionManagement" 
              component={SubscriptionManagementScreen}
              options={{
                ...getScreenOptions('Manage Subscription', {
                  headerBackTitleVisible: false,
                  headerRight: () => <PremiumBadge tier={currentTier} />
                })
              }}
            />
          </>
        );

      case 'needsTerms':
        // User is authenticated but hasn't accepted terms
        return (
          <>
            <Stack.Screen 
              name="TermsAndAgreement" 
              options={{ 
                headerShown: false,
                gestureEnabled: true // ✅ FIXED: Allow swipe back gesture now that we have proper back button
              }}
            >
              {(props) => <TermsAndAgreementScreen {...props} user={user} />}
            </Stack.Screen>
            
            {/* Include profile and home screens for after terms acceptance */}
            <Stack.Screen 
              name="ProfileScreen" 
              options={{ headerShown: false, gestureEnabled: false }}
            >
              {(props) => <ProfileScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>
            
            <Stack.Screen
              name="Home"
              options={{
                ...getScreenOptions('Alexandria', { 
                  gestureEnabled: false,
                  headerRight: () => <PremiumBadge tier={currentTier} />
                })
              }}
            >
              {(props) => <HomeScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>
          </>
        );

      case 'needsProfile':
        // User is authenticated but needs to complete profile
        return (
          <>
            <Stack.Screen 
              name="SignUp" 
              options={{ 
                gestureEnabled: true,
                title: 'Sign Up',
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {(props) => <SignUpScreen {...props} />}
            </Stack.Screen>

            <Stack.Screen 
              name="Login" 
              options={{
                title: 'Login',
                gestureEnabled: true,
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {(props) => <LoginScreen {...props} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ForgotPassword" 
              options={{
                title: 'Reset Password',
                gestureEnabled: true,
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {(props) => <ForgotPasswordScreen {...props} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ProfileScreen" 
              options={{ 
                headerShown: false,
                gestureEnabled: true // Allow going back to sign up
              }}
            >
              {(props) => <ProfileScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Include ALL authenticated screens for after profile completion */}
            <Stack.Screen
              name="Home"
              options={{
                ...getScreenOptions('Alexandria', { 
                  gestureEnabled: false,
                  headerRight: () => <PremiumBadge tier={currentTier} />
                })
              }}
            >
              {(props) => <HomeScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="Upload" 
              options={{
                ...getScreenOptions('Create Quiz', { gestureEnabled: true })
              }}
            >
              {(props) => <UploadScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="QuizScreen" 
              options={{
                ...getScreenOptions('Quiz', { gestureEnabled: false })
              }}
            >
              {(props) => <QuizScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="Quiz" 
              options={{
                ...getScreenOptions('Challenge Quiz', { gestureEnabled: false })
              }}
            >
              {(props) => <QuizScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ResultsScreen" 
              options={{
                ...getScreenOptions('Results', { gestureEnabled: true })
              }}
            >
              {(props) => <ResultsScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="QuizHistory" 
              options={{
                ...getScreenOptions('Quiz History', { gestureEnabled: true })
              }}
            >
              {(props) => <QuizHistoryScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ReviewScreen" 
              options={{
                ...getScreenOptions('Review', { gestureEnabled: true })
              }}
            >
              {(props) => <ReviewScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ProgressTracker" 
              options={{
                ...getScreenOptions('Progress', { gestureEnabled: true })
              }}
            >
              {(props) => <ProgressTrackerScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="WeaknessAnalysis" 
              options={{
                ...getScreenOptions('Learning Analysis', { gestureEnabled: true })
              }}
            >
              {(props) => <WeaknessAnalysisScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="FlashcardScreen" 
              options={{
                ...getScreenOptions('Study Flashcards', { gestureEnabled: true })
              }}
              component={FlashcardScreen}
            />

            <Stack.Screen 
              name="Coach" 
              options={{
                ...getScreenOptions('Coach', { gestureEnabled: true })
              }}
            >
              {(props) => <CoachScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="AskAlexandria" 
              options={{
                ...getScreenOptions('Ask Alexandria', { gestureEnabled: true })
              }}
            >
              {(props) => <AskAlexandriaScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ScheduleExamScreen" 
              options={{ headerShown: false }}
            >
              {(props) => <ScheduleExamScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ExamListScreen" 
              options={{ headerShown: false }}
            >
              {(props) => <ExamListScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ProfileView" 
              options={{ headerShown: false }}
            >
              {(props) => <ProfileViewScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen 
              name="TermsAndAgreement" 
              options={{ 
                headerShown: false,
                gestureEnabled: true // ✅ FIXED: Allow swipe back gesture now that we have proper back button
              }}
            >
              {(props) => <TermsAndAgreementScreen {...props} user={user} />}
            </Stack.Screen>

            {/* Subscription Screens for profile completion flow */}
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionScreen}
              options={{
                title: 'Choose Your Plan',
                presentation: 'modal',
                gestureEnabled: true,
                headerBackTitleVisible: false,
              }}
            />
          </>
        );

      case 'unauthenticated':
      default:
        // User is not authenticated
        return (
          <>
            <Stack.Screen 
              name="SignUp" 
              options={{ 
                gestureEnabled: false,
                title: 'Sign Up',
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {(props) => <SignUpScreen {...props} />}
            </Stack.Screen>

            <Stack.Screen 
              name="Login" 
              options={{
                title: 'Login',
                gestureEnabled: true,
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {(props) => <LoginScreen {...props} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ForgotPassword" 
              options={{
                title: 'Reset Password',
                gestureEnabled: true,
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {(props) => <ForgotPasswordScreen {...props} />}
            </Stack.Screen>

            <Stack.Screen 
              name="ProfileScreen" 
              options={{ headerShown: false }}
            >
              {(props) => <ProfileScreen {...props} />}
            </Stack.Screen>

            <Stack.Screen 
              name="TermsAndAgreement" 
              options={{ 
                headerShown: false,
                gestureEnabled: true // ✅ FIXED: Allow swipe back gesture now that we have proper back button
              }}
            >
              {(props) => <TermsAndAgreementScreen {...props} />}
            </Stack.Screen>

            {/* ✅ ADD THIS: Subscription screen for unauthenticated users */}
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionScreen}
              options={{
                title: 'Choose Your Plan',
                presentation: 'modal',
                gestureEnabled: true,
                headerBackTitleVisible: false,
              }}
            />
          </>
        );
    }
  };

  const getInitialRouteName = () => {
    switch (userState) {
      case 'needsTerms':
        return 'TermsAndAgreement';
      case 'needsProfile':
        return 'SignUp';
      case 'authenticated':
        return 'Home';
      case 'unauthenticated':
      default:
        return 'SignUp';
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: true,
        gestureEnabled: true,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}
    >
      {renderNavigationStack()}
    </Stack.Navigator>
  );
};

const AppNavigator = forwardRef((props, ref) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigationRef, setNavigationRef] = useState(null);
  const [userState, setUserState] = useState('loading');

  // Expose navigation methods to parent component
  useImperativeHandle(ref, () => ({
    navigate: (name, params) => {
      if (navigationRef?.isReady()) {
        navigationRef.navigate(name, params);
      } else {
        logger.warn('Navigation not ready yet, queuing navigation...');
        setTimeout(() => {
          if (navigationRef?.isReady()) {
            navigationRef.navigate(name, params);
          }
        }, 100);
      }
    },
    goBack: () => {
      if (navigationRef?.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
      }
    },
    reset: (state) => {
      if (navigationRef?.isReady()) {
        navigationRef.reset(state);
      }
    },
    isReady: () => {
      return navigationRef?.isReady() || false;
    }
  }), [navigationRef]);

  // Development helper: Clear auth and storage for testing
  const clearAuthForTesting = async () => {
    if (__DEV__) {
      try {
        await signOut(auth);
        await AsyncStorage.clear();
        logger.info('🧪 Development: Auth and storage cleared for testing');
      } catch (error) {
        logger.error('Error clearing auth:', error);
      }
    }
  };

  // Enhanced auth state management with profile completion check
  useEffect(() => {
    // 🚨 DISABLED: Clear auth on app start for testing onboarding
    // clearAuthForTesting(); // ⚠️ This was causing login issues for existing users!
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // ✅ Initialize hybrid data service for authenticated users
          await HybridDataService.initialize();
          logger.info('🔥 HybridDataService initialized for user:', currentUser.uid);

          // ✅ Auto-migrate existing user data to Firebase
          await FirebaseMigration.autoMigrate(currentUser.uid);

          // ✅ ENHANCED: Check both terms acceptance AND profile completion
          const termsAccepted = await AsyncStorage.getItem(`termsAccepted_${currentUser.uid}`);
          
          if (!termsAccepted || termsAccepted === 'false') {
            // User hasn't accepted terms yet
            setUserState('needsTerms');
          } else {
            // Try to check profile status with timeout and fallback
            try {
              logger.info('🔍 Checking profile status for user:', currentUser.uid);
              const profileStatus = await Promise.race([
                // Try hybrid approach first, fallback to original service
                HybridDataService.getUserProfile(currentUser.uid).then(profile => ({ exists: !!profile })),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Profile check timeout')), 8000))
              ]);
              
              if (profileStatus.exists) {
                // User has accepted terms and has profile - fully authenticated
                setUserState('authenticated');
                await AsyncStorage.setItem(`profileCompleted_${currentUser.uid}`, 'true');
                logger.info('✅ Profile found, user authenticated');
              } else {
                // User has accepted terms but needs profile
                setUserState('needsProfile');
                await AsyncStorage.removeItem(`profileCompleted_${currentUser.uid}`);
                logger.info('⚠️ Profile not found, needs profile completion');
              }
            } catch (profileError) {
              logger.error('❌ Profile check failed, using fallback logic:', profileError.message);
              
              // Fallback: Check local storage flag
              const profileCompleted = await AsyncStorage.getItem(`profileCompleted_${currentUser.uid}`);
              
              if (profileCompleted === 'true') {
                // Trust local storage if API is down
                setUserState('authenticated');
                logger.info('✅ Using cached profile status: authenticated');
              } else {
                // 🔧 FIX: Default to authenticated instead of needsProfile
                // This ensures existing users can access all features even if profile check fails
                setUserState('authenticated');
                logger.info('⚠️ Using fallback: granting full access (authenticated)');
                
                // Cache the decision to avoid repeated API calls
                await AsyncStorage.setItem(`profileCompleted_${currentUser.uid}`, 'true');
              }
            }
          }
        } catch (error) {
          logger.error('❌ Auth state error:', error);
          // Fallback to legacy check
          try {
            const profileCompleted = await AsyncStorage.getItem(`profileCompleted_${currentUser.uid}`);
            const termsAccepted = await AsyncStorage.getItem(`termsAccepted_${currentUser.uid}`);
            
            if (!termsAccepted || termsAccepted === 'false') {
              setUserState('needsTerms');
            } else if (profileCompleted === 'true') {
              setUserState('authenticated');
            } else {
              setUserState('needsProfile');
            }
          } catch (fallbackError) {
            logger.error('Fallback profile check failed:', fallbackError);
            // 🔧 FIX: Default to authenticated instead of needsTerms
            setUserState('authenticated');
            logger.info('⚠️ Ultimate fallback: granting full access');
          }
        }
        setLoading(false); // ✅ For authenticated users, load immediately
      } else {
        // ✅ FIX: Add a delay for the unauthenticated path to showcase the loading animation
        setTimeout(() => {
          setUserState('unauthenticated');
          setLoading(false);
        }, 2500); // 2.5-second delay to enjoy the animation
      }
    });
    
    return unsubscribe;
  }, []);

  // Handle navigation ready callback
  const handleNavigationReady = () => {
    logger.info('AppNavigator: Navigation is ready');
    if (props.onReady) {
      props.onReady();
    }
  };

  // Handle navigation state change for debugging
  const handleNavigationStateChange = (state) => {
    if (__DEV__) {
      logger.info('Navigation state changed:', state);
    }
  };

  // Configure deep linking with subscription support
  const linking = {
    prefixes: [
      'alexandria://',
      'https://alexandria.com',
      'https://*.alexandria.com',
    ],
    config: {
      screens: {
        // Authenticated screens
        Home: 'home',
        Upload: 'upload',
        QuizScreen: {
          path: 'quiz/:quizId?',
          parse: {
            quizId: (quizId) => quizId || null,
          },
        },
        ResultsScreen: 'results',
        QuizHistory: 'history',
        ReviewScreen: 'review',
        ProgressTracker: 'progress',
        ProfileScreen: 'profile',
        
        // Subscription screens
        Subscription: 'subscription',
        SubscriptionManagement: 'subscription/manage',
        
        // Authentication screens
        SignUp: 'signup',
        Login: 'login',
        ForgotPassword: 'forgot-password',
        
        // Special deep link routes
        SharedQuiz: {
          path: 'quiz/:quizId',
          parse: {
            quizId: (quizId) => quizId,
          },
        },
      },
    },
  };

  // New upload and quiz generation handler
  const handleUploadAndGenerateQuiz = async () => {
    if (files.length === 0) {
        Alert.alert(
            "🏛️ No Sacred Texts Found", 
            "Please select study materials from the archives to forge your trial of knowledge."
        );
        return;
    }

    const selectedQuizTypes = Object.keys(quizConfig.types).filter(type => quizConfig.types[type]);
    if (selectedQuizTypes.length === 0) {
        Alert.alert(
            "🏛️ No Trial Format Selected", 
            "Please choose at least one format for your trial of wisdom."
        );
        return;
    }

    setUiState(prev => ({ ...prev, uploading: true, isTransitioning: true }));
    setResponseText(null);

    let res; // ✅ Declare res once, outside all try blocks

    try {
        const formData = new FormData();
        const firstFile = files[0];
        formData.append('file', {
            uri: firstFile.uri,
            name: firstFile.name,
            type: firstFile.mimeType || 'application/octet-stream',
        });

        formData.append('quiz_types', JSON.stringify(selectedQuizTypes));
        formData.append('num_questions', quizConfig.questionCount.toString());
        formData.append('difficulty', quizConfig.difficulty);
        
        const user = auth.currentUser;
        if (user) {
            formData.append('user_id', user.uid);
        }

        // ✅ Use centralized API configuration
        res = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-User-ID': user?.uid || 'anonymous',
            },
            timeout: 600000,
        });
        
        logger.info('✅ Upload successful:', res.status);

        // ✅ Handle response immediately after successful upload
        if (res && res.data && res.data.metadata?.anti_repetition_applied) {
            setUiState(prev => ({ ...prev, showFreshnessIndicator: true }));
            setTimeout(() => {
                setUiState(prev => ({ ...prev, showFreshnessIndicator: false }));
            }, 3000);
        }

        if (res && res.data && res.data.quiz) {
            Animated.timing(containerAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                navigation.navigate('QuizScreen', { 
                    quiz: res.data.quiz,
                    metadata: {
                        ...res.data.metadata,
                        title: 'Alexandria Trial of Wisdom'
                    }
                });
            });
            
            setFiles([]);
            Vibration.vibrate([100, 50, 200]);
        } else if (res && res.data && res.data.detail) {
            Alert.alert("🏛️ Oracle Error", res.data.detail);
            setResponseText(`Oracle speaks: ${res.data.detail}`);
        } else {
            Alert.alert("🏛️ Wisdom Forged", res.data?.message || "Your trial has been prepared in the sacred halls.");
            setResponseText(res.data?.message || "Trial preparation complete.");
        }

    } catch (error) {
        logger.error("Trial creation error: ", error.response ? error.response.data : error.message);
        const errorMessage = error.response?.data?.detail || error.message || "The ancient powers have failed us.";
        Alert.alert("🏛️ Trial Creation Failed", `The wisdom could not be forged: ${errorMessage}`);
        setResponseText(`Oracle's warning: ${errorMessage}`);
    } finally {
        setUiState(prev => ({ ...prev, uploading: false, isTransitioning: false }));
    }
  };

  if (loading || userState === 'loading') {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="Loading" 
            component={LoadingScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer
      ref={(navRef) => {
        if (navRef && navRef.isReady) {
          setNavigationRef(navRef);
        }
        if (ref && typeof ref === 'object') {
          ref.current = navRef;
        }
      }}
      linking={linking}
      onReady={handleNavigationReady}
      onStateChange={handleNavigationStateChange}
      fallback={props.fallback || null}
    >
      <SubscriptionProvider userId={user?.uid}>
        <NavigationStackWrapper user={user} userState={userState} />
      </SubscriptionProvider>
    </NavigationContainer>
  );
});

AppNavigator.displayName = 'AppNavigator';

export default AppNavigator;