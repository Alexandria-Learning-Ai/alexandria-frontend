import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { CoachUtils } from '../utils/CoachUtils';
import CoachMessage from '../components/CoachMessage';
import { auth } from '../firebaseConfig'; // ✅ Import auth
import SafeBackButton from '../components/SafeBackButton';
import logger from '../utils/logger';


const CoachScreen = ({ navigation, isDarkMode = false }) => {
    const [weeklySummary, setWeeklySummary] = useState(null);
    const [coachHistory, setCoachHistory] = useState([]);
    const [nudgeMessage, setNudgeMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const currentThemeStyles = isDarkMode ? darkCoachScreenStyles : lightCoachScreenStyles;
    const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

    useEffect(() => {
        loadCoachData();
    }, []);

    const loadCoachData = async () => {
        try {
            const user = auth.currentUser; // ✅ Get current user
            if (!user) {
                setLoading(false);
                return; // Don't load data if no user
            }

            const [summary, history, nudge] = await Promise.all([
                CoachUtils.getWeeklySummary(user.uid), // ✅ Pass userId
                CoachUtils.getCoachHistory(user.uid), // ✅ Pass userId
                CoachUtils.checkForNudge(user.uid),   // ✅ Pass userId
            ]);

            setWeeklySummary(summary);
            setCoachHistory(history.slice(0, 10)); // Show last 10 messages
            setNudgeMessage(nudge);
        } catch (error) {
            logger.error('Error loading coach data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCoachData();
        setRefreshing(false);
    };

    const renderWeeklySummary = () => {
        if (!weeklySummary) return null;

        return (
            <Animatable.View animation="fadeInUp" delay={200} style={[styles.summaryCard, currentThemeStyles.summaryCard]}>
                <View style={styles.summaryHeader}>
                    <FontAwesome5 name="chart-line" size={24} color="#17a2b8" />
                    <Text style={[styles.summaryTitle, currentThemeStyles.summaryTitle]}>
                        This Week's Progress
                    </Text>
                </View>
                
                <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, currentThemeStyles.statNumber]}>
                            {weeklySummary.totalQuizzes}
                        </Text>
                        <Text style={[styles.statLabel, currentThemeStyles.statLabel]}>
                            Quizzes
                        </Text>
                    </View>
                    
                    <View style={styles.statDivider} />
                    
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, currentThemeStyles.statNumber]}>
                            {weeklySummary.averageScore}%
                        </Text>
                        <Text style={[styles.statLabel, currentThemeStyles.statLabel]}>
                            Average
                        </Text>
                    </View>
                    
                    <View style={styles.statDivider} />
                    
                    <View style={styles.statItem}>
                        <Text style={[
                            styles.statNumber, 
                            currentThemeStyles.statNumber,
                            { color: weeklySummary.improvement >= 0 ? '#28a745' : '#dc3545' }
                        ]}>
                            {weeklySummary.improvement > 0 ? '+' : ''}{weeklySummary.improvement}%
                        </Text>
                        <Text style={[styles.statLabel, currentThemeStyles.statLabel]}>
                            Change
                        </Text>
                    </View>
                </View>
                
                <Text style={[styles.summaryMessage, currentThemeStyles.summaryMessage]}>
                    {weeklySummary.message}
                </Text>
                
                {weeklySummary.categories.length > 0 && (
                    <View style={styles.categoriesContainer}>
                        <Text style={[styles.categoriesTitle, currentThemeStyles.categoriesTitle]}>
                            Subjects Explored:
                        </Text>
                        <View style={styles.categoriesRow}>
                            {weeklySummary.categories.map((category, index) => (
                                <View key={index} style={[styles.categoryChip, currentThemeStyles.categoryChip]}>
                                    <Text style={[styles.categoryChipText, currentThemeStyles.categoryChipText]}>
                                        {category}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </Animatable.View>
        );
    };

    const renderNudgeMessage = () => {
        if (!nudgeMessage) return null;

        return (
            <Animatable.View 
                animation="bounceIn" 
                delay={400} 
                style={[
                    styles.nudgeCard, 
                    currentThemeStyles.nudgeCard,
                    { borderLeftColor: nudgeMessage.urgency === 'high' ? '#dc3545' : '#ffc107' }
                ]}
            >
                <View style={styles.nudgeHeader}>
                    <FontAwesome5 
                        name={nudgeMessage.urgency === 'high' ? 'exclamation-triangle' : 'clock'} 
                        size={20} 
                        color={nudgeMessage.urgency === 'high' ? '#dc3545' : '#ffc107'} 
                    />
                    <Text style={[styles.nudgeTitle, currentThemeStyles.nudgeTitle]}>
                        {nudgeMessage.daysSince === 1 ? 'Yesterday' : `${nudgeMessage.daysSince} days ago`}
                    </Text>
                </View>
                <Text style={[styles.nudgeMessage, currentThemeStyles.nudgeMessage]}>
                    {nudgeMessage.message}
                </Text>
                <TouchableOpacity
                    style={[styles.nudgeButton, { backgroundColor: nudgeMessage.urgency === 'high' ? '#dc3545' : '#ffc107' }]}
                    onPress={() => navigation.navigate('Upload')}
                >
                    <FontAwesome5 name="play" size={16} color="#FFFFFF" />
                    <Text style={styles.nudgeButtonText}>Take a Quiz Now</Text>
                </TouchableOpacity>
            </Animatable.View>
        );
    };

    const renderCoachHistory = () => {
        if (coachHistory.length === 0) return null;

        return (
            <Animatable.View animation="fadeInUp" delay={600} style={styles.historySection}>
                <Text style={[styles.historyTitle, currentThemeStyles.historyTitle]}>
                    Recent Coach Messages
                </Text>
                {coachHistory.map((message, index) => (
                    <View key={index} style={[styles.historyItem, currentThemeStyles.historyItem]}>
                        <View style={styles.historyHeader}>
                            <Text style={[styles.historyDate, currentThemeStyles.historyDate]}>
                                {new Date(message.date).toLocaleDateString()}
                            </Text>
                            <View style={[styles.historyScore, { backgroundColor: getScoreColor(message.score) }]}>
                                <Text style={styles.historyScoreText}>{message.score}%</Text>
                            </View>
                        </View>
                        <Text style={[styles.historyMessage, currentThemeStyles.historyMessage]}>
                            {message.message}
                        </Text>
                        <Text style={[styles.historyCategory, currentThemeStyles.historyCategory]}>
                            {message.category}
                        </Text>
                    </View>
                ))}
            </Animatable.View>
        );
    };

    const getScoreColor = (score) => {
        if (score >= 90) return '#D4AF37';
        if (score >= 80) return '#28a745';
        if (score >= 70) return '#17a2b8';
        if (score >= 60) return '#ffc107';
        return '#dc3545';
    };

    return (
        <View style={[styles.container, currentThemeStyles.container]}>
            <StatusBar barStyle={statusBarStyle} />
            
            {/* Header */}
            <View style={[styles.header, currentThemeStyles.header]}>
                <SafeBackButton
                    style={[styles.backButton, currentThemeStyles.backButton]}
                    color={currentThemeStyles.backButtonText.color}
                    size={20}
                />
                
                <Text style={[styles.headerTitle, currentThemeStyles.headerTitle]}>
                    Your Learning Coach
                </Text>
                
                <TouchableOpacity
                    style={[styles.headerButton, currentThemeStyles.headerButton]}
                    onPress={() => navigation.navigate('Upload')}
                >
                    <FontAwesome5 name="plus" size={20} color={currentThemeStyles.headerButtonText.color} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[currentThemeStyles.refreshColor?.color || '#1A2C5B']}
                        tintColor={currentThemeStyles.refreshColor?.color || '#1A2C5B'}
                    />
                }
            >
                {/* Welcome Section */}
                <Animatable.View animation="fadeIn" style={styles.welcomeSection}>
                    <View style={[styles.coachAvatar, currentThemeStyles.coachAvatar]}>
                        <FontAwesome5 name="user-graduate" size={32} color={currentThemeStyles.coachAvatarIcon.color} />
                    </View>
                    <Text style={[styles.welcomeTitle, currentThemeStyles.welcomeTitle]}>
                        Welcome to Your Learning Journey
                    </Text>
                    <Text style={[styles.welcomeSubtitle, currentThemeStyles.welcomeSubtitle]}>
                        Track your progress, get personalized insights, and stay motivated!
                    </Text>
                </Animatable.View>

                {/* Nudge Message */}
                {renderNudgeMessage()}

                {/* Weekly Summary */}
                {renderWeeklySummary()}

                {/* Sample Coach Message */}
                <CoachMessage
                    currentScore={0}
                    totalQuestions={1}
                    quizCategory="Sample"
                    isDarkMode={isDarkMode}
                    style={{ marginVertical: 10 }}
                />

                {/* Coach History */}
                {renderCoachHistory()}

                {/* Action Buttons */}
                <Animatable.View animation="fadeInUp" delay={800} style={styles.actionsSection}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.primaryAction, currentThemeStyles.primaryAction]}
                        onPress={() => navigation.navigate('Upload')}
                    >
                        <FontAwesome5 name="play" size={20} color={currentThemeStyles.primaryActionText.color} />
                        <Text style={[styles.actionButtonText, currentThemeStyles.primaryActionText]}>
                            Take a Quiz
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryAction, currentThemeStyles.secondaryAction]}
                        onPress={() => navigation.navigate('QuizHistory')}
                    >
                        <FontAwesome5 name="history" size={20} color={currentThemeStyles.secondaryActionText.color} />
                        <Text style={[styles.actionButtonText, currentThemeStyles.secondaryActionText]}>
                            View History
                        </Text>
                    </TouchableOpacity>
                </Animatable.View>
            </ScrollView>
        </View>
    );
};

// Styles for CoachScreen
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    coachAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
        lineHeight: 22,
    },
    nudgeCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
    },
    nudgeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    nudgeTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    nudgeMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    nudgeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    nudgeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 12,
    },
    summaryStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
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
    summaryMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    categoriesContainer: {
        marginTop: 8,
    },
    categoriesTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    categoriesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    historySection: {
        marginTop: 20,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    historyItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyDate: {
        fontSize: 12,
        opacity: 0.7,
    },
    historyScore: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historyScoreText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    historyMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    historyCategory: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.6,
    },
    actionsSection: {
        marginTop: 30,
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 12,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryAction: {
        backgroundColor: '#1A2C5B',
    },
    secondaryAction: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#1A2C5B',
    },
});

// Light Theme Styles for CoachScreen
const lightCoachScreenStyles = StyleSheet.create({
    container: {
        backgroundColor: '#F8F4E3',
    },
    header: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(26, 44, 91, 0.1)',
    },
    backButton: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
    },
    backButtonText: {
        color: '#1A2C5B',
    },
    headerTitle: {
        color: '#1A2C5B',
    },
    headerButton: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
    },
    headerButtonText: {
        color: '#1A2C5B',
    },
    coachAvatar: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
    },
    coachAvatarIcon: {
        color: '#D4AF37',
    },
    welcomeTitle: {
        color: '#1A2C5B',
    },
    welcomeSubtitle: {
        color: '#4A5568',
    },
    nudgeCard: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    nudgeTitle: {
        color: '#1A2C5B',
    },
    nudgeMessage: {
        color: '#4A5568',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#1A2C5B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryTitle: {
        color: '#1A2C5B',
    },
    statNumber: {
        color: '#1A2C5B',
    },
    statLabel: {
        color: '#4A5568',
    },
    summaryMessage: {
        color: '#4A5568',
    },
    categoriesTitle: {
        color: '#1A2C5B',
    },
    categoryChip: {
        backgroundColor: 'rgba(26, 44, 91, 0.1)',
        borderColor: 'rgba(26, 44, 91, 0.2)',
    },
    categoryChipText: {
        color: '#1A2C5B',
    },
    historyTitle: {
        color: '#1A2C5B',
    },
    historyItem: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    historyDate: {
        color: '#4A5568',
    },
    historyMessage: {
        color: '#2D3748',
    },
    historyCategory: {
        color: '#4A5568',
    },
    primaryAction: {
        backgroundColor: '#1A2C5B',
    },
    primaryActionText: {
        color: '#FFFFFF',
    },
    secondaryAction: {
        borderColor: '#1A2C5B',
    },
    secondaryActionText: {
        color: '#1A2C5B',
    },
    refreshColor: {
        color: '#1A2C5B',
    },
});

// Dark Theme Styles for CoachScreen
const darkCoachScreenStyles = StyleSheet.create({
    container: {
        backgroundColor: '#1A2C5B',
    },
    header: {
        backgroundColor: 'rgba(44, 70, 125, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    },
    backButton: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
    },
    backButtonText: {
        color: '#F8F4E3',
    },
    headerTitle: {
        color: '#F8F4E3',
    },
    headerButton: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
    },
    headerButtonText: {
        color: '#F8F4E3',
    },
    coachAvatar: {
        backgroundColor: 'rgba(212, 175, 55, 0.3)',
    },
    coachAvatarIcon: {
        color: '#D4AF37',
    },
    welcomeTitle: {
        color: '#F8F4E3',
    },
    welcomeSubtitle: {
        color: '#CBD5E0',
    },
    nudgeCard: {
        backgroundColor: '#2D3748',
        borderColor: '#4A5568',
    },
    nudgeTitle: {
        color: '#F8F4E3',
    },
    nudgeMessage: {
        color: '#CBD5E0',
    },
    summaryCard: {
        backgroundColor: '#2D3748',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryTitle: {
        color: '#F8F4E3',
    },
    statNumber: {
        color: '#F8F4E3',
    },
    statLabel: {
        color: '#CBD5E0',
    },
    summaryMessage: {
        color: '#CBD5E0',
    },
    categoriesTitle: {
        color: '#F8F4E3',
    },
    categoryChip: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    categoryChipText: {
        color: '#F8F4E3',
    },
    historyTitle: {
        color: '#F8F4E3',
    },
    historyItem: {
        backgroundColor: '#2D3748',
        borderColor: '#4A5568',
    },
    historyDate: {
        color: '#CBD5E0',
    },
    historyMessage: {
        color: '#F8F4E3',
    },
    historyCategory: {
        color: '#CBD5E0',
    },
    primaryAction: {
        backgroundColor: '#D4AF37',
    },
    primaryActionText: {
        color: '#1A2C5B',
    },
    secondaryAction: {
        borderColor: '#F8F4E3',
    },
    secondaryActionText: {
        color: '#F8F4E3',
    },
    refreshColor: {
        color: '#D4AF37',
    },
});

export default CoachScreen;
export { CoachUtils };