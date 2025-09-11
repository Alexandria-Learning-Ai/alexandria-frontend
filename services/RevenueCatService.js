// RevenueCatService.js
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import logger from '../utils/logger';


// RevenueCat Product IDs (must match your RevenueCat dashboard)
export const REVENUECAT_PRODUCTS = {
  EXPLORER_MONTHLY: {
    ios: 'alexandria_explorer_monthly',
    android: 'alexandria_explorer_monthly',
  },
  SCHOLAR_MONTHLY: {
    ios: 'alexandria_scholar_monthly',
    android: 'alexandria_scholar_monthly',
  },
  MASTERMIND_MONTHLY: {
    ios: 'alexandria_mastermind_monthly',
    android: 'alexandria_mastermind_monthly',
  }
}

// Entitlement IDs (defined in RevenueCat dashboard)
export const ENTITLEMENTS = {
  EXPLORER: 'explorer_features',
  SCHOLAR: 'scholar_features',
  MASTERMIND: 'mastermind_features'
};

class RevenueCatService {
  constructor() {
    this.isInitialized = false;
    this.customerInfo = null;
    this.offerings = null;
    this.userId = null; // ✅ Add userId property
  }

  // Initialize RevenueCat
  async initialize(userId) {
    try {
      if (this.isInitialized) return;
      this.userId = userId; // ✅ Store userId

      // Configure RevenueCat
      if (Platform.OS === 'ios') {
        await Purchases.configure({
          apiKey: 'appl_your_ios_api_key', // Replace with your iOS API key
          appUserID: userId,
          observerMode: false,
          userDefaultsSuiteName: null,
          useAmazon: false,
        });
      } else {
        await Purchases.configure({
          apiKey: 'goog_your_android_api_key', // Replace with your Android API key
          appUserID: userId,
          observerMode: false,
          useAmazon: false,
        });
      }

      // Set user attributes
      await Purchases.setAttributes({
        platform: Platform.OS,
        app_version: '1.0.0', // Replace with your app version
      });

      // Get initial customer info
      await this.refreshCustomerInfo();
      
      // Get available offerings
      await this.loadOfferings();

      this.isInitialized = true;
      logger.info('RevenueCat initialized successfully');

    } catch (error) {
      logger.error('Error initializing RevenueCat:', error);
      throw error;
    }
  }

  // Refresh customer info from RevenueCat
  async refreshCustomerInfo() {
    try {
      if (!this.userId) return; // ✅ Guard against no user
      this.customerInfo = await Purchases.getCustomerInfo();
      
      // Save customer info locally for offline access
      await AsyncStorage.setItem(`revenuecat_customer_info_${this.userId}`, JSON.stringify(this.customerInfo));
      
      return this.customerInfo;
    } catch (error) {
      logger.error('Error refreshing customer info:', error);
      
      // Try to load from local storage if network fails
      if (!this.userId) return null;
      const savedInfo = await AsyncStorage.getItem(`revenuecat_customer_info_${this.userId}`);
      if (savedInfo) {
        this.customerInfo = JSON.parse(savedInfo);
      }
      
      return this.customerInfo;
    }
  }

  // Load available offerings from RevenueCat
  async loadOfferings() {
    try {
      this.offerings = await Purchases.getOfferings();
      return this.offerings;
    } catch (error) {
      logger.error('Error loading offerings:', error);
      throw error;
    }
  }

  // Get current subscription tier based on entitlements
  getCurrentTier() {
    if (!this.customerInfo) return 'explorer';

    const entitlements = this.customerInfo.entitlements.active;

    if (entitlements[ENTITLEMENTS.MASTERMIND]) {
      return 'mastermind';
    } else if (entitlements[ENTITLEMENTS.SCHOLAR]) {
      return 'scholar';
    }

    return 'explorer';
  }

  // Check if user has active subscription
  hasActiveSubscription() {
    if (!this.customerInfo) return false;
    
    const activeEntitlements = this.customerInfo.entitlements.active;
    return Object.keys(activeEntitlements).length > 0;
  }

  // Get subscription expiration date
  getSubscriptionExpirationDate() {
    if (!this.customerInfo) return null;

    const entitlements = this.customerInfo.entitlements.active;
    const activeEntitlement = entitlements[ENTITLEMENTS.MASTERMIND] || entitlements[ENTITLEMENTS.SCHOLAR];

    return activeEntitlement ? new Date(activeEntitlement.expirationDate) : null;
  }

  // Purchase a subscription
  async purchaseSubscription(productId) {
    try {
      if (!this.offerings) {
        await this.loadOfferings();
      }

      // Find the product in offerings
      let pkgToPurchase = null;
      
      for (const offering of Object.values(this.offerings.all)) {
        for (const pkg of offering.availablepkgs) {
          if (pkg.product.identifier === productId) {
            packageToPurchase = pkg;
            break;
          }
        }
        if (packageToPurchase) break;
      }

      if (!packageToPurchase) {
        throw new Error(`Product ${productId} not found in offerings`);
      }

      // Make the purchase
      const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
      
      // Update customer info
      this.customerInfo = purchaseResult.customerInfo;
      if (this.userId) {
        await AsyncStorage.setItem(`revenuecat_customer_info_${this.userId}`, JSON.stringify(this.customerInfo));
      }

      return {
        success: true,
        customerInfo: purchaseResult.customerInfo,
        transaction: purchaseResult.transaction,
      };

    } catch (error) {
      if (error.userCancelled) {
        return {
          success: false,
          cancelled: true,
          error: 'Purchase cancelled by user'
        };
      }

      logger.error('Purchase error:', error);
      return {
        success: false,
        cancelled: false,
        error: error.message || 'Purchase failed'
      };
    }
  }

  // Restore purchases
  async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      if (this.userId) {
        await AsyncStorage.setItem(`revenuecat_customer_info_${this.userId}`, JSON.stringify(customerInfo));
      }

      return {
        success: true,
        customerInfo,
        hasActiveSubscription: this.hasActiveSubscription()
      };

    } catch (error) {
      logger.error('Error restoring purchases:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get product information
  async getProductInfo(productId) {
    try {
      if (!this.offerings) {
        await this.loadOfferings();
      }

      for (const offering of Object.values(this.offerings.all)) {
        for (const pgk of offering.availablePackages) {
          if (pgk.product.identifier === productId) {
            return {
              identifier: pgk.product.identifier,
              description: pgk.product.description,
              title: pgk.product.title,
              price: pgk.product.priceString,
              priceAmount: pgk.product.price,
              currencyCode: pgk.product.currencyCode,
              introPrice: pgk.product.introPrice,
            };
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting product info:', error);
      return null;
    }
  }

  // Check specific entitlement
  hasEntitlement(entitlementId) {
    if (!this.customerInfo) return false;
    
    const entitlement = this.customerInfo.entitlements.active[entitlementId];
    return entitlement && entitlement.isActive;
  }

  // Get all active entitlements
  getActiveEntitlements() {
    if (!this.customerInfo) return {};
    return this.customerInfo.entitlements.active;
  }

  // Cancel subscription (directs to platform settings)
  async cancelSubscription() {
    try {
      // RevenueCat doesn't directly cancel subscriptions
      // Users must cancel through App Store/Google Play
      Alert.alert(
        'Cancel Subscription',
        Platform.OS === 'ios' 
          ? 'To cancel your subscription, go to Settings > Apple ID > Subscriptions on your device.'
          : 'To cancel your subscription, go to Google Play Store > Subscriptions.',
        [
          { text: 'OK' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Purchases.showManagementURL();
              } else {
                // For Android, you might want to use a linking library
                // Linking.openURL('https://play.google.com/store/account/subscriptions');
              }
            }
          }
        ]
      );

      return { success: true };
    } catch (error) {
      logger.error('Error handling cancellation:', error);
      return { success: false, error: error.message };
    }
  }

  // Get subscription management URL
  async getManagementURL() {
    try {
      const url = await Purchases.getManagementURL();
      return url;
    } catch (error) {
      logger.error('Error getting management URL:', error);
      return null;
    }
  }

  // Set user attributes for analytics
  async setUserAttributes(attributes) {
    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      logger.error('Error setting user attributes:', error);
    }
  }

  // Log event for analytics
  async logEvent(event, parameters = {}) {
    try {
      // RevenueCat doesn't have direct event logging
      // You might want to integrate with your analytics service here
      logger.info('RevenueCat Event:', event, parameters);
      
      // Example: Send to your analytics service
      // analytics.track(event, parameters);
    } catch (error) {
      logger.error('Error logging event:', error);
    }
  }

  // Get offering for specific tier
  getOfferingForTier(tierName) {
    if (!this.offerings) return null;

    const offeringMap = {
      'scholar': 'scholar_offering', // Replace with your offering ID
      'mastermind': 'mastermind_offering' // Replace with your offering ID
    };

    const offeringId = offeringMap[tierName];
    return offeringId ? this.offerings.all[offeringId] : null;
  }

  // Get all available packages
  getAllPackages() {
    if (!this.offerings) return [];

    const packages = [];
    for (const offering of Object.values(this.offerings.all)) {
      packages.push(...offering.availablePackages);
    }

    return packages;
  }

  // Check if user is in trial period
  isInTrialPeriod() {
    if (!this.customerInfo) return false;

    const entitlements = this.customerInfo.entitlements.active;
    for (const entitlement of Object.values(entitlements)) {
      if (entitlement.periodType === 'TRIAL') {
        return true;
      }
    }

    return false;
  }

  // Get trial expiration date
  getTrialExpirationDate() {
    if (!this.customerInfo) return null;

    const entitlements = this.customerInfo.entitlements.active;
    for (const entitlement of Object.values(entitlements)) {
      if (entitlement.periodType === 'TRIAL') {
        return new Date(entitlement.expirationDate);
      }
    }

    return null;
  }

  // Handle purchase updates (set up listener)
  setupPurchaseUpdateListener() {
    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      this.customerInfo = customerInfo;
      if (this.userId) {
        AsyncStorage.setItem(`revenuecat_customer_info_${this.userId}`, JSON.stringify(customerInfo));
      }
      
      // Notify your app about subscription changes
      this.onSubscriptionUpdate?.(customerInfo);
    });
  }

  // Set callback for subscription updates
  setSubscriptionUpdateCallback(callback) {
    this.onSubscriptionUpdate = callback;
  }

  // ✅ TESTING MODE: Skip all subscription checks
  async checkSubscriptionStatus(userId) {
    return {
      isSubscribed: true,
      tier: 'mastermind',
      expirationDate: null,
      features: ['unlimited_quizzes', 'advanced_ai', 'all_features'],
      status: 'active'
    };
  }

  async getActiveEntitlements(userId) {
    return {
      mastermind_features: { isActive: true, tier: 'mastermind' }
    };
  }
}

// Usage tracking integrated with RevenueCat
export class RevenueCatUsageTracker {
  constructor(revenueCatService) {
    this.revenueCatService = revenueCatService;
    this.userId = null; // ✅ Add userId property
    this.monthlyUsage = {
      quizzesGenerated: 0,
      aiQueriesUsed: 0,
      explanationsGenerated: 0,
      lastResetDate: new Date().toISOString()
    };
  }

  async initialize(userId) { // ✅ Accept userId
    try {
      this.userId = userId; // ✅ Store userId
      if (!this.userId) return; // ✅ Guard against no user

      const savedUsage = await AsyncStorage.getItem(`monthly_usage_${this.userId}`);
      if (savedUsage) {
        this.monthlyUsage = JSON.parse(savedUsage);
        await this.resetIfNewMonth();
      }

      // Send usage data to RevenueCat as attributes
      await this.syncUsageToRevenueCat();
    } catch (error) {
      logger.error('Error initializing usage tracker:', error);
    }
  }

  async resetIfNewMonth() {
    const lastReset = new Date(this.monthlyUsage.lastResetDate);
    const now = new Date();
    
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      this.monthlyUsage = {
        quizzesGenerated: 0,
        aiQueriesUsed: 0,
        explanationsGenerated: 0,
        lastResetDate: now.toISOString()
      };
      await this.saveUsage();
      await this.syncUsageToRevenueCat();
    }
  }

  async trackQuizGeneration() {
    this.monthlyUsage.quizzesGenerated += 1;
    await this.saveUsage();
    
    // Send usage event to RevenueCat
    await this.revenueCatService.logEvent('quiz_generated', {
      monthly_total: this.monthlyUsage.quizzesGenerated
    });
  }

  async trackAIQuery() {
    this.monthlyUsage.aiQueriesUsed += 1;
    await this.saveUsage();
    
    await this.revenueCatService.logEvent('ai_query_used', {
      monthly_total: this.monthlyUsage.aiQueriesUsed
    });
  }

  async trackExplanation() {
    this.monthlyUsage.explanationsGenerated += 1;
    await this.saveUsage();
    
    await this.revenueCatService.logEvent('explanation_generated', {
      monthly_total: this.monthlyUsage.explanationsGenerated
    });
  }

  async saveUsage() {
    try {
      if (!this.userId) return; // ✅ Guard against no user
      await AsyncStorage.setItem(`monthly_usage_${this.userId}`, JSON.stringify(this.monthlyUsage));
    } catch (error) {
      logger.error('Error saving usage data:', error);
    }
  }

  async syncUsageToRevenueCat() {
    try {
      await this.revenueCatService.setUserAttributes({
        monthly_quizzes: this.monthlyUsage.quizzesGenerated.toString(),
        monthly_ai_queries: this.monthlyUsage.aiQueriesUsed.toString(),
        monthly_explanations: this.monthlyUsage.explanationsGenerated.toString(),
        last_usage_sync: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error syncing usage to RevenueCat:', error);
    }
  }

  getUsage() {
    return this.monthlyUsage;
  }
}

// Helper function to get platform-specific product ID
export const getProductId = (tier, platform = Platform.OS) => {
  const productMap = {
    scholar: REVENUECAT_PRODUCTS.SCHOLAR_MONTHLY,
    mastermind: REVENUECAT_PRODUCTS.MASTERMIND_MONTHLY
  };

  return productMap[tier]?.[platform] || null;
};

// Export singleton instance
export const revenueCatService = new RevenueCatService();
export const usageTracker = new RevenueCatUsageTracker(revenueCatService);

export default RevenueCatService;

// ✅ FIXED: Complete product IDs object with all three tiers
const PRODUCT_IDS = {
  EXPLORER_MONTHLY: 'alexandria_explorer_monthly',     // $2.99
  SCHOLAR_MONTHLY: 'alexandria_scholar_monthly',       // $5.99
  MASTERMIND_MONTHLY: 'alexandria_mastermind_monthly'  // $9.99
};

// Direct access
const hasAccess = true; // Everyone has access