import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Alert, 
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { UserService } from '../utils/UserService';
import { StudentProfileService } from '../services/StudentProfileService';
import { HybridDataService } from '../services/HybridDataService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from 'react-i18next';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';


// Education levels and preferences data
const EDUCATION_LEVELS = [
    { id: 'high_school', label: 'High School', icon: 'school', description: 'Grades 9-12' },
    { id: 'undergrad', label: 'Undergraduate', icon: 'university', description: 'Bachelor\'s Degree' },
    { id: 'masters', label: 'Master\'s', icon: 'graduation-cap', description: 'Graduate Program' },
    { id: 'phd', label: 'PhD', icon: 'user-graduate', description: 'Doctoral Program' },
    { id: 'professional', label: 'Professional', icon: 'briefcase', description: 'MCAT, Bar, CPA, etc.' },
];

// Academic year/level options based on education level
const ACADEMIC_YEARS = {
    high_school: [
        { id: 'freshman', label: 'Freshman (9th Grade)' },
        { id: 'sophomore', label: 'Sophomore (10th Grade)' },
        { id: 'junior', label: 'Junior (11th Grade)' },
        { id: 'senior', label: 'Senior (12th Grade)' },
    ],
    undergrad: [
        { id: 'first_year', label: '1st Year (Freshman)' },
        { id: 'second_year', label: '2nd Year (Sophomore)' },
        { id: 'third_year', label: '3rd Year (Junior)' },
        { id: 'fourth_year', label: '4th Year (Senior)' },
        { id: 'fifth_year_plus', label: '5th Year+' },
    ],
    masters: [
        { id: 'first_year', label: '1st Year' },
        { id: 'second_year', label: '2nd Year' },
        { id: 'third_year_plus', label: '3rd Year+' },
    ],
    phd: [
        { id: 'first_year', label: '1st Year' },
        { id: 'second_year', label: '2nd Year' },
        { id: 'third_year', label: '3rd Year' },
        { id: 'fourth_year', label: '4th Year' },
        { id: 'fifth_year_plus', label: '5th Year+' },
        { id: 'dissertation', label: 'Dissertation Phase' },
    ],
    professional: [
        { id: 'preparing', label: 'Preparing for Exam' },
        { id: 'first_attempt', label: '1st Attempt' },
        { id: 'second_attempt', label: '2nd Attempt' },
        { id: 'third_attempt_plus', label: '3rd Attempt+' },
    ],
};

// Semester options
const SEMESTER_SEASONS = [
    { id: 'fall', label: 'Fall' },
    { id: 'spring', label: 'Spring' },
    { id: 'summer', label: 'Summer' },
    { id: 'winter', label: 'Winter' },
];

// Generate years (current year ± 2)
const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        years.push({ id: i.toString(), label: i.toString() });
    }
    return years;
};

// Common degree programs by education level
const DEGREE_PROGRAMS = {
    high_school: [
        'General Education',
        'College Prep',
        'AP Program',
        'IB Program',
        'Vocational Track',
    ],
    undergrad: [
        'Biology',
        'Chemistry',
        'Computer Science',
        'Engineering',
        'Business Administration',
        'Psychology',
        'English Literature',
        'Mathematics',
        'Physics',
        'History',
        'Political Science',
        'Economics',
        'Pre-Med',
        'Pre-Law',
        'Communications',
        'Art',
        'Music',
    ],
    masters: [
        'MBA',
        'MS Computer Science',
        'MS Engineering',
        'MA Psychology',
        'MA Education',
        'MS Data Science',
        'MS Biology',
        'MS Chemistry',
        'MA History',
        'MA English',
        'MS Physics',
        'MS Mathematics',
        'Public Administration',
        'Social Work',
    ],
    phd: [
        'PhD Computer Science',
        'PhD Biology',
        'PhD Chemistry',
        'PhD Physics',
        'PhD Mathematics',
        'PhD Psychology',
        'PhD History',
        'PhD English',
        'PhD Engineering',
        'PhD Economics',
        'PhD Political Science',
        'PhD Education',
    ],
    professional: [
        'MCAT Prep',
        'LSAT Prep',
        'GRE Prep',
        'GMAT Prep',
        'CPA Exam',
        'Bar Exam',
        'NCLEX',
        'USMLE',
        'FE Exam',
        'PE Exam',
        'CFA',
        'PMP',
    ],
};

const LEARNING_STYLES = [
    { id: 'multiple_choice', label: 'Multiple Choice', icon: 'list-ul' },
    { id: 'essays', label: 'Essays & Writing', icon: 'pen' },
    { id: 'flashcards', label: 'Flashcards', icon: 'layer-group' },
    { id: 'case_studies', label: 'Case Studies', icon: 'search' },
    { id: 'problem_solving', label: 'Problem Solving', icon: 'calculator' },
    { id: 'visual', label: 'Visual Learning', icon: 'chart-bar' },
];

const PAIN_POINTS = [
    { id: 'memorization', label: 'Memorization & Retention', icon: 'brain' },
    { id: 'problem_solving', label: 'Complex Problem Solving', icon: 'puzzle-piece' },
    { id: 'time_management', label: 'Time Management', icon: 'clock' },
    { id: 'test_anxiety', label: 'Test Anxiety', icon: 'heart' },
    { id: 'motivation', label: 'Staying Motivated', icon: 'fire' },
    { id: 'focus', label: 'Maintaining Focus', icon: 'bullseye' },
];

export default function ProfileScreen({ navigation, route }) {
    const { t } = useTranslation();
    // Basic states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(false); // Track if we're editing existing profile
    
    // Enhanced profile states
    const [currentStep, setCurrentStep] = useState(1);
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        educationLevel: '',
        year: '',
        semester: '',
        semesterSeason: '',
        semesterYear: '',
        program: '',
        courses: [],
        studyGoals: '',
        learningStyles: [],
        painPoints: [],
        notes: '',
    });

    // Dropdown states
    const [availableYears, setAvailableYears] = useState([]);
    const [availablePrograms, setAvailablePrograms] = useState([]);
    const [programSuggestions, setProgramSuggestions] = useState([]);
    const [showProgramSuggestions, setShowProgramSuggestions] = useState(false);
    
    // Course input states
    const [courseInput, setCourseInput] = useState('');
    const [courseSuggestions, setCourseSuggestions] = useState([]);
    const [courseValidation, setCourseValidation] = useState(null);
    const [validatingCourse, setValidatingCourse] = useState(false);
    
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkUserStatus();
        loadUserProfile();
        startAnimations();
    }, []);

    // Update available options when education level changes
    useEffect(() => {
        if (profile.educationLevel) {
            setAvailableYears(ACADEMIC_YEARS[profile.educationLevel] || []);
            setAvailablePrograms(DEGREE_PROGRAMS[profile.educationLevel] || []);
        }
    }, [profile.educationLevel]);

    const startAnimations = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    };

    // ✅ NEW: Check if this is a new user setting up their profile
    const checkUserStatus = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const profileCompleted = await AsyncStorage.getItem(`profileCompleted_${user.uid}`);
                setIsNewUser(profileCompleted !== 'true');
            }
        } catch (error) {
            logger.error('Error checking user status:', error);
            setIsNewUser(true); // Default to new user if error
        }
    };

    const loadUserProfile = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                setEmail(user.email || '');
                
                // Check if we're in edit mode with existing profile data
                if (route?.params?.editMode && route?.params?.existingProfile) {
                    logger.info('📝 ProfileScreen: Loading in edit mode with existing profile');
                    const existingProfile = route.params.existingProfile;
                    
                    // Handle both old fullName and new firstName/lastName formats
                    if (existingProfile.firstName && existingProfile.lastName) {
                        // New format
                        setFirstName(existingProfile.firstName);
                        setLastName(existingProfile.lastName);
                        setProfile({ ...existingProfile, firstName: existingProfile.firstName, lastName: existingProfile.lastName });
                    } else if (existingProfile.fullName) {
                        // Legacy format - split fullName into first and last
                        const nameParts = existingProfile.fullName.trim().split(' ');
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        setFirstName(firstName);
                        setLastName(lastName);
                        setProfile({ ...existingProfile, firstName, lastName });
                    }
                    return; // Skip the rest of loading since we have the profile
                }
                
                // Load basic profile
                const basicProfile = await UserService.getUserProfile(user.uid);
                if (basicProfile) {
                    // Handle both old fullName and new firstName/lastName formats
                    if (basicProfile.firstName && basicProfile.lastName) {
                        setFirstName(basicProfile.firstName);
                        setLastName(basicProfile.lastName);
                        setProfile(prev => ({ ...prev, firstName: basicProfile.firstName, lastName: basicProfile.lastName }));
                    } else if (basicProfile.fullName) {
                        const nameParts = basicProfile.fullName.trim().split(' ');
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        setFirstName(firstName);
                        setLastName(lastName);
                        setProfile(prev => ({ ...prev, firstName, lastName }));
                    }
                }
                
                // Check if enhanced profile exists
                const profileStatus = await StudentProfileService.checkProfileStatus(user.uid);
                const profileCompleted = await AsyncStorage.getItem(`profileCompleted_${user.uid}`);
                
                if (profileCompleted === 'true' || profileStatus.exists) {
                    const studentProfile = await StudentProfileService.getProfile(user.uid);
                    if (studentProfile) {
                        setProfile(studentProfile);
                        // Handle both old and new name formats
                        if (studentProfile.firstName && studentProfile.lastName) {
                            setFirstName(studentProfile.firstName);
                            setLastName(studentProfile.lastName);
                        } else if (studentProfile.fullName) {
                            const nameParts = studentProfile.fullName.trim().split(' ');
                            const firstName = nameParts[0] || '';
                            const lastName = nameParts.slice(1).join(' ') || '';
                            setFirstName(firstName);
                            setLastName(lastName);
                        }
                        setIsNewUser(false); // User has a complete profile
                    }
                } else {
                    // New user - profile doesn't exist
                    setIsNewUser(true);
                }
            }
        } catch (error) {
            logger.error('Error loading profile:', error);
        }
    };

    // Enhanced profile saving with multi-step support
    const handleNext = () => {
        if (validateStep()) {
            if (isEditingMode) {
                // When editing, save changes and return to profile view
                handleCompleteProfile();
            } else if (currentStep < 5) {
                setCurrentStep(currentStep + 1);
            } else {
                handleCompleteProfile();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                if (!profile.firstName.trim() || !profile.lastName.trim()) {
                    Alert.alert(t('profile.validation.required'), 'Please enter both your first and last name.');
                    return false;
                }
                break;
            case 2:
                if (!profile.educationLevel) {
                    Alert.alert(t('profile.validation.required'), t('profile.validation.educationRequired'));
                    return false;
                }
                break;
            case 3:
                if (!profile.year || !profile.semesterSeason || !profile.semesterYear || !profile.program.trim()) {
                    Alert.alert(t('profile.validation.required'), 'Please complete all academic details: Year/Level, Current Semester, and Degree/Program.');
                    return false;
                }
                break;
            case 4:
                if (profile.courses.length === 0) {
                    Alert.alert(t('profile.validation.required'), t('profile.validation.coursesRequired'));
                    return false;
                }
                break;
            case 5:
                if (!profile.studyGoals.trim()) {
                    Alert.alert(t('profile.validation.required'), t('profile.validation.goalsRequired'));
                    return false;
                }
                break;
        }
        return true;
    };

    const handleCompleteProfile = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                // Save to both services with new name structure
                const fullName = `${profile.firstName.trim()} ${profile.lastName.trim()}`;
                await UserService.saveUserProfile(user.uid, {
                    firstName: profile.firstName.trim(),
                    lastName: profile.lastName.trim(),
                    fullName: fullName, // Keep fullName for backward compatibility
                    email: user.email,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                // Convert structured data for backend compatibility
                const backendProfile = {
                    ...profile,
                    // Convert structured year back to display format for backend
                    year: profile.year ? (availableYears.find(y => y.id === profile.year)?.label || profile.year) : '',
                    // Semester is already combined by updateSemester function
                };
                
                // Remove frontend-only fields that backend doesn't expect
                delete backendProfile.semesterSeason;
                delete backendProfile.semesterYear;
                
                // Remove any undefined/null values to prevent backend validation issues
                Object.keys(backendProfile).forEach(key => {
                    if (backendProfile[key] === undefined || backendProfile[key] === null) {
                        delete backendProfile[key];
                    }
                });

                // Properly format profile data for the service layer
                const serviceProfile = {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    fullName: `${profile.firstName.trim()} ${profile.lastName.trim()}`,
                    educationLevel: profile.educationLevel,
                    year: profile.year ? (availableYears.find(y => y.id === profile.year)?.label || profile.year) : '',
                    semester: profile.semester,
                    program: profile.program,
                    learningStyles: profile.learningStyles,
                    painPoints: profile.painPoints,
                    studyGoals: profile.studyGoals,
                    courses: profile.courses,
                    notes: profile.notes
                };

                logger.info('📤 Saving profile data:', JSON.stringify(serviceProfile, null, 2));
                
                try {
                    await StudentProfileService.saveProfile(user.uid, serviceProfile);
                    logger.info('✅ Profile service save completed');
                } catch (profileSaveError) {
                    logger.error('❌ Profile save failed:', profileSaveError);
                    // Still mark as completed since we want the user to proceed
                    Alert.alert('Profile Saved Locally', 'Your profile has been saved locally. It will sync when connection is restored.');
                }
                
                try {
                    await AsyncStorage.setItem(`profileCompleted_${user.uid}`, 'true');
                    logger.info('✅ Profile completion flag set');
                } catch (flagError) {
                    logger.error('❌ Failed to set profile completion flag:', flagError);
                }

                // Check if we're in edit mode or creating new profile
                if (route?.params?.editMode) {
                    // In edit mode - just go back to ProfileViewScreen
                    Alert.alert(
                        '✅ Profile Updated!',
                        'Your profile has been successfully updated.',
                        [
                            {
                                text: 'View Profile',
                                onPress: () => NavigationHelper.safeGoBack(navigation)
                            }
                        ]
                    );
                } else {
                    // New profile creation - welcome message and go to Home
                    Alert.alert(
                        '🎉 Welcome to Alexandria!',
                        `Hi ${profile.firstName}! Your personalized study profile is complete. Alexandria is now ready to create learning experiences tailored just for you!`,
                        [
                            {
                                text: 'Start Learning',
                                onPress: () => {
                                    navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'Home' }]
                                    });
                                }
                            }
                        ]
                    );
                }
            }
        } catch (error) {
            logger.error('Error saving profile:', error);
            Alert.alert(t('profile.validation.error'), t('profile.validation.failedToSave'));
        } finally {
            setLoading(false);
        }
    };

    // Enhanced profile save for existing users - saves all profile fields
    const handleEnhancedSaveProfile = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert(t('profile.validation.error'), 'Please enter both your first and last name.');
            return;
        }

        logger.info('💾 Starting profile save process...');
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                const fullName = `${firstName.trim()} ${lastName.trim()}`;
                // ✅ Save complete profile using hybrid approach
                const profileData = {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    fullName: fullName,
                    email: user.email,
                    educationLevel: profile.educationLevel || '',
                    year: profile.year || '',
                    program: profile.program || '',
                    semester: profile.semester || '',
                    courses: profile.courses || [],
                    learningStyles: profile.learningStyles || [],
                    painPoints: profile.painPoints || [],
                    studyGoals: profile.studyGoals || '',
                    notes: profile.notes || '',
                    createdAt: profile.createdAt || new Date(),
                    updatedAt: new Date(),
                };

                logger.info('💾 Profile data to save:', JSON.stringify(profileData, null, 2));
                
                const success = await HybridDataService.saveUserProfile(user.uid, profileData);
                
                logger.info('💾 Profile save result:', success);

                if (success) {
                    Alert.alert(t('profile.validation.success'), 'Profile updated successfully!');
                    NavigationHelper.safeGoBack(navigation);
                } else {
                    Alert.alert(t('profile.validation.error'), 'Failed to save profile. Please try again.');
                }
            } else {
                logger.error('❌ No authenticated user found');
                Alert.alert(t('profile.validation.error'), 'Please log in again to save your profile.');
            }
        } catch (error) {
            logger.error('❌ Error saving profile:', error);
            logger.error('❌ Error details:', error.message, error.stack);
            Alert.alert(
                t('profile.validation.error'), 
                `Failed to save profile: ${error.message || 'Unknown error'}`
            );
        } finally {
            setLoading(false);
        }
    };

    // Simple save for existing users (legacy support - kept for compatibility)
    const handleSaveProfile = async () => {
        return await handleEnhancedSaveProfile();
    };

    // Course validation and suggestions
    const handleCourseInputChange = async (text) => {
        setCourseInput(text);
        setCourseValidation(null);
        
        if (text.length > 2) {
            try {
                const suggestions = await StudentProfileService.getCourseSuggestions(text);
                setCourseSuggestions(suggestions);
            } catch (error) {
                logger.warn('Failed to get course suggestions:', error);
                setCourseSuggestions([]);
            }
        } else {
            setCourseSuggestions([]);
        }
    };

    const validateAndAddCourse = async (courseName = courseInput) => {
        if (!courseName.trim()) return;
        
        setValidatingCourse(true);
        try {
            const validation = await StudentProfileService.validateCourse(courseName.trim());
            setCourseValidation(validation);
            
            if (validation.valid) {
                const newCourse = {
                    id: Date.now().toString(),
                    code: courseName.toUpperCase().trim(),
                    name: courseName.trim(),
                    validated: true
                };
                setProfile(prev => ({
                    ...prev,
                    courses: [...prev.courses, newCourse]
                }));
                setCourseInput('');
                setCourseSuggestions([]);
                setCourseValidation(null);
            }
        } catch (error) {
            logger.warn('Course validation failed:', error);
            // Add anyway if validation service is down
            const newCourse = {
                id: Date.now().toString(),
                code: courseName.toUpperCase().trim(),
                name: courseName.trim(),
                validated: false
            };
            setProfile(prev => ({
                ...prev,
                courses: [...prev.courses, newCourse]
            }));
            setCourseInput('');
        } finally {
            setValidatingCourse(false);
        }
    };

    // Course management functions
    const addCourse = () => validateAndAddCourse();
    
    const selectSuggestion = (suggestion) => {
        // Handle both string suggestions and course objects
        const courseName = typeof suggestion === 'string' ? suggestion : 
                          suggestion.name || suggestion.course_name || suggestion.code || '';
        setCourseInput(courseName);
        setCourseSuggestions([]);
        validateAndAddCourse(courseName);
    };

    const removeCourse = (courseId) => {
        setProfile(prev => ({
            ...prev,
            courses: prev.courses.filter(course => course.id !== courseId)
        }));
    };

    const toggleSelection = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    // Handle program input with suggestions
    const handleProgramChange = (text) => {
        setProfile(prev => ({ ...prev, program: text }));
        
        if (text.length > 0 && availablePrograms.length > 0) {
            const filtered = availablePrograms.filter(program =>
                program.toLowerCase().includes(text.toLowerCase())
            );
            setProgramSuggestions(filtered);
            setShowProgramSuggestions(filtered.length > 0 && text !== '');
        } else {
            setShowProgramSuggestions(false);
        }
    };

    // Select program from suggestions
    const selectProgram = (program) => {
        setProfile(prev => ({ ...prev, program }));
        setShowProgramSuggestions(false);
    };

    // Update semester when season or year changes
    const updateSemester = (field, value) => {
        setProfile(prev => {
            const updated = { ...prev, [field]: value };
            // Combine season and year into semester field
            if (updated.semesterSeason && updated.semesterYear) {
                updated.semester = `${updated.semesterSeason} ${updated.semesterYear}`;
            }
            return updated;
        });
    };

    // ✅ Enhanced: Handle back button for editing vs new user flows
    const handleBackPress = () => {
        if (isEditingMode) {
            // In editing mode, always return to the section selection menu
            setIsEditingMode(false);
            setIsNewUser(false);
            setCurrentStep(1);
        } else if (isNewUser && currentStep > 1) {
            // New users can navigate between steps
            setCurrentStep(currentStep - 1);
        } else if (isNewUser) {
            // New users trying to exit profile setup
            Alert.alert(
                'Profile Setup Required',
                'You need to complete your profile setup to continue. Are you sure you want to go back?',
                [
                    { text: 'Continue Setup', style: 'cancel' },
                    { 
                        text: 'Go Back', 
                        style: 'destructive',
                        onPress: () => NavigationHelper.safeGoBack(navigation)
                    }
                ]
            );
        } else {
            // Existing users viewing profile - go back to previous screen
            NavigationHelper.safeGoBack(navigation);
        }
    };

    // Profile Section Selection for existing users
    if (!isNewUser) {
        const profileSections = [
            {
                id: 'personal',
                title: 'Personal Information',
                description: 'Name and contact details',
                icon: 'user',
                step: 1
            },
            {
                id: 'education',
                title: 'Education Level',
                description: 'School level and academic year',
                icon: 'graduation-cap',
                step: 2
            },
            {
                id: 'program',
                title: 'Program & Major',
                description: 'Field of study and specialization',
                icon: 'book',
                step: 3
            },
            {
                id: 'courses',
                title: 'Courses',
                description: 'Current subjects and classes',
                icon: 'list',
                step: 4
            },
            {
                id: 'preferences',
                title: 'Learning Preferences',
                description: 'Study style and goals',
                icon: 'brain',
                step: 5
            }
        ];

        const handleSectionSelect = (section) => {
            // Switch to editing mode and jump to specific step
            setIsEditingMode(true); // We're now in editing mode
            setIsNewUser(true); // Use the existing flow UI
            setCurrentStep(section.step);
        };

        return (
            <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionSelectionTitle}>What would you like to edit?</Text>
                    <Text style={styles.sectionSelectionSubtitle}>Choose a section to update your profile</Text>

                    {profileSections.map((section) => (
                        <TouchableOpacity
                            key={section.id}
                            style={styles.sectionSelectionCard}
                            onPress={() => handleSectionSelect(section)}
                        >
                            <View style={styles.sectionIconContainer}>
                                <FontAwesome5 name={section.icon} size={24} color="#D4AF37" />
                            </View>
                            <View style={styles.sectionTextContainer}>
                                <Text style={styles.sectionSelectionCardTitle}>{section.title}</Text>
                                <Text style={styles.sectionSelectionCardDescription}>{section.description}</Text>
                            </View>
                            <FontAwesome5 name="chevron-right" size={16} color="#CBD5E0" />
                        </TouchableOpacity>
                    ))}

                    <View style={{ height: 30 }} />
                </ScrollView>
            </LinearGradient>
        );
    }

    // Enhanced multi-step onboarding for new users
    const renderStepProgress = () => (
        <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step {currentStep} of 5</Text>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(currentStep / 5) * 100}%` }]} />
            </View>
        </View>
    );

    const renderStep1 = () => (
        <Animatable.View animation="slideInRight" style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <FontAwesome5 name="user" size={32} color="#D4AF37" />
                <Text style={styles.stepTitle}>
                    {isEditingMode ? 'Edit Personal Information' : 'Let\'s Get Started'}
                </Text>
                <Text style={styles.stepSubtitle}>
                    {isEditingMode ? 'Update your name and contact details' : 'Tell us a bit about yourself'}
                </Text>
            </View>
            
            <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                    style={styles.input}
                    value={profile.firstName}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
                    placeholder="Enter your first name"
                    placeholderTextColor="#CBD5E0"
                    autoFocus
                    maxLength={25}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                    style={styles.input}
                    value={profile.lastName}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
                    placeholder="Enter your last name"
                    placeholderTextColor="#CBD5E0"
                    maxLength={25}
                />
            </View>
        </Animatable.View>
    );

    const renderStep2 = () => (
        <Animatable.View animation="slideInRight" style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <FontAwesome5 name="graduation-cap" size={32} color="#D4AF37" />
                <Text style={styles.stepTitle}>
                    {isEditingMode ? 'Edit Education Level' : 'Education Level'}
                </Text>
                <Text style={styles.stepSubtitle}>
                    {isEditingMode ? 'Update your education level' : 'What level are you currently studying at?'}
                </Text>
            </View>
            
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
                {EDUCATION_LEVELS.map((level) => (
                    <TouchableOpacity
                        key={level.id}
                        style={[
                            styles.optionCard,
                            profile.educationLevel === level.id && styles.optionCardSelected
                        ]}
                        onPress={() => setProfile(prev => ({ ...prev, educationLevel: level.id }))}
                    >
                        <FontAwesome5 
                            name={level.icon} 
                            size={24} 
                            color={profile.educationLevel === level.id ? "#D4AF37" : "#CBD5E0"} 
                        />
                        <Text style={[
                            styles.optionLabel,
                            profile.educationLevel === level.id && styles.optionLabelSelected
                        ]}>
                            {level.label}
                        </Text>
                        <Text style={styles.optionDescription}>{level.description}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </Animatable.View>
    );

    const renderStep3 = () => (
        <Animatable.View animation="slideInRight" style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <FontAwesome5 name="calendar-alt" size={32} color="#D4AF37" />
                <Text style={styles.stepTitle}>
                    {isEditingMode ? 'Edit Academic Details' : 'Academic Details'}
                </Text>
                <Text style={styles.stepSubtitle}>
                    {isEditingMode ? 'Update your academic information' : 'Help us understand your current academic status'}
                </Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Year/Level Dropdown */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Year/Level *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                        {availableYears.map((yearOption) => (
                            <TouchableOpacity
                                key={yearOption.id}
                                style={[
                                    styles.optionChip,
                                    profile.year === yearOption.id && styles.optionChipSelected
                                ]}
                                onPress={() => setProfile(prev => ({ ...prev, year: yearOption.id }))}
                            >
                                <Text style={[
                                    styles.optionChipText,
                                    profile.year === yearOption.id && styles.optionChipTextSelected
                                ]}>
                                    {yearOption.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Current Semester - Season + Year */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Current Semester *</Text>
                    
                    {/* Season Selection */}
                    <View style={styles.semesterRow}>
                        <View style={styles.semesterColumn}>
                            <Text style={styles.subLabel}>Season</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonContainer}>
                                {SEMESTER_SEASONS.map((season) => (
                                    <TouchableOpacity
                                        key={season.id}
                                        style={[
                                            styles.seasonChip,
                                            profile.semesterSeason === season.id && styles.seasonChipSelected
                                        ]}
                                        onPress={() => updateSemester('semesterSeason', season.id)}
                                    >
                                        <Text style={[
                                            styles.seasonChipText,
                                            profile.semesterSeason === season.id && styles.seasonChipTextSelected
                                        ]}>
                                            {season.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        
                        {/* Year Selection */}
                        <View style={styles.semesterColumn}>
                            <Text style={styles.subLabel}>Year</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearContainer}>
                                {generateYearOptions().map((year) => (
                                    <TouchableOpacity
                                        key={year.id}
                                        style={[
                                            styles.yearChip,
                                            profile.semesterYear === year.id && styles.yearChipSelected
                                        ]}
                                        onPress={() => updateSemester('semesterYear', year.id)}
                                    >
                                        <Text style={[
                                            styles.yearChipText,
                                            profile.semesterYear === year.id && styles.yearChipTextSelected
                                        ]}>
                                            {year.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                    
                    {/* Display combined semester */}
                    {profile.semester && (
                        <View style={styles.semesterPreview}>
                            <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                            <Text style={styles.semesterPreviewText}>{profile.semester}</Text>
                        </View>
                    )}
                </View>

                {/* Degree/Program with Suggestions */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Degree/Program *</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.program}
                        onChangeText={handleProgramChange}
                        placeholder="Type or select from suggestions below"
                        placeholderTextColor="#CBD5E0"
                        onFocus={() => {
                            if (availablePrograms.length > 0) {
                                setProgramSuggestions(availablePrograms);
                                setShowProgramSuggestions(true);
                            }
                        }}
                    />
                    
                    {/* Program Suggestions */}
                    {showProgramSuggestions && programSuggestions.length > 0 && (
                        <View style={styles.programSuggestionsContainer}>
                            <Text style={styles.suggestionsTitle}>Common Programs:</Text>
                            <View style={styles.programSuggestions}>
                                {programSuggestions.slice(0, 8).map((program, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.programSuggestionChip}
                                        onPress={() => selectProgram(program)}
                                    >
                                        <Text style={styles.programSuggestionText}>{program}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </Animatable.View>
    );

    const renderStep4 = () => (
        <Animatable.View animation="slideInRight" style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <FontAwesome5 name="book" size={32} color="#D4AF37" />
                <Text style={styles.stepTitle}>
                    {isEditingMode ? 'Edit Current Courses' : 'Current Courses'}
                </Text>
                <Text style={styles.stepSubtitle}>
                    {isEditingMode ? 'Update your current courses' : 'What courses are you taking this semester?'}
                </Text>
            </View>
            
            <View style={styles.courseInputContainer}>
                <TextInput
                    style={[
                        styles.courseInput,
                        courseValidation?.valid === false && styles.courseInputError,
                        courseValidation?.valid === true && styles.courseInputSuccess
                    ]}
                    value={courseInput}
                    onChangeText={handleCourseInputChange}
                    placeholder="e.g. MATH 301: Linear Algebra II"
                    placeholderTextColor="#CBD5E0"
                    onSubmitEditing={addCourse}
                />
                <TouchableOpacity 
                    style={[styles.addCourseButton, validatingCourse && styles.addCourseButtonDisabled]} 
                    onPress={addCourse}
                    disabled={validatingCourse}
                >
                    {validatingCourse ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Course validation feedback */}
            {courseValidation && !courseValidation.valid && (
                <View style={styles.validationContainer}>
                    <FontAwesome5 name="exclamation-triangle" size={14} color="#ff6b7a" />
                    <Text style={styles.validationText}>{courseValidation.message}</Text>
                </View>
            )}

            {/* Course suggestions */}
            {courseSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {courseSuggestions.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionChip}
                                onPress={() => selectSuggestion(suggestion)}
                            >
                                <Text style={styles.suggestionText}>
                                    {typeof suggestion === 'string' ? suggestion : 
                                     suggestion.name || suggestion.course_name || suggestion.code || 'Course'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <ScrollView style={styles.coursesContainer} showsVerticalScrollIndicator={false}>
                {profile.courses.map((course) => (
                    <View key={course.id} style={styles.courseChip}>
                        <FontAwesome5 
                            name={course.validated ? "check-circle" : "book-open"} 
                            size={14} 
                            color={course.validated ? "#4CAF50" : "#D4AF37"} 
                        />
                        <Text style={styles.courseChipText}>{course.code}</Text>
                        <TouchableOpacity onPress={() => removeCourse(course.id)}>
                            <FontAwesome5 name="times" size={12} color="#ff6b7a" />
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </Animatable.View>
    );

    const renderStep5 = () => (
        <Animatable.View animation="slideInRight" style={styles.stepContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.stepHeader}>
                    <FontAwesome5 name="bullseye" size={32} color="#D4AF37" />
                    <Text style={styles.stepTitle}>
                        {isEditingMode ? 'Edit Study Goals & Preferences' : 'Study Goals & Preferences'}
                    </Text>
                    <Text style={styles.stepSubtitle}>
                        {isEditingMode ? 'Update your study goals and preferences' : 'Help us personalize your learning experience'}
                    </Text>
                </View>
                
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Your Study Goals *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={profile.studyGoals}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, studyGoals: text }))}
                        placeholder="e.g. Pass finals with A's, Maintain GPA 3.7+, Prep for MCAT"
                        placeholderTextColor="#CBD5E0"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.preferencesSection}>
                    <Text style={styles.sectionTitle}>Learning Preferences (Optional)</Text>
                    <View style={styles.chipsContainer}>
                        {LEARNING_STYLES.map((style) => (
                            <TouchableOpacity
                                key={style.id}
                                style={[
                                    styles.chip,
                                    profile.learningStyles.includes(style.id) && styles.chipSelected
                                ]}
                                onPress={() => toggleSelection('learningStyles', style.id)}
                            >
                                <FontAwesome5 
                                    name={style.icon} 
                                    size={14} 
                                    color={profile.learningStyles.includes(style.id) ? "#FFFFFF" : "#CBD5E0"} 
                                />
                                <Text style={[
                                    styles.chipText,
                                    profile.learningStyles.includes(style.id) && styles.chipTextSelected
                                ]}>
                                    {style.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.preferencesSection}>
                    <Text style={styles.sectionTitle}>Areas You'd Like Help With (Optional)</Text>
                    <View style={styles.chipsContainer}>
                        {PAIN_POINTS.map((point) => (
                            <TouchableOpacity
                                key={point.id}
                                style={[
                                    styles.chip,
                                    profile.painPoints.includes(point.id) && styles.chipSelected
                                ]}
                                onPress={() => toggleSelection('painPoints', point.id)}
                            >
                                <FontAwesome5 
                                    name={point.icon} 
                                    size={14} 
                                    color={profile.painPoints.includes(point.id) ? "#FFFFFF" : "#CBD5E0"} 
                                />
                                <Text style={[
                                    styles.chipText,
                                    profile.painPoints.includes(point.id) && styles.chipTextSelected
                                ]}>
                                    {point.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </Animatable.View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            default: return renderStep1();
        }
    };

    return (
        <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                            <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Setup Your Profile</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {renderStepProgress()}
                    
                    <ScrollView 
                        style={styles.scrollContainer}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderCurrentStep()}
                    </ScrollView>

                    <View style={styles.navigationContainer}>
                        {currentStep > 1 && (
                            <TouchableOpacity style={styles.backNavButton} onPress={handleBack}>
                                <FontAwesome5 name="arrow-left" size={16} color="#CBD5E0" />
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                            style={styles.nextButton} 
                            onPress={handleNext}
                            disabled={loading}
                        >
                            <LinearGradient colors={["#D4AF37", "#B8941F"]} style={styles.nextButtonGradient}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#1A2C5B" />
                                ) : (
                                    <>
                                        <Text style={styles.nextButtonText}>
                                            {isEditingMode 
                                                ? 'Save Changes'
                                                : currentStep === 5 ? 'Complete Setup' : 'Continue'
                                            }
                                        </Text>
                                        <FontAwesome5 
                                            name={currentStep === 5 ? "check" : "arrow-right"} 
                                            size={16} 
                                            color="#1A2C5B" 
                                        />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardAvoidingView: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
        marginTop: 40,
        paddingHorizontal: 10,
    },
    backButton: { 
        padding: 15,
        margin: 5,
        borderRadius: 8,
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F8F4E3',
    },
    placeholder: { width: 36 },
    
    // Progress bar styles
    progressContainer: {
        marginBottom: 30,
    },
    progressText: {
        color: '#CBD5E0',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(248, 244, 227, 0.2)',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#D4AF37',
        borderRadius: 2,
    },
    
    // Scroll container styles
    scrollContainer: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    
    // Step styles
    stepContainer: { flex: 1, minHeight: 400 },
    stepHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#F8F4E3',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#CBD5E0',
        textAlign: 'center',
        lineHeight: 22,
    },
    
    // Input styles
    inputContainer: { marginBottom: 20 },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F8F4E3',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#F8F4E3',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    disabledInput: {
        opacity: 0.6,
        backgroundColor: 'rgba(248, 244, 227, 0.05)',
    },
    helpText: {
        fontSize: 12,
        color: '#CBD5E0',
        marginTop: 5,
    },
    
    // Options styles
    optionsContainer: { gap: 12 },
    optionCard: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    optionCardSelected: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderColor: '#D4AF37',
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F8F4E3',
        marginTop: 8,
        marginBottom: 4,
    },
    optionLabelSelected: {
        color: '#D4AF37',
    },
    optionDescription: {
        fontSize: 12,
        color: '#CBD5E0',
        textAlign: 'center',
    },
    
    // Course input styles
    courseInputContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    courseInput: {
        flex: 1,
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#F8F4E3',
    },
    addCourseButton: {
        backgroundColor: '#D4AF37',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addCourseButtonDisabled: {
        backgroundColor: '#666',
        opacity: 0.6,
    },
    courseInputError: {
        borderColor: '#ff6b7a',
        borderWidth: 2,
    },
    courseInputSuccess: {
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    coursesContainer: {
        maxHeight: 200,
    },
    courseChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
        gap: 8,
    },
    courseChipText: {
        flex: 1,
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
    },
    
    // Course validation styles
    validationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 122, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
        gap: 8,
    },
    validationText: {
        color: '#ff6b7a',
        fontSize: 12,
        flex: 1,
    },
    
    // Course suggestions styles
    suggestionsContainer: {
        marginBottom: 16,
    },
    suggestionsTitle: {
        color: '#CBD5E0',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    suggestionChip: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    suggestionText: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '500',
    },
    
    // Preferences styles
    preferencesSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F8F4E3',
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    chipSelected: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    chipText: {
        fontSize: 12,
        color: '#CBD5E0',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    
    // Navigation styles
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
    },
    backNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    backButtonText: {
        color: '#CBD5E0',
        fontSize: 16,
        fontWeight: '500',
    },
    nextButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 8,
    },
    nextButtonText: {
        color: '#1A2C5B',
        fontSize: 16,
        fontWeight: '700',
    },
    
    // New dropdown and selection styles
    optionsContainer: { marginTop: 8 },
    optionChip: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    optionChipSelected: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    optionChipText: {
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    optionChipTextSelected: {
        color: '#1A2C5B',
        fontWeight: '700',
    },
    
    // Semester row styles
    semesterRow: {
        marginTop: 8,
    },
    semesterColumn: {
        marginBottom: 16,
    },
    subLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#CBD5E0',
        marginBottom: 8,
    },
    seasonContainer: { marginBottom: 12 },
    seasonChip: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    seasonChipSelected: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    seasonChipText: {
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
    },
    seasonChipTextSelected: {
        color: '#1A2C5B',
        fontWeight: '700',
    },
    yearContainer: {},
    yearChip: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    yearChipSelected: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    yearChipText: {
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
    },
    yearChipTextSelected: {
        color: '#1A2C5B',
        fontWeight: '700',
    },
    
    // Semester preview styles
    semesterPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 12,
        gap: 8,
    },
    semesterPreviewText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
    },
    
    // Program suggestions styles
    programSuggestionsContainer: {
        marginTop: 12,
    },
    programSuggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    programSuggestionChip: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    programSuggestionText: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '500',
    },
    
    // Enhanced editing styles
    sectionContainer: {
        backgroundColor: 'rgba(248, 244, 227, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D4AF37',
        marginBottom: 16,
    },
    optionsScroll: {
        flexGrow: 0,
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    multiSelectOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(248, 244, 227, 0.3)',
    },
    selectedMultiSelectOption: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    multiSelectLabel: {
        color: '#F8F4E3',
        fontSize: 14,
        marginLeft: 8,
    },
    selectedMultiSelectLabel: {
        color: '#1A2C5B',
        fontWeight: '600',
    },
    
    // Section Selection Styles
    sectionSelectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F8F4E3',
        textAlign: 'center',
        marginBottom: 8,
    },
    sectionSelectionSubtitle: {
        fontSize: 16,
        color: '#CBD5E0',
        textAlign: 'center',
        marginBottom: 30,
    },
    sectionSelectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 244, 227, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    sectionIconContainer: {
        width: 50,
        height: 50,
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    sectionTextContainer: {
        flex: 1,
    },
    sectionSelectionCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F8F4E3',
        marginBottom: 4,
    },
    sectionSelectionCardDescription: {
        fontSize: 14,
        color: '#CBD5E0',
    },
    
    // Legacy styles for existing users
    saveButton: { marginTop: 30 },
    disabledButton: { opacity: 0.6 },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A2C5B',
        marginLeft: 8,
    },
    disabledButtonText: { color: '#888' },
});