import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { auth } from '../firebaseConfig';
import { StudentProfileService } from '../services/StudentProfileService';
import SafeBackButton from '../components/SafeBackButton';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';


const { width: screenWidth } = Dimensions.get('window');

// Education level labels and descriptions
const EDUCATION_LEVELS = {
    'high_school': { label: 'High School', description: 'Grades 9-12', icon: 'school' },
    'undergrad': { label: 'Undergraduate', description: 'Bachelor\'s Degree', icon: 'university' },
    'masters': { label: 'Master\'s', description: 'Graduate Program', icon: 'graduation-cap' },
    'phd': { label: 'PhD', description: 'Doctoral Program', icon: 'user-graduate' },
    'professional': { label: 'Professional', description: 'MCAT, Bar, CPA, etc.', icon: 'briefcase' },
};

const LEARNING_STYLES = {
    'multiple_choice': { label: 'Multiple Choice', icon: 'list-ul' },
    'essays': { label: 'Essays & Writing', icon: 'pen' },
    'flashcards': { label: 'Flashcards', icon: 'layer-group' },
    'case_studies': { label: 'Case Studies', icon: 'search' },
    'problem_solving': { label: 'Problem Solving', icon: 'calculator' },
    'visual': { label: 'Visual Learning', icon: 'chart-bar' },
};

const PAIN_POINTS = {
    'memorization': { label: 'Memorization & Retention', icon: 'brain' },
    'problem_solving': { label: 'Complex Problem Solving', icon: 'puzzle-piece' },
    'time_management': { label: 'Time Management', icon: 'clock' },
    'test_anxiety': { label: 'Test Anxiety', icon: 'heart' },
    'motivation': { label: 'Staying Motivated', icon: 'fire' },
    'focus': { label: 'Maintaining Focus', icon: 'bullseye' },
};

export default function ProfileViewScreen({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const containerAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        startAnimations();
    }, []);

    // Refresh profile data whenever screen comes into focus (e.g., returning from edit)
    useFocusEffect(
        React.useCallback(() => {
            loadProfile();
        }, [])
    );

    const startAnimations = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(containerAnim, {
                toValue: 1,
                tension: 80,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const loadProfile = async () => {
        logger.info('👁️ ProfileViewScreen: Starting to load profile...');
        
        try {
            const user = auth.currentUser;
            if (user) {
                logger.info('👁️ ProfileViewScreen: User authenticated:', user.uid);
                
                // Check if profile exists first
                logger.info('👁️ ProfileViewScreen: Checking profile status...');
                const profileStatus = await StudentProfileService.checkProfileStatus(user.uid);
                logger.info('👁️ ProfileViewScreen: Profile status result:', profileStatus);
                
                if (profileStatus.exists) {
                    logger.info('👁️ ProfileViewScreen: Profile exists, loading full profile...');
                    // Profile exists, load it
                    const studentProfile = await StudentProfileService.getProfile(user.uid);
                    logger.info('👁️ ProfileViewScreen: Loaded profile:', studentProfile ? 'SUCCESS' : 'NULL');
                    
                    if (studentProfile) {
                        setProfile(studentProfile);
                        logger.info('👁️ ProfileViewScreen: Profile set in state');
                        logger.info('🔍 ProfileViewScreen: Year data loaded:', {
                            year: studentProfile.year,
                            educationLevel: studentProfile.educationLevel,
                            semester: studentProfile.semester
                        });
                        
                        // Load personalized recommendations
                        try {
                            const recs = await StudentProfileService.getStudyRecommendations(user.uid, studentProfile);
                            setRecommendations(recs);
                            logger.info('👁️ ProfileViewScreen: Recommendations loaded');
                        } catch (recError) {
                            logger.warn('👁️ ProfileViewScreen: Failed to load recommendations:', recError);
                        }
                    } else {
                        logger.error('👁️ ProfileViewScreen: Profile was null despite status check showing exists');
                    }
                } else {
                    logger.info('👁️ ProfileViewScreen: Profile does not exist, showing alert');
                    // Profile doesn't exist - redirect to profile creation
                    Alert.alert(
                        'Profile Not Found', 
                        'You need to create your student profile first. Would you like to set it up now?',
                        [
                            { text: 'Later', style: 'cancel', onPress: () => NavigationHelper.safeGoBack(navigation) },
                            { text: 'Set Up Profile', onPress: () => navigation.navigate('Profile') }
                        ]
                    );
                }
            } else {
                logger.info('👁️ ProfileViewScreen: No authenticated user found');
            }
        } catch (error) {
            logger.error('👁️ ProfileViewScreen: Error loading profile:', error);
            Alert.alert('Error', 'Failed to load profile information.');
        } finally {
            logger.info('👁️ ProfileViewScreen: Setting loading to false');
            setLoading(false);
        }
    };

    const getProfileCompletion = () => {
        if (!profile) return 0;
        return StudentProfileService.getProfileCompletionPercentage(profile);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderHeader = () => (
        <Animatable.View animation="fadeInDown" delay={200} style={styles.header}>
            <SafeBackButton 
                style={styles.backButton}
                color="#F8F4E3"
                size={20}
                onPress={() => {
                    Animated.timing(containerAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        NavigationHelper.safeGoBack(navigation);
                    });
                }}
            />
            <Text style={styles.headerTitle}>Your Profile</Text>
            <TouchableOpacity
                onPress={() => navigation.navigate('ProfileEditSelection')} 
                style={styles.editButton}
            >
                <FontAwesome5 name="edit" size={18} color="#D4AF37" />
            </TouchableOpacity>
        </Animatable.View>
    );

    const renderProfileCompletion = () => {
        const completion = getProfileCompletion();
        return (
            <Animatable.View animation="slideInUp" delay={400} style={styles.completionCard}>
                <View style={styles.completionHeader}>
                    <FontAwesome5 name="chart-pie" size={20} color="#D4AF37" />
                    <Text style={styles.completionTitle}>Profile Completion</Text>
                </View>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${completion}%` }]} />
                    </View>
                    <Text style={styles.completionText}>{completion}%</Text>
                </View>
            </Animatable.View>
        );
    };

    const renderBasicInfo = () => (
        <Animatable.View animation="slideInUp" delay={600} style={styles.section}>
            <View style={styles.sectionHeader}>
                <FontAwesome5 name="user" size={20} color="#D4AF37" />
                <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Full Name</Text>
                    <Text style={styles.infoValue}>
                        {profile?.firstName && profile?.lastName 
                            ? `${profile.firstName} ${profile.lastName}` 
                            : (profile?.fullName || profile?.name || 'Not provided')
                        }
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Education Level</Text>
                    <View style={styles.educationInfo}>
                        {(profile?.educationLevel || profile?.education_level) && (
                            <FontAwesome5 
                                name={EDUCATION_LEVELS[profile.educationLevel || profile.education_level]?.icon || 'school'} 
                                size={16} 
                                color="#D4AF37" 
                                style={styles.educationIcon}
                            />
                        )}
                        <Text style={styles.infoValue}>
                            {EDUCATION_LEVELS[profile?.educationLevel || profile?.education_level]?.label || 'Not specified'}
                        </Text>
                    </View>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Program</Text>
                    <Text style={styles.infoValue}>{profile?.program || 'Not provided'}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Year/Level</Text>
                    <Text style={styles.infoValue}>{profile?.year || 'Not provided'}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Current Semester</Text>
                    <Text style={styles.infoValue}>{profile?.semester || 'Not provided'}</Text>
                </View>
            </View>
        </Animatable.View>
    );

    const renderCourses = () => (
        <Animatable.View animation="slideInUp" delay={800} style={styles.section}>
            <View style={styles.sectionHeader}>
                <FontAwesome5 name="book" size={20} color="#D4AF37" />
                <Text style={styles.sectionTitle}>Current Courses</Text>
            </View>
            {profile?.courses?.length > 0 ? (
                <View style={styles.coursesContainer}>
                    {profile.courses.map((course, index) => (
                        <View key={course.id || index} style={styles.courseChip}>
                            <FontAwesome5 
                                name={course.validated ? "check-circle" : "book-open"} 
                                size={14} 
                                color={course.validated ? "#4CAF50" : "#D4AF37"} 
                            />
                            <Text style={styles.courseText}>{course.code || course.name}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.emptyText}>No courses added yet</Text>
            )}
        </Animatable.View>
    );

    const renderStudyGoals = () => (
        <Animatable.View animation="slideInUp" delay={1000} style={styles.section}>
            <View style={styles.sectionHeader}>
                <FontAwesome5 name="bullseye" size={20} color="#D4AF37" />
                <Text style={styles.sectionTitle}>Study Goals</Text>
            </View>
            <Text style={styles.goalsText}>{
                profile?.studyGoals || 
                profile?.originalStudyGoals || 
                profile?.original_study_goals || 
                (Array.isArray(profile?.study_goals) ? profile.study_goals.join(', ') : profile?.study_goals) || 
                'No goals specified'
            }</Text>
        </Animatable.View>
    );

    const renderPreferences = () => (
        <Animatable.View animation="slideInUp" delay={1200} style={styles.section}>
            <View style={styles.sectionHeader}>
                <FontAwesome5 name="heart" size={20} color="#D4AF37" />
                <Text style={styles.sectionTitle}>Learning Preferences</Text>
            </View>
            
            {/* Learning Styles */}
            <View style={styles.preferencesSubsection}>
                <Text style={styles.subsectionTitle}>Learning Styles</Text>
                {(profile?.learningStyles || profile?.learning_styles)?.length > 0 ? (
                    <View style={styles.chipsContainer}>
                        {(profile.learningStyles || profile.learning_styles).map((style, index) => (
                            <View key={index} style={styles.preferenceChip}>
                                <FontAwesome5 
                                    name={LEARNING_STYLES[style]?.icon || 'star'} 
                                    size={12} 
                                    color="#FFFFFF" 
                                />
                                <Text style={styles.chipText}>{LEARNING_STYLES[style]?.label || style}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No learning styles selected</Text>
                )}
            </View>

            {/* Pain Points */}
            <View style={styles.preferencesSubsection}>
                <Text style={styles.subsectionTitle}>Areas for Improvement</Text>
                {(profile?.painPoints || profile?.pain_points)?.length > 0 ? (
                    <View style={styles.chipsContainer}>
                        {(profile.painPoints || profile.pain_points).map((point, index) => (
                            <View key={index} style={[styles.preferenceChip, styles.painPointChip]}>
                                <FontAwesome5 
                                    name={PAIN_POINTS[point]?.icon || 'exclamation'} 
                                    size={12} 
                                    color="#FFFFFF" 
                                />
                                <Text style={styles.chipText}>{PAIN_POINTS[point]?.label || point}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No areas specified</Text>
                )}
            </View>
        </Animatable.View>
    );

    const renderRecommendations = () => (
        <Animatable.View animation="slideInUp" delay={1400} style={styles.section}>
            <View style={styles.sectionHeader}>
                <FontAwesome5 name="lightbulb" size={20} color="#D4AF37" />
                <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
            </View>
            {recommendations.length > 0 ? (
                <View style={styles.recommendationsContainer}>
                    {recommendations.slice(0, 3).map((rec, index) => (
                        <View key={index} style={styles.recommendationCard}>
                            <FontAwesome5 name={rec.icon || 'star'} size={16} color="#D4AF37" />
                            <View style={styles.recommendationContent}>
                                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                                <Text style={styles.recommendationDescription}>{rec.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.emptyText}>Complete your profile to get personalized recommendations</Text>
            )}
        </Animatable.View>
    );

    const renderProfileMetadata = () => (
        <Animatable.View animation="slideInUp" delay={1600} style={styles.section}>
            <View style={styles.sectionHeader}>
                <FontAwesome5 name="info-circle" size={20} color="#D4AF37" />
                <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>
            <View style={styles.metadataGrid}>
                <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Created</Text>
                    <Text style={styles.metadataValue}>{formatDate(profile?.createdAt)}</Text>
                </View>
                <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Last Updated</Text>
                    <Text style={styles.metadataValue}>{formatDate(profile?.updatedAt)}</Text>
                </View>
                <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Sync Status</Text>
                    <View style={styles.syncStatus}>
                        <FontAwesome5 
                            name={profile?.synced ? "check-circle" : "sync-alt"} 
                            size={12} 
                            color={profile?.synced ? "#4CAF50" : "#FFA500"} 
                        />
                        <Text style={styles.metadataValue}>
                            {profile?.synced ? 'Synced' : 'Pending'}
                        </Text>
                    </View>
                </View>
            </View>
        </Animatable.View>
    );

    if (loading) {
        return (
            <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.container}>
                <Animated.View style={{
                    flex: 1,
                    opacity: containerAnim,
                    transform: [{ scale: containerAnim }]
                }}>
                    <View style={styles.loadingContainer}>
                        <FontAwesome5 name="spinner" size={40} color="#D4AF37" />
                        <Text style={styles.loadingText}>Loading your profile...</Text>
                    </View>
                </Animated.View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.container}>
            <Animated.View style={[
                styles.content, 
                { 
                    opacity: fadeAnim,
                    transform: [{ scale: containerAnim }]
                }
            ]}>
                {renderHeader()}
                
                <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderProfileCompletion()}
                    {renderBasicInfo()}
                    {renderCourses()}
                    {renderStudyGoals()}
                    {renderPreferences()}
                    {renderRecommendations()}
                    {renderProfileMetadata()}
                </ScrollView>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#F8F4E3',
        fontSize: 16,
        fontWeight: '500',
    },
    
    // Header styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: { padding: 8 },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F8F4E3',
    },
    editButton: { 
        padding: 8,
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 8,
    },
    
    // Scroll container
    scrollContainer: { flex: 1 },
    scrollContent: { paddingBottom: 20 },
    
    // Section styles
    section: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F8F4E3',
    },
    
    // Profile completion styles
    completionCard: {
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    completionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    completionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F8F4E3',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(248, 244, 227, 0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#D4AF37',
        borderRadius: 3,
    },
    completionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#D4AF37',
        minWidth: 40,
        textAlign: 'right',
    },
    
    // Info grid styles
    infoGrid: { gap: 16 },
    infoItem: { gap: 4 },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#CBD5E0',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#F8F4E3',
    },
    educationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    educationIcon: { marginRight: 4 },
    
    // Courses styles
    coursesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    courseChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    courseText: {
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
    },
    
    // Goals styles
    goalsText: {
        fontSize: 16,
        color: '#F8F4E3',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    
    // Preferences styles
    preferencesSubsection: {
        marginBottom: 20,
    },
    subsectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#CBD5E0',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    preferenceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D4AF37',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    painPointChip: {
        backgroundColor: '#E74C3C',
    },
    chipText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    
    // Recommendations styles
    recommendationsContainer: { gap: 12 },
    recommendationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    recommendationContent: { flex: 1, gap: 4 },
    recommendationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F8F4E3',
    },
    recommendationDescription: {
        fontSize: 12,
        color: '#CBD5E0',
        lineHeight: 16,
    },
    
    // Metadata styles
    metadataGrid: { gap: 12 },
    metadataItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metadataLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#CBD5E0',
    },
    metadataValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#F8F4E3',
    },
    syncStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    
    // Empty state
    emptyText: {
        fontSize: 14,
        color: '#CBD5E0',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 16,
    },
});