import Constants from 'expo-constants';
import logger from '../utils/logger';

// Dynamically pull from app.json's "extra" field, fallback to a default if not set
export const API_BASE_URL =
  Constants?.expoConfig?.extra?.apiBaseUrl ||
  'https://alexandria-api-ywcw.onrender.com';

logger.api('API Base URL configured:', API_BASE_URL);