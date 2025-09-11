import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import logger from '../utils/logger';


class TranslationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a translation-related error
    const isTranslationError = error?.message?.includes("Property 't") || 
                               error?.message?.includes("Property 'th") ||
                               error?.message?.includes("translation") ||
                               error?.stack?.includes("useTranslation");
    
    if (isTranslationError) {
      logger.warn('🌐 Translation error caught by boundary:', error.message);
      // Don't break the app for translation errors, just log them
      return { hasError: false, error: null };
    }
    
    // For other errors, show error boundary
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('🚨 Error caught by TranslationErrorBoundary:', error, errorInfo);
    
    // If it's a translation error, try to recover
    if (error?.message?.includes("Property 't") || 
        error?.message?.includes("Property 'th")) {
      logger.info('🔄 Attempting to recover from translation error...');
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Alexandria - Temporary Issue</Text>
          <Text style={styles.errorMessage}>
            The app encountered a minor issue. Please restart the app.
          </Text>
          <Text style={styles.errorDetails}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorDetails: {
    fontSize: 12,
    color: '#868e96',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

export default TranslationErrorBoundary;