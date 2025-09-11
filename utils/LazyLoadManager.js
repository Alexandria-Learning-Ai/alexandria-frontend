/**
 * LazyLoadManager - Code splitting and lazy loading utilities
 * Optimizes bundle size and improves initial load performance
 */

import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkeletonLoader } from '../components/SkeletonLoader';
import logger from '../utils/logger';


class LazyLoadManager {
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
    this.preloadQueue = [];
    this.loadMetrics = {};
    this.maxConcurrentLoads = 3;
    this.currentLoads = 0;
  }

  /**
   * Create a lazy-loaded component with custom loading UI
   */
  createLazyComponent(importFunction, fallback = null, preload = false) {
    const LazyComponent = lazy(() => {
      const startTime = Date.now();
      const moduleName = this.extractModuleName(importFunction.toString());
      
      // Track loading metrics
      return importFunction()
        .then(module => {
          const loadTime = Date.now() - startTime;
          this.recordLoadMetric(moduleName, loadTime, true);
          this.loadedModules.add(moduleName);
          return module;
        })
        .catch(error => {
          const loadTime = Date.now() - startTime;
          this.recordLoadMetric(moduleName, loadTime, false, error);
          throw error;
        });
    });

    // Add to preload queue if requested
    if (preload) {
      this.addToPreloadQueue(importFunction, moduleName);
    }

    return (props) => (
      <Suspense fallback={fallback || <DefaultLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  /**
   * Preload modules based on user behavior patterns
   */
  async preloadModule(importFunction, priority = 'normal') {
    const moduleName = this.extractModuleName(importFunction.toString());
    
    if (this.loadedModules.has(moduleName)) {
      return; // Already loaded
    }

    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName); // Already loading
    }

    // Check if we're at max concurrent loads
    if (this.currentLoads >= this.maxConcurrentLoads && priority !== 'high') {
      this.preloadQueue.push({ importFunction, moduleName, priority });
      return;
    }

    const loadPromise = this.performModuleLoad(importFunction, moduleName);
    this.loadingPromises.set(moduleName, loadPromise);

    try {
      await loadPromise;
    } finally {
      this.loadingPromises.delete(moduleName);
      this.currentLoads--;
      this.processPreloadQueue();
    }
  }

  /**
   * Intelligent preloading based on navigation patterns
   */
  async intelligentPreload(currentScreen, userBehaviorData) {
    const predictions = this.predictNextScreens(currentScreen, userBehaviorData);
    
    for (const prediction of predictions) {
      if (prediction.confidence > 0.7) {
        await this.preloadModule(prediction.importFunction, 'high');
      } else if (prediction.confidence > 0.4) {
        await this.preloadModule(prediction.importFunction, 'normal');
      }
    }
  }

  /**
   * Predict likely next screens based on user patterns
   */
  predictNextScreens(currentScreen, behaviorData) {
    const transitions = behaviorData?.screenTransitions || {};
    const currentTransitions = transitions[currentScreen] || {};
    
    return Object.entries(currentTransitions)
      .map(([screen, data]) => ({
        screen,
        confidence: data.frequency / data.totalVisits,
        importFunction: this.getScreenImportFunction(screen)
      }))
      .filter(prediction => prediction.importFunction)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get import function for a screen name
   */
  getScreenImportFunction(screenName) {
    const screenMap = {
      'QuizScreen': () => import('../screens/QuizScreen'),
      'ProfileScreen': () => import('../screens/ProfileScreen'),
      'UploadScreen': () => import('../screens/UploadScreen'),
      'FlashcardScreen': () => import('../screens/FlashcardScreen'),
      'ResultsScreen': () => import('../screens/ResultsScreen'),
      'ProgressTrackerScreen': () => import('../screens/ProgressTrackerScreen'),
      'QuizHistoryScreen': () => import('../screens/QuizHistoryScreen'),
      'ReviewScreen': () => import('../screens/ReviewScreen'),
      'WeaknessAnalysisScreen': () => import('../screens/WeaknessAnalysisScreen'),
      'AskAlexandriaScreen': () => import('../screens/AskAlexandriaScreen'),
      'CoachScreen': () => import('../screens/CoachScreen'),
      'ExamListScreen': () => import('../screens/ExamListScreen'),
      'ScheduleExamScreen': () => import('../screens/ScheduleExamScreen'),
      'SubscriptionScreen': () => import('../screens/SubscriptionScreen'),
      'SubscriptionManagementScreen': () => import('../screens/SubscriptionManagementScreen'),
    };

    return screenMap[screenName];
  }

  /**
   * Process the preload queue
   */
  async processPreloadQueue() {
    if (this.preloadQueue.length === 0 || this.currentLoads >= this.maxConcurrentLoads) {
      return;
    }

    // Sort by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const next = this.preloadQueue.shift();
    if (next) {
      await this.preloadModule(next.importFunction, next.priority);
    }
  }

  /**
   * Perform the actual module loading
   */
  async performModuleLoad(importFunction, moduleName) {
    this.currentLoads++;
    const startTime = Date.now();

    try {
      const module = await importFunction();
      const loadTime = Date.now() - startTime;
      this.recordLoadMetric(moduleName, loadTime, true);
      this.loadedModules.add(moduleName);
      return module;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      this.recordLoadMetric(moduleName, loadTime, false, error);
      throw error;
    }
  }

  /**
   * Extract module name from import function
   */
  extractModuleName(functionString) {
    const match = functionString.match(/import\(['"`](.+?)['"`]\)/);
    if (match) {
      const path = match[1];
      return path.split('/').pop().replace('.js', '');
    }
    return `module_${Date.now()}`;
  }

  /**
   * Record loading metrics for analysis
   */
  recordLoadMetric(moduleName, loadTime, success, error = null) {
    if (!this.loadMetrics[moduleName]) {
      this.loadMetrics[moduleName] = {
        loads: 0,
        totalTime: 0,
        averageTime: 0,
        failures: 0,
        errors: []
      };
    }

    const metric = this.loadMetrics[moduleName];
    metric.loads++;
    
    if (success) {
      metric.totalTime += loadTime;
      metric.averageTime = metric.totalTime / (metric.loads - metric.failures);
    } else {
      metric.failures++;
      if (error) {
        metric.errors.push({
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Save metrics periodically
    this.saveMetrics();
  }

  /**
   * Save metrics to storage
   */
  async saveMetrics() {
    try {
      await AsyncStorage.setItem('lazy_load_metrics', JSON.stringify(this.loadMetrics));
    } catch (error) {
      logger.warn('Failed to save lazy load metrics:', error);
    }
  }

  /**
   * Load metrics from storage
   */
  async loadMetrics() {
    try {
      const saved = await AsyncStorage.getItem('lazy_load_metrics');
      if (saved) {
        this.loadMetrics = JSON.parse(saved);
      }
    } catch (error) {
      logger.warn('Failed to load lazy load metrics:', error);
    }
  }

  /**
   * Get performance analytics
   */
  getAnalytics() {
    const totalModules = Object.keys(this.loadMetrics).length;
    const loadedCount = this.loadedModules.size;
    
    let totalLoadTime = 0;
    let totalFailures = 0;
    
    Object.values(this.loadMetrics).forEach(metric => {
      totalLoadTime += metric.totalTime;
      totalFailures += metric.failures;
    });

    return {
      totalModules,
      loadedModules: loadedCount,
      averageLoadTime: totalModules > 0 ? totalLoadTime / totalModules : 0,
      successRate: totalModules > 0 ? ((totalModules - totalFailures) / totalModules) * 100 : 0,
      metrics: this.loadMetrics
    };
  }

  /**
   * Clear loaded modules cache
   */
  clearCache() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.preloadQueue = [];
    this.loadMetrics = {};
  }

  /**
   * Add to preload queue
   */
  addToPreloadQueue(importFunction, moduleName) {
    this.preloadQueue.push({
      importFunction,
      moduleName,
      priority: 'low'
    });
  }
}

// Default loading fallback component
const DefaultLoadingFallback = ({ message = 'Loading...', showSkeleton = true }) => (
  <View style={styles.loadingContainer}>
    {showSkeleton ? (
      <SkeletonLoader width="100%" height={200} />
    ) : (
      <>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>{message}</Text>
      </>
    )}
  </View>
);

// Smart loading fallback that adapts based on expected content
export const SmartLoadingFallback = ({ 
  type = 'screen', 
  message,
  estimatedLoadTime = null 
}) => {
  const [showDetailedLoader, setShowDetailedLoader] = useState(false);

  useEffect(() => {
    if (estimatedLoadTime && estimatedLoadTime > 1000) {
      const timer = setTimeout(() => {
        setShowDetailedLoader(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [estimatedLoadTime]);

  const getSkeletonForType = () => {
    switch (type) {
      case 'quiz':
        return <SkeletonLoader width="100%" height={300} />;
      case 'profile':
        return <SkeletonLoader width="100%" height={250} />;
      case 'list':
        return <SkeletonLoader width="100%" height={400} />;
      default:
        return <SkeletonLoader width="100%" height={200} />;
    }
  };

  if (showDetailedLoader) {
    return (
      <View style={styles.smartLoadingContainer}>
        {getSkeletonForType()}
        <View style={styles.loadingInfo}>
          <ActivityIndicator size="small" color="#D4AF37" />
          <Text style={styles.smartLoadingText}>
            {message || 'Loading enhanced features...'}
          </Text>
          {estimatedLoadTime && (
            <Text style={styles.estimatedTime}>
              ~{Math.ceil(estimatedLoadTime / 1000)}s remaining
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#D4AF37" />
    </View>
  );
};

// Hook for using lazy load manager
export const useLazyLoad = () => {
  const managerRef = useRef(null);

  if (!managerRef.current) {
    managerRef.current = new LazyLoadManager();
  }

  useEffect(() => {
    managerRef.current.loadMetrics();
    
    return () => {
      managerRef.current.saveMetrics();
    };
  }, []);

  return managerRef.current;
};

// Bundle analysis utilities
export const BundleAnalyzer = {
  /**
   * Analyze current bundle size and composition
   */
  async analyzeBundleSize() {
    // This would be implemented differently in a real app
    // For now, we'll simulate bundle analysis
    return {
      totalSize: '2.1MB',
      breakdown: {
        javascript: '1.2MB',
        images: '500KB',
        fonts: '200KB',
        other: '200KB'
      },
      largestModules: [
        { name: 'react-native-vector-icons', size: '300KB' },
        { name: 'lottie-react-native', size: '250KB' },
        { name: 'react-native-chart-kit', size: '200KB' },
        { name: '@react-navigation', size: '180KB' },
        { name: 'firebase', size: '400KB' }
      ],
      recommendations: [
        'Consider tree-shaking for react-native-vector-icons',
        'Optimize Lottie animations or use static images',
        'Lazy load chart components',
        'Use dynamic imports for Firebase modules'
      ]
    };
  },

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    return [
      {
        type: 'code-splitting',
        impact: 'high',
        description: 'Implement lazy loading for quiz and analysis screens',
        effort: 'medium'
      },
      {
        type: 'asset-optimization',
        impact: 'medium',
        description: 'Compress and optimize image assets',
        effort: 'low'
      },
      {
        type: 'tree-shaking',
        impact: 'medium',
        description: 'Remove unused icon fonts and libraries',
        effort: 'low'
      },
      {
        type: 'preloading',
        impact: 'medium',
        description: 'Implement intelligent screen preloading',
        effort: 'high'
      }
    ];
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  smartLoadingContainer: {
    flex: 1,
    padding: 20,
  },
  loadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
  },
  smartLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
  },
  estimatedTime: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#999',
  },
});

// Create singleton instance
const lazyLoadManager = new LazyLoadManager();

export { LazyLoadManager, lazyLoadManager };
export default LazyLoadManager;