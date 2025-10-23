// navigation/AppNavigator.js
import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { View, Image, Animated, ActivityIndicator, Alert, Vibration, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { StudentProfileService } from '../services/StudentProfileService';
import { HybridDataService } from '../services/HybridDataService';
import { FirebaseMigration } from '../utils/FirebaseMigration';

// Existing screens
import HomeScreen from '../screens/HomeScreen';
import HomeScreenV2 from '../screens-experimental/HomeScreenV2'; // ⭐ EXPERIMENTAL: New design system
import BottomTabNavigator from './BottomTabNavigator'; // ✅ NEW: Bottom tab navigation
import UploadScreen from '../screens/UploadScreen';
import QuizScreen from '../screens/QuizScreen';
import ExplanationScreen from '../screens/ExplanationScreen';
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
import ProfileEditSelectionScreen from '../screens/ProfileEditSelectionScreen';
import WeaknessAnalysisScreen from '../screens/WeaknessAnalysisScreen';
import TermsAndAgreementScreen from '../screens/TermsAndAgreementScreen';
import FlashcardScreen from '../screens/FlashcardScreen';
import FlashcardStudyScreen from '../screens/FlashcardStudyScreen';
import StudyMaterialsScreen from '../screens/StudyMaterialsScreen';
import MaterialViewerScreen from '../screens/MaterialViewerScreen';
import AudioPlaylistsScreen from '../screens/AudioPlaylistsScreen';
import PlaylistDetailsScreen from '../screens/PlaylistDetailsScreen';

// New subscription screens
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SubscriptionManagementScreen from '../screens/SubscriptionManagementScreen';

// Book Study Mode screens (Phase A)
import MaterialLibraryScreen from '../screens/MaterialLibraryScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import ChapterReaderScreen from '../screens/ChapterReaderScreen';
import UploadModalScreen from '../screens/UploadModalScreen';

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
  const navigationRef = useRef(null);

  // 🔒 MANUAL NAVIGATION APPROACH
  // Instead of automatic navigation, we'll rely on manual navigation from screens
  // This avoids the navigation readiness issues we've been experiencing
  useEffect(() => {
    logger.info(`🔄 NavigationStackWrapper - userState: ${userState}`);
    // No automatic navigation - let screens handle their own navigation
  }, [userState]);

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
            {/* ✅ NEW: Bottom Tab Navigation as main home */}
            <Stack.Screen
              name="Home"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            >
              {(props) => <BottomTabNavigator {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Legacy HomeScreen (keep for backward compatibility) */}
            <Stack.Screen
              name="HomeLegacy"
              options={{
                ...getScreenOptions('Alexandria (Legacy)', {
                  gestureEnabled: true,
                  headerRight: () => <PremiumBadge tier={currentTier} />
                })
              }}
            >
              {(props) => <HomeScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* ⭐ EXPERIMENTAL: HomeScreenV2 with new design system */}
            <Stack.Screen
              name="HomeV2"
              options={{
                ...getScreenOptions('Alexandria V2 (Experimental)', {
                  gestureEnabled: true,
                  headerRight: () => <PremiumBadge tier={currentTier} />
                })
              }}
            >
              {(props) => <HomeScreenV2 {...props} user={user} subscription={subscription} />}
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
              name="StudyMaterials"
              options={{
                ...getScreenOptions('Study Materials', { gestureEnabled: true })
              }}
            >
              {(props) => <StudyMaterialsScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="MaterialViewer"
              options={{
                ...getScreenOptions('Material Viewer', { gestureEnabled: true })
              }}
            >
              {(props) => <MaterialViewerScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="AudioPlaylists"
              options={{
                ...getScreenOptions('Audio Playlists', { gestureEnabled: true })
              }}
            >
              {(props) => <AudioPlaylistsScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="PlaylistDetails"
              options={{
                ...getScreenOptions('Playlist', { gestureEnabled: true })
              }}
            >
              {(props) => <PlaylistDetailsScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Book Study Mode - Material Library */}
            <Stack.Screen
              name="MaterialLibrary"
              options={{
                ...getScreenOptions('Study Materials', { gestureEnabled: true })
              }}
            >
              {(props) => <MaterialLibraryScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Book Study Mode - Book Detail */}
            <Stack.Screen
              name="BookDetail"
              options={{
                ...getScreenOptions('Book Details', { gestureEnabled: true })
              }}
            >
              {(props) => <BookDetailScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Book Study Mode - Chapter Reader */}
            <Stack.Screen
              name="ChapterReader"
              options={{
                headerShown: false,
                gestureEnabled: true,
              }}
            >
              {(props) => <ChapterReaderScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Book Study Mode - Upload Modal */}
            <Stack.Screen
              name="UploadModal"
              options={{
                presentation: 'modal',
                headerShown: false,
                gestureEnabled: true,
              }}
            >
              {(props) => <UploadModalScreen {...props} user={user} subscription={subscription} />}
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
              name="FlashcardStudy"
              options={({ navigation }) => ({
                ...getScreenOptions('Study Session', { gestureEnabled: true }),
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => {
                      // Go back to FlashcardScreen (dashboard)
                      if (navigation.canGoBack()) {
                        navigation.goBack();
                      } else {
                        navigation.navigate('FlashcardScreen');
                      }
                    }}
                    style={{ marginLeft: 15, padding: 5 }}
                  >
                    <FontAwesome5 name="arrow-left" size={20} color={colors.text} />
                  </TouchableOpacity>
                ),
              })}
              component={FlashcardStudyScreen}
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
              name="Profile"
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
              name="ProfileEditSelection"
              options={{ headerShown: false }}
            >
              {(props) => <ProfileEditSelectionScreen {...props} user={user} subscription={subscription} />}
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
              name="ProfileView"
              options={{ headerShown: false, gestureEnabled: false }}
            >
              {(props) => <ProfileViewScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="ProfileEditSelection"
              options={{ headerShown: false }}
            >
              {(props) => <ProfileEditSelectionScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="Profile"
              options={{ headerShown: false }}
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
              name="ProfileSetup"
              options={{
                gestureEnabled: false,
                title: 'Profile Setup',
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {(props) => <ProfileScreen {...props} user={user} subscription={subscription} />}
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
              name="StudyMaterials"
              options={{
                ...getScreenOptions('Study Materials', { gestureEnabled: true })
              }}
            >
              {(props) => <StudyMaterialsScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="MaterialViewer"
              options={{
                ...getScreenOptions('Material Viewer', { gestureEnabled: true })
              }}
            >
              {(props) => <MaterialViewerScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="AudioPlaylists"
              options={{
                ...getScreenOptions('Audio Playlists', { gestureEnabled: true })
              }}
            >
              {(props) => <AudioPlaylistsScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="PlaylistDetails"
              options={{
                ...getScreenOptions('Playlist', { gestureEnabled: true })
              }}
            >
              {(props) => <PlaylistDetailsScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Book Study Mode - Material Library */}
            <Stack.Screen
              name="MaterialLibrary"
              options={{
                ...getScreenOptions('Study Materials', { gestureEnabled: true })
              }}
            >
              {(props) => <MaterialLibraryScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Book Study Mode - Book Detail */}
            <Stack.Screen
              name="BookDetail"
              options={{
                ...getScreenOptions('Book Details', { gestureEnabled: true })
              }}
            >
              {(props) => <BookDetailScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Book Study Mode - Chapter Reader */}
            <Stack.Screen
              name="ChapterReader"
              options={{
                headerShown: false,
                gestureEnabled: true,
              }}
            >
              {(props) => <ChapterReaderScreen {...props} user={user} subscription={subscription} />}
            </Stack.Screen>

            {/* Book Study Mode - Upload Modal */}
            <Stack.Screen
              name="UploadModal"
              options={{
                presentation: 'modal',
                headerShown: false,
                gestureEnabled: true,
              }}
            >
              {(props) => <UploadModalScreen {...props} user={user} subscription={subscription} />}
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
              name="FlashcardStudy"
              options={({ navigation }) => ({
                ...getScreenOptions('Study Session', { gestureEnabled: true }),
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => {
                      // Go back to FlashcardScreen (dashboard)
                      if (navigation.canGoBack()) {
                        navigation.goBack();
                      } else {
                        navigation.navigate('FlashcardScreen');
                      }
                    }}
                    style={{ marginLeft: 15, padding: 5 }}
                  >
                    <FontAwesome5 name="arrow-left" size={20} color={colors.text} />
                  </TouchableOpacity>
                ),
              })}
              component={FlashcardStudyScreen}
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
              name="ProfileEditSelection"
              options={{ headerShown: false }}
            >
              {(props) => <ProfileEditSelectionScreen {...props} user={user} subscription={subscription} />}
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
              name="ProfileSetup"
              options={{
                gestureEnabled: true,
                title: 'Create Account',
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {(props) => <ProfileScreen {...props} user={null} subscription={subscription} />}
            </Stack.Screen>

            <Stack.Screen
              name="TermsAndAgreement"
              options={{
                headerShown: false,
                gestureEnabled: true,
              }}
            >
              {(props) => <TermsAndAgreementScreen {...props} user={null} />}
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
        return 'ProfileSetup';
      case 'authenticated':
        return 'Home';
      case 'unauthenticated':
      default:
        return 'SignUp';
    }
  };

  return (
    <Stack.Navigator
      ref={navigationRef}
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
    },
    refreshUserState: refreshUserState
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

  // Function to manually refresh user state (can be called externally)
  const refreshUserState = async () => {
    const currentUser = auth.currentUser;
    await checkUserState(currentUser);
  };

  // Expose refresh function globally for terms acceptance
  useEffect(() => {
    // Store the refresh function globally so TermsAndAgreementScreen can access it
    global.refreshAppNavigatorState = refreshUserState;
    return () => {
      // Cleanup
      delete global.refreshAppNavigatorState;
    };
  }, []);

  // 🔒 BULLETPROOF TERMS ENFORCEMENT: 4-Layer Security System
  const checkUserState = async (currentUser) => {
    if (!currentUser) {
      setUserState('unauthenticated');
      setTimeout(() => {
        setLoading(false);
      }, 2500);
      return;
    }

    try {
      // ✅ Initialize hybrid data service for authenticated users
      await HybridDataService.initialize();
      logger.info('🔥 HybridDataService initialized for user:', currentUser.uid);

      // ✅ Auto-migrate existing user data to Firebase
      await FirebaseMigration.autoMigrate(currentUser.uid);

      // 🔒 LAYER 1: BULLETPROOF TERMS VALIDATION
      // Multiple redundant checks to prevent bypass
      const termsValidation = await validateTermsAcceptance(currentUser.uid);

      if (!termsValidation.isValid) {
        logger.warn('🚨 SECURITY: Terms validation failed:', termsValidation.reason);

        // Check if profile exists for terms enforcement flow
        try {
          const profileStatus = await Promise.race([
            HybridDataService.getUserProfile(currentUser.uid).then(profile => ({ exists: !!profile })),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Profile check timeout')), 8000))
          ]);

          if (!profileStatus.exists) {
            // User needs profile first
            setUserState('needsProfile');
            await AsyncStorage.removeItem(`profileCompleted_${currentUser.uid}`);
            logger.info('👤 Profile not found, user needs profile setup (step 1)');
            setLoading(false);
            return;
          } else {
            // Profile exists but terms invalid - force terms acceptance
            setUserState('needsTerms');
            await AsyncStorage.removeItem(`profileCompleted_${currentUser.uid}`); // 🔒 Remove app access
            logger.info('🔒 SECURITY: Forcing terms acceptance due to validation failure');
            setLoading(false);
            return;
          }
        } catch (profileError) {
          // Fallback to profile setup if we can't verify profile
          setUserState('needsProfile');
          await AsyncStorage.removeItem(`profileCompleted_${currentUser.uid}`);
          logger.info('🔒 SECURITY: Fallback to profile setup due to profile check failure');
          setLoading(false);
          return;
        }
      }

      // 🔒 LAYER 2: PROFILE VALIDATION
      try {
        logger.info('🔍 Checking profile status for user:', currentUser.uid);
        const profileStatus = await Promise.race([
          HybridDataService.getUserProfile(currentUser.uid).then(profile => ({ exists: !!profile })),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Profile check timeout')), 8000))
        ]);

        if (!profileStatus.exists) {
          // User needs to complete profile first (step 1)
          setUserState('needsProfile');
          await AsyncStorage.removeItem(`profileCompleted_${currentUser.uid}`);
          await AsyncStorage.removeItem(`termsAccepted_${currentUser.uid}`); // 🔒 Clear terms on profile reset
          logger.info('👤 Profile not found, user needs profile setup (step 1)');
          setLoading(false);
          return;
        }

        // 🔒 LAYER 3: FINAL TERMS VERIFICATION
        // Even if profile exists, recheck terms with strict validation
        const finalTermsCheck = await validateTermsAcceptance(currentUser.uid);

        if (!finalTermsCheck.isValid) {
          // Profile exists but terms validation still fails
          setUserState('needsTerms');
          await AsyncStorage.removeItem(`profileCompleted_${currentUser.uid}`); // 🔒 Remove app access
          logger.warn('🔒 SECURITY: Final terms check failed, forcing terms acceptance');
          setLoading(false);
          return;
        }

        // 🔒 LAYER 4: GRANT AUTHENTICATED ACCESS
        // All validations passed - user has complete access
        setUserState('authenticated');
        await AsyncStorage.setItem(`profileCompleted_${currentUser.uid}`, 'true');
        logger.info('✅ All security layers passed, user authenticated');
        setLoading(false);

      } catch (profileError) {
        logger.error('❌ Profile check failed, using secure fallback:', profileError.message);

        // 🔒 SECURE FALLBACK: Default to strictest validation
        const strictTermsCheck = await validateTermsAcceptance(currentUser.uid);
        const profileCompleted = await AsyncStorage.getItem(`profileCompleted_${currentUser.uid}`);

        if (!strictTermsCheck.isValid) {
          // Always enforce terms if validation fails
          setUserState('needsTerms');
          await AsyncStorage.removeItem(`profileCompleted_${currentUser.uid}`);
          logger.info('🔒 SECURITY: Secure fallback enforcing terms');
          setLoading(false);
        } else if (!profileCompleted || profileCompleted !== 'true') {
          // Terms valid but profile status unclear
          setUserState('needsProfile');
          logger.info('🔒 SECURITY: Secure fallback to profile setup');
          setLoading(false);
        } else {
          // Both appear valid in cache
          setUserState('authenticated');
          logger.info('✅ Secure fallback: user authenticated');
          setLoading(false);
        }
      }
    } catch (error) {
      logger.error('❌ Critical error during user state check:', error);
      // 🔒 SECURITY: On any critical error, deny access
      setUserState('unauthenticated');
      await AsyncStorage.removeItem(`profileCompleted_${currentUser.uid}`);
      await AsyncStorage.removeItem(`termsAccepted_${currentUser.uid}`);
      setLoading(false);
    }
  };

  // 🔒 BULLETPROOF TERMS VALIDATION FUNCTION
  const validateTermsAcceptance = async (userId) => {
    try {
      // Multiple validation checks to prevent bypass
      const checks = await Promise.all([
        // Check 1: Local storage
        AsyncStorage.getItem(`termsAccepted_${userId}`),
        // Check 2: Profile completion flag (terms unlock this)
        AsyncStorage.getItem(`profileCompleted_${userId}`),
        // Check 3: App access timestamp validation
        AsyncStorage.getItem(`lastTermsValidation_${userId}`)
      ]);

      const [termsAccepted, profileCompleted, lastValidation] = checks;

      // Parse terms acceptance data
      let termsData = null;
      try {
        termsData = termsAccepted ? JSON.parse(termsAccepted) : null;
      } catch (parseError) {
        logger.warn('🔒 SECURITY: Invalid terms data format');
        return { isValid: false, reason: 'Invalid terms data format' };
      }

      // Validation 1: Terms data must exist and be properly formatted
      if (!termsData || typeof termsData !== 'object') {
        return { isValid: false, reason: 'No valid terms data found' };
      }

      // Validation 2: Terms must be explicitly accepted
      if (termsData.accepted !== true) {
        return { isValid: false, reason: 'Terms not explicitly accepted' };
      }

      // Validation 3: Terms must have valid timestamp
      if (!termsData.timestamp || !Date.parse(termsData.timestamp)) {
        return { isValid: false, reason: 'Invalid or missing timestamp' };
      }

      // Validation 4: Terms must have user ID matching current user
      if (termsData.user_id !== userId) {
        return { isValid: false, reason: 'Terms user ID mismatch' };
      }

      // Validation 5: Profile completion flag must exist (terms unlock this)
      if (profileCompleted !== 'true') {
        return { isValid: false, reason: 'Profile completion flag missing' };
      }

      // Validation 6: Timestamp must be within reasonable range (not future, not too old)
      const termsDate = new Date(termsData.timestamp);
      const now = new Date();
      const daysDiff = (now - termsDate) / (1000 * 60 * 60 * 24);

      if (termsDate > now) {
        return { isValid: false, reason: 'Terms timestamp in future' };
      }

      if (daysDiff > 365) { // Terms older than 1 year might need re-acceptance
        logger.warn('🔒 SECURITY: Terms acceptance older than 1 year');
        return { isValid: false, reason: 'Terms acceptance expired' };
      }

      // Update validation timestamp for audit trail
      await AsyncStorage.setItem(`lastTermsValidation_${userId}`, now.toISOString());

      logger.info('✅ Terms validation passed all security checks');
      return { isValid: true, reason: 'All validations passed' };

    } catch (error) {
      logger.error('🔒 SECURITY: Terms validation error:', error);
      return { isValid: false, reason: 'Validation process failed' };
    }
  };

  // 🔒 ENHANCED AUTH STATE MANAGEMENT WITH BULLETPROOF TERMS ENFORCEMENT
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 🔒 Use the same bulletproof checkUserState function
        // This ensures consistent security validation across all auth events
        await checkUserState(currentUser);
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
        Profile: 'profile',
        ProfileSetup: 'profile/setup',
        ProfileView: 'profile/view',

        // Book Study Mode
        MaterialLibrary: 'materials',
        BookDetail: {
          path: 'materials/:materialId',
          parse: {
            materialId: (materialId) => materialId,
          },
        },
        ChapterReader: {
          path: 'materials/:materialId/chapters/:chapterId',
          parse: {
            materialId: (materialId) => materialId,
            chapterId: (chapterId) => chapterId,
          },
        },

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