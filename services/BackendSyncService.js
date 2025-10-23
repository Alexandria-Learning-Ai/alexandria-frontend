import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';

/**
 * Service for syncing user data with backend APIs
 * Handles quiz history, progress tracking, and other persistent data
 */
export class BackendSyncService {
  static BASE_URL = API_BASE_URL;

  /**
   * Get authorization headers for API requests
   */
  static async getAuthHeaders() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-ID': user.uid, // CRITICAL: Include user ID for proper data isolation
    };
  }

  /**
   * Save completed quiz to backend
   */
  static async saveQuizCompletion(quizData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      // Prepare quiz completion data for backend
      const completionData = {
        quiz_id: quizData.id || `quiz_${Date.now()}`,
        subject_key: quizData.metadata?.subject || quizData.metadata?.course_code,
        topic: quizData.metadata?.topic || quizData.metadata?.title || quizData.title || 'Unknown',
        difficulty: quizData.metadata?.difficulty || 'medium',
        source: quizData.metadata?.source || 'ask_alexandria',
        questions_total: quizData.totalQuestions || quizData.questions?.length || 0,
        questions_correct: quizData.correctCount || quizData.results?.correctCount || 0,
        accuracy: quizData.percentage || quizData.results?.percentage || 0,
        performance_level: this.calculatePerformanceLevel(quizData.percentage || quizData.results?.percentage || 0),
        time_taken: quizData.metadata?.timeSpent || quizData.timeSpent || 0,
        question_details: {
          questions: quizData.questions || [],
          user_answers: quizData.userAnswers || [],
          detailed_results: quizData.results || {}
        },
        session_metadata: {
          device_type: 'mobile',
          platform: 'react-native',
          app_version: quizData.metadata?.appVersion || '1.0.0',
          completion_time: new Date().toISOString(),
          ...quizData.metadata
        }
      };

      logger.info('💾 Saving quiz completion to backend...', {
        quiz_id: completionData.quiz_id,
        topic: completionData.topic,
        accuracy: completionData.accuracy
      });

      const response = await fetch(`${this.BASE_URL}/api/quiz-history/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(completionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ Quiz completion saved to backend', result);

      return result;
    } catch (error) {
      logger.error('❌ Failed to save quiz completion to backend:', error);
      throw error;
    }
  }

  /**
   * Update user progress after quiz completion
   */
  static async updateProgress(progressData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      // Prepare progress update data
      const updateData = {
        quiz_completed: true,
        questions_answered: progressData.questionsAnswered || progressData.totalQuestions || 0,
        questions_correct: progressData.questionsCorrect || progressData.correctCount || 0,
        study_time_seconds: progressData.studyTimeSeconds || progressData.timeSpent || 0,
        subject: progressData.subject || progressData.subjectKey,
        difficulty: progressData.difficulty || 'medium',
        session_data: {
          accuracy: progressData.accuracy || progressData.percentage || 0,
          performance_level: this.calculatePerformanceLevel(progressData.accuracy || progressData.percentage || 0),
          completion_time: new Date().toISOString(),
          source: progressData.source || 'quiz_completion',
          ...progressData.sessionData
        }
      };

      logger.info('📈 Updating user progress...', {
        subject: updateData.subject,
        accuracy: updateData.session_data.accuracy
      });

      const response = await fetch(`${this.BASE_URL}/api/progress/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ User progress updated', result);

      return result;
    } catch (error) {
      logger.error('❌ Failed to update progress:', error);
      throw error;
    }
  }

  /**
   * Get user's quiz history from backend
   */
  static async getQuizHistory(options = {}) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      // Build query parameters
      const params = new URLSearchParams({
        page: options.page || 1,
        page_size: options.pageSize || 20,
        ...(options.subjectKey && { subject_key: options.subjectKey }),
        ...(options.source && { source: options.source }),
        ...(options.daysBack && { days_back: options.daysBack })
      });

      logger.info('📚 Fetching quiz history from backend...');

      const response = await fetch(`${this.BASE_URL}/api/quiz-history/?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ Quiz history fetched from backend', {
        count: result.history?.length || 0,
        total: result.total_count || 0
      });

      return result;
    } catch (error) {
      logger.error('❌ Failed to fetch quiz history:', error);
      throw error;
    }
  }

  /**
   * Get user's learning profile from backend
   */
  static async getLearningProfile() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      logger.info('📊 Fetching learning profile from backend...');

      const response = await fetch(`${this.BASE_URL}/api/progress/profile`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ Learning profile fetched from backend', {
        streak: result.current_streak,
        accuracy: result.overall_accuracy
      });

      return result;
    } catch (error) {
      logger.error('❌ Failed to fetch learning profile:', error);
      throw error;
    }
  }

  /**
   * Get user's streak information
   */
  static async getStreakInfo() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      logger.info('🔥 Fetching streak info from backend...');

      const response = await fetch(`${this.BASE_URL}/api/progress/streak`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ Streak info fetched from backend', {
        current: result.current_streak,
        longest: result.longest_streak
      });

      return result;
    } catch (error) {
      logger.error('❌ Failed to fetch streak info:', error);
      throw error;
    }
  }

  /**
   * Get subject-specific progress
   */
  static async getSubjectProgress() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      logger.info('📚 Fetching subject progress from backend...');

      const response = await fetch(`${this.BASE_URL}/api/progress/subjects`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ Subject progress fetched from backend', {
        subjects: result.length
      });

      return result;
    } catch (error) {
      logger.error('❌ Failed to fetch subject progress:', error);
      throw error;
    }
  }

  /**
   * Get study insights and analytics
   */
  static async getStudyInsights(daysBack = 30) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      logger.info('🔍 Fetching study insights from backend...');

      const response = await fetch(`${this.BASE_URL}/api/progress/insights?days_back=${daysBack}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ Study insights fetched from backend');

      return result;
    } catch (error) {
      logger.error('❌ Failed to fetch study insights:', error);
      throw error;
    }
  }

  /**
   * Update user profile on backend
   */
  static async updateUserProfile(profileData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      logger.info('👤 Updating user profile on backend...', {
        user_id: user.uid,
        fields: Object.keys(profileData),
      });

      const response = await fetch(`${this.BASE_URL}/api/profile/${user.uid}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ User profile updated on backend', result);

      return result;
    } catch (error) {
      logger.error('❌ Failed to update user profile on backend:', error);
      throw error;
    }
  }

  /**
   * Update flashcard progress (uses progress update endpoint)
   */
  static async updateFlashcardProgress(flashcardData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      // Map flashcard data to progress update format
      const progressData = {
        quiz_completed: false,
        questions_answered: flashcardData.cardsReviewed || 0,
        questions_correct: flashcardData.cardsCorrect || 0,
        study_time_seconds: flashcardData.timeSpent || 0,
        subject: flashcardData.subject || 'flashcards',
        difficulty: flashcardData.difficulty || 'medium',
        session_data: {
          flashcard_set_id: flashcardData.flashcardSetId,
          cards_reviewed: flashcardData.cardsReviewed,
          cards_correct: flashcardData.cardsCorrect,
          progress_percentage: flashcardData.progress || 0,
          session_type: 'flashcard_review',
          ...flashcardData.metadata,
        },
      };

      logger.info('🗂️ Updating flashcard progress on backend...', {
        flashcard_set: flashcardData.flashcardSetId,
        cards_reviewed: flashcardData.cardsReviewed,
      });

      const response = await fetch(`${this.BASE_URL}/api/progress/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ Flashcard progress updated on backend', result);

      return result;
    } catch (error) {
      logger.error('❌ Failed to update flashcard progress on backend:', error);
      throw error;
    }
  }

  /**
   * Update exam schedule (stores in profile notes field)
   */
  static async updateExamSchedule(examData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const headers = await this.getAuthHeaders();

      // Create exam schedule entry
      const examEntry = {
        id: examData.examId || `exam_${Date.now()}`,
        subject: examData.subject,
        topic: examData.topic,
        date: examData.date,
        time: examData.time,
        duration: examData.duration,
        location: examData.location,
        notes: examData.notes,
        created_at: new Date().toISOString(),
      };

      // For now, store exam schedule in profile notes as JSON
      // TODO: Create dedicated ExamSchedule model and endpoint when needed
      const notesData = {
        notes: JSON.stringify({
          type: 'exam_schedule',
          exam: examEntry,
          updated_at: new Date().toISOString(),
        }),
      };

      logger.info('📅 Updating exam schedule on backend...', {
        exam_id: examEntry.id,
        subject: examData.subject,
        date: examData.date,
      });

      const response = await fetch(`${this.BASE_URL}/api/profile/${user.uid}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(notesData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('✅ Exam schedule updated on backend', result);

      return result;
    } catch (error) {
      logger.error('❌ Failed to update exam schedule on backend:', error);
      throw error;
    }
  }

  /**
   * Calculate performance level based on accuracy percentage
   */
  static calculatePerformanceLevel(accuracy) {
    if (accuracy >= 90) return 'exceptional';
    if (accuracy >= 80) return 'excellent';
    if (accuracy >= 70) return 'good';
    if (accuracy >= 60) return 'fair';
    return 'needs_improvement';
  }

  /**
   * Sync all user data (quiz history + progress) after quiz completion
   * This is the main method to call after a quiz is completed
   */
  static async syncQuizCompletion(quizData, progressData) {
    try {
      logger.info('🔄 Starting backend sync for quiz completion...');

      // Run both API calls in parallel for better performance
      const [quizResult, progressResult] = await Promise.all([
        this.saveQuizCompletion(quizData),
        this.updateProgress(progressData)
      ]);

      logger.info('✅ Backend sync completed successfully');

      return {
        quiz: quizResult,
        progress: progressResult,
        success: true
      };
    } catch (error) {
      logger.error('❌ Backend sync failed:', error);

      // Return partial success info for graceful handling
      return {
        success: false,
        error: error.message,
        offline: true // Flag to indicate data should be cached locally
      };
    }
  }
}