// =============================
// Performance Monitoring Utility
// =============================

/**
 * Centralized performance monitoring for Alexandria app
 * Uses Firebase Performance Monitoring
 */

import logger from './logger';

// Import Firebase Performance (with fallback if not available)
let perf: any = null;
let isPerformanceAvailable = false;

try {
  perf = require('@react-native-firebase/perf').default;
  isPerformanceAvailable = true;
  logger.info('✅ Firebase Performance Monitoring initialized');
} catch (error) {
  // Silently fail - @react-native-firebase is not available in Expo
  // Performance monitoring will be disabled, but app will continue working
  isPerformanceAvailable = false;
}

/**
 * Trace class for measuring custom operations
 */
export class Trace {
  private trace: any = null;
  private traceName: string;
  private started: boolean = false;

  constructor(traceName: string) {
    this.traceName = traceName;
  }

  /**
   * Start the trace
   */
  async start(): Promise<void> {
    if (!isPerformanceAvailable || !perf) {
      logger.warn(`Performance trace not available: ${this.traceName}`);
      return;
    }

    try {
      this.trace = perf().newTrace(this.traceName);
      await this.trace.start();
      this.started = true;
      logger.info(`🔍 Started trace: ${this.traceName}`);
    } catch (error) {
      logger.error(`Failed to start trace ${this.traceName}:`, error);
    }
  }

  /**
   * Stop the trace
   */
  async stop(): Promise<void> {
    if (!this.trace || !this.started) {
      return;
    }

    try {
      await this.trace.stop();
      this.started = false;
      logger.info(`✅ Stopped trace: ${this.traceName}`);
    } catch (error) {
      logger.error(`Failed to stop trace ${this.traceName}:`, error);
    }
  }

  /**
   * Add a custom metric to the trace
   */
  putMetric(metricName: string, value: number): void {
    if (!this.trace || !this.started) {
      return;
    }

    try {
      this.trace.putMetric(metricName, value);
      logger.info(`📊 Added metric to ${this.traceName}: ${metricName} = ${value}`);
    } catch (error) {
      logger.error(`Failed to add metric to ${this.traceName}:`, error);
    }
  }

  /**
   * Add a custom attribute to the trace
   */
  putAttribute(attributeName: string, value: string): void {
    if (!this.trace || !this.started) {
      return;
    }

    try {
      this.trace.putAttribute(attributeName, value);
      logger.info(`🏷️ Added attribute to ${this.traceName}: ${attributeName} = ${value}`);
    } catch (error) {
      logger.error(`Failed to add attribute to ${this.traceName}:`, error);
    }
  }
}

/**
 * HTTP Metric class for measuring network requests
 */
export class HttpMetric {
  private metric: any = null;
  private url: string;
  private httpMethod: string;

  constructor(url: string, httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') {
    this.url = url;
    this.httpMethod = httpMethod;
  }

  /**
   * Start the HTTP metric
   */
  async start(): Promise<void> {
    if (!isPerformanceAvailable || !perf) {
      return;
    }

    try {
      this.metric = perf().newHttpMetric(this.url, this.httpMethod);
      await this.metric.start();
      logger.info(`🌐 Started HTTP metric: ${this.httpMethod} ${this.url}`);
    } catch (error) {
      logger.error(`Failed to start HTTP metric:`, error);
    }
  }

  /**
   * Stop the HTTP metric
   */
  async stop(responseCode: number, responsePayloadSize?: number): Promise<void> {
    if (!this.metric) {
      return;
    }

    try {
      if (responseCode) {
        this.metric.setHttpResponseCode(responseCode);
      }
      if (responsePayloadSize) {
        this.metric.setResponsePayloadSize(responsePayloadSize);
      }
      await this.metric.stop();
      logger.info(`✅ Stopped HTTP metric: ${this.httpMethod} ${this.url} (${responseCode})`);
    } catch (error) {
      logger.error(`Failed to stop HTTP metric:`, error);
    }
  }

  /**
   * Set request payload size
   */
  setRequestPayloadSize(bytes: number): void {
    if (!this.metric) {
      return;
    }

    try {
      this.metric.setRequestPayloadSize(bytes);
    } catch (error) {
      logger.error(`Failed to set request payload size:`, error);
    }
  }

  /**
   * Add custom attribute
   */
  putAttribute(attributeName: string, value: string): void {
    if (!this.metric) {
      return;
    }

    try {
      this.metric.putAttribute(attributeName, value);
    } catch (error) {
      logger.error(`Failed to add attribute to HTTP metric:`, error);
    }
  }
}

/**
 * Performance Monitoring Service
 */
export class PerformanceMonitoring {
  /**
   * Check if performance monitoring is available
   */
  static isAvailable(): boolean {
    return isPerformanceAvailable;
  }

  /**
   * Create a new trace
   */
  static newTrace(traceName: string): Trace {
    return new Trace(traceName);
  }

  /**
   * Create a new HTTP metric
   */
  static newHttpMetric(url: string, httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): HttpMetric {
    return new HttpMetric(url, httpMethod);
  }

  /**
   * Measure an async operation
   */
  static async measureAsync<T>(
    traceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const trace = new Trace(traceName);
    await trace.start();

    try {
      const result = await operation();
      await trace.stop();
      return result;
    } catch (error) {
      await trace.stop();
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  static async measure<T>(
    traceName: string,
    operation: () => T
  ): Promise<T> {
    const trace = new Trace(traceName);
    await trace.start();

    try {
      const result = operation();
      await trace.stop();
      return result;
    } catch (error) {
      await trace.stop();
      throw error;
    }
  }

  /**
   * Enable/disable performance monitoring
   */
  static async setPerformanceCollectionEnabled(enabled: boolean): Promise<void> {
    if (!isPerformanceAvailable || !perf) {
      logger.warn('Performance monitoring not available');
      return;
    }

    try {
      await perf().setPerformanceCollectionEnabled(enabled);
      logger.info(`Performance collection ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('Failed to set performance collection:', error);
    }
  }
}

/**
 * Common trace names for consistency
 */
export const TraceNames = {
  // Quiz operations
  QUIZ_GENERATION: 'quiz_generation',
  QUIZ_COMPLETION: 'quiz_completion',
  QUIZ_LOAD: 'quiz_load',

  // Screen loads
  SCREEN_HOME: 'screen_home_load',
  SCREEN_QUIZ: 'screen_quiz_load',
  SCREEN_RESULTS: 'screen_results_load',
  SCREEN_PROFILE: 'screen_profile_load',

  // API calls
  API_GENERATE_QUIZ: 'api_generate_quiz',
  API_SAVE_RESULTS: 'api_save_results',
  API_GET_PROFILE: 'api_get_profile',
  API_GET_ANALYTICS: 'api_get_analytics',

  // Data operations
  FLASHCARD_LOAD: 'flashcard_load',
  FLASHCARD_SAVE: 'flashcard_save',
  ANALYTICS_CALCULATION: 'analytics_calculation',

  // File operations
  FILE_UPLOAD: 'file_upload',
  PDF_PROCESSING: 'pdf_processing',
  IMAGE_PROCESSING: 'image_processing',
};

export default PerformanceMonitoring;
