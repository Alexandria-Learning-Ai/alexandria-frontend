/**
 * useFlashcardSession Hook
 * Manages flashcard session lifecycle, analytics, and preferences
 */

import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import { FlashcardService } from '../services/FlashcardService';
import logger from '../utils/logger';
import { SessionStats } from './useFlashcardState';

interface SessionParams {
  routeParams: any;
  setFlashcards: (cards: any[]) => void;
  setStudyMode: (mode: string) => void;
  setStudyStreak: (streak: number) => void;
  setIsDarkMode: (isDark: boolean) => void;
  setSessionStats: (stats: SessionStats | ((prev: SessionStats) => SessionStats)) => void;
  sessionStats: SessionStats;
  progressAnimation: any;
  currentCardIndex: number;
  navigation: any;
}

export const useFlashcardSession = (params: SessionParams) => {
  const {
    routeParams,
    setFlashcards,
    setStudyMode,
    setStudyStreak,
    setIsDarkMode,
    setSessionStats,
    sessionStats,
    progressAnimation,
    currentCardIndex,
    navigation,
  } = params;

  /**
   * Load flashcards from backend
   */
  const loadFlashcards = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Authentication Required', 'Please log in to access flashcards');
        return;
      }

      const mode = routeParams?.mode || 'review';
      const filters = routeParams?.filters || {};

      let cards = await FlashcardService.getFlashcardsByMode(userId, mode, filters);

      if (cards.length === 0) {
        Alert.alert(
          'No Flashcards Available',
          'No flashcards found for this study mode. Complete some quizzes to generate flashcards automatically!',
          [
            { text: 'Take Quiz', onPress: () => navigation.navigate('QuizScreen') },
            { text: 'Browse Topics', onPress: () => navigation.navigate('TopicBrowser') },
            { text: 'Go Back', onPress: () => navigation.goBack() }
          ]
        );
        return;
      }

      setFlashcards(cards);
      setStudyMode(mode);

      // Animate progress bar
      if (progressAnimation) {
        progressAnimation.setValue((currentCardIndex + 1) / cards.length);
      }

      logger.info(`=Ú Loaded ${cards.length} flashcards for study mode: ${mode}`);

      // Backend analytics
      await logActivity('flashcards_loaded', {
        mode,
        cardCount: cards.length,
        subjects: [...new Set(cards.map((c: any) => c.subject))],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('L Error loading flashcards:', error);
      Alert.alert('Error', 'Failed to load flashcards. Please check your connection and try again.');
    }
  }, [routeParams, setFlashcards, setStudyMode, progressAnimation, currentCardIndex, navigation]);

  /**
   * Get study streak from backend
   */
  const getStudyStreak = useCallback(async (): Promise<number> => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return 0;

      const response = await fetch(`/api/users/${userId}/study-streak`);
      if (response.ok) {
        const data = await response.json();
        return data.streak || 0;
      }
      return 0;
    } catch (error) {
      logger.warn('Failed to fetch study streak:', error);
      return 0;
    }
  }, []);

  /**
   * Track session start
   */
  const trackSessionStart = useCallback(async () => {
    try {
      const streak = await getStudyStreak();
      setStudyStreak(streak);

      await logActivity('flashcard_session_start', {
        mode: routeParams?.mode || 'review',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('Failed to track session start:', error);
    }
  }, [routeParams, setStudyStreak, getStudyStreak]);

  /**
   * Track session end
   */
  const trackSessionEnd = useCallback(async () => {
    if (sessionStats.studied > 0) {
      await logActivity('flashcard_session_complete', {
        sessionStats,
        timestamp: new Date().toISOString()
      });
    }
  }, [sessionStats]);

  /**
   * Load user preferences
   */
  const loadUserPreferences = useCallback(async () => {
    try {
      const preferences = await AsyncStorage.getItem('flashcard_preferences');
      if (preferences) {
        const prefs = JSON.parse(preferences);
        setIsDarkMode(prefs.darkMode ?? true);
      }
    } catch (error) {
      logger.warn('Failed to load preferences:', error);
    }
  }, [setIsDarkMode]);

  /**
   * Log activity to backend
   */
  const logActivity = useCallback(async (type: string, data: any) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await fetch('/api/user-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activityType: type,
          ...data
        })
      });
    } catch (error) {
      logger.warn('Failed to log activity:', error);
    }
  }, []);

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    loadFlashcards();
    trackSessionStart();
    loadUserPreferences();

    // Session timer
    const timer = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        timeSpent: Date.now() - prev.startTime
      }));
    }, 1000);

    return () => {
      clearInterval(timer);
      trackSessionEnd();
    };
  }, []);

  return {
    loadFlashcards,
    getStudyStreak,
    trackSessionStart,
    trackSessionEnd,
    loadUserPreferences,
    logActivity,
  };
};
