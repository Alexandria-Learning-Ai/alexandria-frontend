import React, { useState, useEffect, useRef } from 'react';
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
import { NotificationManager } from '../utils/NotificationManager';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import FlashcardDashboard from '../components/FlashcardDashboard';
import NavigationTestButton from '../components/NavigationTestButton';
import logger from '../utils/logger';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Language options are now provided by the LanguageContext

// Profile menu options - labels will be translated dynamically
const getProfileMenuOptions = (t) => {
    // Safety guard to prevent undefined labels during language transitions
    if (!t || typeof t !== 'function') {
        return [
            { id: 'viewProfile', icon: 'user-circle', label: 'View Profile', type: 'action' },
            { id: 'editProfile', icon: 'edit', label: 'Edit Profile', type: 'action' },
            { id: 'divider1', type: 'divider' },
            { id: 'language', icon: 'globe', label: 'Language', type: 'submenu' },
            { id: 'settings', icon: 'cog', label: 'Settings', type: 'action' },
            { id: 'help', icon: 'question-circle', label: 'Help & Support', type: 'action' },
            { id: 'privacy', icon: 'shield-alt', label: 'Privacy Policy', type: 'action' },
            { id: 'about', icon: 'info-circle', label: 'About Alexandria', type: 'action' },
            { id: 'divider2', type: 'divider' },
            { id: 'signout', icon: 'sign-out-alt', label: 'Sign Out', type: 'destructive' },
        ];
    }
    
    return [
        { id: 'viewProfile', icon: 'user-circle', label: t('menu.viewProfile') || 'View Profile', type: 'action' },
        { id: 'editProfile', icon: 'edit', label: t('menu.editProfile') || 'Edit Profile', type: 'action' },
        { id: 'divider1', type: 'divider' },
        { id: 'language', icon: 'globe', label: t('menu.language') || 'Language', type: 'submenu' },
        { id: 'settings', icon: 'cog', label: t('menu.settings') || 'Settings', type: 'action' },
        { id: 'help', icon: 'question-circle', label: t('menu.helpSupport') || 'Help & Support', type: 'action' },
        { id: 'privacy', icon: 'shield-alt', label: t('menu.privacyPolicy') || 'Privacy Policy', type: 'action' },
        { id: 'about', icon: 'info-circle', label: t('menu.aboutAlexandria') || 'About Alexandria', type: 'action' },
        { id: 'divider2', type: 'divider' },
        { id: 'signout', icon: 'sign-out-alt', label: t('menu.signOut') || 'Sign Out', type: 'destructive' },
    ];
};

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
    
    const [userName, setUserName] = useState('Student');
    const [recentStats, setRecentStats] = useState({
        totalQuizzes: 0,
        averageScore: 0,
        currentStreak: 0
    });
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [fullName, setFullName] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [nextExam, setNextExam] = useState(null);
    const [daysLeft, setDaysLeft] = useState(0);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [showFlashcardDashboard, setShowFlashcardDashboard] = useState(false);
    
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

        // ✅ KEEP: Just the essential initialization
        loadUserData();
        loadRecentStats();
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

    const loadUserData = async () => {
        try {
            const user = auth?.currentUser;
            if (user) {
                const userServiceToUse = UserService || UserServiceFallback;
                const profile = await userServiceToUse.getUserProfile(user.uid);
                if (profile && profile.fullName) {
                    setFullName(profile.fullName);
                    setUserName(userServiceToUse.getFirstName(profile.fullName));
                } else {
                    setUserName('Student'); // Default if no profile found
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
                        // You could navigate to profile creation here if desired
                        // navigation.navigate('ProfileScreen');
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
        }
    };

    const loadRecentStats = async () => {
        try {
            const user = auth.currentUser; // ✅ Get current user
            if (!user) return; // ✅ Don't load if no user
            
            // ✅ Use user-specific key instead of global key
            const quizHistory = await AsyncStorage.getItem(`quizHistory_${user.uid}`);
            
            if (quizHistory) {
                const quizzes = JSON.parse(quizHistory);
                const totalQuizzes = quizzes.length;
                
                if (totalQuizzes > 0) {
                    const totalCorrect = quizzes.reduce((sum, quiz) => sum + (quiz.results?.score || 0), 0);
                    const totalQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.results?.totalQuestions || 0), 0);
                    const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
                    
                    const currentStreak = calculateStreak(quizzes);
                    
                    setRecentStats({
                        totalQuizzes,
                        averageScore,
                        currentStreak
                    });
                }
            }
        } catch (error) {
            logger.error('Error loading recent stats:', error);
        }
    };

    const calculateStreak = (quizzes) => {
        if (quizzes.length === 0) return 0;
        
        const sortedQuizzes = quizzes.sort((a, b) => 
            new Date(b.metadata?.completedAt) - new Date(a.metadata?.completedAt)
        );
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const quiz of sortedQuizzes) {
            const quizDate = new Date(quiz.metadata?.completedAt);
            quizDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((currentDate - quizDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    };

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

    const handleLanguageSelect = async (language) => {
        try {
            await setLanguage(language);
            setLanguageMenuVisible(false);
            setProfileMenuVisible(false);
            
            Alert.alert(
                t('messages.languageUpdated'),
                t('messages.languageUpdatedDesc'),
                [{ text: t('common.ok'), style: 'default' }]
            );
        } catch (error) {
            logger.error('Error saving language preference:', error);
            Alert.alert(t('common.error'), 'Failed to update language preference');
        }
    };

    const handleProfileMenuSelect = (option) => {
        setProfileMenuVisible(false);
        
        switch (option.id) {
            case 'viewProfile':
                navigation.navigate('ProfileView');
                break;
            case 'editProfile':
                navigation.navigate('ProfileScreen');
                break;
            case 'language':
                setLanguageMenuVisible(true);
                break;
            case 'settings':
                Alert.alert(t('menu.settings'), t('alerts.comingSoon'));
                break;
            case 'help':
                Alert.alert(
                    t('menu.helpSupport'),
                    'Need help? Contact our support team.',
                    [
                        { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@alexandria.app') },
                        { text: t('alerts.cancel'), style: 'cancel' }
                    ]
                );
                break;
            case 'privacy':
                Alert.alert(
                    'Privacy Policy',
                    'Your privacy is important to us. We collect minimal data necessary for app functionality.',
                    [
                        { text: 'View Full Policy', onPress: () => Linking.openURL('https://alexandria.app/privacy') },
                        { text: 'OK', style: 'default' }
                    ]
                );
                break;
            case 'about':
                Alert.alert(
                    'About Alexandria',
                    'Alexandria Quiz App v1.0\n\nYour AI-powered learning companion.\n\nBuilt with ❤️ for students everywhere.',
                    [{ text: 'OK', style: 'default' }]
                );
                break;
            case 'signout':
                handleSignOut();
                break;
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            t('auth.signOut'),
            t('messages.signOutConfirm'),
            [
                { text: t('alerts.cancel'), style: 'cancel' },
                { 
                    text: t('auth.signOut'), 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                        } catch (error) {
                            Alert.alert(t('alerts.error'), t('messages.failedToSignOut'));
                        }
                    }
                }
            ]
        );
    };

    // Get theme styles
    const getThemeStyles = () => {
        if (isDarkMode) {
            return {
                container: { backgroundColor: '#1A2C5B' },
                greeting: { color: '#F8F4E3' },
                userName: { color: '#F8F4E3' },
                profileButton: { backgroundColor: 'rgba(248, 244, 227, 0.1)' },
                profileIcon: { color: '#F8F4E3' },
                quickStats: { backgroundColor: 'rgba(248, 244, 227, 0.1)' },
                statNumber: { color: '#F8F4E3' },
                statLabel: { color: '#CBD5E0' },
                
                // Progress Widget
                progressWidget: { backgroundColor: 'rgba(44, 70, 125, 0.8)' },
                progressIcon: { color: '#D4AF37' },
                progressTitle: { color: '#F8F4E3' },
                progressStatNumber: { color: '#F8F4E3' },
                progressStatLabel: { color: '#CBD5E0' },
                strengthWeaknessLabel: { color: '#CBD5E0' },
                strengthWeaknessValue: { color: '#F8F4E3' },
                quickProgressAction: { backgroundColor: 'rgba(212, 175, 55, 0.2)', borderColor: '#D4AF37' },
                quickProgressActionText: { color: '#D4AF37' },
                noProgressIcon: { color: '#F8F4E3' },
                noProgressText: { color: '#CBD5E0' },
                startButton: { backgroundColor: '#D4AF37' },
                startButtonText: { color: '#1A2C5B' },
                
                // Buttons
                primaryAction: { backgroundColor: '#D4AF37' },
                primaryActionIcon: { backgroundColor: '#1A2C5B' },
                primaryActionIconColor: { color: '#F8F4E3' },
                primaryActionTitle: { color: '#1A2C5B' },
                primaryActionSubtitle: { color: '#1A2C5B' },
                
                secondaryAction: { backgroundColor: 'rgba(44, 70, 125, 0.8)' },
                secondaryActionTitle: { color: '#F8F4E3' },
                secondaryActionSubtitle: { color: '#CBD5E0' },
                
                additionalFeatureButton: { backgroundColor: 'rgba(248, 244, 227, 0.1)', borderColor: 'rgba(248, 244, 227, 0.3)' },
                additionalFeatureIcon: { color: '#F8F4E3' },
                additionalFeatureText: { color: '#F8F4E3' },
                
                quoteContainer: { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: 'rgba(212, 175, 55, 0.4)' },
                quoteIcon: { color: '#D4AF37' },
                quoteText: { color: '#F8F4E3' },
                quoteAuthor: { color: '#CBD5E0' },
                
                askAlexandriaButton: { backgroundColor: 'rgba(44, 70, 125, 0.8)', borderColor: '#D4AF37' },
                askAlexandriaText: { color: '#F8F4E3' },
                askAlexandriaIcon: { color: '#D4AF37' },
                
                refreshColor: { color: '#D4AF37' },
                
                // Profile Menu Dark
                profileMenuContainer: { backgroundColor: 'rgba(44, 70, 125, 0.95)' },
                profileMenuAvatar: { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
                profileMenuUserName: { color: '#F8F4E3' },
                profileMenuUserEmail: { color: '#CBD5E0' },
                profileMenuDivider: { backgroundColor: 'rgba(248, 244, 227, 0.2)' },
                profileMenuItem: { backgroundColor: 'transparent' },
                profileMenuItemIcon: { color: '#F8F4E3' },
                profileMenuItemText: { color: '#F8F4E3' },
                profileMenuLanguageFlag: { color: '#F8F4E3' },
                profileMenuChevron: { color: '#CBD5E0' },
                
                // Language Menu Dark
                languageMenuContainer: { backgroundColor: 'rgba(44, 70, 125, 0.95)' },
                languageMenuTitle: { color: '#F8F4E3' },
                languageMenuItem: { backgroundColor: 'transparent' },
                languageLabel: { color: '#F8F4E3' },
            };
        } else {
            return {
                container: { backgroundColor: '#F8F4E3' },
                greeting: { color: '#4A5568' },
                userName: { color: '#1A2C5B' },
                profileButton: { backgroundColor: 'rgba(255, 255, 255, 0.9)', shadowColor: '#1A2C5B' },
                profileIcon: { color: '#1A2C5B' },
                quickStats: { backgroundColor: 'rgba(255, 255, 255, 0.95)', shadowColor: '#1A2C5B' },
                statNumber: { color: '#1A2C5B' },
                statLabel: { color: '#4A5568' },
                
                // Progress Widget
                progressWidget: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
                progressIcon: { color: '#1A2C5B' },
                progressTitle: { color: '#1A2C5B' },
                progressStatNumber: { color: '#1A2C5B' },
                progressStatLabel: { color: '#4A5568' },
                strengthWeaknessLabel: { color: '#4A5568' },
                strengthWeaknessValue: { color: '#1A2C5B' },
                quickProgressAction: { backgroundColor: 'rgba(26, 44, 91, 0.1)', borderColor: '#1A2C5B' },
                quickProgressActionText: { color: '#1A2C5B' },
                noProgressIcon: { color: '#1A2C5B' },
                noProgressText: { color: '#4A5568' },
                startButton: { backgroundColor: '#1A2C5B' },
                startButtonText: { color: '#FFFFFF' },
                
                // Buttons
                primaryAction: { backgroundColor: '#1A2C5B' },
                primaryActionIcon: { backgroundColor: '#D4AF37' },
                primaryActionIconColor: { color: '#1A2C5B' },
                primaryActionTitle: { color: '#FFFFFF' },
                primaryActionSubtitle: { color: '#FFFFFF' },
                
                secondaryAction: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
                secondaryActionTitle: { color: '#1A2C5B' },
                secondaryActionSubtitle: { color: '#4A5568' },
                
                additionalFeatureButton: { backgroundColor: 'rgba(26, 44, 91, 0.05)', borderColor: 'rgba(26, 44, 91, 0.2)' },
                additionalFeatureIcon: { color: '#1A2C5B' },
                additionalFeatureText: { color: '#1A2C5B' },
                
                quoteContainer: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.3)' },
                quoteIcon: { color: '#D4AF37' },
                quoteText: { color: '#1A2C5B' },
                quoteAuthor: { color: '#4A5568' },
                
                askAlexandriaButton: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#1A2C5B' },
                askAlexandriaText: { color: '#1A2C5B' },
                askAlexandriaIcon: { color: '#1A2C5B' },
                
                refreshColor: { color: '#1A2C5B' },
                
                // Profile Menu Light
                profileMenuContainer: { backgroundColor: 'rgba(255, 255, 255, 0.98)' },
                profileMenuAvatar: { backgroundColor: 'rgba(26, 44, 91, 0.1)' },
                profileMenuUserName: { color: '#1A2C5B' },
                profileMenuUserEmail: { color: '#4A5568' },
                profileMenuDivider: { backgroundColor: 'rgba(26, 44, 91, 0.1)' },
                profileMenuItem: { backgroundColor: 'transparent' },
                profileMenuItemIcon: { color: '#1A2C5B' },
                profileMenuItemText: { color: '#1A2C5B' },
                profileMenuLanguageFlag: { color: '#1A2C5B' },
                profileMenuChevron: { color: '#4A5568' },
                
                // Language Menu Light
                languageMenuContainer: { backgroundColor: 'rgba(255, 255, 255, 0.98)' },
                languageMenuTitle: { color: '#1A2C5B' },
                languageMenuItem: { backgroundColor: 'transparent' },
                languageLabel: { color: '#1A2C5B' },
            };
        }
    };

    const currentThemeStyles = getThemeStyles();

    const Header = () => (
        <Animatable.View animation="fadeInDown" delay={200} style={styles.headerContainer}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={[styles.greeting, currentThemeStyles.greeting]}>
                        {(UserService?.getGreeting?.(t) || UserServiceFallback.getGreeting(t))},
                    </Text>
                    <Text style={[styles.userName, currentThemeStyles.userName]}>
                        {userName || 'Student'}! 👋
                    </Text>
                    {profileCompletion > 0 && profileCompletion < 100 && (
                        <View style={styles.profileCompletionContainer}>
                            <View style={styles.profileCompletionBar}>
                                <View style={[styles.profileCompletionFill, { width: `${profileCompletion}%` }]} />
                            </View>
                            <Text style={styles.profileCompletionText}>{t('profile.profileCompletion')} {profileCompletion}% {t('profile.complete')}</Text>
                        </View>
                    )}
                </View>
                
                <TouchableOpacity 
                    style={[styles.profileButton, currentThemeStyles.profileButton]}
                    onPress={() => setProfileMenuVisible(true)}
                >
                    <FontAwesome5 name="user" size={20} color={currentThemeStyles.profileIcon.color} />
                </TouchableOpacity>
            </View>

            <Animatable.View animation="slideInUp" delay={600} style={[styles.quickStats, currentThemeStyles.quickStats]}>
                <View style={styles.statItem}>
                    <FontAwesome5 name="clipboard-list" size={16} color="#D4AF37" />
                    <Text style={[styles.statNumber, currentThemeStyles.statNumber]}>{recentStats.totalQuizzes}</Text>
                    <Text style={[styles.statLabel, currentThemeStyles.statLabel]}>{t('home.quickStats.quizzes')}</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                    <FontAwesome5 name="percentage" size={16} color="#28a745" />
                    <Text style={[styles.statNumber, currentThemeStyles.statNumber]}>{recentStats.averageScore}%</Text>
                    <Text style={[styles.statLabel, currentThemeStyles.statLabel]}>{t('home.quickStats.avgScore')}</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                    <FontAwesome5 name="fire" size={16} color="#dc3545" />
                    <Text style={[styles.statNumber, currentThemeStyles.statNumber]}>{recentStats.currentStreak}</Text>
                    <Text style={[styles.statLabel, currentThemeStyles.statLabel]}>{t('home.quickStats.streak')}</Text>
                </View>
            </Animatable.View>
        </Animatable.View>
    );

    const ProgressWidget = () => {
        const [progressData, setProgressData] = useState({
            recentScores: [],
            improvementTrend: 0,
            strongestCategory: '',
            weakestCategory: '',
            totalQuizzes: 0,
            averageScore: 0
        });

        useEffect(() => {
            loadProgressWidget();
        }, []);

        const loadProgressWidget = async () => {
            try {
                const user = auth.currentUser; // ✅ Get current user
                if (!user) return; // ✅ Don't load if no user
                
                // ✅ Use user-specific key
                const quizHistory = await AsyncStorage.getItem(`quizHistory_${user.uid}`);
                
                if (quizHistory) {
                    const quizzes = JSON.parse(quizHistory);
                    
                    const recentScores = quizzes.slice(0, 5).map(quiz => quiz.results?.percentage || 0);
                    const improvementTrend = calculateTrend(recentScores);
                    const categoryStats = calculateCategoryStats(quizzes);
                    
                    setProgressData({
                        recentScores,
                        improvementTrend,
                        strongestCategory: categoryStats.strongest,
                        weakestCategory: categoryStats.weakest,
                        totalQuizzes: quizzes.length,
                        averageScore: calculateOverallAverage(quizzes)
                    });
                }
            } catch (error) {
                logger.error('Error loading progress widget:', error);
            }
        };

        const calculateTrend = (scores) => {
            if (scores.length < 2) return 0;
            const recent = scores.slice(0, Math.ceil(scores.length / 2));
            const older = scores.slice(Math.ceil(scores.length / 2));
            
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
            
            return Math.round(recentAvg - olderAvg);
        };

        const calculateCategoryStats = (quizzes) => {
            const categoryMap = new Map();
            
            quizzes.forEach(quiz => {
                const category = quiz.metadata?.category || t('home.categories.general');
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, { total: 0, correct: 0 });
                }
                const stats = categoryMap.get(category);
                stats.total += quiz.results?.totalQuestions || 0;
                stats.correct += quiz.results?.score || 0;
            });

            let strongest = '';
            let weakest = '';
            let highestAccuracy = 0;
            let lowestAccuracy = 100;

            categoryMap.forEach((stats, category) => {
                if (stats.total > 0) {
                    const accuracy = (stats.correct / stats.total) * 100;
                    if (accuracy > highestAccuracy) {
                        highestAccuracy = accuracy;
                        strongest = category;
                    }
                    if (accuracy < lowestAccuracy) {
                        lowestAccuracy = accuracy;
                        weakest = category;
                    }
                }
            });

            return { strongest, weakest };
        };

        const calculateOverallAverage = (quizzes) => {
            const totalCorrect = quizzes.reduce((sum, quiz) => sum + (quiz.results?.score || 0), 0);
            const totalQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.results?.totalQuestions || 0), 0);
            return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        };

        const getTrendIcon = () => {
            if (progressData.improvementTrend > 0) return { name: 'arrow-up', color: '#28a745' };
            if (progressData.improvementTrend < 0) return { name: 'arrow-down', color: '#dc3545' };
            return { name: 'minus', color: '#ffc107' };
        };

        const trendIcon = getTrendIcon();

        if (progressData.totalQuizzes === 0) {
            return (
                <Animatable.View animation="slideInUp" delay={700} style={[styles.progressWidget, currentThemeStyles.progressWidget]}>
                    <View style={styles.progressHeader}>
                        <FontAwesome5 name="chart-line" size={20} color={currentThemeStyles.progressIcon.color} />
                        <Text style={[styles.progressTitle, currentThemeStyles.progressTitle]}>Your Progress</Text>
                    </View>
                    <View style={styles.noProgressContainer}>
                        <FontAwesome5 name="book-open" size={32} color={currentThemeStyles.noProgressIcon.color} />
                        <Text style={[styles.noProgressText, currentThemeStyles.noProgressText]}>
                            Take your first quiz to see your progress!
                        </Text>
                        <TouchableOpacity
                            style={[styles.startButton, currentThemeStyles.startButton]}
                            onPress={() => navigation.navigate('Upload')}
                        >
                            <Text style={[styles.startButtonText, currentThemeStyles.startButtonText]}>{t('home.actions.startLearning')}</Text>
                        </TouchableOpacity>
                    </View>
                </Animatable.View>
            );
        }

        return (
            <Animatable.View animation="slideInUp" delay={700} style={[styles.progressWidget, currentThemeStyles.progressWidget]}>
                <View style={styles.progressHeader}>
                    <FontAwesome5 name="chart-line" size={20} color={currentThemeStyles.progressIcon.color} />
                    <Text style={[styles.progressTitle, currentThemeStyles.progressTitle]}>Your Progress</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ProgressTracker')}>
                        <FontAwesome5 name="external-link-alt" size={16} color={currentThemeStyles.progressIcon.color} />
                    </TouchableOpacity>
                </View>

                <View style={styles.progressContent}>
                    <View style={styles.progressStatsRow}>
                        <View style={styles.progressStat}>
                            <Text style={[styles.progressStatNumber, currentThemeStyles.progressStatNumber]}>
                                {progressData.averageScore}%
                            </Text>
                            <Text style={[styles.progressStatLabel, currentThemeStyles.progressStatLabel]}>
                                Overall
                            </Text>
                        </View>
                        
                        <View style={styles.progressStat}>
                            <View style={styles.trendContainer}>
                                <FontAwesome5 name={trendIcon.name} size={16} color={trendIcon.color} />
                                <Text style={[styles.progressStatNumber, { color: trendIcon.color }]}>
                                    {Math.abs(progressData.improvementTrend)}%
                                </Text>
                            </View>
                            <Text style={[styles.progressStatLabel, currentThemeStyles.progressStatLabel]}>
                                Trend
                            </Text>
                        </View>
                        
                        <View style={styles.progressStat}>
                            <Text style={[styles.progressStatNumber, currentThemeStyles.progressStatNumber]}>
                                {progressData.totalQuizzes}
                            </Text>
                            <Text style={[styles.progressStatLabel, currentThemeStyles.progressStatLabel]}>
                                {t('home.quickStats.quizzes')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.strengthsWeaknessesContainer}>
                        <View style={styles.strengthWeaknessItem}>
                            <View style={styles.strengthIndicator}>
                                <FontAwesome5 name="trophy" size={12} color="#28a745" />
                            </View>
                            <View style={styles.strengthWeaknessText}>
                                <Text style={[styles.strengthWeaknessLabel, currentThemeStyles.strengthWeaknessLabel]}>
                                    {t('home.analysis.strengths')}
                                </Text>
                                <Text style={[styles.strengthWeaknessValue, currentThemeStyles.strengthWeaknessValue]}>
                                    {progressData.strongestCategory || 'N/A'}
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.strengthWeaknessItem}>
                            <View style={styles.weaknessIndicator}>
                                <FontAwesome5 name="exclamation-triangle" size={12} color="#ffc107" />
                            </View>
                            <View style={styles.strengthWeaknessText}>
                                <Text style={[styles.strengthWeaknessLabel, currentThemeStyles.strengthWeaknessLabel]}>
                                    Focus On
                                </Text>
                                <Text style={[styles.strengthWeaknessValue, currentThemeStyles.strengthWeaknessValue]}>
                                    {progressData.weakestCategory || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.quickProgressAction, currentThemeStyles.quickProgressAction]}
                        onPress={() => navigation.navigate('ProgressTracker')}
                    >
                        <Text style={[styles.quickProgressActionText, currentThemeStyles.quickProgressActionText]}>
                            View Detailed Analytics
                        </Text>
                        <FontAwesome5 name="arrow-right" size={14} color={currentThemeStyles.quickProgressActionText.color} />
                    </TouchableOpacity>
                </View>
            </Animatable.View>
        );
    };

    // ✅ NEW: Smart Insights Button Component
    const SmartInsightsButton = () => (
        <Animatable.View animation="fadeInUp" delay={1500} style={styles.additionalFeature}>
            <TouchableOpacity
                style={[styles.additionalFeatureButton, currentThemeStyles.additionalFeatureButton]}
                onPress={async () => {
                    const user = auth.currentUser;
                    if (user) {
                        try {
                            // Get current notification status with insights
                            const status = await NotificationManager.getNotificationStatus(user.uid);
                            
                            if (status && status.analysisSnapshot) {
                                const analysis = status.analysisSnapshot;
                                let message = `Progress: ${analysis.trend || 'Stable'}\n`;
                                message += `Overall Score: ${analysis.overallScore || 'N/A'}%\n`;
                                
                                if (analysis.topFocusArea) {
                                    message += `\nFocus Area: ${analysis.topFocusArea}`;
                                }
                                
                                if (analysis.examReadiness && analysis.examReadiness.length > 0) {
                                    const nextExam = analysis.examReadiness[0];
                                    message += `\nNext Exam: ${nextExam.title} (${nextExam.readiness}% ready)`;
                                }
                                
                                message += `\n\nActive Notifications: ${status.activeCounts?.total || 0}`;
                                
                                Alert.alert(
                                    '🧠 Your Learning Dashboard',
                                    message,
                                    [
                                        { text: 'View Details', onPress: () => navigation.navigate('ProgressTracker') },
                                        { 
                                            text: 'Refresh Analysis', 
                                            onPress: async () => {
                                                await NotificationManager.scheduleAllNotifications(user.uid, null, 'manual_refresh');
                                                Alert.alert('✨ Analysis Updated!', 'Your learning insights have been refreshed.');
                                            }
                                        },
                                        { text: 'Got it!', style: 'default' }
                                    ]
                                );
                            } else {
                                Alert.alert(
                                    '🌟 Keep Learning!', 
                                    'Take more quizzes to unlock personalized insights from Alexandria!',
                                    [
                                        { text: t('home.actions.takeQuiz'), onPress: () => navigation.navigate('Upload') },
                                        { text: 'OK', style: 'default' }
                                    ]
                                );
                            }
                        } catch (error) {
                            logger.error('Error getting insights:', error);
                            Alert.alert('Error', 'Could not load insights. Please try again.');
                        }
                    }
                }}
                activeOpacity={0.8}
            >
                <FontAwesome5 name="brain" size={20} color={currentThemeStyles.additionalFeatureIcon.color} />
                <Text style={[styles.additionalFeatureText, currentThemeStyles.additionalFeatureText]}>
                    Smart Insights
                </Text>
            </TouchableOpacity>
        </Animatable.View>
    );

    const MainActions = () => (
        <View style={styles.actionsContainer}>
            <Animatable.View animation="bounceIn" delay={900} style={styles.primaryActionContainer}>
                <TouchableOpacity
                    style={[styles.primaryAction, currentThemeStyles.primaryAction]}
                    onPress={() => navigation.navigate('Upload')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.primaryActionIcon, currentThemeStyles.primaryActionIcon]}>
                        <FontAwesome5 name="plus" size={32} color={currentThemeStyles.primaryActionIconColor.color} />
                    </View>
                    <Text style={[styles.primaryActionTitle, currentThemeStyles.primaryActionTitle]}>
                        {t('home.actions.takeNewQuiz')}
                    </Text>
                    <Text style={[styles.primaryActionSubtitle, currentThemeStyles.primaryActionSubtitle]}>
                        {t('home.actions.uploadAndStartLearning')}
                    </Text>
                </TouchableOpacity>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={1000} style={styles.askAlexandriaContainer}>
                <TouchableOpacity
                    style={[styles.askAlexandriaButton, currentThemeStyles.askAlexandriaButton]}
                    onPress={() => navigation.navigate('AskAlexandria')}
                    activeOpacity={0.8}
                >
                    <FontAwesome5 name="comments" size={18} color={currentThemeStyles.askAlexandriaIcon.color} />
                    <Text style={[styles.askAlexandriaText, currentThemeStyles.askAlexandriaText]}>
                        {t('home.actions.askAlexandriaForQuiz')}
                    </Text>
                    <FontAwesome5 name="arrow-right" size={14} color={currentThemeStyles.askAlexandriaIcon.color} />
                </TouchableOpacity>
            </Animatable.View>

            <View style={styles.symmetricalActionsRow}>
                <Animatable.View animation="slideInLeft" delay={1100} style={{ flex: 1 }}>
                    <TouchableOpacity
                        style={[styles.symmetricalActionCard, currentThemeStyles.secondaryAction]}
                        onPress={() => navigation.navigate('QuizHistory')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.secondaryActionIcon, styles.historyIcon]}>
                            <FontAwesome5 name="history" size={24} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.secondaryActionTitle, currentThemeStyles.secondaryActionTitle]}>
                            Quiz History
                        </Text>
                        <Text style={[styles.secondaryActionSubtitle, currentThemeStyles.secondaryActionSubtitle]}>
                            Review past quizzes
                        </Text>
                    </TouchableOpacity>
                </Animatable.View>

                <Animatable.View animation="slideInRight" delay={1200} style={{ flex: 1 }}>
                    <TouchableOpacity
                        style={[styles.symmetricalActionCard, currentThemeStyles.secondaryAction]}
                        onPress={() => navigation.navigate('ScheduleExamScreen')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.secondaryActionIcon, styles.scheduleExamIcon]}>
                            <FontAwesome5 name="calendar-plus" size={24} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.secondaryActionTitle, currentThemeStyles.secondaryActionTitle]}>
                            Schedule Exam
                        </Text>
                        <Text style={[styles.secondaryActionSubtitle, currentThemeStyles.secondaryActionSubtitle]}>
                        Set exam reminders
                        </Text>
                    </TouchableOpacity>
                </Animatable.View>
            </View>

            {/* ✅ UPDATED: Additional Features Row with Smart Insights */}
            <View style={styles.additionalFeaturesRow}>
                <SmartInsightsButton />
                <Animatable.View animation="fadeInUp" delay={1550} style={styles.additionalFeature}>
                    <TouchableOpacity
                        style={[styles.additionalFeatureButton, currentThemeStyles.additionalFeatureButton]}
                        onPress={() => setShowFlashcardDashboard(true)}
                        activeOpacity={0.8}
                    >
                        <FontAwesome5 
                            name="layer-group" 
                            size={20} 
                            color={currentThemeStyles.additionalFeatureIcon.color} 
                        />
                        <Text style={[styles.additionalFeatureText, currentThemeStyles.additionalFeatureText]}>
                            Study Cards
                        </Text>
                    </TouchableOpacity>
                </Animatable.View>
                
                <Animatable.View animation="fadeInUp" delay={1600} style={styles.additionalFeature}>
                    <TouchableOpacity
                        style={[styles.additionalFeatureButton, currentThemeStyles.additionalFeatureButton]}
                        onPress={() => navigation.navigate('ExamListScreen')}
                        activeOpacity={0.8}
                    >
                        <FontAwesome5 
                            name="list" 
                            size={20} 
                            color={currentThemeStyles.additionalFeatureIcon.color} 
                        />
                        <Text style={[styles.additionalFeatureText, currentThemeStyles.additionalFeatureText]}>
                            {t('home.exam.viewExams')}
                        </Text>
                    </TouchableOpacity>
                </Animatable.View>
            </View>
        </View>
    );

    const MotivationalQuote = () => {
        if (!currentQuote) return null;
        
        return (
            <Animatable.View animation="fadeIn" delay={1500} style={[styles.quoteContainer, currentThemeStyles.quoteContainer]}>
                <FontAwesome5 name="quote-left" size={16} color={currentThemeStyles.quoteIcon.color} />
                <Text style={[styles.quoteText, currentThemeStyles.quoteText]}>
                    "{currentQuote.text}"
                </Text>
                <Text style={[styles.quoteAuthor, currentThemeStyles.quoteAuthor]}>
                    - {currentQuote.author}
                </Text>
            </Animatable.View>
        );
    };

    const ExamCountdownWidget = () => {
        if (!nextExam) return null;

        const urgency = ExamScheduleService.getUrgencyLevel(daysLeft);
        const message = ExamScheduleService.getMotivationalMessage(daysLeft, nextExam.title);

        const urgencyColors = {
            today: ['#EF4444', '#DC2626'],
            tomorrow: ['#F59E0B', '#D97706'],
            urgent: ['#F59E0B', '#D97706'],
            soon: ['#10B981', '#059669'],
            upcoming: ['#3B82F6', '#2563EB']
        };

        return (
            <Animatable.View animation="fadeInUp" delay={1600}>
                <TouchableOpacity onPress={() => navigation.navigate('ExamListScreen')}>
                    <LinearGradient 
                        colors={urgencyColors[urgency] || urgencyColors.upcoming}
                        style={styles.examCountdownContainer}
                    >
                        <View style={styles.examCountdownContent}>
                            <View style={styles.examCountdownHeader}>
                                <FontAwesome5 name="graduation-cap" size={20} color="#FFFFFF" />
                                <Text style={styles.examCountdownTitle}>{t('home.exam.nextExam')}</Text>
                            </View>
                            
                            <Text style={styles.examTitle}>{nextExam.title}</Text>
                            
                            <View style={styles.countdownContainer}>
                                <Text style={styles.countdownText}>
                                    {daysLeft === 0 ? `🔥 ${t('home.exam.today').toUpperCase()}!` : 
                                     daysLeft === 1 ? `⏰ ${t('home.exam.tomorrow').toUpperCase()}` :
                                     `⏳ ${daysLeft} ${daysLeft === 1 ? t('home.quickStats.day') : t('home.quickStats.days')} left`}
                                </Text>
                            </View>
                            
                            <Text style={styles.motivationalText}>{message}</Text>
                            
                            <View style={styles.practicePrompt}>
                                <Text style={styles.practiceText}>📚 Ready to practice?</Text>
                                <FontAwesome5 name="arrow-right" size={14} color="#FFFFFF" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animatable.View>
        );
    };

    return (
        <View style={[styles.container, currentThemeStyles.container]}>
            <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
            <NavigationTestButton />
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={loadRecentStats}
                            colors={[currentThemeStyles.refreshColor.color]}
                            tintColor={currentThemeStyles.refreshColor.color}
                        />
                    }
                >
                    <Header />
                    <ProgressWidget />
                    <MainActions />
                    <MotivationalQuote />
                    <ExamCountdownWidget />

                    <View style={styles.cardContainer}>
                        {/* Your existing cards */}
                    </View>

                    {/* ✅ FIXED: Change from 'SubscriptionScreen' to 'Subscription' */}
                    <TouchableOpacity
                        style={[styles.card, currentThemeStyles.card, { backgroundColor: '#D4AF37' }]}
                        onPress={() => navigation.navigate('Subscription', { userId: auth.currentUser?.uid })}
                    >
                        <FontAwesome5 name="crown" size={24} color="#FFFFFF" />
                        <Text style={[styles.cardTitle, { color: '#FFFFFF', marginTop: 8 }]}>Test Subscriptions</Text>
                    </TouchableOpacity>
                    {/* End of temporary button */}

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, currentThemeStyles.sectionTitle]}>Recent Activity</Text>
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

            {/* Profile Menu Modal */}
            <Modal
                visible={profileMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setProfileMenuVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setProfileMenuVisible(false)}
                >
                    <View style={[styles.profileMenuContainer, currentThemeStyles.profileMenuContainer]}>
                        <View style={styles.profileMenuHeader}>
                            <View style={styles.profileMenuUserInfo}>
                                <View style={[styles.profileMenuAvatar, currentThemeStyles.profileMenuAvatar]}>
                                    <FontAwesome5 name="user" size={20} color={currentThemeStyles.profileIcon.color} />
                                </View>
                                <View>
                                    <Text style={[styles.profileMenuUserName, currentThemeStyles.profileMenuUserName]}>
                                        {userName || 'Student'}
                                    </Text>
                                    <Text style={[styles.profileMenuUserEmail, currentThemeStyles.profileMenuUserEmail]}>
                                        {auth.currentUser?.email || 'guest@alexandria.app'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity 
                                style={styles.profileMenuClose}
                                onPress={() => setProfileMenuVisible(false)}
                            >
                                <FontAwesome5 name="times" size={16} color={currentThemeStyles.profileIcon.color} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={getProfileMenuOptions(t)}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => {
                                if (item.type === 'divider') {
                                    return <View style={[styles.profileMenuDivider, currentThemeStyles.profileMenuDivider]} />;
                                }
                                
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.profileMenuItem,
                                            currentThemeStyles.profileMenuItem,
                                            item.type === 'destructive' && styles.profileMenuItemDestructive
                                        ]}
                                        onPress={() => handleProfileMenuSelect(item)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.profileMenuItemContent}>
                                            <FontAwesome5 
                                                name={item.icon} 
                                                size={16} 
                                                color={
                                                    item.type === 'destructive' 
                                                        ? '#ff6b7a' 
                                                        : currentThemeStyles.profileMenuItemIcon.color
                                                } 
                                            />
                                            <Text style={[
                                                styles.profileMenuItemText,
                                                item.type === 'destructive' 
                                                    ? styles.profileMenuItemTextDestructive
                                                    : currentThemeStyles.profileMenuItemText
                                            ]}>
                                                {item.label}
                                            </Text>
                                        </View>
                                        {item.type === 'submenu' && (
                                            <View style={styles.profileMenuLanguageIndicator}>
                                                <Text style={[styles.profileMenuLanguageFlag, currentThemeStyles.profileMenuLanguageFlag]}>
                                                    {currentLanguage.flag}
                                                </Text>
                                                <FontAwesome5 
                                                    name="chevron-right" 
                                                    size={12} 
                                                    color={currentThemeStyles.profileMenuChevron.color} 
                                                />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Language Selection Modal */}
            <Modal
                visible={languageMenuVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setLanguageMenuVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setLanguageMenuVisible(false)}
                >
                    <View style={[styles.languageMenuContainer, currentThemeStyles.languageMenuContainer]}>
                        <View style={styles.languageMenuHeader}>
                            <Text style={[styles.languageMenuTitle, currentThemeStyles.languageMenuTitle]}>
                                Select Language
                            </Text>
                            <TouchableOpacity 
                                style={styles.languageMenuClose}
                                onPress={() => setLanguageMenuVisible(false)}
                            >
                                <FontAwesome5 name="times" size={18} color={currentThemeStyles.profileIcon.color} />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={availableLanguages}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.languageMenuItem,
                                        currentThemeStyles.languageMenuItem,
                                        currentLanguage.code === item.code && styles.languageMenuItemSelected
                                    ]}
                                    onPress={() => handleLanguageSelect(item)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.languageFlag}>{item.flag}</Text>
                                    <Text style={[
                                        styles.languageLabel,
                                        currentThemeStyles.languageLabel,
                                        currentLanguage.code === item.code && styles.languageLabelSelected
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {currentLanguage.code === item.code && (
                                        <FontAwesome5 name="check" size={16} color="#28a745" />
                                    )}
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
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
    headerContainer: {
        marginBottom: 40,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        opacity: 0.8,
        marginBottom: 4,
    },
    userName: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    profileCompletionContainer: {
        marginTop: 8,
        gap: 4,
    },
    profileCompletionBar: {
        height: 4,
        backgroundColor: 'rgba(248, 244, 227, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    profileCompletionFill: {
        height: '100%',
        backgroundColor: '#D4AF37',
        borderRadius: 2,
    },
    profileCompletionText: {
        fontSize: 12,
        color: 'rgba(248, 244, 227, 0.8)',
        fontWeight: '500',
    },
    profileButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    quickStats: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.7,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 16,
    },
    progressWidget: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginLeft: 8,
    },
    progressContent: {
        gap: 16,
    },
    progressStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    progressStat: {
        alignItems: 'center',
    },
    progressStatNumber: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    progressStatLabel: {
        fontSize: 12,
        opacity: 0.7,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    strengthsWeaknessesContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    strengthWeaknessItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    strengthIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    weaknessIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    strengthWeaknessText: {
        flex: 1,
    },
    strengthWeaknessLabel: {
        fontSize: 10,
        opacity: 0.7,
        marginBottom: 2,
    },
    strengthWeaknessValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    quickProgressAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    quickProgressActionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    noProgressContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noProgressText: {
        fontSize: 14,
        textAlign: 'center',
        marginVertical: 12,
        opacity: 0.7,
    },
    startButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 8,
    },
    startButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionsContainer: {
        marginBottom: 30,
    },
    primaryActionContainer: {
        marginBottom: 24,
    },
    primaryAction: {
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
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
        opacity: 0.8,
        lineHeight: 22,
    },
    symmetricalActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 16,
    },
    symmetricalActionCard: {
        flex: 1,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    secondaryActionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    historyIcon: {
        backgroundColor: '#1A2C5B',
    },
    scheduleExamIcon: {
        backgroundColor: '#28a745',
    },
    secondaryActionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    secondaryActionSubtitle: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.7,
        lineHeight: 16,
    },
    additionalFeaturesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    additionalFeature: {
        flex: 1,
    },
    additionalFeatureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
    },
    additionalFeatureText: {
        fontSize: 12,
        fontWeight: '600',
    },
    quoteContainer: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
    },
    quoteText: {
        fontSize: 16,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 12,
        lineHeight: 24,
    },
    quoteAuthor: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.8,
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
        borderRadius: 30,
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
    examCountdownContainer: {
        borderRadius: 15,
        marginVertical: 10,
        overflow: 'hidden',
    },
    examCountdownContent: {
        padding: 20,
    },
    examCountdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    examCountdownTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    examTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    countdownContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    countdownText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    motivationalText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 15,
        fontStyle: 'italic',
    },
    practicePrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    practiceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
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

    // Profile Menu Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    profileMenuContainer: {
        borderRadius: 16,
        margin: 20,
        marginTop: 100,
        minWidth: 280,
        maxWidth: 320,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    profileMenuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 16,
    },
    profileMenuUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileMenuAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    profileMenuUserName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    profileMenuUserEmail: {
        fontSize: 12,
        opacity: 0.8,
    },
    profileMenuClose: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileMenuDivider: {
        height: 1,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    profileMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    profileMenuItemDestructive: {
        backgroundColor: 'rgba(255, 107, 122, 0.1)',
    },
    profileMenuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileMenuItemText: {
        fontSize: 16,
        marginLeft: 16,
        fontWeight: '500',
    },
    profileMenuItemTextDestructive: {
        color: '#ff6b7a',
        fontWeight: '600',
    },
    profileMenuLanguageIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileMenuLanguageFlag: {
        fontSize: 16,
    },

    // Language Menu Styles
    languageMenuContainer: {
        borderRadius: 16,
        margin: 20,
        marginTop: 120,
        maxHeight: screenHeight * 0.7,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    languageMenuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 16,
    },
    languageMenuTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    languageMenuClose: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    languageMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    languageMenuItemSelected: {
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
    },
    languageFlag: {
        fontSize: 20,
        marginRight: 16,
    },
    languageLabel: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    languageLabelSelected: {
        fontWeight: '700',
        color: '#28a745',
    },
});