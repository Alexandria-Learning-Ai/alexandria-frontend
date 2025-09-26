
// screens/AskAlexandriaScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, FlatList, SafeAreaView, StatusBar, Keyboard, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { db, auth } from '../firebaseConfig';
import axios from 'axios';
import * as Animatable from 'react-native-animatable';
import { UserCoursesService } from '../services/UserCoursesService'; // ✅ NEW: Import UserCoursesService
import { StudentProfileService } from '../services/StudentProfileService'; // ✅ NEW: Import for course validation
import HierarchicalSubjectService from '../services/HierarchicalSubjectService'; // ✅ NEW: Import hierarchical service
import { API_BASE_URL } from '../config/api';
import { useTranslation } from 'react-i18next';
import SafeBackButton from '../components/SafeBackButton';
import logger from '../utils/logger';



export default function AskAlexandriaScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();
  
  // 🎯 Streamlined state - only what we need
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [quizTypes, setQuizTypes] = useState(['mix']); // Array for multi-select
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [details, setDetails] = useState(''); // Exam details for context
  const [loading, setLoading] = useState(false);
  
  // Modal states - simplified
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [quizTypeModalVisible, setQuizTypeModalVisible] = useState(false);
  const [difficultyModalVisible, setDifficultyModalVisible] = useState(false);
  
  // User course data
  const [userCourses, setUserCourses] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [subjectValidation, setSubjectValidation] = useState(null);
  const [validatingSubject, setValidatingSubject] = useState(false);

  // ✅ NEW: Hierarchical course selection state
  const [hierarchicalMode, setHierarchicalMode] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedHierarchicalSubject, setSelectedHierarchicalSubject] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedHierarchicalCourse, setSelectedHierarchicalCourse] = useState(null);
  const [courseSelectionMode, setCourseSelectionMode] = useState('profile'); // 'profile' or 'hierarchical'
  const [hierarchicalCourseModalVisible, setHierarchicalCourseModalVisible] = useState(false);
  
  // UI state for freshness indicator
  const [uiState, setUiState] = useState({
    showFreshnessIndicator: false,
  });

  // Animation ref for smooth exit
  const containerAnim = useRef(new Animated.Value(1)).current;

  // Load user courses and handle route params
  useEffect(() => {
    loadUserCourses();
    loadHierarchicalSubjects();

    // Smooth container animation on mount
    Animated.spring(containerAnim, {
      toValue: 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // ✅ ENHANCED: Handle hierarchical route params
    if (route?.params?.hierarchicalMode) {
      setHierarchicalMode(true);
      setCourseSelectionMode('hierarchical');
    }

    if (route?.params?.suggestedTopic) {
      setTopic(route.params.suggestedTopic);
    }

    if (route?.params?.subjectKey && route?.params?.courseKey) {
      // Handle hierarchical navigation from ProgressTracker
      setSelectedHierarchicalSubject(route.params.subjectKey);
      setSelectedHierarchicalCourse(route.params.courseKey);
      setTopic(route.params.suggestedTopic || route.params.courseKey);
    }

    if (route?.params?.course) {
      setSelectedCourse(route.params.course);
    }
  }, [route?.params]);

  // Load user's courses from onboarding
  const loadUserCourses = async () => {
    try {
      const courses = await UserCoursesService.getUserCourses();
      setUserCourses(courses);

      if (courses.length > 0) {
        logger.info(`📚 Loaded ${courses.length} courses from user profile`);
      }
    } catch (error) {
      logger.error('❌ Error loading user courses:', error);
    }
  };

  // ✅ NEW: Load hierarchical subjects for enhanced course selection
  const loadHierarchicalSubjects = () => {
    try {
      const subjects = Object.keys(HierarchicalSubjectService.SUBJECT_HIERARCHY);
      setAvailableSubjects(subjects);
      logger.info(`🎓 Loaded ${subjects.length} hierarchical subjects`);
    } catch (error) {
      logger.error('❌ Error loading hierarchical subjects:', error);
    }
  };

  // ✅ NEW: Handle hierarchical subject selection
  const handleHierarchicalSubjectSelect = (subjectName) => {
    setSelectedHierarchicalSubject(subjectName);
    setSelectedHierarchicalCourse(null); // Clear course selection

    // Load available courses for this subject
    const hierarchy = HierarchicalSubjectService.SUBJECT_HIERARCHY[subjectName];
    if (hierarchy && hierarchy.courses) {
      const courses = Object.keys(hierarchy.courses);
      setAvailableCourses(courses);
      logger.info(`📚 Loaded ${courses.length} courses for ${subjectName}`);
    }
  };

  // ✅ NEW: Handle hierarchical course selection
  const handleHierarchicalCourseSelect = (courseName) => {
    setSelectedHierarchicalCourse(courseName);
    setTopic(courseName); // Auto-fill the topic field

    // Create a course object similar to profile courses for consistency
    setSelectedCourse({
      name: courseName,
      code: `${selectedHierarchicalSubject}_${courseName}`.replace(/\s+/g, '_').toUpperCase(),
      subject: selectedHierarchicalSubject,
      source: 'hierarchical'
    });
  };

  // Check if user has profile courses
  const hasProfileCourses = userCourses && userCourses.length > 0;
  const quizTypeOptions = [
    { label: 'All Types (Recommended)', value: 'all', icon: 'star', color: '#D4AF37' },
    { label: 'Mixed Types', value: 'mix', icon: 'random', color: '#3498DB' },
    { label: 'Multiple Choice', value: 'multiple_choice', icon: 'list-ul', color: '#27AE60' },
    { label: 'Short Answer', value: 'open_ended', icon: 'edit', color: '#E74C3C' },
    { label: 'True / False', value: 'true_false', icon: 'check-circle', color: '#9B59B6' },
  ];



  const difficultyOptions = [
    { label: '🟢 Easy - Basic concepts', value: 'easy', icon: 'seedling' },
    { label: '🟡 Medium - Standard level', value: 'medium', icon: 'balance-scale' },
    { label: '🔴 Hard - Advanced concepts', value: 'hard', icon: 'fire' },
    { label: '🟣 Expert - Professional level', value: 'expert', icon: 'crown' },
  ];



  // ✅ NEW: Validate subject/course when user types
  const handleCourseSelect = (course) => {
    logger.info('📚 Course selected:', course);
    setSelectedCourse(course);
    setCourseModalVisible(false);
  };


  // ✅ NEW: Validate subject/course
  const validateSubject = useCallback(async (subjectText) => {
    if (!subjectText.trim()) {
      setSubjectValidation(null);
      return;
    }

    setValidatingSubject(true);
    try {
      const validation = await StudentProfileService.validateCourse(subjectText.trim());
      setSubjectValidation(validation);
      logger.info('📚 Ask Alexandria - Subject validation result:', validation);
    } catch (error) {
      logger.error('❌ Error validating subject on Ask Alexandria screen:', error);
      setSubjectValidation({
        valid: false,
        message: 'Unable to validate subject. Please try again.',
        confidence: 0
      });
    } finally {
      setValidatingSubject(false);
    }
  }, []);

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
                keyExtractor={(item) => item.value}
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

  const handleGenerateQuiz = async () => {
    // Use subject as topic if topic is empty
    const quizTopic = topic.trim() || subject.trim();

    if (!quizTopic) {
      Alert.alert('Missing Topic', 'Please enter a subject/topic for your quiz.');
      return;
    }

    if (!selectedCourse) {
      Alert.alert('Select Course', 'Please select a course from your program to track progress.');
      return;
    }

    if (quizTypes.length === 0) {
      Alert.alert('Select Quiz Type', 'Please select at least one quiz type.');
      return;
    }

    try {
      setLoading(true);
      
      const user = auth.currentUser;
      
      // Get user's education level from onboarding (default to college if not available)
      const userProfile = await StudentProfileService.getProfile(user?.uid);
      const gradeLevel = userProfile?.educationLevel || 'college';

      // Prepare streamlined API request
      const requestData = {
        topic: quizTopic,
        course: selectedCourse.name,
        course_code: selectedCourse.code,
        quiz_type: quizTypes.includes('all') ? 'mix' : quizTypes.join(','),
        grade_level: gradeLevel,
        difficulty: difficulty,
        num_questions: parseInt(numQuestions, 10),
        user_id: user?.uid || 'anonymous',
        language: i18n.language || 'en'
      };
      
      // Add exam details for better context
      if (details && details.trim()) {
        requestData.context = details.trim();
      }

      logger.info('🎯 Streamlined request:', requestData);

      const response = await axios.post(
          `${API_BASE_URL}/ask-alexandria`,
          requestData,
          {
              headers: {
                  'Content-Type': 'application/json',
                  'X-User-ID': user?.uid || 'anonymous',
              },
              timeout: 120000, // ⏰ Increased timeout to 120 seconds
          }
      );
      
      logger.info('🎯 Full API response:', JSON.stringify(response.data, null, 2));
      
      // ✅ ADD: Check for freshness features and show indicator
      if (response.data.metadata?.freshness_features &&
          response.data.metadata.freshness_features.length > 0) {
          setUiState(prev => ({ ...prev, showFreshnessIndicator: true }));
          setTimeout(() => setUiState(prev => ({ ...prev, showFreshnessIndicator: false })), 3000);
      }

      const quizData = response.data.quiz;
      logger.info('🎯 Quiz data received:', quizData);
      logger.info('📝 Number of questions:', quizData?.length || 0);

      // ✅ ENHANCED: Better error handling with more informative messages
      if (!quizData) {
        logger.error('❌ No quiz property in response');
        throw new Error('No quiz data returned from server');
      }
      
      if (!Array.isArray(quizData)) {
        logger.error('❌ Quiz data is not an array:', typeof quizData);
        throw new Error('Invalid quiz data format - expected array');
      }
      
      if (quizData.length === 0) {
        logger.error('❌ Quiz data array is empty');
        logger.error('❌ Full response for debugging:', response.data);
        
        throw new Error(`Unable to generate questions for "${quizTopic}". Try using a more specific topic or check your internet connection.`);
      }

      // ✅ ENHANCED: Enhanced metadata for hierarchical progress tracking
      const enhancedMetadata = {
          title: `${quizTopic} Quiz`,
          course: selectedCourse.name,
          course_code: selectedCourse.code,
          difficulty,
          numQuestions,
          source: 'AskAlexandria',
          category: selectedCourse.name,
          subject: selectedHierarchicalSubject || selectedCourse.subject || quizTopic,
          topic: quizTopic,
          quizTypes: quizTypes,
          // ✅ NEW: Hierarchical metadata
          hierarchical: {
            enabled: courseSelectionMode === 'hierarchical',
            subject: selectedHierarchicalSubject,
            course: selectedHierarchicalCourse,
            source: selectedCourse.source || 'profile'
          }
      };

      logger.info('🎮 Navigating to QuizScreen with metadata:', enhancedMetadata);
      
      navigation.navigate('QuizScreen', {
          quiz: quizData,
          source: 'AskAlexandria',
          subject: quizTopic,
          metadata: enhancedMetadata
      });

    } catch (error) {
      logger.error('❌ Full error object:', error);
      logger.error('📄 Error response data:', error.response?.data);
      logger.error('🔍 Request data that caused error:', requestData);
      
      let errorMessage = 'Failed to generate quiz. Please try again.';
      
      if (error.response?.status === 500) {
          errorMessage = 'Server error while generating quiz. Please try again in a moment.';
      } else if (error.response?.status === 422) {
          const validationErrors = error.response?.data?.detail;
          if (validationErrors && typeof validationErrors === 'object') {
            // Format validation error details for debugging
            logger.error('🔍 422 Validation errors:', validationErrors);
            const errorFields = Object.keys(validationErrors).join(', ');
            errorMessage = `Validation failed for: ${errorFields}. Please check your inputs.`;
          } else {
            errorMessage = 'Invalid request format. Please check your inputs and try again.';
          }
      } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection.';
      } else if (error.response?.status === 404) {
          errorMessage = 'Service endpoint not found. Please check your connection.';
      } else if (!error.response) {
          errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      Alert.alert('Quiz Generation Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderSubjectInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        <FontAwesome5 name="book" size={14} color="#D4AF37" /> {t('askAlexandria.subjectTopic')}
      </Text>
      <View style={styles.subjectInputWrapper}>
        <TextInput
          style={[
            styles.input,
            selectedSubject && styles.inputWithSelection,
            // ✅ NEW: Validation styling
            subjectValidation?.valid === false && styles.inputError,
            subjectValidation?.valid === true && styles.inputValid
          ]}
          placeholder={
            selectedSubject
              ? `Enter topic within ${selectedSubject.name}...`
              : t('askAlexandria.enterSubjectPlaceholder')
          }
          placeholderTextColor="#CBD5E0"
          value={subject}
          onChangeText={text => {
            setSubject(text);
            setTopic(text); // Keep topic in sync with subject
            // ✅ NEW: Clear validation when user is typing
            if (subjectValidation) setSubjectValidation(null);

            if (
              selectedSubject &&
              text !== selectedSubject.name &&
              !text.toLowerCase().includes(selectedSubject.name.toLowerCase()) &&
              !selectedSubject.name.toLowerCase().includes(text.toLowerCase())
            ) {
              setSelectedSubject(null);
            }
          }}
          onBlur={() => {
            // ✅ NEW: Validate when user finishes typing
            if (subject.trim() && !selectedSubject) {
              validateSubject(subject);
            }
          }}
          multiline={false}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        
        {/* ✅ NEW: Validation indicator */}
        <View style={styles.inputValidationContainer}>
          {validatingSubject && (
            <View style={styles.validationIndicator}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.validatingText}>Validating...</Text>
            </View>
          )}
          {subjectValidation?.valid === true && !validatingSubject && (
            <View style={styles.validationIndicator}>
              <FontAwesome5 name="check-circle" size={16} color="#28a745" />
              <Text style={styles.validationSuccessText}>Valid course!</Text>
            </View>
          )}
          {subjectValidation?.valid === false && !validatingSubject && (
            <View style={styles.validationIndicator}>
              <FontAwesome5 name="exclamation-triangle" size={16} color="#dc3545" />
              <Text style={styles.validationErrorText}>
                {subjectValidation.message || 'Course not recognized'}
              </Text>
            </View>
          )}
        </View>
        {(subject || selectedSubject) && (
          <TouchableOpacity
            style={styles.clearSubjectInputButton}
            onPress={() => {
              setSubject('');
              setTopic(''); // Clear topic as well
              setSelectedSubject(null);
            }}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="times-circle" size={16} color="#95A5A6" />
          </TouchableOpacity>
        )}
      </View>
      {/* ✅ ENHANCED: Course Selection Mode Toggle */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          <FontAwesome5 name="graduation-cap" size={14} color="#D4AF37" /> 📚 Course Selection
        </Text>

        {/* Course Selection Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              courseSelectionMode === 'profile' && styles.activeToggle
            ]}
            onPress={() => {
              setCourseSelectionMode('profile');
              setSelectedHierarchicalSubject(null);
              setSelectedHierarchicalCourse(null);
            }}
            disabled={!hasProfileCourses}
          >
            <FontAwesome5
              name="user-graduate"
              size={14}
              color={courseSelectionMode === 'profile' ? '#FFFFFF' : (hasProfileCourses ? '#D4AF37' : '#95A5A6')}
            />
            <Text style={[
              styles.toggleText,
              { color: courseSelectionMode === 'profile' ? '#FFFFFF' : (hasProfileCourses ? '#D4AF37' : '#95A5A6') }
            ]}>
              My Courses ({userCourses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              courseSelectionMode === 'hierarchical' && styles.activeToggle
            ]}
            onPress={() => {
              setCourseSelectionMode('hierarchical');
              setSelectedSubject(null);
            }}
          >
            <FontAwesome5
              name="sitemap"
              size={14}
              color={courseSelectionMode === 'hierarchical' ? '#FFFFFF' : '#D4AF37'}
            />
            <Text style={[
              styles.toggleText,
              { color: courseSelectionMode === 'hierarchical' ? '#FFFFFF' : '#D4AF37' }
            ]}>
              All Subjects ({availableSubjects.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Courses Selection */}
        {courseSelectionMode === 'profile' && hasProfileCourses && (
          <CustomDropdown
            value={selectedSubject?.name || ""}
            onSelect={(value) => {
              const selectedCourse = userCourses.find(c => c.key === value);
              if (selectedCourse) {
                setSubject(selectedCourse.name);
                setTopic(selectedCourse.name); // Keep topic in sync
                setSelectedSubject({
                  key: selectedCourse.key,
                  name: selectedCourse.name,
                  type: 'profile_course',
                  icon: selectedCourse.icon,
                  color: selectedCourse.color,
                  source: 'user_profile'
                });
                // Also set selectedCourse for consistency
                setSelectedCourse({
                  name: selectedCourse.name,
                  code: selectedCourse.code || selectedCourse.key,
                  icon: selectedCourse.icon,
                  color: selectedCourse.color,
                  source: 'profile'
                });
              }
            }}
            options={userCourses.map(course => ({
              label: `📚 ${course.name}`,
              value: course.key,
              icon: course.icon,
              color: course.color
            }))}
            placeholder="Choose from your courses"
            modalVisible={courseModalVisible}
            setModalVisible={setCourseModalVisible}
            icon="graduation-cap"
          />
        )}

        {/* Hierarchical Subject & Course Selection */}
        {courseSelectionMode === 'hierarchical' && (
          <>
            {/* Subject Selection */}
            <View style={styles.hierarchicalStep}>
              <Text style={styles.stepLabel}>
                <FontAwesome5 name="book" size={12} color="#D4AF37" /> Step 1: Choose Subject
              </Text>
              <CustomDropdown
                value={selectedHierarchicalSubject || ""}
                onSelect={handleHierarchicalSubjectSelect}
                options={availableSubjects.map(subject => ({
                  label: `🎓 ${subject}`,
                  value: subject,
                  icon: HierarchicalSubjectService.getSubjectIcon(subject),
                  color: HierarchicalSubjectService.getSubjectColor(subject)
                }))}
                placeholder="Select a subject"
                modalVisible={courseModalVisible}
                setModalVisible={setCourseModalVisible}
                icon="book"
              />
            </View>

            {/* Course Selection */}
            {selectedHierarchicalSubject && availableCourses.length > 0 && (
              <View style={styles.hierarchicalStep}>
                <Text style={styles.stepLabel}>
                  <FontAwesome5 name="graduation-cap" size={12} color="#D4AF37" /> Step 2: Choose Course
                </Text>
                <CustomDropdown
                  value={selectedHierarchicalCourse || ""}
                  onSelect={handleHierarchicalCourseSelect}
                  options={availableCourses.map(course => ({
                    label: `📚 ${course}`,
                    value: course,
                    icon: 'book-open',
                    color: HierarchicalSubjectService.getSubjectColor(selectedHierarchicalSubject)
                  }))}
                  placeholder={`Choose a course in ${selectedHierarchicalSubject}`}
                  modalVisible={hierarchicalCourseModalVisible}
                  setModalVisible={setHierarchicalCourseModalVisible}
                  icon="graduation-cap"
                />
              </View>
            )}

            {/* Selection Summary */}
            {selectedHierarchicalSubject && selectedHierarchicalCourse && (
              <View style={styles.selectionSummary}>
                <FontAwesome5 name="check-circle" size={16} color="#28a745" />
                <Text style={styles.summaryText}>
                  {selectedHierarchicalSubject} → {selectedHierarchicalCourse}
                </Text>
              </View>
            )}
          </>
        )}

        {/* No Profile Courses Message */}
        {courseSelectionMode === 'profile' && !hasProfileCourses && (
          <View style={styles.noCoursesMessage}>
            <FontAwesome5 name="info-circle" size={16} color="#F39C12" />
            <Text style={styles.noCoursesText}>
              No courses from your profile. Switch to "All Subjects" to explore courses.
            </Text>
          </View>
        )}
      </View>

    </View>
  );

  return (
    <SafeAreaView style={[styles.container]}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
        
        {/* Freshness Indicator */}
        {uiState.showFreshnessIndicator && (
            <Animatable.View 
                animation="slideInDown" 
                duration={500}
                style={[styles.freshnessIndicator]}
            >
                <FontAwesome5 name="brain" size={16} color="#D4AF37" />
                      <Text style={styles.freshnessText}>
                    ✨ Fresh questions generated!
                </Text>
            </Animatable.View>
        )}

        <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.innerContainer}>
          <Animated.View style={[
            styles.animatedContainer,
            { 
              opacity: containerAnim,
              transform: [{ scale: containerAnim }]
            }
          ]}>
            {/* Back Button with smooth exit animation */}
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
                  const NavigationHelper = require('../utils/NavigationHelper').default;
                  NavigationHelper.safeGoBack(navigation);
                });
              }}
            /> 

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{t('askAlexandria.title')}</Text>
              <Text style={styles.subtitle}>{t('askAlexandria.subtitle')}</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Subject Input */}
              {renderSubjectInput()}

              {/* Exam Details Input */}
              {!selectedSubject && subject.length === 0 && (
                <View style={styles.detailsWindow}>
                  <Text style={styles.detailsLabel}>{t('askAlexandria.examDescription')}</Text>
                  <TextInput
                    style={styles.detailsInput}
                    placeholder={t('askAlexandria.examDescriptionPlaceholder')}
                    placeholderTextColor="#CBD5E0"
                    value={details}
                    onChangeText={setDetails}
                    multiline
                    numberOfLines={3}
                    maxLength={400}
                  />
                </View>
              )}

              {/* Quiz Type Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  <FontAwesome5 name="question-circle" size={14} color="#D4AF37" /> {t('askAlexandria.quizType')}
                </Text>
                <CustomDropdown
                  value={quizTypes[0] || 'mix'}
                  onSelect={(value) => setQuizTypes([value])}
                  options={quizTypeOptions}
                  placeholder="Select quiz type"
                  modalVisible={quizTypeModalVisible}
                  setModalVisible={setQuizTypeModalVisible}
                  icon="question-circle"
                />
              </View>


              {/* Difficulty Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  <FontAwesome5 name="signal" size={14} color="#D4AF37" /> {t('askAlexandria.difficultyLevel')}
                </Text>
                <CustomDropdown
                  value={difficulty}
                  onSelect={setDifficulty}
                  options={difficultyOptions}
                  placeholder="Select difficulty level"
                  modalVisible={difficultyModalVisible}
                  setModalVisible={setDifficultyModalVisible}
                  icon="signal"
                />
              </View>

              {/* Number of Questions */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  <FontAwesome5 name="list-ol" size={14} color="#D4AF37" /> {t('askAlexandria.numberOfQuestions')} {numQuestions}
                </Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>5</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={20}
                    step={1}
                    value={numQuestions}
                    onValueChange={setNumQuestions}
                    minimumTrackTintColor="#D4AF37"
                    maximumTrackTintColor="rgba(248, 244, 227, 0.3)"
                    thumbStyle={styles.sliderThumb}
                  />
                  <Text style={styles.sliderLabel}>20</Text>
                </View>
                <Text style={styles.sliderHelper}>
                  {t('askAlexandria.recommended')}
                </Text>
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleGenerateQuiz}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient colors={["#D4AF37", "#B8941F"]} style={styles.buttonGradient}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#1A2C5B" />
                  ) : (
                    <>
                      <FontAwesome5 name="robot" size={16} color="#1A2C5B" />
                      <Text style={styles.buttonText}>{t('askAlexandria.generateQuiz')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.motivation}>
                {t('askAlexandria.expandQuote')}
              </Text>
            </View>
          </ScrollView>
          </Animated.View>
        </LinearGradient>
        
    </SafeAreaView>
  );
}

// ✅ ENHANCED: Intelligent topic detection for free-form input
const detectSubjectFromTopic = (topicText) => {
  const topic = topicText.toLowerCase().trim();
  
  // Enhanced subject detection with comprehensive keywords
  const subjectMappings = {
    biology: [
      // Animals & Wildlife
      'animal', 'mammal', 'bird', 'fish', 'reptile', 'insect', 'penguin', 'dolphin', 'tiger', 'elephant',
      'mating', 'breeding', 'reproduction', 'ecosystem', 'habitat', 'species', 'evolution', 'genetics',
      'wildlife', 'marine', 'terrestrial', 'aquatic', 'predator', 'prey', 'migration', 'adaptation',
      
      // Biology Keywords  
      'biology', 'cell', 'dna', 'gene', 'organism', 'bacteria', 'virus', 'protein', 'enzyme',
      'photosynthesis', 'mitosis', 'meiosis', 'chromosome', 'nucleus', 'membrane', 'tissue',
      'organ', 'system', 'anatomy', 'physiology', 'taxonomy', 'classification', 'biodiversity'
    ],
    
    chemistry: [
      'chemistry', 'chemical', 'atom', 'molecule', 'element', 'compound', 'reaction', 'bond',
      'periodic', 'electron', 'proton', 'neutron', 'ion', 'acid', 'base', 'ph', 'solution',
      'catalyst', 'oxidation', 'reduction', 'organic', 'inorganic', 'polymer', 'formula'
    ],
    
    physics: [
      'physics', 'force', 'energy', 'motion', 'gravity', 'electricity', 'magnetism', 'wave',
      'light', 'heat', 'temperature', 'pressure', 'velocity', 'acceleration', 'momentum',
      'quantum', 'nuclear', 'atomic', 'electromagnetic', 'thermodynamics', 'optics'
    ],
    
    mathematics: [
      'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'trigonometry', 'statistics',
      'probability', 'equation', 'function', 'graph', 'derivative', 'integral', 'matrix',
      'number', 'prime', 'fraction', 'decimal', 'percentage', 'ratio', 'proportion'
    ],
    
    history: [
      'history', 'historical', 'war', 'revolution', 'ancient', 'medieval', 'empire', 'civilization',
      'dynasty', 'kingdom', 'republic', 'democracy', 'monarchy', 'conquest', 'battle', 'treaty',
      'century', 'era', 'period', 'renaissance', 'enlightenment', 'industrial', 'colonial'
    ],
    
    english: [
      'literature', 'grammar', 'writing', 'poetry', 'novel', 'story', 'essay', 'reading',
      'english', 'language', 'author', 'poet', 'character', 'plot', 'theme', 'metaphor',
      'simile', 'alliteration', 'prose', 'verse', 'rhetoric', 'composition', 'narrative'
    ],
    
    computer_science: [
      'programming', 'computer', 'algorithm', 'coding', 'software', 'hardware', 'database',
      'network', 'internet', 'website', 'application', 'code', 'python', 'java', 'javascript',
      'html', 'css', 'sql', 'api', 'framework', 'debugging', 'testing', 'cybersecurity'
    ],
    
    geography: [
      'geography', 'continent', 'country', 'city', 'ocean', 'mountain', 'river', 'desert',
      'climate', 'weather', 'population', 'culture', 'economy', 'natural', 'resource',
      'environment', 'topography', 'cartography', 'hemisphere', 'latitude', 'longitude'
    ],
    
    psychology: [
      'psychology', 'behavior', 'mental', 'cognitive', 'emotion', 'personality', 'development',
      'learning', 'memory', 'perception', 'motivation', 'social', 'therapy', 'disorder',
      'consciousness', 'unconscious', 'brain', 'neuroscience', 'psychiatry'
    ],
    
    economics: [
      'economics', 'economy', 'market', 'trade', 'business', 'finance', 'money', 'currency',
      'supply', 'demand', 'price', 'inflation', 'recession', 'gdp', 'investment', 'banking',
      'stock', 'entrepreneur', 'capitalism', 'socialism', 'globalization'
    ],
    
    art: [
      'art', 'painting', 'sculpture', 'drawing', 'design', 'color', 'composition', 'style',
      'artist', 'gallery', 'museum', 'renaissance', 'baroque', 'impressionism', 'modern',
      'contemporary', 'abstract', 'realistic', 'creative', 'aesthetic', 'visual'
    ],
    
    music: [
      'music', 'song', 'melody', 'harmony', 'rhythm', 'beat', 'instrument', 'piano', 'guitar',
      'violin', 'drums', 'orchestra', 'band', 'composer', 'musician', 'genre', 'classical',
      'jazz', 'rock', 'pop', 'folk', 'electronic', 'tempo', 'scale', 'chord'
    ]
  };
  
  // Score each subject based on keyword matches
  const scores = {};
  let maxScore = 0;
  let bestMatch = 'general';
  
  for (const [subject, keywords] of Object.entries(subjectMappings)) {
    let score = 0;
    for (const keyword of keywords) {
      if (topic.includes(keyword)) {
        // Give higher score for exact matches and longer keywords
        score += keyword.length > 4 ? 2 : 1;
      }
    }
    scores[subject] = score;
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = subject;
    }
  }
  
  // Log the detection for debugging
  logger.info(`🔍 Topic detection for "${topicText}":`, {
    bestMatch,
    maxScore,
    allScores: scores
  });
  
  // Return the best match (or 'general' if no clear match)
  return maxScore > 0 ? bestMatch : 'general';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8F4E3',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5E0',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    color: '#F8F4E3',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8F4E3',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  subjectInputWrapper: {
    position: 'relative',
  },
  clearSubjectInputButton: {
    position: 'absolute',
    right: 10,
    top: 12,
    padding: 4,
  },
  
  // ✅ NEW: Subject Selector Button Styles
  subjectSelectorButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  subjectSelectorButtonActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#D4AF37',
  },
  subjectSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectSelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#F8F4E3',
    marginLeft: 8,
    fontWeight: '500',
  },
  subjectSelectorTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  selectedSubjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.3)',
  },
  selectedSubjectText: {
    flex: 1,
    fontSize: 12,
    color: '#CBD5E0',
    marginLeft: 6,
  },
  clearSubjectButton: {
    padding: 4,
  },
  
  // Custom Dropdown Styles
  dropdownButton: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    color: '#F8F4E3',
  },
  dropdownPlaceholder: {
    color: '#CBD5E0',
    fontStyle: 'italic',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#2C467D',
    borderRadius: 20,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 244, 227, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8F4E3',
  },
  modalCloseButton: {
    padding: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 244, 227, 0.05)',
  },
  selectedOption: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#F8F4E3',
    marginLeft: 12,
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
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2C5B',
    marginLeft: 8,
  },
  motivation: {
    fontSize: 14,
    color: '#CBD5E0',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    zIndex: 1,
  },
  backButtonText: {
    color: '#F8F4E3',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    backgroundColor: '#744210',
    borderColor: '#F6E05E',
    borderWidth: 1,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    gap: 8,
  },
  freshnessText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F6E05E',
  },
  quickSuggestions: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickSuggestionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8F4E3',
    marginBottom: 8,
  },
  quickSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickSuggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  quickSuggestionText: {
    fontSize: 14,
    color: '#F8F4E3',
  },
  userCourseQuickChip: {
    borderWidth: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    borderColor: 'rgba(212, 175, 55, 0.6)',
    elevation: 2,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  detailsWindow: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8F4E3',
    marginBottom: 8,
  },
  detailsInput: {
    backgroundColor: 'rgba(248, 244, 227, 0.08)',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#F8F4E3',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // ✅ NEW: Validation Styles
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  inputValid: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  inputValidationContainer: {
    marginTop: 8,
  },
  validationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  validatingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '500',
  },
  validationSuccessText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  validationErrorText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '500',
    flex: 1,
  },

  // ✅ NEW: Hierarchical Course Selection Styles
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeToggle: {
    backgroundColor: '#D4AF37',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hierarchicalStep: {
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E0',
    marginBottom: 8,
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderColor: 'rgba(40, 167, 69, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  noCoursesMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderColor: 'rgba(243, 156, 18, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  noCoursesText: {
    fontSize: 12,
    color: '#F39C12',
    flex: 1,
    lineHeight: 16,
  },
});