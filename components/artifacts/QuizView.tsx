/**
 * QuizView - Interactive quiz component for chapter artifacts
 *
 * Features:
 * - Multiple choice questions
 * - Answer selection with visual feedback
 * - Immediate feedback (correct/incorrect)
 * - Score tracking throughout quiz
 * - Explanation after answer selection
 * - Results summary at end with percentage
 * - Retry functionality
 * - Generate button (if no quiz)
 * - Loading and error states
 * - Alexandria theme
 * - Progress indicator
 *
 * @param quiz - Quiz data object with questions
 * @param loading - Loading state
 * @param error - Error message
 * @param onGenerate - Callback to generate quiz
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

interface QuizViewProps {
  quiz: QuizData | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  loading,
  error,
  onGenerate,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);

  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      surface: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accentLight,
      accentDark: Colors.accentDark,
      primary: Colors.primary,
      error: Colors.error,
      success: Colors.success,
      border: Colors.border,
    }),
    []
  );

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return; // Prevent changing answer after selection

    setSelectedAnswer(index);
    setShowExplanation(true);

    // Only count score once per question
    if (!answeredQuestions.includes(currentQuestion)) {
      if (quiz && index === quiz.questions[currentQuestion].correct_index) {
        setScore(score + 1);
      }
      setAnsweredQuestions([...answeredQuestions, currentQuestion]);
    }
  };

  const handleNext = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnsweredQuestions([]);
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Generating quiz...
        </Text>
        <Text style={[styles.loadingSubtext, { color: themeColors.textMuted }]}>
          Preparing questions
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name="exclamation-triangle" size={56} color={themeColors.error} />
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>
          Failed to load quiz
        </Text>
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  // Empty state
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name="question-circle" size={64} color={themeColors.textMuted} />
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
          No quiz yet
        </Text>
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
          Generate an AI-powered quiz to test your knowledge
        </Text>
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: themeColors.accent }]}
          onPress={onGenerate}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="magic" size={16} color={Colors.white} style={styles.buttonIcon} />
          <Text style={styles.generateText}>Generate Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Results screen
  if (quizComplete) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const isPerfect = percentage === 100;
    const isGood = percentage >= 70;
    const resultColor = isPerfect
      ? themeColors.success
      : isGood
      ? themeColors.accent
      : themeColors.error;

    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <View style={[styles.resultsCard, { backgroundColor: themeColors.surface }]}>
          <FontAwesome5
            name={isPerfect ? 'trophy' : isGood ? 'check-circle' : 'times-circle'}
            size={64}
            color={resultColor}
          />
          <Text style={[styles.resultsTitle, { color: themeColors.text }]}>
            {isPerfect ? 'Perfect Score!' : isGood ? 'Well Done!' : 'Keep Practicing!'}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: resultColor }]}>
              {score} / {quiz.questions.length}
            </Text>
            <Text style={[styles.percentageText, { color: resultColor }]}>
              {percentage}%
            </Text>
          </View>
          <View style={styles.resultStats}>
            <View style={styles.statItem}>
              <FontAwesome5 name="check" size={16} color={themeColors.success} />
              <Text style={[styles.statText, { color: themeColors.text }]}>
                {score} Correct
              </Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="times" size={16} color={themeColors.error} />
              <Text style={[styles.statText, { color: themeColors.text }]}>
                {quiz.questions.length - score} Incorrect
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.accent }]}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="redo" size={16} color={Colors.white} style={styles.buttonIcon} />
            <Text style={styles.retryText}>Retry Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Quiz content
  const question = quiz.questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correct_index;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <Text style={[styles.progressText, { color: themeColors.text }]}>
          Question {currentQuestion + 1} of {quiz.questions.length}
        </Text>
        <View style={styles.scoreDisplay}>
          <FontAwesome5 name="star" size={14} color={themeColors.accent} />
          <Text style={[styles.scoreDisplayText, { color: themeColors.text }]}>
            Score: {score}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: themeColors.border }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: themeColors.accent,
              width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Question Card */}
      <View style={[styles.questionCard, { backgroundColor: themeColors.surface }]}>
        <View style={styles.questionHeader}>
          <FontAwesome5 name="question-circle" size={20} color={themeColors.accent} />
        </View>
        <Text style={[styles.questionText, { color: themeColors.text }]}>
          {question.question}
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === question.correct_index;
          const showCorrect = showExplanation && isCorrectOption;
          const showIncorrect = showExplanation && isSelected && !isCorrect;

          let optionStyle = styles.option;
          let optionBorderColor = themeColors.border;
          let optionBackgroundColor = themeColors.surface;
          let optionTextColor = themeColors.text;
          let iconName = '';
          let iconColor = '';

          if (showCorrect) {
            optionBorderColor = themeColors.success;
            optionBackgroundColor = `${themeColors.success}15`;
            iconName = 'check-circle';
            iconColor = themeColors.success;
          } else if (showIncorrect) {
            optionBorderColor = themeColors.error;
            optionBackgroundColor = `${themeColors.error}15`;
            iconName = 'times-circle';
            iconColor = themeColors.error;
          } else if (isSelected) {
            optionBorderColor = themeColors.accent;
          }

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                {
                  backgroundColor: optionBackgroundColor,
                  borderColor: optionBorderColor,
                },
              ]}
              onPress={() => handleAnswerSelect(index)}
              disabled={showExplanation}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIndex, { backgroundColor: themeColors.border }]}>
                  <Text style={[styles.optionIndexText, { color: themeColors.text }]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: optionTextColor }]}>
                  {option}
                </Text>
                {iconName && (
                  <FontAwesome5 name={iconName} size={20} color={iconColor} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Explanation */}
      {showExplanation && (
        <View
          style={[
            styles.explanationCard,
            {
              backgroundColor: isCorrect
                ? `${themeColors.success}15`
                : `${themeColors.error}15`,
              borderColor: isCorrect ? themeColors.success : themeColors.error,
            },
          ]}
        >
          <View style={styles.explanationHeader}>
            <FontAwesome5
              name={isCorrect ? 'check-circle' : 'times-circle'}
              size={20}
              color={isCorrect ? themeColors.success : themeColors.error}
            />
            <Text
              style={[
                styles.explanationTitle,
                { color: isCorrect ? themeColors.success : themeColors.error },
              ]}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </Text>
          </View>
          <Text style={[styles.explanationText, { color: themeColors.text }]}>
            {question.explanation}
          </Text>
        </View>
      )}

      {/* Next Button */}
      {showExplanation && (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: themeColors.accent }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestion < quiz.questions.length - 1 ? 'Next Question' : 'See Results'}
          </Text>
          <FontAwesome5
            name={currentQuestion < quiz.questions.length - 1 ? 'arrow-right' : 'flag-checkered'}
            size={16}
            color={Colors.white}
          />
        </TouchableOpacity>
      )}

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  generateText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreDisplayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  option: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIndexText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  explanationCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  resultsCard: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '700',
  },
  resultStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 15,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default QuizView;
