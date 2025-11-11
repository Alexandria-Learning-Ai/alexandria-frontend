/**
 * SectionRenderer - Renders a complete exam section with section-level graph
 *
 * Features:
 * - Section header with title and numbering
 * - Section-level graph display (Math sections only)
 * - Question rendering with proper numbering
 * - Maintains section context for all questions
 * - Alexandria theme styling
 *
 * Used by ExamScreen to render sections in a FlatList with proper
 * separation between sections and shared section graphs.
 *
 * @example
 * <SectionRenderer
 *   section={mathSection}
 *   sectionIndex={0}
 *   onAnswerChange={handleAnswer}
 *   startingQuestionNumber={1}
 *   userAnswers={answers}
 *   mode="take"
 * />
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StructuredExamSection, ParsedQuestion, ExamMode } from '../../types/exam';
import QuestionRenderer from './QuestionRenderer';
import GraphDisplay from './GraphDisplay';
import { colors, spacing, typography } from '../../theme/tokens';
import logger from '../../utils/logger';

interface SectionRendererProps {
  section: StructuredExamSection;
  sectionIndex: number;
  onAnswerChange: (questionNumber: number, answer: any) => void;
  startingQuestionNumber: number; // Global question number for first question in section
  userAnswers?: Record<number, any>;
  mode: ExamMode;
}

/**
 * SectionRenderer Component
 *
 * Renders a complete exam section including:
 * 1. Section header with title
 * 2. Section-level graph (if present)
 * 3. All questions in the section
 *
 * @param section - Structured exam section with questions and optional graph
 * @param sectionIndex - Zero-based index of this section
 * @param onAnswerChange - Callback when user answers a question
 * @param startingQuestionNumber - Global question number to start from (1-indexed)
 * @param userAnswers - Current user answers (optional)
 * @param mode - Exam mode (take or review)
 */
export default function SectionRenderer({
  section,
  sectionIndex,
  onAnswerChange,
  startingQuestionNumber,
  userAnswers = {},
  mode
}: SectionRendererProps) {

  // Check if section has graph
  const hasGraph = useMemo(() => {
    return !!(section.graph_image && section.graph_image.length > 0);
  }, [section.graph_image]);

  // Log section rendering
  useMemo(() => {
    logger.debug('Rendering section', {
      sectionIndex,
      sectionName: section.name,
      questionCount: section.questions?.length || 0,
      hasGraph,
      startingQuestionNumber
    });
  }, [sectionIndex, section.name, section.questions, hasGraph, startingQuestionNumber]);

  // Handle empty section
  if (!section.questions || section.questions.length === 0) {
    logger.warn('Section has no questions', { sectionIndex, sectionName: section.name });
    return (
      <View style={styles.emptySection}>
        <Text style={styles.sectionTitle}>
          Section {sectionIndex + 1}: {section.name}
        </Text>
        <Text style={styles.emptyText}>No questions in this section</Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionNumber}>Section {sectionIndex + 1}</Text>
        <Text style={styles.sectionTitle}>{section.name}</Text>
      </View>

      {/* Section-Level Graph (if present) */}
      {hasGraph && (
        <View style={styles.graphSection}>
          <GraphDisplay
            imageBase64={section.graph_image!}
            title={
              section.graph_expression
                ? `y = ${section.graph_expression}`
                : 'Graph for this section'
            }
          />
          <Text style={styles.graphInstruction}>
            Use this graph to answer the questions below
          </Text>
        </View>
      )}

      {/* Questions */}
      <View style={styles.questionsContainer}>
        {section.questions.map((question, questionIndex) => {
          const globalQuestionNumber = startingQuestionNumber + questionIndex;
          const userAnswer = userAnswers[globalQuestionNumber];

          return (
            <View key={questionIndex} style={styles.questionWrapper}>
              <QuestionRenderer
                question={question}
                userAnswer={userAnswer}
                onAnswer={onAnswerChange}
                mode={mode}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: spacing[32],
    paddingBottom: spacing[24],
  },
  sectionHeader: {
    marginBottom: spacing[20],
    paddingBottom: spacing[16],
    borderBottomWidth: 2,
    borderBottomColor: colors.cardStroke,
  },
  sectionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  graphSection: {
    marginBottom: spacing[24],
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing[16],
    borderWidth: 2,
    borderColor: colors.gold + '40', // 40% opacity
  },
  graphInstruction: {
    marginTop: spacing[12],
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  questionsContainer: {
    gap: spacing[16],
  },
  questionWrapper: {
    marginBottom: spacing[8],
  },
  emptySection: {
    padding: spacing[24],
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardStroke,
    marginBottom: spacing[16],
  },
  emptyText: {
    fontSize: 14,
    color: colors.textDim,
    fontStyle: 'italic',
    marginTop: spacing[8],
  },
});
