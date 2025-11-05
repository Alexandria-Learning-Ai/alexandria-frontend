
import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { UserService } from '../utils/UserService';
import { StudentProfileService } from '../services/StudentProfileService';
import { ExamScheduleService } from '../utils/examScheduleService';
import UnifiedNotificationService from '../utils/UnifiedNotificationService';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService'; // ✅ NEW: Import hierarchical service
import { SubjectProgressService } from '../services/SubjectProgressService'; // ✅ NEW: Import for hierarchical progress
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
import { useTheme } from '../hooks/useTheme';
import { useUserProfile } from '../hooks/useUserProfile';
import { useQuizStats } from '../hooks/useQuizStats';
import { useHierarchicalProgress } from '../hooks/useHierarchicalProgress';
import { useOnboarding } from '../contexts/OnboardingContext';
import WelcomeModal from '../components/onboarding/WelcomeModal';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Language options are now provided by the LanguageContext

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

export default function HomeScreen({ navigation }) {
    // Language and translation hooks
    const { t, i18n } = useTranslation();
    const { currentLanguage, availableLanguages, setLanguage } = useLanguage();

    // Custom hooks
    const { isDarkMode, setIsDarkMode, themeStyles } = useTheme();
    const { userName, fullName, userProfile, profileCompletion } = useUserProfile();
    const { recentStats, refreshStats } = useQuizStats();
    const { hierarchicalInsights } = useHierarchicalProgress();
    const { onboardingState, markAsComplete, loading: onboardingLoading } = useOnboarding();
    const isFocused = useIsFocused();

    // Local state
    const [nextExam, setNextExam] = useState(null);
    const [daysLeft, setDaysLeft] = useState(0);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [showFlashcardDashboard, setShowFlashcardDashboard] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    // Profile menu states
    const [profileMenuVisible, setProfileMenuVisible] = useState(false);
    const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
    // selectedLanguage is now managed by LanguageContext

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Get a random quote
    const getRandomQuote = () => {
        const quotes = getAcademicQuotes(t);
        const randomIndex = Math.floor(Math.random() * quotes.length);
        return quotes[randomIndex];
    };

    // Move loadNextExam to the main component level
    const loadNextExam = async () => {
        try {
            const user = auth.currentUser; // ✅ Get current user
            if (!user) { // ✅ Don't load if no user
                setNextExam(null);
                return;
            }
            const exams = await ExamScheduleService.getUserExams(user.uid); // ✅ FIX: Pass userId
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
        // ✅ REMOVE: Comment out or delete the cleanup code
        // const cleanupOldData = async () => {
        //     try {
        //         await AsyncStorage.removeItem('quizHistory');
        //         await AsyncStorage.removeItem('userName');
        //         logger.info('🧹 Cleaned up old shared data');
        //     } catch (error) {
        //         logger.error('Error cleaning up data:', error);
        //     }
        // };
        // cleanupOldData();

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

    // Control welcome modal visibility with proper focus handling
    useFocusEffect(
        React.useCallback(() => {
            // Only show modal when focused, onboarding loaded, and first time
            if (!onboardingLoading && !onboardingState.welcomeSeen) {
                setShowWelcomeModal(true);
            } else {
                setShowWelcomeModal(false);
            }

            // Cleanup when screen loses focus
            return () => {
                setShowWelcomeModal(false);
            };
        }, [onboardingLoading, onboardingState.welcomeSeen])
    );

    // ✅ REMOVED: loadUserData, loadRecentStats, calculateStreak - moved to custom hooks

    // Load selected language on app start
    useEffect(() => {
        loadSelectedLanguage();
    }, []);

    // ✅ REMOVED: useFocusEffect for loadUserData - now handled by useUserProfile hook

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

    // ✅ REMOVED: handleLanguageSelect, handleProfileMenuSelect, handleSignOut moved to ProfileMenuModals component
    // ✅ REMOVED: getThemeStyles - moved to useTheme hook

    // ✅ EXTRACTED: Header component moved to components/home/HomeHeader.tsx
    // ✅ EXTRACTED: ProgressWidget & HierarchicalInsightsWidget moved to components/home/ProgressWidgets.tsx
    // ✅ EXTRACTED: SmartInsightsButton and MainActions moved to components/home/MainActions.tsx
    // ✅ EXTRACTED: MotivationalQuote component moved to components/home/MotivationalQuote.tsx
    // ✅ REMOVED: loadHierarchicalInsights - moved to useHierarchicalProgress hook
    // ✅ EXTRACTED: ExamCountdownWidget component moved to components/home/ExamCountdownWidget.tsx

    return (
        <View style={[styles.container, themeStyles.container]}>
            <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
            <NavigationTestButton />

            {/* EXPERIMENTAL: Toggle to V2 Design button */}
            {__DEV__ && (
                <TouchableOpacity
                    style={styles.experimentalToggleButton}
                    onPress={() => navigation.navigate('HomeV2')}
                >
                    <FontAwesome5 name="paint-brush" size={16} color="#D4AF37" />
                    <Text style={styles.experimentalToggleText}>Try Experimental Design</Text>
                    <View style={styles.experimentalBadge}>
                        <Text style={styles.experimentalBadgeText}>V2</Text>
                    </View>
                </TouchableOpacity>
            )}

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={refreshStats}
                            colors={[themeStyles.refreshColor.color]}
                            tintColor={themeStyles.refreshColor.color}
                        />
                    }
                >
                    <HomeHeader
                        userName={userName}
                        profileCompletion={profileCompletion}
                        recentStats={recentStats}
                        themeStyles={themeStyles}
                        t={t}
                        onProfilePress={() => setProfileMenuVisible(true)}
                    />
                    <ProgressWidget navigation={navigation} themeStyles={themeStyles} t={t} />
                    <HierarchicalInsightsWidget
                        navigation={navigation}
                        themeStyles={themeStyles}
                        t={t}
                        hierarchicalInsights={hierarchicalInsights}
                    />
                    <MainActions
                        navigation={navigation}
                        themeStyles={themeStyles}
                        t={t}
                        onShowFlashcardDashboard={() => setShowFlashcardDashboard(true)}
                    />
                    <MotivationalQuote quote={currentQuote} themeStyles={themeStyles} />
                    <ExamCountdownWidget exam={nextExam} daysLeft={daysLeft} navigation={navigation} t={t} />

                    {/* ✅ REMOVED: Temporary subscription test button */}

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>Recent Activity</Text>
                        {/* Your existing recent activity content */}
                    </View>
                </ScrollView>
            </Animated.View>

            {/* ✅ NEW: Flashcard Dashboard Modal */}
            {showFlashcardDashboard && (
                <FlashcardDashboard
                    navigation={navigation}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowFlashcardDashboard(false)}
                />
            )}

            {/* ✅ EXTRACTED: Profile & Language Menu Modals moved to ProfileMenuModals component */}
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

            {/* ✅ NEW: Welcome Modal for first-time users (only when screen is focused and onboarding loaded) */}
            <WelcomeModal
                visible={showWelcomeModal}
                userName={userName || 'Scholar'}
                onGetStarted={() => {
                    markAsComplete('welcomeSeen');
                    setShowWelcomeModal(false);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    // ✅ REMOVED: HomeHeader styles moved to HomeHeader component
    // ✅ REMOVED: ProgressWidget & HierarchicalInsightsWidget styles moved to ProgressWidgets component
    // ✅ REMOVED: MainActions styles (including askAlexandria) moved to MainActions component
    // ✅ REMOVED: Quote styles moved to MotivationalQuote component
    // ✅ REMOVED: Exam countdown styles moved to ExamCountdownWidget component
    cardContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    card: {
        width: '48%',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 8,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    // EXPERIMENTAL: Toggle button styles
    experimentalToggleButton: {
        position: 'absolute',
        top: 110,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#D4AF37',
        zIndex: 1000,
        shadowColor: '#D4AF37',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    experimentalToggleText: {
        color: '#F8F4E3',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8,
        marginRight: 8,
        letterSpacing: 0.3,
    },
    experimentalBadge: {
        backgroundColor: '#D4AF37',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    experimentalBadgeText: {
        color: '#1A2C5B',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    // ✅ REMOVED: All modal styles moved to ProfileMenuModals component
});