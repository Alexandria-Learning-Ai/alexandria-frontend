/**
 * useFlashcardHandlers Hook
 * Handles user interactions with flashcards
 */

import { useCallback } from 'react';
import { Alert, Platform, Vibration, Share, PanResponder, Dimensions } from 'react-native';
import { auth } from '../firebaseConfig';
import { FlashcardService } from '../services/FlashcardService';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';
import { SessionStats } from './useFlashcardState';

const { width: screenWidth } = Dimensions.get('window');

interface HandlersParams {
  flashcards: any[];
  currentCardIndex: number;
  isFlipped: boolean;
  showingAnswer: boolean;
  cardStartTime: number;
  sessionStats: SessionStats;
  studyMode: string;
  setIsFlipped: (isFlipped: boolean) => void;
  setShowingAnswer: (showing: boolean) => void;
  setCurrentCardIndex: (index: number) => void;
  setCardStartTime: (time: number) => void;
  setSessionStats: (stats: SessionStats | ((prev: SessionStats) => SessionStats)) => void;
  animateFlip: (isFlipped: boolean) => void;
  animateSlideNext: (onComplete: () => void) => void;
  animateSlidePrevious: (onComplete: () => void) => void;
  animateSlideReset: () => void;
  slideAnimation: any;
  flipAnimation: any;
  logActivity: (type: string, data: any) => Promise<void>;
  navigation: any;
}

export const useFlashcardHandlers = (params: HandlersParams) => {
  const {
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
  } = params;

  /**
   * Flip card to show/hide answer
   */
  const flipCard = useCallback(() => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(30);
    }

    animateFlip(isFlipped);
    setIsFlipped(!isFlipped);
    setShowingAnswer(!showingAnswer);

    if (!showingAnswer) {
      setCardStartTime(Date.now());
    }
  }, [isFlipped, showingAnswer, animateFlip, setIsFlipped, setShowingAnswer, setCardStartTime]);

  /**
   * Handle answer quality rating
   */
  const handleAnswerQuality = useCallback(async (quality: number) => {
    try {
      const currentCard = flashcards[currentCardIndex];
      const userId = auth.currentUser?.uid;
      const responseTime = Date.now() - cardStartTime;

      if (Platform.OS !== 'web' && quality >= 4) {
        Vibration.vibrate(50);
      }

      await FlashcardService.recordFlashcardReview(userId, currentCard.id, quality, {
        responseTime,
        sessionId: String(sessionStats.startTime),
        studyMode: studyMode as 'due' | 'struggling' | 'review'
      });

      setSessionStats(prev => {
        const newStats = {
          ...prev,
          studied: prev.studied + 1,
          correct: quality >= 3 ? prev.correct + 1 : prev.correct,
          streak: quality >= 3 ? prev.streak + 1 : 0,
          averageResponseTime: ((prev.averageResponseTime * prev.studied) + responseTime) / (prev.studied + 1)
        };

        const difficulty = currentCard.difficulty || 'medium';
        newStats.difficultyBreakdown = {
          ...prev.difficultyBreakdown,
          [difficulty]: (prev.difficultyBreakdown[difficulty] || 0) + 1
        };

        return newStats;
      });

      await logActivity('flashcard_answered', {
        cardId: currentCard.id,
        quality,
        responseTime,
        subject: currentCard.subject,
        difficulty: currentCard.difficulty,
        timestamp: new Date().toISOString()
      });

      nextCard();
    } catch (error) {
      logger.error('L Error recording answer quality:', error);
      Alert.alert('Error', 'Failed to record your response. Please try again.');
    }
  }, [flashcards, currentCardIndex, cardStartTime, sessionStats, studyMode, setSessionStats, logActivity]);

  /**
   * Navigate to next card
   */
  const nextCard = useCallback(() => {
    if (currentCardIndex < flashcards.length - 1) {
      animateSlideNext(() => {
        const newIndex = currentCardIndex + 1;
        setCurrentCardIndex(newIndex);
        setIsFlipped(false);
        setShowingAnswer(false);
        setCardStartTime(Date.now());
      });
    } else {
      completeSession();
    }
  }, [currentCardIndex, flashcards.length, setCurrentCardIndex, setIsFlipped, setShowingAnswer, setCardStartTime, animateSlideNext]);

  /**
   * Navigate to previous card
   */
  const previousCard = useCallback(() => {
    if (currentCardIndex > 0) {
      animateSlidePrevious(() => {
        setCurrentCardIndex(currentCardIndex - 1);
        setIsFlipped(false);
        setShowingAnswer(false);
        setCardStartTime(Date.now());
      });
    }
  }, [currentCardIndex, setCurrentCardIndex, setIsFlipped, setShowingAnswer, setCardStartTime, animateSlidePrevious]);

  /**
   * Check for session achievements
   */
  const checkSessionAchievements = useCallback(async (stats: SessionStats, accuracy: number) => {
    const achievements = [];

    if (stats.studied >= 20) achievements.push({ type: 'marathon', title: '📚 Study Marathon', description: 'Studied 20+ cards!' });
    if (accuracy >= 90) achievements.push({ type: 'perfectionist', title: '⭐ Near Perfect', description: '90%+ accuracy!' });
    if (stats.streak >= 10) achievements.push({ type: 'streak_master', title: '🔥 Streak Master', description: '10+ correct in a row!' });
    if (stats.averageResponseTime < 5000) achievements.push({ type: 'quick_thinker', title: '⚡ Quick Thinker', description: 'Under 5s average!' });

    return achievements;
  }, []);

  /**
   * Generate session summary message
   */
  const generateSessionSummaryMessage = useCallback((stats: SessionStats, accuracy: number, sessionTime: number, achievements: any[]) => {
    const minutes = Math.round(sessionTime / 60);
    let message = `Studied ${stats.studied} cards with ${accuracy}% accuracy in ${minutes}m\n\n`;

    if (achievements.length > 0) {
      message += `🏆 Achievements:\n${achievements.map(a => `• ${a.title}`).join('\n')}\n\n`;
    }

    if (accuracy >= 80) message += '✅ Outstanding! Knowledge is solidifying.';
    else if (accuracy >= 60) message += '👍 Good progress! Keep reviewing.';
    else message += '💪 Keep going! Spaced repetition helps.';

    if (stats.streak >= 5) message += `\n\n🔥 Amazing ${stats.streak} correct streak!`;

    return message;
  }, []);

  /**
   * Share session results
   */
  const shareSessionResults = useCallback(async (stats: SessionStats, accuracy: number) => {
    try {
      const message = `Just completed a flashcard session on Alexandria! 📚

📊 ${stats.studied} cards studied
✅ ${accuracy}% accuracy
🔥 ${stats.streak} correct streak

Keep learning! 🎯`;

      await Share.share({
        message,
        title: 'Alexandria Study Session'
      });
    } catch (error) {
      logger.warn('Failed to share results:', error);
    }
  }, []);

  /**
   * Complete study session
   */
  const completeSession = useCallback(async () => {
    const sessionTime = Math.round((Date.now() - sessionStats.startTime) / 1000);
    const accuracy = sessionStats.studied > 0 ? Math.round((sessionStats.correct / sessionStats.studied) * 100) : 0;

    try {
      const userId = auth.currentUser?.uid;
      const achievements = await checkSessionAchievements(sessionStats, accuracy);

      await FlashcardService.recordStudySession(userId, {
        ...sessionStats,
        sessionTime,
        accuracy,
        endTime: new Date().toISOString()
      });

      const title = accuracy >= 80 ? 'Excellent Work! ✅' : accuracy >= 60 ? 'Good Progress! 👍' : 'Keep Practicing! 💪';
      const message = generateSessionSummaryMessage(sessionStats, accuracy, sessionTime, achievements);

      Alert.alert(
        title,
        message,
        [
          { text: 'Share Results', onPress: () => shareSessionResults(sessionStats, accuracy) },
          { text: 'View Analytics', onPress: () => navigation.navigate('ProgressTracker', { tab: 'flashcards' }) },
          { text: 'Study More', onPress: () => navigation.goBack() },
          { text: 'Finish', onPress: () => NavigationHelper.safeGoBack(navigation) }
        ]
      );

      await logActivity('flashcard_session_complete', {
        sessionStats: { ...sessionStats, accuracy, sessionTime },
        achievements,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('L Error completing session:', error);
      NavigationHelper.safeGoBack(navigation);
    }
  }, [sessionStats, navigation, checkSessionAchievements, generateSessionSummaryMessage, shareSessionResults, logActivity]);

  /**
   * Pan responder for swipe gestures
   */
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderMove: (evt, gestureState) => slideAnimation.setValue(gestureState.dx),
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > screenWidth * 0.3 && currentCardIndex > 0) {
        // Previous card
        previousCard();
      } else if (gestureState.dx < -screenWidth * 0.3 && !showingAnswer) {
        flipCard();
        animateSlideReset();
      } else {
        animateSlideReset();
      }
    }
  });

  return {
    flipCard,
    handleAnswerQuality,
    nextCard,
    previousCard,
    completeSession,
    shareSessionResults,
    panResponder,
  };
};
