import logger from '../utils/logger';
/**
 * NavigationHelper - Utility functions for safe navigation throughout the app
 */

export class NavigationHelper {
  /**
   * Safely navigate back with fallback options
   * @param {Object} navigation - React Navigation object
   * @param {string} fallbackScreen - Screen to navigate to if goBack fails
   * @param {Object} resetOptions - Options for reset navigation if needed
   */
  static safeGoBack(navigation, fallbackScreen = 'Home', resetOptions = null) {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      } else {
        logger.info(`⚠️ Cannot go back, trying fallback navigation to: ${fallbackScreen}`);
        
        // Try to navigate to fallback screen
        const fallbackSuccess = this.navigateWithFallback(navigation, fallbackScreen, resetOptions);
        
        if (!fallbackSuccess) {
          logger.info(`⚠️ Fallback to ${fallbackScreen} failed, trying Home screen`);
          
          // If fallback fails and it wasn't Home, try Home
          if (fallbackScreen !== 'Home') {
            const homeSuccess = this.navigateWithFallback(navigation, 'Home', resetOptions);
            if (!homeSuccess) {
              logger.info('⚠️ Home navigation also failed, staying on current screen');
              return false;
            }
          } else {
            logger.info('⚠️ Home navigation failed, staying on current screen');
            return false;
          }
        }
        
        return true;
      }
    } catch (error) {
      logger.error('❌ Navigation error in safeGoBack:', error);
      return false;
    }
  }

  /**
   * Navigate to a screen with fallback to reset if the screen doesn't exist
   * @param {Object} navigation - React Navigation object
   * @param {string} screenName - Target screen name
   * @param {Object} params - Navigation parameters
   * @param {Object} resetOptions - Options for reset if navigation fails
   */
  static navigateWithFallback(navigation, screenName, resetOptions = null, params = {}) {
    try {
      // First, try to navigate directly - let React Navigation handle route resolution
      try {
        navigation.navigate(screenName, params);
        return true;
      } catch (navigateError) {
        // Only check screen existence if direct navigation fails
        logger.info(`⚠️ Direct navigation to ${screenName} failed, checking screen availability`);
        
        const state = navigation.getState();
        const hasScreen = state.routeNames?.includes(screenName);
        
        if (hasScreen) {
          // Screen exists but navigation failed - try one more time
          navigation.navigate(screenName, params);
          return true;
        } else {
          logger.info(`⚠️ Screen ${screenName} not found in current stack. Available screens:`, state.routeNames);
          // Don't reset immediately - just return false and let caller handle it
          return false;
        }
      }
    } catch (error) {
      logger.error(`❌ Navigation error for screen ${screenName}:`, error);
      return false;
    }
  }

  /**
   * Reset navigation to a safe state
   * @param {Object} navigation - React Navigation object
   * @param {Object} options - Reset options
   */
  static resetNavigation(navigation, options = null) {
    try {
      const defaultOptions = {
        index: 0,
        routes: [{ name: 'Home' }]
      };
      
      const resetOptions = options || defaultOptions;
      navigation.reset(resetOptions);
      return true;
    } catch (error) {
      logger.error('❌ Reset navigation failed:', error);
      return false;
    }
  }

  /**
   * Handle navigation errors with appropriate fallbacks
   * @param {Object} navigation - React Navigation object
   * @param {Object} resetOptions - Options for reset navigation
   */
  static handleNavigationError(navigation, resetOptions = null) {
    logger.error('🚨 Handling navigation error with ultimate fallback');
    
    try {
      // Try to reset to a known safe state
      const safeResetOptions = resetOptions || {
        index: 0,
        routes: [{ name: 'Home' }]
      };
      
      navigation.reset(safeResetOptions);
      return true;
    } catch (resetError) {
      logger.error('❌ Even reset navigation failed:', resetError);
      
      // This should rarely happen, but log for debugging
      logger.error('🔥 Critical navigation error - manual intervention may be required');
      return false;
    }
  }

  /**
   * Check if a specific screen exists in the current navigation state
   * @param {Object} navigation - React Navigation object
   * @param {string} screenName - Screen name to check
   */
  static screenExists(navigation, screenName) {
    try {
      const state = navigation.getState();
      return state.routeNames?.includes(screenName) || false;
    } catch (error) {
      logger.error('❌ Error checking screen existence:', error);
      return false;
    }
  }

  /**
   * Get current route information safely
   * @param {Object} navigation - React Navigation object
   */
  static getCurrentRoute(navigation) {
    try {
      const state = navigation.getState();
      const route = state.routes[state.index];
      return {
        name: route.name,
        params: route.params || {},
        key: route.key
      };
    } catch (error) {
      logger.error('❌ Error getting current route:', error);
      return {
        name: 'Unknown',
        params: {},
        key: null
      };
    }
  }

  /**
   * Navigate with confirmation dialog
   * @param {Object} navigation - React Navigation object
   * @param {string} targetScreen - Target screen name
   * @param {Object} confirmOptions - Alert options
   * @param {Object} navParams - Navigation parameters
   */
  static navigateWithConfirmation(navigation, targetScreen, confirmOptions, navParams = {}) {
    const { Alert } = require('react-native');
    
    Alert.alert(
      confirmOptions.title || 'Navigate',
      confirmOptions.message || `Go to ${targetScreen}?`,
      [
        { text: confirmOptions.cancelText || 'Cancel', style: 'cancel' },
        { 
          text: confirmOptions.confirmText || 'Go', 
          style: confirmOptions.destructive ? 'destructive' : 'default',
          onPress: () => this.navigateWithFallback(navigation, targetScreen, null, navParams)
        }
      ]
    );
  }

  /**
   * Pop to a specific screen in the stack
   * @param {Object} navigation - React Navigation object
   * @param {string} screenName - Target screen name
   */
  static popToScreen(navigation, screenName) {
    try {
      const state = navigation.getState();
      const targetIndex = state.routes.findIndex(route => route.name === screenName);
      
      if (targetIndex >= 0) {
        const popCount = state.index - targetIndex;
        if (popCount > 0) {
          navigation.pop(popCount);
          return true;
        }
      }
      
      // If screen not found in stack, navigate to it
      return this.navigateWithFallback(navigation, screenName);
    } catch (error) {
      logger.error('❌ Error in popToScreen:', error);
      return this.navigateWithFallback(navigation, screenName);
    }
  }

  /**
   * Safe navigation for authentication flows
   * @param {Object} navigation - React Navigation object
   * @param {boolean} isAuthenticated - User authentication status
   * @param {boolean} hasAcceptedTerms - Terms acceptance status
   * @param {boolean} hasCompletedProfile - Profile completion status
   */
  static navigateBasedOnUserState(navigation, isAuthenticated, hasAcceptedTerms, hasCompletedProfile) {
    try {
      if (!isAuthenticated) {
        this.resetNavigation(navigation, {
          index: 0,
          routes: [{ name: 'Login' }]
        });
      } else if (!hasAcceptedTerms) {
        this.resetNavigation(navigation, {
          index: 0,
          routes: [{ name: 'TermsAndAgreement' }]
        });
      } else if (!hasCompletedProfile) {
        this.resetNavigation(navigation, {
          index: 0,
          routes: [{ name: 'ProfileScreen' }]
        });
      } else {
        this.resetNavigation(navigation, {
          index: 0,
          routes: [{ name: 'Home' }]
        });
      }
      return true;
    } catch (error) {
      logger.error('❌ Error in navigateBasedOnUserState:', error);
      return false;
    }
  }

  /**
   * Log current navigation state for debugging
   * @param {Object} navigation - React Navigation object
   * @param {string} context - Context for the log
   */
  static logNavigationState(navigation, context = 'Navigation State') {
    try {
      const state = navigation.getState();
      logger.info(`📍 ${context}:`, {
        currentRoute: state.routes[state.index]?.name,
        stackSize: state.routes.length,
        canGoBack: navigation.canGoBack(),
        routeNames: state.routeNames
      });
    } catch (error) {
      logger.error('❌ Error logging navigation state:', error);
    }
  }
}

export default NavigationHelper;