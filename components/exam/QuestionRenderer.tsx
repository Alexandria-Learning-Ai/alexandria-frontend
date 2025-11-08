/**
 * QuestionRenderer - Core Extensible Component
 *
 * Dynamically renders questions based on type
 * with clean switch/case architecture for easy Phase 5 extension
 *
 * Phase 3: Supports true_false, multiple_choice, written
 * Phase 5 Ready: Just uncomment imports and add cases
 *
 * Features:
 * - Type-safe question rendering
 * - Extensible architecture
 * - Graceful fallback for unsupported types
 * - Mode-based rendering (take vs review)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ParsedQuestion, ExamMode } from '../../types/exam';

// Phase 3 Imports
import TrueFalseQuestion from './QuestionTypes/TrueFalseQuestion';
import MultipleChoiceQuestion from './QuestionTypes/MultipleChoiceQuestion';
import WrittenQuestion from './QuestionTypes/WrittenQuestion';

// Phase 1.5B Imports (4 new interactive types)
import ImageQuestion from './QuestionTypes/ImageQuestion';
import DragDropQuestion from './QuestionTypes/DragDropQuestion';
import MathQuestion from './QuestionTypes/MathQuestion';
import DiagramQuestion from './QuestionTypes/DiagramQuestion';

// Phase 5 Imports
import CodeQuestion from './QuestionTypes/CodeQuestion';
// Future: import MediaQuestion from './QuestionTypes/MediaQuestion';

import { colors } from '../../theme/tokens';
import logger from '../../utils/logger';

interface QuestionRendererProps {
  question: ParsedQuestion;
  userAnswer?: any;
  onAnswer: (questionNumber: number, answer: any) => void;
  mode: ExamMode;
}

/**
 * QuestionRenderer Component
 *
 * Central dispatcher for question type rendering
 * Uses switch/case for O(1) lookup and easy extensibility
 *
 * @param question - Question data with type information
 * @param userAnswer - Current user answer (any format)
 * @param onAnswer - Callback when user answers
 * @param mode - 'take' (interactive) or 'review' (show answers)
 */
export default function QuestionRenderer({
  question,
  userAnswer,
  onAnswer,
  mode
}: QuestionRendererProps) {

  const handleAnswer = (answer: any) => {
    logger.debug('Answer provided for question:', {
      questionNumber: question.question_number,
      questionType: question.question_type,
      answerType: typeof answer
    });
    onAnswer(question.question_number, answer);
  };

  // ⭐ EXTENSIBLE SWITCH - Add new types here in Phase 5
  switch (question.question_type) {
    case 'true_false':
      return (
        <TrueFalseQuestion
          question={question as any}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );

    case 'multiple_choice':
      return (
        <MultipleChoiceQuestion
          question={question as any}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );

    case 'written':
      return (
        <WrittenQuestion
          question={question as any}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );

    // ⭐ Phase 1.5B Cases (4 new interactive types)
    case 'image':
      return (
        <ImageQuestion
          question={question as any}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );

    case 'drag_drop':
      return (
        <DragDropQuestion
          question={question as any}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );

    case 'math':
      return (
        <MathQuestion
          question={question as any}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );

    case 'diagram':
      return (
        <DiagramQuestion
          question={question as any}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );

    // ⭐ Phase 5 Code Question (Piston API Integration)
    case 'code':
      return (
        <CodeQuestion
          question={question as any}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );

    // 🔮 Future Phase 5 Cases (not yet implemented)
    /*
    case 'media':
      return (
        <MediaQuestion
          question={question as MediaQuestion}
          userAnswer={userAnswer}
          onAnswer={handleAnswer}
          mode={mode}
        />
      );
    */

    // Fallback for unsupported question types
    default:
      logger.warn('Unsupported question type encountered:', {
        questionNumber: question.question_number,
        questionType: question.question_type
      });

      return (
        <View style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedTitle}>
            Unsupported Question Type
          </Text>
          <Text style={styles.unsupportedSubtitle}>
            Type: {question.question_type}
          </Text>
          <Text style={styles.fallbackText}>
            {question.question_text}
          </Text>
          {question.correct_answer && mode === 'review' && (
            <Text style={styles.correctAnswer}>
              Correct Answer: {question.correct_answer}
            </Text>
          )}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  unsupportedContainer: {
    padding: 20,
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE69C',
    marginBottom: 16,
  },
  unsupportedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  unsupportedSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },
  fallbackText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  correctAnswer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginTop: 8,
  },
});
