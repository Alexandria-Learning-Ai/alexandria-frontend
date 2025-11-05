import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { StudentProfileService } from '../services/StudentProfileService';
import SafeBackButton from '../components/SafeBackButton';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';


export default function SignUpScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // ✅ FIXED: Removed duplicate auth state handler - AppNavigator handles this now
  // The AppNavigator's onAuthStateChanged will handle navigation for authenticated users
  // This prevents navigation conflicts between multiple listeners

  // Initialize language preference on component mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Check for global language preference first
        const savedLanguage = await AsyncStorage.getItem('userLanguagePreference');
        const currentLang = i18n.language || 'en';
        
        // Only change if saved language exists, is different from current, and is valid
        if (savedLanguage && savedLanguage !== currentLang && ['en', 'es'].includes(savedLanguage)) {
          logger.info(`🔄 Initializing saved language: ${savedLanguage} (was: ${currentLang})`);
          await i18n.changeLanguage(savedLanguage);
          setCurrentLanguage(savedLanguage);
        } else {
          // Ensure state is synchronized with actual i18n language
          setCurrentLanguage(currentLang);
        }
      } catch (error) {
        logger.error('Error initializing language:', error);
        // Fallback to current i18n language
        setCurrentLanguage(i18n.language || 'en');
      }
    };

    initializeLanguage();
  }, []); // Empty dependency array to run only once

  // Language switching function
  const changeLanguage = async (language) => {
    try {
      // Validate language and only change if different from current
      if (!['en', 'es'].includes(language)) {
        logger.warn(`Invalid language code: ${language}`);
        return;
      }
      
      const currentLang = i18n.language || 'en';
      if (language !== currentLang) {
        logger.info(`🌍 Changing language from ${currentLang} to ${language}`);
        await i18n.changeLanguage(language);
        setCurrentLanguage(language);
        
        // Store language preference for future use with consistent keys
        await AsyncStorage.setItem('userLanguagePreference', language);
        await AsyncStorage.setItem('selectedLanguage', language);
        
        // Also store user-specific preference if user exists
        const user = auth.currentUser;
        if (user) {
          await AsyncStorage.setItem(`selectedLanguage_${user.uid}`, language);
          await AsyncStorage.setItem(`userLanguage_${user.uid}`, language);
        }
        
        logger.info(`✅ Language successfully changed to: ${language}`);
      } else {
        logger.info(`🔄 Language already set to ${language}, no change needed`);
      }
    } catch (error) {
      logger.error('Error changing language:', error);
    }
  };

  // Animation startup
  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Navigate to Login screen for existing users
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  // Navigate to ProfileSetup for new users
  const handleSignUp = () => {
    navigation.navigate('ProfileSetup');
  };

  const handleBackPress = () => {
    NavigationHelper.safeGoBack(navigation, 'Home');

    
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
      <LinearGradient colors={['#1A2C5B', '#2C467D']} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
              </TouchableOpacity>

              {/* Language Switcher */}
              <View style={styles.languageSwitcher}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    currentLanguage === 'en' && styles.languageButtonActive
                  ]}
                  onPress={() => changeLanguage('en')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.languageText,
                    currentLanguage === 'en' && styles.languageTextActive
                  ]}>
                    🇺🇸 EN
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    currentLanguage === 'es' && styles.languageButtonActive
                  ]}
                  onPress={() => changeLanguage('es')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.languageText,
                    currentLanguage === 'es' && styles.languageTextActive
                  ]}>
                    🇵🇷 ES
                  </Text>
                </TouchableOpacity>
              </View>

              <Animated.View style={[styles.titleSection, {
                opacity: titleAnim,
                transform: [{
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                  })
                }]
              }]}>
                <FontAwesome5 name="user-plus" size={40} color="#D4AF37" />
                <Text style={styles.title}>{t('auth.createAccountTitle')}</Text>
                <Text style={styles.subtitle}>{t('auth.beginJourney')}</Text>
              </Animated.View>
            </View>

            {/* Welcome Options */}
            <Animated.View style={[styles.formContainer, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              {/* Login Button (Primary) */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#D4AF37', '#B8941F']} style={styles.buttonGradient}>
                    <FontAwesome5 name="sign-in-alt" size={16} color="#1A2C5B" />
                    <Text style={styles.buttonText}>I have an account - Log In</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Sign Up Button (Secondary) */}
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
                activeOpacity={0.8}
              >
                <View style={styles.signUpButtonContent}>
                  <FontAwesome5 name="user-plus" size={16} color="#D4AF37" />
                  <Text style={styles.signUpButtonText}>Create New Account</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center', // This centers the content vertically
    paddingVertical: 20,      // Adds padding to avoid touching screen edges
  },
  header: {
    paddingTop: 50, // Keeps space for status bar
    paddingBottom: 20, // Reduced
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 50, // Match header paddingTop
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageSwitcher: {
    position: 'absolute',
    right: -10, // Move closer to corner
    top: 45, // Move slightly higher
    flexDirection: 'row',
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 20,
    padding: 3,
  },
  languageButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50, // Smaller since we're using shorter text
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#D4AF37',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E0',
  },
  languageTextActive: {
    color: '#1A2C5B',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 10, // Reduced
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#F8F4E3',
    marginTop: 12, // Reduced
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E0',
    marginTop: 6, // Reduced
    textAlign: 'center',
  },
  formContainer: {
    // Removed flex: 1 and justifyContent
    paddingBottom: 20, // Reduced
  },
  inputContainer: {
    marginBottom: 16, // Reduced
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: '#F8F4E3',
    paddingVertical: 16,
  },
  loginButton: {
    marginTop: 16, // Reduced
    marginBottom: 16, // Reduced
    borderRadius: 16,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2C5B',
    marginLeft: 8,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 12, // Reduced
  },
  linkText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#CBD5E0',
    textAlign: 'center',
  },
  linkHighlight: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(248, 244, 227, 0.2)',
  },
  dividerText: {
    color: '#CBD5E0',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 15,
  },
  signUpButton: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  signUpButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  signUpButtonText: {
    color: '#F8F4E3',
    fontSize: 16,
    fontWeight: '600',
  },
});