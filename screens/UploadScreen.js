import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import QuizLoadingScreen from '../components/QuizLoadingScreen';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
    SafeAreaView,
    Linking,
    Vibration,
    Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import SubjectSelector from '../components/SubjectSelector'; // ✅ NEW: Import SubjectSelector
import { UserCoursesService } from '../services/UserCoursesService'; // ✅ NEW: Import UserCoursesService
import { StudentProfileService } from '../services/StudentProfileService'; // ✅ NEW: Import for validation
import { useTranslation } from 'react-i18next';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Custom Dropdown Component
const CustomDropdown = ({ 
    value, 
    onSelect, 
    options, 
    placeholder, 
    modalVisible, 
    setModalVisible, 
    icon 
  }) => {
    const selectedOption = options.find(option => option.value === value);

    return (
      <>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.dropdownContent}>
            <FontAwesome5 name={icon} size={16} color="#D4AF37" style={styles.dropdownIcon} />
            <Text style={[
              styles.dropdownText,
              !selectedOption && styles.dropdownPlaceholder
            ]}>
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
            <FontAwesome5 name="chevron-down" size={14} color="#CBD5E0" />
          </View>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {placeholder}</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <FontAwesome5 name="times" size={20} color="#F8F4E3" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item.value.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      value === item.value && styles.selectedOption
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      setModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5 name={item.icon} size={16} color="#D4AF37" />
                    <Text style={styles.optionText}>{item.label}</Text>
                    {value === item.value && (
                      <FontAwesome5 name="check" size={16} color="#28a745" />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  };

// Predefined subjects list for quick selection
const predefinedSubjects = [
    { label: '📚 Mathematics', value: 'mathematics', icon: 'calculator', color: '#3498DB' },
    { label: '🧬 Science', value: 'science', icon: 'atom', color: '#27AE60' },
    { label: '📜 History', value: 'history', icon: 'landmark', color: '#8B4513' },
    { label: '📝 English/Literature', value: 'english', icon: 'book', color: '#9B59B6' },
    { label: '💻 Computer Science', value: 'computer_science', icon: 'code', color: '#E74C3C' },
    { label: '🎨 Art', value: 'art', icon: 'palette', color: '#F39C12' },
    { label: '🎵 Music', value: 'music', icon: 'music', color: '#E91E63' },
    { label: '🌍 Geography', value: 'geography', icon: 'globe', color: '#1ABC9C' },
    { label: '💼 Business', value: 'business', icon: 'briefcase', color: '#34495E' },
    { label: '🏥 Medicine', value: 'medicine', icon: 'user-md', color: '#E67E22' },
    { label: '⚖️ Law', value: 'law', icon: 'gavel', color: '#7F8C8D' },
    { label: '🔬 Physics', value: 'physics', icon: 'atom', color: '#2ECC71' },
    { label: '⚗️ Chemistry', value: 'chemistry', icon: 'flask', color: '#F1C40F' },
    { label: '🧠 Psychology', value: 'psychology', icon: 'brain', color: '#AF7AC5' },
    { label: '💰 Economics', value: 'economics', icon: 'chart-line', color: '#58D68D' },
];

logger.info('🔧 Direct config check - API_BASE_URL:', API_BASE_URL);

export default function UploadScreen({ navigation }) {
    const { t, i18n } = useTranslation();
    
    // Safety wrapper for translations to prevent undefined rendering
    const safeT = (key, options) => {
        const translation = t(key, options);
        return translation || key;
    };
    // Consolidated state to prevent flashing
    const [uiState, setUiState] = useState({
        uploading: false,
        isDarkMode: false,
        showFreshnessIndicator: false,
        isTransitioning: false,
    });

    const [files, setFiles] = useState([]);
    const [responseText, setResponseText] = useState(null);
    const [quizConfig, setQuizConfig] = useState({
        types: {
            multiple_choice: true,
            true_false: false,
            open_ended: false,
        },
        difficulty: 'medium',
    });
    
    // Separate question count state to match AskAlexandria pattern
    const [questionCount, setQuestionCount] = useState(7);
    const [questionCountModalVisible, setQuestionCountModalVisible] = useState(false);

    // ✅ NEW: Subject selector states
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectSelectorVisible, setSubjectSelectorVisible] = useState(false);
    const [userCourses, setUserCourses] = useState([]);
    const [hasProfileCourses, setHasProfileCourses] = useState(false);
    
    // ✅ NEW: Subject validation states
    const [subjectValidation, setSubjectValidation] = useState(null);
    const [validatingSubject, setValidatingSubject] = useState(false);
    
    // ✅ NEW: Visual enhancement preference
    const [visualEnhancement, setVisualEnhancement] = useState('auto'); // 'auto', 'enabled', 'disabled'

    // Smooth animation refs
    const uploadProgress = useRef(new Animated.Value(0)).current;
    const containerAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Memoized theme colors
    const themeColors = useMemo(() => {
        // ✅ Updated to match AskAlexandriaScreen theme
        return {
            background: '#1A2C5B',
            backgroundSecondary: '#2C467D',
            surface: '#2C467D',
            surfaceSecondary: '#34495E',
            glass: 'rgba(44, 70, 125, 0.8)',
            text: '#F8F4E3',
            textSecondary: '#CBD5E0',
            textTertiary: '#9CA3AF',
            alexandriaGold: '#D4AF37',
            alexandriaBronze: '#B8941F',
            alexandriaNavy: '#1A2C5B',
            border: 'rgba(212, 175, 55, 0.3)',
            borderSecondary: 'rgba(248, 244, 227, 0.2)',
            success: '#28a745',
            error: '#dc3545',
            warning: '#FFD700',
            shadow: '#D4AF37',
        };
    }, []);

    // Smooth container animation on mount and load user courses
    useEffect(() => {
        Animated.spring(containerAnim, {
            toValue: 1,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
        }).start();
    }, []);

    // ✅ NEW: Load user's profile courses - moved up and memoized to prevent re-renders
    const loadUserCourses = useCallback(async () => {
        try {
            const courses = await UserCoursesService.getUserCourses();
            setUserCourses(courses);
            setHasProfileCourses(courses.length > 0);
            
            if (courses.length > 0) {
                logger.info(`📚 Loaded ${courses.length} courses from user profile for Upload screen`);
            }
        } catch (error) {
            logger.error('❌ Error loading user courses for Upload screen:', error);
        }
    }, []);

    // Refresh user courses whenever screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadUserCourses();
        }, [loadUserCourses])
    );

    // Smooth upload progress animation
    useEffect(() => {
        if (uiState.uploading) {
            const progressAnimation = Animated.loop(
                Animated.timing(uploadProgress, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: false,
                })
            );
            progressAnimation.start();
            return () => progressAnimation.stop();
        } else {
            uploadProgress.setValue(0);
        }
    }, [uiState.uploading]);

    // ✅ NEW: Validate subject/course when user types or selects custom subjects
    const validateSubject = useCallback(async (subjectText) => {
        if (!subjectText.trim()) {
            setSubjectValidation(null);
            return;
        }

        setValidatingSubject(true);
        try {
            const validation = await StudentProfileService.validateCourse(subjectText.trim());
            setSubjectValidation(validation);
            logger.info('📚 Upload screen - Subject validation result:', validation);
        } catch (error) {
            logger.error('❌ Error validating subject on Upload screen:', error);
            setSubjectValidation({
                valid: false,
                message: 'Unable to validate subject. Please try again.',
                suggestions: []
            });
        } finally {
            setValidatingSubject(false);
        }
    }, []);

    // ✅ NEW: Handle subject selection
    const handleSubjectSelect = useCallback((subjectData) => {
        setSelectedSubject(subjectData);
        logger.info('📚 Document subject selected:', subjectData);
        
        // ✅ NEW: Validate custom subjects for better data quality
        if (subjectData.type === 'custom' || subjectData.type === 'guest') {
            validateSubject(subjectData.name);
        } else {
            setSubjectValidation(null); // Clear validation for known subjects
        }
        
        Vibration.vibrate(50);
    }, []);

    // ✅ NEW: Clear selected subject
    const clearSelectedSubject = useCallback(() => {
        setSelectedSubject(null);
        setSubjectValidation(null); // Also clear validation
        Vibration.vibrate(30);
    }, []);

    // ✅ NEW: Get smart description for visual enhancement
    const getVisualEnhancementDescription = useCallback((mode) => {
        if (!selectedSubject) {
            return 'Automatically adds visual elements based on subject and content';
        }

        const visualSubjects = ['Database Science', 'Mathematics', 'Statistics', 'Physics', 'Calculus'];
        const isVisualSubject = visualSubjects.some(subject => 
            selectedSubject.name?.toLowerCase().includes(subject.toLowerCase())
        );

        if (isVisualSubject) {
            return `Great for ${selectedSubject.name} - adds visual elements to ~60% of relevant questions`;
        } else {
            return 'Adds visual elements when helpful for understanding concepts (~15% of questions)';
        }
    }, [selectedSubject]);

    // Smooth quiz type toggle with haptic feedback
    const toggleQuizType = useCallback((type) => {
        Vibration.vibrate(30);
        
        setQuizConfig(prev => ({
            ...prev,
            types: {
                ...prev.types,
                [type]: !prev.types[type],
            }
        }));
    }, []);

    // Smooth difficulty selection
    const selectDifficulty = useCallback((level) => {
        if (level === quizConfig.difficulty) return;
        
        Vibration.vibrate(40);
        
        Animated.sequence([
            Animated.timing(slideAnim, {
                toValue: -10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        setQuizConfig(prev => ({
            ...prev,
            difficulty: level
        }));
    }, [quizConfig.difficulty]);


    // Enhanced file picker with smooth feedback
    const pickFromGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    t('upload.accessToArchives'), 
                    t('upload.alexandriaNeedsAccess'),
                    [
                        { text: 'Not Now', style: 'cancel' },
                        { text: t('upload.grantAccess'), onPress: () => Linking.openSettings() }
                    ]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsMultipleSelection: true,
            });

            if (result.canceled) return;

            const newFiles = result.assets.map(asset => ({
                uri: asset.uri,
                name: asset.fileName || `wisdom_scroll_${Date.now()}.${asset.uri.split('.').pop()}`,
                mimeType: asset.type ? `image/${asset.type}` : 'image/jpeg',
                size: asset.fileSize,
            })).filter(
                newFile => !files.some(existingFile => existingFile.uri === newFile.uri)
            );

            if (newFiles.length > 0) {
                setFiles(prevFiles => [...prevFiles, ...newFiles]);
                setResponseText(null);
                // ✅ NEW: Clear subject selection when new files are added (optional)
                // setSelectedSubject(null);
                Vibration.vibrate(50);
            }

        } catch (err) {
            logger.error("Error accessing sacred archives: ", err);
            Alert.alert(t('upload.archiveError'), t('upload.couldNotAccessArchives'));
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*', 'text/plain'],
                copyToCacheDirectory: true,
                multiple: true,
            });

            if (result.canceled) return;

            const newFiles = result.assets.filter(
                newFile => !files.some(existingFile => existingFile.uri === newFile.uri)
            );

            if (newFiles.length > 0) {
                setFiles(prevFiles => [...prevFiles, ...newFiles]);
                setResponseText(null);
                // ✅ NEW: Clear subject selection when new files are added (optional)
                // setSelectedSubject(null);
                Vibration.vibrate(50);
            }
        } catch (err) {
            logger.error("Error accessing document archives: ", err);
            Alert.alert(t('upload.documentError'), t('upload.couldNotAccessDocuments'));
        }
    };

    const handleSelectFiles = useCallback(() => {
        Alert.alert(
            "🏛️ Select Study Materials",
            "From which archives would you like to gather wisdom?",
            [
                {
                    text: "📸 Photo Scrolls",
                    onPress: pickFromGallery,
                },
                {
                    text: "📄 Document Codex",
                    onPress: pickDocument,
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ]
        );
    }, []);

    // ✅ ENHANCED: Upload with subject context
    const handleUploadAndGenerateQuiz = async () => {
        if (files.length === 0) {
            Alert.alert(
                "🏛️ No Sacred Texts Found", 
                "Please select study materials from the archives to forge your trial of knowledge."
            );
            return;
        }

        const selectedQuizTypes = Object.keys(quizConfig.types).filter(type => quizConfig.types[type]);
        if (selectedQuizTypes.length === 0) {
            Alert.alert(
                "🏛️ No Trial Format Selected", 
                "Please choose at least one format for your trial of wisdom."
            );
            return;
        }

        setUiState(prev => ({ ...prev, uploading: true, isTransitioning: true }));
        setResponseText(null);

        try {
            const formData = new FormData();
            const firstFile = files[0];
            formData.append('file', {
                uri: firstFile.uri,
                name: firstFile.name,
                type: firstFile.mimeType || 'application/octet-stream',
            });

            formData.append('quiz_types', JSON.stringify(selectedQuizTypes));
            formData.append('num_questions', questionCount.toString());
            formData.append('difficulty', quizConfig.difficulty);
            formData.append('language', i18n.language || 'en'); // Add user's current language
            
            const user = auth.currentUser;
            if (user) {
                formData.append('user_id', user.uid);
            }

            // ✅ NEW: Add subject context to upload request
            if (selectedSubject) {
                formData.append('subject_context', JSON.stringify({
                    manual_subject: selectedSubject.name,
                    subject_key: selectedSubject.key,
                    subject_type: selectedSubject.type
                }));
                logger.info('📚 Uploading with subject context:', {
                    manual_subject: selectedSubject.name,
                    subject_key: selectedSubject.key,
                    subject_type: selectedSubject.type
                });
            }

            // ✅ NEW: Add visual enhancement preference
            formData.append('visual_preference', visualEnhancement);

            logger.info('🔗 Attempting to connect to:', `${API_BASE_URL}/upload`);
            logger.info('📱 User agent:', navigator.userAgent);

            // ✅ FIXED: Use API_BASE_URL instead of hardcoded IP
            const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-User-ID': user?.uid || 'anonymous',
                },
                timeout: 600000,
            });
            
            logger.info('✅ Upload successful:', res.status);
            logger.info('📦 Response data:', res.data);

            // ✅ Handle response immediately after successful upload (same try block)
            if (res.data?.metadata?.anti_repetition_applied) {
                setUiState(prev => ({ ...prev, showFreshnessIndicator: true }));
                setTimeout(() => {
                    setUiState(prev => ({ ...prev, showFreshnessIndicator: false }));
                }, 3000);
            }

            if (res.data?.quiz) {
                Animated.timing(containerAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    // ✅ ENHANCED: Pass subject context to QuizScreen
                    navigation.navigate('QuizScreen', { 
                        quiz: res.data.quiz,
                        source: 'Upload',
                        metadata: {
                            ...res.data.metadata,
                            title: 'Alexandria Trial of Wisdom',
                            // ✅ NEW: Include subject information for progress tracking
                            category: selectedSubject?.name || 'Document Study',
                            manualSubject: selectedSubject,
                            subjectKey: selectedSubject?.key,
                            subjectType: selectedSubject?.type,
                            subjectValidation: subjectValidation, // Include validation result
                            fileName: firstFile.name
                        }
                    });
                });
                
                setFiles([]);
                // ✅ NEW: Clear subject selection after successful upload
                setSelectedSubject(null);
                Vibration.vibrate([100, 50, 200]);
            } else if (res.data?.detail) {
                Alert.alert("🏛️ Oracle Error", res.data.detail);
                setResponseText(`Oracle speaks: ${res.data.detail}`);
            } else {
                Alert.alert("🏛️ Wisdom Forged", res.data?.message || "Your trial has been prepared in the sacred halls.");
                setResponseText(res.data?.message || "Trial preparation complete.");
            }

        } catch (error) {
            logger.error("Trial creation error: ", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.detail || error.message || "The ancient powers have failed us.";
            Alert.alert("🏛️ Trial Creation Failed", `The wisdom could not be forged: ${errorMessage}`);
            setResponseText(`Oracle's warning: ${errorMessage}`);
        } finally {
            setUiState(prev => ({ ...prev, uploading: false, isTransitioning: false }));
        }
    };

    // Smooth file removal
    const removeFile = useCallback((fileName) => {
        Alert.alert(
            t('upload.removeFromArchives'),
            t('upload.removeConfirmation', { fileName }),
            [
                { text: t('upload.keep'), style: "cancel" },
                { 
                    text: t('upload.remove'), 
                    style: "destructive", 
                    onPress: () => {
                        setFiles(current => current.filter(f => f.name !== fileName));
                        Vibration.vibrate(30);
                    }
                }
            ]
        );
    }, []);

    // Enhanced icon helpers
    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf': return 'scroll';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return 'image';
            case 'txt': return 'file-alt';
            default: return 'file';
        }
    };

    const getDifficultyIcon = (level) => {
        switch (level) {
            case 'easy': return 'seedling';
            case 'medium': return 'balance-scale';
            case 'hard': return 'fire';
            default: return 'balance-scale';
        }
    };

    const getDifficultyColor = (level, isSelected) => {
        const colors = {
            easy: isSelected ? themeColors.success : themeColors.success + '60',
            medium: isSelected ? themeColors.warning : themeColors.warning + '60',
            hard: isSelected ? themeColors.error : themeColors.error + '60'
        };
        return colors[level] || colors.medium;
    };

    // Question count options for dropdown
    const questionCountOptions = [
        { label: '3 Questions', value: 3, icon: 'list-ol' },
        { label: '5 Questions', value: 5, icon: 'list-ol' },
        { label: '7 Questions (Recommended)', value: 7, icon: 'list-ol' },
        { label: '10 Questions', value: 10, icon: 'list-ol' },
        { label: '12 Questions', value: 12, icon: 'list-ol' },
        { label: '15 Questions', value: 15, icon: 'list-ol' },
    ];

    // Memoized progress width for performance
    const progressWidth = useMemo(() => {
        return uploadProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
        });
    }, [uploadProgress]);

    // Enhanced header component
    const ListHeader = () => (
        <Animated.View 
            style={[
                styles.headerContainer,
                { 
                    opacity: containerAnim,
                    transform: [{ scale: containerAnim }]
                }
            ]}
        >
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                    Animated.timing(containerAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => NavigationHelper.safeGoBack(navigation));
                }}
                activeOpacity={0.8}
            >
                <View style={[
                    styles.backButtonContainer,
                    { backgroundColor: themeColors.glass }
                ]}>
                    <FontAwesome5 
                        name="arrow-left" 
                        size={20} 
                        color={themeColors.text} 
                    />
                </View>
            </TouchableOpacity>

            <View style={styles.titleSection}>
                <LinearGradient
                    colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                    style={styles.titleIcon}
                >
                    <FontAwesome5 
                        name="university" 
                        size={36} 
                        color="#FFFFFF" 
                    />
                </LinearGradient>
                
                <Text style={[styles.title, { color: themeColors.text }]}>
                    {t('upload.title')}
                </Text>
                <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                    {t('upload.subtitle')}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.selectButton}
                onPress={handleSelectFiles}
                activeOpacity={0.9}
                disabled={uiState.isTransitioning}
            >
                <LinearGradient
                    colors={[themeColors.alexandriaNavy, themeColors.surface]}
                    style={styles.selectButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <FontAwesome5 
                        name="plus-circle" 
                        size={24} 
                        color="#FFFFFF" 
                    />
                    <Text style={styles.selectButtonText}>
                        {t('upload.selectTexts')}
                    </Text>
                    <Text style={styles.selectButtonSubtext}>
                        {t('upload.supportedFormats')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* ✅ NEW: Subject Selector Section - Only show when files are selected */}
            {files.length > 0 && (
                <Animatable.View 
                    animation="slideInUp"
                    duration={500}
                    style={[
                        styles.subjectSection,
                        { backgroundColor: themeColors.glass }
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <LinearGradient
                            colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                            style={styles.sectionIcon}
                        >
                            <FontAwesome5 name="tags" size={18} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                            {t('upload.documentSubject')}
                        </Text>
                    </View>

                    {/* ✅ UPDATED: Quick Course Selection - User's courses first, then predefined */}
                    {!selectedSubject && (
                        <View style={styles.predefinedSubjectsContainer}>
                            {/* User's Profile Courses */}
                            {hasProfileCourses && (
                                <>
                                    <Text style={[styles.predefinedSubjectsLabel, { color: themeColors.alexandriaGold }]}>
                                        📚 Your Courses:
                                    </Text>
                                    <View style={styles.predefinedSubjectsRow}>
                                        {userCourses.slice(0, 4).map((course) => (
                                            <TouchableOpacity
                                                key={course.id}
                                                style={[
                                                    styles.predefinedSubjectChip,
                                                    styles.userCourseChip,
                                                    {
                                                        backgroundColor: course.color + '25',
                                                        borderColor: course.color + '60',
                                                        borderWidth: 2,
                                                    }
                                                ]}
                                                onPress={() => {
                                                    setSelectedSubject({
                                                        key: course.key,
                                                        name: course.name,
                                                        type: 'profile_course',
                                                        icon: course.icon,
                                                        color: course.color,
                                                        source: 'user_profile'
                                                    });
                                                    Vibration.vibrate(30);
                                                }}
                                                activeOpacity={0.7}
                                                disabled={uiState.isTransitioning}
                                            >
                                                <FontAwesome5 
                                                    name={course.icon} 
                                                    size={12} 
                                                    color={course.color} 
                                                />
                                                <Text style={[
                                                    styles.predefinedSubjectText,
                                                    styles.userCourseText,
                                                    { color: course.color }
                                                ]}>
                                                    {course.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    
                                    {/* Show more courses message if user has more than 4 */}
                                    {userCourses.length > 4 && (
                                        <Text style={[styles.moreCourseHint, { color: themeColors.textSecondary }]}>
                                            +{userCourses.length - 4} more in full selector
                                        </Text>
                                    )}
                                </>
                            )}

                            {/* Predefined Subjects (only if user has no courses or as fallback) */}
                            <Text style={[
                                styles.predefinedSubjectsLabel, 
                                { color: hasProfileCourses ? themeColors.textSecondary : themeColors.text }
                            ]}>
                                {hasProfileCourses ? 'Or choose from:' : t('upload.quickSelect')}
                            </Text>
                            <View style={styles.predefinedSubjectsRow}>
                                {predefinedSubjects.slice(0, hasProfileCourses ? 3 : 4).map((subject) => (
                                    <TouchableOpacity
                                        key={subject.value}
                                        style={[
                                            styles.predefinedSubjectChip,
                                            { 
                                                backgroundColor: subject.color + (hasProfileCourses ? '15' : '20'),
                                                borderColor: subject.color + (hasProfileCourses ? '30' : '40'),
                                                opacity: hasProfileCourses ? 0.8 : 1.0,
                                            }
                                        ]}
                                        onPress={() => {
                                            setSelectedSubject({
                                                key: subject.value,
                                                name: subject.label.replace(/📚|🧬|📜|📝|💻|🎨|🎵|🌍|💼|🏥|⚖️|🔬|⚗️|🧠|💰/g, '').trim(),
                                                type: 'predefined',
                                                icon: subject.icon,
                                                color: subject.color
                                            });
                                            Vibration.vibrate(30);
                                        }}
                                        activeOpacity={0.7}
                                        disabled={uiState.isTransitioning}
                                    >
                                        <FontAwesome5 
                                            name={subject.icon} 
                                            size={12} 
                                            color={subject.color} 
                                        />
                                        <Text style={[
                                            styles.predefinedSubjectText,
                                            { color: subject.color }
                                        ]}>
                                            {subject.label.replace(/📚|🧬|📜|📝|💻|🎨|🎵|🌍|💼|🏥|⚖️|🔬|⚗️|🧠|💰/g, '').trim()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.subjectSelectorButton,
                            { 
                                backgroundColor: selectedSubject 
                                    ? themeColors.alexandriaGold + '20'
                                    : themeColors.surface,
                                borderColor: selectedSubject
                                    ? themeColors.alexandriaGold
                                    : themeColors.border
                            }
                        ]}
                        onPress={() => setSubjectSelectorVisible(true)}
                        activeOpacity={0.7}
                        disabled={uiState.isTransitioning}
                    >
                        <View style={styles.subjectSelectorContent}>
                            <FontAwesome5 
                                name="tags" 
                                size={16} 
                                color={selectedSubject ? themeColors.alexandriaGold : themeColors.textSecondary} 
                            />
                            <Text style={[
                                styles.subjectSelectorText,
                                { 
                                    color: selectedSubject 
                                        ? themeColors.alexandriaGold 
                                        : themeColors.textSecondary
                                }
                            ]}>
                                {selectedSubject && selectedSubject.name 
                                    ? `📚 ${selectedSubject.name}` 
                                    : t('upload.browseAllSubjects')
                                }
                            </Text>
                            <FontAwesome5 
                                name="chevron-right" 
                                size={14} 
                                color={themeColors.textSecondary} 
                            />
                        </View>
                    </TouchableOpacity>

                    {/* ✅ NEW: Subject selection status */}
                    {/* ✅ NEW: Subject validation indicator */}
                    {validatingSubject && (
                        <View style={[
                            styles.selectedSubjectInfo,
                            { 
                                backgroundColor: themeColors.warning + '15',
                                borderColor: themeColors.warning + '40'
                            }
                        ]}>
                            <ActivityIndicator size="small" color={themeColors.warning} />
                            <Text style={[
                                styles.selectedSubjectText,
                                { color: themeColors.textSecondary }
                            ]}>
                                Validating subject...
                            </Text>
                        </View>
                    )}

                    {/* ✅ NEW: Subject validation results */}
                    {subjectValidation && selectedSubject && (
                        <View style={[
                            styles.selectedSubjectInfo,
                            { 
                                backgroundColor: subjectValidation.valid 
                                    ? themeColors.success + '15'
                                    : themeColors.error + '15',
                                borderColor: subjectValidation.valid 
                                    ? themeColors.success + '40'
                                    : themeColors.error + '40'
                            }
                        ]}>
                            <FontAwesome5 
                                name={subjectValidation.valid ? "check-circle" : "exclamation-triangle"} 
                                size={12} 
                                color={subjectValidation.valid ? themeColors.success : themeColors.error} 
                            />
                            <Text style={[
                                styles.selectedSubjectText,
                                { color: themeColors.textSecondary }
                            ]}>
                                {subjectValidation.message || 
                                 (subjectValidation.valid 
                                     ? `✅ "${selectedSubject.name}" is recognized` 
                                     : `❓ "${selectedSubject.name}" may not be recognized`)}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setSubjectValidation(null)}
                                style={styles.clearSubjectButton}
                            >
                                <FontAwesome5 name="times" size={10} color={themeColors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {selectedSubject && !validatingSubject && !subjectValidation && (
                        <View style={[
                            styles.selectedSubjectInfo,
                            { 
                                backgroundColor: themeColors.success + '15',
                                borderColor: themeColors.success + '40'
                            }
                        ]}>
                            <FontAwesome5 name="check-circle" size={12} color={themeColors.success} />
                            <Text style={[
                                styles.selectedSubjectText,
                                { color: themeColors.textSecondary }
                            ]}>
                                {t('upload.categorizedUnder', { subject: selectedSubject?.name || '' })}
                            </Text>
                            <TouchableOpacity 
                                onPress={clearSelectedSubject}
                                style={styles.clearSubjectButton}
                            >
                                <FontAwesome5 name="times" size={10} color={themeColors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={[
                        styles.subjectHelpText,
                        { color: themeColors.textTertiary }
                    ]}>
                        💡 Manually categorize your document for better progress tracking, or let Alexandria auto-detect the subject
                    </Text>

                    {/* ✅ NEW: Visual Enhancement Preference */}
                    <View style={[
                        styles.visualEnhancementSection,
                        { backgroundColor: themeColors.surfaceSecondary }
                    ]}>
                        <View style={styles.visualEnhancementHeader}>
                            <FontAwesome5 name="chart-bar" size={16} color={themeColors.alexandriaGold} />
                            <Text style={[
                                styles.visualEnhancementTitle,
                                { color: themeColors.text }
                            ]}>
                                Visual Learning Elements
                            </Text>
                        </View>
                        
                        <View style={styles.visualEnhancementOptions}>
                            {[
                                { 
                                    key: 'auto', 
                                    label: 'Smart Default', 
                                    description: getVisualEnhancementDescription('auto'),
                                    icon: 'magic',
                                    recommended: true
                                },
                                { 
                                    key: 'enabled', 
                                    label: 'Always Include', 
                                    description: 'Add charts, tables, and diagrams to all questions',
                                    icon: 'chart-line'
                                },
                                { 
                                    key: 'disabled', 
                                    label: 'Text Only', 
                                    description: 'Generate questions without visual elements',
                                    icon: 'file-alt'
                                }
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        styles.visualEnhancementOption,
                                        {
                                            backgroundColor: visualEnhancement === option.key
                                                ? themeColors.alexandriaGold + '20'
                                                : themeColors.surface,
                                            borderColor: visualEnhancement === option.key
                                                ? themeColors.alexandriaGold
                                                : themeColors.border
                                        }
                                    ]}
                                    onPress={() => {
                                        setVisualEnhancement(option.key);
                                        Vibration.vibrate(30);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.visualEnhancementOptionContent}>
                                        <FontAwesome5 
                                            name={option.icon} 
                                            size={14} 
                                            color={visualEnhancement === option.key 
                                                ? themeColors.alexandriaGold 
                                                : themeColors.textSecondary
                                            } 
                                        />
                                        <View style={styles.visualEnhancementOptionText}>
                                            <View style={styles.visualEnhancementOptionHeader}>
                                                <Text style={[
                                                    styles.visualEnhancementOptionLabel,
                                                    {
                                                        color: visualEnhancement === option.key
                                                            ? themeColors.alexandriaGold
                                                            : themeColors.text
                                                    }
                                                ]}>
                                                    {option.label}
                                                </Text>
                                                {option.recommended && (
                                                    <View style={[
                                                        styles.recommendedBadge,
                                                        { backgroundColor: themeColors.alexandriaGold }
                                                    ]}>
                                                        <Text style={styles.recommendedText}>Recommended</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[
                                                styles.visualEnhancementOptionDescription,
                                                { color: themeColors.textSecondary }
                                            ]}>
                                                {option.description}
                                            </Text>
                                        </View>
                                        {visualEnhancement === option.key && (
                                            <FontAwesome5 
                                                name="check-circle" 
                                                size={16} 
                                                color={themeColors.alexandriaGold} 
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Animatable.View>
            )}

            {/* Question Count Section */}
            <View style={[
                styles.configSection,
                { backgroundColor: themeColors.glass }
            ]}>
                <View style={styles.sectionHeader}>
                    <LinearGradient
                        colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                        style={styles.sectionIcon}
                    >
                        <FontAwesome5 name="list-ol" size={18} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                        {t('upload.trialsOfKnowledge')}
                    </Text>
                </View>
                
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  <FontAwesome5 name="list-ol" size={14} color="#D4AF37" /> {t('upload.numberOfSacredTrials')}
                </Text>
                <CustomDropdown
                  value={questionCount}
                  onSelect={setQuestionCount}
                  options={questionCountOptions}
                  placeholder="Select number of questions"
                  modalVisible={questionCountModalVisible}
                  setModalVisible={setQuestionCountModalVisible}
                  icon="list-ol"
                />
              </View>
            </View>
        </Animated.View>
    );

    // Enhanced footer with smooth animations (keeping existing content)
    const ListFooter = () => (
        <Animated.View 
            style={[
                styles.footerContainer,
                { opacity: containerAnim }
            ]}
        >

            {/* Difficulty Selection */}
            <Animated.View 
                style={[
                    styles.configSection,
                    { 
                        backgroundColor: themeColors.glass,
                        transform: [{ translateX: slideAnim }]
                    }
                ]}
            >
                <View style={styles.sectionHeader}>
                    <LinearGradient
                        colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                        style={styles.sectionIcon}
                    >
                        <FontAwesome5 name="chart-line" size={18} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                        Trial Difficulty
                    </Text>
                </View>
                
                <View style={styles.difficultyGrid}>
                    {['easy', 'medium', 'hard'].map((level) => (
                        <TouchableOpacity
                            key={level}
                            onPress={() => selectDifficulty(level)}
                            style={[
                                styles.difficultyCard,
                                {
                                    backgroundColor: quizConfig.difficulty === level 
                                        ? getDifficultyColor(level, true) + '20'
                                        : themeColors.surface,
                                    borderColor: quizConfig.difficulty === level
                                        ? getDifficultyColor(level, true)
                                        : themeColors.border,
                                }
                            ]}
                            activeOpacity={0.8}
                            disabled={uiState.isTransitioning}
                        >
                            <FontAwesome5 
                                name={getDifficultyIcon(level)} 
                                size={24} 
                                color={getDifficultyColor(level, quizConfig.difficulty === level)}
                                style={styles.difficultyIcon}
                            />
                            <Text style={[
                                styles.difficultyLabel, 
                                { 
                                    color: quizConfig.difficulty === level 
                                        ? getDifficultyColor(level, true)
                                        : themeColors.text
                                }
                            ]}>
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </Text>
                            <Text style={[
                                styles.difficultyDescription, 
                                { color: themeColors.textSecondary }
                            ]}>
                                {level === 'easy' && 'Gentle wisdom'}
                                {level === 'medium' && 'Balanced challenge'}
                                {level === 'hard' && 'Master\'s trial'}
                            </Text>
                            
                            {quizConfig.difficulty === level && (
                                <View style={[
                                    styles.difficultyCheckmark,
                                    { backgroundColor: getDifficultyColor(level, true) }
                                ]}>
                                    <FontAwesome5 name="check" size={12} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            {/* Quiz Types Selection */}
            <View style={[
                styles.configSection,
                { backgroundColor: themeColors.glass }
            ]}>
                <View style={styles.sectionHeader}>
                    <LinearGradient
                        colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                        style={styles.sectionIcon}
                    >
                        <FontAwesome5 name="scroll" size={18} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                        Trial Formats
                    </Text>
                </View>
                
                <View style={styles.quizTypeGrid}>
                    {Object.entries(quizConfig.types).map(([type, isSelected]) => {
                        const icons = {
                            multiple_choice: 'list-ul',
                            true_false: 'balance-scale',
                            open_ended: 'feather-alt'
                        };
                        
                        const titles = {
                            multiple_choice: 'Sacred Choice',
                            true_false: 'Truth & Falsehood',
                            open_ended: 'Scholarly Discourse'
                        };
                        
                        return (
                            <TouchableOpacity
                                key={type}
                                onPress={() => toggleQuizType(type)}
                                style={[
                                    styles.quizTypeCard,
                                    {
                                        backgroundColor: isSelected 
                                            ? themeColors.alexandriaGold + '20'
                                            : themeColors.surface,
                                        borderColor: isSelected
                                            ? themeColors.alexandriaGold
                                            : themeColors.border,
                                    }
                                ]}
                                activeOpacity={0.8}
                                disabled={uiState.isTransitioning}
                            >
                                <FontAwesome5 
                                    name={icons[type]} 
                                    size={24} 
                                    color={isSelected ? themeColors.alexandriaGold : themeColors.textSecondary}
                                    style={styles.quizTypeIcon}
                                />
                                <Text style={[
                                    styles.quizTypeLabel, 
                                    { 
                                        color: isSelected ? themeColors.alexandriaGold : themeColors.text
                                    }
                                ]}>
                                    {titles[type]}
                                </Text>
                                
                                {isSelected && (
                                    <View style={[
                                        styles.selectionIndicator,
                                        { backgroundColor: themeColors.alexandriaGold }
                                    ]}>
                                        <FontAwesome5 name="check" size={12} color="#FFFFFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Summary */}
            <View style={[
                styles.summaryContainer,
                { 
                    backgroundColor: themeColors.alexandriaGold + '15',
                    borderColor: themeColors.alexandriaGold + '40'
                }
            ]}>
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
                    {t('upload.trialConfiguration')}
                </Text>
                <View style={styles.summaryRow}>
                    <FontAwesome5 name="list-ol" size={16} color={themeColors.alexandriaGold} />
                    <Text style={[styles.summaryText, { color: themeColors.text }]}>
                        {questionCount} {t('upload.sacredTrials')}
                    </Text>
                </View>
                <View style={styles.summaryRow}>
                    <FontAwesome5 
                        name={getDifficultyIcon(quizConfig.difficulty)} 
                        size={16} 
                        color={getDifficultyColor(quizConfig.difficulty, true)} 
                    />
                    <Text style={[styles.summaryText, { color: themeColors.text }]}>
                        {quizConfig.difficulty.charAt(0).toUpperCase() + quizConfig.difficulty.slice(1)} {t('upload.difficulty')}
                    </Text>
                </View>
                <View style={styles.summaryRow}>
                    <FontAwesome5 name="scroll" size={16} color={themeColors.alexandriaGold} />
                    <Text style={[styles.summaryText, { color: themeColors.text }]}>
                        {Object.values(quizConfig.types).filter(Boolean).length} {t('upload.trialFormats')}
                    </Text>
                </View>
                {/* ✅ NEW: Subject summary row */}
                {selectedSubject && (
                    <View style={styles.summaryRow}>
                        <FontAwesome5 name="tags" size={16} color={themeColors.alexandriaGold} />
                        <Text style={[styles.summaryText, { color: themeColors.text }]}>
                            {t('upload.subject')}: {selectedSubject?.name || ''}
                        </Text>
                    </View>
                )}
            </View>

            {/* Generate Button */}
            <TouchableOpacity
                style={[
                    styles.generateButton,
                    (uiState.uploading || files.length === 0 || uiState.isTransitioning) && styles.generateButtonDisabled
                ]}
                onPress={handleUploadAndGenerateQuiz}
                disabled={uiState.uploading || files.length === 0 || uiState.isTransitioning}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                    style={styles.generateButtonGradient}
                >
                    {uiState.uploading ? (
                        <View style={styles.loadingContent}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.generateButtonText}>
                                {t('upload.generatingQuiz')}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.buttonContent}>
                            <FontAwesome5 name="magic" size={20} color="#FFFFFF" />
                            <Text style={styles.generateButtonText}>
                                {t('upload.generateQuiz')}
                            </Text>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* Progress Bar */}
            {uiState.uploading && (
                <View style={[
                    styles.progressContainer,
                    { backgroundColor: themeColors.borderSecondary }
                ]}>
                    <Animated.View 
                        style={[
                            styles.progressBar,
                            {
                                width: progressWidth,
                                backgroundColor: themeColors.alexandriaGold
                            }
                        ]} 
                    />
                </View>
            )}

            {/* Response Message */}
            {responseText && (
                <View style={[
                    styles.responseBox,
                    { backgroundColor: themeColors.alexandriaGold + '20' }
                ]}>
                    <FontAwesome5 
                        name="scroll" 
                        size={16} 
                        color={themeColors.alexandriaGold} 
                    />
                    <Text style={[styles.responseText, { color: themeColors.text }]}>
                        {responseText}
                    </Text>
                </View>
            )}

            {/* Test Connection Button - For Debugging */}
            <TouchableOpacity 
                onPress={testConnection} 
                style={{
                    padding: 20,
                    backgroundColor: 'blue',
                    borderRadius: 12,
                    marginTop: 10,
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: 'white', fontWeight: '700' }}>
                    Test Connection
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const testConnection = async () => {
        try {
            logger.info('🧪 Testing connection to:', API_BASE_URL);
            const response = await fetch(API_BASE_URL);
            const text = await response.text();
            logger.info('✅ Connection test successful:', response.status);
            logger.info('📄 Response text:', text.substring(0, 200)); // First 200 chars
            Alert.alert(
                '✅ Connection Test Successful', 
                `Server responded with status ${response.status}!\n\nThis means your Flask server is reachable.`
            );
        } catch (error) {
            logger.info('❌ Connection test failed:', error);
            Alert.alert(
                '❌ Connection Test Failed', 
                `Error: ${error.message}\n\nThis suggests a network connectivity issue.`
            );
        }
    };

    // Add this useEffect to debug when component loads:
    useEffect(() => {
        logger.info('🔧 Component mounted - API_BASE_URL:', API_BASE_URL);
        logger.info('🔧 Expected URL should be: http://192.168.0.9:8000');
        logger.info('🔧 URLs match:', API_BASE_URL === 'http://192.168.0.9:8000');
    }, []);

    return (
        <SafeAreaView style={[styles.container]}>
            <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
            
            {/* Freshness Indicator */}
            {uiState.showFreshnessIndicator && (
                <Animatable.View 
                    animation="slideInDown"
                    duration={500}
                    style={[
                        styles.freshnessIndicator,
                        { backgroundColor: '#D4AF37' + '90' }
                    ]}
                >
                    <FontAwesome5 name="sparkles" size={16} color="#FFFFFF" />
                    <Text style={styles.freshnessText}>
                        {t('upload.freshWisdomForged')}
                    </Text>
                </Animatable.View>
            )}

            <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.innerContainer}>
                <FlatList
                data={files}
                keyExtractor={(item) => item.uri}
                renderItem={({ item, index }) => (
                    <Animatable.View
                        animation="slideInRight"
                        delay={index * 100}
                        style={[
                            styles.fileItem,
                            { backgroundColor: themeColors.glass }
                        ]}
                    >
                        <View style={styles.fileInfo}>
                            <LinearGradient
                                colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                                style={styles.fileIconContainer}
                            >
                                <FontAwesome5 
                                    name={getFileIcon(item.name)} 
                                    size={20} 
                                    color="#FFFFFF" 
                                />
                            </LinearGradient>
                            <View style={styles.fileDetails}>
                                <Text 
                                    style={[styles.fileName, { color: themeColors.text }]} 
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>
                                <Text style={[styles.fileSize, { color: themeColors.textSecondary }]}>
                                    {item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            onPress={() => removeFile(item.name)} 
                            style={[
                                styles.removeButton,
                                { backgroundColor: themeColors.error + '20' }
                            ]}
                            activeOpacity={0.7}
                        >
                            <FontAwesome5 name="times" size={16} color={themeColors.error} />
                        </TouchableOpacity>
                    </Animatable.View>
                )}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                contentContainerStyle={styles.flatListContentContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    files.length === 0 ? (
                        <Animatable.View 
                            animation="fadeIn" 
                            delay={600}
                            style={[
                                styles.emptyState,
                                { backgroundColor: themeColors.glass }
                            ]}
                        >
                            <FontAwesome5 
                                name="university" 
                                size={48} 
                                color={themeColors.textSecondary} 
                                style={styles.emptyStateIcon}
                            />
                            <Text style={[styles.emptyStateText, { color: themeColors.text }]}>
                                {t('upload.archivesAwait')}
                            </Text>
                            <Text style={[styles.emptyStateSubtext, { color: themeColors.textSecondary }]}>
                                {t('upload.selectSacredTextsToBegin')}
                            </Text>
                        </Animatable.View>
                    ) : null
                }
            />
            </LinearGradient>
            
            {/* ✅ NEW: Subject Selector Modal */}
            <SubjectSelector
                visible={subjectSelectorVisible}
                onClose={() => setSubjectSelectorVisible(false)}
                onSubjectSelect={handleSubjectSelect}
                userId={auth.currentUser?.uid}
                theme={uiState.isDarkMode ? 'dark' : 'light'}
                currentSubject={selectedSubject}
                userCourses={userCourses}
                prioritizeUserCourses={true}
                onValidationRequest={async (subjectName) => {
                    // Pass validation request to our validation function
                    try {
                        const validation = await StudentProfileService.validateCourse(subjectName.trim());
                        return validation;
                    } catch (error) {
                        logger.error('❌ Error validating subject in SubjectSelector:', error);
                        return {
                            valid: false,
                            message: 'Unable to validate subject. Please try again.',
                            suggestions: []
                        };
                    }
                }}
            />

            <QuizLoadingScreen 
                isVisible={uiState.uploading}
                message="Alexandria is creating your quiz..."
                subMessage={files.some(f => f.name?.endsWith('.pdf')) ? 
                    "📚 Enhanced PDF Processing: Analyzing text, images, charts, and diagrams..." :
                    "Analyzing your content and generating questions"
                }
            />
        </SafeAreaView>
    );
}

// Enhanced styles with Alexandria theming and smooth animations
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
    },
    flatListContentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    
    // Header Styles
    headerContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    backButtonContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    
    titleSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    titleIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
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
        opacity: 0.9,
    },
    
    // Select Button Styles
    selectButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    selectButtonGradient: {
        paddingVertical: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    selectButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 8,
    },
    selectButtonSubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
    },

    // ✅ NEW: Subject Section Styles
    subjectSection: {
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    subjectSelectorButton: {
        borderRadius: 12,
        borderWidth: 2,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
    },
    subjectSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subjectSelectorText: {
        flex: 1,
        fontSize: 15,
        marginLeft: 10,
        fontWeight: '500',
    },
    selectedSubjectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    selectedSubjectText: {
        flex: 1,
        fontSize: 13,
        marginLeft: 6,
        fontWeight: '500',
    },
    clearSubjectButton: {
        padding: 6,
        borderRadius: 12,
    },
    subjectHelpText: {
        fontSize: 12,
        lineHeight: 16,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    
    // ✅ NEW: Predefined Subjects Styles
    predefinedSubjectsContainer: {
        marginBottom: 16,
    },
    predefinedSubjectsLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    predefinedSubjectsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    predefinedSubjectChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    predefinedSubjectText: {
        fontSize: 12,
        fontWeight: '600',
    },
    
    // ✅ NEW: User course specific styles
    userCourseChip: {
        elevation: 2,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    userCourseText: {
        fontWeight: '700',
        fontSize: 11,
    },
    moreCourseHint: {
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.8,
    },
    
    // File Item Styles
    fileItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginVertical: 6,
        borderRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fileIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    fileDetails: {
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    fileSize: {
        fontSize: 12,
        opacity: 0.7,
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    
    // Footer and Configuration Styles
    footerContainer: {
        marginTop: 0,
    },
    configSection: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    
    // Question Count Styles - Copied exactly from AskAlexandria
    inputContainer: {
        marginBottom: 4,
    },
    label: {
        color: '#F8F4E3',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    slider: {
        flex: 1,
        height: 40,
        marginHorizontal: 16,
    },
    sliderThumb: {
        backgroundColor: '#D4AF37',
        width: 20,
        height: 20,
    },
    sliderLabel: {
        color: '#CBD5E0',
        fontSize: 14,
        fontWeight: '600',
        minWidth: 20,
        textAlign: 'center',
    },
    sliderHelper: {
        color: '#CBD5E0',
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    
    // Difficulty Styles
    difficultyGrid: {
        gap: 12,
    },
    difficultyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
        position: 'relative',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    difficultyIcon: {
        marginRight: 16,
        width: 24,
    },
    difficultyLabel: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    difficultyDescription: {
        fontSize: 12,
        position: 'absolute',
        bottom: 8,
        left: 60,
        opacity: 0.8,
    },
    difficultyCheckmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Quiz Type Styles
    quizTypeGrid: {
        gap: 12,
    },
    quizTypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
        position: 'relative',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    quizTypeIcon: {
        marginRight: 16,
    },
    quizTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    selectionIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Summary Styles
    summaryContainer: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    summaryText: {
        fontSize: 14,
        marginLeft: 12,
        fontWeight: '500',
    },
    
    // Generate Button Styles
    generateButton: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    generateButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    generateButtonDisabled: {
        opacity: 0.6,
    },
    generateButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    loadingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    
    // Progress Styles
    progressContainer: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    
    // Response Styles
    responseBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    responseText: {
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
    
    // Empty State Styles
    emptyState: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginVertical: 8,
    },
    emptyStateIcon: {
        opacity: 0.5,
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        opacity: 0.8,
        textAlign: 'center',
        lineHeight: 20,
    },
    
    // Freshness Indicator Styles
    freshnessIndicator: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        gap: 8,
        zIndex: 1000,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
    },
    freshnessText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // ✅ NEW: Visual Enhancement Styles
    visualEnhancementSection: {
        marginTop: 20,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
    },
    visualEnhancementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    visualEnhancementTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    visualEnhancementOptions: {
        gap: 10,
    },
    visualEnhancementOption: {
        borderRadius: 10,
        borderWidth: 2,
        padding: 12,
    },
    visualEnhancementOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    visualEnhancementOptionText: {
        flex: 1,
    },
    visualEnhancementOptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    visualEnhancementOptionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    visualEnhancementOptionDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    recommendedBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    recommendedText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    
    // Dropdown Styles
    dropdownButton: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        padding: 16,
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownIcon: {
        marginRight: 12,
    },
    dropdownText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#F8F4E3',
    },
    dropdownPlaceholder: {
        color: '#CBD5E0',
        fontStyle: 'italic',
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#2C467D',
        borderRadius: 16,
        padding: 24,
        margin: 20,
        maxHeight: '70%',
        width: '85%',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 175, 55, 0.3)',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#F8F4E3',
    },
    modalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 10,
        marginVertical: 4,
        backgroundColor: 'rgba(248, 244, 227, 0.05)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedOption: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderColor: 'rgba(212, 175, 55, 0.5)',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#F8F4E3',
        marginLeft: 12,
    },
});