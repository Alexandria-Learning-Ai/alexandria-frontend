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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  // ✅ UPDATED: Modified handleSignUp to redirect to Profile screen
  const handleSignUp = async () => {
    setIsLoading(true);

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // ✅ NEW: Mark that this user needs to complete their profile
      await AsyncStorage.setItem(`profileCompleted_${user.uid}`, 'false');
      
      // ✅ NEW: Store user's language preference using consistent keys
      await AsyncStorage.setItem(`userLanguage_${user.uid}`, currentLanguage);
      await AsyncStorage.setItem(`selectedLanguage_${user.uid}`, currentLanguage);
      await AsyncStorage.setItem('selectedLanguage', currentLanguage);
      
      Alert.alert(
        t('auth.accountCreated'), 
        t('auth.welcomeToAlexandria'),
        [
          {
            text: t('auth.continue'),
            onPress: () => {
              // ✅ NEW: Navigate to Terms screen for new users
              navigation.reset({
                index: 0,
                routes: [{ name: 'TermsAndAgreement' }]
              });
            }
          }
        ]
      );
      
    } catch (error) {
      let errorMessage = t('auth.signUpFailed');
      
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try logging in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      
      Alert.alert(t('auth.signUpFailedTitle'), errorMessage);
    } finally {
      setIsLoading(false);
    }
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

            {/* Form */}
            <Animated.View style={[styles.formContainer, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              {/* Email */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <FontAwesome5 name="envelope" size={16} color="#CBD5E0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.enterYourEmail')}
                    placeholderTextColor="#CBD5E0"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <FontAwesome5 name="lock" size={16} color="#CBD5E0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.createPassword')}
                    placeholderTextColor="#CBD5E0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Sign Up Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#D4AF37', '#B8941F']} style={styles.buttonGradient}>
                    {isLoading ? (
                      <Text style={styles.buttonText}>{t('auth.creating')}</Text>
                    ) : (
                      <>
                        <FontAwesome5 name="user-plus" size={16} color="#1A2C5B" />
                        <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Link to Login */}
              <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.linkText}>
                  {t('auth.alreadyHaveAccount')}
                  <Text style={styles.linkHighlight}> {t('auth.signIn')}</Text>
                </Text>
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
});