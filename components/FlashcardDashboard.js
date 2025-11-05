import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
    Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FlashcardService } from '../services/FlashcardService';
import { auth } from '../firebaseConfig';
import SafeBackButton from './SafeBackButton';
import logger from '../utils/logger';


const { width: screenWidth } = Dimensions.get('window');

const FlashcardDashboard = ({ navigation, isDarkMode = true, onClose }) => {
    const [stats, setStats] = useState({
        totalFlashcards: 0,
        dueToday: 0,
        masteringCards: 0,
        strugglingCards: 0,
        dailyStreak: 0,
        newCards: 0, // Added: count of unreviewed cards
        subjectBreakdown: {},
        weeklyProgress: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) return;

            const dashboardStats = await FlashcardService.getStudyStatistics(userId);

            // Calculate new cards (unreviewed)
            const allCards = await FlashcardService.getFlashcards(userId);
            const newCards = allCards.filter(card => (card.reviewCount || 0) === 0).length;

            setStats({ ...dashboardStats, newCards });
            logger.info('📊 Loaded flashcard dashboard stats:', { ...dashboardStats, newCards });
        } catch (error) {
            logger.error('❌ Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const startStudySession = (mode = 'review', filters = {}) => {
        if (stats.totalFlashcards === 0) {
            Alert.alert(
                'No Flashcards Yet',
                'Complete some quizzes first! Alexandria will automatically create flashcards from questions you get wrong.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Apply selected filters if any
        const sessionFilters = {
            ...filters,
            subject: selectedSubject || filters.subject,
            difficulty: selectedDifficulty || filters.difficulty
        };

        navigation.navigate('FlashcardScreen', {
            mode,
            filters: sessionFilters
        });
        onClose?.();
    };

    const clearFilters = () => {
        setSelectedSubject(null);
        setSelectedDifficulty(null);
    };

    const generateFlashcardsFromMistakes = async () => {
        Alert.alert(
            'Generate Flashcards',
            'This will analyze your recent quiz mistakes from the last 7 days and create flashcards for study. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Generate', onPress: async () => {
                    try {
                        const userId = auth.currentUser?.uid;
                        if (!userId) {
                            Alert.alert('Error', 'Please log in to generate flashcards');
                            return;
                        }

                        logger.info('🔄 Starting auto-generate flashcards...');
                        
                        const newFlashcards = await FlashcardService.generateFlashcardsFromRecentMistakes(userId, 7);
                        
                        if (newFlashcards.length > 0) {
                            Alert.alert(
                                'Success! 🎉', 
                                `Generated ${newFlashcards.length} flashcards from your recent quiz mistakes. They're ready for study!`,
                                [{ text: 'Start Studying', onPress: () => startStudySession('review') }]
                            );
                            // Reload dashboard data to reflect new flashcards
                            loadDashboardData();
                        } else {
                            Alert.alert(
                                'No New Cards', 
                                'No quiz mistakes found in the last 7 days, or flashcards already exist for your recent mistakes. Take more quizzes to generate new flashcards!'
                            );
                        }
                    } catch (error) {
                        logger.error('❌ Error generating flashcards:', error);
                        Alert.alert('Error', 'Failed to generate flashcards. Make sure you have taken some quizzes recently.');
                    }
                }}
            ]
        );
    };

    const testFlashcardSystem = async () => {
        try {
            const success = await FlashcardService.testFlashcardSystem();
            if (success) {
                Alert.alert('Test Passed! ✅', 'Flashcard system is working correctly. You should see test data in your flashcards now.');
            } else {
                Alert.alert('Test Failed ❌', 'There seems to be an issue with the flashcard system. Check the console logs for details.');
            }
        } catch (error) {
            logger.error('❌ Error testing flashcard system:', error);
            Alert.alert('Test Error', 'Failed to test flashcard system. Check your internet connection and Firebase settings.');
        }
    };

    const themeColors = isDarkMode ? {
        background: '#1A2C5B',
        cardBackground: '#2A3F73',
        text: '#F8F4E3',
        accent: '#D4AF37', // Alexandria Gold
        study: '#014421', // Forest Green  
        review: '#D4AF37', // Alexandria Gold
        autoGenerate: '#CD7F32', // Alexandria Bronze
        struggling: '#800020', // Maroon Red
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
    } : {
        background: '#F8F4E3',
        cardBackground: '#FFFFFF',
        text: '#1A2C5B',
        accent: '#1A2C5B',
        study: '#014421', // Forest Green
        review: '#D4AF37', // Alexandria Gold  
        autoGenerate: '#CD7F32', // Alexandria Bronze
        struggling: '#800020', // Maroon Red
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
                <FontAwesome5 name="spinner" size={30} color={themeColors.accent} />
                <Text style={[styles.loadingText, { color: themeColors.text }]}>
                    Loading flashcards...
                </Text>
            </View>
        );
    }

    return (
        <Modal
            visible={true}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <LinearGradient
                colors={isDarkMode ? ['#1A2C5B', '#2A3F73'] : ['#F8F4E3', '#E8E0C8']}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <SafeBackButton 
                        color={themeColors.text}
                        size={20}
                        onPress={onClose}
                        style={styles.closeButton}
                    />
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                        📚 Flashcard Studio
                    </Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Compact Stats Header */}
                    <Animatable.View animation="fadeInUp" delay={200} style={styles.statsHeader}>
                        <View style={styles.streakBadge}>
                            <FontAwesome5 name="fire" size={16} color={themeColors.accent} />
                            <Text style={[styles.streakText, { color: themeColors.accent }]}>
                                {stats.dailyStreak} day streak
                            </Text>
                        </View>
                        <View style={styles.compactStats}>
                            <View style={styles.compactStat}>
                                <Text style={[styles.compactStatNumber, { color: themeColors.text }]}>
                                    {stats.totalFlashcards}
                                </Text>
                                <Text style={[styles.compactStatLabel, { color: themeColors.text }]}>
                                    Total Cards
                                </Text>
                            </View>
                            <View style={styles.compactStat}>
                                <Text style={[styles.compactStatNumber, { color: themeColors.warning }]}>
                                    {stats.dueToday}
                                </Text>
                                <Text style={[styles.compactStatLabel, { color: themeColors.text }]}>
                                    Due Today
                                </Text>
                            </View>
                            {stats.strugglingCards > 0 && (
                                <View style={styles.compactStat}>
                                    <Text style={[styles.compactStatNumber, { color: themeColors.error }]}>
                                        {stats.strugglingCards}
                                    </Text>
                                    <Text style={[styles.compactStatLabel, { color: themeColors.text }]}>
                                        Struggling
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animatable.View>

                    {/* Primary Study Action */}
                    <Animatable.View animation="fadeInUp" delay={400} style={styles.section}>
                        <TouchableOpacity 
                            style={[styles.primaryStudyButton, { backgroundColor: themeColors.study }]}
                            onPress={() => startStudySession('due')}
                        >
                            <View style={styles.primaryButtonContent}>
                                <FontAwesome5 name="play-circle" size={32} color="#FFFFFF" />
                                <View style={styles.primaryButtonText}>
                                    <Text style={styles.primaryButtonTitle}>Study Due Cards</Text>
                                    <Text style={styles.primaryButtonSubtitle}>
                                        {stats.dueToday > 0 ? `${stats.dueToday} cards ready` : 'No cards due right now'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animatable.View>

                    {/* Secondary Actions */}
                    <Animatable.View animation="fadeInUp" delay={600} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                            Other Options
                        </Text>
                        
                        <View style={styles.secondaryActions}>
                            {/* New Cards Mode */}
                            {stats.newCards > 0 && (
                                <TouchableOpacity
                                    style={[styles.secondaryButton, { backgroundColor: '#4A90E2' }]}
                                    onPress={() => startStudySession('new')}
                                >
                                    <FontAwesome5 name="star" size={16} color="#FFFFFF" />
                                    <Text style={[styles.secondaryButtonText, { color: '#FFFFFF' }]}>
                                        New Cards ({stats.newCards})
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.secondaryButton, { backgroundColor: themeColors.review }]}
                                onPress={() => startStudySession('all')}
                            >
                                <FontAwesome5 name="th" size={16} color="#FFFFFF" />
                                <Text style={[styles.secondaryButtonText, { color: '#FFFFFF' }]}>
                                    All Cards
                                </Text>
                            </TouchableOpacity>

                            {stats.strugglingCards > 0 && (
                                <TouchableOpacity
                                    style={[styles.secondaryButton, { backgroundColor: themeColors.struggling }]}
                                    onPress={() => startStudySession('struggling')}
                                >
                                    <FontAwesome5 name="exclamation-triangle" size={16} color="#FFFFFF" />
                                    <Text style={[styles.secondaryButtonText, { color: '#FFFFFF' }]}>
                                        Struggling ({stats.strugglingCards})
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.secondaryButton, { backgroundColor: themeColors.autoGenerate }]}
                                onPress={generateFlashcardsFromMistakes}
                            >
                                <FontAwesome5 name="magic" size={16} color="#FFFFFF" />
                                <Text style={[styles.secondaryButtonText, { color: '#FFFFFF' }]}>
                                    Auto-Generate
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Test Button (Development) */}
                        <TouchableOpacity 
                            style={[styles.testButton, { backgroundColor: `${themeColors.study}20`, borderColor: themeColors.study }]}
                            onPress={testFlashcardSystem}
                        >
                            <FontAwesome5 name="vial" size={16} color={themeColors.study} />
                            <Text style={[styles.testButtonText, { color: themeColors.study }]}>
                                Test Flashcard System
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.hiddenDiv} />
                    </Animatable.View>

                    {/* Progress Overview */}
                    <Animatable.View animation="fadeInUp" delay={600} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                            Progress Overview
                        </Text>
                        
                        <View style={[styles.progressCard, { backgroundColor: themeColors.cardBackground }]}>
                            <View style={styles.progressRow}>
                                <FontAwesome5 name="trophy" size={16} color={themeColors.success} />
                                <Text style={[styles.progressLabel, { color: themeColors.text }]}>Mastering</Text>
                                <Text style={[styles.progressValue, { color: themeColors.success }]}>{stats.masteringCards}</Text>
                            </View>
                            
                            <View style={styles.progressRow}>
                                <FontAwesome5 name="graduation-cap" size={16} color={themeColors.warning} />
                                <Text style={[styles.progressLabel, { color: themeColors.text }]}>Learning</Text>
                                <Text style={[styles.progressValue, { color: themeColors.warning }]}>
                                    {stats.totalFlashcards - stats.masteringCards - stats.strugglingCards}
                                </Text>
                            </View>
                            
                            <View style={styles.progressRow}>
                                <FontAwesome5 name="redo" size={16} color={themeColors.error} />
                                <Text style={[styles.progressLabel, { color: themeColors.text }]}>Need Practice</Text>
                                <Text style={[styles.progressValue, { color: themeColors.error }]}>{stats.strugglingCards}</Text>
                            </View>
                        </View>
                    </Animatable.View>

                    {/* Filters Section */}
                    {stats.totalFlashcards > 0 && (
                        <Animatable.View animation="fadeInUp" delay={700} style={styles.section}>
                            <View style={styles.filterHeader}>
                                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                                    Filters
                                </Text>
                                {(selectedSubject || selectedDifficulty) && (
                                    <TouchableOpacity onPress={clearFilters}>
                                        <Text style={[styles.clearFilters, { color: themeColors.accent }]}>
                                            Clear All
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Difficulty Filters */}
                            <View style={styles.filterRow}>
                                <Text style={[styles.filterLabel, { color: themeColors.text }]}>Difficulty:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                                    {['easy', 'medium', 'hard'].map(difficulty => (
                                        <TouchableOpacity
                                            key={difficulty}
                                            style={[
                                                styles.filterChip,
                                                {
                                                    backgroundColor: selectedDifficulty === difficulty
                                                        ? themeColors.accent
                                                        : `${themeColors.cardBackground}`,
                                                    borderColor: themeColors.accent,
                                                    borderWidth: selectedDifficulty === difficulty ? 0 : 1
                                                }
                                            ]}
                                            onPress={() => setSelectedDifficulty(
                                                selectedDifficulty === difficulty ? null : difficulty
                                            )}
                                        >
                                            <Text style={[
                                                styles.filterChipText,
                                                {
                                                    color: selectedDifficulty === difficulty
                                                        ? '#FFFFFF'
                                                        : themeColors.text
                                                }
                                            ]}>
                                                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </Animatable.View>
                    )}

                    {/* Subject Breakdown */}
                    {stats.subjectBreakdown?.bySubject && Object.keys(stats.subjectBreakdown.bySubject).length > 0 && (
                        <Animatable.View animation="fadeInUp" delay={800} style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                                Subject Breakdown (Tap to Filter)
                            </Text>

                            <View style={[styles.subjectGrid, { backgroundColor: themeColors.cardBackground }]}>
                                {Object.entries(stats.subjectBreakdown.bySubject).map(([subject, count], index) => (
                                    <TouchableOpacity
                                        key={subject}
                                        style={[
                                            styles.subjectRow,
                                            selectedSubject === subject && {
                                                backgroundColor: `${themeColors.accent}20`
                                            }
                                        ]}
                                        onPress={() => setSelectedSubject(
                                            selectedSubject === subject ? null : subject
                                        )}
                                    >
                                        <View style={styles.subjectInfo}>
                                            <FontAwesome5
                                                name={selectedSubject === subject ? "check-circle" : "book"}
                                                size={14}
                                                color={themeColors.accent}
                                            />
                                            <Text style={[
                                                styles.subjectName,
                                                {
                                                    color: themeColors.text,
                                                    fontWeight: selectedSubject === subject ? '700' : '500'
                                                }
                                            ]}>
                                                {typeof subject === 'string' ? subject : String(subject)}
                                            </Text>
                                        </View>
                                        <Text style={[
                                            styles.subjectCount,
                                            { color: themeColors.accent }
                                        ]}>
                                            {typeof count === 'number' ? count : String(count)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animatable.View>
                    )}

                    {/* Study Tips */}
                    <Animatable.View animation="fadeInUp" delay={1000} style={styles.section}>
                        <View style={[styles.tipsCard, { backgroundColor: `${themeColors.accent}15` }]}>
                            <FontAwesome5 name="lightbulb" size={20} color={themeColors.accent} />
                            <View style={styles.tipsContent}>
                                <Text style={[styles.tipsTitle, { color: themeColors.accent }]}>
                                    💡 Study Tips
                                </Text>
                                <Text style={[styles.tipsText, { color: themeColors.text }]}>
                                    • Study a little bit every day to maintain your streak{'\n'}
                                    • Focus on cards you're struggling with{'\n'}
                                    • Flashcards are automatically generated from quiz mistakes{'\n'}
                                    • Use spaced repetition for better retention
                                </Text>
                            </View>
                        </View>
                    </Animatable.View>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </LinearGradient>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    closeButton: {
        padding: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    statsHeader: {
        marginBottom: 25,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginBottom: 15,
    },
    streakText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    compactStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 12,
    },
    compactStat: {
        alignItems: 'center',
    },
    compactStatNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    compactStatLabel: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.8,
    },
    primaryStudyButton: {
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryButtonText: {
        marginLeft: 15,
        flex: 1,
    },
    primaryButtonTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    primaryButtonSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        fontWeight: '500',
    },
    secondaryActions: {
        gap: 12,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
        flex: 1,
    },
    progressCard: {
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    progressLabel: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    progressValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    subjectGrid: {
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    subjectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    subjectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    subjectName: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    subjectCount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    tipsCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 15,
        alignItems: 'flex-start',
    },
    tipsContent: {
        flex: 1,
        marginLeft: 15,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    tipsText: {
        fontSize: 14,
        lineHeight: 20,
    },
    bottomPadding: {
        height: 50,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        marginTop: 15,
        borderRadius: 10,
        borderWidth: 1,
    },
    testButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    hiddenDiv: {
        height: 0,
    },
    // Filter styles
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    clearFilters: {
        fontSize: 14,
        fontWeight: '600',
    },
    filterRow: {
        marginBottom: 15,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    filterScroll: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default FlashcardDashboard;