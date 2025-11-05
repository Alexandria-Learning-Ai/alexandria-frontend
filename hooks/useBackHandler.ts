/**
 * useBackHandler - Custom hook for handling Android back button
 *
 * Features:
 * - Intercept Android back button press
 * - Custom handler function
 * - Automatic cleanup
 * - iOS-safe (no-op on iOS)
 *
 * Usage:
 * ```tsx
 * useBackHandler(() => {
 *   // Handle back button press
 *   showExitModal();
 *   return true; // Prevent default back behavior
 * });
 * ```
 */

import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Custom hook to handle Android back button press
 *
 * @param handler - Function to call when back button is pressed
 *                  Return true to prevent default behavior, false to allow it
 */
export const useBackHandler = (handler: () => boolean): void => {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handler);

    return () => {
      backHandler.remove();
    };
  }, [handler]);
};

export default useBackHandler;
