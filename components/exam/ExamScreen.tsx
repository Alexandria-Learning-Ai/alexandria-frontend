/**
 * ExamScreen - Main exam container with multi-section navigation and timer
 *
 * Orchestrates:
 * - ExamProvider (context)
 * - ExamHeader (timer + progress)
 * - SectionTabs (multi-section navigation)
 * - QuestionRenderer (current question)
 * - ExamFooter (navigation + submit)
 *
 * Features:
 * - Professional exam experience
 * - Timed exams with countdown
 * - Auto-save every 30 seconds
 * - Section-based navigation
 * - Progress tracking
 * - Responsive layout
 *
 * Usage:
 * <ExamScreen
 *   examId="uuid"
 *   questions={parsedQuestions}
 *   title="Biology Exam"
 *   duration={60}
 *   onSubmit={(answers) => handleSubmit(answers)}
 * />
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { ExamProvider, useCurrentQuestion, useExamContext } from './context/ExamContext';
import ExamHeader from './ExamHeader';
import ExamFooter from './ExamFooter';
import SectionTabs from './SectionTabs';
import QuestionRenderer from './QuestionRenderer';
import SectionRenderer from './SectionRenderer';
import { ParsedQuestion, ExamMode, StructuredExamSection } from '../../types/exam';
import { colors, spacing } from '../../theme/tokens';
import logger from '../../utils/logger';

/**
 * ExamScreen props
 */
export interface ExamScreenProps {
  examId: string;
  questions: ParsedQuestion[];
  structuredSections?: StructuredExamSection[]; // New: structured sections with graphs
  title?: string;
  duration?: number | null; // in minutes, null = no timer
  mode?: ExamMode;
  onSubmit?: (answers: Record<number, any>) => Promise<void>;
  onExit?: () => void;
}

/**
 * Inner component that uses ExamContext
 */
const ExamScreenContent: React.FC<{ title?: string; onExit?: () => void }> = ({
  title,
  onExit,
}) => {
  const { structuredSections, setAnswer, answers, mode, timer, questions } = useExamContext();
  const currentQuestion = useCurrentQuestion();

  // Determine if we should use section-aware rendering
  const useSectionRendering = useMemo(() => {
    const hasSections = structuredSections && structuredSections.length > 0;
    const hasGraphs = structuredSections?.some(s => s.graph_image);

    if (hasSections) {
      logger.info('Using section-aware rendering', {
        sectionCount: structuredSections.length,
        hasGraphs
      });
    }

    return hasSections;
  }, [structuredSections]);

  /**
   * Handle answer change
   */
  const handleAnswer = (questionNumber: number, answer: any) => {
    setAnswer(questionNumber, answer);
  };

  // Section-aware rendering (new Math Intelligence format)
  if (useSectionRendering && structuredSections) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header: Title + Timer + Progress */}
        <ExamHeader
          title={title}
          showTimer={timer.duration > 0}
          showProgress={true}
          showPauseButton={false}
        />

        {/* Section Tabs */}
        <SectionTabs showCompletion={true} />

        {/* Section-based Content */}
        <FlatList
          data={structuredSections}
          renderItem={({ item, index }) => {
            // Calculate starting question number for this section
            const startingQuestionNumber = structuredSections
              .slice(0, index)
              .reduce((sum, section) => sum + (section.questions?.length || 0), 0) + 1;

            return (
              <SectionRenderer
                section={item}
                sectionIndex={index}
                onAnswerChange={handleAnswer}
                startingQuestionNumber={startingQuestionNumber}
                userAnswers={answers}
                mode={mode}
              />
            );
          }}
          keyExtractor={(item, index) => `section-${index}`}
          style={styles.questionContainer}
          contentContainerStyle={styles.sectionContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Footer: Navigation + Submit */}
        <ExamFooter onSubmit={onExit} showQuestionNumber={true} />
      </KeyboardAvoidingView>
    );
  }

  // Legacy question-by-question rendering (backward compatibility)
  if (!currentQuestion) {
    return null;
  }

  const userAnswer = answers[currentQuestion.question_number];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header: Title + Timer + Progress */}
      <ExamHeader
        title={title}
        showTimer={timer.duration > 0}
        showProgress={true}
        showPauseButton={false}
      />

      {/* Section Tabs */}
      <SectionTabs showCompletion={true} />

      {/* Question Content (Legacy) */}
      <ScrollView
        style={styles.questionContainer}
        contentContainerStyle={styles.questionContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <QuestionRenderer
          question={currentQuestion}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      </ScrollView>

      {/* Footer: Navigation + Submit */}
      <ExamFooter onSubmit={onExit} showQuestionNumber={true} />
    </KeyboardAvoidingView>
  );
};

/**
 * Main ExamScreen component with provider
 */
const ExamScreen: React.FC<ExamScreenProps> = ({
  examId,
  questions,
  structuredSections,
  title,
  duration = null,
  mode = 'take',
  onSubmit,
  onExit,
}) => {
  return (
    <ExamProvider
      examId={examId}
      questions={questions}
      structuredSections={structuredSections}
      mode={mode}
      duration={duration}
      onSubmit={onSubmit}
    >
      <ExamScreenContent title={title} onExit={onExit} />
    </ExamProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  questionContainer: {
    flex: 1,
  },
  questionContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContent: {
    padding: spacing[20],
    paddingBottom: spacing[32],
  },
});

export default ExamScreen;

// Re-export context hook for convenience
export { useExamContext, useCurrentQuestion, useExamProgress } from './context/ExamContext';
