/**
 * NavigationTester - Comprehensive navigation testing utility
 * Tests all navigation paths and validates screen accessibility
 */

import { CommonActions } from '@react-navigation/native';
import logger from '../utils/logger';


class NavigationTester {
  constructor(navigation) {
    this.navigation = navigation;
    this.testResults = [];
    this.screenMap = {
      // Main App Screens
      'Home': 'HomeScreen',
      'Upload': 'UploadScreen', 
      'QuizScreen': 'QuizScreen',
      'Quiz': 'QuizScreen',
      'ResultsScreen': 'ResultsScreen',
      'QuizHistory': 'QuizHistoryScreen',
      'ReviewScreen': 'ReviewScreen',
      'ProgressTracker': 'ProgressTrackerScreen',
      'WeaknessAnalysis': 'WeaknessAnalysisScreen',
      'FlashcardScreen': 'FlashcardScreen',
      'Coach': 'CoachScreen',
      'AskAlexandria': 'AskAlexandriaScreen',
      'ScheduleExamScreen': 'ScheduleExamScreen',
      'ExamListScreen': 'ExamListScreen',
      
      // Profile & Settings
      'ProfileScreen': 'ProfileScreen',
      'ProfileView': 'ProfileViewScreen',
      
      // Authentication
      'Login': 'LoginScreen',
      'SignUp': 'SignUpScreen',
      'ForgotPassword': 'ForgotPasswordScreen',
      'TermsAndAgreement': 'TermsAndAgreementScreen',
      
      // Subscription
      'Subscription': 'SubscriptionScreen',
      'SubscriptionManagement': 'SubscriptionManagementScreen'
    };
  }

  /**
   * Test navigation to all available screens
   */
  async testAllNavigationPaths() {
    logger.info('🧪 Starting comprehensive navigation test...');
    
    const currentState = this.navigation.getState();
    logger.info('📍 Current navigation state:', {
      index: currentState.index,
      routes: currentState.routeNames || [],
      currentScreen: currentState.routes[currentState.index]?.name
    });

    // Reset to Home screen before starting tests
    if (currentState.routeNames?.includes('Home')) {
      try {
        this.navigation.navigate('Home');
        await this.delay(300);
        logger.info('🏠 Reset to Home screen for testing');
      } catch (error) {
        logger.info('⚠️ Could not reset to Home:', error.message);
      }
    }

    // Test each screen navigation
    for (const [screenName, screenComponent] of Object.entries(this.screenMap)) {
      await this.testSingleNavigation(screenName, screenComponent);
      await this.delay(200); // Increased pause between tests
      
      // Return to Home after each test to avoid navigation stack issues
      if (screenName !== 'Home' && currentState.routeNames?.includes('Home')) {
        try {
          this.navigation.navigate('Home');
          await this.delay(100);
        } catch (error) {
          // Ignore reset errors
        }
      }
    }

    // Generate test report
    this.generateTestReport();
    return this.testResults;
  }

  /**
   * Test navigation to a specific screen
   */
  async testSingleNavigation(screenName, screenComponent) {
    const testStart = Date.now();
    
    try {
      // Check if screen is available in current navigation state
      const state = this.navigation.getState();
      const availableScreens = state.routeNames || [];
      
      if (!availableScreens.includes(screenName)) {
        this.recordResult(screenName, 'UNAVAILABLE', 'Screen not in current navigation stack', availableScreens);
        return false;
      }

      // Get current screen before navigation
      const beforeNavState = this.navigation.getState();
      const beforeRoute = beforeNavState.routes[beforeNavState.index];

      // Attempt navigation with appropriate params
      let navParams = {};
      if (screenName === 'Quiz' || screenName === 'QuizScreen') {
        navParams = {
          quiz: {
            id: 'nav-test-quiz',
            title: 'Navigation Test Quiz',
            questions: [
              {
                question: 'Test question for navigation?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A'
              }
            ]
          }
        };
      } else if (screenName === 'ResultsScreen') {
        navParams = {
          score: 100,
          quiz: {
            id: 'nav-test-results',
            title: 'Navigation Test Results',
            questions: []
          }
        };
      } else if (screenName === 'ReviewScreen') {
        navParams = {
          quiz: {
            id: 'nav-test-review',
            title: 'Navigation Test Review',
            questions: [
              {
                id: 'q1',
                question: 'Test review question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A'
              }
            ],
            userAnswers: { 'q1': 'B' },
            results: { score: 75, percentage: 75, correctCount: 0, incorrectCount: 1 }
          },
          metadata: { mode: 'review' }
        };
      } else if (screenName === 'ProfileView') {
        navParams = { userId: 'nav-test-user' };
      }
      
      // Debug: Log navigation attempt
      logger.info(`🧪 Attempting to navigate to ${screenName} from ${beforeRoute.name}`);
      
      this.navigation.navigate(screenName, navParams);
      
      // Wait for navigation to complete - increased timeout
      await this.delay(500);
      
      // Verify navigation success
      const newState = this.navigation.getState();
      const currentRoute = newState.routes[newState.index];
      
      // Debug: Log actual navigation result
      logger.info(`🧪 Navigation result: ${beforeRoute.name} → ${currentRoute.name} (expected ${screenName})`);
      
      if (currentRoute.name === screenName) {
        const responseTime = Date.now() - testStart;
        this.recordResult(screenName, 'SUCCESS', `Navigation completed in ${responseTime}ms`);
        return true;
      } else {
        this.recordResult(screenName, 'FAILED', `Expected ${screenName}, got ${currentRoute.name} (was ${beforeRoute.name})`);
        
        // Debug: If we're stuck on ReviewScreen, add extra info
        if (currentRoute.name === 'ReviewScreen') {
          logger.info(`🚨 STUCK ON REVIEWSCREEN: Route params:`, currentRoute.params);
          logger.info(`🚨 Navigation stack depth:`, newState.routes?.length);
        }
        
        return false;
      }
      
    } catch (error) {
      this.recordResult(screenName, 'ERROR', error.message);
      return false;
    }
  }

  /**
   * Test SafeBackButton functionality
   */
  async testBackNavigation() {
    logger.info('🔙 Testing back navigation...');
    
    try {
      // Navigate to a few screens first
      await this.testSingleNavigation('Upload', 'UploadScreen');
      await this.delay(200);
      
      // Test going back
      if (this.navigation.canGoBack()) {
        this.navigation.goBack();
        await this.delay(300);
        
        const state = this.navigation.getState();
        const currentRoute = state.routes[state.index];
        
        this.recordResult('BackNavigation', 'SUCCESS', `Returned to ${currentRoute.name}`);
        return true;
      } else {
        this.recordResult('BackNavigation', 'WARNING', 'canGoBack() returned false');
        return false;
      }
    } catch (error) {
      this.recordResult('BackNavigation', 'ERROR', error.message);
      return false;
    }
  }

  /**
   * Test deep linking and direct navigation
   */
  async testDeepNavigation() {
    logger.info('🔗 Testing deep navigation...');
    
    const deepNavTests = [
      { screen: 'ProfileView', params: { userId: 'test123' } },
      { screen: 'Quiz', params: { 
        mode: 'practice',
        quiz: {
          id: 'test-quiz-123',
          title: 'Test Quiz',
          questions: [
            {
              question: 'Test question?',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 'A'
            }
          ]
        }
      }},
      { screen: 'ResultsScreen', params: { 
        score: 85,
        quiz: {
          id: 'test-results-quiz',
          title: 'Test Results Quiz',
          questions: []
        }
      }}
    ];

    for (const test of deepNavTests) {
      try {
        this.navigation.navigate(test.screen, test.params);
        await this.delay(300);
        
        const state = this.navigation.getState();
        const currentRoute = state.routes[state.index];
        
        if (currentRoute.name === test.screen) {
          this.recordResult(`Deep_${test.screen}`, 'SUCCESS', 'Deep navigation successful');
        } else {
          this.recordResult(`Deep_${test.screen}`, 'FAILED', 'Deep navigation failed');
        }
      } catch (error) {
        this.recordResult(`Deep_${test.screen}`, 'ERROR', error.message);
      }
    }
  }

  /**
   * Record test result
   */
  recordResult(screenName, status, message, metadata = null) {
    const result = {
      screen: screenName,
      status,
      message,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    this.testResults.push(result);
    
    const emoji = status === 'SUCCESS' ? '✅' : status === 'ERROR' ? '❌' : '⚠️';
    logger.info(`${emoji} ${screenName}: ${message}`);
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const total = this.testResults.length;
    const success = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const warnings = this.testResults.filter(r => r.status === 'WARNING').length;
    const unavailable = this.testResults.filter(r => r.status === 'UNAVAILABLE').length;

    logger.info('📊 NAVIGATION TEST REPORT');
    logger.info('========================');
    logger.info(`Total Tests: ${total}`);
    logger.info(`✅ Success: ${success}`);
    logger.info(`❌ Failed: ${failed}`);
    logger.info(`🚫 Errors: ${errors}`);
    logger.info(`⚠️ Warnings: ${warnings}`);
    logger.info(`📵 Unavailable: ${unavailable}`);
    logger.info(`Success Rate: ${((success / total) * 100).toFixed(1)}%`);
    
    // Log problematic screens
    const problems = this.testResults.filter(r => r.status !== 'SUCCESS');
    if (problems.length > 0) {
      logger.info('\n🔍 ISSUES FOUND:');
      problems.forEach(p => {
        logger.info(`- ${p.screen}: ${p.status} - ${p.message}`);
      });
    }

    return {
      total,
      success,
      failed,
      errors,
      warnings,
      unavailable,
      successRate: (success / total) * 100,
      problems
    };
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current navigation state info
   */
  getNavigationInfo() {
    const state = this.navigation.getState();
    return {
      currentScreen: state.routes[state.index]?.name,
      availableScreens: state.routeNames || [],
      canGoBack: this.navigation.canGoBack(),
      stackDepth: state.routes?.length || 0
    };
  }
}

export default NavigationTester;