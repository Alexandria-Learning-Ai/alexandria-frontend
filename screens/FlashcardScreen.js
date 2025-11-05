import React from 'react';
import { View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFlashcardState } from '../hooks/useFlashcardState';
import { useFlashcardAnimations } from '../hooks/useFlashcardAnimations';
import { useFlashcardSession } from '../hooks/useFlashcardSession';
import { useFlashcardHandlers } from '../hooks/useFlashcardHandlers';
import { styles } from '../styles/FlashcardScreenStyles';
import ErrorBoundary from '../components/ErrorBoundary';

// Import extracted components
import FlashcardHeader from '../components/flashcard/FlashcardHeader';
import SessionStatsBar from '../components/flashcard/SessionStatsBar';
import FlashcardProgressBar from '../components/flashcard/FlashcardProgressBar';
import FlashcardFront from '../components/flashcard/FlashcardFront';
import FlashcardBack from '../components/flashcard/FlashcardBack';
import SessionSettingsModal from '../components/flashcard/SessionSettingsModal';

const FlashcardScreen = ({ navigation, route }) => {
  // State management hook
  const {
    flashcards,
    currentCardIndex,
    isFlipped,
    sessionStats,
    showingAnswer,
    studyMode,
    isDarkMode,
    showSessionSettings,
    cardStartTime,
    studyStreak,
    currentCard,
    themeColors,
    setFlashcards,
    setCurrentCardIndex,
    setIsFlipped,
    setSessionStats,
    setShowingAnswer,
    setStudyMode,
    setIsDarkMode,
    setShowSessionSettings,
    setCardStartTime,
    setStudyStreak,
  } = useFlashcardState();

  // Animation hook
  const {
    slideAnimation,
    scaleAnimation,
    progressAnimation,
    frontInterpolate,
    backInterpolate,
    animateFlip,
    animateSlideNext,
    animateSlidePrevious,
    animateSlideReset,
    flipAnimation,
  } = useFlashcardAnimations({
    currentCardIndex,
    flashcardsLength: flashcards.length,
  });

  // Session management hook
  const {
    loadFlashcards,
    logActivity,
  } = useFlashcardSession({
    routeParams: route?.params,
    setFlashcards,
    setStudyMode,
    setStudyStreak,
    setIsDarkMode,
    setSessionStats,
    sessionStats,
    progressAnimation,
    currentCardIndex,
    navigation,
  });

  // Handlers hook
  const {
    flipCard,
    handleAnswerQuality,
    shareSessionResults,
    panResponder,
  } = useFlashcardHandlers({
    flashcards,
    currentCardIndex,
    isFlipped,
    showingAnswer,
    cardStartTime,
    sessionStats,
    studyMode,
    setIsFlipped,
    setShowingAnswer,
    setCurrentCardIndex,
    setCardStartTime,
    setSessionStats,
    animateFlip,
    animateSlideNext,
    animateSlidePrevious,
    animateSlideReset,
    slideAnimation,
    flipAnimation,
    logActivity,
    navigation,
  });

  // Return null if no card available
  if (!currentCard) return null;

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1A2C5B', '#2A3F73'] : ['#F8F4E3', '#E8E0C8']}
      style={styles.container}
    >
      {/* Header */}
      <FlashcardHeader
        studyMode={studyMode}
        currentCardIndex={currentCardIndex}
        totalCards={flashcards.length}
        themeColors={themeColors}
        onShowSettings={() => setShowSessionSettings(true)}
      />

      {/* Session Stats Bar */}
      <SessionStatsBar
        currentCard={currentCard}
        sessionStats={sessionStats}
        studyStreak={studyStreak}
        themeColors={themeColors}
      />

      {/* Progress Bar */}
      <FlashcardProgressBar
        progressAnimation={progressAnimation}
        sessionStats={sessionStats}
        themeColors={themeColors}
      />

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              transform: [
                { translateX: slideAnimation },
                { scale: scaleAnimation }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Card Front */}
          <FlashcardFront
            card={currentCard}
            themeColors={themeColors}
            isDarkMode={isDarkMode}
            onFlip={flipCard}
            frontInterpolate={frontInterpolate}
            showingAnswer={showingAnswer}
          />

          {/* Card Back */}
          <FlashcardBack
            card={currentCard}
            themeColors={themeColors}
            onAnswerQuality={handleAnswerQuality}
            backInterpolate={backInterpolate}
            showingAnswer={showingAnswer}
          />
        </Animated.View>
      </View>

      {/* Session Settings Modal */}
      <SessionSettingsModal
        visible={showSessionSettings}
        isDarkMode={isDarkMode}
        sessionStats={sessionStats}
        themeColors={themeColors}
        onClose={() => setShowSessionSettings(false)}
        onToggleDarkMode={() => {
          setIsDarkMode(!isDarkMode);
          AsyncStorage.setItem('flashcard_preferences', JSON.stringify({ darkMode: !isDarkMode }));
        }}
        onViewAnalytics={() => {
          setShowSessionSettings(false);
          navigation.navigate('ProgressTracker', { tab: 'flashcards' });
        }}
        onShareProgress={() => shareSessionResults(sessionStats, Math.round((sessionStats.correct / sessionStats.studied) * 100))}
      />
    </LinearGradient>
  );
};

// ✨ Performance: Wrap with ErrorBoundary for better error handling
const FlashcardScreenWithErrorBoundary = (props) => (
  <ErrorBoundary>
    <FlashcardScreen {...props} />
  </ErrorBoundary>
);

export default FlashcardScreenWithErrorBoundary;
