/**
 * useToast - Custom hook for managing toast notifications
 *
 * Features:
 * - Show toast notifications from anywhere in the app
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Toast queue management
 * - Maximum 3 toasts visible at once
 *
 * Usage:
 * ```tsx
 * import { useToast } from '../hooks/useToast';
 *
 * const MyComponent = () => {
 *   const { showToast } = useToast();
 *
 *   const handleSuccess = () => {
 *     showToast('Success!', 'Your progress has been saved', 'success');
 *   };
 *
 *   return <Button onPress={handleSuccess} title="Save" />;
 * };
 * ```
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { ToastType } from '../components/shared/Toast';

interface ToastData {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Provider - Wrap your app with this to enable toast notifications
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const MAX_TOASTS = 3; // Maximum number of toasts to show at once

  /**
   * Show a new toast notification
   */
  const showToast = (
    title: string,
    message?: string,
    type: ToastType = 'info',
    duration: number = 3000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastData = { id, title, message, type, duration };

    setToasts((prevToasts) => {
      // If at max capacity, remove the oldest toast
      const updatedToasts = prevToasts.length >= MAX_TOASTS
        ? prevToasts.slice(1)
        : prevToasts;

      return [...updatedToasts, newToast];
    });
  };

  /**
   * Hide a specific toast
   */
  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Render toasts */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <View key={toast.id} style={{ marginTop: index > 0 ? 8 : 0 }}>
            <Toast
              id={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onDismiss={hideToast}
            />
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to access toast functionality
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
