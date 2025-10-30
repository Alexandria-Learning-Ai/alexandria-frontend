// Enhanced ResultsScreen.js with Tier-Based AI Explanations
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Appearance,
  Modal,
  TextInput,
} from 'react-native';
import AdvancedAnalyticsService from '../services/AdvancedAnalyticsService';
import { 
  AchievementCelebrationModal, 
  InsightsDisplay, 
  AchievementSummaryCard 
} from '../components/AchievementComponents';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';
import PropTypes from 'prop-types';
import CoachMessage from '../components/CoachMessage';
import { API_BASE_URL } from '../config/api';
import { useTranslation } from 'react-i18next';
import { CoachUtils } from '../utils/CoachUtils'; 
import { auth } from '../firebaseConfig';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';
import { QuizHistoryManager } from '../services/QuizHistoryManager';
import { SubjectProgressService } from '../services/SubjectProgressService';
import UnifiedNotificationService from '../utils/UnifiedNotificationService';
import { EnhancedExplanationService } from '../services/EnhancedExplanationService'; // 🚀 NEW
import { FlashcardService } from '../services/FlashcardService'; // 🚀 NEW: Flashcard integration
import AISubjectClassificationService from '../services/AISubjectClassificationService'; // ✅ NEW: AI subject classification
import HierarchicalSubjectService from '../services/HierarchicalSubjectService'; // ✅ NEW: Hierarchical subject classification
import { BackendSyncService } from '../services/BackendSyncService'; // ✅ NEW: Backend data sync
import SafeBackButton from '../components/SafeBackButton';
import { LinearGradient } from 'expo-linear-gradient';
import logger from '../utils/logger';
import ResultsHeader from '../components/results/ResultsHeader';
import ActionButtonGroup from '../components/results/ActionButtonGroup';
import QuestionResultCard from '../components/results/QuestionResultCard';
import DetailedResultsList from '../components/results/DetailedResultsList';
import ErrorBoundary from '../components/ErrorBoundary';
import { resultsConfig } from '../config/resultsConfig';
import WeaknessInsightCard from '../components/results/WeaknessInsightCard';
import AnalyticsSection from '../components/results/AnalyticsSection';
import UsageStatsCard from '../components/results/UsageStatsCard';
import ScoreCard from '../components/results/ScoreCard';
import AIExplanationsSection from '../components/results/AIExplanationsSection';
import HierarchicalSubjectDisplay from '../components/results/HierarchicalSubjectDisplay';
import SubjectCorrectionModal from '../components/results/SubjectCorrectionModal';
import {
  getDisplayAnswerText,
  getMotivationalMessage,
  getProgressGradientColors,
  getPerformanceLevelColor,
  getPerformanceEmoji
} from '../utils/answerFormatters';
import {
  generateLocalExplanation,
  generateContextualExplanation,
  generateIncorrectChoiceReason,
  generateTrueFalseReason,
  generateOpenEndedExplanation,
  generateCategorySpecificTip,
  determineQuestionCategory
} from '../utils/explanationGenerators';
import {
  generateLocalCoachMessage,
  generateTopicSpecificTip
} from '../utils/coachMessageGenerators';
import {
  generateShareableQuizData,
  generateDeepLink,
  generateAppDownloadText,
  generateShareableText,
  shareToSocial,
  fallbackShare,
  shareQuizChallenge,
  copyToClipboard,
  copyResultsOnly,
  showShareOptionsWithChallenge
} from '../utils/shareUtilities';
import { useQuizAnalytics } from '../hooks/useQuizAnalytics';
import { useSaveQuiz } from '../hooks/api/useSaveQuiz'; // ✅ NEW: React Query-based save hook
import { useResultsState } from '../hooks/useResultsState';
import { useSubjectClassification } from '../hooks/useSubjectClassification';
import { useExplanations } from '../hooks/useExplanations';
import { useResultsActions } from '../hooks/useResultsActions';
import { styles, newAnalyticsStyles, lightStyles, darkStyles } from '../styles/ResultsScreenStyles';


// Optional imports with fallbacks
let Share, Clipboard;

try {
  Share = require('react-native-share');
  if (Share.default) {
    Share = Share.default;
  }
} catch (e) {
  logger.warn('react-native-share not available:', e.message);
  Share = null;
}

try {
  Clipboard = require('@react-native-clipboard/clipboard');
  if (Clipboard.default) {
    Clipboard = Clipboard.default;
  }
} catch (e) {
  logger.warn('@react-native-clipboard/clipboard not available:', e.message);
  try {
    Clipboard = require('@react-native-community/clipboard');
    if (Clipboard.default) {
      Clipboard = Clipboard.default;
    }
  } catch (e2) {
    logger.warn('No clipboard package available:', e2.message);
    Clipboard = null;
  }
}

// Use CONFIG from config file
const CONFIG = resultsConfig;

// ✅ REMOVED: Helper functions now imported from utils/answerFormatters.ts
// - getDisplayAnswerText
// - getMotivationalMessage
// - getProgressGradientColors

const ResultsScreen = ({ route, navigation }) => {
  // Safely handle translation with fallbacks
  let t = null;
  try {
    const { t: translator } = useTranslation();
    t = translator;
  } catch (error) {
    logger.warn('Translation hook not available, using fallbacks:', error);
    t = null;
  }
  // Validate route params
  if (!route?.params) {
    Alert.alert('Quiz Not Found', 'We couldn\'t load your quiz results. Please try again.');
    navigation.navigate('Home');
    return null;
  }

  const { questions = [], userAnswers = {}, score = 0, metadata = {} } = route.params;

  // ✅ USE HOOKS: State management
  const {
    isDarkMode,
    setIsDarkMode,
    showExplanations,
    setShowExplanations,
    explanations,
    setExplanations,
    loadingExplanations,
    setLoadingExplanations,
    loadingSpecificExplanation,
    setLoadingSpecificExplanation,
    animatedPercentageValue,
    setAnimatedPercentageValue,
    coachMessage,
    setCoachMessage,
    showCoachTips,
    setShowCoachTips,
    loadingCoachMessage,
    setLoadingCoachMessage,
    showCoachCard,
    setShowCoachCard,
    refreshing,
    setRefreshing,
    showAchievementModal,
    setShowAchievementModal,
    usageStats,
    setUsageStats,
    showSubjectCorrection,
    setShowSubjectCorrection,
    selectedSubject,
    setSelectedSubject,
    submittingCorrection,
    setSubmittingCorrection,
    scoreAnimation,
    celebrationScale,
    isMountedRef,
    cancelTokenSource,
  } = useResultsState();

  // Calculate performance metrics
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const correctCount = score;
  const incorrectCount = totalQuestions - score;

  // ✅ USE HOOKS: Subject classification
  const { determineCategoryHierarchical, determineCategory, determineCategorySync } = useSubjectClassification();

  // ✅ USE HOOKS: Explanations and coach messages
  const { generateAllEnhancedExplanations, generateCoachMessage } = useExplanations();

  // ✅ USE HOOKS: Quiz actions
  const {
    saveQuizForLater,
    handleSubjectCorrection,
    showWeaknessInsightsAlert,
    requestFocusQuiz,
    requestCoachingTip,
  } = useResultsActions();

  // Helper function for normalizing answers (used throughout component)
  const normalizeAnswer = (answer) => {
    if (answer === null || answer === undefined) return '';
    if (typeof answer === 'boolean') return answer ? 'true' : 'false';
    return String(answer).trim().toLowerCase();
  };

  // Get incorrect questions for explanations
  const incorrectQuestions = questions.filter(q => {
    const userAns = userAnswers[q?.id];
    // Use normalized comparison as a fallback check
    const normalizedMatch = normalizeAnswer(userAns) === normalizeAnswer(q?.correctAnswer);
    return !q?.isCorrect && !normalizedMatch;
  });

  // Helper functions
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Excellent', icon: 'trophy', color: '#D4AF37' };
    if (percentage >= 80) return { level: 'Great', icon: 'star', color: '#28a745' };
    if (percentage >= 70) return { level: 'Good', icon: 'thumbs-up', color: '#17a2b8' };
    if (percentage >= 60) return { level: 'Fair', icon: 'check-circle', color: '#ffc107' };
    return { level: 'Keep Learning', icon: 'book', color: '#dc3545' };
  };

  const performance = getPerformanceLevel();

  // ✅ NEW: Use custom hooks for analytics and saving
  const {
    weaknessAnalysis,
    analyticsAchievements,
    analyticsInsights,
    userProfile,
    loadingAnalytics,
    setWeaknessAnalysis,
    setAnalyticsAchievements,
    setAnalyticsInsights,
    setUserProfile,
    setLoadingAnalytics,
    handleQuizCompletion: handleQuizCompletionFromHook,
  } = useQuizAnalytics({
    questions,
    userAnswers,
    score,
    totalQuestions,
    correctCount,
    incorrectCount,
    percentage,
    metadata,
  });

  // ✅ NEW: React Query-based quiz saving with automatic offline queue
  const {
    saveQuiz: saveQuizMutation,
    saveQuizAsync,
    isSaving: savingQuiz,
    isError: saveError,
    error: saveErrorDetails,
    isSuccess: saveSuccess,
  } = useSaveQuiz();

  // ✅ REMOVED: Individual explanation modal functions - now using unified AI Analysis section

  // ✅ UPDATED: Format quiz results for SubjectProgressService
  const formatQuizResultsForSubjectProgress = async () => {
    logger.info('📊 Formatting quiz results for subject tracking...');

    // ✅ HIERARCHICAL: Use enhanced subject detection with course-level information
    const hierarchicalResult = await determineCategoryHierarchical(metadata, [], questions);
    logger.info(`🎯 Detected hierarchy:`, {
      subject: hierarchicalResult.subject,
      course: hierarchicalResult.course,
      topic: hierarchicalResult.topic,
      confidence: hierarchicalResult.confidence,
      from_metadata: { subject: metadata?.subject, topic: metadata?.topic, category: metadata?.category }
    });

    return {
      answers: questions.map((question, index) => ({
        question: question.text || question.questionText || '',
        userAnswer: userAnswers[question.id],
        correctAnswer: question.correctAnswer,
        isCorrect: question.isCorrect === true,
        options: question.options || [],
        // ✅ HIERARCHICAL: Use enhanced category detection
        category: question.category || determineQuestionCategory(question.text || question.questionText || ''),
        subject: hierarchicalResult.subject,
        course: hierarchicalResult.course, // ✅ NEW: Add course field
        topic: hierarchicalResult.topic,   // ✅ NEW: Add topic field
        difficulty: question.difficulty || metadata.difficulty || 'medium',
        questionId: question.id,
        timeSpent: question.timeSpent || 30
      })),
      score: correctCount,
      totalQuestions: totalQuestions,
      category: hierarchicalResult.subject,
      subject: hierarchicalResult.subject,
      course: hierarchicalResult.course,     // ✅ NEW: Add course field
      topic: hierarchicalResult.topic,       // ✅ NEW: Add topic field
      difficulty: metadata.difficulty || 'medium',
      questions: questions,
      metadata: {
        completedAt: new Date().toISOString(),
        source: 'results_screen',
        subject: hierarchicalResult.subject,
        course: hierarchicalResult.course,   // ✅ NEW: Add course to metadata
        topic: hierarchicalResult.topic || metadata?.topic || metadata?.subject,
        title: metadata.title || `${hierarchicalResult.displayText} Quiz`,
        confidence: hierarchicalResult.confidence
      }
    };
  };

  // ✅ NEW: Wrapper function that uses the hook's logic
  const handleQuizCompletion = async () => {
    const formattedResults = await formatQuizResultsForSubjectProgress();
    const wrappedShowInsights = (analysis) => showWeaknessInsightsAlert({ analysis, navigation });
    await handleQuizCompletionFromHook(formattedResults, isMountedRef, wrappedShowInsights);
  };

  // ✅ REMOVED: Inline handleQuizCompletion logic moved to useQuizAnalytics hook
  // The following 120+ lines were extracted to hooks/useQuizAnalytics.ts

  // ✅ NEW: Save quiz using React Query mutation
  const saveQuizToHistory = async () => {
    try {
      if (!isMountedRef.current) return;

      logger.info('💾 Saving quiz with React Query...');

      const formattedResults = await formatQuizResultsForSubjectProgress();

      // Prepare quiz data for the new API
      const quizData = {
        questions: questions,
        userAnswers: userAnswers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        metadata: {
          ...metadata,
          ...formattedResults.metadata,
          subject: formattedResults.subject,
          course: formattedResults.course,
          topic: formattedResults.topic,
        },
      };

      // Use async mutation for better error handling
      await saveQuizAsync(quizData);

      logger.info('✅ Quiz saved successfully via React Query');

      // Show success notification
      if (isMountedRef.current) {
        const incorrectQuestions = questions.filter(q => {
          const userAns = userAnswers[q?.id];
          const normalizedMatch = normalizeAnswer(userAns) === normalizeAnswer(q?.correctAnswer);
          return !q?.isCorrect && !normalizedMatch;
        });

        if (incorrectQuestions.length > 0) {
          Alert.alert(
            'Quiz Saved! 📊📚',
            `Your results have been saved and will sync automatically. ${incorrectQuestions.length} flashcards will be created from your mistakes!`
          );
        } else {
          Alert.alert('Quiz Saved! 📊', 'Perfect score! Your results have been saved.');
        }
      }
    } catch (error) {
      logger.error('❌ Error saving quiz:', error);
      if (isMountedRef.current) {
        Alert.alert(
          'Save Error',
          'Failed to save quiz. Your results are queued and will sync when online.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // ✅ REMOVED: Inline saveQuizToHistory logic moved to useQuizSaving hook
  // The following 140+ lines were extracted to hooks/useQuizSaving.ts

  // ✅ REMOVED: Subject classification functions moved to useSubjectClassification hook
  // - determineCategoryHierarchical
  // - determineCategory
  // - determineCategorySync

  // ✅ REMOVED: showWeaknessInsightsAlert moved to useResultsActions hook
  // ✅ REMOVED: requestFocusQuiz moved to useResultsActions hook

  // ✅ REMOVED: generateLocalExplanation - moved to utils/explanationGenerators.ts

  // ✅ REMOVED: generateContextualExplanation - moved to utils/explanationGenerators.ts

  // ✅ REMOVED: generateIncorrectChoiceReason - moved to utils/explanationGenerators.ts

  // ✅ REMOVED: generateTrueFalseReason - moved to utils/explanationGenerators.ts

  // ✅ REMOVED: generateOpenEndedExplanation - moved to utils/explanationGenerators.ts

  // ✅ REMOVED: determineQuestionCategory - moved to utils/explanationGenerators.ts

  // ✅ REMOVED: generateCategorySpecificTip - moved to utils/explanationGenerators.ts

  // ✅ REMOVED: generateShareableQuizData - moved to utils/shareUtilities.ts

  // ✅ REMOVED: generateDeepLink - moved to utils/shareUtilities.ts

  // ✅ REMOVED: generateAppDownloadText - moved to utils/shareUtilities.ts

  // ✅ REMOVED: generateShareableText - moved to utils/shareUtilities.ts

  // ✅ REMOVED: shareToSocial - moved to utils/shareUtilities.ts

  // ✅ REMOVED: fallbackShare - moved to utils/shareUtilities.ts

  // ✅ REMOVED: shareQuizChallenge - moved to utils/shareUtilities.ts

  // ✅ REMOVED: saveQuizForLater moved to useResultsActions hook

  // ✅ REMOVED: copyToClipboard - moved to utils/shareUtilities.ts

  // ✅ REMOVED: showShareOptionsWithChallenge - moved to utils/shareUtilities.ts

  // ✅ REMOVED: copyResultsOnly - moved to utils/shareUtilities.ts

  // ✅ WRAPPER: Call hook-based explanation generation
  const handleGenerateExplanations = async () => {
    await generateAllEnhancedExplanations({
      incorrectQuestions,
      questions,
      userAnswers,
      metadata,
      setExplanations,
      setShowExplanations,
      setLoadingExplanations,
      setUsageStats,
      isMountedRef,
    });
  };

  // ✅ WRAPPER: Call hook-based coach message generation
  const handleGenerateCoachMessage = async () => {
    await generateCoachMessage({
      score,
      totalQuestions,
      percentage,
      questions,
      metadata,
      determineCategorySync,
      setCoachMessage,
      setLoadingCoachMessage,
      isMountedRef,
      CONFIG,
    });
  };

  // ✅ REMOVED: generateLocalCoachMessage - moved to utils/coachMessageGenerators.ts

  // Theme listener
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  // ✅ IMPROVED: Main effect with better error handling and logging
  useEffect(() => {
    logger.info('📊 ResultsScreen useEffect triggered');
    
    // Animate score counter
    const listener = scoreAnimation.addListener(({ value }) => {
      if (isMountedRef.current) {
        setAnimatedPercentageValue(Math.round(value));
      }
    });

    Animated.timing(scoreAnimation, {
      toValue: percentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Celebration animation
    if (percentage >= 80) {
      Animated.sequence([
        Animated.delay(800),
        Animated.spring(celebrationScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      celebrationScale.setValue(1);
    }

    // Generate AI Coach message and run analysis
    const runPostQuizAnalysis = async () => {
      try {
        if (CONFIG.ENABLE_AI_COACH) {
          await handleGenerateCoachMessage();
        }

        // Run completion analysis after a brief delay
        setTimeout(() => {
          handleQuizCompletion();
        }, 1000);

      } catch (error) {
        logger.error('❌ Error in post-quiz analysis:', error);
      }
    };

    runPostQuizAnalysis();

    return () => {
      isMountedRef.current = false;
      scoreAnimation.removeListener(listener);
      cancelTokenSource.current.cancel('Component unmounted');
    };
  }, [scoreAnimation, celebrationScale, percentage]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setShowExplanations(false);
      setExplanations({});
      setCoachMessage(null);
      setShowCoachTips(false);
      if (CONFIG.ENABLE_AI_COACH) {
        await handleGenerateCoachMessage();
      }
    } catch (error) {
      logger.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const currentThemeStyles = isDarkMode ? darkStyles : lightStyles;
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

  // ✅ MIGRATED: Save quiz for later using React Query (same as main save)
  const handleSaveQuizForLater = async () => {
    try {
      if (!isMountedRef.current) return;

      logger.info('💾 Saving quiz for later review with React Query...');

      const formattedResults = await formatQuizResultsForSubjectProgress();

      // Prepare quiz data for the new API
      const quizData = {
        questions: questions,
        userAnswers: userAnswers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        metadata: {
          ...metadata,
          ...formattedResults.metadata,
          subject: formattedResults.subject,
          course: formattedResults.course,
          topic: formattedResults.topic,
          savedForLater: true, // Mark as "saved for later"
        },
      };

      // Use async mutation for better error handling
      await saveQuizAsync(quizData);

      logger.info('✅ Quiz saved for later via React Query');

      // Show success with navigation option
      if (isMountedRef.current) {
        Alert.alert(
          '✅ Quiz Saved!',
          'This quiz has been saved to your collection. You can view all your saved quizzes from the home screen.',
          [
            { text: 'View Saved Quizzes', onPress: () => navigation.navigate('QuizHistory') },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      logger.error('❌ Error saving quiz for later:', error);
      if (isMountedRef.current) {
        Alert.alert(
          'Save Error',
          'Failed to save quiz. Your results are queued and will sync when online.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleRequestFocusQuiz = async (weakness) => {
    await requestFocusQuiz({ weakness, navigation });
  };

  const handleSubjectCorrectionSubmit = async (correctedSubject) => {
    await handleSubjectCorrection({
      correctedSubject,
      weaknessAnalysis,
      metadata,
      setSubmittingCorrection,
      setShowSubjectCorrection,
    });
  };

  const handleRequestCoachingTip = async (topic) => {
    await requestCoachingTip({
      topic,
      setCoachMessage,
      setShowCoachTips,
      setLoadingCoachMessage,
    });
  };

  // ✅ REMOVED: getPerformanceLevelColor moved to utils/answerFormatters.ts
  // ✅ REMOVED: requestCoachingTip moved to useResultsActions hook
  // ✅ REMOVED: generateTopicSpecificTip - moved to utils/coachMessageGenerators.ts

  const speakCoachMessage = message => {
    if (!CONFIG.ENABLE_VOICE_FEEDBACK) return;
    Alert.alert('Voice Feature', 'Text-to-speech would read the coach message here.');
  };

  // ✅ IMPROVED: Components with better error handling and fallbacks
  // ✅ EXTRACTED: Header component moved to components/results/ResultsHeader.tsx

  // ✅ EXTRACTED: WeaknessInsightCard component moved to components/results/WeaknessInsightCard.tsx
  // ✅ EXTRACTED: ScoreCard component (uses external ScoreCard.tsx from components/results/)
  // ✅ EXTRACTED: AnalyticsSection component moved to components/results/AnalyticsSection.tsx
  // ✅ EXTRACTED: UsageStatsCard component moved to components/results/UsageStatsCard.tsx

  // ✅ EXTRACTED: QuestionResult component moved to components/results/QuestionResultCard.tsx

  // ✅ EXTRACTED: ActionButtons component moved to components/results/ActionButtonGroup.tsx

  return (
    <ErrorBoundary>
      <View style={[styles.container, currentThemeStyles.container]}>
        <StatusBar barStyle={statusBarStyle} />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
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
          <ResultsHeader
            performance={performance}
            celebrationScale={celebrationScale}
            themeStyles={currentThemeStyles}
          />
          <ScoreCard
            score={score}
            totalQuestions={totalQuestions}
            percentage={percentage}
            animatedPercentageValue={animatedPercentageValue}
            performance={performance}
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            metadata={metadata}
            currentThemeStyles={currentThemeStyles}
            isDarkMode={isDarkMode}
          />
          <AnalyticsSection
            loadingAnalytics={loadingAnalytics}
            analyticsAchievements={analyticsAchievements}
            analyticsInsights={analyticsInsights}
            userProfile={userProfile}
            metadata={metadata}
            questions={questions}
            isDarkMode={isDarkMode}
            themeStyles={currentThemeStyles}
            HierarchicalSubjectDisplay={HierarchicalSubjectDisplay}
          />
          <UsageStatsCard
            usageStats={usageStats}
            themeStyles={currentThemeStyles}
          />
          <WeaknessInsightCard
            weaknessAnalysis={weaknessAnalysis}
            onRequestFocusQuiz={handleRequestFocusQuiz}
            onShowSubjectCorrection={() => setShowSubjectCorrection(true)}
            themeStyles={currentThemeStyles}
          />

          <DetailedResultsList
            questions={questions}
            userAnswers={userAnswers}
            themeStyles={currentThemeStyles}
          />

          {/* ✅ EXTRACTED: AI Analysis Section moved to components/results/AIExplanationsSection.tsx */}
          <AIExplanationsSection
            showExplanations={showExplanations}
            explanations={explanations}
            questions={questions}
            userAnswers={userAnswers}
            themeStyles={currentThemeStyles}
          />
          
          {showCoachCard && (
            <CoachMessage
              currentScore={score}
              totalQuestions={totalQuestions}
              quizCategory={determineCategorySync(metadata, [], questions)}
              isDarkMode={isDarkMode}
              style={{ marginHorizontal: 20, marginVertical: 10 }}
              onCoachTap={(coachMessage) => {
                logger.info('Coach message:', coachMessage);
              }}
            />
          )}

          <ActionButtonGroup
            showExplanations={showExplanations}
            loadingExplanations={loadingExplanations}
            onToggleExplanations={() => {
              if (showExplanations) {
                setShowExplanations(false);
              } else {
                handleGenerateExplanations();
              }
            }}
            savingQuiz={savingQuiz}
            onSaveQuiz={saveQuizToHistory}
            enableShareFeatures={CONFIG.ENABLE_SHARE_FEATURES}
            onShowShareOptions={showShareOptionsWithChallenge}
            onSaveQuizForLater={handleSaveQuizForLater}
            navigation={navigation}
            themeStyles={currentThemeStyles}
          />
        </ScrollView>

        <AchievementCelebrationModal
        visible={showAchievementModal}
        achievements={analyticsAchievements}
        onClose={() => setShowAchievementModal(false)}
        isDarkMode={isDarkMode}
        />

        {/* ✅ REMOVED: Individual explanation modals - now using unified AI Analysis section */}
        
        {/* 🚀 NEW: Subject Correction Modal */}
        <SubjectCorrectionModal
          visible={showSubjectCorrection}
          onClose={() => setShowSubjectCorrection(false)}
          currentSubject={weaknessAnalysis?.weaknesses?.[0]?.topic || 'Unknown'}
          onCorrectSubject={handleSubjectCorrectionSubmit}
          isDarkMode={isDarkMode}
          submitting={submittingCorrection}
        />
      </View>
    </ErrorBoundary>
  );
};

// ✅ EXTRACTED: HierarchicalSubjectDisplay moved to components/results/HierarchicalSubjectDisplay.tsx

// ✅ EXTRACTED: SubjectCorrectionModal moved to components/results/SubjectCorrectionModal.tsx

// PropTypes
ResultsScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      questions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          text: PropTypes.string,
          questionText: PropTypes.string,
          type: PropTypes.string,
          correctAnswer: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
          options: PropTypes.arrayOf(
            PropTypes.shape({
              label: PropTypes.string,
              text: PropTypes.string,
              value: PropTypes.string,
              isCorrect: PropTypes.bool,
            })
          ),
          isCorrect: PropTypes.bool,
          keywords: PropTypes.arrayOf(PropTypes.string),
          formula: PropTypes.string,
          solution_steps: PropTypes.arrayOf(PropTypes.string),
          timeSpent: PropTypes.number,
          attempts: PropTypes.number,
          confidence: PropTypes.number,
        })
      ),
      userAnswers: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.arrayOf(PropTypes.string)])
      ),
      score: PropTypes.number,
      metadata: PropTypes.shape({
        title: PropTypes.string,
        category: PropTypes.string,
        subject: PropTypes.string,
        difficulty: PropTypes.string,
        startTime: PropTypes.string,
        interruptions: PropTypes.number,
        uploadMethod: PropTypes.string,
        fileType: PropTypes.string,
        processingTime: PropTypes.number,
        questionGenerationMethod: PropTypes.string,
      }),
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

// ✅ REMOVED: Inline styles moved to styles/ResultsScreenStyles.ts (1,034 lines extracted)

export default ResultsScreen;
