/**
 * ErrorReporter - Comprehensive error reporting and crash analytics
 * Provides automated error capture, analysis, and reporting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { analyticsManager } from './AnalyticsManager';
import logger from '../utils/logger';


class ErrorReporter {
  constructor(config = {}) {
    this.config = {
      maxStoredErrors: 100,
      reportingEndpoint: null,
      enableLocalStorage: true,
      enableRealTimeReporting: true,
      enableUserPrompts: false,
      enableAutoReporting: true,
      storageKey: 'error_reports',
      batchSize: 10,
      flushInterval: 60000, // 1 minute
      sensitiveKeys: ['password', 'token', 'secret', 'key', 'auth'],
      ...config
    };

    this.errorQueue = [];
    this.reportingSessions = new Map();
    this.errorMetrics = {
      totalErrors: 0,
      criticalErrors: 0,
      networkErrors: 0,
      jsErrors: 0,
      nativeErrors: 0,
      userReportedErrors: 0,
      resolvedErrors: new Set()
    };

    this.errorHandlers = new Set();
    this.isOnline = true;
    this.userId = null;
    
    this.initialize();
  }

  /**
   * Initialize error reporting
   */
  async initialize() {
    await this.loadStoredErrors();
    await this.loadErrorMetrics();
    
    this.setupGlobalErrorHandlers();
    this.setupNetworkListener();
    this.startPeriodicFlush();
    
    logger.info('✅ ErrorReporter initialized');
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    // JavaScript errors
    if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
      const originalHandler = ErrorUtils.getGlobalHandler();
      
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.reportError(error, {
          type: 'javascript',
          fatal: isFatal,
          context: 'global_handler',
          timestamp: Date.now()
        });

        // Call original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // Promise rejections
    if (typeof global !== 'undefined' && global.addEventListener) {
      global.addEventListener('unhandledrejection', (event) => {
        this.reportError(event.reason, {
          type: 'unhandled_promise_rejection',
          fatal: false,
          context: 'promise_rejection',
          timestamp: Date.now()
        });
      });
    }

    // Console error override
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.reportConsoleError(args);
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Report an error with context
   */
  async reportError(error, context = {}) {
    if (!error) return;

    try {
      const errorReport = this.createErrorReport(error, context);
      
      // Store error
      this.errorQueue.push(errorReport);
      this.updateErrorMetrics(errorReport);
      
      // Notify error handlers
      this.notifyErrorHandlers(errorReport);
      
      // Track in analytics
      if (analyticsManager) {
        analyticsManager.trackError(error, context);
      }

      // Auto-report if enabled
      if (this.config.enableAutoReporting && this.isOnline) {
        await this.flushErrors();
      }

      // Prompt user if enabled and error is critical
      if (this.config.enableUserPrompts && errorReport.severity === 'critical') {
        this.promptUserForDetails(errorReport);
      }

      // Store locally if enabled
      if (this.config.enableLocalStorage) {
        await this.storeError(errorReport);
      }

    } catch (reportingError) {
      logger.warn('Failed to report error:', reportingError);
    }
  }

  /**
   * Create comprehensive error report
   */
  createErrorReport(error, context = {}) {
    const report = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.userId,
      
      // Error details
      name: error.name || 'Unknown Error',
      message: this.sanitizeErrorMessage(error.message || error.toString()),
      stack: this.sanitizeStack(error.stack),
      
      // Classification
      type: context.type || this.classifyError(error),
      severity: context.severity || this.calculateSeverity(error, context),
      category: this.categorizeError(error),
      
      // Context
      screen: context.screen || this.getCurrentScreen(),
      userAction: context.userAction,
      component: context.component,
      props: context.props ? this.sanitizeObject(context.props) : null,
      
      // Environment
      environment: this.getEnvironmentInfo(),
      device: this.getDeviceInfo(),
      app: this.getAppInfo(),
      network: this.getNetworkInfo(),
      
      // Additional context
      breadcrumbs: this.getBreadcrumbs(),
      tags: context.tags || [],
      fingerprint: this.generateFingerprint(error),
      
      // Metadata
      reportedBy: context.reportedBy || 'automatic',
      reproduced: false,
      resolved: false,
      userFeedback: null
    };

    return report;
  }

  /**
   * Report console errors
   */
  reportConsoleError(args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    this.reportError(new Error(message), {
      type: 'console_error',
      severity: 'low',
      context: 'console_override'
    });
  }

  /**
   * Report network errors
   */
  reportNetworkError(url, method, status, error) {
    this.reportError(error, {
      type: 'network',
      severity: status >= 500 ? 'high' : 'medium',
      context: 'network_request',
      metadata: {
        url: this.sanitizeUrl(url),
        method,
        status,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Report user-initiated errors
   */
  reportUserError(description, context = {}) {
    const error = new Error(description);
    this.reportError(error, {
      ...context,
      type: 'user_reported',
      severity: 'medium',
      reportedBy: 'user'
    });
  }

  /**
   * Add error handler
   */
  addErrorHandler(handler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Notify error handlers
   */
  notifyErrorHandlers(errorReport) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(errorReport);
      } catch (handlerError) {
        logger.warn('Error handler failed:', handlerError);
      }
    });
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    if (!error) return 'unknown';
    
    const name = error.name || '';
    const message = error.message || '';
    
    if (name.includes('Network') || message.includes('network')) {
      return 'network';
    } else if (name.includes('TypeError')) {
      return 'type_error';
    } else if (name.includes('ReferenceError')) {
      return 'reference_error';
    } else if (name.includes('SyntaxError')) {
      return 'syntax_error';
    } else if (message.includes('timeout')) {
      return 'timeout';
    } else if (message.includes('permission')) {
      return 'permission';
    } else {
      return 'runtime';
    }
  }

  /**
   * Calculate error severity
   */
  calculateSeverity(error, context = {}) {
    if (context.fatal) return 'critical';
    
    const errorType = this.classifyError(error);
    const message = error.message || '';
    
    // Critical conditions
    if (errorType === 'reference_error' || 
        message.includes('Cannot read property') ||
        message.includes('is not a function')) {
      return 'critical';
    }
    
    // High severity conditions  
    if (errorType === 'type_error' ||
        errorType === 'network' ||
        message.includes('failed') ||
        message.includes('invalid')) {
      return 'high';
    }
    
    // Medium severity
    if (errorType === 'timeout' ||
        errorType === 'permission') {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Categorize errors for better organization
   */
  categorizeError(error) {
    const message = error.message || '';
    const stack = error.stack || '';
    
    if (message.includes('render') || stack.includes('render')) {
      return 'rendering';
    } else if (message.includes('navigation') || stack.includes('navigation')) {
      return 'navigation';
    } else if (message.includes('async') || stack.includes('async')) {
      return 'async_operation';
    } else if (message.includes('storage') || stack.includes('AsyncStorage')) {
      return 'storage';
    } else if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    } else {
      return 'general';
    }
  }

  /**
   * Generate error fingerprint for deduplication
   */
  generateFingerprint(error) {
    const key = `${error.name}_${error.message}_${this.getStackSignature(error.stack)}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get stack signature for fingerprinting
   */
  getStackSignature(stack) {
    if (!stack) return '';
    
    const lines = stack.split('\n');
    const relevantLines = lines
      .filter(line => line.includes('at ') && !line.includes('node_modules'))
      .slice(0, 3);
    
    return relevantLines.join('|');
  }

  /**
   * Sanitize error message to remove sensitive data
   */
  sanitizeErrorMessage(message) {
    if (!message) return '';
    
    let sanitized = message;
    
    // Remove sensitive patterns
    this.config.sensitiveKeys.forEach(key => {
      const pattern = new RegExp(`${key}[=:\\s]+"?([^"\\s]+)"?`, 'gi');
      sanitized = sanitized.replace(pattern, `${key}=***`);
    });
    
    // Remove URLs with tokens
    sanitized = sanitized.replace(/https?:\/\/[^\s]*token[^\s]*/gi, 'https://***');
    
    return sanitized;
  }

  /**
   * Sanitize stack trace
   */
  sanitizeStack(stack) {
    if (!stack) return '';
    
    return stack
      .split('\n')
      .map(line => this.sanitizeErrorMessage(line))
      .join('\n');
  }

  /**
   * Sanitize object to remove sensitive data
   */
  sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      if (this.config.sensitiveKeys.some(sensitive => 
          key.toLowerCase().includes(sensitive.toLowerCase()))) {
        sanitized[key] = '***';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize URL to remove sensitive parameters
   */
  sanitizeUrl(url) {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      
      // Remove sensitive query parameters
      this.config.sensitiveKeys.forEach(key => {
        if (urlObj.searchParams.has(key)) {
          urlObj.searchParams.set(key, '***');
        }
      });
      
      return urlObj.toString();
    } catch {
      return url.replace(/[?&](?:token|key|secret|password)=[^&]*/gi, '');
    }
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo() {
    return {
      appState: AppState.currentState,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    // This would be expanded with actual device info in a real implementation
    return {
      platform: 'react-native',
      userAgent: navigator.userAgent || 'Alexandria App',
      language: navigator.language || 'en'
    };
  }

  /**
   * Get app information
   */
  getAppInfo() {
    return {
      version: '1.0.0',
      build: '1',
      environment: __DEV__ ? 'development' : 'production'
    };
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      isConnected: this.isOnline,
      type: this.networkType || 'unknown'
    };
  }

  /**
   * Get memory usage estimation
   */
  getMemoryUsage() {
    // This is a simplified version - real implementation would use performance APIs
    if (performance && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    
    return { used: 0, total: 0, limit: 0 };
  }

  /**
   * Get breadcrumbs for error context
   */
  getBreadcrumbs() {
    // This would integrate with your navigation/analytics system
    return [];
  }

  /**
   * Prompt user for error details
   */
  promptUserForDetails(errorReport) {
    Alert.alert(
      'Something went wrong',
      'Would you like to help us improve by sharing what happened?',
      [
        {
          text: 'No thanks',
          style: 'cancel'
        },
        {
          text: 'Share feedback',
          onPress: () => this.showFeedbackDialog(errorReport)
        }
      ]
    );
  }

  /**
   * Show feedback dialog
   */
  showFeedbackDialog(errorReport) {
    // This would show a detailed feedback form
    logger.info('Would show feedback dialog for error:', errorReport.id);
  }

  /**
   * Store error locally
   */
  async storeError(errorReport) {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey);
      const errors = stored ? JSON.parse(stored) : [];
      
      errors.push(errorReport);
      
      // Keep only recent errors
      const trimmed = errors.slice(-this.config.maxStoredErrors);
      
      await AsyncStorage.setItem(this.config.storageKey, JSON.stringify(trimmed));
    } catch (error) {
      logger.warn('Failed to store error report:', error);
    }
  }

  /**
   * Load stored errors
   */
  async loadStoredErrors() {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey);
      if (stored) {
        const errors = JSON.parse(stored);
        this.errorQueue.push(...errors);
      }
    } catch (error) {
      logger.warn('Failed to load stored errors:', error);
    }
  }

  /**
   * Flush errors to reporting endpoint
   */
  async flushErrors() {
    if (this.errorQueue.length === 0 || !this.isOnline) return;
    
    const batch = this.errorQueue.splice(0, this.config.batchSize);
    
    try {
      if (this.config.reportingEndpoint) {
        await this.sendErrorBatch(batch);
      }
      
      logger.info(`✅ Reported ${batch.length} errors`);
    } catch (error) {
      // Re-add errors to queue if sending failed
      this.errorQueue.unshift(...batch);
      logger.warn('Failed to send error batch:', error);
    }
  }

  /**
   * Send error batch to reporting endpoint
   */
  async sendErrorBatch(errors) {
    const response = await fetch(this.config.reportingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errors,
        metadata: {
          appVersion: this.getAppInfo().version,
          timestamp: Date.now(),
          userId: this.userId
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Update error metrics
   */
  updateErrorMetrics(errorReport) {
    this.errorMetrics.totalErrors++;
    
    if (errorReport.severity === 'critical') {
      this.errorMetrics.criticalErrors++;
    }
    
    if (errorReport.type === 'network') {
      this.errorMetrics.networkErrors++;
    }
    
    if (errorReport.type === 'javascript' || errorReport.type === 'runtime') {
      this.errorMetrics.jsErrors++;
    }
    
    if (errorReport.reportedBy === 'user') {
      this.errorMetrics.userReportedErrors++;
    }
  }

  /**
   * Get error analytics
   */
  getErrorAnalytics() {
    const recentErrors = this.errorQueue.filter(
      error => Date.now() - error.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {});
    
    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {});
    
    return {
      metrics: this.errorMetrics,
      recentErrors: recentErrors.length,
      errorsByType,
      errorsBySeverity,
      topErrors: this.getTopErrors(recentErrors),
      resolutionRate: this.calculateResolutionRate()
    };
  }

  /**
   * Get most common errors
   */
  getTopErrors(errors) {
    const fingerprints = errors.reduce((acc, error) => {
      const fp = error.fingerprint;
      if (!acc[fp]) {
        acc[fp] = {
          count: 0,
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
          sample: error
        };
      }
      acc[fp].count++;
      acc[fp].lastSeen = Math.max(acc[fp].lastSeen, error.timestamp);
      return acc;
    }, {});
    
    return Object.values(fingerprints)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate resolution rate
   */
  calculateResolutionRate() {
    const total = this.errorMetrics.totalErrors;
    const resolved = this.errorMetrics.resolvedErrors.size;
    
    return total > 0 ? (resolved / total) * 100 : 0;
  }

  // Utility methods
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId() {
    return analyticsManager?.sessionData?.sessionId || 'unknown';
  }

  getCurrentScreen() {
    return analyticsManager?.currentScreen || 'unknown';
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      this.networkType = state.type;
      
      if (this.isOnline && this.errorQueue.length > 0) {
        this.flushErrors();
      }
    });
  }

  startPeriodicFlush() {
    setInterval(() => {
      this.flushErrors();
      this.saveErrorMetrics();
    }, this.config.flushInterval);
  }

  async loadErrorMetrics() {
    try {
      const stored = await AsyncStorage.getItem('error_metrics');
      if (stored) {
        const metrics = JSON.parse(stored);
        this.errorMetrics = { ...this.errorMetrics, ...metrics };
        this.errorMetrics.resolvedErrors = new Set(metrics.resolvedErrorsArray || []);
      }
    } catch (error) {
      logger.warn('Failed to load error metrics:', error);
    }
  }

  async saveErrorMetrics() {
    try {
      const metricsToSave = {
        ...this.errorMetrics,
        resolvedErrorsArray: Array.from(this.errorMetrics.resolvedErrors)
      };
      delete metricsToSave.resolvedErrors;
      
      await AsyncStorage.setItem('error_metrics', JSON.stringify(metricsToSave));
    } catch (error) {
      logger.warn('Failed to save error metrics:', error);
    }
  }

  setUserId(userId) {
    this.userId = userId;
  }

  clearErrors() {
    this.errorQueue = [];
    this.errorMetrics = {
      totalErrors: 0,
      criticalErrors: 0,
      networkErrors: 0,
      jsErrors: 0,
      nativeErrors: 0,
      userReportedErrors: 0,
      resolvedErrors: new Set()
    };
  }
}

// Create default error reporter
const errorReporter = new ErrorReporter();

// Export hook for React components
export const useErrorReporter = () => {
  return {
    reportError: (error, context) => errorReporter.reportError(error, context),
    reportNetworkError: (url, method, status, error) => 
      errorReporter.reportNetworkError(url, method, status, error),
    reportUserError: (description, context) => 
      errorReporter.reportUserError(description, context),
    addErrorHandler: (handler) => errorReporter.addErrorHandler(handler),
    getAnalytics: () => errorReporter.getErrorAnalytics()
  };
};

export { ErrorReporter, errorReporter };
export default ErrorReporter;