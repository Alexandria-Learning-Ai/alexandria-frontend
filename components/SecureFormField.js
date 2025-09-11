/**
 * SecureFormField - Enhanced form input component with built-in validation
 * Provides security-focused input handling with real-time validation feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { FormValidator, SecureFormValidator, RealTimeValidator } from '../utils/FormValidator';
import { haptic } from '../utils/HapticManager';

export const SecureFormField = ({
  label,
  value,
  onChangeText,
  validationRules = [],
  secureTextEntry = false,
  keyboardType = 'default',
  placeholder = '',
  multiline = false,
  numberOfLines = 1,
  maxLength = null,
  style = {},
  containerStyle = {},
  labelStyle = {},
  errorStyle = {},
  showCharacterCount = false,
  realTimeValidation = true,
  securityLevel = 'high', // low, medium, high
  autoCorrect = true,
  autoCapitalize = 'sentences',
  returnKeyType = 'done',
  onSubmitEditing = null,
  editable = true,
  selectTextOnFocus = false,
  clearButtonMode = 'while-editing',
  leftIcon = null,
  rightIcon = null,
  onRightIconPress = null,
  testID = null,
  accessibilityLabel = null,
  theme = 'light', // light, dark
  animated = true,
  showValidationIcon = true,
  customValidator = null,
  onValidationChange = null,
  debounceMs = 300
}) => {
  const [errors, setErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  
  const inputRef = useRef(null);
  const validatorRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Initialize validator
  useEffect(() => {
    const validator = realTimeValidation 
      ? new RealTimeValidator(handleValidationChange)
      : new SecureFormValidator();
    
    validator.setSecurityLevel(securityLevel);
    validator.addRules('field', validationRules);
    
    if (customValidator) {
      validator.addRules('field', [...validationRules, customValidator]);
    }
    
    validatorRef.current = validator;
  }, [validationRules, securityLevel, customValidator, realTimeValidation]);

  const handleValidationChange = (field, result, summary) => {
    setErrors(result.errors);
    setIsValid(result.isValid);
    
    if (onValidationChange) {
      onValidationChange(result.isValid, result.errors, summary);
    }

    // Haptic feedback for validation errors
    if (!result.isValid && isTouched) {
      haptic.error();
      shakeAnimation();
    }
  };

  const shakeAnimation = () => {
    if (!animated) return;
    
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const fadeInAnimation = () => {
    if (!animated) return;
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOutAnimation = () => {
    if (!animated) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (errors.length > 0 && isTouched) {
      fadeInAnimation();
    } else {
      fadeOutAnimation();
    }
  }, [errors, isTouched]);

  const handleTextChange = (text) => {
    // Sanitize input for security
    const sanitizedText = FormValidator.sanitizeInput(text);
    
    if (onChangeText) {
      onChangeText(sanitizedText);
    }

    // Validate if real-time validation is enabled
    if (realTimeValidation && validatorRef.current && isTouched) {
      validatorRef.current.validateField('field', sanitizedText, false, debounceMs);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    haptic.light();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsTouched(true);

    // Validate on blur
    if (validatorRef.current) {
      const result = validatorRef.current.validateField('field', value, false);
      setErrors(result.errors);
      setIsValid(result.isValid);
      
      if (onValidationChange) {
        onValidationChange(result.isValid, result.errors, validatorRef.current.getSummary());
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    haptic.selection();
  };

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      togglePasswordVisibility();
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const getThemeStyles = () => {
    const isDark = theme === 'dark';
    
    return {
      container: {
        backgroundColor: isDark ? '#2D3748' : '#FFFFFF',
        borderColor: getInputBorderColor(isDark),
      },
      label: {
        color: isDark ? '#E2E8F0' : '#2D3748',
      },
      input: {
        color: isDark ? '#FFFFFF' : '#2D3748',
      },
      error: {
        color: '#E53E3E',
      },
      characterCount: {
        color: isDark ? '#A0AEC0' : '#718096',
      }
    };
  };

  const getInputBorderColor = (isDark) => {
    if (!isValid && isTouched) {
      return '#E53E3E'; // Error red
    } else if (isFocused) {
      return '#4299E1'; // Focus blue
    } else if (isValid && isTouched && value) {
      return '#38A169'; // Success green
    } else {
      return isDark ? '#4A5568' : '#E2E8F0'; // Default border
    }
  };

  const getValidationIcon = () => {
    if (!showValidationIcon || !isTouched || !value) return null;

    if (isValid) {
      return (
        <FontAwesome5 
          name="check-circle" 
          size={20} 
          color="#38A169"
          style={styles.validationIcon}
        />
      );
    } else {
      return (
        <FontAwesome5 
          name="exclamation-circle" 
          size={20} 
          color="#E53E3E"
          style={styles.validationIcon}
        />
      );
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <Animated.View 
      style={[
        styles.container, 
        themeStyles.container,
        containerStyle,
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      {label && (
        <Text 
          style={[styles.label, themeStyles.label, labelStyle]}
          accessibilityLabel={`${label} input field`}
        >
          {label}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            themeStyles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry || showValidationIcon) && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            style
          ]}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={theme === 'dark' ? '#A0AEC0' : '#A0AEC0'}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          editable={editable}
          selectTextOnFocus={selectTextOnFocus}
          clearButtonMode={Platform.OS === 'ios' ? clearButtonMode : undefined}
          testID={testID}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={errors.length > 0 ? `Has ${errors.length} validation error${errors.length > 1 ? 's' : ''}` : undefined}
        />
        
        <View style={styles.rightIconContainer}>
          {getValidationIcon()}
          
          {(rightIcon || secureTextEntry) && (
            <TouchableOpacity 
              onPress={handleRightIconPress}
              style={styles.rightIcon}
              accessibilityLabel={secureTextEntry ? (showPassword ? 'Hide password' : 'Show password') : 'Action button'}
            >
              {secureTextEntry ? (
                <FontAwesome5 
                  name={showPassword ? 'eye-slash' : 'eye'} 
                  size={20} 
                  color={theme === 'dark' ? '#A0AEC0' : '#718096'} 
                />
              ) : (
                rightIcon
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Character Count */}
      {showCharacterCount && maxLength && (
        <Text style={[styles.characterCount, themeStyles.characterCount]}>
          {value ? value.length : 0} / {maxLength}
        </Text>
      )}
      
      {/* Error Messages */}
      {errors.length > 0 && isTouched && (
        <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
          {errors.map((error, index) => (
            <Text 
              key={index} 
              style={[styles.errorText, themeStyles.error, errorStyle]}
              accessibilityLiveRegion="polite"
            >
              • {error}
            </Text>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    minHeight: 20,
  },
  inputWithLeftIcon: {
    marginLeft: 12,
  },
  inputWithRightIcon: {
    marginRight: 12,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 60,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIcon: {
    padding: 4,
  },
  validationIcon: {
    marginRight: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SecureFormField;