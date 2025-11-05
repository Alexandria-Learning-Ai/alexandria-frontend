// =============================
// Sentry Error Tracking Configuration
// =============================

/**
 * Centralized Sentry configuration for Alexandria app
 * Tracks errors, performance, and user context
 */

import React from 'react';
import * as Sentry from '@sentry/react-native';
import type { SeverityLevel, Transaction } from '@sentry/types';
import Constants from 'expo-constants';
import logger from './logger';

// Sentry DSN (should be in environment variables or app.json)
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || process.env.SENTRY_DSN;

// Check if we're in development mode
const isDevelopment = __DEV__;

/**
 * Initialize Sentry
 */
export const initializeSentry = (): void => {
  if (!SENTRY_DSN) {
    logger.warn('⚠️ Sentry DSN not configured. Error tracking disabled.');
    logger.warn('Set SENTRY_DSN in app.json extra config or environment variables');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,

      // Environment
      environment: isDevelopment ? 'development' : 'production',

      // Release tracking
      release: Constants.expoConfig?.version || '1.0.0',
      dist: Constants.expoConfig?.version || '1',

      // Performance Monitoring
      tracesSampleRate: isDevelopment ? 1.0 : 0.1, // 100% in dev, 10% in prod

      // Enable automatic session tracking
      enableAutoSessionTracking: true,

      // Session timeout (30 minutes)
      sessionTrackingIntervalMillis: 30000,

      // Enable native crash reporting
      enableNative: true,
      enableNativeCrashHandling: true,

      // Attach stack traces to messages
      attachStacktrace: true,

      // Max breadcrumbs to store
      maxBreadcrumbs: 50,

      // Debug mode (only in development)
      debug: isDevelopment,

      // Before send hook - modify events before sending
      beforeSend(event, hint) {
        // Don't send events in development (optional)
        if (isDevelopment) {
          logger.warn('Sentry event (dev mode, not sent):', event);
          return null; // Return null to prevent sending
        }

        // Filter out sensitive data
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }

        return event;
      },

      // Before breadcrumb hook - filter/modify breadcrumbs
      beforeBreadcrumb(breadcrumb, hint) {
        // Filter out sensitive console logs
        if (breadcrumb.category === 'console' && breadcrumb.message) {
          const sensitivePatterns = ['password', 'token', 'apiKey', 'secret'];
          const hasSensitive = sensitivePatterns.some(pattern =>
            breadcrumb.message?.toLowerCase().includes(pattern)
          );

          if (hasSensitive) {
            return null; // Don't add this breadcrumb
          }
        }

        return breadcrumb;
      },

      // Integrations
      integrations: [
        new Sentry.ReactNativeTracing({
          // Routing instrumentation (optional, requires react-navigation integration)
          routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),

          // Trace all network requests
          tracingOrigins: [
            'localhost',
            'alexandria-api-ywcw.onrender.com',
            /^\//,
          ],
        }),
      ],
    });

    logger.info('✅ Sentry initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Sentry:', error);
  }
};

/**
 * Set user context for error tracking
 */
export const setUser = (user: { id: string; email?: string; username?: string }): void => {
  try {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.email,
    });
    logger.info(`👤 Sentry user context set: ${user.id}`);
  } catch (error) {
    logger.error('Failed to set Sentry user:', error);
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUser = (): void => {
  try {
    Sentry.setUser(null);
    logger.info('👤 Sentry user context cleared');
  } catch (error) {
    logger.error('Failed to clear Sentry user:', error);
  }
};

/**
 * Set custom context
 */
export const setContext = (key: string, context: Record<string, any>): void => {
  try {
    Sentry.setContext(key, context);
    logger.info(`🔧 Sentry context set: ${key}`);
  } catch (error) {
    logger.error('Failed to set Sentry context:', error);
  }
};

/**
 * Add breadcrumb manually
 */
export const addBreadcrumb = (
  message: string,
  category: string = 'custom',
  level: SeverityLevel = 'info',
  data?: Record<string, any>
): void => {
  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  } catch (error) {
    logger.error('Failed to add breadcrumb:', error);
  }
};

/**
 * Capture exception
 */
export const captureException = (
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: SeverityLevel;
  }
): void => {
  try {
    if (context?.tags) {
      Sentry.setTags(context.tags);
    }

    if (context?.extra) {
      Sentry.setExtras(context.extra);
    }

    Sentry.captureException(error, {
      level: context?.level || 'error',
    });

    logger.error('❌ Exception captured by Sentry:', error);
  } catch (err) {
    logger.error('Failed to capture exception:', err);
  }
};

/**
 * Capture message
 */
export const captureMessage = (
  message: string,
  level: SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): void => {
  try {
    if (context?.tags) {
      Sentry.setTags(context.tags);
    }

    if (context?.extra) {
      Sentry.setExtras(context.extra);
    }

    Sentry.captureMessage(message, level);

    logger.info(`📝 Message captured by Sentry: ${message}`);
  } catch (error) {
    logger.error('Failed to capture message:', error);
  }
};

/**
 * Set tag
 */
export const setTag = (key: string, value: string): void => {
  try {
    Sentry.setTag(key, value);
  } catch (error) {
    logger.error('Failed to set tag:', error);
  }
};

/**
 * Set multiple tags
 */
export const setTags = (tags: Record<string, string>): void => {
  try {
    Sentry.setTags(tags);
  } catch (error) {
    logger.error('Failed to set tags:', error);
  }
};

/**
 * Wrap a component with error boundary
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Create a wrapped error boundary with custom fallback
 */
export const createErrorBoundary = (
  fallback: React.ComponentType<any> | React.ReactElement
) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Sentry.ErrorBoundary fallback={fallback as any}>
      {children}
    </Sentry.ErrorBoundary>
  );
};

/**
 * Performance monitoring
 */
export const startTransaction = (
  name: string,
  op: string
): Transaction | undefined => {
  try {
    return Sentry.startTransaction({
      name,
      op,
    });
  } catch (error) {
    logger.error('Failed to start transaction:', error);
    return undefined;
  }
};

/**
 * Common error tags
 */
export const ErrorTags = {
  SCREEN: 'screen',
  COMPONENT: 'component',
  SERVICE: 'service',
  API: 'api',
  AUTH: 'authentication',
  QUIZ: 'quiz',
  PROFILE: 'profile',
  PAYMENT: 'payment',
};

/**
 * Common error levels
 */
export const ErrorLevels = {
  FATAL: 'fatal' as SeverityLevel,
  ERROR: 'error' as SeverityLevel,
  WARNING: 'warning' as SeverityLevel,
  INFO: 'info' as SeverityLevel,
  DEBUG: 'debug' as SeverityLevel,
};

// Export Sentry for direct access if needed
export { Sentry };

export default {
  initialize: initializeSentry,
  setUser,
  clearUser,
  setContext,
  addBreadcrumb,
  captureException,
  captureMessage,
  setTag,
  setTags,
  ErrorBoundary,
  createErrorBoundary,
  startTransaction,
  ErrorTags,
  ErrorLevels,
};
