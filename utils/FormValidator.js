/**
 * FormValidator - Comprehensive form validation system
 * Provides client-side validation with security-focused input sanitization
 */

import { Alert } from 'react-native';

export class FormValidator {
  static XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<link\b/gi,
    /<meta\b/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<\s*\/?\s*[a-z]/gi
  ];

  static SQL_INJECTION_PATTERNS = [
    /('|(\\'))|(;|\/\*|\*\/|@@|@|\b(select|union|insert|update|delete|drop|create|alter|exec|execute|script)\b)/gi,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|((\%3B)|;))/gi,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))\b/gi,
    /((\%27)|(\'))((\%75)|u|(\%55))((\%6E)|n|(\%4E))((\%69)|i|(\%49))((\%6F)|o|(\%4F))((\%6E)|n|(\%4E))/gi,
    /((\%27)|(\'))((\%73)|s|(\%53))((\%65)|e|(\%45))((\%6C)|l|(\%4C))((\%65)|e|(\%45))((\%63)|c|(\%43))((\%74)|t|(\%54))/gi
  ];

  static RULES = {
    required: (value, message = 'This field is required') => ({
      test: value !== null && value !== undefined && String(value).trim() !== '',
      message
    }),

    minLength: (min, message) => (value, customMessage) => ({
      test: !value || String(value).length >= min,
      message: customMessage || message || `Must be at least ${min} characters long`
    }),

    maxLength: (max, message) => (value, customMessage) => ({
      test: !value || String(value).length <= max,
      message: customMessage || message || `Must be no more than ${max} characters long`
    }),

    email: (value, message = 'Please enter a valid email address') => ({
      test: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message
    }),

    phone: (value, message = 'Please enter a valid phone number') => ({
      test: !value || /^\+?[\d\s\-\(\)]{7,15}$/.test(value.replace(/\s/g, '')),
      message
    }),

    strongPassword: (value, message = 'Password must contain uppercase, lowercase, number, and special character') => ({
      test: !value || (
        /(?=.*[a-z])/.test(value) &&
        /(?=.*[A-Z])/.test(value) &&
        /(?=.*\d)/.test(value) &&
        /(?=.*[@$!%*?&])/.test(value) &&
        value.length >= 8
      ),
      message
    }),

    noXSS: (value, message = 'Invalid characters detected') => ({
      test: !value || !FormValidator.XSS_PATTERNS.some(pattern => pattern.test(value)),
      message
    }),

    noSQLInjection: (value, message = 'Invalid input detected') => ({
      test: !value || !FormValidator.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value)),
      message
    }),

    alphanumeric: (value, message = 'Only letters and numbers are allowed') => ({
      test: !value || /^[a-zA-Z0-9\s]*$/.test(value),
      message
    }),

    numeric: (value, message = 'Only numbers are allowed') => ({
      test: !value || /^\d+(\.\d+)?$/.test(value),
      message
    }),

    url: (value, message = 'Please enter a valid URL') => ({
      test: !value || /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(value),
      message
    }),

    fileSize: (maxSize, message) => (file, customMessage) => ({
      test: !file || !file.size || file.size <= maxSize,
      message: customMessage || message || `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    }),

    fileType: (allowedTypes, message) => (file, customMessage) => ({
      test: !file || !file.type || allowedTypes.some(type => 
        file.type.includes(type) || file.name?.toLowerCase().endsWith(`.${type}`)
      ),
      message: customMessage || message || `Only ${allowedTypes.join(', ')} files are allowed`
    }),

    custom: (testFunction, message) => (value, customMessage) => ({
      test: testFunction(value),
      message: customMessage || message
    })
  };

  constructor() {
    this.errors = {};
    this.rules = {};
    this.touched = new Set();
  }

  /**
   * Add validation rules for a field
   */
  addRules(field, rules) {
    this.rules[field] = rules;
    return this;
  }

  /**
   * Validate a single field
   */
  validateField(field, value, showErrors = true) {
    const fieldRules = this.rules[field] || [];
    const fieldErrors = [];

    // Security checks first
    if (typeof value === 'string') {
      const securityCheck = this.performSecurityChecks(value);
      if (!securityCheck.isValid) {
        fieldErrors.push(securityCheck.message);
      }
    }

    // Apply field-specific rules
    for (const rule of fieldRules) {
      const result = rule(value);
      if (!result.test) {
        fieldErrors.push(result.message);
      }
    }

    // Update errors
    if (fieldErrors.length > 0) {
      this.errors[field] = fieldErrors;
    } else {
      delete this.errors[field];
    }

    // Mark field as touched
    this.touched.add(field);

    // Show error alert if requested
    if (showErrors && fieldErrors.length > 0) {
      Alert.alert('Validation Error', fieldErrors[0]);
    }

    return {
      isValid: fieldErrors.length === 0,
      errors: fieldErrors
    };
  }

  /**
   * Validate all fields in a form
   */
  validateForm(formData, showErrors = true) {
    this.errors = {};
    let isValid = true;
    const allErrors = {};

    for (const [field, value] of Object.entries(formData)) {
      const result = this.validateField(field, value, false);
      if (!result.isValid) {
        isValid = false;
        allErrors[field] = result.errors;
      }
    }

    // Show first error if validation fails
    if (!isValid && showErrors) {
      const firstError = Object.values(allErrors)[0][0];
      Alert.alert('Validation Error', firstError);
    }

    return {
      isValid,
      errors: allErrors
    };
  }

  /**
   * Perform security checks on input
   */
  performSecurityChecks(value) {
    if (!value || typeof value !== 'string') {
      return { isValid: true };
    }

    // Check for XSS attempts
    for (const pattern of FormValidator.XSS_PATTERNS) {
      if (pattern.test(value)) {
        return {
          isValid: false,
          message: 'Invalid characters detected. Please remove any script tags or JavaScript code.'
        };
      }
    }

    // Check for SQL injection attempts
    for (const pattern of FormValidator.SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        return {
          isValid: false,
          message: 'Invalid input detected. Please avoid using SQL keywords or special characters.'
        };
      }
    }

    // Check for excessive length (potential DoS)
    if (value.length > 10000) {
      return {
        isValid: false,
        message: 'Input is too long. Please limit your input to a reasonable length.'
      };
    }

    return { isValid: true };
  }

  /**
   * Sanitize input to remove potentially harmful content
   */
  static sanitizeInput(value) {
    if (!value || typeof value !== 'string') {
      return value;
    }

    let sanitized = value;

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove JavaScript protocols
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Encode special characters
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };

    sanitized = sanitized.replace(/[&<>"'\/]/g, (char) => entityMap[char]);

    return sanitized;
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field) {
    return this.errors[field] || [];
  }

  /**
   * Check if a field has errors
   */
  hasFieldErrors(field) {
    return !!(this.errors[field] && this.errors[field].length > 0);
  }

  /**
   * Check if field has been touched
   */
  isFieldTouched(field) {
    return this.touched.has(field);
  }

  /**
   * Clear errors for a specific field
   */
  clearFieldErrors(field) {
    delete this.errors[field];
  }

  /**
   * Clear all errors
   */
  clearAllErrors() {
    this.errors = {};
    this.touched = new Set();
  }

  /**
   * Get all errors
   */
  getAllErrors() {
    return this.errors;
  }

  /**
   * Check if form is valid
   */
  isValid() {
    return Object.keys(this.errors).length === 0;
  }

  /**
   * Get validation summary
   */
  getSummary() {
    const totalFields = Object.keys(this.rules).length;
    const errorCount = Object.keys(this.errors).length;
    const touchedCount = this.touched.size;

    return {
      totalFields,
      validFields: totalFields - errorCount,
      errorFields: errorCount,
      touchedFields: touchedCount,
      isValid: errorCount === 0
    };
  }

  /**
   * Static convenience method for email validation
   */
  static validateEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Static convenience method for password validation
   */
  static validatePassword(password) {
    const errors = [];

    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Static convenience method for required field validation
   */
  static validateRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  }
}

/**
 * Enhanced validator with built-in security rules
 */
export class SecureFormValidator extends FormValidator {
  constructor() {
    super();
    this.securityLevel = 'high'; // low, medium, high
  }

  setSecurityLevel(level) {
    this.securityLevel = level;
  }

  validateField(field, value, showErrors = true) {
    // Apply security level rules
    if (this.securityLevel === 'high') {
      this.applyHighSecurityRules(field, value);
    } else if (this.securityLevel === 'medium') {
      this.applyMediumSecurityRules(field, value);
    }

    return super.validateField(field, value, showErrors);
  }

  applyHighSecurityRules(field, value) {
    // Auto-add security rules for high security level
    const existingRules = this.rules[field] || [];
    
    // Add XSS protection
    if (!existingRules.some(rule => rule.name === 'noXSS')) {
      existingRules.push(FormValidator.RULES.noXSS);
    }

    // Add SQL injection protection
    if (!existingRules.some(rule => rule.name === 'noSQLInjection')) {
      existingRules.push(FormValidator.RULES.noSQLInjection);
    }

    // Length limits for security
    if (!existingRules.some(rule => rule.name === 'maxLength')) {
      existingRules.push(FormValidator.RULES.maxLength(1000));
    }

    this.rules[field] = existingRules;
  }

  applyMediumSecurityRules(field, value) {
    // Apply medium security rules
    const existingRules = this.rules[field] || [];
    
    if (!existingRules.some(rule => rule.name === 'noXSS')) {
      existingRules.push(FormValidator.RULES.noXSS);
    }

    if (!existingRules.some(rule => rule.name === 'maxLength')) {
      existingRules.push(FormValidator.RULES.maxLength(5000));
    }

    this.rules[field] = existingRules;
  }
}

/**
 * Real-time validator for immediate feedback
 */
export class RealTimeValidator extends SecureFormValidator {
  constructor(onValidationChange) {
    super();
    this.onValidationChange = onValidationChange;
    this.debounceTimers = {};
  }

  validateField(field, value, showErrors = false, debounceMs = 300) {
    // Clear existing debounce timer
    if (this.debounceTimers[field]) {
      clearTimeout(this.debounceTimers[field]);
    }

    // Debounce validation
    this.debounceTimers[field] = setTimeout(() => {
      const result = super.validateField(field, value, showErrors);
      
      if (this.onValidationChange) {
        this.onValidationChange(field, result, this.getSummary());
      }
      
      delete this.debounceTimers[field];
    }, debounceMs);
  }
}

// Export validation rules for custom use
export { FormValidator as default };
export const ValidationRules = FormValidator.RULES;