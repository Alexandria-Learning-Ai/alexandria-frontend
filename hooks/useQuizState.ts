import { useState } from 'react';

interface QuizState {
  started: boolean;
  submitted: boolean;
  showResults: boolean;
  loading: boolean;
  currentQuestionIndex: number;
  score: number;
}

interface QuizMetadata {
  title: string;
  startTime: number | null;
  completionTime: number | null;
}

interface ThemeState {
  isDarkMode: boolean;
  colors: any;
}

interface AnalyticsState {
  processing: boolean;
  achievements: any[];
  insights: any;
}

export const useQuizState = () => {
  const [quizState, setQuizState] = useState<QuizState>({
    started: false,
    submitted: false,
    showResults: false,
    loading: false,
    currentQuestionIndex: 0,
    score: 0,
  });

  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [questionsState, setQuestionsState] = useState<any[]>([]);

  const [quizMetadata, setQuizMetadata] = useState<QuizMetadata>({
    title: '',
    startTime: null,
    completionTime: null,
  });

  const [themeState, setThemeState] = useState<ThemeState>({
    isDarkMode: false,
    colors: null,
  });

  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    processing: false,
    achievements: [],
    insights: null,
  });

  // Helper methods
  const updateQuizState = (updates: Partial<QuizState>) => {
    setQuizState(prev => ({ ...prev, ...updates }));
  };

  const updateQuizMetadata = (updates: Partial<QuizMetadata>) => {
    setQuizMetadata(prev => ({ ...prev, ...updates }));
  };

  const updateThemeState = (updates: Partial<ThemeState>) => {
    setThemeState(prev => ({ ...prev, ...updates }));
  };

  const updateAnalyticsState = (updates: Partial<AnalyticsState>) => {
    setAnalyticsState(prev => ({ ...prev, ...updates }));
  };

  const resetQuiz = () => {
    setQuizState({
      started: false,
      submitted: false,
      showResults: false,
      loading: false,
      currentQuestionIndex: 0,
      score: 0,
    });
    setUserAnswers({});
    setQuestionsState([]);
  };

  return {
    // State
    quizState,
    userAnswers,
    questionsState,
    quizMetadata,
    themeState,
    analyticsState,

    // Setters
    setQuizState,
    setUserAnswers,
    setQuestionsState,
    setQuizMetadata,
    setThemeState,
    setAnalyticsState,

    // Helper methods
    updateQuizState,
    updateQuizMetadata,
    updateThemeState,
    updateAnalyticsState,
    resetQuiz,
  };
};
