import Constants from 'expo-constants';

// Dynamically pull from app.json's "extra" field, fallback to a default if not set
export const API_BASE_URL =
  Constants?.expoConfig?.extra?.apiBaseUrl ||
  'https://alexandria-api-ywcw.onrender.com';

// Log configuration without importing logger to avoid circular dependency
console.log('🔗 [API] API Base URL configured:', API_BASE_URL);