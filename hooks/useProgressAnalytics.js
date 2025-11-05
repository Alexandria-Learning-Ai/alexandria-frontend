import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import { BackendSyncService } from '../services/BackendSyncService';
import { SubjectProgressService } from '../services/SubjectProgressService';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService';
import logger from '../utils/logger';

export const useProgressAnalytics = (selectedPeriod = 'week') => {
  const [analytics, setAnalytics] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    currentStreak: 0,
    longestStreak: 0,
    scoreHistory: [],
    categoryStats: [],
    weeklyProgress: [],
    difficultyBreakdown: [],
    subjectBreakdown: [],
    recentActivity: []
  });

  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('loading');
  const [backendError, setBackendError] = useState(null);
  const [subjectProgress, setSubjectProgress] = useState({});
  const [subjectRecommendations, setSubjectRecommendations] = useState([]);
  const [subjectSummary, setSubjectSummary] = useState(null);
  const [learningProfile, setLearningProfile] = useState(null);
  const [streakInfo, setStreakInfo] = useState(null);
  const [studyInsights, setStudyInsights] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setDataSource('loading');
      const user = auth.currentUser;

      if (!user) {
        // Clear all data if no user
        setAnalytics({
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          currentStreak: 0,
          longestStreak: 0,
          scoreHistory: [],
          categoryStats: [],
          weeklyProgress: [],
          difficultyBreakdown: [],
          subjectBreakdown: [],
          recentActivity: []
        });
        setSubjectProgress({});
        setSubjectRecommendations([]);
        setSubjectSummary(null);
        setLearningProfile(null);
        setStreakInfo(null);
        setStudyInsights(null);
        setDataSource('local');
        setLoading(false);
        return;
      }

      let backendDataLoaded = false;

      // Try to load from backend APIs
      try {
        logger.info('📊 Loading progress data from backend...');
        setBackendError(null);

        // Load all backend data in parallel
        const [
          backendProfile,
          backendStreak,
          backendInsights,
          backendSubjects,
          backendHistory
        ] = await Promise.all([
          BackendSyncService.getLearningProfile(),
          BackendSyncService.getStreakInfo(),
          BackendSyncService.getStudyInsights(selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365),
          BackendSyncService.getSubjectProgress(),
          BackendSyncService.getQuizHistory({
            page: 1,
            pageSize: 100,
            daysBack: selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : undefined
          })
        ]);

        // Store backend data
        setLearningProfile(backendProfile);
        setStreakInfo(backendStreak);
        setStudyInsights(backendInsights);

        // Convert backend data to analytics format
        const backendAnalytics = {
          totalQuizzes: backendProfile.total_quizzes_taken || 0,
          averageScore: backendProfile.overall_accuracy || 0,
          bestScore: backendProfile.best_accuracy || 0,
          totalCorrect: Math.round((backendProfile.total_questions_answered || 0) * (backendProfile.overall_accuracy || 0) / 100),
          totalQuestions: backendProfile.total_questions_answered || 0,
          currentStreak: backendStreak.current_streak || 0,
          longestStreak: backendStreak.longest_streak || 0,
          scoreHistory: [],
          categoryStats: [],
          weeklyProgress: backendInsights.weekly_progress || [],
          difficultyBreakdown: [],
          subjectBreakdown: [],
          recentActivity: [],
          // Backend-specific data
          learningVelocity: backendInsights.learning_velocity || 0,
          consistencyScore: backendInsights.consistency_score || 0,
          performanceLevel: backendProfile.performance_level || 'beginner',
          studyTime: Math.round((backendProfile.total_study_time || 0) / 60),
        };

        // Process subject progress
        const subjectProgressData = {};
        const subjectBreakdown = [];
        backendSubjects.forEach(subject => {
          subjectProgressData[subject.subject] = {
            accuracy: subject.accuracy,
            quizCount: subject.quiz_count,
            masteryLevel: subject.mastery_level,
            lastPracticed: subject.last_practiced,
            improvementTrend: subject.improvement_trend
          };

          subjectBreakdown.push({
            name: subject.subject,
            population: subject.quiz_count,
            accuracy: subject.accuracy,
            color: HierarchicalSubjectService.getSubjectColor(subject.subject)
          });
        });

        // Process quiz history for score history and recent activity
        if (backendHistory.history) {
          const scoreHistory = backendHistory.history.map((quiz, index) => ({
            x: index + 1,
            y: quiz.accuracy,
            date: new Date(quiz.completion_date).toLocaleDateString(),
            subject: quiz.subject_key || 'Unknown'
          })).reverse();

          const recentActivity = backendHistory.history.slice(0, 10).map(quiz => ({
            id: quiz.id,
            title: quiz.topic,
            score: quiz.accuracy,
            date: quiz.completion_date,
            subject: quiz.subject_key
          }));

          backendAnalytics.scoreHistory = scoreHistory;
          backendAnalytics.recentActivity = recentActivity;
        }

        backendAnalytics.subjectBreakdown = subjectBreakdown;

        setAnalytics(backendAnalytics);
        setSubjectProgress(subjectProgressData);

        // Normalize recommendations to ensure they have required fields
        const normalizedRecommendations = (backendInsights.subject_recommendations || []).map(rec => ({
          ...rec,
          priority: rec.priority || 'low',
          message: rec.message || 'Practice recommended',
          action: rec.action || 'take_quiz',
          subjectKey: rec.subjectKey || rec.subject || 'general'
        }));
        setSubjectRecommendations(normalizedRecommendations);

        backendDataLoaded = true;
        setDataSource('backend');
        logger.info('✅ Backend progress data loaded successfully');

      } catch (backendError) {
        logger.warn('⚠️ Backend loading failed, falling back to local data:', backendError);
        setBackendError(backendError.message);

        // Fallback to local storage
        try {
          const [quizHistory, subjectData] = await Promise.all([
            AsyncStorage.getItem(`quizHistory_${user.uid}`),
            Promise.all([
              SubjectProgressService.getSubjectProgress(user.uid),
              SubjectProgressService.getSubjectRecommendations(user.uid),
              SubjectProgressService.getSubjectSummary(user.uid)
            ])
          ]);

          const quizzes = quizHistory ? JSON.parse(quizHistory) : [];
          const [subjectProgressData, recommendations, summary] = subjectData;

          setSubjectProgress(subjectProgressData || {});

          // Normalize recommendations to ensure they have required fields
          const normalizedLocalRecommendations = (recommendations || []).map(rec => ({
            ...rec,
            priority: rec.priority || 'low',
            message: rec.message || 'Practice recommended',
            action: rec.action || 'take_quiz',
            subjectKey: rec.subjectKey || rec.subject || 'general'
          }));
          setSubjectRecommendations(normalizedLocalRecommendations);
          setSubjectSummary(summary);

          if (quizzes.length > 0) {
            const calculatedAnalytics = calculateAnalytics(quizzes, selectedPeriod);
            setAnalytics(calculatedAnalytics);
          }

          setDataSource('local');
          logger.info('✅ Local progress data loaded successfully');

        } catch (localError) {
          logger.error('❌ Error loading local data:', localError);
          setDataSource('local');
        }
      }

    } catch (error) {
      logger.error('❌ Error in fetchAnalytics:', error);
      setDataSource('local');
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics from local quiz data
  const calculateAnalytics = (quizzes, period) => {
    if (!quizzes || quizzes.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        currentStreak: 0,
        longestStreak: 0,
        scoreHistory: [],
        categoryStats: [],
        weeklyProgress: [],
        difficultyBreakdown: [],
        subjectBreakdown: [],
        recentActivity: []
      };
    }

    // Filter quizzes by selected period
    const now = new Date();
    const filteredQuizzes = quizzes.filter(quiz => {
      if (period === 'all') return true;

      const quizDate = new Date(quiz.metadata?.completedAt || Date.now());
      const daysAgo = (now - quizDate) / (1000 * 60 * 60 * 24);

      if (period === 'week') return daysAgo <= 7;
      if (period === 'month') return daysAgo <= 30;
      return true;
    });

    const totalQuizzes = filteredQuizzes.length;
    const totalCorrect = filteredQuizzes.reduce((sum, quiz) => sum + (quiz.results?.score || 0), 0);
    const totalQuestions = filteredQuizzes.reduce((sum, quiz) => sum + (quiz.results?.totalQuestions || 0), 0);
    const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const bestScore = Math.max(...filteredQuizzes.map(quiz => quiz.results?.percentage || 0), 0);

    // Score history for chart
    const scoreHistory = filteredQuizzes
      .slice(-20)
      .map((quiz, index) => ({
        x: index + 1,
        y: quiz.results?.percentage || 0,
        date: new Date(quiz.metadata?.completedAt || Date.now()).toLocaleDateString(),
        subject: quiz.metadata?.category || 'Unknown'
      }));

    // Category stats
    const categoryMap = new Map();
    filteredQuizzes.forEach(quiz => {
      const category = quiz.metadata?.category || 'General';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, correct: 0, count: 0 });
      }
      const stats = categoryMap.get(category);
      stats.total += quiz.results?.totalQuestions || 0;
      stats.correct += quiz.results?.score || 0;
      stats.count += 1;
    });

    const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total,
      count: stats.count
    }));

    // Difficulty breakdown
    const difficultyMap = new Map();
    filteredQuizzes.forEach(quiz => {
      const difficulty = quiz.metadata?.difficulty || 'Medium';
      difficultyMap.set(difficulty, (difficultyMap.get(difficulty) || 0) + 1);
    });

    const difficultyBreakdown = Array.from(difficultyMap.entries()).map(([name, value]) => ({
      name,
      population: value,
      color: name === 'Easy' ? '#4CAF50' : name === 'Medium' ? '#FF9800' : '#F44336',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    }));

    // Subject breakdown
    const subjectMap = new Map();
    filteredQuizzes.forEach(quiz => {
      const subject = quiz.metadata?.category || 'General';
      subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
    });

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([name, value], index) => ({
      name,
      population: value,
      color: HierarchicalSubjectService.getSubjectColor(name) || `hsl(${index * 60}, 60%, 60%)`,
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    }));

    // Recent activity
    const recentActivity = filteredQuizzes
      .slice(-10)
      .reverse()
      .map(quiz => ({
        id: quiz.id,
        title: quiz.metadata?.title || 'Quiz',
        score: quiz.results?.percentage || 0,
        date: quiz.metadata?.completedAt || Date.now(),
        subject: quiz.metadata?.category || 'General'
      }));

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(quizzes);

    return {
      totalQuizzes,
      averageScore,
      bestScore,
      totalCorrect,
      totalQuestions,
      currentStreak,
      longestStreak,
      scoreHistory,
      categoryStats,
      weeklyProgress: [], // Could be calculated if needed
      difficultyBreakdown,
      subjectBreakdown,
      recentActivity
    };
  };

  // Calculate streak information
  const calculateStreaks = (quizzes) => {
    if (!quizzes || quizzes.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const sortedQuizzes = [...quizzes].sort((a, b) =>
      new Date(a.metadata?.completedAt || 0) - new Date(b.metadata?.completedAt || 0)
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    sortedQuizzes.forEach(quiz => {
      const quizDate = new Date(quiz.metadata?.completedAt || Date.now());
      const dateString = quizDate.toDateString();

      if (lastDate !== dateString) {
        if (quiz.results?.percentage >= 70) { // Consider 70%+ as success
          tempStreak += 1;
          if (dateString === new Date().toDateString() ||
              (new Date() - quizDate) / (1000 * 60 * 60 * 24) <= 1) {
            currentStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = dateString;
      }
    });

    return { currentStreak, longestStreak };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const refreshAnalytics = () => {
    fetchAnalytics();
  };

  return {
    analytics,
    loading,
    dataSource,
    backendError,
    subjectProgress,
    subjectRecommendations,
    subjectSummary,
    learningProfile,
    streakInfo,
    studyInsights,
    refreshAnalytics
  };
};