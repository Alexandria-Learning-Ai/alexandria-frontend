import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { EnhancedExplanationService } from '../services/EnhancedExplanationService';
import { getDisplayAnswerText } from '../utils/answerFormatters';
import logger from '../utils/logger';

interface ExplanationParams {
  question: {
    id: string;
    text?: string;
    questionText?: string;
    type: string;
    correctAnswer: any;
    options?: string[];
  };
  userAnswer: any;
  subject?: string;
  difficulty?: string;
  questionNumber?: number;
}

type ExplanationScreenRouteProp = RouteProp<{ params: ExplanationParams }, 'params'>;

interface ExplanationSection {
  whyWrong?: string;
  correctReasoning?: string;
  keyPoints?: string[];
  commonMistakes?: string[];
  studyTips?: string[];
  relatedConcepts?: string[];
}

/**
 * Dedicated screen for displaying detailed AI-generated explanations
 * for quiz questions that were answered incorrectly.
 */
const ExplanationScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<ExplanationScreenRouteProp>();
  const { question, userAnswer, subject, difficulty, questionNumber } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<ExplanationSection | null>(null);

  useEffect(() => {
    loadExplanation();
  }, [question.id]);

  const loadExplanation = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('🧠 Loading explanation for question:', question.id);

      // Call the enhanced explanation service
      const result = await EnhancedExplanationService.generateEnhancedExplanation(
        question,
        userAnswer,
        subject || 'General',
        difficulty || 'medium'
      );

      if (result.sections) {
        setExplanation(result.sections);
        logger.info('✅ Explanation loaded successfully');
      } else {
        throw new Error('No explanation data received');
      }
    } catch (err: any) {
      logger.error('❌ Failed to load explanation:', err);
      setError(err.message || 'Failed to load explanation');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (title: string, content: string | string[] | undefined, icon: string) => {
    if (!content) return null;

    const contentArray = Array.isArray(content) ? content : [content];
    if (contentArray.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name={icon} size={18} color="#6366F1" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {contentArray.map((item, index) => (
          <View key={index} style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.sectionText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color="#6366F1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Explanation...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Generating detailed explanation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color="#6366F1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-triangle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadExplanation}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCorrect = userAnswer === question.correctAnswer;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#6366F1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detailed Explanation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Question Header */}
        {questionNumber && (
          <View style={styles.questionNumberBadge}>
            <Text style={styles.questionNumberText}>Question {questionNumber}</Text>
            {subject && <Text style={styles.subjectBadge}>{subject}</Text>}
          </View>
        )}

        {/* Question Text */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question:</Text>
          <Text style={styles.questionText}>{question.text || question.questionText}</Text>
        </View>

        {/* Answer Comparison */}
        <View style={styles.answersCard}>
          <View style={[styles.answerRow, styles.userAnswerRow]}>
            <View style={styles.answerLabelContainer}>
              <FontAwesome5
                name={isCorrect ? 'check-circle' : 'times-circle'}
                size={16}
                color={isCorrect ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.answerLabel, isCorrect ? styles.correctLabel : styles.wrongLabel]}>
                Your Answer
              </Text>
            </View>
            <Text style={[styles.answerText, isCorrect ? styles.correctText : styles.wrongText]}>
              {getDisplayAnswerText(question, userAnswer)}
            </Text>
          </View>

          {!isCorrect && (
            <View style={[styles.answerRow, styles.correctAnswerRow]}>
              <View style={styles.answerLabelContainer}>
                <FontAwesome5 name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.answerLabel, styles.correctLabel]}>Correct Answer</Text>
              </View>
              <Text style={[styles.answerText, styles.correctText]}>
                {getDisplayAnswerText(question, question.correctAnswer)}
              </Text>
            </View>
          )}
        </View>

        {/* AI Explanation Sections */}
        {explanation && (
          <View style={styles.explanationContainer}>
            <View style={styles.explanationHeader}>
              <FontAwesome5 name="brain" size={20} color="#6366F1" />
              <Text style={styles.explanationHeaderText}>AI-Powered Analysis</Text>
            </View>

            {renderSection('Why Your Answer Was Incorrect', explanation.whyWrong, 'info-circle')}
            {renderSection('Correct Reasoning', explanation.correctReasoning, 'lightbulb')}
            {renderSection('Key Learning Points', explanation.keyPoints, 'star')}
            {renderSection('Common Mistakes', explanation.commonMistakes, 'exclamation-triangle')}
            {renderSection('Study Tips', explanation.studyTips, 'book-open')}
            {renderSection('Related Concepts', explanation.relatedConcepts, 'project-diagram')}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Back to Results</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  questionNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginRight: 8,
  },
  subjectBadge: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  answersCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  answerRow: {
    marginBottom: 12,
  },
  userAnswerRow: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  correctAnswerRow: {
    marginBottom: 0,
  },
  answerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  correctLabel: {
    color: '#10B981',
  },
  wrongLabel: {
    color: '#EF4444',
  },
  answerText: {
    fontSize: 15,
    marginLeft: 22,
  },
  correctText: {
    color: '#10B981',
  },
  wrongText: {
    color: '#EF4444',
  },
  explanationContainer: {
    marginBottom: 16,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  explanationHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#6366F1',
    marginRight: 8,
    marginTop: 2,
  },
  sectionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 8,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ExplanationScreen;
