import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';


/**
 * SafeBackButton - A universal back button component that handles navigation safely
 * 
 * @param {Object} props
 * @param {string} props.color - Icon color (default: '#F8F4E3')
 * @param {number} props.size - Icon size (default: 20)
 * @param {Object} props.style - Additional button styles
 * @param {Function} props.onPress - Custom press handler (optional)
 * @param {string} props.fallbackScreen - Screen to navigate to if goBack fails (default: 'Home')
 * @param {Object} props.confirmOptions - Alert options for confirmation (optional)
 * @param {boolean} props.disabled - Whether the button is disabled
 */
const SafeBackButton = ({
  color = '#F8F4E3',
  size = 20,
  style = {},
  onPress = null,
  fallbackScreen = 'Home',
  confirmOptions = null,
  disabled = false
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (disabled) return;

    // If custom onPress provided, use that
    if (onPress) {
      onPress();
      return;
    }

    // If confirmation required, show alert first
    if (confirmOptions) {
      Alert.alert(
        confirmOptions.title || 'Go Back',
        confirmOptions.message || 'Are you sure you want to go back?',
        [
          { text: confirmOptions.cancelText || 'Cancel', style: 'cancel' },
          { 
            text: confirmOptions.confirmText || 'Go Back', 
            style: confirmOptions.destructive ? 'destructive' : 'default',
            onPress: () => performNavigation()
          }
        ]
      );
      return;
    }

    performNavigation();
  };

  const performNavigation = () => {
    try {
      // Use the improved NavigationHelper for safe navigation
      const success = NavigationHelper.safeGoBack(navigation, fallbackScreen);
      
      if (!success) {
        logger.info('⚠️ SafeBackButton: All navigation attempts failed, staying on current screen');
      }
    } catch (error) {
      logger.error('❌ Navigation error in SafeBackButton:', error);
      // Don't reset navigation aggressively - just log the error
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={[styles.backButton, style]}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <FontAwesome5 
        name="arrow-left" 
        size={size} 
        color={disabled ? `${color}50` : color} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SafeBackButton;