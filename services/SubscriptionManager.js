// SubscriptionManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { revenueCatService, ENTITLEMENTS } from './RevenueCatService';
import logger from '../utils/logger';


export const SUBSCRIPTION_TIERS = {
  EXPLORER: {
    id: 'explorer',
    name: 'The Explorer',
    subtitle: 'Powered by GPT-3.5',
    emoji: '🥉',
    price: 2.99,
    color: '#CD7F32', // Bronze color
    ideal: 'Perfect for casual learners and exam prep',
    features: [
      'All core features: quiz generation, history tracking, grading',
      'Custom quiz types (MCQ, true/false, open-ended)',
      'Progress tracking, streaks, and XP system',
      'Quiz explanations and feedback',
      'Unlimited quiz generation',
      'Study reminders and notifications'
    ],
    limits: {
      quizzesPerDay: 50,
      questionsPerQuiz: 15,
      historyRetention: 90, // days
      aiModel: 'gpt-3.5-turbo'
    },
    targetUsers: ['Casual learners', 'General exam prep', 'High school students']
  },
  
  SCHOLAR: {
    id: 'scholar',
    name: 'The Scholar',
    subtitle: 'Powered by Claude Sonnet & GPT-4',
    emoji: '🥈',
    price: 5.99,
    color: '#C0C0C0', // Silver color
    ideal: 'Ideal for serious students and STEM courses',
    features: [
      'Everything in Explorer, plus:',
      'Advanced AI models (Claude Sonnet, GPT-4 Turbo)',
      'Complex topic support (calculus, organic chemistry)',
      'Personalized quizzes based on past weaknesses',
      'Enhanced question complexity & reasoning',
      'Priority quiz generation',
      'Advanced progress analytics'
    ],
    limits: {
      quizzesPerDay: 100,
      questionsPerQuiz: 25,
      historyRetention: 180, // days
      aiModel: 'claude-sonnet',
      personalizedQuizzes: true
    },
    targetUsers: ['STEM students', 'College prep', 'Serious learners']
  },
  
  MASTERMIND: {
    id: 'mastermind',
    name: 'The Mastermind',
    subtitle: 'Powered by Claude Opus & GPT-4',
    emoji: '🥇',
    price: 9.99,
    color: '#FFD700', // Gold color
    ideal: 'For advanced learners and graduate-level prep',
    features: [
      'Everything in Scholar, plus:',
      'Most advanced AI models (Claude Opus, GPT-4)',
      'Highly challenging quizzes (quantum mechanics, advanced logic)',
      'Premium step-by-step explanations',
      'Goal-based study planning',
      'Smart notification scheduling',
      'Advanced weakness analysis',
      'Priority support'
    ],
    limits: {
      quizzesPerDay: 200,
      questionsPerQuiz: 50,
      historyRetention: 365, // days
      aiModel: 'claude-opus',
      personalizedQuizzes: true,
      advancedExplanations: true,
      goalBasedPlanning: true
    },
    targetUsers: ['Graduate students', 'Pre-med', 'Advanced researchers']
  }
};

// Helper function to get tier by price for backwards compatibility
export const getTierByPrice = (price) => {
  if (price <= 0) return SUBSCRIPTION_TIERS.EXPLORER;
  if (price <= 2.99) return SUBSCRIPTION_TIERS.EXPLORER;
  if (price <= 5.99) return SUBSCRIPTION_TIERS.SCHOLAR;
  return SUBSCRIPTION_TIERS.MASTERMIND;
};

// Helper function to get AI model for tier
export const getAIModelForTier = (tierName) => {
  switch (tierName.toLowerCase()) {
    case 'explorer':
      return 'gpt-3.5-turbo';
    case 'scholar':
      return 'claude-sonnet';
    case 'mastermind':
      return 'claude-opus';
    default:
      return 'gpt-3.5-turbo';
  }
};

export class SubscriptionManager {
  // ✅ MODIFIED: Remove tier restrictions - give everyone full access
  static async checkFeatureAccess(userId, feature) {
    try {
      // Return true for all features - no restrictions
      logger.info(`✅ Feature access granted: ${feature} for user ${userId}`);
      return {
        hasAccess: true,
        tier: 'unlimited',
        reason: 'General access mode - all features available'
      };
    } catch (error) {
      logger.error(`Error checking feature access: ${error}`);
      // Default to allowing access even on error
      return {
        hasAccess: true,
        tier: 'unlimited',
        reason: 'Default access granted'
      };
    }
  }

  // ✅ MODIFIED: Remove usage limits
  static async checkUsageLimit(userId, action) {
    try {
      // Always allow usage - no limits
      return {
        allowed: true,
        remaining: 999,
        resetDate: null,
        tier: 'unlimited'
      };
    } catch (error) {
      logger.error(`Error checking usage limit: ${error}`);
      return {
        allowed: true,
        remaining: 999,
        resetDate: null,
        tier: 'unlimited'
      };
    }
  }

  // ✅ MODIFIED: Return unlimited tier for all users
  static async getUserTier(userId) {
    try {
      return SUBSCRIPTION_TIERS.MASTERMIND; // Give everyone the highest tier
    } catch (error) {
      logger.error(`Error getting user tier: ${error}`);
      return SUBSCRIPTION_TIERS.MASTERMIND; // Default to highest tier
    }
  }

  // ✅ MODIFIED: Always return active subscription
  static async hasActiveSubscription(userId) {
    return true; // Everyone has an "active" subscription
  }

  constructor() {
    this.currentTier = SUBSCRIPTION_TIERS.EXPLORER;
    this.subscriptionStatus = 'inactive';
    this.dailyQuizCount = 0;
    this.lastQuizDate = null;
    this.userId = null; // ✅ Add userId to the class
  }

  async initialize(userId) {
    try {
      this.userId = userId; // ✅ Store the userId
      if (!this.userId) return; // ✅ Guard against no user

      // Initialize RevenueCat first
      await revenueCatService.initialize(userId);
      
      // Set up subscription update listener
      revenueCatService.setSubscriptionUpdateCallback((customerInfo) => {
        this.updateTierFromRevenueCat(customerInfo);
      });

      // Get current tier from RevenueCat
      await this.refreshFromRevenueCat();

      // ✅ Load user-specific daily count
      const savedCount = await AsyncStorage.getItem(`daily_quiz_count_${this.userId}`);
      const savedDate = await AsyncStorage.getItem(`last_quiz_date_${this.userId}`);
      this.dailyQuizCount = savedCount ? parseInt(savedCount, 10) : 0;
      this.lastQuizDate = savedDate || new Date().toDateString();

      // Reset daily count if needed
      await this.resetDailyCountIfNeeded();
    } catch (error) {
      logger.error('Error initializing SubscriptionManager:', error);
      
      // Fallback to saved data if RevenueCat fails
      if (this.userId) {
        const savedTier = await AsyncStorage.getItem(`subscription_tier_${this.userId}`);
        if (savedTier && SUBSCRIPTION_TIERS[savedTier.toUpperCase()]) {
          this.currentTier = SUBSCRIPTION_TIERS[savedTier.toUpperCase()];
        }
      }
    }
  }

  async refreshFromRevenueCat() {
    try {
      if (!this.userId) return; // ✅ Guard against no user
      await revenueCatService.refreshCustomerInfo();
      const tierName = revenueCatService.getCurrentTier();
      
      if (SUBSCRIPTION_TIERS[tierName.toUpperCase()]) {
        this.currentTier = SUBSCRIPTION_TIERS[tierName.toUpperCase()];
        this.subscriptionStatus = revenueCatService.hasActiveSubscription() ? 'active' : 'inactive';
        
        // Save locally for offline access
        await AsyncStorage.setItem(`subscription_tier_${this.userId}`, tierName);
        await AsyncStorage.setItem(`subscription_status_${this.userId}`, this.subscriptionStatus);
      }
    } catch (error) {
      logger.error('Error refreshing from RevenueCat:', error);
    }
  }

  updateTierFromRevenueCat(customerInfo) {
    if (!this.userId) return; // ✅ Guard against no user
    const tierName = revenueCatService.getCurrentTier();
    
    if (SUBSCRIPTION_TIERS[tierName.toUpperCase()]) {
      this.currentTier = SUBSCRIPTION_TIERS[tierName.toUpperCase()];
      this.subscriptionStatus = revenueCatService.hasActiveSubscription() ? 'active' : 'inactive';
      
      // Save locally
      AsyncStorage.setItem(`subscription_tier_${this.userId}`, tierName);
      AsyncStorage.setItem(`subscription_status_${this.userId}`, this.subscriptionStatus);
      
      // Notify app about subscription change
      logger.info('Subscription updated:', tierName);
    }
  }

  async resetDailyCountIfNeeded() {
    if (!this.userId) return; // ✅ Guard against no user
    const today = new Date().toDateString();
    if (this.lastQuizDate !== today) {
      this.dailyQuizCount = 0;
      this.lastQuizDate = today;
      await AsyncStorage.setItem(`daily_quiz_count_${this.userId}`, '0');
      await AsyncStorage.setItem(`last_quiz_date_${this.userId}`, today);
    }
  }

  async incrementDailyQuizCount() {
    if (!this.userId) return; // ✅ Guard against no user
    await this.resetDailyCountIfNeeded();
    this.dailyQuizCount += 1;
    await AsyncStorage.setItem(`daily_quiz_count_${this.userId}`, this.dailyQuizCount.toString());
  }

  canTakeQuiz() {
    const limit = this.currentTier.limits.dailyQuizzes;
    return limit === -1 || this.dailyQuizCount < limit;
  }

  getRemainingQuizzes() {
    const limit = this.currentTier.limits.dailyQuizzes;
    if (limit === -1) return 'Unlimited';
    return Math.max(0, limit - this.dailyQuizCount);
  }

  canSaveQuiz(currentSavedCount) {
    const limit = this.currentTier.limits.savedQuizzes;
    return limit === -1 || currentSavedCount < limit;
  }

  canShareQuiz() {
    return this.currentTier.limits.quizSharing;
  }

  canAccessAIExplanations() {
    return this.currentTier.limits.aiExplanations;
  }

  getAIModel() {
    return this.currentTier.limits.aiModel;
  }

  canAccessComplexQuizzes() {
    return this.currentTier.limits.complexQuizzes;
  }

  canAccessWeeklyInsights() {
    return this.currentTier.limits.weeklyInsights;
  }

  canAccessSpacedRepetition() {
    return this.currentTier.limits.spacedRepetition;
  }

  hasStreakBoosters() {
    return this.currentTier.limits.streakBoosters;
  }

  hasPriorityGeneration() {
    return this.currentTier.limits.priorityGeneration;
  }

  async upgradeTier(tierId) {
    try {
      if (!this.userId) { // ✅ Guard against no user
        return { success: false, error: 'User not logged in' };
      }
      const tier = Object.values(SUBSCRIPTION_TIERS).find(t => t.id === tierId);
      if (!tier || tier.price === 0) {
        return { success: false, error: 'Invalid tier for upgrade' };
      }

      // Purchase through RevenueCat
      const purchaseResult = await revenueCatService.purchaseSubscription(tier.productId);
      
      if (purchaseResult.success) {
        // Update local tier
        this.currentTier = tier;
        this.subscriptionStatus = 'active';
        
        await AsyncStorage.setItem(`subscription_tier_${this.userId}`, tier.id);
        await AsyncStorage.setItem(`subscription_status_${this.userId}`, 'active');
        
        return { 
          success: true, 
          tier,
          customerInfo: purchaseResult.customerInfo 
        };
      } else {
        return { 
          success: false, 
          error: purchaseResult.error,
          cancelled: purchaseResult.cancelled 
        };
      }
    } catch (error) {
      logger.error('Error upgrading tier:', error);
      return { success: false, error: error.message };
    }
  }

  async restorePurchases() {
    try {
      const result = await revenueCatService.restorePurchases();
      
      if (result.success && result.hasActiveSubscription) {
        await this.refreshFromRevenueCat();
        return { 
          success: true, 
          hasActiveSubscription: true,
          tier: this.currentTier 
        };
      }
      
      return { 
        success: true, 
        hasActiveSubscription: false 
      };
    } catch (error) {
      logger.error('Error restoring purchases:', error);
      return { success: false, error: error.message };
    }
  }

  // Check specific entitlements using RevenueCat
  canShareQuiz() {
    return revenueCatService.hasEntitlement(ENTITLEMENTS.SCHOLAR) || 
           revenueCatService.hasEntitlement(ENTITLEMENTS.MASTERMIND);
  }

  canAccessAIExplanations() {
    return revenueCatService.hasEntitlement(ENTITLEMENTS.SCHOLAR) || 
           revenueCatService.hasEntitlement(ENTITLEMENTS.MASTERMIND);
  }

  canAccessComplexQuizzes() {
    return revenueCatService.hasEntitlement(ENTITLEMENTS.MASTERMIND);
  }

  canAccessWeeklyInsights() {
    return revenueCatService.hasEntitlement(ENTITLEMENTS.MASTERMIND);
  }

  canAccessSpacedRepetition() {
    return revenueCatService.hasEntitlement(ENTITLEMENTS.MASTERMIND);
  }

  hasStreakBoosters() {
    return revenueCatService.hasEntitlement(ENTITLEMENTS.SCHOLAR) || 
           revenueCatService.hasEntitlement(ENTITLEMENTS.MASTERMIND);
  }

  hasPriorityGeneration() {
    return revenueCatService.hasEntitlement(ENTITLEMENTS.MASTERMIND);
  }

  // Get subscription management URL
  async getManagementURL() {
    return await revenueCatService.getManagementURL();
  }

  // Check if user is in trial period
  isInTrialPeriod() {
    return revenueCatService.isInTrialPeriod();
  }

  getTrialExpirationDate() {
    return revenueCatService.getTrialExpirationDate();
  }

  getSubscriptionExpirationDate() {
    return revenueCatService.getSubscriptionExpirationDate();
  }

  getCurrentTier() {
    return this.currentTier;
  }

  getSubscriptionStatus() {
    return this.subscriptionStatus;
  }

  // Usage checking methods with user-friendly messages
  checkQuizAccess() {
    if (!this.canTakeQuiz()) {
      return {
        allowed: false,
        message: `You've reached your daily limit of ${this.currentTier.limits.dailyQuizzes} quizzes. Upgrade to Scholar for unlimited quizzes!`,
        upgradeRequired: 'scholar'
      };
    }
    return { allowed: true };
  }

  checkFeatureAccess(feature) {
    const featureMap = {
      'quiz_sharing': {
        check: () => this.canShareQuiz(),
        message: 'Quiz sharing is available with Scholar plan and above.',
        upgradeRequired: 'scholar'
      },
      'ai_explanations': {
        check: () => this.canAccessAIExplanations(),
        message: 'AI-powered explanations are available with Scholar plan and above.',
        upgradeRequired: 'scholar'
      },
      'complex_quizzes': {
        check: () => this.canAccessComplexQuizzes(),
        message: 'Advanced quiz formats are available with Mastermind plan.',
        upgradeRequired: 'mastermind'
      },
      'weekly_insights': {
        check: () => this.canAccessWeeklyInsights(),
        message: 'Weekly insights and prep plans are available with Mastermind plan.',
        upgradeRequired: 'mastermind'
      },
      'spaced_repetition': {
        check: () => this.canAccessSpacedRepetition(),
        message: 'Smart review system is available with Mastermind plan.',
        upgradeRequired: 'mastermind'
      }
    };

    const featureConfig = featureMap[feature];
    if (!featureConfig) {
      return { allowed: false, message: 'Unknown feature' };
    }

    if (!featureConfig.check()) {
      return {
        allowed: false,
        message: featureConfig.message,
        upgradeRequired: featureConfig.upgradeRequired
      };
    }

    return { allowed: true };
  }

  // Show upgrade prompt
  showUpgradePrompt(requiredTier, context = '') {
    const tier = Object.values(SUBSCRIPTION_TIERS).find(t => t.id === requiredTier);
    if (!tier) return;

    const contextMessage = context ? `\n\n${context}` : '';
    
    Alert.alert(
      `Upgrade to ${tier.name}`,
      `${tier.ideal}\n\nPrice: $${tier.price}/month${contextMessage}`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'View Plans', 
          onPress: () => {
            // Navigate to subscription screen
            // This would be handled by your navigation system
            logger.info('Navigate to subscription screen');
          }
        }
      ]
    );
  }
}


// Export singleton instance
export default new SubscriptionManager();