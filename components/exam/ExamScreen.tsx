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

import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ExamProvider, useCurrentQuestion, useExamContext } from './context/ExamContext';
import ExamHeader from './ExamHeader';
import ExamFooter from './ExamFooter';
import SectionTabs from './SectionTabs';
import QuestionRenderer from './QuestionRenderer';
import { ParsedQuestion, ExamMode } from '../../types/exam';
import { colors } from '../../theme/tokens';

/**
 * ExamScreen props
 */
export interface ExamScreenProps {
  examId: string;
  questions: ParsedQuestion[];
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
  const currentQuestion = useCurrentQuestion();
  const { setAnswer, answers, mode, timer } = useExamContext();

  if (!currentQuestion) {
    return null;
  }

  const userAnswer = answers[currentQuestion.question_number];

  /**
   * Handle answer change
   */
  const handleAnswer = (questionNumber: number, answer: any) => {
    setAnswer(questionNumber, answer);
  };

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

      {/* Question Content */}
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
});

export default ExamScreen;

// Re-export context hook for convenience
export { useExamContext, useCurrentQuestion, useExamProgress } from './context/ExamContext';
