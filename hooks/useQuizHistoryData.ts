/**
 * ⚠️ DEPRECATED - Use hooks/api/useQuizHistory.ts instead
 *
 * This hook will be removed in a future version.
 * Migrate to the new React Query-based hook for:
 * - Automatic offline sync
 * - Optimistic updates
 * - Better caching
 * - Retry logic
 *
 * Migration guide: See SCREEN_MIGRATION_AUDIT.md
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService';
import { BackendSyncService } from '../services/BackendSyncService';
import logger from '../utils/logger';

// Log deprecation warning
if (__DEV__) {
  logger.warn(
    '⚠️ useQuizHistoryData is deprecated. Please migrate to hooks/api/useQuizHistory.ts\n' +
    'See SCREEN_MIGRATION_AUDIT.md for migration guide.'
  );
}

interface QuizHistoryItem {
  id: string;
  title: string;
  questions: any[];
  results: {
    score: number;
    totalQuestions: number;
    percentage: number;
    correctCount: number;
    incorrectCount: number;
  };
  metadata: {
    completedAt: string;
    source?: string;
    subject?: string;
    difficulty?: string;
    topic?: string;
    performance_level?: string;
    time_taken?: number;
    course?: string;
    category?: string;
    hierarchical?: {
      course?: string;
    };
  };
  userAnswers: any[];
  createdAt: string;
  backendId?: string;
  isFromBackend?: boolean;
}

interface Filter {
  value: string;
  label: string;
  sublabel?: string;
  count: number;
  icon: string;
  color?: string;
  type?: string;
  subject?: string;
}

/**
 * useQuizHistoryData - Manages quiz history data fetching and filtering
 *
 * Features:
 * - Backend API with AsyncStorage fallback
 * - Course/subject hierarchical filtering
 * - Automatic filter building from quiz data
 * - Pull-to-refresh support
 * - Data source tracking (backend/local)
 */
export const useQuizHistoryData = () => {
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'backend' | 'local' | 'loading'>('loading');

  // Filter state
  const [filteredHistory, setFilteredHistory] = useState<QuizHistoryItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Build available filters from quiz history
  const buildFiltersFromHistory = useCallback((quizzes: QuizHistoryItem[]) => {
    const filters: Filter[] = [{ value: 'all', label: 'All Quizzes', count: quizzes.length, icon: 'list' }];
    const subjectMap = new Map<string, { count: number; courses: Set<string> }>();
    const courseMap = new Map<string, number>();

    quizzes.forEach(quiz => {
      // Extract subject information from metadata
      const subject = quiz.metadata?.subject || quiz.metadata?.category || 'General';
      const course = quiz.metadata?.course || quiz.metadata?.hierarchical?.course;

      // Track subjects
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { count: 0, courses: new Set() });
      }
      subjectMap.get(subject)!.count++;

      // Track courses within subjects
      if (course) {
        subjectMap.get(subject)!.courses.add(course);
        const courseKey = `${subject}→${course}`;
        if (!courseMap.has(courseKey)) {
          courseMap.set(courseKey, 0);
        }
        courseMap.set(courseKey, courseMap.get(courseKey)! + 1);
      }
    });

    // Add subject filters
    Array.from(subjectMap.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .forEach(([subject, data]) => {
        filters.push({
          value: `subject:${subject}`,
          label: subject,
          count: data.count,
          icon: HierarchicalSubjectService.getSubjectIcon(subject),
          color: HierarchicalSubjectService.getSubjectColor(subject),
          type: 'subject'
        });

        // Add course filters within each subject
        Array.from(data.courses)
          .sort()
          .forEach(course => {
            const courseKey = `${subject}→${course}`;
            const courseCount = courseMap.get(courseKey) || 0;
            if (courseCount > 0) {
              filters.push({
                value: `course:${subject}→${course}`,
                label: `${course}`,
                sublabel: `in ${subject}`,
                count: courseCount,
                icon: 'book-open',
                color: HierarchicalSubjectService.getSubjectColor(subject),
                type: 'course',
                subject: subject
              });
            }
          });
      });

    setAvailableFilters(filters);
    logger.info('📊 Built quiz history filters:', filters.length);
  }, []);

  // Apply filter to quiz history
  const applyFilter = useCallback((quizzes: QuizHistoryItem[], filterValue: string) => {
    let filtered = quizzes;

    if (filterValue !== 'all') {
      if (filterValue.startsWith('subject:')) {
        const subjectName = filterValue.replace('subject:', '');
        filtered = quizzes.filter(quiz => {
          const quizSubject = quiz.metadata?.subject || quiz.metadata?.category || 'General';
          return quizSubject === subjectName;
        });
      } else if (filterValue.startsWith('course:')) {
        const courseInfo = filterValue.replace('course:', '');
        const [subject, course] = courseInfo.split('→');
        filtered = quizzes.filter(quiz => {
          const quizSubject = quiz.metadata?.subject || quiz.metadata?.category || 'General';
          const quizCourse = quiz.metadata?.course || quiz.metadata?.hierarchical?.course;
          return quizSubject === subject && quizCourse === course;
        });
      }
    }

    setFilteredHistory(filtered);
    logger.info(`📋 Applied filter "${filterValue}": ${filtered.length}/${quizzes.length} quizzes`);
  }, []);

  // Fetch quiz history from backend with AsyncStorage fallback
  const fetchHistory = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
        setDataSource('loading');
      }

      const user = auth.currentUser;
      if (!user) {
        setHistory([]);
        setDataSource('local');
        return;
      }

      let quizHistory: QuizHistoryItem[] = [];
      let fromBackend = false;

      // Try to load from backend first
      try {
        logger.info('📚 Fetching quiz history from backend...');
        setBackendError(null);

        const backendResponse = await BackendSyncService.getQuizHistory({
          page: 1,
          pageSize: 100,
        });

        if (backendResponse && backendResponse.history) {
          // Convert backend format to frontend format
          quizHistory = backendResponse.history.map(item => {
            // Extract question data from question_details if available
            const questions = item.question_details?.questions || [];
            const userAnswers = item.question_details?.user_answers || [];

            return {
              id: item.quiz_id,
              title: item.topic || 'Quiz',
              questions: questions,  // Now populated from backend
              results: {
                score: item.questions_correct,
                totalQuestions: item.questions_total,
                percentage: item.accuracy,
                correctCount: item.questions_correct,
                incorrectCount: item.questions_total - item.questions_correct,
              },
              metadata: {
                completedAt: item.completion_date,
                source: item.source,
                subject: item.subject_key,
                difficulty: item.difficulty,
                topic: item.topic,
                performance_level: item.performance_level,
                time_taken: item.time_taken,
              },
              userAnswers: userAnswers,  // Now populated from backend
              createdAt: item.completion_date,
              backendId: item.id,
              isFromBackend: true,
            };
          });

          fromBackend = true;
          setDataSource('backend');
          logger.info(`✅ Loaded ${quizHistory.length} quizzes from backend`);
        }
      } catch (backendError: any) {
        logger.warn('⚠️ Backend fetch failed, falling back to local storage:', backendError);
        setBackendError(backendError.message);

        // Fallback to AsyncStorage
        try {
          const storedHistory = await AsyncStorage.getItem(`quizHistory_${user.uid}`);
          quizHistory = storedHistory ? JSON.parse(storedHistory) : [];
          setDataSource('local');
          logger.info(`📱 Loaded ${quizHistory.length} quizzes from local storage`);
        } catch (localError) {
          logger.error('❌ Failed to load from local storage:', localError);
          quizHistory = [];
          setDataSource('local');
        }
      }

      // Sort by completion date (most recent first)
      const sortedHistory = quizHistory.sort((a, b) => {
        const dateA = new Date(a.metadata?.completedAt || a.createdAt || 0);
        const dateB = new Date(b.metadata?.completedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setHistory(sortedHistory);
      buildFiltersFromHistory(sortedHistory);
      applyFilter(sortedHistory, selectedFilter);

    } catch (error: any) {
      logger.error('❌ Error in fetchHistory:', error);
      setBackendError(error.message);
      setDataSource('local');
      Alert.alert('Error', 'Failed to load quiz history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter, buildFiltersFromHistory, applyFilter]);

  // Handle filter selection
  const handleFilterSelect = useCallback((filterValue: string) => {
    setSelectedFilter(filterValue);
    applyFilter(history, filterValue);
    setShowFilters(false);
  }, [history, applyFilter]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory(false);
  }, [fetchHistory]);

  // Toggle filters dropdown
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  return {
    // State
    history,
    setHistory,
    loading,
    refreshing,
    backendError,
    dataSource,
    filteredHistory,
    selectedFilter,
    availableFilters,
    showFilters,

    // Actions
    fetchHistory,
    onRefresh,
    handleFilterSelect,
    toggleFilters,
    applyFilter,
  };
};
