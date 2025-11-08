/**
 * ExamContext - Centralized state management for exam taking
 *
 * Manages:
 * - Timer state (countdown, pause, resume)
 * - Answer tracking (current answers, dirty state)
 * - Section/question navigation
 * - Auto-save coordination
 * - Submission workflow
 *
 * Features:
 * - React Context API for global exam state
 * - Type-safe with TypeScript
 * - Auto-save every 30 seconds
 * - Timer with pause/resume
 * - Section-based navigation
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParsedQuestion, ExamMode } from '../../../types/exam';
import logger from '../../../utils/logger';

/**
 * Timer state
 */
export interface TimerState {
  timeRemaining: number; // seconds
  isPaused: boolean;
  isExpired: boolean;
  duration: number; // total duration in seconds
}

/**
 * Section information
 */
export interface ExamSection {
  id: string;
  title: string;
  questionCount: number;
  questionIndices: number[]; // indices into questions array
}

/**
 * Exam context state
 */
export interface ExamContextState {
  // Exam data
  examId: string;
  questions: ParsedQuestion[];
  sections: ExamSection[];
  mode: ExamMode;

  // Navigation state
  currentSectionIndex: number;
  currentQuestionIndex: number;

  // Answer tracking
  answers: Record<number, any>;

  // Timer state
  timer: TimerState;

  // Submission state
  isSubmitted: boolean;
  isSubmitting: boolean;

  // Auto-save state
  lastSaved: Date | null;
  isDirty: boolean;
}

/**
 * Exam context actions
 */
export interface ExamContextActions {
  // Navigation
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestion: (sectionIndex: number, questionIndex: number) => void;
  goToSection: (sectionIndex: number) => void;

  // Answer management
  setAnswer: (questionNumber: number, answer: any) => void;
  clearAnswer: (questionNumber: number) => void;

  // Timer controls
  pauseTimer: () => void;
  resumeTimer: () => void;

  // Submission
  submitExam: () => Promise<void>;

  // Auto-save
  saveProgress: () => Promise<void>;
}

/**
 * Combined context type
 */
export type ExamContextType = ExamContextState & ExamContextActions;

/**
 * Create context with undefined default (will be provided by provider)
 */
const ExamContext = createContext<ExamContextType | undefined>(undefined);

/**
 * ExamProvider props
 */
export interface ExamProviderProps {
  children: React.ReactNode;
  examId: string;
  questions: ParsedQuestion[];
  mode?: ExamMode;
  duration?: number; // in minutes, null = no timer
  onSubmit?: (answers: Record<number, any>) => Promise<void>;
}

/**
 * ExamProvider - Provides exam state to all child components
 */
export const ExamProvider: React.FC<ExamProviderProps> = ({
  children,
  examId,
  questions,
  mode = 'take',
  duration = null,
  onSubmit,
}) => {
  // Generate sections from questions
  const sections = generateSections(questions);

  // Navigation state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Answer state
  const [answers, setAnswers] = useState<Record<number, any>>({});

  // Timer state
  const [timer, setTimer] = useState<TimerState>({
    timeRemaining: duration ? duration * 60 : 0,
    isPaused: false,
    isExpired: false,
    duration: duration ? duration * 60 : 0,
  });

  // Submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Refs for intervals
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load saved answers from AsyncStorage on mount
   */
  useEffect(() => {
    loadSavedAnswers();
  }, [examId]);

  /**
   * Start timer countdown
   */
  useEffect(() => {
    if (!duration || mode === 'review' || timer.isPaused || timer.isExpired || isSubmitted) {
      return;
    }

    timerInterval.current = setInterval(() => {
      setTimer((prev) => {
        const newTime = prev.timeRemaining - 1;

        if (newTime <= 0) {
          // Timer expired - auto-submit
          logger.warn('Exam timer expired - auto-submitting');
          handleAutoSubmit();
          return { ...prev, timeRemaining: 0, isExpired: true };
        }

        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [duration, mode, timer.isPaused, timer.isExpired, isSubmitted]);

  /**
   * Start auto-save interval (every 30 seconds)
   */
  useEffect(() => {
    if (mode === 'review' || isSubmitted) {
      return;
    }

    autoSaveInterval.current = setInterval(() => {
      if (isDirty) {
        saveProgress();
      }
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [isDirty, mode, isSubmitted]);

  /**
   * Load saved answers from AsyncStorage
   */
  const loadSavedAnswers = async () => {
    try {
      const saved = await AsyncStorage.getItem(`exam_${examId}_answers`);
      if (saved) {
        const parsedAnswers = JSON.parse(saved);
        setAnswers(parsedAnswers);
        logger.info('Loaded saved answers', { examId, count: Object.keys(parsedAnswers).length });
      }
    } catch (error) {
      logger.error('Failed to load saved answers:', error);
    }
  };

  /**
   * Save progress to AsyncStorage
   */
  const saveProgress = useCallback(async () => {
    try {
      await AsyncStorage.setItem(`exam_${examId}_answers`, JSON.stringify(answers));

      // Save timer state if exam is timed
      if (duration) {
        await AsyncStorage.setItem(`exam_${examId}_timer`, JSON.stringify(timer));
      }

      setLastSaved(new Date());
      setIsDirty(false);
      logger.info('Saved exam progress', { examId, answerCount: Object.keys(answers).length });
    } catch (error) {
      logger.error('Failed to save progress:', error);
    }
  }, [examId, answers, timer, duration]);

  /**
   * Navigate to next question
   */
  const goToNextQuestion = useCallback(() => {
    const currentSection = sections[currentSectionIndex];

    // If not at end of current section, go to next question in section
    if (currentQuestionIndex < currentSection.questionIndices.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      saveProgress(); // Auto-save on navigation
      return;
    }

    // If at end of section, go to first question of next section
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
      saveProgress();
      return;
    }

    // At end of exam - do nothing
    logger.info('At end of exam');
  }, [currentSectionIndex, currentQuestionIndex, sections, saveProgress]);

  /**
   * Navigate to previous question
   */
  const goToPreviousQuestion = useCallback(() => {
    // If not at start of current section, go to previous question in section
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      saveProgress();
      return;
    }

    // If at start of section, go to last question of previous section
    if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1];
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex(prevSection.questionIndices.length - 1);
      saveProgress();
      return;
    }

    // At start of exam - do nothing
    logger.info('At start of exam');
  }, [currentSectionIndex, currentQuestionIndex, sections, saveProgress]);

  /**
   * Navigate to specific question
   */
  const goToQuestion = useCallback((sectionIndex: number, questionIndex: number) => {
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      const section = sections[sectionIndex];
      if (questionIndex >= 0 && questionIndex < section.questionIndices.length) {
        setCurrentSectionIndex(sectionIndex);
        setCurrentQuestionIndex(questionIndex);
        saveProgress();
      }
    }
  }, [sections, saveProgress]);

  /**
   * Navigate to section (first question)
   */
  const goToSection = useCallback((sectionIndex: number) => {
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      setCurrentSectionIndex(sectionIndex);
      setCurrentQuestionIndex(0);
      saveProgress();
    }
  }, [sections, saveProgress]);

  /**
   * Set answer for question
   */
  const setAnswer = useCallback((questionNumber: number, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer,
    }));
    setIsDirty(true);
    logger.debug('Answer set', { questionNumber, answer });
  }, []);

  /**
   * Clear answer for question
   */
  const clearAnswer = useCallback((questionNumber: number) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      return newAnswers;
    });
    setIsDirty(true);
  }, []);

  /**
   * Pause timer
   */
  const pauseTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, isPaused: true }));
    logger.info('Timer paused');
  }, []);

  /**
   * Resume timer
   */
  const resumeTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, isPaused: false }));
    logger.info('Timer resumed');
  }, []);

  /**
   * Submit exam
   */
  const submitExam = useCallback(async () => {
    if (isSubmitting || isSubmitted) {
      return;
    }

    setIsSubmitting(true);

    try {
      logger.info('Submitting exam', { examId, answerCount: Object.keys(answers).length });

      // Save final state
      await saveProgress();

      // Call onSubmit callback if provided
      if (onSubmit) {
        await onSubmit(answers);
      }

      // Clear saved progress
      await AsyncStorage.removeItem(`exam_${examId}_answers`);
      await AsyncStorage.removeItem(`exam_${examId}_timer`);

      setIsSubmitted(true);
      logger.info('Exam submitted successfully');
    } catch (error) {
      logger.error('Failed to submit exam:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [examId, answers, isSubmitting, isSubmitted, saveProgress, onSubmit]);

  /**
   * Auto-submit when timer expires
   */
  const handleAutoSubmit = useCallback(async () => {
    logger.warn('Auto-submitting exam due to timer expiration');
    await submitExam();
  }, [submitExam]);

  /**
   * Context value
   */
  const value: ExamContextType = {
    // State
    examId,
    questions,
    sections,
    mode,
    currentSectionIndex,
    currentQuestionIndex,
    answers,
    timer,
    isSubmitted,
    isSubmitting,
    lastSaved,
    isDirty,

    // Actions
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    goToSection,
    setAnswer,
    clearAnswer,
    pauseTimer,
    resumeTimer,
    submitExam,
    saveProgress,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

/**
 * Hook to use exam context
 */
export const useExamContext = (): ExamContextType => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExamContext must be used within ExamProvider');
  }
  return context;
};

/**
 * Generate sections from questions
 * Groups questions by their section field
 */
function generateSections(questions: ParsedQuestion[]): ExamSection[] {
  const sectionMap = new Map<string, number[]>();

  // Group question indices by section
  questions.forEach((question, index) => {
    const sectionTitle = question.section || 'General';
    if (!sectionMap.has(sectionTitle)) {
      sectionMap.set(sectionTitle, []);
    }
    sectionMap.get(sectionTitle)!.push(index);
  });

  // Convert to ExamSection array
  const sections: ExamSection[] = [];
  let sectionId = 0;

  sectionMap.forEach((questionIndices, title) => {
    sections.push({
      id: `section-${sectionId++}`,
      title,
      questionCount: questionIndices.length,
      questionIndices,
    });
  });

  return sections;
}

/**
 * Format time remaining (seconds → MM:SS or HH:MM:SS)
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get current question from context
 */
export function useCurrentQuestion(): ParsedQuestion | null {
  const { questions, sections, currentSectionIndex, currentQuestionIndex } = useExamContext();

  const currentSection = sections[currentSectionIndex];
  if (!currentSection) return null;

  const questionIndex = currentSection.questionIndices[currentQuestionIndex];
  return questions[questionIndex] || null;
}

/**
 * Get progress info (answered, total, percentage)
 */
export function useExamProgress(): {
  answered: number;
  total: number;
  percentage: number;
  unanswered: number[];
} {
  const { questions, answers } = useExamContext();

  const answeredQuestions = Object.keys(answers).map(Number);
  const answered = answeredQuestions.length;
  const total = questions.length;
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  const unanswered = questions
    .map((q) => q.question_number)
    .filter((qNum) => !answers[qNum]);

  return { answered, total, percentage, unanswered };
}
