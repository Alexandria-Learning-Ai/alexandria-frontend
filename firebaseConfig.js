import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Secure Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "AIzaSyA_vYAAT3Dd5uBm4FFsgmaS197iHR9_R6c",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "alexandria-cd3e4.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "alexandria-cd3e4",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "alexandria-cd3e4.appspot.com",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "971870601041",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "1:971870601041:ios:65a4bca17562a746da9d70"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
