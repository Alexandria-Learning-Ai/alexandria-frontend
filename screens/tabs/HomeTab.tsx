/**
 * HomeTab - Main home tab content
 *
 * Contains:
 * - Welcome message with greeting
 * - Profile button
 * - Stats card (Streak, Average Score, Number of Quizzes)
 * - Upload screen button
 * - Ask Alexandria button
 *
 * Features:
 * - Type-safe props
 * - Alexandria theme styling
 * - Smooth animations
 * - Pull-to-refresh
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useQuizStats } from '../../hooks/useQuizStats';
import { useOnboarding } from '../../contexts/OnboardingContext';
import HomeHeader from '../../components/home/HomeHeader';
import ProfileMenuModals from '../../components/home/ProfileMenuModals';
import WelcomeModal from '../../components/onboarding/WelcomeModal';
import logger from '../../utils/logger';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface HomeTabProps {
  navigation: any;
  user: any;
  subscription: any;
}

const HomeTab: React.FC<HomeTabProps> = ({ navigation, user, subscription }) => {
  const { t } = useTranslation();
  const { currentLanguage, availableLanguages, setLanguage } = useLanguage();
  const { isDarkMode, setIsDarkMode, themeStyles } = useTheme();
  const { userName, fullName, userProfile, profileCompletion } = useUserProfile();
  const { recentStats, refreshStats } = useQuizStats();
  const { isFirstTime, markAsComplete, loading: onboardingLoading } = useOnboarding();

  // Local state
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const isFocused = useIsFocused();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  // Theme colors
  const themeColors = useMemo(
    () => ({
      background: '#1A2C5B',
      backgroundSecondary: '#2C467D',
      alexandriaGold: '#D4AF37',
      alexandriaBronze: '#B8941F',
      text: '#F8F4E3',
      textSecondary: '#CBD5E0',
      success: '#28a745',
      error: '#dc3545',
      warning: '#FFD700',
    }),
    []
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Shimmer effect for upload button (trigger once on screen focus)
  useEffect(() => {
    if (isFocused) {
      // Reset shimmer to start position
      shimmerAnim.setValue(0);

      // Play shimmer animation once (1.5 seconds)
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0, // Instant reset
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);


  // Press handlers for upload button
  const handleUploadPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(pressAnim, {
      toValue: 0.96,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleUploadPressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleUploadPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Upload');
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ExpoStatusBar style="light" />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refreshStats}
              colors={[themeColors.alexandriaGold]}
              tintColor={themeColors.alexandriaGold}
            />
          }
        >
          {/* Header with greeting and profile */}
          <HomeHeader
            userName={userName}
            profileCompletion={profileCompletion}
            recentStats={recentStats}
            themeStyles={themeStyles}
            t={t}
            onProfilePress={() => setProfileMenuVisible(true)}
          />

          {/* Alexandria Logo with Elegant Carved Indent - Above Stats */}
          <Animatable.View animation="fadeIn" delay={300} style={styles.logoContainer}>
            <View
              style={[
                styles.logoCarvedBorder,
                {
                  borderTopColor: 'rgba(0, 0, 0, 0.3)',
                  borderLeftColor: 'rgba(0, 0, 0, 0.3)',
                  borderBottomColor: 'rgba(212, 175, 55, 0.15)',
                  borderRightColor: 'rgba(212, 175, 55, 0.15)',
                },
              ]}
            >
              <LinearGradient
                colors={[themeColors.backgroundSecondary, themeColors.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoInnerContainer}
              >
                <Image
                  source={require('../../assets/alexandria-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
          </Animatable.View>

          {/* Stats Card - Streak, Average Score, Number of Quizzes */}
          <Animatable.View animation="fadeInUp" delay={400} style={styles.statsCardContainer}>
            {/* Carved border container */}
            <View
              style={[
                styles.carvedBorderContainer,
                {
                  borderTopColor: 'rgba(0, 0, 0, 0.3)',
                  borderLeftColor: 'rgba(0, 0, 0, 0.3)',
                  borderBottomColor: 'rgba(212, 175, 55, 0.15)',
                  borderRightColor: 'rgba(212, 175, 55, 0.15)',
                },
              ]}
            >
              <LinearGradient
                colors={[themeColors.backgroundSecondary, themeColors.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statsCard}
              >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <FontAwesome5 name="fire" size={28} color={themeColors.error} />
                  <Text style={[styles.statNumber, { color: themeColors.text }]}>
                    {recentStats.currentStreak}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                    Day Streak
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <FontAwesome5 name="percentage" size={28} color={themeColors.success} />
                  <Text style={[styles.statNumber, { color: themeColors.text }]}>
                    {recentStats.averageScore}%
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                    Avg Score
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <FontAwesome5 name="clipboard-list" size={28} color={themeColors.alexandriaGold} />
                  <Text style={[styles.statNumber, { color: themeColors.text }]}>
                    {recentStats.totalQuizzes}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                    Quizzes
                  </Text>
                </View>
              </View>
              </LinearGradient>
            </View>
          </Animatable.View>

          {/* Upload Button with Shimmer */}
          <Animatable.View animation="bounceIn" delay={600} style={styles.primaryActionContainer}>
            {/* Carved border container */}
            <View
              style={[
                styles.carvedBorderContainer,
                {
                  borderTopColor: 'rgba(0, 0, 0, 0.3)',
                  borderLeftColor: 'rgba(0, 0, 0, 0.3)',
                  borderBottomColor: 'rgba(212, 175, 55, 0.15)',
                  borderRightColor: 'rgba(212, 175, 55, 0.15)',
                },
              ]}
            >
              <Animated.View
                style={[
                  {
                    transform: [{ scale: pressAnim }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={handleUploadPress}
                  onPressIn={handleUploadPressIn}
                  onPressOut={handleUploadPressOut}
                  activeOpacity={0.98}
                  accessibilityLabel="Upload new material to create quiz"
                  accessibilityRole="button"
                  accessibilityHint="Navigate to upload screen to start a new quiz"
                >
                <LinearGradient
                  colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                  style={styles.primaryActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                    {/* Shimmer Overlay */}
                    <Animated.View
                      style={[
                        styles.shimmerOverlay,
                        {
                          transform: [{ translateX: shimmerTranslateX }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                        style={styles.shimmerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </Animated.View>

                    <View style={[styles.primaryActionIcon, { backgroundColor: themeColors.background }]}>
                      <FontAwesome5 name="plus" size={32} color={themeColors.alexandriaGold} />
                    </View>
                    <Text style={[styles.primaryActionTitle, { color: themeColors.background }]}>
                      {t('home.actions.takeNewQuiz')}
                    </Text>
                    <Text style={[styles.primaryActionSubtitle, { color: themeColors.background, opacity: 0.8 }]}>
                      {t('home.actions.uploadAndStartLearning')}
                    </Text>
                  </LinearGradient>
              </TouchableOpacity>
              </Animated.View>
            </View>
          </Animatable.View>

          {/* Ask Alexandria Button */}
          <Animatable.View animation="fadeInUp" delay={800} style={styles.askAlexandriaContainer}>
            {/* Carved border container */}
            <View
              style={[
                styles.carvedBorderContainer,
                {
                  borderTopColor: 'rgba(0, 0, 0, 0.3)',
                  borderLeftColor: 'rgba(0, 0, 0, 0.3)',
                  borderBottomColor: 'rgba(212, 175, 55, 0.15)',
                  borderRightColor: 'rgba(212, 175, 55, 0.15)',
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.askAlexandriaButton, { borderColor: themeColors.alexandriaGold, backgroundColor: 'transparent' }]}
                onPress={() => navigation.navigate('AskAlexandria')}
                activeOpacity={0.8}
              >
              <FontAwesome5 name="comments" size={18} color={themeColors.alexandriaGold} />
              <Text style={[styles.askAlexandriaText, { color: themeColors.alexandriaGold }]}>
                {t('home.actions.askAlexandriaForQuiz')}
              </Text>
              <FontAwesome5 name="arrow-right" size={14} color={themeColors.alexandriaGold} />
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* Profile & Language Menu Modals */}
      <ProfileMenuModals
        profileMenuVisible={profileMenuVisible}
        languageMenuVisible={languageMenuVisible}
        setProfileMenuVisible={setProfileMenuVisible}
        setLanguageMenuVisible={setLanguageMenuVisible}
        userName={userName}
        currentLanguage={currentLanguage}
        availableLanguages={availableLanguages}
        themeStyles={themeStyles}
        navigation={navigation}
        t={t}
        setLanguage={setLanguage}
      />

      {/* WelcomeModal for first-time users */}
      <WelcomeModal
        visible={isFocused && !onboardingLoading && isFirstTime('welcomeSeen')}
        userName={userName || 'Scholar'}
        onGetStarted={() => markAsComplete('welcomeSeen')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsCardContainer: {
    marginBottom: 30,
  },
  carvedBorderContainer: {
    borderWidth: 1,
    borderRadius: 22, // Slightly larger than inner content (20px + 2px)
    padding: 12,
    backgroundColor: 'transparent',
  },
  statsCard: {
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(248, 244, 227, 0.2)',
  },
  primaryActionContainer: {
    marginBottom: 20,
  },
  primaryAction: {
    borderRadius: 20, // Adjusted to fit within carved border (was 24)
    overflow: 'hidden',
  },
  primaryActionGradient: {
    padding: 24, // Reduced from 32 to make thinner
    borderRadius: 20, // Adjusted to fit within carved border (was 24)
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    // Enhanced depth with multi-layer shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    bottom: 0,
    width: 200,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
  },
  primaryActionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  primaryActionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  askAlexandriaContainer: {
    marginBottom: 24,
  },
  askAlexandriaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28, // Adjusted to fit within carved border (was 30)
    gap: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  askAlexandriaText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  // Logo styles
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  logoCarvedBorder: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    backgroundColor: 'transparent',
    width: 90,
    height: 90,
  },
  logoInnerContainer: {
    borderRadius: 14,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  logo: {
    width: 50,
    height: 50,
  },
});

export default HomeTab;
