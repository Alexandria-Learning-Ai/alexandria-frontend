import { useState } from 'react';
import { auth } from '../firebaseConfig';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';
import { SubjectProgressService } from '../services/SubjectProgressService';
import UnifiedNotificationService from '../utils/UnifiedNotificationService';
import { BackendSyncService } from '../services/BackendSyncService';
import logger from '../utils/logger';

interface QuizAnalyticsParams {
  questions: any[];
  userAnswers: Record<string, any>;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
  metadata: any;
}

export const useQuizAnalytics = ({
  questions,
  userAnswers,
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  percentage,
  metadata,
}: QuizAnalyticsParams) => {
  const [weaknessAnalysis, setWeaknessAnalysis] = useState<any>(null);
  const [analyticsAchievements, setAnalyticsAchievements] = useState<any[]>([]);
  const [analyticsInsights, setAnalyticsInsights] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const handleQuizCompletion = async (
    formattedResults: any,
    isMountedRef: React.MutableRefObject<boolean>,
    showWeaknessInsightsAlert: (analysis: any) => void
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        logger.warn('⚠️ No authenticated user found, skipping progress tracking');
        return;
      }

      logger.info('📊 Quiz completed, analyzing results...');

      logger.info('📊 Formatted results structure:', {
        answersCount: formattedResults.answers?.length || 0,
        hasAnswers: Array.isArray(formattedResults.answers),
        score: formattedResults.score,
        totalQuestions: formattedResults.totalQuestions,
        category: formattedResults.category,
      });

      // Update subject progress FIRST (this feeds the dashboard)
      await SubjectProgressService.updateSubjectProgress(user.uid, formattedResults);

      // Auto-sync to backend on quiz completion
      try {
        const quizData = {
          id: `auto_${Date.now()}`,
          title: metadata.title || `Auto-saved Quiz - ${new Date().toLocaleDateString()}`,
          questions: questions,
          totalQuestions,
          correctCount,
          incorrectCount,
          percentage,
          results: {
            score,
            totalQuestions,
            percentage,
            correctCount,
            incorrectCount,
          },
          metadata: {
            ...metadata,
            completedAt: new Date().toISOString(),
            autoSaved: true,
          },
          userAnswers,
          createdAt: new Date().toISOString(),
        };

        const progressData = {
          questionsAnswered: totalQuestions,
          questionsCorrect: correctCount,
          accuracy: percentage,
          studyTimeSeconds: metadata?.timeSpent || 0,
          subject: metadata?.subject || metadata?.course_code,
          subjectKey: metadata?.subject || metadata?.course_code,
          difficulty: metadata?.difficulty || 'medium',
          source: metadata?.source || 'auto_completion',
          sessionData: {
            quiz_id: quizData.id,
            completion_time: new Date().toISOString(),
            device_type: 'mobile',
            auto_saved: true,
          },
        };

        logger.info('🔄 Auto-syncing quiz completion to backend...');
        const syncResult = await BackendSyncService.syncQuizCompletion(quizData, progressData);

        if (syncResult.success) {
          logger.info('✅ Auto-sync to backend successful');
        } else {
          logger.warn('⚠️ Auto-sync failed, data cached locally only');
        }
      } catch (autoSyncError) {
        logger.error('❌ Auto-sync error (non-critical):', autoSyncError);
        // Don't block the UI for auto-sync failures
      }

      // Format answers for weakness analysis
      const detailedAnswers = formattedResults.answers.map((answer: any) => ({
        question: answer.question,
        options: answer.options,
        correctAnswer: answer.correctAnswer,
        selectedAnswer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        explanation: '',
        category: answer.category,
        difficulty: answer.difficulty,
        timeSpent: answer.timeSpent,
      }));

      // Analyze weaknesses and generate recommendations
      const analysis = await WeaknessAnalysisService.analyzeQuizResults(user.uid, {
        quizId: metadata.quizId || `quiz_${Date.now()}`,
        score: correctCount,
        totalQuestions: totalQuestions,
        answers: detailedAnswers,
        timestamp: new Date().toISOString(),
        category: formattedResults.category,
        difficulty: formattedResults.difficulty,
      });

      if (analysis && isMountedRef.current) {
        showWeaknessInsightsAlert(analysis);
        const currentWeaknesses = await WeaknessAnalysisService.getCurrentWeaknesses(user.uid);
        setWeaknessAnalysis(currentWeaknesses);
      }

      // Trigger smart analysis after quiz completion
      await UnifiedNotificationService.scheduleIntelligentNotifications(user.uid, 'quiz_completed');

      logger.info('✅ Quiz completion analysis finished successfully');
    } catch (error) {
      logger.error('❌ Error in quiz completion analysis:', error);
      logger.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
    }
  };

  return {
    weaknessAnalysis,
    analyticsAchievements,
    analyticsInsights,
    userProfile,
    loadingAnalytics,
    setWeaknessAnalysis,
    setAnalyticsAchievements,
    setAnalyticsInsights,
    setUserProfile,
    setLoadingAnalytics,
    handleQuizCompletion,
  };
};
