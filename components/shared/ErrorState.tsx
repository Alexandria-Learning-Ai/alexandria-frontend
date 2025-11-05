/**
 * ErrorState.tsx
 *
 * Reusable error state component with retry button
 * Shows friendly error messages with Alexandria theming
 *
 * Features:
 * - Friendly error icon and title
 * - User-friendly error message
 * - Optional retry button
 * - Consistent Alexandria theme
 * - Accessibility support
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import type { ThemeColors } from '../../types';

export interface ErrorStateProps {
  /** Error message to display */
  error: string;
  /** Optional title (defaults to "Oops!") */
  title?: string;
  /** Optional retry callback */
  onRetry?: () => void | Promise<void>;
  /** Is retry in progress */
  retrying?: boolean;
  /** Optional custom icon */
  icon?: string;
  /** Optional custom icon color */
  iconColor?: string;
  /** Theme colors */
  themeColors?: ThemeColors;
  /** Container style override */
  containerStyle?: object;
}

/**
 * ErrorState Component
 *
 * Displays error message with optional retry button
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Oops!',
  onRetry,
  retrying = false,
  icon = 'exclamation-circle',
  iconColor,
  themeColors,
  containerStyle,
}) => {
  // Default theme colors
  const colors = useMemo(
    () =>
      themeColors || {
        error: '#dc3545',
        text: '#F8F4E3',
        textSecondary: '#CBD5E0',
        alexandriaGold: '#D4AF37',
        background: '#1A2C5B',
        surface: '#2C467D',
      },
    [themeColors]
  );

  const handleRetry = async () => {
    if (onRetry && !retrying) {
      await onRetry();
    }
  };

  return (
    <View style={[styles.container, containerStyle]} accessibilityRole="alert">
      {/* Error Icon */}
      <FontAwesome5
        name={icon}
        size={64}
        color={iconColor || colors.error}
        style={styles.icon}
      />

      {/* Error Title */}
      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityLabel={title}
      >
        {title}
      </Text>

      {/* Error Message */}
      <Text
        style={[styles.message, { color: colors.textSecondary }]}
        accessibilityLabel={error}
      >
        {error}
      </Text>

      {/* Retry Button */}
      {onRetry && (
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: colors.alexandriaGold },
            retrying && styles.retryButtonDisabled,
          ]}
          onPress={handleRetry}
          disabled={retrying}
          activeOpacity={0.8}
          accessibilityLabel="Try again"
          accessibilityRole="button"
          accessibilityState={{ disabled: retrying }}
        >
          {retrying ? (
            <ActivityIndicator color="#1A2C5B" size="small" />
          ) : (
            <>
              <FontAwesome5
                name="redo"
                size={16}
                color="#1A2C5B"
                style={styles.retryIcon}
              />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    marginBottom: 24,
    opacity: 0.9,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 400,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#1A2C5B',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorState;
