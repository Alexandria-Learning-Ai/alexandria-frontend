// ProgressTrackerScreen.js - Refactored Alexandria Version
import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import { SubjectProgressService } from '../services/SubjectProgressService';
import AdvancedProgressAnalytics from '../services/AdvancedProgressAnalytics';
import NotificationManager from '../utils/NotificationManager';
import { useProgressAnalytics } from '../hooks/useProgressAnalytics';
import { useProgressTheme } from '../hooks/useProgressTheme';
import logger from '../utils/logger';
import { styles } from '../styles/ProgressTrackerScreenStyles';
import { getThemeProperty, getSubjectColor, getSubjectIcon } from '../utils/progressHelpers';

// Import extracted components
import StatCards from '../components/progress/StatCards';
import ScoreChart from '../components/progress/ScoreChart';
import CategoryStats from '../components/progress/CategoryStats';
import DistributionChart from '../components/progress/DistributionChart';
import WeeklyActivity from '../components/progress/WeeklyActivity';
import NotificationInsightsCard from '../components/progress/NotificationInsightsCard';
import PeriodSelector from '../components/progress/PeriodSelector';
import SubjectOverviewCard from '../components/progress/SubjectOverviewCard';
import HierarchicalCoursesView from '../components/progress/HierarchicalCoursesView';
import TabSelector from '../components/progress/TabSelector';
import Header from '../components/progress/Header';
import SubjectProgressCards from '../components/progress/SubjectProgressCards';
import SmartRecommendations from '../components/progress/SmartRecommendations';
import StreakPredictionCard from '../components/progress/StreakPredictionCard';
import GoalTrackingCard from '../components/progress/GoalTrackingCard';
import LearningVelocityCard from '../components/progress/LearningVelocityCard';
import DifficultyProgressionCard from '../components/progress/DifficultyProgressionCard';
import TimeAnalyticsCard from '../components/progress/TimeAnalyticsCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ProgressTrackerScreen = ({ navigation }) => {
    // Theme hook
    const { isDarkMode, setIsDarkMode, currentTheme, statusBarStyle } = useProgressTheme();

    // Core state
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overall');
    const [pieChartMode, setPieChartMode] = useState('difficulty');

    // Advanced analytics state
    const [notificationInsights, setNotificationInsights] = useState(null);
    const [hierarchicalProgress, setHierarchicalProgress] = useState({});
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [hierarchicalRecommendations, setHierarchicalRecommendations] = useState([]);
    const [streakPrediction, setStreakPrediction] = useState(null);
    const [userGoals, setUserGoals] = useState(null);
    const [learningVelocity, setLearningVelocity] = useState(null);
    const [difficultyProgression, setDifficultyProgression] = useState(null);
    const [timeAnalytics, setTimeAnalytics] = useState(null);
    const [showGoalModal, setShowGoalModal] = useState(false);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const containerAnim = useRef(new Animated.Value(1)).current;

    // Analytics hook
    const {
        analytics,
        loading,
        dataSource,
        backendError,
        subjectProgress,
        subjectRecommendations,
        subjectSummary,
        learningProfile,
        streakInfo,
        studyInsights,
        refreshAnalytics
    } = useProgressAnalytics(selectedPeriod);

    // Load notification insights
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

    // Animations
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
            Animated.spring(containerAnim, {
                toValue: 1,
                tension: 80,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    }, [selectedPeriod]);

    // Refresh on focus
    useFocusEffect(
        React.useCallback(() => {
            refreshAnalytics();
            loadHierarchicalData();
            loadAdvancedAnalytics();
        }, [])
    );

    // Load hierarchical data
    const loadHierarchicalData = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const recommendations = await SubjectProgressService.getHierarchicalRecommendations(user.uid);
            setHierarchicalRecommendations(recommendations);

            logger.info('📊 Hierarchical progress loaded');
        } catch (error) {
            logger.error('❌ Error loading hierarchical progress:', error);
        }
    };

    // Load advanced analytics
    const loadAdvancedAnalytics = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const [
                prediction,
                goals,
                velocity,
                progression,
                timeData
            ] = await Promise.all([
                AdvancedProgressAnalytics.getStreakPrediction(user.uid),
                AdvancedProgressAnalytics.getUserGoals(user.uid),
                AdvancedProgressAnalytics.getLearningVelocity(user.uid),
                AdvancedProgressAnalytics.getDifficultyProgression(user.uid),
                AdvancedProgressAnalytics.getTimeAnalytics(user.uid)
            ]);

            setStreakPrediction(prediction);
            setUserGoals(goals);
            setLearningVelocity(velocity);
            setDifficultyProgression(progression);
            setTimeAnalytics(timeData);

            logger.info('🚀 Advanced analytics loaded');
        } catch (error) {
            logger.warn('⚠️ Advanced analytics loading failed:', error);
        }
    };

    // Handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refreshAnalytics(),
                loadHierarchicalData(),
                loadAdvancedAnalytics()
            ]);
        } catch (error) {
            logger.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Loading state
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

    // Main render
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
                            onRefresh={onRefresh}
                            colors={[getThemeProperty(currentTheme, 'refreshColor', '#1A2C5B')]}
                            tintColor={getThemeProperty(currentTheme, 'refreshColor', '#1A2C5B')}
                        />
                    }
                >
                    {/* Header */}
                    <Header
                        navigation={navigation}
                        containerAnim={containerAnim}
                        dataSource={dataSource}
                        backendError={backendError}
                        styles={styles}
                        currentTheme={currentTheme}
                    />

                    {/* Tab Selector */}
                    <TabSelector
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        styles={styles}
                        currentTheme={currentTheme}
                    />

                    {/* Overall Tab */}
                    {activeTab === 'overall' && (
                        <>
                            <PeriodSelector
                                selectedPeriod={selectedPeriod}
                                setSelectedPeriod={setSelectedPeriod}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <StatCards
                                analytics={analytics}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <ScoreChart
                                scoreHistory={analytics.scoreHistory}
                                chartConfig={{ backgroundGradientFrom: currentTheme.chartContainer.backgroundColor, backgroundGradientTo: currentTheme.chartContainer.backgroundColor, color: (opacity = 1) => `rgba(26, 44, 91, ${opacity})` }}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <CategoryStats
                                categoryStats={analytics.categoryStats}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <DistributionChart
                                difficultyBreakdown={analytics.difficultyBreakdown}
                                subjectBreakdown={analytics.subjectBreakdown}
                                pieChartMode={pieChartMode}
                                setPieChartMode={setPieChartMode}
                                totalQuizzes={analytics.totalQuizzes}
                                isDarkMode={isDarkMode}
                                chartConfig={{ backgroundGradientFrom: currentTheme.chartContainer.backgroundColor, backgroundGradientTo: currentTheme.chartContainer.backgroundColor }}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <WeeklyActivity
                                weeklyProgress={analytics.weeklyProgress}
                                chartConfig={{ backgroundGradientFrom: currentTheme.chartContainer.backgroundColor, backgroundGradientTo: currentTheme.chartContainer.backgroundColor, color: (opacity = 1) => `rgba(26, 44, 91, ${opacity})` }}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <NotificationInsightsCard
                                notificationInsights={notificationInsights}
                                setNotificationInsights={setNotificationInsights}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                        </>
                    )}

                    {/* Subjects Tab */}
                    {activeTab === 'subjects' && (
                        <>
                            <SubjectOverviewCard
                                subjectSummary={subjectSummary}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <SubjectProgressCards
                                subjectProgress={subjectProgress}
                                navigation={navigation}
                                getSubjectColor={getSubjectColor}
                                getSubjectIcon={getSubjectIcon}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <SmartRecommendations
                                subjectRecommendations={subjectRecommendations}
                                navigation={navigation}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                        </>
                    )}

                    {/* Courses Tab */}
                    {activeTab === 'courses' && (
                        <HierarchicalCoursesView
                            hierarchicalProgress={hierarchicalProgress}
                            selectedSubject={selectedSubject}
                            setSelectedSubject={setSelectedSubject}
                            hierarchicalRecommendations={hierarchicalRecommendations}
                            navigation={navigation}
                            styles={styles}
                            currentTheme={currentTheme}
                        />
                    )}

                    {/* Advanced Tab */}
                    {activeTab === 'advanced' && (
                        <>
                            <StreakPredictionCard
                                streakPrediction={streakPrediction}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <GoalTrackingCard
                                userGoals={userGoals}
                                isDarkMode={isDarkMode}
                                setShowGoalModal={setShowGoalModal}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <LearningVelocityCard
                                learningVelocity={learningVelocity}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <DifficultyProgressionCard
                                difficultyProgression={difficultyProgression}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                            <TimeAnalyticsCard
                                timeAnalytics={timeAnalytics}
                                styles={styles}
                                currentTheme={currentTheme}
                            />
                        </>
                    )}
                </ScrollView>
            </Animated.View>
        </View>
    );
};

export default ProgressTrackerScreen;
