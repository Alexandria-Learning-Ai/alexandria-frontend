/**
 * Toast - Alexandria-themed toast notification component
 *
 * Features:
 * - Success, error, warning, and info variants
 * - Animated slide-in from top
 * - Auto-dismiss after configurable duration
 * - Manual dismiss option
 * - Icon support (FontAwesome5)
 * - Alexandria theme styling
 * - Multiple toasts stacking support
 *
 * Usage:
 * ```tsx
 * import { useToast } from '../hooks/useToast';
 *
 * const { showToast } = useToast();
 * showToast('Success!', 'Your progress has been saved', 'success');
 * ```
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type,
  duration = 3000,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Get theme colors based on type
  const getThemeColors = () => {
    switch (type) {
      case 'success':
        return {
          background: '#28a745',
          icon: 'check-circle',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      case 'error':
        return {
          background: '#dc3545',
          icon: 'times-circle',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      case 'warning':
        return {
          background: '#FFD700',
          icon: 'exclamation-triangle',
          iconColor: '#1A2C5B',
          textColor: '#1A2C5B',
        };
      case 'info':
        return {
          background: '#D4AF37',
          icon: 'info-circle',
          iconColor: '#1A2C5B',
          textColor: '#1A2C5B',
        };
      default:
        return {
          background: '#1A2C5B',
          icon: 'info-circle',
          iconColor: '#F8F4E3',
          textColor: '#F8F4E3',
        };
    }
  };

  const themeColors = getThemeColors();

  // Slide in animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  // Dismiss animation
  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.background,
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <FontAwesome5
            name={themeColors.icon}
            size={20}
            color={themeColors.iconColor}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[styles.title, { color: themeColors.textColor }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {message && (
            <Text
              style={[styles.message, { color: themeColors.textColor }]}
              numberOfLines={3}
            >
              {message}
            </Text>
          )}
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={dismissToast}
          style={styles.dismissButton}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name="times"
            size={16}
            color={themeColors.iconColor}
          />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.9,
    marginTop: 2,
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
});

export default Toast;
