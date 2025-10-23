import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeStyles, Question } from '../../types';
import { getDisplayAnswerText } from '../../utils/answerFormatters';

interface ExplanationSection {
  whyWrong?: string;
  correctReasoning?: string;
  keyPoints?: string[];
}

interface Explanation {
  sections?: ExplanationSection;
  type?: string;
  tier?: number;
}

interface AIExplanationsSectionProps {
  showExplanations: boolean;
  explanations: Record<string, Explanation>;
  questions: Question[];
  userAnswers: Record<string, any>;
  themeStyles: ThemeStyles;
}

/**
 * AI Explanations Section Component
 *
 * Displays detailed AI-powered explanations for incorrect answers,
 * including why the answer was wrong, the correct reasoning, and key learning points.
 *
 * @param showExplanations - Whether to show the explanations section
 * @param explanations - Object mapping question IDs to their explanations
 * @param questions - Array of all quiz questions
 * @param userAnswers - Map of user's answers by question ID
 * @param themeStyles - Theme-specific styles
 */
const AIExplanationsSection: React.FC<AIExplanationsSectionProps> = React.memo(({
  showExplanations,
  explanations,
  questions,
  userAnswers,
  themeStyles,
}) => {
  if (!showExplanations || Object.keys(explanations).length === 0) {
    return null;
  }

  return (
    <View style={[styles.aiAnalysisSection, themeStyles.aiAnalysisSection]}>
      <Text style={[styles.aiAnalysisTitle, themeStyles.sectionTitle]}>
        🧠 AI Analysis of Wrong Answers
      </Text>
      <Text style={[styles.aiAnalysisSubtitle, themeStyles.subtitle]}>
        Detailed insights on where to improve
      </Text>

      {Object.entries(explanations).map(([questionId, explanation]) => {
        const question = questions.find(q => String(q.id) === String(questionId));
        if (!question || question.isCorrect) return null;

        const userAnswer = userAnswers[questionId];
        const correctAnswer = question.correctAnswer;
        const questionNumber = questions.indexOf(question) + 1;

        return (
          <View
            key={questionId}
            style={[styles.analysisCard, themeStyles.analysisCard]}
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`AI explanation for question ${questionNumber}`}
          >
            {/* Question Header */}
            <View style={styles.analysisHeader}>
              <Text style={[styles.questionNumber, themeStyles.questionNumber]}>
                📌 Question {questionNumber}
              </Text>
            </View>

            {/* Question Text */}
            <Text
              style={[styles.analysisQuestionText, themeStyles.questionText]}
              accessible={true}
              accessibilityRole="text"
            >
              {question.text || question.questionText}
            </Text>

            {/* Answer Comparison */}
            <View style={styles.answerComparison}>
              <View style={styles.answerRow}>
                <Text style={[styles.answerLabel, styles.wrongLabel]}>❌ Your Answer:</Text>
                <Text style={[styles.answerValue, styles.wrongAnswer, themeStyles.incorrectAnswer]}>
                  {getDisplayAnswerText(question, userAnswer)}
                </Text>
              </View>

              <View style={styles.answerRow}>
                <Text style={[styles.answerLabel, styles.correctLabel]}>✅ Correct Answer:</Text>
                <Text style={[styles.answerValue, styles.correctAnswerText, themeStyles.correctAnswer]}>
                  {getDisplayAnswerText(question, correctAnswer)}
                </Text>
              </View>
            </View>

            {/* AI Explanation */}
            <View style={styles.aiExplanationContainer}>
              {explanation.sections?.whyWrong && (
                <View style={styles.explanationBlock}>
                  <Text style={[styles.explanationLabel, themeStyles.explanationTitle]}>
                    ❌ Why Wrong:
                  </Text>
                  <Text style={[styles.explanationContent, themeStyles.explanationText]}>
                    {explanation.sections.whyWrong}
                  </Text>
                </View>
              )}

              {explanation.sections?.correctReasoning && (
                <View style={styles.explanationBlock}>
                  <Text style={[styles.explanationLabel, themeStyles.explanationTitle]}>
                    ✅ Correct Approach:
                  </Text>
                  <Text style={[styles.explanationContent, themeStyles.explanationText]}>
                    {explanation.sections.correctReasoning}
                  </Text>
                </View>
              )}

              {/* Learning Tips if available */}
              {explanation.sections?.keyPoints && explanation.sections.keyPoints.length > 0 && (
                <View style={styles.explanationBlock}>
                  <Text style={[styles.explanationLabel, themeStyles.explanationTitle]}>
                    💡 Key Points:
                  </Text>
                  {explanation.sections.keyPoints.map((tip, index) => (
                    <Text
                      key={index}
                      style={[styles.tipItem, themeStyles.explanationText]}
                      accessible={true}
                      accessibilityRole="text"
                    >
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
});

// ✨ Performance: Display name for debugging
AIExplanationsSection.displayName = 'AIExplanationsSection';

const styles = StyleSheet.create({
  aiAnalysisSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  aiAnalysisTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  aiAnalysisSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  analysisHeader: {
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2C5B',
  },
  analysisQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 24,
  },
  answerComparison: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  answerRow: {
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  wrongLabel: {
    color: '#DC3545',
  },
  correctLabel: {
    color: '#28A745',
  },
  answerValue: {
    fontSize: 15,
    fontWeight: '500',
    paddingLeft: 8,
  },
  wrongAnswer: {
    color: '#DC3545',
  },
  correctAnswerText: {
    color: '#28A745',
  },
  aiExplanationContainer: {
    gap: 16,
  },
  explanationBlock: {
    marginBottom: 12,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  tipItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
});

export default AIExplanationsSection;
