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
  ScrollView,
  ViewStyle,
  TextStyle
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../firebaseConfig';
import SafeBackButton from '../components/SafeBackButton';
import NavigationHelper from '../utils/NavigationHelper';
import { RootStackParamList } from '../types';

// Type definitions
type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

interface Styles {
  container: ViewStyle;
  keyboardView: ViewStyle;
  scrollContent: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  titleSection: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  formContainer: ViewStyle;
  instructionsContainer: ViewStyle;
  instructionsText: TextStyle;
  inputContainer: ViewStyle;
  inputWrapper: ViewStyle;
  inputIcon: TextStyle;
  input: TextStyle;
  resetButton: ViewStyle;
  buttonDisabled: ViewStyle;
  buttonGradient: ViewStyle;
  buttonText: TextStyle;
  successContainer: ViewStyle;
  successIcon: TextStyle;
  successTitle: TextStyle;
  successText: TextStyle;
  successSubtext: TextStyle;
  linkContainer: ViewStyle;
  linkText: TextStyle;
  linkHighlight: TextStyle;
}

/**
 * ForgotPasswordScreen - Allows users to reset their password via email
 *
 * Features:
 * - Email validation
 * - Firebase password reset integration
 * - Success/error state handling
 * - Animated UI with staggered entrance
 * - Custom error messages for better UX
 */
const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entry animations
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
  }, [fadeAnim, slideAnim, titleAnim]);

  const handlePasswordReset = async (): Promise<void> => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address to continue.");
      return;
    }

    setIsLoading(true);

    // Button press animation
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
      await sendPasswordResetEmail(auth, email);
      setIsEmailSent(true);
      Alert.alert(
        "Reset Email Sent!",
        "Please check your email for instructions to reset your password. Don't forget to check your spam folder.",
        [
          {
            text: "Got it",
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string };
      let errorMessage = firebaseError.message || "An error occurred. Please try again.";

      // Customize error messages for better UX
      if (firebaseError.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = "Too many reset attempts. Please try again later.";
      }

      Alert.alert("Reset Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = (): void => {
    NavigationHelper.safeGoBack(navigation, 'Login');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
      <LinearGradient
        colors={['#1A2C5B', '#2C467D']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Custom Header */}
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
                        outputRange: [-20, 0]
                      })
                    }]
                  }
                ]}
              >
                <FontAwesome5 name="key" size={40} color="#D4AF37" />
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>We'll help you regain access to Alexandria</Text>
              </Animated.View>
            </View>

            {/* Main Content */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {!isEmailSent ? (
                <>
                  {/* Instructions */}
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                      Enter your email address and we'll send you a link to reset your password.
                    </Text>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <FontAwesome5 name="envelope" size={16} color="#CBD5E0" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email address"
                        placeholderTextColor="#CBD5E0"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoFocus
                      />
                    </View>
                  </View>

                  {/* Send Reset Email Button */}
                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                      onPress={handlePasswordReset}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#D4AF37', '#B8941F']}
                        style={styles.buttonGradient}
                      >
                        {isLoading ? (
                          <Text style={styles.buttonText}>Sending Reset Email...</Text>
                        ) : (
                          <>
                            <FontAwesome5 name="paper-plane" size={16} color="#1A2C5B" />
                            <Text style={styles.buttonText}>Send Reset Email</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              ) : (
                // Success State
                <View style={styles.successContainer}>
                  <FontAwesome5 name="check-circle" size={60} color="#D4AF37" style={styles.successIcon} />
                  <Text style={styles.successTitle}>Email Sent!</Text>
                  <Text style={styles.successText}>
                    We've sent password reset instructions to {email}
                  </Text>
                  <Text style={styles.successSubtext}>
                    Check your inbox and spam folder. The link will expire in 1 hour.
                  </Text>
                </View>
              )}

              {/* Back to Login Link */}
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>
                  Remember your password?
                  <Text style={styles.linkHighlight}> Back to Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
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
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#F8F4E3',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E0',
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  instructionsContainer: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#CBD5E0',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 30,
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
  resetButton: {
    marginBottom: 30,
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
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8F4E3',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#CBD5E0',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  successSubtext: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4A5568',
    textAlign: 'center',
    fontWeight: '400',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
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

export default ForgotPasswordScreen;
