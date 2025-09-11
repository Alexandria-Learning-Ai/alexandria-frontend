import { logger, consoleTransport, configLoggerType } from 'react-native-logs';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine if we're in development mode
const isDevelopment = __DEV__ || Constants.expoConfig?.extra?.isDevelopment;

// Configure logger based on environment
const defaultConfig = {
  severity: isDevelopment ? 'debug' : 'error',
  transport: isDevelopment ? [consoleTransport] : [],
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright', 
      error: 'redBright',
      debug: 'magentaBright',
    },
  },
  // Add timestamps to logs
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  enabled: true,
};

// Create logger instance
const log = logger.createLogger(defaultConfig);

// Enhanced logger with Alexandria branding
class AlexandriaLogger {
  constructor() {
    this.log = log;
  }

  // Info level - general information
  info(message, ...args) {
    this.log.info(`🏛️ [Alexandria] ${message}`, ...args);
  }

  // Debug level - development debugging
  debug(message, ...args) {
    this.log.debug(`🔍 [Debug] ${message}`, ...args);
  }

  // Warning level - potential issues
  warn(message, ...args) {
    this.log.warn(`⚠️ [Warning] ${message}`, ...args);
  }

  // Error level - errors and exceptions
  error(message, ...args) {
    this.log.error(`❌ [Error] ${message}`, ...args);
  }

  // Success level - successful operations
  success(message, ...args) {
    this.log.info(`✅ [Success] ${message}`, ...args);
  }

  // API level - API related logs
  api(message, ...args) {
    this.log.info(`🔗 [API] ${message}`, ...args);
  }

  // Firebase level - Firebase operations
  firebase(message, ...args) {
    this.log.info(`🔥 [Firebase] ${message}`, ...args);
  }

  // Navigation level - navigation events
  navigation(message, ...args) {
    this.log.info(`🧭 [Navigation] ${message}`, ...args);
  }

  // Quiz level - quiz-specific operations
  quiz(message, ...args) {
    this.log.info(`📚 [Quiz] ${message}`, ...args);
  }

  // Analytics level - analytics and tracking
  analytics(message, ...args) {
    this.log.info(`📊 [Analytics] ${message}`, ...args);
  }

  // Performance level - performance monitoring
  performance(message, ...args) {
    this.log.info(`⚡ [Performance] ${message}`, ...args);
  }

  // Security level - security-related logs (always log these)
  security(message, ...args) {
    // Security logs should always be recorded, even in production
    if (!isDevelopment) {
      console.error(`🛡️ [Security] ${message}`, ...args);
    } else {
      this.log.error(`🛡️ [Security] ${message}`, ...args);
    }
  }

  // Configuration helper for different modules
  module(moduleName) {
    return {
      info: (message, ...args) => this.info(`[${moduleName}] ${message}`, ...args),
      debug: (message, ...args) => this.debug(`[${moduleName}] ${message}`, ...args),
      warn: (message, ...args) => this.warn(`[${moduleName}] ${message}`, ...args),
      error: (message, ...args) => this.error(`[${moduleName}] ${message}`, ...args),
      success: (message, ...args) => this.success(`[${moduleName}] ${message}`, ...args),
    };
  }
}

// Create singleton instance
const AlexandriaLog = new AlexandriaLogger();

// Export default logger
export default AlexandriaLog;

// Export individual methods for easier imports
export const { info, debug, warn, error, success, api, firebase, navigation, quiz, analytics, performance, security } = AlexandriaLog;

// Export module logger creator
export const createModuleLogger = (moduleName) => AlexandriaLog.module(moduleName);

// Development helper - log system information on app start
if (isDevelopment) {
  AlexandriaLog.info('Logger initialized', {
    environment: isDevelopment ? 'development' : 'production',
    platform: Platform.OS,
    version: Constants.expoConfig?.version || 'unknown'
  });
}