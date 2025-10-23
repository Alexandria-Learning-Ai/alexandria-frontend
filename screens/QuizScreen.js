// QuizScreen.js - Refactored Alexandria Version
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { auth } from '../firebaseConfig';
import { useTranslation } from 'react-i18next';
import NavigationHelper from '../utils/NavigationHelper';
import { getQuestionIcon } from '../utils/quizHelpers';
import { useQuizState } from '../hooks/useQuizState';
import { useQuizAnimations } from '../hooks/useQuizAnimations';
import { useQuizHandlers } from '../hooks/useQuizHandlers';
import { useQuizInitialization } from '../hooks/useQuizInitialization';
import { useChapterQuizResults } from '../hooks/useChapterQuizResults';
import { useBackHandler } from '../hooks/useBackHandler';
import { useToast } from '../hooks/useToast';
import { saveQuizProgress } from '../services/quizProgressService';
import logger from '../utils/logger';
import { styles } from '../styles/QuizScreenStyles';

// Import extracted components
import QuizLoadingScreen from '../components/quiz/QuizLoadingScreen';
import QuizStartScreen from '../components/quiz/QuizStartScreen';
import QuizHeader from '../components/quiz/QuizHeader';
import QuizProgress from '../components/quiz/QuizProgress';
import QuestionCard from '../components/quiz/QuestionCard';
import NavigationButtons from '../components/quiz/NavigationButtons';
import QuizResultsDisplay from '../components/quiz/QuizResultsDisplay';
import QuizExitConfirmModal from '../components/quiz/QuizExitConfirmModal';

const QuizScreen = ({ route, navigation }) => {
  const { t } = useTranslation();

  // State management with custom hook
  const {
    quizState,
    userAnswers,
    questionsState,
    quizMetadata,
    themeState,
    analyticsState,
    setQuizState,
    setUserAnswers,
    setQuestionsState,
    setQuizMetadata,
    setThemeState,
    setAnalyticsState,
  } = useQuizState();

  // Route params with enhanced validation
  const routeParams = useMemo(() => ({
    backendQuizData: route?.params?.quiz || [],
    metadata: route?.params?.metadata || {},
    sharedQuiz: route?.params?.sharedQuiz || null,
    isChallenge: route?.params?.isChallenge || false,
    challengeId: route?.params?.challengeId || null,
    quizId: route?.params?.quizId || null,
    source: route?.params?.source || 'quiz',
  }), [route?.params]);

  const userId = auth?.currentUser?.uid || 'default_user_id';

  // Toast notifications
  const { showToast } = useToast();

  // Exit confirmation modal state
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  // Chapter quiz results hook (for Book Study mode)
  const { saveQuizResult } = useChapterQuizResults(
    routeParams.source === 'book_study' ? route?.params?.materialId : null
  );

  // Memoized questions
  const questions = useMemo(() => questionsState, [questionsState]);
  const currentQuestion = useMemo(() =>
    questions[quizState.currentQuestionIndex],
    [questions, quizState.currentQuestionIndex]
  );

  // Animation hook
  const {
    progressAnim,
    scoreAnim,
    fadeAnim,
    scaleAnim,
    slideAnim,
    animateSelection,
    animateSubmission,
    animateQuestionTransition,
  } = useQuizAnimations({
    currentQuestionIndex: quizState.currentQuestionIndex,
    quizStarted: quizState.started,
    questionsLength: questions.length,
  });

  // Enhanced Alexandria-themed alert system
  const showAlexandriaAlert = (title, message, onConfirm = null, buttons = null) => {
    const defaultButtons = onConfirm
      ? [{ text: 'Understood', onPress: onConfirm }]
      : [{ text: 'Understood' }];

    Alert.alert(`🏛️ ${title}`, message, buttons || defaultButtons);
  };

  // Quiz initialization hook
  useQuizInitialization({
    routeParams,
    themeState,
    quizState,
    setQuizState,
    setQuizMetadata,
    setUserAnswers,
    setQuestionsState,
    setThemeState,
    showAlexandriaAlert,
    navigation,
    t,
    animationRefs: [progressAnim, scoreAnim, fadeAnim, scaleAnim, slideAnim],
  });

  // Quiz handlers hook
  const {
    handleSelectOption,
    handleShortAnswer,
    handleSubmit,
    navigateQuestion,
    handleStartQuiz,
  } = useQuizHandlers({
    quizState,
    userAnswers,
    questionsState,
    quizMetadata,
    routeParams,
    userId,
    setUserAnswers,
    setQuestionsState,
    setQuizState,
    setQuizMetadata,
    setAnalyticsState,
    animateSelection,
    animateSubmission,
    animateQuestionTransition,
    navigation,
    t,
    showAlexandriaAlert,
    saveChapterQuizResult: saveQuizResult, // Pass hook function for Book Study quizzes
  });

  // Enhanced retake handler
  const handleRetake = () => {
    const resetAnswers = {};
    questionsState.forEach((q) => {
      resetAnswers[q.id] = null;
    });

    setUserAnswers(resetAnswers);
    setQuizState({
      started: false,
      submitted: false,
      showResults: false,
      loading: false,
      currentQuestionIndex: 0,
      score: 0,
    });
    setQuizMetadata(prev => ({
      ...prev,
      startTime: Date.now(),
      completionTime: null
    }));

    // Reset animations
    [progressAnim, scoreAnim, fadeAnim, scaleAnim, slideAnim].forEach(anim => {
      anim.setValue(anim === fadeAnim ? 1 : 0);
    });
  };

  // Handle exit button press - show modal if quiz is in progress
  const handleExitPress = useCallback(() => {
    // If quiz hasn't started or is already submitted, just go back
    if (!quizState.started || quizState.submitted) {
      NavigationHelper.safeGoBack(navigation);
      return;
    }

    // If quiz is in progress, show exit confirmation modal
    setShowExitModal(true);
  }, [quizState.started, quizState.submitted, navigation]);

  // Handle Save & Exit - save progress and navigate back
  const handleSaveAndExit = useCallback(async () => {
    try {
      setIsSavingProgress(true);
      logger.info('Saving quiz progress before exit', {
        quiz_id: routeParams.quizId,
        current_index: quizState.currentQuestionIndex,
        total_questions: questions.length,
      });

      // Calculate time spent
      const timeSpentSeconds = quizMetadata.startTime
        ? Math.floor((Date.now() - quizMetadata.startTime) / 1000)
        : 0;

      // Prepare save data
      const saveData = {
        quiz_id: routeParams.quizId || `temp-${Date.now()}`,
        quiz_source: routeParams.source,
        quiz_data: {
          title: quizMetadata.title,
          questions: questions,
          metadata: routeParams.metadata,
        },
        current_question_index: quizState.currentQuestionIndex,
        answers_so_far: userAnswers,
        time_spent_seconds: timeSpentSeconds,
        quiz_metadata: {
          isChallenge: routeParams.isChallenge,
          challengeId: routeParams.challengeId,
          materialId: route?.params?.materialId,
          sharedQuizId: routeParams.sharedQuiz?.id,
        },
      };

      // Call save API
      const response = await saveQuizProgress(saveData);

      logger.success('Quiz progress saved successfully', {
        progress_id: response.saved_progress_id,
        expires_at: response.expires_at,
      });

      // Show success toast
      showToast(
        'Progress Saved',
        'Your wisdom journey has been preserved. Continue later from where you left off.',
        'success',
        4000
      );

      // Close modal
      setShowExitModal(false);

      // Navigate back after a short delay to let toast show
      setTimeout(() => {
        NavigationHelper.safeGoBack(navigation);
      }, 500);
    } catch (error) {
      logger.error('Failed to save quiz progress', error);

      // Show error toast
      showToast(
        'Save Failed',
        error.message || 'Unable to save your progress. Please try again.',
        'error',
        4000
      );
    } finally {
      setIsSavingProgress(false);
    }
  }, [
    routeParams,
    quizState.currentQuestionIndex,
    quizMetadata,
    questions,
    userAnswers,
    route?.params?.materialId,
    navigation,
    showToast,
  ]);

  // Handle Exit Without Saving - discard progress and navigate back
  const handleExitWithoutSaving = useCallback(() => {
    logger.info('Exiting quiz without saving progress');

    // Show warning toast
    showToast(
      'Progress Discarded',
      'Your quiz progress was not saved.',
      'warning',
      3000
    );

    // Close modal
    setShowExitModal(false);

    // Navigate back
    NavigationHelper.safeGoBack(navigation);
  }, [navigation, showToast]);

  // Handle Cancel - close modal and continue quiz
  const handleCancelExit = useCallback(() => {
    logger.info('Exit cancelled, continuing quiz');
    setShowExitModal(false);
  }, []);

  // Android back button handler - show exit modal if quiz in progress
  useBackHandler(
    useCallback(() => {
      // Only intercept if quiz is in progress (not on start screen, not submitted)
      if (quizState.started && !quizState.submitted) {
        setShowExitModal(true);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    }, [quizState.started, quizState.submitted])
  );

  // Handle visual interaction
  const handleVisualInteraction = (questionId, data) => {
    setUserAnswers(prev => ({
      ...prev,
      [`${questionId}_visual`]: data
    }));
  };

  // Loading screen
  if (quizState.loading || analyticsState.processing) {
    return (
      <QuizLoadingScreen
        isVisible={true}
        message={analyticsState.processing
          ? 'Analyzing your wisdom journey...'
          : 'Preparing the sacred scrolls...'}
        subMessage={analyticsState.processing
          ? 'Unlocking insights and achievements'
          : "Alexandria's wisdom awaits"}
        themeColors={themeState.colors}
        isDarkMode={themeState.isDarkMode}
      />
    );
  }

  // Start screen
  if (!quizState.started) {
    return (
      <QuizStartScreen
        themeColors={themeState.colors}
        isDarkMode={themeState.isDarkMode}
        isChallenge={routeParams.isChallenge}
        quizTitle={quizMetadata.title}
        questionsCount={questions.length}
        questionTypes={[...new Set(questions.map((q) => q.type))]}
        onStart={handleStartQuiz}
        onBack={() => NavigationHelper.safeGoBack(navigation)}
        onNavigateHome={() => navigation.navigate('Home')}
        getQuestionIcon={getQuestionIcon}
        styles={styles}
        t={t}
      />
    );
  }

  // Quiz content (active quiz)
  return (
    <View style={styles.container}>
      {/* Header */}
      <QuizHeader
        title={routeParams.isChallenge ? (t('quiz.sacredTrial') || 'Sacred Trial') : (t('quiz.wisdomQuest') || 'Wisdom Quest')}
        subtitle={quizMetadata.title}
        isChallenge={routeParams.isChallenge}
        themeColors={themeState.colors}
        isDarkMode={themeState.isDarkMode}
        onBack={() => NavigationHelper.safeGoBack(navigation)}
        onExit={handleExitPress}
        translate={t}
      />

      {/* Progress */}
      <QuizProgress
        currentQuestionIndex={quizState.currentQuestionIndex}
        totalQuestions={questions.length}
        themeColors={themeState.colors}
        progressAnim={progressAnim}
        translate={t}
      />

      {/* Question Content */}
      <ScrollView
        style={styles.questionScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {quizState.submitted ? (
          // Show all questions with results
          questionsState.map((q, index) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={index}
              userAnswer={userAnswers[q.id]}
              isSubmitted={true}
              themeColors={themeState.colors}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              scaleAnim={scaleAnim}
              onSelectOption={handleSelectOption}
              onShortAnswer={handleShortAnswer}
              onVisualInteraction={handleVisualInteraction}
              translate={t}
            />
          ))
        ) : (
          // Show current question
          currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              index={quizState.currentQuestionIndex}
              userAnswer={userAnswers[currentQuestion.id]}
              isSubmitted={false}
              themeColors={themeState.colors}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              scaleAnim={scaleAnim}
              onSelectOption={handleSelectOption}
              onShortAnswer={handleShortAnswer}
              onVisualInteraction={handleVisualInteraction}
              translate={t}
            />
          )
        )}
      </ScrollView>

      {/* Navigation/Results */}
      {!quizState.submitted ? (
        <NavigationButtons
          currentQuestionIndex={quizState.currentQuestionIndex}
          totalQuestions={questions.length}
          themeColors={themeState.colors}
          onPrevious={() => navigateQuestion('prev', questions.length)}
          onNext={() => navigateQuestion('next', questions.length)}
          onSubmit={handleSubmit}
          isChallenge={routeParams.isChallenge}
          translate={t}
          hasAnswered={currentQuestion ? userAnswers[currentQuestion.id] != null && userAnswers[currentQuestion.id] !== '' : false}
          allQuestionsAnswered={questions.every(q => userAnswers[q.id] != null && userAnswers[q.id] !== '')}
        />
      ) : (
        <QuizResultsDisplay
          score={quizState.score}
          totalQuestions={questions.length}
          isChallenge={routeParams.isChallenge}
          themeColors={themeState.colors}
          onRetake={handleRetake}
          styles={styles}
          t={t}
        />
      )}

      {/* Exit Confirmation Modal */}
      <QuizExitConfirmModal
        visible={showExitModal}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSaving={handleExitWithoutSaving}
        onCancel={handleCancelExit}
        isSaving={isSavingProgress}
      />
    </View>
  );
};

export default QuizScreen;
