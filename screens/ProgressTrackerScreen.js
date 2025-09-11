import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationManager } from '../utils/NotificationManager';
import { auth } from '../firebaseConfig';
import { SubjectProgressService } from '../services/SubjectProgressService';
import { QuizHistoryManager } from '../services/QuizHistoryManager';
import { UserCoursesService } from '../services/UserCoursesService'; // ✅ NEW: Import UserCoursesService
import AdvancedProgressAnalytics from '../services/AdvancedProgressAnalytics';
import SafeBackButton from '../components/SafeBackButton';
import logger from '../utils/logger';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ✅ HELPER FUNCTIONS - Added missing functions
const getSubjectColor = (subject) => {
  return subject?.color || '#9B59B6'; // Default purple color
};

const getSubjectIcon = (subject) => {
  return subject?.icon || 'book'; // Default book icon
};

// ✅ NEW: Get colors for subject chart
const getSubjectChartColor = (subject, index) => {
  const subjectColors = [
    '#3498DB', // Blue for Mathematics
    '#28A745', // Green for Science
    '#E74C3C', // Red for English/Language
    '#8E44AD', // Purple for History
    '#F39C12', // Orange for Language Arts
    '#9B59B6', // Purple for Test Prep
    '#17A2B8', // Teal for General
    '#6C757D', // Gray for Others
    '#20C997', // Mint
    '#FD7E14', // Orange-red
  ];
  
  // Try to match subject name to consistent colors
  const subjectKey = subject.toLowerCase();
  if (subjectKey.includes('math')) return '#3498DB';
  if (subjectKey.includes('science') || subjectKey.includes('physics') || subjectKey.includes('chemistry') || subjectKey.includes('biology')) return '#28A745';
  if (subjectKey.includes('english') || subjectKey.includes('language') || subjectKey.includes('literature')) return '#E74C3C';
  if (subjectKey.includes('history') || subjectKey.includes('social')) return '#8E44AD';
  if (subjectKey.includes('test') || subjectKey.includes('prep')) return '#9B59B6';
  
  // Fallback to index-based color
  return subjectColors[index % subjectColors.length];
};
const getAccuracyColor = (accuracy) => {
  if (accuracy >= 80) return '#28a745'; // Green for good scores
  if (accuracy >= 60) return '#ffc107'; // Yellow for fair scores
  return '#dc3545'; // Red for poor scores
};

// ✅ NEW: Safe theme property access
const getThemeProperty = (theme, property, fallback = '#000000') => {
  return theme?.[property]?.color || theme?.[property] || fallback;
};

const ProgressTrackerScreen = ({ navigation }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, all
    const [refreshing, setRefreshing] = useState(false);
    const [notificationInsights, setNotificationInsights] = useState(null);
    const [activeTab, setActiveTab] = useState('overall'); // 'overall', 'subjects', or 'advanced'
    const [subjectProgress, setSubjectProgress] = useState({});
    const [subjectRecommendations, setSubjectRecommendations] = useState([]);
    const [subjectSummary, setSubjectSummary] = useState(null);
    const [pieChartMode, setPieChartMode] = useState('difficulty'); // 'difficulty' or 'subjects'
    const [userCourses, setUserCourses] = useState([]); // ✅ NEW: User's profile courses
    const [hasProfileCourses, setHasProfileCourses] = useState(false);
    
    // 🚀 NEW: Advanced analytics state
    const [streakPrediction, setStreakPrediction] = useState(null);
    const [userGoals, setUserGoals] = useState(null);
    const [learningVelocity, setLearningVelocity] = useState(null);
    const [difficultyProgression, setDifficultyProgression] = useState(null);
    const [timeAnalytics, setTimeAnalytics] = useState(null);
    const [showGoalModal, setShowGoalModal] = useState(false);
    
    // Analytics data state
    const [analytics, setAnalytics] = useState({
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        currentStreak: 0,
        longestStreak: 0,
        scoreHistory: [],
        categoryStats: [],
        weeklyProgress: [],
        difficultyBreakdown: [],
        subjectBreakdown: [],
        recentActivity: []
    });

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const containerAnim = useRef(new Animated.Value(1)).current;

    // ✅ COMPLETE Light theme styles with all missing properties
    const lightStyles = {
        container: { backgroundColor: '#F8F4E3' },
        backButton: { backgroundColor: 'rgba(255, 255, 255, 0.9)', shadowColor: '#1A2C5B' },
        backButtonText: { color: '#1A2C5B' },
        titleIcon: { backgroundColor: 'rgba(26, 44, 91, 0.1)', shadowColor: '#1A2C5B' },
        titleIconColor: { color: '#1A2C5B' },
        title: { color: '#1A2C5B' },
        subtitle: { color: '#4A5568' },
        chartContainer: { backgroundColor: '#FFFFFF', shadowColor: '#1A2C5B' },
        chartTitle: { color: '#2C3E50' },
        chartSubtitle: { color: '#4A5568' },
        categoryName: { color: '#2C3E50' },
        categoryCount: { color: '#7F8C8D' },
        statCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)', shadowColor: '#1A2C5B' },
        statNumber: { color: '#2C3E50' },
        statLabel: { color: '#7F8C8D' },
        noDataIcon: { color: '#7F8C8D' },
        noDataText: { color: '#7F8C8D' },
        refreshColor: { color: '#1A2C5B' },
        periodSelector: { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
        periodButton: { backgroundColor: '#FFFFFF', borderColor: '#1A2C5B' },
        periodButtonText: { color: '#1A2C5B' },
        activePeriodButton: { backgroundColor: '#1A2C5B' },
        activePeriodButtonText: { color: '#FFFFFF' },
        // Tab styles
        tabSelector: { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
        tab: { backgroundColor: 'transparent' },
        activeTab: { backgroundColor: '#1A2C5B' },
        tabText: { color: '#4A5568' },
        activeTabText: { color: '#FFFFFF' },
        // Loading and action styles
        loadingColor: { color: '#1A2C5B' },
        loadingText: { color: '#4A5568' },
        quickProgressAction: { backgroundColor: 'rgba(26, 44, 91, 0.1)' },
        quickProgressActionText: { color: '#1A2C5B' },
    };

    // ✅ COMPLETE Dark theme styles with all missing properties
    const darkStyles = {
        container: { backgroundColor: '#1A2C5B' },
        backButton: { backgroundColor: 'rgba(44, 70, 125, 0.8)', shadowColor: '#D4AF37' },
        backButtonText: { color: '#F8F4E3' },
        titleIcon: { backgroundColor: 'rgba(212, 175, 55, 0.2)', shadowColor: '#D4AF37' },
        titleIconColor: { color: '#D4AF37' },
        title: { color: '#F8F4E3' },
        subtitle: { color: '#CBD5E0' },
        chartContainer: { backgroundColor: '#2C3E50', shadowColor: '#D4AF37' },
        chartTitle: { color: '#FFFFFF' },
        chartSubtitle: { color: '#CBD5E0' },
        categoryName: { color: '#FFFFFF' },
        categoryCount: { color: '#BDC3C7' },
        statCard: { backgroundColor: 'rgba(44, 62, 80, 0.95)', shadowColor: '#D4AF37' },
        statNumber: { color: '#FFFFFF' },
        statLabel: { color: '#BDC3C7' },
        noDataIcon: { color: '#BDC3C7' },
        noDataText: { color: '#BDC3C7' },
        refreshColor: { color: '#D4AF37' },
        periodSelector: { backgroundColor: 'rgba(44, 70, 125, 0.6)' },
        periodButton: { backgroundColor: '#2C467D', borderColor: '#D4AF37' },
        periodButtonText: { color: '#D4AF37' },
        activePeriodButton: { backgroundColor: '#D4AF37' },
        activePeriodButtonText: { color: '#1A2C5B' },
        // Tab styles
        tabSelector: { backgroundColor: 'rgba(44, 70, 125, 0.6)' },
        tab: { backgroundColor: 'transparent' },
        activeTab: { backgroundColor: '#D4AF37' },
        tabText: { color: '#CBD5E0' },
        activeTabText: { color: '#1A2C5B' },
        // Loading and action styles
        loadingColor: { color: '#D4AF37' },
        loadingText: { color: '#CBD5E0' },
        quickProgressAction: { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
        quickProgressActionText: { color: '#D4AF37' },
    };

    const currentTheme = isDarkMode ? darkStyles : lightStyles;

    useEffect(() => {
        const loadNotificationInsights = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const status = await NotificationManager.getNotificationStatus(user.uid);
                    setNotificationInsights(status);
                }
            } catch (error) {
                logger.error('Error loading notification insights:', error);
            }
        };
        
        loadNotificationInsights();
    }, []);

    useEffect(() => {
        // Start animations
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
            Animated.spring(containerAnim, {
                toValue: 1,
                tension: 80,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    }, [selectedPeriod]);

    // Refresh data whenever screen comes into focus (e.g., after profile updates)
    useFocusEffect(
        React.useCallback(() => {
            fetchAnalytics();
            loadUserCourses(); // Reload user's profile courses
        }, [])
    );

    // ✅ NEW: Load user's profile courses for progress tracking
    const loadUserCourses = async () => {
        try {
            const courses = await UserCoursesService.getUserCourses();
            setUserCourses(courses);
            setHasProfileCourses(courses.length > 0);
            
            if (courses.length > 0) {
                logger.info(`📚 Loaded ${courses.length} courses from user profile for Progress Tracker`);
                // Initialize progress tracking for user's courses
                initializeCourseProgress(courses);
            }
        } catch (error) {
            logger.error('❌ Error loading user courses for Progress Tracker:', error);
        }
    };

    // ✅ NEW: Initialize progress tracking for user's profile courses
    const initializeCourseProgress = async (courses) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Get existing quiz history to see if user has any activity in these courses
            const quizHistory = await AsyncStorage.getItem(`quizHistory_${user.uid}`);
            const quizzes = quizHistory ? JSON.parse(quizHistory) : [];

            // Create progress entries for each user course
            const courseProgressUpdates = {};
            
            courses.forEach(course => {
                // Find quizzes related to this course
                const courseQuizzes = quizzes.filter(quiz => 
                    quiz.metadata?.category === course.name ||
                    quiz.metadata?.manualSubject?.name === course.name ||
                    quiz.metadata?.subjectKey === course.key ||
                    (quiz.metadata?.category && quiz.metadata.category.toLowerCase().includes(course.name.toLowerCase()))
                );

                if (courseQuizzes.length === 0) {
                    // Create initial progress entry for courses with no activity yet
                    courseProgressUpdates[course.name] = {
                        subject: course.name,
                        subjectKey: course.key,
                        icon: course.icon,
                        color: course.color,
                        totalQuizzes: 0,
                        totalQuestions: 0,
                        totalCorrect: 0,
                        accuracy: 0,
                        lastStudied: null,
                        studySessions: 0,
                        averageScore: 0,
                        bestScore: 0,
                        weakAreas: [],
                        improvementTrend: 0,
                        isFromProfile: true,
                        source: 'user_profile'
                    };
                } else {
                    // Calculate progress for courses with existing quiz activity
                    const totalQuestions = courseQuizzes.reduce((sum, quiz) => sum + (quiz.results?.totalQuestions || 0), 0);
                    const totalCorrect = courseQuizzes.reduce((sum, quiz) => sum + (quiz.results?.score || 0), 0);
                    const scores = courseQuizzes.map(quiz => quiz.results?.score || 0);
                    const lastQuiz = courseQuizzes.sort((a, b) => 
                        new Date(b.metadata?.completedAt) - new Date(a.metadata?.completedAt)
                    )[0];

                    courseProgressUpdates[course.name] = {
                        subject: course.name,
                        subjectKey: course.key,
                        icon: course.icon,
                        color: course.color,
                        totalQuizzes: courseQuizzes.length,
                        totalQuestions: totalQuestions,
                        totalCorrect: totalCorrect,
                        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
                        lastStudied: lastQuiz?.metadata?.completedAt || null,
                        studySessions: courseQuizzes.length,
                        averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
                        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
                        weakAreas: [], // This would be calculated based on quiz results
                        improvementTrend: 0, // This would be calculated based on recent performance
                        isFromProfile: true,
                        source: 'user_profile'
                    };
                }
            });

            // Update the subject progress state
            setSubjectProgress(prevProgress => ({
                ...prevProgress,
                ...courseProgressUpdates
            }));

            logger.info(`📊 Initialized progress tracking for ${courses.length} profile courses`);
        } catch (error) {
            logger.error('❌ Error initializing course progress:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                // Clear all data if no user
                setAnalytics({
                    totalQuizzes: 0,
                    averageScore: 0,
                    bestScore: 0,
                    totalCorrect: 0,
                    totalQuestions: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    scoreHistory: [],
                    categoryStats: [],
                    weeklyProgress: [],
                    difficultyBreakdown: [],
                    subjectBreakdown: [],
                    recentActivity: []
                });
                setSubjectProgress({});
                setSubjectRecommendations([]);
                setSubjectSummary(null);
                setLoading(false);
                return;
            }

            // Load both analytics and subject data in parallel
            const [quizHistory, subjectData] = await Promise.all([
                AsyncStorage.getItem(`quizHistory_${user.uid}`),
                Promise.all([
                    SubjectProgressService.getSubjectProgress(user.uid),
                    SubjectProgressService.getSubjectRecommendations(user.uid),
                    SubjectProgressService.getSubjectSummary(user.uid)
                ])
            ]);

            const quizzes = quizHistory ? JSON.parse(quizHistory) : [];
            let filteredQuizzes = [];
            
            // Update analytics (existing logic)
            if (quizzes.length > 0) {
                filteredQuizzes = filterQuizzesByPeriod(quizzes, selectedPeriod);
                const calculatedAnalytics = calculateAnalytics(filteredQuizzes, quizzes);
                setAnalytics(calculatedAnalytics);
            }

            // Update subject data
            const [progress, recommendations, summary] = subjectData;
            setSubjectProgress(progress);
            setSubjectRecommendations(recommendations);
            setSubjectSummary(summary);

            // 🚀 NEW: Load advanced analytics
            if (quizzes.length > 0) {
                await loadAdvancedAnalytics(user.uid, quizzes, filteredQuizzes);
            }
            
        } catch (error) {
            logger.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🚀 NEW: Load advanced analytics
    const loadAdvancedAnalytics = async (userId, allQuizzes, filteredQuizzes) => {
        try {
            // Streak prediction
            const currentStreak = analytics.currentStreak || calculateStreaks(allQuizzes).currentStreak;
            const prediction = AdvancedProgressAnalytics.predictStreakContinuation(allQuizzes, currentStreak);
            setStreakPrediction(prediction);

            // User goals
            const goals = await AdvancedProgressAnalytics.getUserGoals(userId);
            const updatedGoals = await AdvancedProgressAnalytics.updateGoalProgress(userId, allQuizzes, subjectProgress);
            setUserGoals(updatedGoals);

            // Learning velocity
            const velocity = AdvancedProgressAnalytics.calculateLearningVelocity(allQuizzes);
            setLearningVelocity(velocity);

            // Difficulty progression
            const progression = AdvancedProgressAnalytics.analyzeDifficultyProgression(allQuizzes);
            setDifficultyProgression(progression);

            // Time analytics
            const timeStats = AdvancedProgressAnalytics.calculateStudySessionAnalytics(allQuizzes);
            setTimeAnalytics(timeStats);

        } catch (error) {
            logger.error('Error loading advanced analytics:', error);
        }
    };

    const filterQuizzesByPeriod = (quizzes, period) => {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (period) {
            case 'week':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case 'all':
                return quizzes;
            default:
                return quizzes;
        }
        
        return quizzes.filter(quiz => {
            const quizDate = new Date(quiz.metadata?.completedAt);
            return quizDate >= cutoffDate;
        });
    };

    const calculateAnalytics = (filteredQuizzes, allQuizzes) => {
        const totalQuizzes = filteredQuizzes.length;
        const totalCorrect = filteredQuizzes.reduce((sum, quiz) => sum + (quiz.results?.score || 0), 0);
        const totalQuestions = filteredQuizzes.reduce((sum, quiz) => sum + (quiz.results?.totalQuestions || 0), 0);
        const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        const bestScore = Math.max(...filteredQuizzes.map(quiz => quiz.results?.percentage || 0), 0);

        // Score history for line chart (last 10 quizzes)
        const scoreHistory = filteredQuizzes
            .slice(-10)
            .map((quiz, index) => ({
                x: index + 1,
                y: quiz.results?.percentage || 0,
                date: new Date(quiz.metadata?.completedAt).toLocaleDateString()
            }));

        // Category statistics
        const categoryMap = new Map();
        filteredQuizzes.forEach(quiz => {
            const category = quiz.metadata?.category || 'General';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, { total: 0, correct: 0, count: 0 });
            }
            const stats = categoryMap.get(category);
            stats.total += quiz.results?.totalQuestions || 0;
            stats.correct += quiz.results?.score || 0;
            stats.count += 1;
        });

        const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
            category,
            accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
            count: stats.count,
            total: stats.total
        }));

        // Weekly progress (last 7 days)
        const weeklyProgress = generateWeeklyProgress(allQuizzes);

        // Difficulty breakdown
        const difficultyMap = new Map();
        filteredQuizzes.forEach(quiz => {
            const difficulty = quiz.metadata?.difficulty || 'medium';
            if (!difficultyMap.has(difficulty)) {
                difficultyMap.set(difficulty, 0);
            }
            difficultyMap.set(difficulty, difficultyMap.get(difficulty) + 1);
        });

        const difficultyBreakdown = Array.from(difficultyMap.entries()).map(([difficulty, count]) => ({
            name: difficulty,
            population: count,
            color: getDifficultyColor(difficulty),
            legendFontColor: isDarkMode ? '#F8F4E3' : '#1A2C5B',
            legendFontSize: 12,
        }));

        // ✅ NEW: Subject breakdown for pie chart
        const subjectMap = new Map();
        filteredQuizzes.forEach(quiz => {
            const category = quiz.metadata?.category || 'General';
            if (!subjectMap.has(category)) {
                subjectMap.set(category, 0);
            }
            subjectMap.set(category, subjectMap.get(category) + 1);
        });

        const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, count], index) => ({
            name: subject,
            population: count,
            color: getSubjectChartColor(subject, index),
            legendFontColor: isDarkMode ? '#F8F4E3' : '#1A2C5B',
            legendFontSize: 12,
        }));

        // Calculate streaks
        const { currentStreak, longestStreak } = calculateStreaks(allQuizzes);

        return {
            totalQuizzes,
            averageScore,
            bestScore,
            totalCorrect,
            totalQuestions,
            currentStreak,
            longestStreak,
            scoreHistory,
            categoryStats,
            weeklyProgress,
            difficultyBreakdown,
            subjectBreakdown,
            recentActivity: filteredQuizzes.slice(-5).reverse()
        };
    };

    const generateWeeklyProgress = (quizzes) => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('en', { weekday: 'short' }),
                quizzes: 0,
                avgScore: 0
            };
        });

        quizzes.forEach(quiz => {
            const quizDate = new Date(quiz.metadata?.completedAt).toISOString().split('T')[0];
            const dayData = last7Days.find(day => day.date === quizDate);
            if (dayData) {
                dayData.quizzes += 1;
                dayData.avgScore = (dayData.avgScore + (quiz.results?.percentage || 0)) / dayData.quizzes;
            }
        });

        return last7Days;
    };

    // Helper function for advanced analytics
    const calculateStreaks = (quizzes) => {
        return AdvancedProgressAnalytics.calculateStreaks(quizzes);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return '#28a745';
            case 'medium': return '#ffc107';
            case 'hard': return '#dc3545';
            default: return '#17a2b8';
        }
    };

    const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

    // Chart configurations
    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: isDarkMode ? '#1A2C5B' : '#F8F4E3',
        backgroundGradientTo: isDarkMode ? '#2C467D' : '#FFFFFF',
        decimalPlaces: 0,
        color: (opacity = 1) => isDarkMode ? `rgba(212, 175, 55, ${opacity})` : `rgba(26, 44, 91, ${opacity})`,
        labelColor: (opacity = 1) => isDarkMode ? `rgba(248, 244, 227, ${opacity})` : `rgba(26, 44, 91, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: isDarkMode ? "#D4AF37" : "#1A2C5B"
        }
    };

    const Header = () => (
        <Animatable.View animation="fadeInDown" duration={800} style={styles.headerContainer}>
            <SafeBackButton 
                style={[styles.backButton, currentTheme.backButton]}
                color={getThemeProperty(currentTheme, 'backButtonText', '#1A2C5B')}
                size={20}
                onPress={() => {
                    Animated.timing(containerAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        const NavigationHelper = require('../utils/NavigationHelper').default;
                        NavigationHelper.safeGoBack(navigation);
                    });
                }}
            />
            
            <Animatable.View animation="fadeIn" delay={300} style={styles.titleSection}>
                <View style={[styles.titleIcon, currentTheme.titleIcon]}>
                    <FontAwesome5 name="chart-line" size={32} color={getThemeProperty(currentTheme, 'titleIconColor', '#1A2C5B')} />
                </View>
                <Text style={[styles.title, currentTheme.title]}>Progress Tracker</Text>
                <Text style={[styles.subtitle, currentTheme.subtitle]}>
                    Track your learning journey and improvements
                </Text>
            </Animatable.View>
        </Animatable.View>
    );

    const PeriodSelector = () => (
        <View style={[styles.periodSelector, currentTheme.periodSelector]}>
            {['week', 'month', 'all'].map((period) => (
                <TouchableOpacity
                    key={period}
                    style={[
                        styles.periodButton,
                        currentTheme.periodButton,
                        selectedPeriod === period && currentTheme.activePeriodButton
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                >
                    <Text style={[
                        styles.periodButtonText,
                        currentTheme.periodButtonText,
                        selectedPeriod === period && currentTheme.activePeriodButtonText
                    ]}>
                        {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const TabSelector = () => (
        <View style={[styles.tabSelector, currentTheme.tabSelector]}>
            <TouchableOpacity
                style={[
                    styles.tab,
                    currentTheme.tab,
                    activeTab === 'overall' && currentTheme.activeTab
                ]}
                onPress={() => setActiveTab('overall')}
            >
                <FontAwesome5 
                    name="chart-line" 
                    size={14} 
                    color={activeTab === 'overall' ? getThemeProperty(currentTheme, 'activeTabText', '#FFFFFF') : getThemeProperty(currentTheme, 'tabText', '#4A5568')} 
                />
                <Text style={[
                    styles.tabText,
                    currentTheme.tabText,
                    activeTab === 'overall' && currentTheme.activeTabText
                ]}>Overview</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[
                    styles.tab,
                    currentTheme.tab,
                    activeTab === 'subjects' && currentTheme.activeTab
                ]}
                onPress={() => setActiveTab('subjects')}
            >
                <FontAwesome5 
                    name="book-open" 
                    size={14} 
                    color={activeTab === 'subjects' ? getThemeProperty(currentTheme, 'activeTabText', '#FFFFFF') : getThemeProperty(currentTheme, 'tabText', '#4A5568')} 
                />
                <Text style={[
                    styles.tabText,
                    currentTheme.tabText,
                    activeTab === 'subjects' && currentTheme.activeTabText
                ]}>Subjects</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.tab,
                    currentTheme.tab,
                    activeTab === 'advanced' && currentTheme.activeTab
                ]}
                onPress={() => setActiveTab('advanced')}
            >
                <FontAwesome5 
                    name="brain" 
                    size={14} 
                    color={activeTab === 'advanced' ? getThemeProperty(currentTheme, 'activeTabText', '#FFFFFF') : getThemeProperty(currentTheme, 'tabText', '#4A5568')} 
                />
                <Text style={[
                    styles.tabText,
                    currentTheme.tabText,
                    activeTab === 'advanced' && currentTheme.activeTabText
                ]}>Advanced</Text>
            </TouchableOpacity>
        </View>
    );

    const StatsCards = () => (
        <View style={styles.statsContainer}>
            <Animatable.View animation="slideInLeft" delay={400} style={[styles.statCard, currentTheme.statCard]}>
                <FontAwesome5 name="clipboard-list" size={24} color="#D4AF37" />
                <Text style={[styles.statNumber, currentTheme.statNumber]}>{analytics.totalQuizzes}</Text>
                <Text style={[styles.statLabel, currentTheme.statLabel]}>Quizzes Taken</Text>
            </Animatable.View>

            <Animatable.View animation="slideInUp" delay={500} style={[styles.statCard, currentTheme.statCard]}>
                <FontAwesome5 name="percentage" size={24} color="#28a745" />
                <Text style={[styles.statNumber, currentTheme.statNumber]}>{analytics.averageScore}%</Text>
                <Text style={[styles.statLabel, currentTheme.statLabel]}>Average Score</Text>
            </Animatable.View>

            <Animatable.View animation="slideInRight" delay={600} style={[styles.statCard, currentTheme.statCard]}>
                <FontAwesome5 name="fire" size={24} color="#dc3545" />
                <Text style={[styles.statNumber, currentTheme.statNumber]}>{analytics.currentStreak}</Text>
                <Text style={[styles.statLabel, currentTheme.statLabel]}>Current Streak</Text>
            </Animatable.View>
        </View>
    );

    const ScoreChart = () => {
        if (analytics.scoreHistory.length === 0) {
            return (
                <View style={[styles.chartContainer, currentTheme.chartContainer]}>
                    <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Score Progression</Text>
                    <View style={styles.noDataContainer}>
                        <FontAwesome5 name="chart-line" size={48} color={getThemeProperty(currentTheme, 'noDataIcon', '#7F8C8D')} />
                        <Text style={[styles.noDataText, currentTheme.noDataText]}>
                            Take more quizzes to see your progress!
                        </Text>
                    </View>
                </View>
            );
        }

        const data = {
            labels: analytics.scoreHistory.map(item => `Q${item.x}`),
            datasets: [{
                data: analytics.scoreHistory.map(item => item.y),
                strokeWidth: 3,
            }]
        };

        return (
            <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Score Progression</Text>
                <LineChart
                    data={data}
                    width={screenWidth - 60}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                />
                <Text style={[styles.chartSubtitle, currentTheme.chartSubtitle]}>
                    Last {analytics.scoreHistory.length} quizzes
                </Text>
            </Animatable.View>
        );
    };

    const CategoryStats = () => {
        if (analytics.categoryStats.length === 0) return null;

        return (
            <Animatable.View animation="fadeInUp" delay={800} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Category Performance</Text>
                
                {analytics.categoryStats.map((category, index) => (
                    <View key={category.category} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                            <Text style={[styles.categoryName, currentTheme.categoryName]}>
                                {category.category}
                            </Text>
                            <Text style={[styles.categoryAccuracy, { color: getAccuracyColor(category.accuracy) }]}>
                                {category.accuracy}%
                            </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View 
                                style={[
                                    styles.progressBar, 
                                    { 
                                        width: `${category.accuracy}%`,
                                        backgroundColor: getAccuracyColor(category.accuracy)
                                    }
                                ]} 
                            />
                        </View>
                        <Text style={[styles.categoryCount, currentTheme.categoryCount]}>
                            {category.count} quiz{category.count !== 1 ? 'es' : ''} • {category.total} questions
                        </Text>
                    </View>
                ))}
            </Animatable.View>
        );
    };

    // ✅ ENHANCED: Smart Distribution Chart with toggle between difficulty and subjects
    const DistributionChart = () => {
        const currentData = pieChartMode === 'difficulty' ? analytics.difficultyBreakdown : analytics.subjectBreakdown;
        
        if (currentData.length === 0) return null;

        return (
            <Animatable.View animation="fadeInUp" delay={900} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <View style={styles.chartHeaderWithToggle}>
                    <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Distribution Analysis</Text>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                pieChartMode === 'difficulty' && styles.activeToggleButton,
                                { borderColor: isDarkMode ? '#D4AF37' : '#1A2C5B' }
                            ]}
                            onPress={() => setPieChartMode('difficulty')}
                        >
                            <FontAwesome5 
                                name="layer-group" 
                                size={12} 
                                color={pieChartMode === 'difficulty' ? '#FFFFFF' : (isDarkMode ? '#D4AF37' : '#1A2C5B')} 
                            />
                            <Text style={[
                                styles.toggleText,
                                { color: pieChartMode === 'difficulty' ? '#FFFFFF' : (isDarkMode ? '#D4AF37' : '#1A2C5B') }
                            ]}>
                                Difficulty
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                pieChartMode === 'subjects' && styles.activeToggleButton,
                                { borderColor: isDarkMode ? '#D4AF37' : '#1A2C5B' }
                            ]}
                            onPress={() => setPieChartMode('subjects')}
                        >
                            <FontAwesome5 
                                name="book-open" 
                                size={12} 
                                color={pieChartMode === 'subjects' ? '#FFFFFF' : (isDarkMode ? '#D4AF37' : '#1A2C5B')} 
                            />
                            <Text style={[
                                styles.toggleText,
                                { color: pieChartMode === 'subjects' ? '#FFFFFF' : (isDarkMode ? '#D4AF37' : '#1A2C5B') }
                            ]}>
                                Subjects
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <PieChart
                    data={currentData}
                    width={screenWidth - 60}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={styles.chart}
                />
                
                <Text style={[styles.chartSubtitle, currentTheme.chartSubtitle]}>
                    {pieChartMode === 'difficulty' 
                        ? `Quiz difficulty distribution (${analytics.totalQuizzes} total)`
                        : `Subject coverage across ${currentData.length} topics`
                    }
                </Text>
                
                {/* ✅ NEW: Quick insights below chart */}
                <View style={styles.chartInsights}>
                    {pieChartMode === 'difficulty' ? (
                        <View style={styles.insightRow}>
                            <FontAwesome5 name="info-circle" size={14} color={isDarkMode ? '#D4AF37' : '#1A2C5B'} />
                            <Text style={[styles.insightText, currentTheme.categoryCount]}>
                                Most practiced: {currentData.reduce((prev, curr) => prev.population > curr.population ? prev : curr)?.name || 'N/A'} difficulty
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.insightRow}>
                            <FontAwesome5 name="lightbulb" size={14} color={isDarkMode ? '#D4AF37' : '#1A2C5B'} />
                            <Text style={[styles.insightText, currentTheme.categoryCount]}>
                                Focus area: {currentData.reduce((prev, curr) => prev.population > curr.population ? prev : curr)?.name || 'N/A'} ({Math.round((currentData.reduce((prev, curr) => prev.population > curr.population ? prev : curr)?.population || 0) / analytics.totalQuizzes * 100)}% of quizzes)
                            </Text>
                        </View>
                    )}
                </View>
            </Animatable.View>
        );
    };

    const WeeklyActivity = () => {
        const data = {
            labels: analytics.weeklyProgress.map(day => day.day),
            datasets: [{
                data: analytics.weeklyProgress.map(day => day.quizzes),
            }]
        };

        return (
            <Animatable.View animation="fadeInUp" delay={1000} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Weekly Activity</Text>
                <BarChart
                    data={data}
                    width={screenWidth - 60}
                    height={200}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars
                />
                <Text style={[styles.chartSubtitle, currentTheme.chartSubtitle]}>
                    Quizzes taken per day
                </Text>
            </Animatable.View>
        );
    };

    // 🚀 NEW: Advanced Analytics Components
    const StreakPredictionCard = () => {
        if (!streakPrediction) return null;

        return (
            <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🔥 Streak Prediction</Text>
                
                <View style={styles.predictionContainer}>
                    <View style={styles.predictionStat}>
                        <Text style={[styles.predictionValue, { color: streakPrediction.likelihood > 70 ? '#28a745' : streakPrediction.likelihood > 40 ? '#ffc107' : '#dc3545' }]}>
                            {streakPrediction.likelihood}%
                        </Text>
                        <Text style={[styles.predictionLabel, currentTheme.categoryCount]}>Continuation Likelihood</Text>
                    </View>
                    
                    <View style={styles.predictionStat}>
                        <Text style={[styles.predictionValue, currentTheme.statNumber]}>
                            {streakPrediction.streakForecast.nextWeek}
                        </Text>
                        <Text style={[styles.predictionLabel, currentTheme.categoryCount]}>Predicted 7-day streak</Text>
                    </View>
                </View>

                <Text style={[styles.recommendationText, currentTheme.categoryName]}>
                    💡 {streakPrediction.recommendation}
                </Text>

                <View style={styles.factorsContainer}>
                    <Text style={[styles.factorsTitle, currentTheme.categoryName]}>Key Factors:</Text>
                    <Text style={[styles.factorText, currentTheme.categoryCount]}>
                        • Consistency: {streakPrediction.factors?.consistency || 0}%
                    </Text>
                    <Text style={[styles.factorText, currentTheme.categoryCount]}>
                        • Avg gap: {streakPrediction.factors?.averageGap || 0} days
                    </Text>
                    <Text style={[styles.factorText, currentTheme.categoryCount]}>
                        • Performance trend: {streakPrediction.factors?.performanceTrend > 0 ? '↗️' : streakPrediction.factors?.performanceTrend < 0 ? '↘️' : '→'} {Math.abs(streakPrediction.factors?.performanceTrend || 0)}%
                    </Text>
                </View>
            </Animatable.View>
        );
    };

    const GoalTrackingCard = () => {
        if (!userGoals) return null;

        const streakGoals = userGoals.streakGoals;
        const scoreGoals = userGoals.scoreGoals;

        return (
            <Animatable.View animation="fadeInUp" delay={800} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <View style={styles.goalHeader}>
                    <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🎯 Goals Progress</Text>
                    <TouchableOpacity
                        style={[styles.goalEditButton, { borderColor: isDarkMode ? '#D4AF37' : '#1A2C5B' }]}
                        onPress={() => setShowGoalModal(true)}
                    >
                        <FontAwesome5 name="edit" size={12} color={isDarkMode ? '#D4AF37' : '#1A2C5B'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.goalsGrid}>
                    <View style={styles.goalItem}>
                        <Text style={[styles.goalLabel, currentTheme.categoryName]}>Weekly Streak</Text>
                        <View style={styles.goalProgress}>
                            <View style={[styles.goalProgressBar, { width: `${Math.min((streakGoals.weekly.current / streakGoals.weekly.target) * 100, 100)}%`, backgroundColor: '#28a745' }]} />
                        </View>
                        <Text style={[styles.goalText, currentTheme.categoryCount]}>
                            {streakGoals.weekly.current}/{streakGoals.weekly.target} days
                        </Text>
                    </View>

                    <View style={styles.goalItem}>
                        <Text style={[styles.goalLabel, currentTheme.categoryName]}>Average Score</Text>
                        <View style={styles.goalProgress}>
                            <View style={[styles.goalProgressBar, { width: `${Math.min((scoreGoals.averageScore.current / scoreGoals.averageScore.target) * 100, 100)}%`, backgroundColor: '#3498DB' }]} />
                        </View>
                        <Text style={[styles.goalText, currentTheme.categoryCount]}>
                            {scoreGoals.averageScore.current}/{scoreGoals.averageScore.target}%
                        </Text>
                    </View>

                    <View style={styles.goalItem}>
                        <Text style={[styles.goalLabel, currentTheme.categoryName]}>Perfect Scores</Text>
                        <View style={styles.goalProgress}>
                            <View style={[styles.goalProgressBar, { width: `${Math.min((scoreGoals.perfectScores.current / scoreGoals.perfectScores.target) * 100, 100)}%`, backgroundColor: '#D4AF37' }]} />
                        </View>
                        <Text style={[styles.goalText, currentTheme.categoryCount]}>
                            {scoreGoals.perfectScores.current}/{scoreGoals.perfectScores.target} quizzes
                        </Text>
                    </View>
                </View>
            </Animatable.View>
        );
    };

    const LearningVelocityCard = () => {
        if (!learningVelocity) return null;

        const getTrendIcon = (trend) => {
            switch(trend) {
                case 'rapidly_improving': return '🚀';
                case 'improving': return '📈';
                case 'stable': return '➡️';
                case 'declining': return '📉';
                case 'rapidly_declining': return '⚠️';
                default: return '❓';
            }
        };

        const getTrendColor = (trend) => {
            switch(trend) {
                case 'rapidly_improving': return '#28a745';
                case 'improving': return '#28a745';
                case 'stable': return '#ffc107';
                case 'declining': return '#dc3545';
                case 'rapidly_declining': return '#dc3545';
                default: return '#6c757d';
            }
        };

        return (
            <Animatable.View animation="fadeInUp" delay={900} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>⚡ Learning Velocity</Text>
                
                <View style={styles.velocityStats}>
                    <View style={styles.velocityStat}>
                        <Text style={[styles.velocityValue, { color: getTrendColor(learningVelocity.trend) }]}>
                            {learningVelocity.velocity > 0 ? '+' : ''}{learningVelocity.velocity}%
                        </Text>
                        <Text style={[styles.velocityLabel, currentTheme.categoryCount]}>Per Day</Text>
                    </View>
                    
                    <View style={styles.velocityStat}>
                        <Text style={[styles.velocityTrend, { color: getTrendColor(learningVelocity.trend) }]}>
                            {getTrendIcon(learningVelocity.trend)} {learningVelocity.trend.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.velocityAnalysis, currentTheme.categoryName]}>
                    {learningVelocity.analysis}
                </Text>

                <Text style={[styles.velocityDetails, currentTheme.categoryCount]}>
                    Based on {learningVelocity.dataPoints} data points over {learningVelocity.timeWindow} days
                </Text>
            </Animatable.View>
        );
    };

    const DifficultyProgressionCard = () => {
        if (!difficultyProgression) return null;

        return (
            <Animatable.View animation="fadeInUp" delay={1000} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📊 Difficulty Progression</Text>
                
                <View style={styles.difficultyHeader}>
                    <Text style={[styles.currentLevel, currentTheme.categoryName]}>
                        Current Level: <Text style={{ color: '#3498DB' }}>{difficultyProgression.currentLevel}</Text>
                    </Text>
                    <View style={[styles.readinessIndicator, { 
                        backgroundColor: difficultyProgression.readyForNext ? '#28a745' : '#ffc107' 
                    }]}>
                        <Text style={styles.readinessText}>
                            {difficultyProgression.readyForNext ? 'Ready to advance!' : 'Keep practicing'}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.difficultyRecommendation, currentTheme.categoryName]}>
                    {difficultyProgression.recommendation}
                </Text>

                <View style={styles.nextStepsContainer}>
                    <Text style={[styles.nextStepsTitle, currentTheme.categoryName]}>Next Steps:</Text>
                    {difficultyProgression.nextSteps.map((step, index) => (
                        <Text key={index} style={[styles.nextStepItem, currentTheme.categoryCount]}>
                            • {step}
                        </Text>
                    ))}
                </View>
            </Animatable.View>
        );
    };

    const TimeAnalyticsCard = () => {
        if (!timeAnalytics) return null;

        return (
            <Animatable.View animation="fadeInUp" delay={1100} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>⏰ Study Time Analytics</Text>
                
                <View style={styles.timeStatsGrid}>
                    <View style={styles.timeStat}>
                        <Text style={[styles.timeValue, currentTheme.statNumber]}>
                            {Math.round(timeAnalytics.averageSessionDuration)}
                        </Text>
                        <Text style={[styles.timeLabel, currentTheme.categoryCount]}>Avg Session (min)</Text>
                    </View>
                    
                    <View style={styles.timeStat}>
                        <Text style={[styles.timeValue, currentTheme.statNumber]}>
                            {timeAnalytics.sessionsThisWeek}
                        </Text>
                        <Text style={[styles.timeLabel, currentTheme.categoryCount]}>Sessions This Week</Text>
                    </View>
                    
                    <View style={styles.timeStat}>
                        <Text style={[styles.timeValue, { color: '#28a745' }]}>
                            {timeAnalytics.optimalStudyTime}
                        </Text>
                        <Text style={[styles.timeLabel, currentTheme.categoryCount]}>Peak Performance</Text>
                    </View>
                    
                    <View style={styles.timeStat}>
                        <Text style={[styles.timeValue, currentTheme.statNumber]}>
                            {Math.round(timeAnalytics.totalStudyTime / 60) || 0}
                        </Text>
                        <Text style={[styles.timeLabel, currentTheme.categoryCount]}>Total Hours</Text>
                    </View>
                </View>

                <View style={styles.timeRecommendations}>
                    <Text style={[styles.recommendationsTitle, currentTheme.categoryName]}>💡 Time Optimization:</Text>
                    {timeAnalytics.recommendations.map((rec, index) => (
                        <Text key={index} style={[styles.recommendationItem, currentTheme.categoryCount]}>
                            • {rec}
                        </Text>
                    ))}
                </View>
            </Animatable.View>
        );
    };

    const NotificationInsightsCard = () => {
        if (!notificationInsights || !notificationInsights.analysisSnapshot) return null;
        
        const analysis = notificationInsights.analysisSnapshot;
        const counts = notificationInsights.activeCounts;
        
        return (
            <Animatable.View animation="fadeInUp" delay={1100} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🔔 Smart Notifications</Text>
                
                <View style={styles.notificationStatus}>
                    <View style={styles.statusRow}>
                        <Text style={[styles.statusLabel, currentTheme.categoryName]}>Active Reminders:</Text>
                        <Text style={[styles.statusValue, currentTheme.categoryName]}>{counts?.total || 0}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <Text style={[styles.statusLabel, currentTheme.categoryCount]}>• Exam reminders: {counts?.exam || 0}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <Text style={[styles.statusLabel, currentTheme.categoryCount]}>• Smart insights: {counts?.smart || 0}</Text>
                    </View>
                </View>
    
                <View style={styles.analysisPreview}>
                    <Text style={[styles.analysisTitle, currentTheme.categoryName]}>Latest Analysis:</Text>
                    <Text style={[styles.analysisText, currentTheme.categoryCount]}>
                        Trend: {analysis.trend || 'Stable'} • Score: {analysis.overallScore || 'N/A'}%
                    </Text>
                    {analysis.topFocusArea && (
                        <Text style={[styles.analysisText, currentTheme.categoryCount]}>
                            Focus: {analysis.topFocusArea}
                        </Text>
                    )}
                </View>
    
                <View style={styles.notificationActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, currentTheme.quickProgressAction]}
                        onPress={async () => {
                            const user = auth.currentUser;
                            if (user) {
                                const results = await NotificationManager.scheduleAllNotifications(
                                    user.uid, 
                                    null, 
                                    'manual_refresh'
                                );
                                Alert.alert('✨ Refreshed!', results.summary || 'Notifications updated with latest insights!');
                                
                                const newStatus = await NotificationManager.getNotificationStatus(user.uid);
                                setNotificationInsights(newStatus);
                            }
                        }}
                    >
                        <FontAwesome5 name="sync" size={14} color={getThemeProperty(currentTheme, 'quickProgressActionText', '#1A2C5B')} />
                        <Text style={[styles.actionButtonText, currentTheme.quickProgressActionText]}>
                            Refresh Analysis
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animatable.View>
        );
    };

    const SubjectOverviewCard = () => {
        if (!subjectSummary) {
            return (
                <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
                    <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📚 Subject Overview</Text>
                    <View style={styles.noDataContainer}>
                        <FontAwesome5 name="book-open" size={48} color={getThemeProperty(currentTheme, 'noDataIcon', '#7F8C8D')} />
                        <Text style={[styles.noDataText, currentTheme.noDataText]}>
                            Take quizzes to see subject-specific insights!
                        </Text>
                    </View>
                </Animatable.View>
            );
        }

        return (
            <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📚 Subject Overview</Text>
                
                <View style={styles.overviewStats}>
                    <View style={styles.overviewStat}>
                        <Text style={[styles.overviewValue, currentTheme.statNumber]}>
                            {subjectSummary.totalSubjects}
                        </Text>
                        <Text style={[styles.overviewLabel, currentTheme.statLabel]}>Subjects</Text>
                    </View>
                    
                    <View style={styles.overviewStat}>
                        <Text style={[styles.overviewValue, { color: '#28a745' }]}>
                            {subjectSummary.activeSubjects}
                        </Text>
                        <Text style={[styles.overviewLabel, currentTheme.statLabel]}>Active</Text>
                    </View>
                    
                    <View style={styles.overviewStat}>
                        <Text style={[styles.overviewValue, { color: '#dc3545' }]}>
                            {subjectSummary.neglectedCount || 0}
                        </Text>
                        <Text style={[styles.overviewLabel, currentTheme.statLabel]}>Neglected</Text>
                    </View>
                    
                    <View style={styles.overviewStat}>
                        <Text style={[styles.overviewValue, currentTheme.statNumber]}>
                            {subjectSummary.overallBalance}%
                        </Text>
                        <Text style={[styles.overviewLabel, currentTheme.statLabel]}>Balance</Text>
                    </View>
                </View>

                {subjectSummary.bestSubject && (
                    <View style={styles.highlightContainer}>
                        <View style={styles.highlight}>
                            <FontAwesome5 name="trophy" size={16} color="#28a745" />
                            <Text style={[styles.highlightText, currentTheme.categoryName]}>
                                Strongest: <Text style={{ color: '#28a745' }}>
                                    {subjectSummary.bestSubject.name} ({subjectSummary.bestSubject.averageScore.toFixed(0)}%)
                                </Text>
                            </Text>
                        </View>
                        
                        {subjectSummary.worstSubject && (
                            <View style={styles.highlight}>
                                <FontAwesome5 name="exclamation-triangle" size={16} color="#ffc107" />
                                <Text style={[styles.highlightText, currentTheme.categoryName]}>
                                    Needs work: <Text style={{ color: '#ffc107' }}>
                                        {subjectSummary.worstSubject.name} ({subjectSummary.worstSubject.averageScore.toFixed(0)}%)
                                    </Text>
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </Animatable.View>
        );
    };

    // ✅ COMPLETELY FIXED: SubjectProgressCards with all safety checks
    const SubjectProgressCards = () => {
        const subjectEntries = Object.entries(subjectProgress);
        
        if (subjectEntries.length === 0) {
          return (
            <Animatable.View animation="fadeInUp" delay={800} style={[styles.chartContainer, currentTheme.chartContainer]}>
              <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📖 Your Subjects</Text>
              <View style={styles.noDataContainer}>
                <FontAwesome5 name="graduation-cap" size={48} color={getThemeProperty(currentTheme, 'noDataIcon', '#7F8C8D')} />
                <Text style={[styles.noDataText, currentTheme.noDataText]}>
                  Start taking quizzes to track progress by subject!
                </Text>
              </View>
            </Animatable.View>
          );
        }
      
        return (
          <Animatable.View animation="fadeInUp" delay={800} style={[styles.chartContainer, currentTheme.chartContainer]}>
            <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📖 Your Subjects</Text>
            
            {subjectEntries.slice(0, 5).map(([subjectKey, subject], index) => {
              const daysSinceActivity = subject.lastActivity 
                ? Math.floor((new Date() - new Date(subject.lastActivity)) / (24 * 60 * 60 * 1000))
                : 999;
      
              // ✅ FIXED: Safe color and icon access with fallbacks
              const subjectColor = getSubjectColor(subject);
              const subjectIcon = getSubjectIcon(subject);
              const averageScore = subject.averageScore || 0;
      
              return (
                <View key={subjectKey} style={styles.subjectCard}>
                  <View style={styles.subjectHeader}>
                    <View style={styles.subjectInfo}>
                      <View style={[styles.subjectIcon, { backgroundColor: subjectColor + '20' }]}>
                        <FontAwesome5 name={subjectIcon} size={18} color={subjectColor} />
                      </View>
                      <View style={styles.subjectDetails}>
                        <Text style={[styles.subjectName, currentTheme.categoryName]}>
                          {subject.name || 'Unknown Subject'}
                        </Text>
                        <Text style={[styles.activityText, currentTheme.categoryCount]}>
                          {daysSinceActivity === 0 ? 'Active today' :
                           daysSinceActivity === 1 ? 'Yesterday' :
                           daysSinceActivity < 7 ? `${daysSinceActivity} days ago` :
                           'More than a week ago'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.trendIndicator}>
                      <FontAwesome5 
                        name={subject.trend === 'improving' ? 'trending-up' : 
                              subject.trend === 'declining' ? 'trending-down' : 'minus'} 
                        size={16} 
                        color={subject.trend === 'improving' ? '#28a745' : 
                               subject.trend === 'declining' ? '#dc3545' : getThemeProperty(currentTheme, 'categoryCount', '#7F8C8D')} 
                      />
                    </View>
                  </View>
      
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { 
                      width: `${Math.min(averageScore, 100)}%`,
                      backgroundColor: getAccuracyColor(averageScore)
                    }]} />
                  </View>
      
                  <View style={styles.subjectStats}>
                    <View style={styles.stat}>
                      <Text style={[styles.statValue, { color: getAccuracyColor(averageScore) }]}>
                        {averageScore.toFixed(0)}%
                      </Text>
                      <Text style={[styles.statLabel, currentTheme.categoryCount]}>Average</Text>
                    </View>
                    
                    <View style={styles.stat}>
                      <Text style={[styles.statValue, currentTheme.categoryName]}>
                        {subject.totalQuizzes || 0}
                      </Text>
                      <Text style={[styles.statLabel, currentTheme.categoryCount]}>Quizzes</Text>
                    </View>
                    
                    <View style={styles.stat}>
                      <Text style={[styles.statValue, currentTheme.categoryName]}>
                        {(subject.consistency || 0).toFixed(0)}%
                      </Text>
                      <Text style={[styles.statLabel, currentTheme.categoryCount]}>Consistency</Text>
                    </View>
                  </View>
      
                  <TouchableOpacity
                    style={[styles.practiceButton, { borderColor: subjectColor }]}
                    onPress={() => {
                      navigation.navigate('AskAlexandria', { 
                        suggestedTopic: subject.name,
                        subjectKey: subjectKey
                      });
                    }}
                  >
                    <FontAwesome5 name="play" size={12} color={subjectColor} />
                    <Text style={[styles.practiceButtonText, { color: subjectColor }]}>
                      Practice {subject.name || 'Subject'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            
            {subjectEntries.length > 5 && (
              <TouchableOpacity 
                style={[styles.viewMoreButton, currentTheme.periodButton]}
                onPress={() => {
                  Alert.alert('Coming Soon', 'Full subject dashboard will be available soon!');
                }}
              >
                <Text style={[styles.viewMoreText, currentTheme.periodButtonText]}>
                  View All {subjectEntries.length} Subjects
                </Text>
                <FontAwesome5 name="arrow-right" size={14} color={getThemeProperty(currentTheme, 'periodButtonText', '#1A2C5B')} />
              </TouchableOpacity>
            )}
          </Animatable.View>
        );
    };

    const SmartRecommendations = () => {
        if (subjectRecommendations.length === 0) return null;

        return (
            <Animatable.View animation="fadeInUp" delay={900} style={[styles.chartContainer, currentTheme.chartContainer]}>
                <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🎯 Smart Recommendations</Text>
                
                {subjectRecommendations.slice(0, 3).map((rec, index) => {
                    const priorityColor = rec.priority === 'high' ? '#dc3545' : 
                                        rec.priority === 'medium' ? '#ffc107' : '#17a2b8';
                    
                    return (
                        <View key={index} style={styles.recommendationItem}>
                            <View style={styles.recommendationHeader}>
                                <FontAwesome5 
                                    name={rec.priority === 'high' ? 'exclamation-circle' : 'lightbulb'} 
                                    size={14} 
                                    color={priorityColor} 
                                />
                                <Text style={[styles.recommendationPriority, { color: priorityColor }]}>
                                    {rec.priority.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={[styles.recommendationMessage, currentTheme.categoryName]}>
                                {rec.message}
                            </Text>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: priorityColor + '20', borderColor: priorityColor }]}
                                onPress={() => {
                                    if (rec.action === 'take_quiz' || rec.action === 'focus_practice') {
                                        navigation.navigate('AskAlexandria', { 
                                            suggestedTopic: rec.subjectKey,
                                            focusWeaknesses: rec.action === 'focus_practice'
                                        });
                                    }
                                }}
                            >
                                <Text style={[styles.actionButtonText, { color: priorityColor }]}>
                                    {rec.action === 'take_quiz' ? 'Take Quiz' : 'Focus Practice'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </Animatable.View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, currentTheme.container, styles.centerContent]}>
                <StatusBar barStyle={statusBarStyle} />
                <ActivityIndicator size="large" color={getThemeProperty(currentTheme, 'loadingColor', '#1A2C5B')} />
                <Text style={[styles.loadingText, currentTheme.loadingText]}>
                    Analyzing your progress...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, currentTheme.container]}>
            <StatusBar barStyle={statusBarStyle} />
            <Animated.View style={{ 
                opacity: fadeAnim, 
                transform: [
                    { translateY: slideAnim },
                    { scale: containerAnim }
                ] 
            }}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchAnalytics().finally(() => setRefreshing(false));
                            }}
                            colors={[getThemeProperty(currentTheme, 'refreshColor', '#1A2C5B')]}
                            tintColor={getThemeProperty(currentTheme, 'refreshColor', '#1A2C5B')}
                        />
                    }
                >
                    <Header />
                    <TabSelector />
                    
                    {activeTab === 'overall' ? (
                        <>
                            <PeriodSelector />
                            <StatsCards />
                            <ScoreChart />
                            <CategoryStats />
                            <DistributionChart />
                            <WeeklyActivity />
                            <NotificationInsightsCard />
                        </>
                    ) : activeTab === 'subjects' ? (
                        <>
                            <SubjectOverviewCard />
                            <SubjectProgressCards />
                            <SmartRecommendations />
                        </>
                    ) : (
                        <>
                            <StreakPredictionCard />
                            <GoalTrackingCard />
                            <LearningVelocityCard />
                            <DifficultyProgressionCard />
                            <TimeAnalyticsCard />
                        </>
                    )}
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 30,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    titleIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    periodSelector: {
        flexDirection: 'row',
        marginBottom: 30,
        borderRadius: 12,
        padding: 4,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tabSelector: {
        flexDirection: 'row',
        marginBottom: 30,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '800',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.8,
    },
    chartContainer: {
        marginBottom: 30,
        padding: 20,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    chartTitle: {
        fontSize: 20,
        fontWeight: '700',
        // marginBottom: 16, // This margin is now handled by the parent container's 'gap' style
        textAlign: 'center',
    },
    chartSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.7,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    noDataContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noDataText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        opacity: 0.7,
    },
    categoryItem: {
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoryAccuracy: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        marginBottom: 4,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    categoryCount: {
        fontSize: 12,
        opacity: 0.7,
    },
    notificationStatus: {
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusLabel: {
        fontSize: 14,
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    analysisPreview: {
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    analysisTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    analysisText: {
        fontSize: 14,
        marginBottom: 4,
    },
    notificationActions: {
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 12,
        opacity: 0.8,
    },
    overviewStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    overviewStat: {
        alignItems: 'center',
    },
    overviewValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    overviewLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    highlightContainer: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    highlight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    highlightText: {
        fontSize: 14,
    },
    subjectCard: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    subjectIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    subjectDetails: {
        flex: 1,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '600',
    },
    activityText: {
        fontSize: 12,
        marginTop: 2,
    },
    trendIndicator: {
        padding: 4,
    },
    subjectStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 16,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    practiceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    practiceButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
        borderRadius: 8,
        gap: 8,
    },
    viewMoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
    recommendationItem: {
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    recommendationPriority: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    recommendationMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    // ✅ NEW: Styles for toggle chart
    chartHeaderWithToggle: {
        flexDirection: 'column', // Changed from 'row' to stack items vertically
        alignItems: 'center',    // Center the title and buttons
        marginBottom: 16,
        gap: 12,                 // Add space between the title and the buttons
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        padding: 2,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        marginHorizontal: 1,
        gap: 4,
    },
    activeToggleButton: {
        backgroundColor: '#1A2C5B',
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    chartInsights: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    insightText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    // 🚀 NEW: Advanced Analytics Styles
    predictionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    predictionStat: {
        alignItems: 'center',
        flex: 1,
    },
    predictionValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    predictionLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    recommendationText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 12,
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    factorsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    factorsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    factorText: {
        fontSize: 12,
        marginBottom: 4,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    goalEditButton: {
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    goalsGrid: {
        gap: 12,
    },
    goalItem: {
        marginBottom: 12,
    },
    goalLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    goalProgress: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        marginBottom: 4,
    },
    goalProgressBar: {
        height: '100%',
        borderRadius: 3,
    },
    goalText: {
        fontSize: 12,
        textAlign: 'right',
    },
    velocityStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    velocityStat: {
        alignItems: 'center',
        flex: 1,
    },
    velocityValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    velocityLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    velocityTrend: {
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    velocityAnalysis: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 8,
    },
    velocityDetails: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.7,
    },
    difficultyHeader: {
        marginBottom: 16,
    },
    currentLevel: {
        fontSize: 16,
        marginBottom: 8,
    },
    readinessIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    readinessText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    difficultyRecommendation: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 16,
    },
    nextStepsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    nextStepsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    nextStepItem: {
        fontSize: 12,
        marginBottom: 4,
    },
    timeStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    timeStat: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    timeLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    timeRecommendations: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    recommendationsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    recommendationItem: {
        fontSize: 12,
        marginBottom: 4,
    },
});

export default ProgressTrackerScreen;