/**
 * HomeScreenV2 - Experimental Design System Implementation
 *
 * This is an experimental version of HomeScreen that uses the new design system.
 * It maintains the EXACT SAME layout and functionality as the original HomeScreen,
 * with ONLY visual styling changes (colors, gradients, shadows).
 *
 * Changes from HomeScreen:
 * 1. Uses useExperimentalTheme instead of useTheme
 * 2. Adds LinearGradient background wrapper
 * 3. All other functionality remains identical
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
        StyleSheet,
        Animated,
        Dimensions,
        ScrollView,
        Alert,
        RefreshControl,
    Modal,
    FlatList,
    Linking,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import FeatureOrbSectionCard from '../components-experimental/FeatureOrbSectionCard';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PrimaryButton from '../components-experimental/PrimaryButton';
import FeatureCard from '../components-experimental/FeatureCard';
import CircularOrb from '../components-experimental/CircularOrb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { UserService } from '../utils/UserService';
import { StudentProfileService } from '../services/StudentProfileService';
import { ExamScheduleService } from '../utils/examScheduleService';
import MaterialCard from '../components/materials/MaterialCard';
import UnifiedNotificationService from '../utils/UnifiedNotificationService';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService';
import { SubjectProgressService } from '../services/SubjectProgressService';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import FlashcardDashboard from '../components/FlashcardDashboard';
import NavigationTestButton from '../components/NavigationTestButton';
import MotivationalQuote from '../components/home/MotivationalQuote';
import ExamCountdownWidget from '../components/home/ExamCountdownWidget';
import MainActions from '../components/home/MainActions';
import HomeHeader from '../components/home/HomeHeader';
import { ProgressWidget, HierarchicalInsightsWidget } from '../components/home/ProgressWidgets';
import ProfileMenuModals from '../components/home/ProfileMenuModals';
import logger from '../utils/logger';
import { useExperimentalTheme } from '../hooks/useExperimentalTheme'; // ⭐ EXPERIMENTAL: Use new theme hook
import { gradients, spacing, typography, radius } from '../theme-experimental/tokens'; // ⭐ EXPERIMENTAL: Import design tokens
import { useUserProfile } from '../hooks/useUserProfile';
import { useQuizStats } from '../hooks/useQuizStats';
import { useHierarchicalProgress } from '../hooks/useHierarchicalProgress';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Function to get translated academic quotes
const getAcademicQuotes = (t) => {
    // Safety guard during language transitions
    if (!t || typeof t !== 'function') {
        return [
            { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
            { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
            { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" }
        ];
    }

    return [
    {
        text: (t && t('quotes.quote1.text')) || "The expert in anything was once a beginner.",
        author: (t && t('quotes.quote1.author')) || "Helen Hayes"
    },
    {
        text: (t && t('quotes.quote2.text')) || "Education is the most powerful weapon which you can use to change the world.",
        author: (t && t('quotes.quote2.author')) || "Nelson Mandela"
    },
    {
        text: (t && t('quotes.quote3.text')) || "The beautiful thing about learning is that no one can take it away from you.",
        author: (t && t('quotes.quote3.author')) || "B.B. King"
    },
    {
        text: (t && t('quotes.quote4.text')) || "Live as if you were to die tomorrow. Learn as if you were to live forever.",
        author: (t && t('quotes.quote4.author')) || "Mahatma Gandhi"
    },
    {
        text: (t && t('quotes.quote5.text')) || "The more that you read, the more things you will know.",
        author: (t && t('quotes.quote5.author')) || "Dr. Seuss"
    },
    {
        text: (t && t('quotes.quote6.text')) || "Learning never exhausts the mind.",
        author: (t && t('quotes.quote6.author')) || "Leonardo da Vinci"
    },
    {
        text: (t && t('quotes.quote7.text')) || "Education is not preparation for life; education is life itself.",
        author: (t && t('quotes.quote7.author')) || "John Dewey"
    },
    {
        text: (t && t('quotes.quote8.text')) || "The capacity to learn is a gift; the ability to learn is a skill.",
        author: (t && t('quotes.quote8.author')) || "Brian Herbert"
    },
    {
        text: (t && t('quotes.quote9.text')) || "Tell me and I forget, teach me and I may remember, involve me and I learn.",
        author: (t && t('quotes.quote9.author')) || "Benjamin Franklin"
    },
    {
        text: (t && t('quotes.quote10.text')) || "The mind is not a vessel to be filled, but a fire to be kindled.",
        author: (t && t('quotes.quote10.author')) || "Plutarch"
    },
    {
        text: (t && t('quotes.quote11.text')) || "Knowledge is power.",
        author: (t && t('quotes.quote11.author')) || "Francis Bacon"
    }
    ];
};

// Fallback UserService functions
const UserServiceFallback = {
    getGreeting: (t) => {
        const hour = new Date().getHours();
        if (hour < 12) return t ? t('home.greeting.morning') : 'Good morning';
        if (hour < 17) return t ? t('home.greeting.afternoon') : 'Good afternoon';
        return t ? t('home.greeting.evening') : 'Good evening';
    },
    getFirstName: (fullName) => {
        if (!fullName) return t ? t('home.defaultUser') || 'Student' : 'Student';
        return fullName.split(' ')[0];
    },
    getUserProfile: async () => null
};

export default function HomeScreenV2({ navigation }) {
    // Language and translation hooks
    const { t, i18n } = useTranslation();
    const { currentLanguage, availableLanguages, setLanguage } = useLanguage();

    // Custom hooks
    const { isDarkMode, setIsDarkMode, themeStyles, colors, gradients } = useExperimentalTheme(); // ⭐ EXPERIMENTAL: Use new theme
    const { userName, fullName, userProfile, profileCompletion } = useUserProfile();
    const { recentStats, refreshStats } = useQuizStats();
    const { hierarchicalInsights } = useHierarchicalProgress();

    // Local state
    const [nextExam, setNextExam] = useState(null);
    const [daysLeft, setDaysLeft] = useState(0);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [showFlashcardDashboard, setShowFlashcardDashboard] = useState(false);

    // Profile menu states
    const [profileMenuVisible, setProfileMenuVisible] = useState(false);
    const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Hide header for full gradient background
    React.useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // Get a random quote
    const getRandomQuote = () => {
        const quotes = getAcademicQuotes(t);
        const randomIndex = Math.floor(Math.random() * quotes.length);
        return quotes[randomIndex];
    };

    // Move loadNextExam to the main component level
    const loadNextExam = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setNextExam(null);
                return;
            }
            const exams = await ExamScheduleService.getUserExams(user.uid);
            const futureExams = exams.filter(exam =>
                ExamScheduleService.calculateDaysUntilExam(exam.examDate) >= 0
            );

            if (futureExams.length > 0) {
                const next = futureExams[0];
                setNextExam(next);
                setDaysLeft(ExamScheduleService.calculateDaysUntilExam(next.examDate));
            } else {
                setNextExam(null);
            }
        } catch (error) {
            logger.error('Error loading next exam:', error);
        }
    };

    useEffect(() => {
        // Initialize data
        loadNextExam();

        setCurrentQuote(getRandomQuote());

        const examInterval = setInterval(loadNextExam, 60000);

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

        return () => {
            clearInterval(examInterval);
        };
    }, []);

    // Update quote when language changes
    useEffect(() => {
        if (t && i18n.language) {
            setCurrentQuote(getRandomQuote());
        }
    }, [i18n.language, t]);

    // Load selected language on app start
    useEffect(() => {
        loadSelectedLanguage();
    }, []);

    const loadSelectedLanguage = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const savedLanguage = await AsyncStorage.getItem(`selectedLanguage_${user.uid}`);
                // Language is now handled by LanguageContext
            }
        } catch (error) {
            logger.error('Error loading language preference:', error);
        }
    };

    return (
        <LinearGradient
            colors={gradients.appBg}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor={gradients.appBg[0]} />

                {/* EXPERIMENTAL: Back to Original HomeScreen button */}
                {__DEV__ && (
                    <TouchableOpacity
                        style={styles.backToOriginalButton}
                        onPress={() => navigation.navigate('Home')}
                        activeOpacity={0.8}
                    >
                        <FontAwesome5 name="arrow-left" size={14} color="#FFD15C" />
                        <Text style={styles.backToOriginalText}>Back to Original</Text>
                    </TouchableOpacity>
                )}

                <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={false}
                                onRefresh={refreshStats}
                                colors={[colors.gold]}
                                tintColor={colors.gold}
                            />
                        }
                    >
                        {/* Header with Profile */}
                        <View style={styles.header}>
                            <View>
                                <Text style={[typography.body, { color: colors.textDim, fontSize: 16 }]}>
                                    Welcome back,
                                </Text>
                                <Text style={[typography.h1, {
                                    fontSize: 28,
                                    fontWeight: '800',
                                    color: '#FFFFFF',
                                    textShadowColor: 'rgba(255,255,255,0.1)',
                                    textShadowRadius: 6,
                                    textShadowOffset: { width: 0, height: 2 },
                                    marginBottom: 20,
                                }]}>
                                    {userName || 'Student'} 👋
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.profileButton}
                                onPress={() => setProfileMenuVisible(true)}
                                activeOpacity={0.8}
                            >
                                <FontAwesome5 name="user-circle" size={32} color={colors.gold} />
                            </TouchableOpacity>
                        </View>

                        {/* Primary CTA - Take New Quiz */}
                        <View style={styles.ctaSection}>
                            <PrimaryButton
                                title="Take New Quiz"
                                onPress={() => navigation.navigate('Upload')}
                            />
                            <Text style={[typography.body, { textAlign: 'center', marginTop: spacing.sm, color: colors.textDim }]}>
                                Upload study material and start learning
                            </Text>
                        </View>

                        {/* Ask Alexandria Button */}
                        <TouchableOpacity
                            style={styles.askAlexandriaButton}
                            onPress={() => navigation.navigate('AskAlexandria')}
                            activeOpacity={0.8}
                        >
                            <Text style={[typography.body, { color: colors.gold, fontWeight: '600' }]}>
                                Ask Alexandria for a Quiz
                            </Text>
                            <FontAwesome5 name="arrow-right" size={16} color={colors.gold} />
                        </TouchableOpacity>

                        {/* Features Section - Two-Tier Layout */}
                        <View style={styles.featuresSection}>
                            {/* Top: Rectangular Feature Cards (2 cards side-by-side) */}
                            <View style={styles.featureCardsRow}>
                                <FeatureCard
                                    title="Review Flashcards"
                                    icon="layer-group"
                                    onPress={() => {
                                        setShowFlashcardDashboard(true);
                                    }}
                                />
                                <View style={{ width: spacing.lg }} />
                                <FeatureCard
                                    title="Continue Studying"
                                    icon="book"
                                    onPress={() => navigation.navigate('StudyMaterials')}
                                />
                            </View>

                            {/* Orbs Section – Two Rows, Three Columns */}
                            <FeatureOrbSectionCard>
                              <View style={styles.orbsGrid}>
                                <View style={styles.orbRow}>
                                  <CircularOrb
                                    title="Smart Insights"
                                    icon="brain"
                                    onPress={() => navigation.navigate('Progress')}
                                  />
                                  <CircularOrb
                                    title="Audio Playlists"
                                    icon="headphones"
                                    onPress={() => navigation.navigate('AudioPlaylists')}
                                  />
                                  <CircularOrb
                                    title="Progress Dashboard"
                                    icon="chart-bar"
                                    onPress={() => navigation.navigate('Progress')}
                                  />
                                </View>

                                <View style={styles.orbRow}>
                                  <CircularOrb
                                    title="Daily Reflections"
                                    icon="book-open"
                                    onPress={() => navigation.navigate('Reflections')}
                                  />
                                  <CircularOrb
                                    title="Mood Journal"
                                    icon="smile"
                                    onPress={() => navigation.navigate('MoodJournal')}
                                  />
                                  <CircularOrb
                                    title="Book Study"
                                    icon="target"
                                    onPress={() => navigation.navigate('MaterialCard')}
                                  />
                                </View>
                              </View>
                            </FeatureOrbSectionCard>
                            <View style={{ height: spacing.lg }} />
                        {currentQuote && (
                            <View style={styles.quoteSection}>
                                <View style={styles.quoteContainer}>
                                    <FontAwesome5 name="quote-left" size={20} color={colors.gold} style={{ marginBottom: spacing.sm }} />
                                    <Text style={[typography.body, { fontStyle: 'italic', marginBottom: spacing.sm, color: colors.text }]}>
                                        {currentQuote.text}
                                    </Text>
                                    <Text style={[typography.body, { fontSize: 14, color: colors.textMute, textAlign: 'right' }]}>
                                        - {currentQuote.author}
                                    </Text>
                                </View>
                            </View>
                        )}
                        </View>
                    </ScrollView>
                </Animated.View>

                {/* Flashcard Dashboard Modal */}
                {showFlashcardDashboard && (
                    <FlashcardDashboard
                        navigation={navigation}
                        isDarkMode={isDarkMode}
                        onClose={() => setShowFlashcardDashboard(false)}
                    />
                )}

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
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xl,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(248, 244, 227, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaSection: {
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
    },
    askAlexandriaButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: radius.xl,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 213, 92, 0.8)',
        backgroundColor: 'rgba(255, 213, 92, 0.05)',
        marginTop: 16,
        gap: 8,
    },
    featureCardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginVertical: spacing.xl,
        paddingHorizontal: spacing.sm,
        gap: spacing.md,
    },
    orbsGrid: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20, // space between rows
        marginTop: 12,
    },
    orbRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        gap: 12,
    },
    // EXPERIMENTAL: Back button styles (only in dev mode)
    backToOriginalButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 26, 43, 0.95)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#FFD15C',
        zIndex: 1000,
        shadowColor: '#FFD15C',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    backToOriginalText: {
        color: '#F8F4E3',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8,
        letterSpacing: 0.3,
    },
});
