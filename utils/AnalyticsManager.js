/**
 * AnalyticsManager - Real-time usage metrics and analytics system
 * Provides comprehensive user behavior tracking and analytics dashboard
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export class AnalyticsManager {
  constructor(config = {}) {
    this.config = {
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      maxStoredEvents: 1000,
      enableRealTime: true,
      storageKey: 'analytics_events',
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ...config
    };

    this.events = [];
    this.sessionData = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      screenViews: 0,
      interactions: 0,
      errors: 0
    };

    this.userMetrics = {
      totalSessions: 0,
      totalScreenViews: 0,
      totalInteractions: 0,
      averageSessionDuration: 0,
      retentionData: {},
      performanceMetrics: {},
      featureUsage: {}
    };

    this.realtimeListeners = new Set();
    this.isOnline = true;
    
    this.initialize();
  }

  async initialize() {
    await this.loadStoredMetrics();
    this.setupAppStateListener();
    this.setupNetworkListener();
    this.startPeriodicFlush();
    this.trackSessionStart();
  }

  /**
   * Track custom events
   */
  track(eventName, properties = {}, timestamp = Date.now()) {
    const event = {
      id: this.generateEventId(),
      name: eventName,
      properties: {
        ...properties,
        timestamp,
        sessionId: this.sessionData.sessionId,
        screen: properties.screen || this.currentScreen,
        userAgent: this.getUserAgent(),
        networkType: this.networkType
      },
      context: this.getContextData()
    };

    this.events.push(event);
    this.updateSessionActivity();
    this.notifyRealtimeListeners(event);

    // Update session counters
    if (eventName === 'screen_view') {
      this.sessionData.screenViews++;
      this.userMetrics.totalScreenViews++;
    } else if (eventName === 'interaction') {
      this.sessionData.interactions++;
      this.userMetrics.totalInteractions++;
    } else if (eventName === 'error') {
      this.sessionData.errors++;
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }

    return event.id;
  }

  /**
   * Track screen views
   */
  trackScreen(screenName, properties = {}) {
    this.currentScreen = screenName;
    this.track('screen_view', {
      screen: screenName,
      previousScreen: this.previousScreen,
      ...properties
    });
    this.previousScreen = screenName;
  }

  /**
   * Track user interactions
   */
  trackInteraction(elementType, elementId, action = 'tap', properties = {}) {
    this.track('interaction', {
      elementType,
      elementId,
      action,
      ...properties
    });
  }

  /**
   * Track errors
   */
  trackError(error, context = {}) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      severity: this.classifyErrorSeverity(error)
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric, value, properties = {}) {
    const performanceEvent = {
      metric,
      value,
      ...properties
    };

    this.track('performance', performanceEvent);
    
    // Update performance metrics
    if (!this.userMetrics.performanceMetrics[metric]) {
      this.userMetrics.performanceMetrics[metric] = {
        count: 0,
        total: 0,
        average: 0,
        min: Infinity,
        max: -Infinity
      };
    }

    const perfMetric = this.userMetrics.performanceMetrics[metric];
    perfMetric.count++;
    perfMetric.total += value;
    perfMetric.average = perfMetric.total / perfMetric.count;
    perfMetric.min = Math.min(perfMetric.min, value);
    perfMetric.max = Math.max(perfMetric.max, value);
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName, action = 'used', properties = {}) {
    this.track('feature_usage', {
      feature: featureName,
      action,
      ...properties
    });

    // Update feature usage metrics
    if (!this.userMetrics.featureUsage[featureName]) {
      this.userMetrics.featureUsage[featureName] = {
        usageCount: 0,
        firstUsed: Date.now(),
        lastUsed: Date.now(),
        actions: {}
      };
    }

    const featureMetric = this.userMetrics.featureUsage[featureName];
    featureMetric.usageCount++;
    featureMetric.lastUsed = Date.now();
    
    if (!featureMetric.actions[action]) {
      featureMetric.actions[action] = 0;
    }
    featureMetric.actions[action]++;
  }

  /**
   * Start user journey tracking
   */
  startJourney(journeyName, properties = {}) {
    const journeyId = this.generateEventId();
    
    this.track('journey_start', {
      journeyName,
      journeyId,
      ...properties
    });

    return journeyId;
  }

  /**
   * Track journey steps
   */
  trackJourneyStep(journeyId, stepName, properties = {}) {
    this.track('journey_step', {
      journeyId,
      stepName,
      stepTime: Date.now(),
      ...properties
    });
  }

  /**
   * Complete user journey
   */
  completeJourney(journeyId, success = true, properties = {}) {
    this.track('journey_complete', {
      journeyId,
      success,
      completionTime: Date.now(),
      ...properties
    });
  }

  /**
   * Get real-time analytics data
   */
  getRealTimeAnalytics() {
    const currentTime = Date.now();
    const sessionDuration = currentTime - this.sessionData.startTime;

    // Recent events (last 5 minutes)
    const recentEvents = this.events.filter(
      event => currentTime - event.properties.timestamp < 5 * 60 * 1000
    );

    // Event distribution
    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {});

    // Screen analytics
    const screenViews = recentEvents.filter(e => e.name === 'screen_view');
    const screenDistribution = screenViews.reduce((acc, event) => {
      const screen = event.properties.screen;
      acc[screen] = (acc[screen] || 0) + 1;
      return acc;
    }, {});

    // Performance insights
    const performanceEvents = recentEvents.filter(e => e.name === 'performance');
    const performanceInsights = this.analyzePerformanceEvents(performanceEvents);

    return {
      session: {
        ...this.sessionData,
        duration: sessionDuration,
        isActive: currentTime - this.sessionData.lastActivity < 5 * 60 * 1000
      },
      recentActivity: {
        totalEvents: recentEvents.length,
        eventDistribution: eventCounts,
        screenDistribution,
        topScreens: Object.entries(screenDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      },
      performance: performanceInsights,
      errors: recentEvents.filter(e => e.name === 'error').length,
      interactions: recentEvents.filter(e => e.name === 'interaction').length
    };
  }

  /**
   * Get user behavior insights
   */
  getUserBehaviorInsights() {
    const events = this.events;
    if (events.length === 0) return null;

    // Screen flow analysis
    const screenFlow = this.analyzeScreenFlow(events);
    
    // Time spent analysis
    const timeSpentAnalysis = this.analyzeTimeSpent(events);
    
    // Interaction patterns
    const interactionPatterns = this.analyzeInteractionPatterns(events);
    
    // Drop-off analysis
    const dropOffPoints = this.analyzeDropOffPoints(events);

    return {
      screenFlow,
      timeSpentAnalysis,
      interactionPatterns,
      dropOffPoints,
      mostUsedFeatures: this.getMostUsedFeatures(),
      userSegment: this.classifyUserSegment()
    };
  }

  /**
   * Analyze screen flow patterns
   */
  analyzeScreenFlow(events) {
    const screenViews = events.filter(e => e.name === 'screen_view');
    const transitions = {};
    
    for (let i = 0; i < screenViews.length - 1; i++) {
      const current = screenViews[i].properties.screen;
      const next = screenViews[i + 1].properties.screen;
      
      if (!transitions[current]) {
        transitions[current] = {};
      }
      
      transitions[current][next] = (transitions[current][next] || 0) + 1;
    }

    return {
      transitions,
      mostCommonPaths: this.findMostCommonPaths(transitions),
      unusualPatterns: this.detectUnusualPatterns(transitions)
    };
  }

  /**
   * Analyze time spent on screens
   */
  analyzeTimeSpent(events) {
    const screenViews = events.filter(e => e.name === 'screen_view');
    const timeSpent = {};
    
    for (let i = 0; i < screenViews.length - 1; i++) {
      const current = screenViews[i];
      const next = screenViews[i + 1];
      const screen = current.properties.screen;
      const duration = next.properties.timestamp - current.properties.timestamp;
      
      if (!timeSpent[screen]) {
        timeSpent[screen] = [];
      }
      
      timeSpent[screen].push(duration);
    }

    // Calculate statistics for each screen
    const screenStats = {};
    Object.entries(timeSpent).forEach(([screen, durations]) => {
      const total = durations.reduce((sum, d) => sum + d, 0);
      const average = total / durations.length;
      const median = this.calculateMedian(durations);
      
      screenStats[screen] = {
        visits: durations.length,
        totalTime: total,
        averageTime: average,
        medianTime: median,
        shortVisits: durations.filter(d => d < 10000).length, // Less than 10 seconds
        longVisits: durations.filter(d => d > 60000).length    // More than 1 minute
      };
    });

    return screenStats;
  }

  /**
   * Analyze interaction patterns
   */
  analyzeInteractionPatterns(events) {
    const interactions = events.filter(e => e.name === 'interaction');
    
    const patterns = {
      elementTypes: {},
      actions: {},
      timing: [],
      sequences: []
    };

    interactions.forEach(event => {
      const { elementType, action, timestamp } = event.properties;
      
      patterns.elementTypes[elementType] = (patterns.elementTypes[elementType] || 0) + 1;
      patterns.actions[action] = (patterns.actions[action] || 0) + 1;
      patterns.timing.push(timestamp);
    });

    // Find rapid interaction sequences
    patterns.sequences = this.findInteractionSequences(interactions);

    return patterns;
  }

  /**
   * Set up real-time listeners
   */
  addRealtimeListener(callback) {
    this.realtimeListeners.add(callback);
    
    return () => {
      this.realtimeListeners.delete(callback);
    };
  }

  /**
   * Notify real-time listeners
   */
  notifyRealtimeListeners(event) {
    if (!this.config.enableRealTime) return;
    
    this.realtimeListeners.forEach(callback => {
      try {
        callback(event, this.getRealTimeAnalytics());
      } catch (error) {
        logger.warn('Real-time analytics listener error:', error);
      }
    });
  }

  /**
   * Flush events to storage/server
   */
  async flush() {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      // Store locally first
      await this.storeEvents(eventsToFlush);
      
      // Send to server if online
      if (this.isOnline && this.config.endpoint) {
        await this.sendEvents(eventsToFlush);
      }
    } catch (error) {
      logger.warn('Failed to flush analytics events:', error);
      // Re-add events if flush failed
      this.events.unshift(...eventsToFlush);
    }
  }

  /**
   * Store events locally
   */
  async storeEvents(events) {
    try {
      const existing = await AsyncStorage.getItem(this.config.storageKey);
      const storedEvents = existing ? JSON.parse(existing) : [];
      
      const allEvents = [...storedEvents, ...events];
      
      // Keep only the most recent events
      const trimmedEvents = allEvents.slice(-this.config.maxStoredEvents);
      
      await AsyncStorage.setItem(this.config.storageKey, JSON.stringify(trimmedEvents));
    } catch (error) {
      logger.warn('Failed to store analytics events:', error);
    }
  }

  /**
   * Load stored metrics
   */
  async loadStoredMetrics() {
    try {
      const stored = await AsyncStorage.getItem('analytics_user_metrics');
      if (stored) {
        this.userMetrics = { ...this.userMetrics, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.warn('Failed to load stored metrics:', error);
    }
  }

  /**
   * Save user metrics
   */
  async saveUserMetrics() {
    try {
      await AsyncStorage.setItem('analytics_user_metrics', JSON.stringify(this.userMetrics));
    } catch (error) {
      logger.warn('Failed to save user metrics:', error);
    }
  }

  /**
   * Generate unique IDs
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get context data
   */
  getContextData() {
    return {
      appState: AppState.currentState,
      screenDimensions: { width: screenWidth, height: screenHeight },
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: this.getDeviceLanguage()
    };
  }

  /**
   * Helper methods
   */
  updateSessionActivity() {
    this.sessionData.lastActivity = Date.now();
  }

  classifyErrorSeverity(error) {
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    } else if (error.name === 'NetworkError') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        this.flush();
        this.saveUserMetrics();
      } else if (nextAppState === 'active') {
        this.updateSessionActivity();
      }
    });
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      this.networkType = state.type;
      
      if (this.isOnline) {
        this.flush(); // Flush pending events when back online
      }
    });
  }

  startPeriodicFlush() {
    setInterval(() => {
      this.flush();
      this.saveUserMetrics();
    }, this.config.flushInterval);
  }

  trackSessionStart() {
    this.userMetrics.totalSessions++;
    this.track('session_start', {
      sessionNumber: this.userMetrics.totalSessions,
      isNewUser: this.userMetrics.totalSessions === 1
    });
  }

  // Placeholder methods for complex analysis
  analyzePerformanceEvents(events) { return {}; }
  findMostCommonPaths(transitions) { return []; }
  detectUnusualPatterns(transitions) { return []; }
  analyzeDropOffPoints(events) { return []; }
  findInteractionSequences(interactions) { return []; }
  getMostUsedFeatures() { return []; }
  classifyUserSegment() { return 'standard'; }
  getUserAgent() { return 'Alexandria-App/1.0'; }
  getDeviceLanguage() { return 'en'; }
  sendEvents(events) { return Promise.resolve(); }
}

// Create default analytics instance
const analyticsManager = new AnalyticsManager();

export { analyticsManager };
export default AnalyticsManager;