/**
 * QuestionCard.tsx
 *
 * Displays a single quiz question with its options/input and handles user interaction.
 * Supports multiple question types: multiple_choice, true_false, open_ended, math.
 *
 * Extracted from QuizScreen.js for better maintainability and testing.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import VisualQuestionRenderer from '../VisualQuestionRenderer';
import DatabaseTableVisualization from '../DatabaseTableVisualization';
import { FillInBlankQuestion } from './FillInBlankQuestion';
import logger from '../../utils/logger';
import type { Question, ThemeColors } from '../../types';

interface QuestionCardProps {
  question: Question;
  index: number;
  userAnswer?: string | string[] | boolean;
  isSubmitted: boolean;
  themeColors: ThemeColors;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onSelectOption: (questionId: string | number, value: string) => void;
  onShortAnswer: (questionId: string | number, text: string) => void;
  onVisualInteraction?: (questionId: string | number, data: any) => void;
  translate?: (key: string) => string;
}

interface DifficultyInfo {
  icon: string;
  color: string;
}

interface OptionData {
  id?: string | number;
  label: string;
  text: string;
}

/**
 * Get icon for question type
 */
const getQuestionIcon = (type?: string): string => {
  const iconMap: Record<string, string> = {
    'multiple_choice': 'list-ul',
    'true_false': 'balance-scale',
    'open_ended': 'pen-fancy',
    'fill_in_blank': 'pen-fancy',
    'math': 'calculator',
  };
  return iconMap[type || 'multiple_choice'] || 'question-circle';
};

/**
 * Get difficulty indicator info
 */
const getDifficultyInfo = (difficulty?: string, colors?: ThemeColors): DifficultyInfo => {
  const difficultyMap: Record<string, DifficultyInfo> = {
    easy: { icon: 'leaf', color: colors?.success || '#28a745' },
    medium: { icon: 'fire', color: colors?.warning || '#FFD700' },
    hard: { icon: 'bolt', color: colors?.error || '#dc3545' },
    expert: { icon: 'star', color: colors?.alexandriaGold || '#D4AF37' },
    genius: { icon: 'crown', color: colors?.alexandriaGold || '#D4AF37' },
  };
  const key = difficulty?.toLowerCase() || 'medium';
  return difficultyMap[key] ?? difficultyMap.medium;
};

/**
 * Normalize answer for comparison (handles boolean, string, null)
 */
const normalizeAnswer = (answer: any): string => {
  if (answer === null || answer === undefined) return '';
  if (typeof answer === 'boolean') return answer ? 'true' : 'false';
  return String(answer).trim().toLowerCase();
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  userAnswer,
  isSubmitted,
  themeColors,
  fadeAnim,
  slideAnim,
  scaleAnim,
  onSelectOption,
  onShortAnswer,
  onVisualInteraction,
  translate = (key) => key.split('.').pop() || key,
}) => {
  if (!question) return null;

  const difficultyInfo = getDifficultyInfo(question.difficulty, themeColors);
  const showFeedback = isSubmitted;

  /**
   * Handle visual element interactions (charts, tables, etc.)
   */
  const handleVisualInteraction = (data: any) => {
    logger.info('Visual interaction:', data);
    if (onVisualInteraction) {
      onVisualInteraction(question.id, data);
    }
  };

  /**
   * Render multiple choice options
   */
  const renderMultipleChoice = () => {
    if (question.type !== 'multiple_choice' || !question.options) return null;

    return (
      <View style={styles.optionsContainer}>
        {(question.options as OptionData[]).map((option, optIndex) => {
          const isSelected = userAnswer === option.label;
          const isCorrect = option.label === question.correctAnswer;

          return (
            <Animatable.View
              key={option.id || optIndex}
              animation="slideInLeft"
              delay={optIndex * 100}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    borderColor: isSelected && !showFeedback
                      ? themeColors.alexandriaGold
                      : showFeedback && isCorrect
                      ? themeColors.success
                      : showFeedback && isSelected && !isCorrect
                      ? themeColors.error
                      : themeColors.border,
                    backgroundColor: isSelected && !showFeedback
                      ? themeColors.alexandriaGold + '20'
                      : showFeedback && isCorrect
                      ? themeColors.success + '20'
                      : showFeedback && isSelected && !isCorrect
                      ? themeColors.error + '20'
                      : themeColors.surface,
                  }
                ]}
                onPress={() => onSelectOption(question.id, option.label)}
                disabled={isSubmitted}
                activeOpacity={0.8}
              >
                <Animated.View style={[
                  styles.optionContent,
                  { transform: [{ scale: scaleAnim }] }
                ]}>
                  <LinearGradient
                    colors={[
                      isSelected && !showFeedback
                        ? themeColors.alexandriaGold
                        : showFeedback && isCorrect
                        ? themeColors.success
                        : showFeedback && isSelected && !isCorrect
                        ? themeColors.error
                        : themeColors.alexandriaBronze,
                      isSelected && !showFeedback
                        ? themeColors.alexandriaBronze
                        : showFeedback && isCorrect
                        ? themeColors.success
                        : showFeedback && isSelected && !isCorrect
                        ? themeColors.error
                        : themeColors.alexandriaGold,
                    ]}
                    style={styles.optionLetter}
                  >
                    <Text style={styles.optionLetterText}>
                      {option.label}
                    </Text>
                  </LinearGradient>

                  <Text style={[
                    styles.optionText,
                    {
                      color: isSelected && !showFeedback
                        ? themeColors.alexandriaGold
                        : showFeedback && isCorrect
                        ? themeColors.success
                        : showFeedback && isSelected && !isCorrect
                        ? themeColors.error
                        : themeColors.text
                    }
                  ]}>
                    {option.text}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            </Animatable.View>
          );
        })}
      </View>
    );
  };

  /**
   * Render true/false options
   */
  const renderTrueFalse = () => {
    if (question.type !== 'true_false') return null;

    return (
      <View style={styles.trueFalseContainer}>
        {['true', 'false'].map((value, idx) => {
          const normalizedUserAnswer = normalizeAnswer(userAnswer);
          const normalizedCorrectAnswer = normalizeAnswer(question.correctAnswer);

          const isSelected = normalizedUserAnswer === value;
          const isCorrect = normalizedCorrectAnswer === value;

          return (
            <Animatable.View
              key={value}
              animation="bounceIn"
              delay={idx * 200}
              style={styles.trueFalseButtonContainer}
            >
              <TouchableOpacity
                style={[
                  styles.trueFalseButton,
                  {
                    borderColor: isSelected && !showFeedback
                      ? themeColors.alexandriaGold
                      : showFeedback && isCorrect
                      ? themeColors.success
                      : showFeedback && isSelected && !isCorrect
                      ? themeColors.error
                      : themeColors.border,
                    backgroundColor: isSelected && !showFeedback
                      ? themeColors.alexandriaGold + '20'
                      : showFeedback && isCorrect
                      ? themeColors.success + '20'
                      : showFeedback && isSelected && !isCorrect
                      ? themeColors.error + '20'
                      : themeColors.surface,
                  }
                ]}
                onPress={() => onSelectOption(question.id, value)}
                disabled={isSubmitted}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    isSelected && !showFeedback
                      ? themeColors.alexandriaGold
                      : showFeedback && isCorrect
                      ? themeColors.success
                      : showFeedback && isSelected && !isCorrect
                      ? themeColors.error
                      : themeColors.alexandriaBronze,
                    isSelected && !showFeedback
                      ? themeColors.alexandriaBronze
                      : showFeedback && isCorrect
                      ? themeColors.success
                      : showFeedback && isSelected && !isCorrect
                      ? themeColors.error
                      : themeColors.alexandriaGold,
                  ]}
                  style={styles.trueFalseIcon}
                >
                  <FontAwesome5
                    name={value === 'true' ? 'check' : 'times'}
                    size={32}
                    color="#FFFFFF"
                  />
                </LinearGradient>

                <Text style={[
                  styles.trueFalseText,
                  {
                    color: isSelected && !showFeedback
                      ? themeColors.alexandriaGold
                      : showFeedback && isCorrect
                      ? themeColors.success
                      : showFeedback && isSelected && !isCorrect
                      ? themeColors.error
                      : themeColors.text
                  }
                ]}>
                  {value.toUpperCase()}
                </Text>

                {showFeedback && isCorrect && (
                  <Text style={[
                    styles.trueFalseCorrectText,
                    { color: themeColors.success }
                  ]}>
                    ✓ Correct
                  </Text>
                )}
              </TouchableOpacity>
            </Animatable.View>
          );
        })}
      </View>
    );
  };

  /**
   * Render open-ended or math input
   */
  const renderTextInput = () => {
    if (question.type !== 'open_ended' && question.type !== 'math') return null;

    return (
      <Animatable.View animation="fadeInUp" delay={300}>
        <TextInput
          style={[
            styles.textInput,
            {
              borderColor: themeColors.border,
              backgroundColor: themeColors.surface,
              color: themeColors.text,
            }
          ]}
          value={typeof userAnswer === 'string' ? userAnswer : ''}
          editable={!isSubmitted}
          onChangeText={(text) => onShortAnswer(question.id, text)}
          placeholder={
            question.type === 'math'
              ? 'Enter your calculation...'
              : 'Share your wisdom here...'
          }
          placeholderTextColor={themeColors.textTertiary}
          multiline={question.type === 'open_ended'}
          textAlignVertical="top"
          keyboardType={question.type === 'math' ? 'numeric' : 'default'}
          maxLength={1000}
        />

        {question.type === 'math' && (question as any).formula && (
          <Text style={[
            styles.formulaHint,
            { color: themeColors.alexandriaGold }
          ]}>
            {translate('quiz.sacredFormula')}: {(question as any).formula}
          </Text>
        )}
      </Animatable.View>
    );
  };

  /**
   * Check if user's answer is potentially correct (fuzzy matching helper)
   *
   * This function provides client-side validation for gentle UX hints only.
   * Final validation is performed by the backend with sophisticated fuzzy matching.
   *
   * Features:
   * - Case-insensitive comparison
   * - Accepts extra words ("primary key" when answer is "primary")
   * - Tolerates typos (up to 25% character differences)
   * - Simple character-by-character comparison (not Levenshtein distance)
   *
   * @param userAns - User's typed answer
   * @param correctAns - Expected correct answer
   * @returns true if answer is potentially correct (don't show hint), false otherwise
   */
  const isPotentiallyCorrect = (userAns: string, correctAns: string): boolean => {
    if (!userAns || !correctAns) return false;

    const normalize = (str: string) => str.toLowerCase().trim();
    const user = normalize(userAns);
    const correct = normalize(correctAns);

    // Empty answer
    if (user.length === 0) return false;

    // Exact match (case-insensitive)
    if (user === correct) return true;

    // Contains the correct answer (handles "primary key" vs "primary")
    if (user.includes(correct) || correct.includes(user)) return true;

    // Simple character difference check (allows 2-3 character typos)
    const maxDifference = Math.max(2, Math.floor(correct.length * 0.25)); // 25% tolerance
    let differences = 0;
    const maxLength = Math.max(user.length, correct.length);

    for (let i = 0; i < maxLength; i++) {
      if (user[i] !== correct[i]) {
        differences++;
        if (differences > maxDifference) return false;
      }
    }

    return differences <= maxDifference;
  };

  /**
   * Render fill-in-the-blank question
   */
  const renderFillInBlank = () => {
    if (question.type !== 'fill_in_blank') return null;

    // Parse question data for fill-in-blank
    // Question text with blanks marked as _____
    const questionText = (question as any).questionText || question.question || '';

    // Blanks metadata (hints, positions, etc.)
    const blanks = (question as any).blanks || [];

    // Correct answers for each blank
    const correctAnswers = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];

    // User's current answers
    const userAnswers = Array.isArray(userAnswer)
      ? userAnswer
      : userAnswer ? [String(userAnswer)] : [];

    // Handle answer change for fill-in-blank
    const handleFillInBlankChange = (answers: string[]) => {
      // Store as array if multiple blanks, or as single string if one blank
      const answerValue = answers.length === 1 ? answers[0] : answers;
      onShortAnswer(question.id, answerValue as any);
    };

    // For fill-in-blank, we render inline inputs instead of using the full FillInBlankQuestion component
    // This maintains consistency with other question types in QuestionCard
    return (
      <View style={styles.fillInBlankContainer}>
        {/* Parse and render question text with inline inputs */}
        {questionText.split('_____').map((segment, index, arr) => {
          // Check if this blank has a potentially incorrect answer (for gentle hints)
          const userAns = userAnswers[index] || '';
          const correctAns = correctAnswers[index] || '';
          const hasAnswer = userAns.length > 0;
          const showHint = !isSubmitted && hasAnswer && !isPotentiallyCorrect(userAns, correctAns);

          return (
            <View key={index} style={styles.fillInBlankSegment}>
              {segment && (
                <Text style={[styles.fillInBlankText, { color: themeColors.text }]}>
                  {segment}
                </Text>
              )}
              {index < arr.length - 1 && (
                <View style={styles.blankInputWrapper}>
                  <View style={styles.blankInputInnerWrapper}>
                    <TextInput
                      style={[
                        styles.fillInBlankInput,
                        {
                          // Only show colored borders AFTER submission
                          borderColor: showFeedback
                            ? userAnswers[index]?.toLowerCase().trim() === correctAnswers[index]?.toLowerCase().trim()
                              ? themeColors.success
                              : themeColors.error
                            : themeColors.alexandriaGold, // Neutral gold while typing
                          backgroundColor: showFeedback
                            ? userAnswers[index]?.toLowerCase().trim() === correctAnswers[index]?.toLowerCase().trim()
                              ? themeColors.success + '10'
                              : themeColors.error + '10'
                            : themeColors.surface, // Neutral while typing
                          color: themeColors.text,
                        },
                      ]}
                      value={userAnswers[index] || ''}
                      onChangeText={(text) => {
                        const newAnswers = [...userAnswers];
                        newAnswers[index] = text;
                        handleFillInBlankChange(newAnswers);
                      }}
                      placeholder="Type here..."
                      placeholderTextColor={themeColors.textTertiary}
                      editable={!isSubmitted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {showFeedback && (
                      <FontAwesome5
                        name={
                          userAnswers[index]?.toLowerCase().trim() === correctAnswers[index]?.toLowerCase().trim()
                            ? 'check-circle'
                            : 'times-circle'
                        }
                        size={18}
                        color={
                          userAnswers[index]?.toLowerCase().trim() === correctAnswers[index]?.toLowerCase().trim()
                            ? themeColors.success
                            : themeColors.error
                        }
                        style={styles.blankFeedbackIcon}
                      />
                    )}
                  </View>

                  {/* Show gentle hint if answer looks potentially wrong (but not after submission) */}
                  {showHint && (
                    <View style={[styles.spellingHintContainer, { backgroundColor: themeColors.warning + '15', borderColor: themeColors.warning }]}>
                      <FontAwesome5 name="info-circle" size={12} color={themeColors.warning} style={styles.spellingHintIcon} />
                      <Text style={[styles.spellingHintText, { color: themeColors.warning }]}>
                        Check your spelling
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Show hint if available and not submitted */}
        {!isSubmitted && blanks.length > 0 && blanks[0]?.hint && (
          <View style={[styles.hintContainer, { backgroundColor: themeColors.alexandriaGold + '20', borderColor: themeColors.alexandriaGold }]}>
            <FontAwesome5 name="lightbulb" size={14} color={themeColors.alexandriaGold} style={styles.hintIcon} />
            <Text style={[styles.hintText, { color: themeColors.text }]}>{blanks[0].hint}</Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render feedback section (shown after submission)
   */
  const renderFeedback = () => {
    if (!showFeedback) return null;

    return (
      <Animatable.View
        animation="slideInUp"
        testID="question-feedback-section"
        style={[
          styles.feedbackSection,
          {
            backgroundColor: question.isCorrect
              ? themeColors.success + '10'
              : themeColors.error + '10',
            borderColor: question.isCorrect
              ? themeColors.success
              : themeColors.error,
          }
        ]}
      >
        <View style={styles.feedbackHeader}>
          <FontAwesome5
            name={question.isCorrect ? 'check-circle' : 'times-circle'}
            size={20}
            color={question.isCorrect ? themeColors.success : themeColors.error}
          />
          <Text
            testID="question-feedback-text"
            style={[
              styles.feedbackResult,
              {
                color: question.isCorrect
                  ? themeColors.success
                  : themeColors.error
              }
            ]}
          >
            {question.isCorrect ? translate('quiz.wisdomGained') : translate('quiz.learnAndGrow')}
          </Text>
        </View>

        <View style={styles.answerComparison}>
          <Text style={[
            styles.answerLabel,
            { color: themeColors.textSecondary }
          ]}>
            Your answer:{' '}
            <Text style={[
              styles.userAnswerText,
              { color: themeColors.text }
            ]}>
              {userAnswer ? String(userAnswer) : 'No answer given'}
            </Text>
          </Text>

          {!question.isCorrect && (
            <Text style={[
              styles.answerLabel,
              { color: themeColors.textSecondary }
            ]}>
              Correct answer:{' '}
              <Text style={[
                styles.correctAnswerText,
                { color: themeColors.success }
              ]}>
                {String(question.correctAnswer)}
              </Text>
            </Text>
          )}
        </View>

        {(question as any).explanation && (
          <Text style={[
            styles.explanationText,
            { color: themeColors.textSecondary }
          ]}>
            {(question as any).explanation}
          </Text>
        )}
      </Animatable.View>
    );
  };

  return (
    <Animated.View
      key={question.id}
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={[
          themeColors.surface,
          themeColors.surfaceSecondary
        ]}
        style={[
          styles.questionCard,
          {
            borderColor: themeColors.border,
            shadowColor: themeColors.shadow
          }
        ]}
      >
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <LinearGradient
            colors={[
              themeColors.alexandriaGold,
              themeColors.alexandriaBronze
            ]}
            style={styles.questionTypeIcon}
          >
            <FontAwesome5
              name={getQuestionIcon(question.type)}
              size={18}
              color="#FFFFFF"
            />
          </LinearGradient>

          <View style={styles.questionHeaderText}>
            {question.difficulty && (
              <View style={styles.difficultyBadge}>
                <FontAwesome5
                  name={difficultyInfo.icon}
                  size={12}
                  color={difficultyInfo.color}
                />
                <Text style={[
                  styles.difficultyText,
                  { color: difficultyInfo.color }
                ]}>
                  {question.difficulty}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Question Text */}
        <Text style={[
          styles.questionText,
          { color: themeColors.text }
        ]}>
          {(question as any).questionText || question.question || 'No question text'}
        </Text>

        {/* Visual Elements (charts, images, etc.) */}
        {(question as any).visual_elements && (question as any).visual_elements.length > 0 && (
          <VisualQuestionRenderer
            visualElements={(question as any).visual_elements}
            style={styles.visualContent}
            onInteraction={handleVisualInteraction}
          />
        )}

        {/* Database Tables (for database science questions) */}
        {(question as any).database_tables && (question as any).database_tables.length > 0 && (
          <DatabaseTableVisualization
            tables={(question as any).database_tables}
            interactive={!isSubmitted}
            theme={themeColors.background === '#0F1419' ? 'dark' : 'light'}
            style={styles.databaseContent}
            onInteraction={handleVisualInteraction}
          />
        )}

        {/* Answer Options/Input */}
        {renderMultipleChoice()}
        {renderTrueFalse()}
        {renderTextInput()}
        {renderFillInBlank()}

        {/* Feedback (shown after submission) */}
        {renderFeedback()}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  questionCard: {
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionHeaderText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  difficultyText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  visualContent: {
    marginVertical: 16,
  },
  databaseContent: {
    marginVertical: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 18,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  trueFalseButtonContainer: {
    flex: 1,
  },
  trueFalseButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trueFalseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  trueFalseText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  trueFalseCorrectText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  formulaHint: {
    marginTop: 12,
    fontSize: 14,
    fontStyle: 'italic',
  },
  feedbackSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackResult: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  answerComparison: {
    gap: 8,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  userAnswerText: {
    fontWeight: '700',
  },
  correctAnswerText: {
    fontWeight: '700',
  },
  explanationText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  fillInBlankContainer: {
    marginTop: 8,
  },
  fillInBlankSegment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  fillInBlankText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
  },
  blankInputWrapper: {
    flexDirection: 'column',
    marginHorizontal: 4,
  },
  blankInputInnerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fillInBlankInput: {
    minWidth: 100,
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 8,
    borderWidth: 2,
  },
  blankFeedbackIcon: {
    marginLeft: 8,
  },
  spellingHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  spellingHintIcon: {
    marginRight: 4,
  },
  spellingHintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  hintIcon: {
    marginRight: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
  },
});

// Memoized export - only re-renders when question or answer changes
export default React.memo(QuestionCard);
