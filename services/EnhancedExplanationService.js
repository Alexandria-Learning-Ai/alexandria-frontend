import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { SubjectDetector } from '../utils/SubjectDetector';
import logger from '../utils/logger';


export class EnhancedExplanationService {
  static STORAGE_KEYS = {
    USER_TIER: 'user_explanation_tier',
    EXPLANATION_CACHE: 'explanation_cache',
    API_USAGE_COUNT: 'explanation_api_usage',
    LAST_CACHE_CLEAR: 'last_explanation_cache_clear'
  };
  
  // Explanation tiers with their capabilities
  static TIERS = {
    1: {
      id: 1,
      name: 'Basic Enhanced',
      provider: 'GPT-3.5 Turbo',
      features: ['Clear explanations', 'Key concepts', 'Why answer is wrong'],
      cost: 'Free',
      color: '#10B981',
      maxUsagePerDay: 20
    },
    2: {
      id: 2,
      name: 'Advanced Learning',
      provider: 'GPT-4',
      features: ['Step-by-step breakdowns', 'Common mistakes', 'Learning tips', 'Study suggestions'],
      cost: '$0.02 per explanation',
      color: '#3B82F6',
      maxUsagePerDay: 100
    },
    3: {
      id: 3,
      name: 'Premium Experience',
      provider: 'Claude Opus',
      features: ['Personalized analysis', 'Adaptive learning paths', 'Multiple approaches', 'Confidence building'],
      cost: '$0.05 per explanation',
      color: '#8B5CF6',
      maxUsagePerDay: 500
    }
  };

  /**
   * Get current user's explanation tier
   */
  static async getCurrentTier() {
    try {
      const tier = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_TIER);
      return tier ? parseInt(tier) : 1; // Default to Tier 1 (free)
    } catch (error) {
      logger.error('Error getting explanation tier:', error);
      return 1; // Fallback to free tier
    }
  }

  /**
   * Set user's explanation tier
   */
  static async setTier(tierId) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_TIER, tierId.toString());
      logger.info(`✅ User tier set to: ${tierId}`);
      return true;
    } catch (error) {
      logger.error('Error setting explanation tier:', error);
      return false;
    }
  }

  /**
   * Get enhanced explanation for incorrect answer
   */
  static async getEnhancedExplanation(questionData, userAnswer, correctAnswer, options = {}) {
    try {
      logger.info('🧠 Generating enhanced explanation...');
      
      const userTier = await this.getCurrentTier();
      const cacheKey = this.generateCacheKey(questionData, userAnswer, userTier);
      
      // Check cache first (unless force refresh)
      if (!options.forceRefresh) {
        const cached = await this.getCachedExplanation(cacheKey);
        if (cached) {
          logger.info('💾 Using cached explanation');
          return cached;
        }
      }

      // Check usage limits
      const canUseAPI = await this.checkUsageLimits(userTier);
      if (!canUseAPI) {
        logger.info('⚠️ Usage limit reached, using fallback');
        return this.getFallbackExplanation(questionData, userAnswer, correctAnswer);
      }

      // Enhanced subject detection using comprehensive detector
      const questionText = questionData.question || questionData.questionText || '';
      const detectionResult = SubjectDetector.detectSubject(questionText, {
        minConfidence: 0.3 // Lower threshold for broader detection
      });
      
      // Use detected subject or fall back to provided subject
      const finalSubject = questionData.subject || detectionResult.subject;
      
      // ✅ FIXED: Convert boolean answers to strings for API compatibility
      const normalizeAnswerForAPI = (answer) => {
        if (answer === null || answer === undefined) return '';
        if (typeof answer === 'boolean') return answer ? 'true' : 'false';
        return String(answer);
      };

      // Prepare API payload with enhanced context
      const payload = {
        question: questionText,
        user_answer: normalizeAnswerForAPI(userAnswer),
        correct_answer: normalizeAnswerForAPI(correctAnswer),
        subject: finalSubject,
        difficulty: questionData.difficulty || 'medium',
        user_tier: userTier,
        options: questionData.options || [],
        user_context: {
          previous_mistakes: await this.getUserMistakePatterns(finalSubject),
          study_level: 'high_school', // You can make this dynamic
          subject_detection: {
            detected_subject: detectionResult.subject,
            confidence: detectionResult.confidence,
            alternatives: detectionResult.alternatives,
            method: detectionResult.method
          },
          original_subject: questionData.subject
        }
      };

      logger.info(`🔧 Answer normalization:`, {
        originalUserAnswer: userAnswer,
        originalCorrectAnswer: correctAnswer,
        normalizedUserAnswer: normalizeAnswerForAPI(userAnswer),
        normalizedCorrectAnswer: normalizeAnswerForAPI(correctAnswer)
      });
      
      logger.info(`🎯 Subject detection: "${finalSubject}" (detected: "${detectionResult.subject}", confidence: ${Math.round(detectionResult.confidence * 100)}%)`);

      logger.info(`📡 Calling API with Tier ${userTier}...`);
      const response = await this.callExplanationAPI(payload);
      
      if (response.success) {
        logger.info(`✅ Tier ${userTier} explanation generated successfully`);
        
        // Handle response format: response.data contains the explanation
        const explanationData = response.data || response.explanation || response;
        
        // Cache the result
        await this.cacheExplanation(cacheKey, explanationData);
        
        // Track usage
        await this.trackAPIUsage(userTier);
        
        return this.formatExplanationForUI(explanationData);
      } else {
        throw new Error(response.error || 'API request failed');
      }
      
    } catch (error) {
      logger.error('❌ Enhanced explanation error:', error);
      
      // Graceful fallback to basic explanation
      return this.getFallbackExplanation(questionData, userAnswer, correctAnswer);
    }
  }

  /**
   * Call the enhanced explanation API
   */
  static async callExplanationAPI(payload) {
    try {
      const apiUrl = `${API_BASE_URL}/generate-detailed-explanation`;
      logger.info(`🌐 Making API call to: ${apiUrl}`);
      logger.info(`📦 Payload:`, JSON.stringify(payload, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization if needed: 'Authorization': 'Bearer your-token'
        },
        body: JSON.stringify(payload),
        timeout: 15000 // 15 second timeout
      });

      logger.info(`📡 API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ API Error Response: ${errorText}`);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      logger.info(`✅ API Success Response:`, data);
      return data;
      
    } catch (error) {
      logger.error('❌ API call failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format API response for UI consumption
   */
  static formatExplanationForUI(apiResponse) {
    // Handle both old and new response formats
    const explanationData = apiResponse.explanation || apiResponse;
    const { explanation, tier, tier_used, model, confidence, processing_time, features } = explanationData;
    
    const actualTier = tier || tier_used || 1;
    const actualModel = model || 'AI Assistant';
    
    // Format based on tier structure
    if (actualTier === 1) {
      return {
        type: 'enhanced',
        tier: actualTier,
        model: actualModel,
        confidence: confidence || 0.9,
        processingTime: processing_time || 0,
        sections: {
          whyWrong: typeof explanation === 'string' ? explanation : (explanation?.why_wrong || 'Your answer was incorrect.'),
          correctReasoning: explanation?.correct_reasoning || 'The correct approach involves understanding the key concepts.',
          keyPoints: explanation?.key_points || explanation?.learning_tips || [],
          additionalInfo: {
            provider: actualModel,
            confidence: confidence ? `${Math.round(confidence * 100)}%` : '90%',
            features: features || ['basic_explanation', 'error_identification']
          }
        }
      };
    } 
    else if (actualTier === 2) {
      return {
        type: 'advanced',
        tier: actualTier,
        model: actualModel,
        confidence: confidence || 0.9,
        processingTime: processing_time || 0,
        sections: {
          whyWrong: typeof explanation === 'string' ? explanation : (explanation?.why_wrong || 'Your answer needs improvement.'),
          stepByStep: explanation?.step_by_step || [],
          correctReasoning: explanation?.correct_reasoning || 'The correct approach involves careful analysis.',
          commonMistakes: explanation?.common_mistakes || [],
          learningTips: explanation?.learning_tips || [],
          studySuggestion: explanation?.study_suggestion || 'Practice similar problems to reinforce understanding.',
          additionalInfo: {
            provider: actualModel,
            confidence: confidence ? `${Math.round(confidence * 100)}%` : '90%',
            processingTime: processing_time ? `${processing_time.toFixed(1)}s` : '2.0s',
            features: features || ['detailed_analysis', 'step_by_step_guidance', 'mistake_prevention']
          }
        }
      };
    }
    else if (actualTier === 3) {
      return {
        type: 'premium',
        tier: actualTier,
        model: actualModel,
        confidence: confidence || 0.95,
        processingTime: processing_time || 0,
        sections: {
          personalizedAnalysis: explanation?.personalized_analysis || 'Based on your learning pattern, here\'s personalized guidance.',
          whyWrong: typeof explanation === 'string' ? explanation : (explanation?.why_wrong || 'Let\'s analyze what led to this choice.'),
          stepByStep: explanation?.step_by_step || [],
          correctReasoning: explanation?.correct_reasoning || 'Here\'s the expert approach to this problem.',
          commonPitfalls: explanation?.common_pitfalls || explanation?.common_mistakes || [],
          learningPath: explanation?.learning_path || 'Here\'s your personalized learning path forward.',
          practiceSuggestions: explanation?.practice_suggestions || [],
          confidenceBuilding: explanation?.confidence_building || 'You\'re making progress! Here\'s how to build confidence.',
          additionalInfo: {
            provider: actualModel,
            confidence: confidence ? `${Math.round(confidence * 100)}%` : '95%',
            processingTime: processing_time ? `${processing_time.toFixed(1)}s` : '3.5s',
            features: features || ['diagnostic_analysis', 'personalized_guidance', 'expert_insights']
          }
        }
      };
    }
    
    // Fallback format
    return this.getFallbackExplanation();
  }

  /**
   * Generate cache key for explanation
   */
  static generateCacheKey(questionData, userAnswer, tier) {
    const hashString = `${questionData.question}-${userAnswer}-${tier}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `exp_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get cached explanation
   */
  static async getCachedExplanation(cacheKey) {
    try {
      const cacheData = await AsyncStorage.getItem(`${this.STORAGE_KEYS.EXPLANATION_CACHE}_${cacheKey}`);
      if (!cacheData) return null;

      const parsed = JSON.parse(cacheData);
      const now = Date.now();
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - parsed.timestamp > CACHE_DURATION) {
        // Cache expired
        await AsyncStorage.removeItem(`${this.STORAGE_KEYS.EXPLANATION_CACHE}_${cacheKey}`);
        return null;
      }

      return parsed.data;
    } catch (error) {
      logger.error('Error getting cached explanation:', error);
      return null;
    }
  }

  /**
   * Cache explanation
   */
  static async cacheExplanation(cacheKey, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.EXPLANATION_CACHE}_${cacheKey}`, 
        JSON.stringify(cacheData)
      );
    } catch (error) {
      logger.error('Error caching explanation:', error);
    }
  }

  /**
   * Get fallback explanation when API fails
   */
  static getFallbackExplanation(questionData, userAnswer, correctAnswer) {
    return {
      type: 'fallback',
      tier: 0,
      model: 'Local Fallback',
      confidence: 0.5,
      processingTime: 0,
      sections: {
        whyWrong: `Your answer "${userAnswer}" is incorrect.`,
        correctReasoning: `The correct answer is "${correctAnswer}".`,
        keyPoints: [
          'Review the question carefully',
          'Think about the key concepts involved',
          'Practice similar questions'
        ],
        additionalInfo: {
          provider: 'Local Fallback',
          note: 'Enhanced explanation temporarily unavailable'
        }
      }
    };
  }

  /**
   * Check usage limits for the user's tier
   */
  static async checkUsageLimits(tier) {
    try {
      const today = new Date().toDateString();
      const usageKey = `${this.STORAGE_KEYS.API_USAGE_COUNT}_${today}`;
      const usageData = await AsyncStorage.getItem(usageKey);
      
      const currentUsage = usageData ? JSON.parse(usageData) : { count: 0, tier };
      const maxUsage = this.TIERS[tier]?.maxUsagePerDay || 20;
      
      return currentUsage.count < maxUsage;
    } catch (error) {
      logger.error('Error checking usage limits:', error);
      return true; // Allow usage if can't check
    }
  }

  /**
   * Track API usage
   */
  static async trackAPIUsage(tier) {
    try {
      const today = new Date().toDateString();
      const usageKey = `${this.STORAGE_KEYS.API_USAGE_COUNT}_${today}`;
      const usageData = await AsyncStorage.getItem(usageKey);
      
      const currentUsage = usageData ? JSON.parse(usageData) : { count: 0, tier };
      currentUsage.count += 1;
      currentUsage.lastUsed = new Date().toISOString();
      
      await AsyncStorage.setItem(usageKey, JSON.stringify(currentUsage));
      
      logger.info(`📊 API usage tracked: ${currentUsage.count}/${this.TIERS[tier]?.maxUsagePerDay || 'unlimited'}`);
      
    } catch (error) {
      logger.error('Error tracking API usage:', error);
    }
  }

  /**
   * Get user's mistake patterns for better explanations
   */
  static async getUserMistakePatterns(subject) {
    try {
      // This could integrate with your SubjectProgressService
      // For now, return empty array - you can enhance this later
      return [];
    } catch (error) {
      logger.error('Error getting mistake patterns:', error);
      return [];
    }
  }

  /**
   * Get supported subjects from the comprehensive detector
   */
  static getSupportedSubjects() {
    return SubjectDetector.getSupportedSubjects();
  }

  /**
   * Test subject detection on sample questions
   */
  static async testSubjectDetection() {
    const testQuestions = [
      "Human-Computer Interaction (HCI) primarily focuses on the tasks to be completed rather than the needs of users.",
      "What is the derivative of x^2 + 3x + 1?",
      "Which battle marked the end of Napoleon's rule in Europe?",
      "What is the process by which plants convert sunlight into energy?",
      "Write a function to sort an array in ascending order."
    ];

    logger.info('🧪 Testing subject detection:');
    testQuestions.forEach(question => {
      const result = SubjectDetector.detectSubject(question);
      logger.info(`Question: "${question.substring(0, 50)}..."`);
      logger.info(`Detected: ${result.subject} (${Math.round(result.confidence * 100)}% confidence)`);
      logger.info('---');
    });
  }

  /**
   * Get tier upgrade suggestions
   */
  static async getTierUpgradeSuggestions() {
    try {
      const currentTier = await this.getCurrentTier();
      const suggestions = [];
      
      if (currentTier === 1) {
        suggestions.push({
          toTier: 2,
          reason: 'Get detailed step-by-step breakdowns and learning tips',
          benefits: ['Advanced explanations', 'Study strategies', 'Common mistake analysis']
        });
      }
      
      if (currentTier < 3) {
        suggestions.push({
          toTier: 3,
          reason: 'Access premium personalized learning experience',
          benefits: ['AI-powered learning paths', 'Personalized analysis', 'Advanced tutoring']
        });
      }
      
      return suggestions;
    } catch (error) {
      logger.error('Error getting upgrade suggestions:', error);
      return [];
    }
  }

  /**
   * Clear explanation cache
   */
  static async clearCache() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.STORAGE_KEYS.EXPLANATION_CACHE));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_CACHE_CLEAR, new Date().toISOString());
        logger.info(`🗑️ Cleared ${cacheKeys.length} cached explanations`);
      }
      
      return true;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get usage statistics
   */
  static async getUsageStats() {
    try {
      const currentTier = await this.getCurrentTier();
      const today = new Date().toDateString();
      const usageKey = `${this.STORAGE_KEYS.API_USAGE_COUNT}_${today}`;
      const usageData = await AsyncStorage.getItem(usageKey);
      
      const todayUsage = usageData ? JSON.parse(usageData) : { count: 0 };
      const maxUsage = this.TIERS[currentTier]?.maxUsagePerDay || 20;
      
      return {
        currentTier: this.TIERS[currentTier],
        todayUsage: todayUsage.count,
        maxUsage,
        remainingUsage: Math.max(0, maxUsage - todayUsage.count),
        percentageUsed: Math.round((todayUsage.count / maxUsage) * 100)
      };
    } catch (error) {
      logger.error('Error getting usage stats:', error);
      return {
        currentTier: this.TIERS[1],
        todayUsage: 0,
        maxUsage: 20,
        remainingUsage: 20,
        percentageUsed: 0
      };
    }
  }

  /**
   * Test explanation system
   */
  static async testExplanationSystem(tier = null) {
    try {
      const testTier = tier || await this.getCurrentTier();
      
      logger.info(`🧪 Testing Tier ${testTier} explanation system...`);
      
      const testData = {
        question: 'What is the capital of France?',
        subject: 'Geography',
        difficulty: 'easy'
      };
      
      const result = await this.getEnhancedExplanation(
        testData,
        'London',
        'Paris',
        { forceRefresh: true }
      );
      
      logger.info('✅ Test completed successfully:', result);
      return result;
      
    } catch (error) {
      logger.error('❌ Test failed:', error);
      throw error;
    }
  }
}