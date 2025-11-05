/**
 * useFlashcardState Hook
 * Manages all state for flashcard study sessions
 */

import { useState } from 'react';

export interface SessionStats {
  studied: number;
  correct: number;
  timeSpent: number;
  startTime: number;
  streak: number;
  averageResponseTime: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface FlashcardState {
  flashcards: any[];
  currentCardIndex: number;
  isFlipped: boolean;
  sessionStats: SessionStats;
  showingAnswer: boolean;
  studyMode: string;
  isDarkMode: boolean;
  showSessionSettings: boolean;
  cardStartTime: number;
  studyStreak: number;
}

export const useFlashcardState = () => {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    studied: 0,
    correct: 0,
    timeSpent: 0,
    startTime: Date.now(),
    streak: 0,
    averageResponseTime: 0,
    difficultyBreakdown: { easy: 0, medium: 0, hard: 0 }
  });
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState('review');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSessionSettings, setShowSessionSettings] = useState(false);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [studyStreak, setStudyStreak] = useState(0);

  // Theme colors based on dark mode
  const themeColors = isDarkMode ? {
    background: '#1A2C5B',
    cardBackground: '#2A3F73',
    text: '#F8F4E3',
    accent: '#D4AF37',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  } : {
    background: '#F8F4E3',
    cardBackground: '#FFFFFF',
    text: '#1A2C5B',
    accent: '#1A2C5B',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  // Helper to update session stats
  const updateSessionStats = (updates: Partial<SessionStats>) => {
    setSessionStats(prev => ({ ...prev, ...updates }));
  };

  // Reset to next card
  const resetCardState = () => {
    setIsFlipped(false);
    setShowingAnswer(false);
    setCardStartTime(Date.now());
  };

  // Get current card
  const currentCard = flashcards[currentCardIndex];

  return {
    // State
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

    // Setters
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

    // Helpers
    updateSessionStats,
    resetCardState,
  };
};
