/**
 * ⚠️ DEPRECATED - Use hooks/api/useSaveQuiz.ts instead
 *
 * This hook will be removed in a future version.
 * The new useSaveQuiz hook provides the same functionality with better offline support.
 *
 * Migration guide: See SCREEN_MIGRATION_AUDIT.md
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';

// Log deprecation warning
if (__DEV__) {
  logger.warn(
    '⚠️ useResultsActions is deprecated. Please migrate to hooks/api/useSaveQuiz.ts\n' +
    'See SCREEN_MIGRATION_AUDIT.md for migration guide.'
  );
}
import logger from '../utils/logger';
import { generateTopicSpecificTip } from '../utils/coachMessageGenerators';

interface Question {
  id: string;
  text?: string;
  questionText?: string;
  type?: string;
  difficulty?: string;
  options?: any[];
  correctAnswer: any;
  isCorrect?: boolean;
  keywords?: string[];
  [key: string]: any;
}

interface SaveQuizParams {
  questions: Question[];
  userAnswers: Record<string, any>;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  metadata: Record<string, any>;
  weaknessAnalysis: any;
  determineCategorySync: (metadata: any, keywords: any[], questions: any[]) => string;
  navigation: any;
}

interface SubjectCorrectionParams {
  correctedSubject: string;
  weaknessAnalysis: any;
  metadata: Record<string, any>;
  setSubmittingCorrection: (submitting: boolean) => void;
  setShowSubjectCorrection: (show: boolean) => void;
}

interface FocusQuizParams {
  weakness: any;
  navigation: any;
}

interface CoachingTipParams {
  topic: string;
  setCoachMessage: (message: any) => void;
  setShowCoachTips: (show: boolean) => void;
  setLoadingCoachMessage: (loading: boolean) => void;
}

interface WeaknessAlertParams {
  analysis: any;
  navigation: any;
}

export const useResultsActions = () => {
  /**
   * Save quiz for later viewing
   */
  const saveQuizForLater = useCallback(async (params: SaveQuizParams) => {
    const {
      questions,
      userAnswers,
      score,
      totalQuestions,
      percentage,
      correctCount,
      incorrectCount,
      metadata,
      weaknessAnalysis,
      determineCategorySync,
      navigation,
    } = params;

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to save quizzes.');
        return;
      }

      const savedQuizData = {
        id: `saved_quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${metadata?.subject || 'General'} Quiz - ${new Date().toLocaleDateString()}`,
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text || q.questionText,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          userAnswer: userAnswers[q.id],
          isCorrect: q.isCorrect,
          keywords: q.keywords || [],
          difficulty: q.difficulty || metadata?.difficulty || 'medium',
        })),
        metadata: {
          ...metadata,
          savedDate: new Date().toISOString(),
          totalQuestions,
          score,
          percentage,
          category: determineCategorySync(metadata, [], questions),
          completionTime: metadata?.completionTime || null,
          completedAt: new Date().toISOString(),
        },
        userAnswers,
        results: {
          score,
          totalQuestions,
          percentage,
          correctCount,
          incorrectCount,
          weaknessAnalysis,
          completedAt: new Date().toISOString(),
        },
      };

      // Save to AsyncStorage (use the same key as quiz history)
      const quizHistoryKey = `quizHistory_${user.uid}`;
      const existingHistory = await AsyncStorage.getItem(quizHistoryKey);
      const quizHistory = existingHistory ? JSON.parse(existingHistory) : [];

      quizHistory.unshift(savedQuizData);

      // Keep only the last 100 quizzes in history
      if (quizHistory.length > 100) {
        quizHistory.splice(100);
      }

      await AsyncStorage.setItem(quizHistoryKey, JSON.stringify(quizHistory));

      Alert.alert(
        '✅ Quiz Saved!',
        'This quiz has been saved to your collection. You can view all your saved quizzes from the home screen.',
        [
          { text: 'View Saved Quizzes', onPress: () => navigation.navigate('QuizHistory') },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      logger.error('Error saving quiz:', error);
      Alert.alert('Error', 'Failed to save quiz. Please try again.');
    }
  }, []);

  /**
   * Handle subject correction submission
   */
  const handleSubjectCorrection = useCallback(async (params: SubjectCorrectionParams) => {
    const {
      correctedSubject,
      weaknessAnalysis,
      metadata,
      setSubmittingCorrection,
      setShowSubjectCorrection,
    } = params;

    setSubmittingCorrection(true);
    try {
      // Store correction feedback
      const correctionData = {
        userId: 'current_user', // Replace with actual user ID
        quizId: metadata.quizId || `quiz_${Date.now()}`,
        originalSubject: weaknessAnalysis?.weaknesses?.[0]?.topic || 'Unknown',
        correctedSubject: correctedSubject.toLowerCase().replace(/ /g, '_'),
        timestamp: new Date().toISOString(),
        feedback: 'user_correction',
      };

      // Save correction to AsyncStorage for now (could be sent to backend later)
      const existingCorrections = await AsyncStorage.getItem('subject_corrections');
      const corrections = existingCorrections ? JSON.parse(existingCorrections) : [];
      corrections.push(correctionData);
      await AsyncStorage.setItem('subject_corrections', JSON.stringify(corrections));

      logger.info('📝 Subject correction saved:', correctionData);

      // Show success message
      Alert.alert(
        'Thank you!',
        "Your correction has been saved and will help improve Alexandria's subject detection.",
        [{ text: 'OK' }]
      );

      setShowSubjectCorrection(false);
    } catch (error) {
      logger.error('Error saving subject correction:', error);
      Alert.alert('Error', 'Failed to save correction. Please try again.');
    } finally {
      setSubmittingCorrection(false);
    }
  }, []);

  /**
   * Show weakness insights alert
   */
  const showWeaknessInsightsAlert = useCallback((params: WeaknessAlertParams) => {
    const { analysis, navigation } = params;

    if (!analysis || !analysis.weaknesses || analysis.weaknesses.length === 0) return;

    const topWeakness = analysis.weaknesses[0];
    const recommendations = analysis.recommendations || [];

    if (topWeakness && topWeakness.severity > 50) {
      Alert.alert(
        "🎯 Alexandria's Insight",
        `I noticed you could improve in ${topWeakness.topic.replace(/_/g, ' ')}. ` +
          `I'll prepare a focused quiz to help you strengthen this area! ` +
          `\n\n💡 ${recommendations[0]?.message || "Keep practicing and you'll see improvement!"}`,
        [
          { text: 'Thanks, Alexandria!', style: 'default' },
          {
            text: 'Show My Progress',
            onPress: () => navigation.navigate('ProgressTracker'),
          },
        ]
      );
    }
  }, []);

  /**
   * Request focused quiz for weakness
   */
  const requestFocusQuiz = useCallback(async (params: FocusQuizParams) => {
    const { weakness, navigation } = params;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to access personalized quizzes.');
      return;
    }

    try {
      const remedialQuiz = await WeaknessAnalysisService.generateRemedialQuiz(user.uid, weakness);

      Alert.alert(
        '🎯 Focus Quiz Ready!',
        `I've prepared a ${remedialQuiz.questionCount}-question quiz focused on ${weakness.topic.replace(
          /_/g,
          ' '
        )} to help boost your skills in this area.`,
        [
          { text: 'Take Later', style: 'cancel' },
          {
            text: 'Start Now! 🚀',
            onPress: () =>
              navigation.navigate('QuizScreen', {
                questions: remedialQuiz.questions,
                metadata: {
                  title: `Focus: ${weakness.topic.replace(/_/g, ' ')}`,
                  isRemedial: true,
                  focusArea: weakness.topic,
                },
              }),
          },
        ]
      );
    } catch (error) {
      logger.error('Error generating focus quiz:', error);
      Alert.alert('Oops!', "I couldn't generate a focus quiz right now. Please try again in a moment.");
    }
  }, []);

  /**
   * Request coaching tip for specific topic
   */
  const requestCoachingTip = useCallback(async (params: CoachingTipParams) => {
    const { topic, setCoachMessage, setShowCoachTips, setLoadingCoachMessage } = params;

    setLoadingCoachMessage(true);
    try {
      const tipMessage = generateTopicSpecificTip(topic);
      setCoachMessage(tipMessage);
      setShowCoachTips(true);
    } catch (error) {
      logger.error('Error generating coaching tip:', error);
    } finally {
      setLoadingCoachMessage(false);
    }
  }, []);

  return {
    saveQuizForLater,
    handleSubjectCorrection,
    showWeaknessInsightsAlert,
    requestFocusQuiz,
    requestCoachingTip,
  };
};
