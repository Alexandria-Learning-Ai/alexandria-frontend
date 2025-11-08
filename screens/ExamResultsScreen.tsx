/**
 * ExamResultsScreen - Exam Grading and Results Display
 *
 * Shows comprehensive results after exam submission
 *
 * Features:
 * - Overall score display with visual indicator
 * - Section-by-section breakdown
 * - List of incorrect questions with explanations
 * - AI grading for written responses
 * - Review Full Exam button
 * - Retake Exam button
 * - Share results (future)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useExam, useGradeWritten } from '../hooks/useExamQueries';
import { gradeQuestion } from '../utils/grading/graders';
import {
  ParsedQuestion,
  UserAnswer,
  GradingResult,
  ExamResults
} from '../types/exam';
import { colors, radius, spacing } from '../theme/tokens';
import logger from '../utils/logger';

type ExamResultsScreenNavigationProp = NativeStackNavigationProp<any, 'ExamResults'>;
type ExamResultsScreenRouteProp = RouteProp<
  { ExamResults: { examId: string; answers: Record<number, any> } },
  'ExamResults'
>;

interface ExamResultsScreenProps {
  navigation: ExamResultsScreenNavigationProp;
  route: ExamResultsScreenRouteProp;
}

/**
 * Exam Results Screen Component
 *
 * Grades exam and displays comprehensive results
 */
export default function ExamResultsScreen({ navigation, route }: ExamResultsScreenProps) {
  const { examId, answers } = route.params;

  const { data: exam, isLoading: examLoading } = useExam(examId);
  const { mutate: gradeWritten, isPending: gradingPending } = useGradeWritten();

  const [gradingResults, setGradingResults] = useState<Record<number, GradingResult>>({});
  const [gradingComplete, setGradingComplete] = useState(false);

  // Grade all questions
  useEffect(() => {
    if (!exam || !answers) return;

    const gradeAllQuestions = async () => {
      logger.info('Starting exam grading:', {
        examId,
        totalQuestions: exam.parsed_questions.length,
        answeredQuestions: Object.keys(answers).length
      });

      const writtenQuestions = exam.parsed_questions.filter(
        q => q.question_type === 'written'
      );

      // Grade written questions via API
      const gradingPromises = writtenQuestions.map((question) => {
        const userAnswer = answers[question.question_number];
        if (!userAnswer || typeof userAnswer !== 'string') return Promise.resolve();

        return new Promise<void>((resolve) => {
          gradeWritten(
            {
              examId,
              questionNumber: question.question_number,
              studentAnswer: userAnswer,
            },
            {
              onSuccess: (result) => {
                setGradingResults(prev => ({
                  ...prev,
                  [question.question_number]: result,
                }));
                resolve();
              },
              onError: (error) => {
                logger.error('Failed to grade written response:', error);
                // Use fallback grading
                setGradingResults(prev => ({
                  ...prev,
                  [question.question_number]: {
                    score: 0,
                    feedback: 'Could not grade this response automatically. Please review manually.',
                    strengths: [],
                    areas_for_improvement: [],
                  },
                }));
                resolve();
              },
            }
          );
        });
      });

      await Promise.all(gradingPromises);
      setGradingComplete(true);

      logger.info('Exam grading complete:', {
        examId,
        writtenQuestionsGraded: writtenQuestions.length
      });
    };

    gradeAllQuestions();
  }, [exam, answers, examId]);

  // Calculate results
  const results: ExamResults | null = useMemo(() => {
    if (!exam || !gradingComplete) return null;

    const userAnswers: UserAnswer[] = exam.parsed_questions.map((question) => {
      const userAnswer = answers[question.question_number];
      const gradingResult =
        question.question_type === 'written'
          ? gradingResults[question.question_number]
          : gradeQuestion(question, userAnswer);

      let isCorrect = false;
      if (question.question_type === 'written') {
        // Written questions use AI score (>= 70% is considered correct)
        isCorrect = gradingResult ? gradingResult.score >= 70 : false;
      } else {
        isCorrect = gradingResult?.score === 100;
      }

      return {
        question_number: question.question_number,
        user_answer: userAnswer,
        is_correct: isCorrect,
        grading_result: gradingResult || undefined,
      };
    });

    const correctAnswers = userAnswers.filter(a => a.is_correct).length;
    const totalQuestions = exam.parsed_questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Calculate section scores
    const sectionScores: Record<string, { total: number; correct: number; percentage: number }> = {};

    exam.parsed_questions.forEach((question, index) => {
      const section = question.section || 'General';
      if (!sectionScores[section]) {
        sectionScores[section] = { total: 0, correct: 0, percentage: 0 };
      }

      sectionScores[section].total++;
      if (userAnswers[index].is_correct) {
        sectionScores[section].correct++;
      }
    });

    // Calculate percentages
    Object.keys(sectionScores).forEach(section => {
      const { total, correct } = sectionScores[section];
      sectionScores[section].percentage = Math.round((correct / total) * 100);
    });

    // Get incorrect questions
    const incorrectQuestions = exam.parsed_questions
      .map((question, index) => ({
        question_number: question.question_number,
        question_text: question.question_text,
        user_answer: userAnswers[index].user_answer || '(No answer)',
        correct_answer: question.correct_answer,
        explanation: userAnswers[index].grading_result?.feedback,
        is_correct: userAnswers[index].is_correct,
      }))
      .filter(q => !q.is_correct);

    return {
      attempt_id: `attempt_${Date.now()}`,
      exam_id: examId,
      exam_topic: exam.topic,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      incorrect_questions: incorrectQuestions,
      section_scores: sectionScores,
      completed_at: new Date().toISOString(),
    };
  }, [exam, answers, gradingComplete, gradingResults]);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 70) return colors.gold;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };

  // Loading state
  if (examLoading || !gradingComplete) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#0B1223', '#0F1F33']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>
            {examLoading ? 'Loading exam...' : 'Grading your responses...'}
          </Text>
          {!examLoading && (
            <Text style={styles.loadingSubtext}>
              This may take a moment for written responses
            </Text>
          )}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!results) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to calculate results</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const scoreColor = getScoreColor(results.score);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0B1223', '#0F1F33']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exam Results</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExamHistory')}>
            <FontAwesome5 name="times" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Card */}
          <View style={styles.scoreCard}>
            <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                {results.score}%
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <View style={styles.scoreDetails}>
              <View style={styles.scoreRow}>
                <FontAwesome5 name="check-circle" size={16} color={colors.success} />
                <Text style={styles.scoreDetailText}>
                  {results.correct_answers} Correct
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <FontAwesome5 name="times-circle" size={16} color={colors.danger} />
                <Text style={styles.scoreDetailText}>
                  {results.total_questions - results.correct_answers} Incorrect
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <FontAwesome5 name="list" size={16} color={colors.textDim} />
                <Text style={styles.scoreDetailText}>
                  {results.total_questions} Total
                </Text>
              </View>
            </View>
          </View>

          {/* Section Breakdown */}
          {Object.keys(results.section_scores).length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Section Breakdown</Text>
              {Object.entries(results.section_scores).map(([section, scores]) => (
                <View key={section} style={styles.sectionScoreCard}>
                  <View style={styles.sectionScoreHeader}>
                    <Text style={styles.sectionScoreName}>{section}</Text>
                    <Text
                      style={[
                        styles.sectionScorePercent,
                        { color: getScoreColor(scores.percentage) },
                      ]}
                    >
                      {scores.percentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${scores.percentage}%`,
                          backgroundColor: getScoreColor(scores.percentage),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.sectionScoreDetail}>
                    {scores.correct}/{scores.total} correct
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Incorrect Questions */}
          {results.incorrect_questions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Questions to Review ({results.incorrect_questions.length})
              </Text>
              {results.incorrect_questions.map((question) => (
                <View key={question.question_number} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>
                      Question {question.question_number}
                    </Text>
                  </View>
                  <Text style={styles.questionText}>{question.question_text}</Text>
                  <View style={styles.answerSection}>
                    <Text style={styles.answerLabel}>Your Answer:</Text>
                    <Text style={styles.userAnswer}>{String(question.user_answer)}</Text>
                  </View>
                  <View style={styles.answerSection}>
                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                    <Text style={styles.correctAnswer}>{question.correct_answer}</Text>
                  </View>
                  {question.explanation && (
                    <View style={styles.explanationSection}>
                      <Text style={styles.explanationLabel}>Feedback:</Text>
                      <Text style={styles.explanationText}>{question.explanation}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Perfect Score Message */}
          {results.score === 100 && (
            <View style={styles.perfectScoreCard}>
              <FontAwesome5 name="trophy" size={32} color={colors.gold} />
              <Text style={styles.perfectScoreText}>Perfect Score!</Text>
              <Text style={styles.perfectScoreSubtext}>
                Excellent work! You've mastered this material.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => {
                navigation.navigate('ExamViewer', {
                  examId,
                  mode: 'review',
                });
              }}
            >
              <FontAwesome5 name="eye" size={16} color={colors.text} />
              <Text style={styles.reviewButtonText}>Review Full Exam</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                Alert.alert(
                  'Retake Exam',
                  'Are you sure you want to retake this exam? Your current results will not be saved.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Retake',
                      onPress: () => {
                        navigation.replace('ExamViewer', {
                          examId,
                          mode: 'take',
                        });
                      },
                    },
                  ]
                );
              }}
            >
              <LinearGradient
                colors={[colors.gold, '#D4AF37']}
                style={styles.retakeButtonGradient}
              >
                <FontAwesome5 name="redo" size={16} color={colors.bg} />
                <Text style={styles.retakeButtonText}>Retake Exam</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[24],
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing[16],
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textMute,
    marginTop: spacing[8],
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: spacing[24],
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: spacing[16],
  },
  retryButton: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[24],
    backgroundColor: colors.gold,
    borderRadius: radius.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[20],
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[32],
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[24],
    padding: spacing[24],
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing[24],
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textMute,
    marginTop: spacing[4],
  },
  scoreDetails: {
    flex: 1,
    gap: spacing[12],
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  scoreDetailText: {
    fontSize: 15,
    color: colors.text,
  },
  section: {
    marginBottom: spacing[24],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing[16],
  },
  sectionScoreCard: {
    padding: spacing[16],
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing[12],
  },
  sectionScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  sectionScoreName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionScorePercent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.bg2,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing[8],
  },
  progressFill: {
    height: '100%',
  },
  sectionScoreDetail: {
    fontSize: 13,
    color: colors.textMute,
  },
  questionCard: {
    padding: spacing[16],
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    marginBottom: spacing[12],
  },
  questionHeader: {
    marginBottom: spacing[8],
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  questionText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: spacing[12],
  },
  answerSection: {
    marginBottom: spacing[12],
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMute,
    marginBottom: spacing[4],
  },
  userAnswer: {
    fontSize: 14,
    color: colors.danger,
  },
  correctAnswer: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  explanationSection: {
    marginTop: spacing[8],
    paddingTop: spacing[12],
    borderTopWidth: 1,
    borderTopColor: colors.cardStroke,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.blue,
    marginBottom: spacing[4],
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textDim,
  },
  perfectScoreCard: {
    alignItems: 'center',
    padding: spacing[24],
    backgroundColor: 'rgba(245, 196, 81, 0.1)',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    marginBottom: spacing[24],
  },
  perfectScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
    marginTop: spacing[12],
  },
  perfectScoreSubtext: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  actionButtons: {
    gap: spacing[12],
    marginTop: spacing[8],
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    paddingVertical: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  retakeButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  retakeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    paddingVertical: spacing[16],
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.bg,
  },
});
