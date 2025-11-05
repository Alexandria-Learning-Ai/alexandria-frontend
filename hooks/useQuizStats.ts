import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  currentStreak: number;
}

interface QuizData {
  results?: {
    score: number;
    totalQuestions: number;
  };
  metadata?: {
    completedAt: string;
  };
}

export const useQuizStats = () => {
  const [recentStats, setRecentStats] = useState<QuizStats>({
    totalQuizzes: 0,
    averageScore: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadRecentStats();
  }, []);

  const calculateStreak = (quizzes: QuizData[]): number => {
    if (quizzes.length === 0) return 0;

    const sortedQuizzes = quizzes.sort(
      (a, b) =>
        new Date(b.metadata?.completedAt || 0).getTime() -
        new Date(a.metadata?.completedAt || 0).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const quiz of sortedQuizzes) {
      const quizDate = new Date(quiz.metadata?.completedAt || 0);
      quizDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - quizDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const loadRecentStats = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Use user-specific key instead of global key
      const quizHistory = await AsyncStorage.getItem(`quizHistory_${user.uid}`);

      if (quizHistory) {
        const quizzes: QuizData[] = JSON.parse(quizHistory);
        const totalQuizzes = quizzes.length;

        if (totalQuizzes > 0) {
          const totalCorrect = quizzes.reduce((sum, quiz) => sum + (quiz.results?.score || 0), 0);
          const totalQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.results?.totalQuestions || 0), 0);
          const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

          const currentStreak = calculateStreak(quizzes);

          setRecentStats({
            totalQuizzes,
            averageScore,
            currentStreak,
          });
        }
      }
    } catch (error) {
      logger.error('Error loading recent stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = () => {
    loadRecentStats();
  };

  return {
    recentStats,
    isLoading,
    refreshStats,
  };
};
