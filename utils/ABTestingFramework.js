/**
 * ABTestingFramework - Comprehensive A/B testing and experimentation platform
 * Provides user experience optimization through controlled experiments
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsManager } from './AnalyticsManager';
import logger from '../utils/logger';


export class ABTestingFramework {
  constructor(config = {}) {
    this.config = {
      storageKey: 'ab_testing_data',
      userIdKey: 'user_id',
      enableLocalStorage: true,
      enableAnalytics: true,
      autoTrackConversions: true,
      defaultTrafficAllocation: 50, // 50% split by default
      apiEndpoint: null,
      debugMode: __DEV__,
      ...config
    };

    this.experiments = new Map();
    this.userVariants = new Map();
    this.conversionGoals = new Map();
    this.experimentMetrics = new Map();
    this.userId = null;
    this.userAttributes = {};
    
    this.initialize();
  }

  /**
   * Initialize the A/B testing framework
   */
  async initialize() {
    try {
      await this.loadUserData();
      await this.loadExperiments();
      await this.loadUserVariants();
      await this.loadMetrics();
      
      if (this.config.debugMode) {
        logger.info('🧪 A/B Testing Framework initialized');
        logger.info('User ID:', this.userId);
        logger.info('Active experiments:', Array.from(this.experiments.keys()));
      }
    } catch (error) {
      logger.warn('Failed to initialize A/B testing framework:', error);
    }
  }

  /**
   * Define a new experiment
   */
  defineExperiment(experimentConfig) {
    const experiment = {
      id: experimentConfig.id,
      name: experimentConfig.name || experimentConfig.id,
      description: experimentConfig.description || '',
      
      // Variants configuration
      variants: this.normalizeVariants(experimentConfig.variants),
      
      // Targeting and allocation
      trafficAllocation: experimentConfig.trafficAllocation || 100,
      targetingConditions: experimentConfig.targeting || {},
      
      // Experiment lifecycle
      status: experimentConfig.status || 'draft', // draft, active, paused, completed
      startDate: experimentConfig.startDate || null,
      endDate: experimentConfig.endDate || null,
      
      // Goals and metrics
      primaryGoal: experimentConfig.primaryGoal || null,
      secondaryGoals: experimentConfig.secondaryGoals || [],
      
      // Configuration
      sticky: experimentConfig.sticky !== false, // Users stay in same variant
      trackingEnabled: experimentConfig.trackingEnabled !== false,
      
      // Metadata
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: experimentConfig.tags || []
    };

    this.experiments.set(experiment.id, experiment);
    this.saveExperiments();

    if (this.config.debugMode) {
      logger.info(`🧪 Experiment defined: ${experiment.name}`);
    }

    return experiment;
  }

  /**
   * Get variant for a user in an experiment
   */
  async getVariant(experimentId, defaultVariant = 'control') {
    try {
      const experiment = this.experiments.get(experimentId);
      
      if (!experiment) {
        if (this.config.debugMode) {
          logger.warn(`Experiment not found: ${experimentId}`);
        }
        return defaultVariant;
      }

      // Check if experiment is active
      if (!this.isExperimentActive(experiment)) {
        return defaultVariant;
      }

      // Check if user already has a variant (sticky behavior)
      if (experiment.sticky && this.userVariants.has(experimentId)) {
        const existingVariant = this.userVariants.get(experimentId);
        if (this.config.debugMode) {
          logger.info(`🧪 Returning sticky variant for ${experimentId}: ${existingVariant.variant}`);
        }
        return existingVariant.variant;
      }

      // Check targeting conditions
      if (!this.meetsTargetingConditions(experiment.targetingConditions)) {
        return defaultVariant;
      }

      // Check traffic allocation
      if (!this.isUserInTrafficAllocation(experiment.trafficAllocation)) {
        return defaultVariant;
      }

      // Assign variant
      const assignedVariant = this.assignVariant(experiment);
      
      // Store assignment
      this.userVariants.set(experimentId, {
        variant: assignedVariant,
        assignedAt: Date.now(),
        experimentName: experiment.name
      });

      // Track assignment
      if (experiment.trackingEnabled && this.config.enableAnalytics) {
        this.trackExperimentAssignment(experimentId, assignedVariant, experiment);
      }

      // Save to storage
      await this.saveUserVariants();

      if (this.config.debugMode) {
        logger.info(`🧪 Assigned variant for ${experimentId}: ${assignedVariant}`);
      }

      return assignedVariant;

    } catch (error) {
      logger.warn(`Failed to get variant for experiment ${experimentId}:`, error);
      return defaultVariant;
    }
  }

  /**
   * Track a conversion event
   */
  async trackConversion(goalId, experimentId = null, value = 1, properties = {}) {
    try {
      const conversionEvent = {
        goalId,
        experimentId,
        userId: this.userId,
        value,
        properties,
        timestamp: Date.now(),
        userVariant: experimentId ? this.userVariants.get(experimentId) : null
      };

      // Update metrics
      this.updateConversionMetrics(conversionEvent);

      // Track in analytics if enabled
      if (this.config.enableAnalytics && analyticsManager) {
        analyticsManager.track('conversion', {
          goalId,
          experimentId,
          variant: conversionEvent.userVariant?.variant,
          value,
          ...properties
        });
      }

      // Store locally
      await this.storeConversionEvent(conversionEvent);

      if (this.config.debugMode) {
        logger.info(`🎯 Conversion tracked: ${goalId}`, conversionEvent);
      }

    } catch (error) {
      logger.warn('Failed to track conversion:', error);
    }
  }

  /**
   * Define a conversion goal
   */
  defineConversionGoal(goal) {
    const goalConfig = {
      id: goal.id,
      name: goal.name || goal.id,
      description: goal.description || '',
      type: goal.type || 'binary', // binary, numeric, revenue
      
      // Value configuration
      valueProperty: goal.valueProperty || 'value',
      
      // Attribution
      attributionWindow: goal.attributionWindow || 7 * 24 * 60 * 60 * 1000, // 7 days
      
      // Metadata
      createdAt: Date.now(),
      tags: goal.tags || []
    };

    this.conversionGoals.set(goal.id, goalConfig);
    
    if (this.config.debugMode) {
      logger.info(`🎯 Conversion goal defined: ${goalConfig.name}`);
    }

    return goalConfig;
  }

  /**
   * Get experiment results and statistics
   */
  getExperimentResults(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const metrics = this.experimentMetrics.get(experimentId) || this.createEmptyMetrics();
    
    // Calculate statistical significance
    const results = {
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        duration: this.calculateExperimentDuration(experiment)
      },
      
      // Variant performance
      variants: this.calculateVariantPerformance(experimentId, experiment.variants),
      
      // Overall metrics
      totalParticipants: metrics.totalAssignments,
      totalConversions: metrics.totalConversions,
      overallConversionRate: metrics.overallConversionRate,
      
      // Statistical analysis
      statisticalSignificance: this.calculateStatisticalSignificance(experimentId),
      confidenceLevel: this.calculateConfidenceLevel(experimentId),
      
      // Recommendations
      winner: this.determineWinner(experimentId),
      recommendation: this.generateRecommendation(experimentId),
      
      // Metadata
      lastUpdated: Date.now()
    };

    return results;
  }

  /**
   * Get all active experiments for the current user
   */
  getActiveExperiments() {
    const activeExperiments = [];
    
    for (const [experimentId, experiment] of this.experiments) {
      if (this.isExperimentActive(experiment)) {
        const userVariant = this.userVariants.get(experimentId);
        
        activeExperiments.push({
          id: experimentId,
          name: experiment.name,
          variant: userVariant?.variant || null,
          assignedAt: userVariant?.assignedAt || null
        });
      }
    }
    
    return activeExperiments;
  }

  /**
   * Force assign a user to a specific variant (for testing)
   */
  async forceVariant(experimentId, variant) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (!experiment.variants.some(v => v.name === variant)) {
      throw new Error(`Variant not found: ${variant}`);
    }

    this.userVariants.set(experimentId, {
      variant,
      assignedAt: Date.now(),
      experimentName: experiment.name,
      forced: true
    });

    await this.saveUserVariants();

    if (this.config.debugMode) {
      logger.info(`🧪 Force assigned variant for ${experimentId}: ${variant}`);
    }
  }

  /**
   * Normalize variants configuration
   */
  normalizeVariants(variants) {
    if (!Array.isArray(variants)) {
      // Convert object format to array
      return Object.entries(variants).map(([name, config]) => ({
        name,
        weight: config.weight || config.allocation || 50,
        config: config.config || config
      }));
    }

    // Ensure each variant has required properties
    return variants.map(variant => ({
      name: variant.name,
      weight: variant.weight || variant.allocation || 50,
      config: variant.config || {}
    }));
  }

  /**
   * Check if experiment is currently active
   */
  isExperimentActive(experiment) {
    if (experiment.status !== 'active') {
      return false;
    }

    const now = Date.now();
    
    if (experiment.startDate && now < experiment.startDate) {
      return false;
    }

    if (experiment.endDate && now > experiment.endDate) {
      return false;
    }

    return true;
  }

  /**
   * Check if user meets targeting conditions
   */
  meetsTargetingConditions(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions means everyone qualifies
    }

    // Check user attributes against targeting conditions
    for (const [attribute, expectedValue] of Object.entries(conditions)) {
      const userValue = this.userAttributes[attribute];
      
      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(userValue)) {
          return false;
        }
      } else if (typeof expectedValue === 'object' && expectedValue.operator) {
        if (!this.evaluateCondition(userValue, expectedValue)) {
          return false;
        }
      } else if (userValue !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate complex targeting conditions
   */
  evaluateCondition(userValue, condition) {
    const { operator, value } = condition;
    
    switch (operator) {
      case 'eq': return userValue === value;
      case 'ne': return userValue !== value;
      case 'gt': return userValue > value;
      case 'gte': return userValue >= value;
      case 'lt': return userValue < value;
      case 'lte': return userValue <= value;
      case 'in': return Array.isArray(value) && value.includes(userValue);
      case 'nin': return Array.isArray(value) && !value.includes(userValue);
      case 'contains': return String(userValue).includes(String(value));
      case 'regex': return new RegExp(value).test(String(userValue));
      default: return false;
    }
  }

  /**
   * Check if user is in traffic allocation
   */
  isUserInTrafficAllocation(trafficAllocation) {
    if (trafficAllocation >= 100) return true;
    if (trafficAllocation <= 0) return false;

    const hash = this.hashUserId();
    const bucket = hash % 100;
    
    return bucket < trafficAllocation;
  }

  /**
   * Assign a variant based on weights
   */
  assignVariant(experiment) {
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    const hash = this.hashUserId();
    const bucket = hash % totalWeight;
    
    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (bucket < cumulativeWeight) {
        return variant.name;
      }
    }
    
    // Fallback to first variant
    return experiment.variants[0]?.name || 'control';
  }

  /**
   * Hash user ID for consistent assignment
   */
  hashUserId() {
    if (!this.userId) return 0;
    
    let hash = 0;
    for (let i = 0; i < this.userId.length; i++) {
      const char = this.userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Track experiment assignment
   */
  trackExperimentAssignment(experimentId, variant, experiment) {
    // Update metrics
    this.updateAssignmentMetrics(experimentId, variant);

    // Track in analytics
    if (analyticsManager) {
      analyticsManager.track('experiment_assignment', {
        experimentId,
        experimentName: experiment.name,
        variant,
        userId: this.userId
      });
    }
  }

  /**
   * Update assignment metrics
   */
  updateAssignmentMetrics(experimentId, variant) {
    if (!this.experimentMetrics.has(experimentId)) {
      this.experimentMetrics.set(experimentId, this.createEmptyMetrics());
    }

    const metrics = this.experimentMetrics.get(experimentId);
    metrics.totalAssignments++;
    metrics.variantAssignments[variant] = (metrics.variantAssignments[variant] || 0) + 1;
    metrics.lastAssignment = Date.now();
  }

  /**
   * Update conversion metrics
   */
  updateConversionMetrics(conversionEvent) {
    if (!conversionEvent.experimentId || !conversionEvent.userVariant) {
      return;
    }

    const experimentId = conversionEvent.experimentId;
    const variant = conversionEvent.userVariant.variant;

    if (!this.experimentMetrics.has(experimentId)) {
      this.experimentMetrics.set(experimentId, this.createEmptyMetrics());
    }

    const metrics = this.experimentMetrics.get(experimentId);
    metrics.totalConversions++;
    
    if (!metrics.variantConversions[variant]) {
      metrics.variantConversions[variant] = 0;
    }
    metrics.variantConversions[variant]++;

    // Update conversion rates
    const assignments = metrics.variantAssignments[variant] || 0;
    const conversions = metrics.variantConversions[variant];
    metrics.variantConversionRates[variant] = assignments > 0 ? conversions / assignments : 0;

    // Update overall conversion rate
    metrics.overallConversionRate = metrics.totalAssignments > 0 
      ? metrics.totalConversions / metrics.totalAssignments 
      : 0;

    metrics.lastConversion = Date.now();
  }

  /**
   * Create empty metrics structure
   */
  createEmptyMetrics() {
    return {
      totalAssignments: 0,
      totalConversions: 0,
      overallConversionRate: 0,
      variantAssignments: {},
      variantConversions: {},
      variantConversionRates: {},
      lastAssignment: null,
      lastConversion: null,
      createdAt: Date.now()
    };
  }

  /**
   * Set user attributes for targeting
   */
  setUserAttributes(attributes) {
    this.userAttributes = { ...this.userAttributes, ...attributes };
    
    if (this.config.debugMode) {
      logger.info('🧪 User attributes updated:', this.userAttributes);
    }
  }

  /**
   * Set user ID
   */
  setUserId(userId) {
    this.userId = userId;
    
    if (this.config.debugMode) {
      logger.info('🧪 User ID set:', userId);
    }
  }

  // Storage methods
  async loadUserData() {
    try {
      const userId = await AsyncStorage.getItem(this.config.userIdKey);
      if (userId) {
        this.userId = userId;
      }
    } catch (error) {
      logger.warn('Failed to load user ID:', error);
    }
  }

  async loadExperiments() {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey + '_experiments');
      if (stored) {
        const experiments = JSON.parse(stored);
        this.experiments = new Map(Object.entries(experiments));
      }
    } catch (error) {
      logger.warn('Failed to load experiments:', error);
    }
  }

  async saveExperiments() {
    try {
      const experimentsObj = Object.fromEntries(this.experiments);
      await AsyncStorage.setItem(
        this.config.storageKey + '_experiments',
        JSON.stringify(experimentsObj)
      );
    } catch (error) {
      logger.warn('Failed to save experiments:', error);
    }
  }

  async loadUserVariants() {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey + '_variants');
      if (stored) {
        const variants = JSON.parse(stored);
        this.userVariants = new Map(Object.entries(variants));
      }
    } catch (error) {
      logger.warn('Failed to load user variants:', error);
    }
  }

  async saveUserVariants() {
    try {
      const variantsObj = Object.fromEntries(this.userVariants);
      await AsyncStorage.setItem(
        this.config.storageKey + '_variants',
        JSON.stringify(variantsObj)
      );
    } catch (error) {
      logger.warn('Failed to save user variants:', error);
    }
  }

  async loadMetrics() {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey + '_metrics');
      if (stored) {
        const metrics = JSON.parse(stored);
        this.experimentMetrics = new Map(Object.entries(metrics));
      }
    } catch (error) {
      logger.warn('Failed to load metrics:', error);
    }
  }

  async saveMetrics() {
    try {
      const metricsObj = Object.fromEntries(this.experimentMetrics);
      await AsyncStorage.setItem(
        this.config.storageKey + '_metrics',
        JSON.stringify(metricsObj)
      );
    } catch (error) {
      logger.warn('Failed to save metrics:', error);
    }
  }

  async storeConversionEvent(event) {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey + '_conversions');
      const conversions = stored ? JSON.parse(stored) : [];
      
      conversions.push(event);
      
      // Keep only recent conversions (last 1000)
      const trimmed = conversions.slice(-1000);
      
      await AsyncStorage.setItem(
        this.config.storageKey + '_conversions',
        JSON.stringify(trimmed)
      );
    } catch (error) {
      logger.warn('Failed to store conversion event:', error);
    }
  }

  // Placeholder methods for advanced statistics
  calculateVariantPerformance(experimentId, variants) { return {}; }
  calculateStatisticalSignificance(experimentId) { return null; }
  calculateConfidenceLevel(experimentId) { return null; }
  determineWinner(experimentId) { return null; }
  generateRecommendation(experimentId) { return 'Continue monitoring'; }
  calculateExperimentDuration(experiment) { return null; }

  /**
   * Clear all experiment data (for testing)
   */
  async clearAll() {
    this.experiments.clear();
    this.userVariants.clear();
    this.experimentMetrics.clear();
    this.conversionGoals.clear();
    
    await AsyncStorage.multiRemove([
      this.config.storageKey + '_experiments',
      this.config.storageKey + '_variants',
      this.config.storageKey + '_metrics',
      this.config.storageKey + '_conversions'
    ]);
  }
}

/**
 * React hook for A/B testing
 */
export const useABTest = (experimentId, defaultVariant = 'control') => {
  const [variant, setVariant] = React.useState(defaultVariant);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadVariant = async () => {
      try {
        const assignedVariant = await abTesting.getVariant(experimentId, defaultVariant);
        setVariant(assignedVariant);
      } catch (error) {
        logger.warn('Failed to load A/B test variant:', error);
        setVariant(defaultVariant);
      } finally {
        setLoading(false);
      }
    };

    loadVariant();
  }, [experimentId, defaultVariant]);

  const trackConversion = React.useCallback((goalId, value, properties) => {
    return abTesting.trackConversion(goalId, experimentId, value, properties);
  }, [experimentId]);

  return {
    variant,
    loading,
    trackConversion,
    isControl: variant === 'control'
  };
};

/**
 * Higher-order component for A/B testing
 */
export const withABTest = (experimentId, defaultVariant = 'control') => (WrappedComponent) => {
  return (props) => {
    const { variant, loading, trackConversion } = useABTest(experimentId, defaultVariant);
    
    return (
      <WrappedComponent
        {...props}
        variant={variant}
        abTestLoading={loading}
        trackConversion={trackConversion}
      />
    );
  };
};

// Create default A/B testing instance
const abTesting = new ABTestingFramework();

export { abTesting };
export default ABTestingFramework;