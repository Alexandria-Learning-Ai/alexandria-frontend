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
 * - Run Code button with execution feedback
 * - JSON-formatted answer storage
 * - Alexandria theme styling
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
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

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
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
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ success: boolean; message: string; results?: TestResult[] } | null>(null);

  // Sync local state with prop changes
  useEffect(() => {
    const initialCode = getInitialCode();
    setCode(initialCode);
  }, [userAnswer]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setRunResult(null); // Clear results when code changes

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

  // Run code against test cases
  const handleRunCode = async () => {
    if (!code.trim()) {
      setRunResult({ success: false, message: 'Please write some code first.' });
      return;
    }

    setIsRunning(true);
    setRunResult(null);

    try {
      // TODO: Integrate with backend /grade-code endpoint
      // For now, simulate execution with placeholder results
      logger.info('Running code', { language: metadata.language, questionNumber: question.question_number });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock test results for development
      const testCases = metadata.test_cases || [];
      if (testCases.length === 0) {
        setRunResult({
          success: true,
          message: 'Code submitted successfully! No test cases available for this question.'
        });
      } else {
        // Simulate running tests (in production, this calls the Piston API)
        const mockResults: TestResult[] = testCases.map((tc: any, idx: number) => ({
          passed: Math.random() > 0.3, // Mock: 70% pass rate
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expected_output),
          actual: JSON.stringify(tc.expected_output), // Mock
        }));

        const passedCount = mockResults.filter(r => r.passed).length;
        const totalCount = mockResults.length;

        setRunResult({
          success: passedCount === totalCount,
          message: passedCount === totalCount
            ? `All ${totalCount} tests passed!`
            : `${passedCount}/${totalCount} tests passed`,
          results: mockResults
        });
      }

      logger.info('Code execution completed');
    } catch (error) {
      logger.error('Code execution failed:', error);
      setRunResult({
        success: false,
        message: 'Failed to run code. Please try again.'
      });
    } finally {
      setIsRunning(false);
    }
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

          {/* Run Code Button */}
          <TouchableOpacity
            style={[styles.runButton, isRunning && styles.runButtonDisabled]}
            onPress={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <ActivityIndicator size="small" color={colors.bg} />
                <Text style={styles.runButtonText}>Running...</Text>
              </>
            ) : (
              <>
                <FontAwesome5 name="play" size={14} color={colors.bg} />
                <Text style={styles.runButtonText}>Run Code</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Run Results */}
          {runResult && (
            <View style={[
              styles.resultContainer,
              runResult.success ? styles.resultSuccess : styles.resultError
            ]}>
              <FontAwesome5
                name={runResult.success ? 'check-circle' : 'times-circle'}
                size={16}
                color={runResult.success ? colors.success : colors.danger}
              />
              <Text style={[
                styles.resultText,
                runResult.success ? styles.resultTextSuccess : styles.resultTextError
              ]}>
                {runResult.message}
              </Text>
            </View>
          )}

          <Text style={styles.hintText}>
            Click "Run Code" to test your solution against sample inputs
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
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    backgroundColor: colors.blue,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[20],
    borderRadius: radius.md,
    marginTop: spacing[16],
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.bg,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    padding: spacing[12],
    borderRadius: radius.md,
    marginTop: spacing[12],
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: colors.success + '15',
    borderColor: colors.success,
  },
  resultError: {
    backgroundColor: colors.danger + '15',
    borderColor: colors.danger,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  resultTextSuccess: {
    color: colors.success,
  },
  resultTextError: {
    color: colors.danger,
  },
});
