import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudentProfileService } from '../services/StudentProfileService';
import SafeBackButton from '../components/SafeBackButton';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';


export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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

  const handleLogin = async () => {
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
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // ✅ FIXED: Let AppNavigator handle the navigation logic through onAuthStateChanged
      // Just show success message and let the global auth handler take care of routing
      logger.info('✅ Login successful for user:', user.uid);
      
      // Optional: Show a brief success message without blocking navigation
      // Alert.alert(t('auth.welcomeBackAlert'), t('auth.signInSuccess'));
    } catch (error) {
      const fallback = "An error occurred. Please check your credentials and try again.";
      Alert.alert("Sign In Failed", error.message || fallback);
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.titleSection,
                  {
                    opacity: titleAnim,
                    transform: [{
                      translateY: titleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      })
                    }]
                  }
                ]}
              >
                <FontAwesome5 name="book" size={40} color="#D4AF37" />
                <Text style={styles.title}>{t('auth.welcomeBackTitle')}</Text>
                <Text style={styles.subtitle}>{t('auth.continueJourney')}</Text>
              </Animated.View>
            </View>

            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Email */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <FontAwesome5 name="envelope" size={16} color="#CBD5E0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.enterEmail')}
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
                    placeholder={t('auth.enterPassword')}
                    placeholderTextColor="#CBD5E0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.forgotContainer} activeOpacity={0.7}>
                <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>

              {/* Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#D4AF37', '#B8941F']} style={styles.buttonGradient}>
                    {isLoading ? (
                      <Text style={styles.buttonText}>{t('auth.signingIn')}</Text>
                    ) : (
                      <>
                        <FontAwesome5 name="sign-in-alt" size={16} color="#1A2C5B" />
                        <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Sign Up */}
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => navigation.navigate('SignUpScreen')}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>
                  {t('auth.newToAlexandria')}
                  <Text style={styles.linkHighlight}> {t('auth.createAccount')}</Text>
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
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center', // This centers the content vertically
    paddingVertical: 20,      // Adds padding to avoid touching screen edges
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20, // Reduced
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16, // Reduced
  },
  forgotText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
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