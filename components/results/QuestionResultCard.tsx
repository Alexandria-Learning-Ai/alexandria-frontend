import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { Question, ThemeStyles } from '../../types';
import { getDisplayCorrectAnswer, getDisplayUserAnswer } from '../../utils/answerFormatters';
import logger from '../../utils/logger';

interface QuestionResultCardProps {
  question: Question;
  index: number;
  userAnswer: any;
  themeStyles: ThemeStyles;
}

const QuestionResultCard: React.FC<QuestionResultCardProps> = ({
  question,
  index,
  userAnswer,
  themeStyles,
}) => {
  if (!question) return null;

  const isMultiUserAns = Array.isArray(userAnswer);

  // Debug logging for true/false questions
  if (question.type === 'true_false') {
    logger.info(`🔍 True/False Debug - Question ${index + 1}:`, {
      questionId: question.id,
      userAnswer: userAnswer,
      userAnswerType: typeof userAnswer,
      correctAnswer: question.correctAnswer,
      correctAnswerType: typeof question.correctAnswer,
      isCorrect: question.isCorrect,
    });
  }

  const displayCorrectAnswer = getDisplayCorrectAnswer(question);
  const displayUserAnswer = getDisplayUserAnswer(question, userAnswer, isMultiUserAns);

  const isCorrect = question.isCorrect;

  return (
    <Animatable.View
      animation="slideInUp"
      delay={800 + index * 100}
      style={[
        styles.questionCard,
        themeStyles.questionCard,
        isCorrect ? themeStyles.correctCard : themeStyles.incorrectCard,
      ]}
    >
      <View style={styles.questionHeader}>
        <View
          style={[
            styles.questionNumber,
            themeStyles.questionNumber,
            isCorrect ? themeStyles.correctNumber : themeStyles.incorrectNumber,
          ]}
        >
          <Text
            style={[
              styles.questionNumberText,
              isCorrect ? themeStyles.correctNumberText : themeStyles.incorrectNumberText,
            ]}
          >
            {index + 1}
          </Text>
        </View>
        <View
          style={[styles.resultIndicator, isCorrect ? styles.correctIndicator : styles.incorrectIndicator]}
        >
          <FontAwesome5 name={isCorrect ? 'check' : 'times'} size={16} color="#FFFFFF" />
        </View>
      </View>

      <Text style={[styles.questionText, themeStyles.questionText]}>
        {question.text || question.questionText}
      </Text>

      <View style={styles.answerSection}>
        <Text style={[styles.answerLabel, themeStyles.answerLabel]}>Your Answer:</Text>
        <Text
          style={[
            styles.userAnswer,
            isCorrect ? styles.correctAnswer : styles.incorrectAnswer,
            !isCorrect && styles.strikeThrough,
          ]}
        >
          {displayUserAnswer}
        </Text>
      </View>

      {!isCorrect && (
        <View style={styles.answerSection}>
          <Text style={[styles.answerLabel, themeStyles.answerLabel]}>Correct Answer:</Text>
          <Text style={[styles.correctAnswerDisplay, themeStyles.correctAnswerDisplay]}>
            {displayCorrectAnswer}
          </Text>
        </View>
      )}

      {question.type === 'math' &&
        question.solution_steps &&
        Array.isArray(question.solution_steps) &&
        question.solution_steps.length > 0 && (
          <View style={[styles.solutionContainer, themeStyles.solutionContainer]}>
            <Text style={[styles.solutionTitle, themeStyles.solutionTitle]}>Solution Steps:</Text>
            {question.solution_steps.map((step: string, stepIndex: number) => (
              <Text key={stepIndex} style={[styles.solutionStep, themeStyles.solutionStep]}>
                {stepIndex + 1}. {step}
              </Text>
            ))}
          </View>
        )}
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  resultIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctIndicator: {
    backgroundColor: '#22c55e',
  },
  incorrectIndicator: {
    backgroundColor: '#ef4444',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 24,
  },
  answerSection: {
    marginTop: 8,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  userAnswer: {
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  correctAnswer: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  incorrectAnswer: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  strikeThrough: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  correctAnswerDisplay: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  solutionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  solutionStep: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default QuestionResultCard;
