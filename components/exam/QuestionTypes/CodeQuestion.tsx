/**
 * CodeQuestion Component
 *
 * Renders coding questions with code editor and test case descriptions
 *
 * Features:
 * - Monospace code editor (TextInput)
 * - Language display with time limit
 * - Test case descriptions (hides actual inputs/outputs)
 * - Starter code pre-filled
 * - JSON-formatted answer storage
 * - Alexandria theme styling
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { CodeQuestion as CQuestion, ExamMode } from '../../../types/exam';
import { colors, radius, spacing } from '../../../theme/tokens';
import logger from '../../../utils/logger';

interface CodeQuestionProps {
  question: CQuestion;
  userAnswer?: string;
  onAnswer: (answer: string) => void;
  mode: ExamMode;
}

interface CodeAnswerData {
  code: string;
  language: string;
  timestamp: string;
}

/**
 * Code Question Component
 *
 * Provides a code editor for programming questions with test case hints
 *
 * @param question - Question data with language, starter code, test cases
 * @param userAnswer - Current answer (JSON stringified CodeAnswerData)
 * @param onAnswer - Callback when code changes
 * @param mode - 'take' (interactive) or 'review' (read-only)
 */
export default function CodeQuestion({
  question,
  userAnswer = '',
  onAnswer,
  mode
}: CodeQuestionProps) {
  const isReview = mode === 'review';
  const metadata = question.metadata;

  // Parse existing answer or use starter code
  const getInitialCode = (): string => {
    if (userAnswer) {
      try {
        const parsed: CodeAnswerData = JSON.parse(userAnswer);
        return parsed.code || metadata.starter_code || '';
      } catch (error) {
        logger.warn('Failed to parse code answer:', { error, userAnswer });
        return metadata.starter_code || '';
      }
    }
    return metadata.starter_code || '';
  };

  const [code, setCode] = useState<string>(getInitialCode());

  // Sync local state with prop changes
  useEffect(() => {
    const initialCode = getInitialCode();
    setCode(initialCode);
  }, [userAnswer]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    // Store answer as JSON with metadata
    const answerData: CodeAnswerData = {
      code: newCode,
      language: metadata.language,
      timestamp: new Date().toISOString()
    };

    onAnswer(JSON.stringify(answerData));
  };

  const characterCount = code.length;
  const lineCount = code.split('\n').length;

  // Get language display name
  const getLanguageDisplayName = (lang: string): string => {
    const languageNames: Record<string, string> = {
      'python': 'Python',
      'javascript': 'JavaScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'typescript': 'TypeScript',
      'go': 'Go',
      'rust': 'Rust',
      'ruby': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
    };
    return languageNames[lang.toLowerCase()] || lang;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question_text}</Text>

      {/* Language and Time Limit Info */}
      <View style={styles.metadataContainer}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Language:</Text>
          <Text style={styles.metadataValue}>
            {getLanguageDisplayName(metadata.language)}
          </Text>
        </View>
        {metadata.time_limit && (
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Time Limit:</Text>
            <Text style={styles.metadataValue}>
              {metadata.time_limit / 1000}s
            </Text>
          </View>
        )}
      </View>

      {/* Test Cases (Descriptions Only) */}
      {metadata.test_cases && metadata.test_cases.length > 0 && (
        <View style={styles.testCasesContainer}>
          <Text style={styles.testCasesTitle}>Test Cases:</Text>
          {metadata.test_cases.map((testCase, index) => (
            <View key={index} style={styles.testCaseItem}>
              <Text style={styles.testCaseBullet}>•</Text>
              <Text style={styles.testCaseDescription}>
                {testCase.description || `Test case ${index + 1}`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Code Editor */}
      {!isReview ? (
        <>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={handleCodeChange}
            placeholder={metadata.starter_code || '// Write your code here...'}
            placeholderTextColor={colors.textMute}
            multiline
            numberOfLines={12}
            textAlignVertical="top"
            editable={!isReview}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
          />
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </Text>
            <Text style={styles.statsText}>
              {characterCount} {characterCount === 1 ? 'character' : 'characters'}
            </Text>
          </View>
          <Text style={styles.hintText}>
            Your code will be tested against hidden test cases after submission
          </Text>
        </>
      ) : (
        <>
          <View style={styles.reviewCodeContainer}>
            <Text style={styles.reviewLabel}>Your Code:</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeDisplayText}>
                {code || '(No code provided)'}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[24],
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing[16],
  },
  metadataContainer: {
    flexDirection: 'row',
    gap: spacing[24],
    marginBottom: spacing[16],
    paddingHorizontal: spacing[4],
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDim,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
  },
  testCasesContainer: {
    padding: spacing[16],
    backgroundColor: colors.bg2,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    borderRadius: radius.sm,
    marginBottom: spacing[16],
  },
  testCasesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  testCaseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[8],
    marginBottom: spacing[4],
  },
  testCaseBullet: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textDim,
    marginTop: 1,
  },
  testCaseDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textDim,
  },
  codeInput: {
    minHeight: 240,
    padding: spacing[16],
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlignVertical: 'top',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  statsText: {
    fontSize: 13,
    color: colors.textMute,
  },
  hintText: {
    fontSize: 13,
    color: colors.textMute,
    fontStyle: 'italic',
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  reviewCodeContainer: {
    padding: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[12],
  },
  codeDisplay: {
    padding: spacing[12],
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
  },
  codeDisplayText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
