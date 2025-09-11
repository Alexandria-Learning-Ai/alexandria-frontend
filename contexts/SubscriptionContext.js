// contexts/SubscriptionContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Alert } from 'react-native';
import { revenueCatService } from '../services/RevenueCatService';
import SubscriptionManager, { SUBSCRIPTION_TIERS } from '../services/SubscriptionManager';
import logger from '../utils/logger';


// Initial state
const initialState = {
  currentTier: SUBSCRIPTION_TIERS.EXPLORER,
  hasActiveSubscription: false,
  isLoading: true,
  dailyQuizCount: 0,
  subscriptionExpiry: null,
  isInTrial: false,
  trialExpiry: null,
  customerInfo: null,
  error: null
};

// Action types
const SUBSCRIPTION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SUBSCRIPTION_DATA: 'SET_SUBSCRIPTION_DATA',
  UPDATE_DAILY_COUNT: 'UPDATE_DAILY_COUNT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
function subscriptionReducer(state, action) {
  switch (action.type) {
    case SUBSCRIPTION_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case SUBSCRIPTION_ACTIONS.SET_SUBSCRIPTION_DATA:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null
      };

    case SUBSCRIPTION_ACTIONS.UPDATE_DAILY_COUNT:
      return {
        ...state,
        dailyQuizCount: action.payload
      };

    case SUBSCRIPTION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case SUBSCRIPTION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case SUBSCRIPTION_ACTIONS.RESET_STATE:
      return {
        ...initialState,
        isLoading: false
      };

    default:
      return state;
  }
}

// Create context
const SubscriptionContext = createContext();

// Provider component
export function SubscriptionProvider({ children, userId }) {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);

  useEffect(() => {
    if (userId) {
      initializeSubscriptions(userId);
    } else {
      dispatch({ type: SUBSCRIPTION_ACTIONS.RESET_STATE });
    }
  }, [userId]);

  const initializeSubscriptions = async (userId) => {
    try {
      dispatch({ type: SUBSCRIPTION_ACTIONS.SET_LOADING, payload: true });

      // Initialize RevenueCat and SubscriptionManager
      await revenueCatService.initialize(userId);
      await SubscriptionManager.initialize(userId);

      // Set up subscription update listener
      revenueCatService.setSubscriptionUpdateCallback((customerInfo) => {
        updateSubscriptionState(customerInfo);
      });

      // Get initial subscription state
      await refreshSubscriptionState();

    } catch (error) {
      logger.error('Error initializing subscriptions:', error);
      dispatch({ 
        type: SUBSCRIPTION_ACTIONS.SET_ERROR, 
        payload: 'Failed to initialize subscription system' 
      });
    }
  };

  const refreshSubscriptionState = async () => {
    try {
      await SubscriptionManager.refreshFromRevenueCat();
      const customerInfo = await revenueCatService.refreshCustomerInfo();
      
      updateSubscriptionState(customerInfo);
    } catch (error) {
      logger.error('Error refreshing subscription state:', error);
      dispatch({ 
        type: SUBSCRIPTION_ACTIONS.SET_ERROR, 
        payload: 'Failed to refresh subscription status' 
      });
    }
  };

  const updateSubscriptionState = (customerInfo = null) => {
    try {
      const currentTier = SubscriptionManager.getCurrentTier();
      const hasActiveSubscription = revenueCatService.hasActiveSubscription();
      const subscriptionExpiry = revenueCatService.getSubscriptionExpirationDate();
      const isInTrial = revenueCatService.isInTrialPeriod();
      const trialExpiry = revenueCatService.getTrialExpirationDate();
      const dailyQuizCount = SubscriptionManager.dailyQuizCount;

      dispatch({
        type: SUBSCRIPTION_ACTIONS.SET_SUBSCRIPTION_DATA,
        payload: {
          currentTier,
          hasActiveSubscription,
          subscriptionExpiry,
          isInTrial,
          trialExpiry,
          dailyQuizCount,
          customerInfo: customerInfo || revenueCatService.customerInfo
        }
      });

    } catch (error) {
      logger.error('Error updating subscription state:', error);
      dispatch({ 
        type: SUBSCRIPTION_ACTIONS.SET_ERROR, 
        payload: 'Failed to update subscription status' 
      });
    }
  };

  const purchaseSubscription = async (tierId) => {
    try {
      dispatch({ type: SUBSCRIPTION_ACTIONS.SET_LOADING, payload: true });
      
      const result = await SubscriptionManager.upgradeTier(tierId);
      
      if (result.success) {
        // Subscription state will be updated via the RevenueCat callback
        return { success: true };
      } else {
        return { success: false, error: result.error, cancelled: result.cancelled };
      }
    } catch (error) {
      logger.error('Error purchasing subscription:', error);
      dispatch({ 
        type: SUBSCRIPTION_ACTIONS.SET_ERROR, 
        payload: 'Purchase failed. Please try again.' 
      });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: SUBSCRIPTION_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const restorePurchases = async () => {
    try {
      dispatch({ type: SUBSCRIPTION_ACTIONS.SET_LOADING, payload: true });
      
      const result = await SubscriptionManager.restorePurchases();
      
      if (result.success && result.hasActiveSubscription) {
        // State will be updated via callback
        return { success: true, restored: true };
      } else if (result.success) {
        return { success: true, restored: false };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error restoring purchases:', error);
      dispatch({ 
        type: SUBSCRIPTION_ACTIONS.SET_ERROR, 
        payload: 'Failed to restore purchases' 
      });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: SUBSCRIPTION_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const incrementDailyQuizCount = async () => {
    try {
      await SubscriptionManager.incrementDailyQuizCount();
      dispatch({ 
        type: SUBSCRIPTION_ACTIONS.UPDATE_DAILY_COUNT, 
        payload: SubscriptionManager.dailyQuizCount 
      });
    } catch (error) {
      logger.error('Error incrementing daily quiz count:', error);
    }
  };

  const checkFeatureAccess = (feature) => {
    return SubscriptionManager.checkFeatureAccess(feature);
  };

  const checkQuizAccess = () => {
    return SubscriptionManager.checkQuizAccess();
  };

  const showUpgradePrompt = (requiredTier, context = '') => {
    SubscriptionManager.showUpgradePrompt(requiredTier, context);
  };

  const clearError = () => {
    dispatch({ type: SUBSCRIPTION_ACTIONS.CLEAR_ERROR });
  };

  const getSubscriptionManagementURL = async () => {
    try {
      return await SubscriptionManager.getManagementURL();
    } catch (error) {
      logger.error('Error getting management URL:', error);
      return null;
    }
  };

  // Helper functions for common subscription checks
  const canTakeQuiz = () => {
    const access = checkQuizAccess();
    return access.allowed;
  };

  const getRemainingQuizzes = () => {
    return SubscriptionManager.getRemainingQuizzes();
  };

  const canAccessFeature = (feature) => {
    const access = checkFeatureAccess(feature);
    return access.allowed;
  };

  const getFeatureName = (feature) => {
    const featureNames = {
      'quiz_sharing': 'Quiz Sharing',
      'ai_explanations': 'AI Explanations',
      'complex_quizzes': 'Advanced Quiz Formats',
      'weekly_insights': 'Weekly Insights',
      'spaced_repetition': 'Smart Review System'
    };
    return featureNames[feature] || feature;
  };

  const value = {
    // State
    ...state,
    
    // Actions
    refreshSubscriptionState,
    purchaseSubscription,
    restorePurchases,
    incrementDailyQuizCount,
    clearError,
    
    // Feature checks
    checkFeatureAccess,
    checkQuizAccess,
    showUpgradePrompt,
    canTakeQuiz,
    getRemainingQuizzes,
    canAccessFeature,
    getFeatureName,
    
    // Utilities
    getSubscriptionManagementURL,
    
    // Subscription info helpers
    isExplorer: state.currentTier?.id === 'explorer',
    isScholar: state.currentTier?.id === 'scholar',
    isMastermind: state.currentTier?.id === 'mastermind',
    isPremium: state.hasActiveSubscription,
    
    // Trial helpers
    isTrialActive: state.isInTrial,
    trialDaysRemaining: state.trialExpiry 
      ? Math.max(0, Math.ceil((state.trialExpiry - new Date()) / (1000 * 60 * 60 * 24)))
      : 0,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Custom hook to use subscription context
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
}

// HOC for components that need subscription context
export function withSubscription(Component) {
  return function WrappedComponent(props) {
    const subscription = useSubscription();
    return <Component {...props} subscription={subscription} />;
  };
}

export { SubscriptionContext };