import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ThemeColors {
  alexandriaGold: string;
  text: string;
  success: string;
  error: string;
  warning: string;
  [key: string]: string;
}

interface ResponseMessageProps {
  message: string | null;
  themeColors: ThemeColors;
  styles: any;
  type?: 'success' | 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * ResponseMessage - Enhanced feedback with actionable UX
 *
 * Features:
 * - Type-specific styling (success/error/warning/info)
 * - Animated entrance with slide and fade
 * - Icon based on message type
 * - Retry button for errors
 * - Dismiss button for all types
 * - Gradient background based on type
 * - Better error messaging with helpful suggestions
 * - Accessibility-compliant with proper roles
 *
 * Accessibility:
 * - accessibilityLabel for message content
 * - accessibilityRole for alert identification
 * - accessibilityLiveRegion for announcements
 * - Clear action buttons with labels
 */
const ResponseMessage: React.FC<ResponseMessageProps> = ({
  message,
  themeColors,
  styles,
  type = 'info',
  onRetry,
  onDismiss
}) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(iconBounce, {
          toValue: 1,
          tension: 80,
          friction: 8,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [message]);

  if (!message) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle',
          colors: ['rgba(40, 167, 69, 0.2)', 'rgba(40, 167, 69, 0.1)'],
          borderColor: themeColors.success,
          iconColor: themeColors.success,
        };
      case 'error':
        return {
          icon: 'exclamation-circle',
          colors: ['rgba(220, 53, 69, 0.2)', 'rgba(220, 53, 69, 0.1)'],
          borderColor: themeColors.error,
          iconColor: themeColors.error,
        };
      case 'warning':
        return {
          icon: 'exclamation-triangle',
          colors: ['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.1)'],
          borderColor: themeColors.warning,
          iconColor: themeColors.warning,
        };
      default:
        return {
          icon: 'info-circle',
          colors: [themeColors.alexandriaGold + '20', themeColors.alexandriaGold + '10'],
          borderColor: themeColors.alexandriaGold,
          iconColor: themeColors.alexandriaGold,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      style={[
        enhancedStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${type} message: ${message}`}
      accessibilityLiveRegion="polite"
    >
      <LinearGradient
        colors={config.colors}
        style={[
          styles.responseBox,
          enhancedStyles.messageBox,
          {
            borderColor: config.borderColor,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Icon */}
        <Animated.View
          style={[
            enhancedStyles.iconContainer,
            {
              transform: [{ scale: iconBounce }],
              backgroundColor: config.iconColor + '20',
              borderColor: config.iconColor,
            },
          ]}
        >
          <FontAwesome5
            name={config.icon}
            size={18}
            color={config.iconColor}
            solid
          />
        </Animated.View>

        {/* Message Content */}
        <View style={enhancedStyles.messageContent}>
          <Text
            style={[
              styles.responseText,
              enhancedStyles.messageText,
              { color: themeColors.text },
            ]}
          >
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={enhancedStyles.actionsContainer}>
            {type === 'error' && onRetry && (
              <TouchableOpacity
                style={[
                  enhancedStyles.actionButton,
                  enhancedStyles.retryButton,
                  { borderColor: themeColors.error },
                ]}
                onPress={onRetry}
                activeOpacity={0.8}
                accessibilityLabel="Retry upload"
                accessibilityRole="button"
                accessibilityHint="Attempts to upload the files again"
              >
                <FontAwesome5 name="redo" size={12} color={themeColors.error} />
                <Text style={[enhancedStyles.actionButtonText, { color: themeColors.error }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            )}

            {onDismiss && (
              <TouchableOpacity
                style={[
                  enhancedStyles.actionButton,
                  enhancedStyles.dismissButton,
                  { borderColor: config.iconColor },
                ]}
                onPress={onDismiss}
                activeOpacity={0.8}
                accessibilityLabel="Dismiss message"
                accessibilityRole="button"
              >
                <FontAwesome5 name="times" size={12} color={config.iconColor} />
                <Text style={[enhancedStyles.actionButtonText, { color: config.iconColor }]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const enhancedStyles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  messageBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(26, 44, 91, 0.2)',
  },
  retryButton: {
    marginRight: 4,
  },
  dismissButton: {},
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ResponseMessage;
