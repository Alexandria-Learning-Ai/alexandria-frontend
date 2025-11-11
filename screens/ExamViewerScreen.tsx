/**
 * ExamViewerScreen - Professional Exam Taking Interface (Phase 1.5 + Scaffold)
 *
 * Now uses ExamScreen scaffold for professional exam experience
 *
 * Features:
 * - Multi-section navigation with tabs
 * - Timer with countdown and auto-submit
 * - Auto-save every 30 seconds
 * - Progress tracking (answered/total)
 * - Question-by-question navigation
 * - Review mode support
 * - Submit confirmation with unanswered count
 * - Alexandria theme styling
 *
 * Upgrade from Phase 1.5:
 * - Replaced simple scroll view with ExamScreen scaffold
 * - Added section-based navigation
 * - Added timer support
 * - Enhanced progress tracking
 * - Professional exam UI
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { useExam, useStructuredExam } from '../hooks/useExamQueries';
import { flattenExamSections } from '../services/examService';
import ExamScreen from '../components/exam/ExamScreen';
import { colors, spacing } from '../theme/tokens';
import logger from '../utils/logger';
import type { ExamViewerScreenProps } from '../types/exam';

/**
 * ExamViewerScreen Component
 *
 * Professional exam taking experience with ExamScreen scaffold
 *
 * @param route.params.examId - UUID of exam to display
 * @param route.params.mode - 'take' | 'review' | 'practice'
 * @param route.params.duration - Timer duration in minutes (optional)
 */
/**
 * Calculate duration from exam_length
 * Short = 30 minutes
 * Standard = 60 minutes
 * Full-Length = 120 minutes
 */
function getExamDuration(examLength: string): number | null {
  const lengthMap: Record<string, number> = {
    'Short': 30,
    'Standard': 60,
    'Full-Length': 120,
  };
  return lengthMap[examLength] || null;
}

export default function ExamViewerScreen({
  navigation,
  route
}: ExamViewerScreenProps) {
  const { examId, mode = 'take' } = route.params;

  // Try structured format first (Math Intelligence), fallback to legacy
  const { data: structuredExam, isLoading, error } = useStructuredExam(examId);

  // Calculate duration from exam_length (or override from route params)
  const duration = route.params.duration ||
    (structuredExam ? (structuredExam.duration_minutes || getExamDuration(structuredExam.exam_length)) : null);

  /**
   * Handle exam submission
   */
  const handleSubmit = async (answers: Record<number, any>) => {
    try {
      logger.info('Exam submitted', { examId, answerCount: Object.keys(answers).length });

      // Navigate to results screen with answers
      (navigation as any).navigate('ExamResults', {
        examId,
        answers
      });
    } catch (error) {
      logger.error('Failed to handle submission:', error);
      throw error;
    }
  };

  /**
   * Handle exit (from submit or back button)
   */
  const handleExit = () => {
    navigation.goBack();
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading exam...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !structuredExam) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to Load Exam</Text>
        <Text style={styles.errorText}>
          {error?.message || 'An unexpected error occurred.'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Validate exam structure before proceeding
  if (!structuredExam.sections || !Array.isArray(structuredExam.sections)) {
    logger.error('Invalid exam structure: missing sections', { examId, exam: structuredExam });
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Invalid Exam Data</Text>
        <Text style={styles.errorText}>
          The exam data is corrupted or incomplete. Please try regenerating the exam.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Flatten structured exam for backward compatibility (still needed for context)
  const questions = flattenExamSections(structuredExam);

  // Validate we have questions after flattening
  if (!questions || questions.length === 0) {
    logger.error('No questions found after flattening exam', { examId, sections: structuredExam.sections });
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>No Questions Found</Text>
        <Text style={styles.errorText}>
          This exam appears to be empty. Please try regenerating it.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Log Math Intelligence features
  const hasSectionGraphs = structuredExam.sections.some(s => s.graph_image);
  const hasQuestionLatex = questions.some(q =>
    q.metadata && typeof q.metadata === 'object' && 'requires_latex' in q.metadata
  );

  logger.info('Rendering exam with Math Intelligence features', {
    examId,
    sectionsCount: structuredExam.sections.length,
    totalQuestions: questions.length,
    hasSectionGraphs,
    hasQuestionLatex,
    usingSectionRenderer: hasSectionGraphs || structuredExam.sections.length > 0
  });

  // Render exam with section-aware scaffold
  return (
    <ExamScreen
      examId={examId}
      questions={questions}
      structuredSections={structuredExam.sections} // Pass structured sections
      title={structuredExam.title || structuredExam.topic || 'Exam'}
      duration={duration || null}
      mode={mode}
      onSubmit={handleSubmit}
      onExit={handleExit}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: spacing[16],
    fontSize: 16,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing[20],
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.danger,
    marginBottom: spacing[12],
  },
  errorText: {
    fontSize: 16,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: spacing[24],
  },
  retryButton: {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
    backgroundColor: colors.gold,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg,
  },
});
