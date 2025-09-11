// =============================
// 📊 services/AdvancedAnalyticsService.js
// =============================

/**
 * Advanced Analytics Service for Alexandria App
 * Integrates with the new backend analytics system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';


const CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    QUIZ_COMPLETED: '/advanced/quiz-completed',
    USER_ACHIEVEMENTS: '/advanced/user/{userId}/achievements',
    USER_INSIGHTS: '/advanced/user/{userId}/insights',
    USER_PROFILE: '/advanced/user/{userId}/profile',
  },
  TIMEOUT: 30000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

class AdvancedAnalyticsService {
  static instance = null;

  constructor() {
    if (AdvancedAnalyticsService.instance) {
      return AdvancedAnalyticsService.instance;
    }
    AdvancedAnalyticsService.instance = this;
    this.cache = new Map();
  }

  /**
   * Get current user ID safely
   */
  getCurrentUserId() {
    const user = auth?.currentUser;
    if (!user) {
      logger.warn('⚠️ No authenticated user found');
      return null;
    }
    return user.uid;
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const url = `${CONFIG.BASE_URL}${endpoint}`;
      logger.info(`📡 Making ${method} request to:`, url);

      const requestConfig = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId, // Simple header-based auth
        },
        timeout: CONFIG.TIMEOUT,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        requestConfig.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestConfig);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ API Error (${response.status}):`, errorText);
        logger.error('❌ Request details:', {
          url,
          method,
          headers: requestConfig.headers,
          bodyPreview: data ? JSON.stringify(data).substring(0, 200) + '...' : 'null'
        });
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      logger.info(`✅ API Response received:`, { 
        endpoint, 
        method, 
        success: result.success,
        dataKeys: Object.keys(result)
      });

      return result;
    } catch (error) {
      logger.error(`❌ Network error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Format Alexandria quiz data for backend analytics
   */
  formatQuizDataForAnalytics(questions, userAnswers, score, metadata) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Calculate timing data
    const totalTime = metadata.completionTime || 0;
    const averageTimePerQuestion = questions.length > 0 ? Math.round(totalTime / questions.length) : 0;

    // Format individual question results
    const questionResults = questions.map((question, index) => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = question.isCorrect;
      
      return {
        question_id: question.id || `q_${index}`,
        question_text: question.text || question.questionText || '',
        user_answer: userAnswer || '',
        correct_answer: question.correctAnswer || '',
        is_correct: isCorrect === true,
        time_taken: question.timeSpent || averageTimePerQuestion,
        difficulty: question.difficulty || metadata.difficulty || 'medium',
      };
    });

    // Determine subject key from metadata or content analysis
    const subjectKey = this.determineSubjectKey(metadata, questions);
    
    // Format the request payload
    const payload = {
      user_id: userId,
      quiz_id: metadata.quizId || `quiz_${Date.now()}`,
      subject_key: subjectKey,
      topic: metadata.topic || metadata.title || subjectKey,
      difficulty: metadata.difficulty || 'medium',
      source: metadata.source || 'ask_alexandria',
      questions: questionResults,
      total_time: Math.round(totalTime / 1000), // Convert to seconds
      session_metadata: {
        device_type: 'mobile',
        app_version: '1.0.0',
        completion_date: new Date().toISOString(),
        quiz_type: metadata.isChallenge ? 'challenge' : 'regular',
        interruptions: metadata.interruptions || 0,
        category: metadata.category,
        ...metadata.sessionData
      }
    };

    logger.info('🐛 Quiz completion payload:', JSON.stringify(payload, null, 2));

    logger.info('📊 Formatted quiz data for analytics:', {
      userId: payload.user_id,
      quizId: payload.quiz_id,
      subjectKey: payload.subject_key,
      questionsCount: payload.questions.length,
      totalTime: payload.total_time,
      source: payload.source
    });

    return payload;
  }

  /**
   * Determine subject key from metadata and question content
   */
  determineSubjectKey(metadata, questions) {
    // First try metadata
    if (metadata.subject) return metadata.subject.toLowerCase();
    if (metadata.category) return metadata.category.toLowerCase();

    // Analyze question content
    const questionTexts = questions
      .map(q => (q.text || q.questionText || '').toLowerCase())
      .join(' ');

    const subjectKeywords = {
      mathematics: ['math', 'equation', 'calculate', 'solve', 'formula', 'algebra', 'geometry'],
      science: ['biology', 'chemistry', 'physics', 'cell', 'molecule', 'atom', 'reaction'],
      history: ['historical', 'ancient', 'war', 'empire', 'civilization', 'revolution'],
      literature: ['literature', 'novel', 'author', 'character', 'plot', 'poem', 'story'],
      geography: ['country', 'capital', 'continent', 'ocean', 'mountain', 'climate'],
      language: ['grammar', 'vocabulary', 'syntax', 'language', 'word', 'sentence']
    };

    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      const matches = keywords.filter(keyword => questionTexts.includes(keyword));
      if (matches.length > 0) {
        return subject;
      }
    }

    return 'general_knowledge';
  }

  /**
   * Submit quiz completion to analytics backend
   */
  async submitQuizCompletion(questions, userAnswers, score, metadata) {
    try {
      logger.info('📊 Submitting quiz completion to advanced analytics...');
      
      const payload = this.formatQuizDataForAnalytics(questions, userAnswers, score, metadata);
      const response = await this.makeRequest(CONFIG.ENDPOINTS.QUIZ_COMPLETED, 'POST', payload);
      
      if (response.success) {
        logger.info('✅ Quiz completion submitted successfully!');
        
        // Cache the response for immediate use
        const cacheKey = `completion_${payload.quiz_id}`;
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });

        return {
          success: true,
          completionId: response.completion_id,
          analytics: {
            accuracy: response.accuracy,
            performanceLevel: response.performance_level,
            timeEfficiency: response.time_efficiency,
          },
          achievements: response.achievements_earned || [],
          insights: response.insights_generated || [],
          updatedStats: response.updated_stats || {},
          message: response.message || 'Quiz completed successfully!'
        };
      } else {
        throw new Error('Quiz completion submission failed');
      }
    } catch (error) {
      logger.error('❌ Error submitting quiz completion:', error);
      
      // Return a fallback response to prevent UI breaks
      return {
        success: false,
        error: error.message,
        achievements: [],
        insights: [],
        message: 'Quiz completed! Analytics temporarily unavailable.'
      };
    }
  }

  /**
   * Get user achievements with caching
   */
  async getUserAchievements(limit = 50, useCache = true) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return { achievements: [], total_count: 0 };
    }

    const cacheKey = `achievements_${userId}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
        logger.info('📊 Returning cached achievements');
        return cached.data;
      }
    }

    try {
      const endpoint = CONFIG.ENDPOINTS.USER_ACHIEVEMENTS.replace('{userId}', userId) + `?limit=${limit}`;
      const response = await this.makeRequest(endpoint);
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      logger.info(`✅ Retrieved ${response.achievements?.length || 0} achievements`);
      return response;
    } catch (error) {
      logger.error('❌ Error fetching achievements:', error);
      return { achievements: [], total_count: 0 };
    }
  }

  /**
   * Get user learning insights with caching
   */
  async getUserInsights(limit = 20, useCache = true) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return { insights: [], total_count: 0 };
    }

    const cacheKey = `insights_${userId}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
        logger.info('📊 Returning cached insights');
        return cached.data;
      }
    }

    try {
      const endpoint = CONFIG.ENDPOINTS.USER_INSIGHTS.replace('{userId}', userId) + `?limit=${limit}`;
      const response = await this.makeRequest(endpoint);
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      logger.info(`✅ Retrieved ${response.insights?.length || 0} insights`);
      return response;
    } catch (error) {
      logger.error('❌ Error fetching insights:', error);
      return { insights: [], total_count: 0 };
    }
  }

  /**
   * Get comprehensive user learning profile
   */
  async getUserProfile(useCache = true) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return null;
    }

    const cacheKey = `profile_${userId}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
        logger.info('📊 Returning cached profile');
        return cached.data;
      }
    }

    try {
      const endpoint = CONFIG.ENDPOINTS.USER_PROFILE.replace('{userId}', userId);
      const response = await this.makeRequest(endpoint);
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      logger.info('✅ Retrieved user learning profile');
      return response;
    } catch (error) {
      logger.error('❌ Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Clear specific cache entries
   */
  clearCache(pattern = null) {
    if (pattern) {
      // Clear entries matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
    logger.info('🗑️ Cache cleared');
  }

  /**
   * Get cached data for debugging
   */
  getCacheInfo() {
    const cacheInfo = {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timestamps: {}
    };
    
    for (const [key, value] of this.cache.entries()) {
      cacheInfo.timestamps[key] = new Date(value.timestamp).toISOString();
    }
    
    return cacheInfo;
  }

  /**
   * Health check for the analytics service
   */
  async healthCheck() {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      return {
        available: response.ok,
        status: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.warn('⚠️ Analytics service health check failed:', error.message);
      return {
        available: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Format achievements for UI display
   */
  formatAchievementsForUI(achievements) {
    return achievements.map(achievement => ({
      id: achievement.key || achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon || '🏆',
      rarity: achievement.rarity || 'common',
      points: achievement.points || 0,
      category: achievement.category || 'general',
      earnedDate: achievement.earned_date || achievement.earnedDate,
      isNew: this.isNewAchievement(achievement)
    }));
  }

  /**
   * Format insights for UI display
   */
  formatInsightsForUI(insights) {
    return insights.map(insight => ({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      message: insight.message,
      actionable: insight.actionable || false,
      recommendations: insight.recommendations || [],
      confidence: insight.confidence || 0.5,
      impactLevel: insight.impact_level || 'medium',
      generatedDate: insight.generated_date || insight.generatedDate,
      icon: this.getInsightIcon(insight.type),
      priority: this.getInsightPriority(insight)
    }));
  }

  /**
   * Check if achievement is new (earned in last 24 hours)
   */
  isNewAchievement(achievement) {
    if (!achievement.earned_date && !achievement.earnedDate) return false;
    
    const earnedDate = new Date(achievement.earned_date || achievement.earnedDate);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return earnedDate > oneDayAgo;
  }

  /**
   * Get appropriate icon for insight type
   */
  getInsightIcon(type) {
    const iconMap = {
      performance: '📈',
      subject_mastery: '🎯',
      study_pattern: '📚',
      improvement: '🌱',
      achievement: '🏆',
      recommendation: '💡'
    };
    return iconMap[type] || '💭';
  }

  /**
   * Calculate insight priority for sorting
   */
  getInsightPriority(insight) {
    let priority = 0;
    
    // Base priority from confidence
    priority += (insight.confidence || 0.5) * 50;
    
    // Impact level bonus
    const impactBonus = {
      high: 30,
      medium: 15,
      low: 5
    };
    priority += impactBonus[insight.impact_level] || 10;
    
    // Actionable bonus
    if (insight.actionable) priority += 20;
    
    // Recency bonus (newer insights get higher priority)
    if (insight.generated_date || insight.generatedDate) {
      const generatedDate = new Date(insight.generated_date || insight.generatedDate);
      const hoursAgo = (Date.now() - generatedDate.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 24) priority += 15;
      else if (hoursAgo < 48) priority += 10;
    }
    
    return Math.round(priority);
  }
}

export default new AdvancedAnalyticsService();