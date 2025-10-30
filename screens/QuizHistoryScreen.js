import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BookLoadingScreen } from '../components/BookLoadingAnimation';
import QuizHistoryHeader from '../components/quiz-history/QuizHistoryHeader';
import QuizHistoryFilterBar from '../components/quiz-history/QuizHistoryFilterBar';
import QuizHistoryCard from '../components/quiz-history/QuizHistoryCard';
import EmptyHistoryState from '../components/quiz-history/EmptyHistoryState';
import { useQuizHistory } from '../hooks/api/useQuizHistory';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

export default function QuizHistoryScreen({ navigation }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const containerAnim = useRef(new Animated.Value(1)).current;

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // React Query hook for quiz history with automatic caching and offline support
  const {
    quizHistory,
    isLoading,
    isFetching,
    refetch,
    deleteQuiz,
    isDeletingQuiz,
    clearAllHistory: clearAllHistoryMutation,
    isClearingHistory,
  } = useQuizHistory();

  // Build available filters from quiz history
  const availableFilters = useMemo(() => {
    const filters = [{ value: 'all', label: 'All Quizzes', count: quizHistory.length, icon: 'list' }];
    const subjectMap = new Map();
    const courseMap = new Map();

    quizHistory.forEach(quiz => {
      const subject = quiz.metadata?.subject || quiz.metadata?.category || 'General';
      const course = quiz.metadata?.course || quiz.metadata?.hierarchical?.course;

      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { count: 0, courses: new Set() });
      }
      subjectMap.get(subject).count++;

      if (course) {
        subjectMap.get(subject).courses.add(course);
        const courseKey = `${subject}→${course}`;
        courseMap.set(courseKey, (courseMap.get(courseKey) || 0) + 1);
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

    return filters;
  }, [quizHistory]);

  // Apply filter to quiz history
  const filteredHistory = useMemo(() => {
    if (selectedFilter === 'all') return quizHistory;

    if (selectedFilter.startsWith('subject:')) {
      const subjectName = selectedFilter.replace('subject:', '');
      return quizHistory.filter(quiz => {
        const quizSubject = quiz.metadata?.subject || quiz.metadata?.category || 'General';
        return quizSubject === subjectName;
      });
    }

    if (selectedFilter.startsWith('course:')) {
      const courseInfo = selectedFilter.replace('course:', '');
      const [subject, course] = courseInfo.split('→');
      return quizHistory.filter(quiz => {
        const quizSubject = quiz.metadata?.subject || quiz.metadata?.category || 'General';
        const quizCourse = quiz.metadata?.course || quiz.metadata?.hierarchical?.course;
        return quizSubject === subject && quizCourse === course;
      });
    }

    return quizHistory;
  }, [quizHistory, selectedFilter]);

  // Load history when screen is focused
  useFocusEffect(
    useCallback(() => {
      refetch();

      // Smooth container animation on mount
      Animated.spring(containerAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }, [refetch])
  );

  // Action handlers
  const handleFilterSelect = useCallback((filterValue) => {
    setSelectedFilter(filterValue);
    setShowFilters(false);
    logger.info(`📋 Applied filter "${filterValue}"`);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const confirmDelete = useCallback((quiz) => {
    const completedDate = new Date(quiz.metadata?.completedAt || quiz.results?.completedAt).toLocaleDateString();
    Alert.alert(
      'Delete Quiz',
      `Are you sure you want to delete this quiz from ${completedDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteQuiz(quiz.id);
            logger.info(`✅ Quiz deleted: ${quiz.id}`);
          }
        }
      ]
    );
  }, [deleteQuiz]);

  const clearAllHistory = useCallback(() => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all quiz history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllHistoryMutation();
            logger.info('✅ All quiz history cleared');
          }
        }
      ]
    );
  }, [clearAllHistoryMutation]);

  const retakeQuiz = useCallback((quiz) => {
    logger.info('🔄 Retaking quiz:', quiz.id);

    if (!quiz.questions || quiz.questions.length === 0) {
      logger.error('❌ Cannot retake quiz: No questions available', {
        quizId: quiz.id,
        isFromBackend: quiz.isFromBackend,
        backendId: quiz.backendId
      });
      Alert.alert(
        'Cannot Retake Quiz',
        'The questions for this quiz are no longer available. This may happen with older quizzes. Please create a new quiz instead.',
        [{ text: 'Understood' }]
      );
      return;
    }

    const quizData = quiz.questions.map((q) => ({
      question_number: q.questionNumber || 1,
      question_text: q.questionText || q.text,
      type: q.type,
      options: q.options || [],
      correct_answer: q.correctAnswer,
      keywords: q.keywords || [],
      formula: q.formula || null,
      solution_steps: q.solution_steps || [],
    }));

    navigation.navigate('QuizScreen', {
      quiz: quizData,
      metadata: {
        ...quiz.metadata,
        mode: 'retake',
        originalScore: quiz.results?.score,
        originalPercentage: quiz.results?.percentage,
        originalDate: quiz.metadata?.completedAt
      }
    });
  }, [navigation]);

  const reviewQuiz = useCallback((quiz) => {
    logger.info('👁️ Reviewing quiz:', quiz.id);
    navigation.navigate('ReviewScreen', {
      quiz: quiz,
      metadata: {
        ...quiz.metadata,
        mode: 'review',
        originalScore: quiz.results?.score,
        originalPercentage: quiz.results?.percentage,
        originalDate: quiz.metadata?.completedAt
      }
    });
  }, [navigation]);

  // Theme styles
  const currentThemeStyles = isDarkMode ? darkStyles : lightStyles;
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

  // Handle back navigation
  const handleBack = useCallback(() => {
    NavigationHelper.safeGoBack(navigation);
  }, [navigation]);

  // Handle take quiz navigation
  const handleTakeQuiz = useCallback(() => {
    navigation.navigate('Upload');
  }, [navigation]);

  // Render individual quiz card
  const renderQuizItem = useCallback(({ item: quiz, index }) => (
    <QuizHistoryCard
      quiz={quiz}
      index={index}
      currentThemeStyles={currentThemeStyles}
      onDelete={confirmDelete}
      onRetake={retakeQuiz}
      onReview={reviewQuiz}
    />
  ), [currentThemeStyles, confirmDelete, retakeQuiz, reviewQuiz]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, currentThemeStyles.container]}>
        <StatusBar barStyle={statusBarStyle} />
        <Animated.View
          style={{
            flex: 1,
            opacity: containerAnim,
            transform: [{ scale: containerAnim }],
          }}
        >
          <BookLoadingScreen message="Loading quiz history..." animationSize={200} />
        </Animated.View>
      </View>
    );
  }

  // Main render
  return (
    <View style={[styles.container, currentThemeStyles.container]}>
      <StatusBar barStyle={statusBarStyle} />
      <Animated.View
        style={{
          flex: 1,
          opacity: containerAnim,
          transform: [{ scale: containerAnim }],
        }}
      >
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderQuizItem}
          ListHeaderComponent={() => (
            <>
              <QuizHistoryHeader
                historyCount={quizHistory.length}
                currentThemeStyles={currentThemeStyles}
                containerAnim={containerAnim}
                onBack={handleBack}
                onClearAll={clearAllHistory}
              />
              <QuizHistoryFilterBar
                showFilters={showFilters}
                selectedFilter={selectedFilter}
                availableFilters={availableFilters}
                filteredCount={filteredHistory.length}
                currentThemeStyles={currentThemeStyles}
                onToggleFilters={toggleFilters}
                onFilterSelect={handleFilterSelect}
              />
            </>
          )}
          ListEmptyComponent={() => (
            <EmptyHistoryState
              currentThemeStyles={currentThemeStyles}
              onTakeQuiz={handleTakeQuiz}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={onRefresh}
              colors={[currentThemeStyles.refreshColor.color]}
              tintColor={currentThemeStyles.refreshColor.color}
            />
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
});

// Light Mode Styles
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F4E3',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#1A2C5B',
  },
  backButtonText: {
    color: '#1A2C5B',
  },
  titleIcon: {
    backgroundColor: 'rgba(26, 44, 91, 0.1)',
    shadowColor: '#1A2C5B',
  },
  titleIconColor: {
    color: '#1A2C5B',
  },
  title: {
    color: '#1A2C5B',
  },
  subtitle: {
    color: '#4A5568',
  },
  historyCount: {
    color: '#4A5568',
  },
  clearButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderColor: '#dc3545',
  },
  clearButtonText: {
    color: '#dc3545',
  },

  // Empty State Light
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
  },
  emptyIcon: {
    color: '#1A2C5B',
    opacity: 0.5,
  },
  emptyTitle: {
    color: '#1A2C5B',
  },
  emptySubtitle: {
    color: '#4A5568',
  },
  emptyButton: {
    backgroundColor: '#1A2C5B',
    shadowColor: '#1A2C5B',
  },
  emptyButtonText: {
    color: '#FFFFFF',
  },

  // Quiz Card Light
  quizCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#1A2C5B',
  },
  quizTitle: {
    color: '#1A2C5B',
  },
  metaText: {
    color: '#4A5568',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  deleteButtonText: {
    color: '#dc3545',
  },
  scoreLabel: {
    color: '#4A5568',
  },
  statIcon: {
    color: '#4A5568',
  },
  statText: {
    color: '#4A5568',
  },

  // Action Buttons Light
  retakeButton: {
    backgroundColor: 'rgba(26, 44, 91, 0.1)',
    borderColor: '#1A2C5B',
  },
  retakeButtonText: {
    color: '#1A2C5B',
  },
  reviewButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: '#D4AF37',
  },
  reviewButtonText: {
    color: '#D4AF37',
  },

  refreshColor: {
    color: '#1A2C5B',
  },

  // Filter Bar Styles (Light Mode)
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(26, 44, 91, 0.1)',
    shadowColor: '#1A2C5B',
  },
  filterButtonText: {
    color: '#1A2C5B',
  },
  filterCount: {
    color: '#4A5568',
  },
  filterIcon: {
    color: '#D4AF37',
  },
  filtersDropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: 'rgba(26, 44, 91, 0.1)',
    shadowColor: '#1A2C5B',
  },
  filterOption: {
    borderBottomColor: 'rgba(26, 44, 91, 0.1)',
  },
  selectedFilter: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  filterOptionText: {
    color: '#1A2C5B',
  },
  selectedFilterText: {
    color: '#D4AF37',
  },
  filterSublabel: {
    color: '#4A5568',
  },
  filterBadge: {
    backgroundColor: 'rgba(26, 44, 91, 0.1)',
  },
  filterBadgeText: {
    color: '#4A5568',
  },
});

// Dark Mode Styles
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1A2C5B',
  },
  backButton: {
    backgroundColor: 'rgba(44, 70, 125, 0.8)',
    shadowColor: '#D4AF37',
  },
  backButtonText: {
    color: '#F8F4E3',
  },
  titleIcon: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#D4AF37',
  },
  titleIconColor: {
    color: '#D4AF37',
  },
  title: {
    color: '#F8F4E3',
  },
  subtitle: {
    color: '#CBD5E0',
  },
  historyCount: {
    color: '#CBD5E0',
  },
  clearButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    borderColor: '#ff6b7a',
  },
  clearButtonText: {
    color: '#ff6b7a',
  },

  // Empty State Dark
  emptyContainer: {
    backgroundColor: 'rgba(44, 70, 125, 0.5)',
    borderRadius: 20,
  },
  emptyIcon: {
    color: '#F8F4E3',
    opacity: 0.5,
  },
  emptyTitle: {
    color: '#F8F4E3',
  },
  emptySubtitle: {
    color: '#CBD5E0',
  },
  emptyButton: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
  },
  emptyButtonText: {
    color: '#1A2C5B',
  },

  // Quiz Card Dark
  quizCard: {
    backgroundColor: 'rgba(44, 70, 125, 0.8)',
    shadowColor: '#D4AF37',
  },
  quizTitle: {
    color: '#F8F4E3',
  },
  metaText: {
    color: '#CBD5E0',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
  },
  deleteButtonText: {
    color: '#ff6b7a',
  },
  scoreLabel: {
    color: '#CBD5E0',
  },
  statIcon: {
    color: '#CBD5E0',
  },
  statText: {
    color: '#CBD5E0',
  },

  // Action Buttons Dark
  retakeButton: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderColor: '#F8F4E3',
  },
  retakeButtonText: {
    color: '#F8F4E3',
  },
  reviewButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#D4AF37',
  },
  reviewButtonText: {
    color: '#D4AF37',
  },

  refreshColor: {
    color: '#D4AF37',
  },

  // Filter Bar Styles (Dark Mode)
  filterButton: {
    backgroundColor: 'rgba(44, 70, 125, 0.8)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#D4AF37',
  },
  filterButtonText: {
    color: '#F8F4E3',
  },
  filterCount: {
    color: '#CBD5E0',
  },
  filterIcon: {
    color: '#D4AF37',
  },
  filtersDropdown: {
    backgroundColor: 'rgba(44, 70, 125, 0.95)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#D4AF37',
  },
  filterOption: {
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  filterOptionText: {
    color: '#F8F4E3',
  },
  filterSublabel: {
    color: '#CBD5E0',
  },
  filterBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  filterBadgeText: {
    color: '#CBD5E0',
  },
});
