/**
 * HapticManager - Centralized haptic feedback management
 * Provides consistent tactile responses throughout the app
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';


class HapticManager {
  constructor() {
    this.isEnabled = true;
    this.intensity = 1.0; // Global intensity multiplier
    this.adaptiveMode = true; // Learn from user patterns
    this.supportedImpacts = ['light', 'medium', 'heavy'];
    this.supportedNotifications = ['success', 'warning', 'error'];
    this.userPreferences = null;
    this.usageStats = new Map();
    this.lastFeedbackTime = 0;
    this.feedbackHistory = [];
    this.initialized = false;
  }

  /**
   * Initialize the haptic manager with user preferences
   */
  async initialize(userId = null) {
    if (this.initialized) return;
    
    try {
      await this.loadUserPreferences(userId);
      await this.loadUsageStats(userId);
      this.initialized = true;
      logger.info('🎛️ HapticManager initialized');
    } catch (error) {
      logger.warn('Error initializing HapticManager:', error);
    }
  }

  /**
   * Load user preferences from storage
   */
  async loadUserPreferences(userId) {
    try {
      const key = userId ? `haptic_preferences_${userId}` : 'haptic_preferences';
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        this.userPreferences = JSON.parse(saved);
        this.isEnabled = this.userPreferences.enabled ?? true;
        this.intensity = this.userPreferences.intensity ?? 1.0;
        this.adaptiveMode = this.userPreferences.adaptiveMode ?? true;
      }
    } catch (error) {
      logger.warn('Error loading haptic preferences:', error);
    }
  }

  /**
   * Save user preferences to storage
   */
  async saveUserPreferences(userId = null) {
    try {
      const preferences = {
        enabled: this.isEnabled,
        intensity: this.intensity,
        adaptiveMode: this.adaptiveMode,
        lastUpdated: Date.now()
      };
      
      const key = userId ? `haptic_preferences_${userId}` : 'haptic_preferences';
      await AsyncStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      logger.warn('Error saving haptic preferences:', error);
    }
  }

  /**
   * Load usage statistics for adaptive learning
   */
  async loadUsageStats(userId) {
    try {
      const key = userId ? `haptic_stats_${userId}` : 'haptic_stats';
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        const stats = JSON.parse(saved);
        this.usageStats = new Map(Object.entries(stats));
      }
    } catch (error) {
      logger.warn('Error loading haptic stats:', error);
    }
  }

  /**
   * Save usage statistics
   */
  async saveUsageStats(userId = null) {
    try {
      const key = userId ? `haptic_stats_${userId}` : 'haptic_stats';
      const statsObject = Object.fromEntries(this.usageStats);
      await AsyncStorage.setItem(key, JSON.stringify(statsObject));
    } catch (error) {
      logger.warn('Error saving haptic stats:', error);
    }
  }

  /**
   * Enable or disable haptic feedback globally
   */
  async setEnabled(enabled, userId = null) {
    this.isEnabled = enabled;
    await this.saveUserPreferences(userId);
  }

  /**
   * Set global intensity multiplier (0.0 to 2.0)
   */
  async setIntensity(intensity, userId = null) {
    this.intensity = Math.max(0, Math.min(2, intensity));
    await this.saveUserPreferences(userId);
  }

  /**
   * Toggle adaptive mode
   */
  async setAdaptiveMode(enabled, userId = null) {
    this.adaptiveMode = enabled;
    await this.saveUserPreferences(userId);
  }

  /**
   * Check if haptics are supported and enabled
   */
  isAvailable() {
    return this.isEnabled && Platform.OS !== 'web';
  }

  /**
   * Track haptic usage for adaptive learning
   */
  trackUsage(context, type) {
    if (!this.adaptiveMode) return;

    const key = `${context}_${type}`;
    const current = this.usageStats.get(key) || { count: 0, lastUsed: 0 };
    current.count++;
    current.lastUsed = Date.now();
    this.usageStats.set(key, current);

    // Add to feedback history (keep last 50)
    this.feedbackHistory.push({ context, type, timestamp: Date.now() });
    if (this.feedbackHistory.length > 50) {
      this.feedbackHistory.shift();
    }

    // Save stats periodically
    if (current.count % 10 === 0) {
      this.saveUsageStats();
    }
  }

  /**
   * Get adaptive intensity based on usage patterns
   */
  getAdaptiveIntensity(context, baseIntensity = 1.0) {
    if (!this.adaptiveMode) return baseIntensity * this.intensity;

    // Analyze recent usage patterns
    const recentUsage = this.feedbackHistory.filter(
      item => Date.now() - item.timestamp < 300000 // Last 5 minutes
    );

    // Reduce intensity if there's been frequent haptic feedback
    let adaptiveFactor = 1.0;
    if (recentUsage.length > 10) {
      adaptiveFactor = Math.max(0.3, 1.0 - (recentUsage.length - 10) * 0.05);
    }

    // Time-based throttling
    const timeSinceLastFeedback = Date.now() - this.lastFeedbackTime;
    if (timeSinceLastFeedback < 100) {
      adaptiveFactor *= 0.5; // Reduce intensity for rapid feedback
    }

    return baseIntensity * this.intensity * adaptiveFactor;
  }

  /**
   * Enhanced base haptic method with tracking and adaptation
   */
  async performHaptic(type, context = 'generic', baseIntensity = 1.0) {
    if (!this.isAvailable()) return false;

    // Check throttling
    const now = Date.now();
    if (now - this.lastFeedbackTime < 50) return false; // 50ms minimum interval

    try {
      const adaptiveIntensity = this.getAdaptiveIntensity(context, baseIntensity);
      this.lastFeedbackTime = now;
      this.trackUsage(context, type);

      switch (type) {
        case 'light':
          if (adaptiveIntensity > 0.3) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          break;
        case 'medium':
          if (adaptiveIntensity > 0.5) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          break;
        case 'heavy':
          if (adaptiveIntensity > 0.7) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          if (adaptiveIntensity > 0.4) {
            await Haptics.selectionAsync();
          }
          break;
      }

      return true;
    } catch (error) {
      logger.warn(`Haptic feedback failed (${type}):`, error);
      return false;
    }
  }

  /**
   * Light tap feedback - for subtle interactions
   * Use for: button hover, list item selection, input focus
   */
  async light(context = 'interaction') {
    return await this.performHaptic('light', context, 0.3);
  }

  /**
   * Medium tap feedback - for standard interactions
   * Use for: button press, toggle switches, navigation
   */
  async medium(context = 'interaction') {
    return await this.performHaptic('medium', context, 0.6);
  }

  /**
   * Heavy tap feedback - for significant interactions
   * Use for: important actions, confirmations, completions
   */
  async heavy(context = 'interaction') {
    return await this.performHaptic('heavy', context, 1.0);
  }

  /**
   * Success feedback - for positive outcomes
   * Use for: quiz completion, correct answers, successful uploads
   */
  async success(context = 'feedback') {
    return await this.performHaptic('success', context, 1.0);
  }

  /**
   * Warning feedback - for cautionary actions
   * Use for: form validation errors, warnings, retries
   */
  async warning(context = 'feedback') {
    return await this.performHaptic('warning', context, 0.8);
  }

  /**
   * Error feedback - for failures and mistakes
   * Use for: wrong answers, failed uploads, critical errors
   */
  async error(context = 'feedback') {
    return await this.performHaptic('error', context, 1.0);
  }

  /**
   * Selection feedback - for interface navigation
   * Use for: picker selections, tab switching, option selection
   */
  async selection(context = 'navigation') {
    return await this.performHaptic('selection', context, 0.4);
  }

  /**
   * Custom pattern feedback for special interactions
   */
  async customPattern(pattern = 'medium') {
    if (!this.isAvailable()) return;
    
    const patterns = {
      'double-tap': async () => {
        await this.light();
        setTimeout(async () => await this.light(), 100);
      },
      'success-burst': async () => {
        await this.light();
        setTimeout(async () => await this.medium(), 100);
        setTimeout(async () => await this.success(), 200);
      },
      'error-buzz': async () => {
        await this.error();
        setTimeout(async () => await this.medium(), 150);
      },
      'completion-celebration': async () => {
        await this.heavy();
        setTimeout(async () => await this.success(), 200);
        setTimeout(async () => await this.medium(), 400);
      }
    };

    if (patterns[pattern]) {
      await patterns[pattern]();
    } else {
      await this.medium(); // Default fallback
    }
  }

  /**
   * Get haptic statistics and insights
   */
  getHapticInsights() {
    const stats = Object.fromEntries(this.usageStats);
    const recentUsage = this.feedbackHistory.filter(
      item => Date.now() - item.timestamp < 86400000 // Last 24 hours
    );

    const insights = {
      totalUsage: Object.values(stats).reduce((sum, item) => sum + item.count, 0),
      mostUsedContext: this.getMostUsedContext(stats),
      dailyUsage: recentUsage.length,
      adaptiveReductions: recentUsage.filter(item => 
        this.getAdaptiveIntensity(item.context) < 1.0
      ).length,
      preferences: {
        enabled: this.isEnabled,
        intensity: this.intensity,
        adaptiveMode: this.adaptiveMode
      }
    };

    return insights;
  }

  /**
   * Get most used haptic context
   */
  getMostUsedContext(stats) {
    let maxCount = 0;
    let mostUsed = 'none';

    for (const [key, data] of Object.entries(stats)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostUsed = key.split('_')[0]; // Get context part
      }
    }

    return mostUsed;
  }

  /**
   * Advanced haptic patterns with emotional context
   */
  async emotionalFeedback(emotion, intensity = 1.0) {
    if (!this.isAvailable()) return;

    const patterns = {
      joy: async () => {
        await this.performHaptic('light', 'emotion', 0.3 * intensity);
        setTimeout(async () => await this.performHaptic('medium', 'emotion', 0.6 * intensity), 100);
        setTimeout(async () => await this.performHaptic('success', 'emotion', intensity), 200);
      },
      excitement: async () => {
        for (let i = 0; i < 3; i++) {
          await this.performHaptic('medium', 'emotion', 0.7 * intensity);
          await new Promise(resolve => setTimeout(resolve, 80));
        }
      },
      frustration: async () => {
        await this.performHaptic('heavy', 'emotion', intensity);
        setTimeout(async () => await this.performHaptic('medium', 'emotion', 0.5 * intensity), 200);
      },
      focus: async () => {
        await this.performHaptic('light', 'emotion', 0.4 * intensity);
        setTimeout(async () => await this.performHaptic('light', 'emotion', 0.4 * intensity), 300);
      },
      achievement: async () => {
        await this.performHaptic('medium', 'emotion', 0.7 * intensity);
        setTimeout(async () => await this.performHaptic('heavy', 'emotion', intensity), 150);
        setTimeout(async () => await this.performHaptic('success', 'emotion', intensity), 300);
        setTimeout(async () => await this.performHaptic('medium', 'emotion', 0.5 * intensity), 450);
      },
      curiosity: async () => {
        await this.performHaptic('light', 'emotion', 0.3 * intensity);
        setTimeout(async () => await this.performHaptic('selection', 'emotion', 0.5 * intensity), 150);
        setTimeout(async () => await this.performHaptic('medium', 'emotion', 0.7 * intensity), 300);
      }
    };

    const pattern = patterns[emotion];
    if (pattern) {
      await pattern();
    } else {
      await this.performHaptic('medium', 'emotion', intensity);
    }
  }

  /**
   * Context-aware haptic feedback based on interaction type
   */
  async contextualFeedback(context, data = {}) {
    if (!this.isAvailable()) return;

    const contextMap = {
      // Navigation
      'navigation.back': () => this.light(),
      'navigation.forward': () => this.light(),
      'navigation.tab_switch': () => this.selection(),
      
      // Quiz interactions
      'quiz.answer_select': () => this.light(),
      'quiz.answer_correct': () => this.success(),
      'quiz.answer_wrong': () => this.error(),
      'quiz.completion': () => this.customPattern('completion-celebration'),
      'quiz.start': () => this.medium(),
      
      // UI interactions
      'button.primary': () => this.medium(),
      'button.secondary': () => this.light(),
      'button.destructive': () => this.heavy(),
      'toggle.on': () => this.light(),
      'toggle.off': () => this.light(),
      'slider.change': () => this.selection(),
      
      // File operations
      'upload.start': () => this.medium(),
      'upload.success': () => this.customPattern('success-burst'),
      'upload.error': () => this.customPattern('error-buzz'),
      
      // Notifications
      'notification.received': () => this.medium(),
      'notification.important': () => this.heavy(),
      
      // Form interactions
      'form.submit': () => this.medium(),
      'form.validation_error': () => this.warning(),
      'form.success': () => this.success(),
      
      // Game-like interactions
      'achievement.unlock': () => this.customPattern('completion-celebration'),
      'streak.continue': () => this.success(),
      'streak.break': () => this.warning(),
    };

    const feedbackFunction = contextMap[context];
    if (feedbackFunction) {
      await feedbackFunction();
    } else {
      logger.warn(`Unknown haptic context: ${context}`);
      await this.light(); // Default fallback
    }
  }

  /**
   * Intensity-based feedback (0.0 to 1.0)
   */
  async intensityFeedback(intensity = 0.5) {
    if (!this.isAvailable()) return;

    if (intensity <= 0.3) {
      await this.light();
    } else if (intensity <= 0.7) {
      await this.medium();
    } else {
      await this.heavy();
    }
  }
}

// Create singleton instance
const hapticManager = new HapticManager();

// Convenience functions for easy import
export const haptic = {
  light: () => hapticManager.light(),
  medium: () => hapticManager.medium(),
  heavy: () => hapticManager.heavy(),
  success: () => hapticManager.success(),
  warning: () => hapticManager.warning(),
  error: () => hapticManager.error(),
  selection: () => hapticManager.selection(),
  context: (context, data) => hapticManager.contextualFeedback(context, data),
  pattern: (pattern) => hapticManager.customPattern(pattern),
  intensity: (level) => hapticManager.intensityFeedback(level),
  setEnabled: (enabled) => hapticManager.setEnabled(enabled),
  isAvailable: () => hapticManager.isAvailable(),
};

export default hapticManager;