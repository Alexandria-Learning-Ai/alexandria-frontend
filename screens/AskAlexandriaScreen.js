
// screens/AskAlexandriaScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { db, auth } from '../firebaseConfig';
import * as Animatable from 'react-native-animatable';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService';
import { useTranslation } from 'react-i18next';
import SafeBackButton from '../components/SafeBackButton';
import logger from '../utils/logger';
import AskAlexandriaHeader from '../components/ask-alexandria/AskAlexandriaHeader';
import QuizTypeSelector from '../components/ask-alexandria/QuizTypeSelector';
import DifficultySelector from '../components/ask-alexandria/DifficultySelector';
import QuestionsSlider from '../components/ask-alexandria/QuestionsSlider';
import SubjectInputField from '../components/ask-alexandria/SubjectInputField';
import CourseSelectionToggle from '../components/ask-alexandria/CourseSelectionToggle';
import ProfileCourseSelector from '../components/ask-alexandria/ProfileCourseSelector';
import HierarchicalCourseSelector from '../components/ask-alexandria/HierarchicalCourseSelector';
import GenerateQuizButton from '../components/ask-alexandria/GenerateQuizButton';
import AskAlexandriaFreshnessIndicator from '../components/ask-alexandria/AskAlexandriaFreshnessIndicator';
import { useAskAlexandriaQuiz } from '../hooks/useAskAlexandriaQuiz';
import { useHierarchicalCourses } from '../hooks/useHierarchicalCourses';
import { useSubjectValidation } from '../hooks/useSubjectValidation';
import { styles } from '../styles/AskAlexandriaScreenStyles';



export default function AskAlexandriaScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();

  // ✅ Custom Hooks
  const { loading, generateQuiz } = useAskAlexandriaQuiz();

  const {
    selectedSubject,
    setSelectedSubject,
    subjectValidation,
    validatingSubject,
    validateSubject,
    handleSubjectSelect,
    clearSelectedSubject
  } = useSubjectValidation();

  const {
    userCourses,
    hasProfileCourses,
    selectedCourse,
    setSelectedCourse,
    courseSelectionMode,
    setCourseSelectionMode,
    availableSubjects,
    selectedHierarchicalSubject,
    setSelectedHierarchicalSubject,
    availableCourses,
    selectedHierarchicalCourse,
    setSelectedHierarchicalCourse,
    handleHierarchicalSubjectSelect,
    handleHierarchicalCourseSelect
  } = useHierarchicalCourses();

  // 🎯 Streamlined state - only what we need
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [quizTypes, setQuizTypes] = useState(['all']); // Array for multi-select
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [details, setDetails] = useState(''); // Exam details for context

  // Modal states - simplified
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [quizTypeModalVisible, setQuizTypeModalVisible] = useState(false);
  const [difficultyModalVisible, setDifficultyModalVisible] = useState(false);
  const [hierarchicalCourseModalVisible, setHierarchicalCourseModalVisible] = useState(false);

  // UI state for freshness indicator
  const [uiState, setUiState] = useState({
    showFreshnessIndicator: false,
  });

  // Animation ref for smooth exit
  const containerAnim = useRef(new Animated.Value(1)).current;

  // Load user courses and handle route params
  useEffect(() => {
    // Smooth container animation on mount
    Animated.spring(containerAnim, {
      toValue: 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // ✅ ENHANCED: Handle hierarchical route params
    if (route?.params?.hierarchicalMode) {
      setCourseSelectionMode('hierarchical');
    }

    if (route?.params?.suggestedTopic) {
      setTopic(route.params.suggestedTopic);
    }

    // Handle chapter quiz initial prompt
    if (route?.params?.initialPrompt) {
      setTopic(route.params.initialPrompt);
      setSubject(route.params.initialPrompt);
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

    // Auto-generate quiz if requested (from exam practice or recommendations)
    if (route?.params?.autoGenerate) {
      // Set all parameters from route
      if (route.params.difficulty) {
        setDifficulty(route.params.difficulty);
      }
      if (route.params.numQuestions) {
        setNumQuestions(route.params.numQuestions);
      }
      if (route.params.details) {
        // Store details for quiz context
        logger.info('Auto-generating quiz with context:', route.params.details);
      }

      // Small delay to ensure state is updated before generating
      setTimeout(() => {
        if (handleGenerateQuiz) {
          logger.info('🚀 Auto-starting quiz generation from route params');
          handleGenerateQuiz();
        }
      }, 800); // 800ms delay for state to settle
    }
  }, [route?.params, handleGenerateQuiz]);
  // ✅ REMOVED: quizTypeOptions and difficultyOptions moved to respective components



  // Course selection handler
  const handleCourseSelect = (course) => {
    logger.info('📚 Course selected:', course);
    setSelectedCourse(course);
    setCourseModalVisible(false);
  };

  // CustomDropdown now imported from shared components

  // ✅ Generate quiz using custom hook
  const handleGenerateQuiz = async () => {
    const result = await generateQuiz({
      topic,
      subject,
      selectedCourse,
      quizTypes,
      difficulty,
      numQuestions,
      details,
      language: i18n.language,
      selectedHierarchicalSubject,
      selectedHierarchicalCourse,
      courseSelectionMode
    });

    // Handle freshness indicator
    if (result.showFreshnessIndicator) {
      setUiState(prev => ({ ...prev, showFreshnessIndicator: true }));
      setTimeout(() => setUiState(prev => ({ ...prev, showFreshnessIndicator: false })), 3000);
    }

    // Navigate to quiz if successful
    if (result.success && result.quizData) {
      // Check if this is a chapter quiz from book study mode
      const isChapterQuiz = route?.params?.context === 'chapter_quiz';
      const navigationParams = {
        quiz: result.quizData,
        source: isChapterQuiz ? 'book_study' : 'AskAlexandria',
        subject: topic.trim() || subject.trim(),
        metadata: result.metadata
      };

      // Pass through chapter context for book study quizzes
      if (isChapterQuiz && route?.params) {
        navigationParams.materialId = route.params.materialId;
        navigationParams.chapterId = route.params.chapterId;
        navigationParams.chapterIndex = route.params.chapterIndex;
      }

      navigation.navigate('QuizScreen', navigationParams);
    }
  };

  const renderSubjectInput = () => (
    <View>
      {/* Subject Input Field */}
      <SubjectInputField
        value={subject}
        onChange={(text) => {
          setSubject(text);
          setTopic(text);
          // Clear validation when user types
          if (subjectValidation) {
            validateSubject(''); // Clear by validating empty string
          }
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
          if (subject.trim() && !selectedSubject) {
            validateSubject(subject);
          }
        }}
        onClear={() => {
          setSubject('');
          setTopic('');
          setSelectedSubject(null);
        }}
        selectedSubject={selectedSubject}
        subjectValidation={subjectValidation}
        validatingSubject={validatingSubject}
        styles={styles}
        t={t}
      />

      {/* Course Selection Toggle */}
      <CourseSelectionToggle
        mode={courseSelectionMode}
        onModeChange={(mode) => {
          setCourseSelectionMode(mode);
          if (mode === 'profile') {
            setSelectedHierarchicalSubject(null);
            setSelectedHierarchicalCourse(null);
          } else {
            setSelectedSubject(null);
          }
        }}
        userCoursesCount={userCourses.length}
        availableSubjectsCount={availableSubjects.length}
        hasProfileCourses={hasProfileCourses}
        styles={styles}
      />

      {/* Profile Course Selector */}
      {courseSelectionMode === 'profile' && hasProfileCourses && (
        <ProfileCourseSelector
          userCourses={userCourses}
          selectedValue={selectedSubject?.name || ""}
          onSelect={(course) => {
            setSubject(course.name);
            setTopic(course.name);
            setSelectedSubject({
              key: course.key,
              name: course.name,
              type: 'profile_course',
              icon: course.icon,
              color: course.color,
              source: 'user_profile'
            });
            setSelectedCourse({
              name: course.name,
              code: course.code || course.key,
              icon: course.icon,
              color: course.color,
              source: 'profile'
            });
          }}
          modalVisible={courseModalVisible}
          setModalVisible={setCourseModalVisible}
          styles={styles}
        />
      )}

      {/* Hierarchical Course Selector */}
      {courseSelectionMode === 'hierarchical' && (
        <HierarchicalCourseSelector
          availableSubjects={availableSubjects}
          selectedSubject={selectedHierarchicalSubject}
          availableCourses={availableCourses}
          selectedCourse={selectedHierarchicalCourse}
          onSubjectSelect={handleHierarchicalSubjectSelect}
          onCourseSelect={handleHierarchicalCourseSelect}
          subjectModalVisible={courseModalVisible}
          setSubjectModalVisible={setCourseModalVisible}
          courseModalVisible={hierarchicalCourseModalVisible}
          setCourseModalVisible={setHierarchicalCourseModalVisible}
          HierarchicalSubjectService={HierarchicalSubjectService}
          styles={styles}
        />
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
  );

  return (
    <SafeAreaView style={[styles.container]}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
        
        {/* Freshness Indicator */}
        <AskAlexandriaFreshnessIndicator
          isVisible={uiState.showFreshnessIndicator}
          styles={styles}
        />

        <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.innerContainer}>
          <Animated.View style={[
            styles.animatedContainer,
            { 
              opacity: containerAnim,
              transform: [{ scale: containerAnim }]
            }
          ]}>
            <AskAlexandriaHeader
              navigation={navigation}
              containerAnim={containerAnim}
              styles={styles}
              t={t}
            />

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            <View style={styles.formContainer}>
              {/* Subject Input */}
              {renderSubjectInput()}

              {/* Exam Details Input - Always visible for additional context */}
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

              {/* Quiz Type Multi-Select */}
              <QuizTypeSelector
                values={quizTypes}
                onSelect={setQuizTypes}
                modalVisible={quizTypeModalVisible}
                setModalVisible={setQuizTypeModalVisible}
                styles={styles}
                t={t}
              />

              {/* Difficulty Dropdown */}
              <DifficultySelector
                value={difficulty}
                onSelect={setDifficulty}
                modalVisible={difficultyModalVisible}
                setModalVisible={setDifficultyModalVisible}
                styles={styles}
                t={t}
              />

              {/* Number of Questions */}
              <QuestionsSlider
                value={numQuestions}
                onChange={setNumQuestions}
                styles={styles}
                t={t}
              />

              {/* Generate Button */}
              <GenerateQuizButton
                onPress={handleGenerateQuiz}
                loading={loading}
                styles={styles}
                t={t}
              />
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

