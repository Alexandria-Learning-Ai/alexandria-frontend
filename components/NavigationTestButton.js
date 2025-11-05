/**
 * NavigationTestButton - Development tool for testing navigation
 * Only shows in development mode
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NavigationTester from '../utils/NavigationTester';
import logger from '../utils/logger';


const NavigationTestButton = () => {
  const navigation = useNavigation();

  // Only show in development
  if (__DEV__ !== true) {
    return null;
  }

  const runNavigationTest = async () => {
    Alert.alert(
      'Navigation Test',
      'Choose a test option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '⭐ HomeV2 (Experimental)',
          onPress: () => {
            try {
              navigation.navigate('HomeV2');
              logger.info('Navigated to HomeV2 (Experimental Design)');
            } catch (error) {
              logger.error('Failed to navigate to HomeV2:', error);
              Alert.alert('Navigation Error', error.message);
            }
          }
        },
        {
          text: '🧪 Full Nav Test',
          onPress: async () => {
            const tester = new NavigationTester(navigation);

            try {
              // Run comprehensive navigation tests
              await tester.testAllNavigationPaths();
              await tester.testBackNavigation();
              await tester.testDeepNavigation();

              const report = tester.generateTestReport();

              Alert.alert(
                'Navigation Test Complete',
                `Success Rate: ${report.successRate.toFixed(1)}%\n` +
                `✅ Success: ${report.success}\n` +
                `❌ Issues: ${report.failed + report.errors}\n` +
                `Check console for details.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              logger.error('Navigation test failed:', error);
              Alert.alert('Test Error', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.testButton} onPress={runNavigationTest}>
      <Text style={styles.testButtonText}>🧪 Test Navigation</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  testButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  }
});

export default NavigationTestButton;