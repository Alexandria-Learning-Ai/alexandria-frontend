import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import logger from './utils/logger';

// SECURITY: Firebase configuration
// These values should be moved to app.json "extra" section or environment variables
// For production, enable Firebase App Check to prevent API abuse
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.FIREBASE_API_KEY || "AIzaSyA_vYAAT3Dd5uBm4FFsgmaS197iHR9_R6c",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN || "alexandria-cd3e4.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID || "alexandria-cd3e4",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET || "alexandria-cd3e4.appspot.com",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || "971870601041",
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.FIREBASE_APP_ID || "1:971870601041:ios:65a4bca17562a746da9d70"
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  logger.error('❌ Firebase configuration is incomplete. Check your environment variables.');
}

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
