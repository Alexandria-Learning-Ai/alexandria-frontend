// screens/TermsAndAgreementScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { StudentProfileService } from '../services/StudentProfileService';
import { API_BASE_URL } from '../config/api';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import logger from '../utils/logger';


const { width, height } = Dimensions.get('window');

export default function TermsAndAgreementScreen({ navigation, user, route }) {
  const { t, i18n } = useTranslation();
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollViewRef = useRef(null);
  
  useEffect(() => {
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
    ]).start();
  }, []);

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptTerms = async () => {
    if (!hasScrolledToBottom) {
      Alert.alert(
        t('terms.mustReadTitle'),
        t('terms.mustReadMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }
        ]
      );
      return;
    }

    setIsAccepting(true);

    try {
      // 🔒 SECURE FLOW: Account must already exist - ONLY handle terms acceptance
      const authenticatedUser = auth.currentUser;
      if (!authenticatedUser) {
        Alert.alert('Error', 'No authenticated user found. Please create your account first.');
        setIsAccepting(false);
        return;
      }

      logger.info('📋 User accepting terms for legal compliance:', authenticatedUser.uid);

      // 1. Load user profile for legal compliance context
      const userProfile = await StudentProfileService.getProfile(authenticatedUser.uid);

      // 2. Create comprehensive terms acceptance record
      const termsAcceptance = {
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0.0-beta',
        user_id: authenticatedUser.uid,
        user_email: authenticatedUser.email,
        device_info: `${Platform.OS}-${Device.osVersion || 'unknown'}`,
        language_preference: i18n.language || 'en',
        consent_method: 'explicit',
        terms_acceptance_context: 'post_account_creation',
        // Include existing profile data for legal compliance
        profile_data_context: userProfile ? {
          full_name: userProfile.fullName,
          education_level: userProfile.educationLevel,
          program: userProfile.program,
          creation_date: userProfile.createdAt
        } : null
      };

      // 3. Store terms acceptance locally (required for app access)
      await AsyncStorage.setItem(`termsAccepted_${authenticatedUser.uid}`, JSON.stringify(termsAcceptance));

      // 4. Send to legal compliance dashboard
      try {
        await fetch(`${API_BASE_URL}/api/legal/terms-acceptance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Alexandria-Mobile-App',
            'X-User-ID': authenticatedUser.uid,
          },
          body: JSON.stringify(termsAcceptance),
        });
        logger.info('✅ Terms acceptance sent to legal compliance dashboard');
      } catch (error) {
        logger.error('❌ Failed to send terms to legal dashboard (continuing anyway):', error);
      }

      // 5. 🔒 CRITICAL: Mark profile as fully completed (unlocks app access)
      await AsyncStorage.setItem(`profileCompleted_${authenticatedUser.uid}`, 'true');

      logger.info('✅ Terms accepted, user now has full app access');

      // 6. Trigger AppNavigator state refresh - it will automatically navigate
      setIsAccepting(false);

      // Show welcome message with navigation trigger on button press
      try {
        Alert.alert(
          '🎉 Welcome to Alexandria!',
          'Terms accepted! You now have full access to all features.',
          [{
            text: 'Get Started',
            onPress: () => {
              logger.info('🚀 User clicked "Get Started" - navigating to Home');

              try {
                // Use direct navigation - this should work since Home is included in the needsTerms stack
                navigation.navigate('Home');
                logger.info('✅ Navigation to Home successful');
              } catch (error) {
                logger.error('❌ Direct navigation failed, trying reset:', error);
                try {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                  logger.info('✅ Navigation reset to Home successful');
                } catch (resetError) {
                  logger.error('❌ Reset navigation also failed:', resetError);
                }
              }
            }
          }]
        );

      } catch (error) {
        logger.error('❌ Error during terms completion:', error);
        Alert.alert('Error', 'Terms were accepted but navigation failed. Please restart the app.');
      }

    } catch (error) {
      logger.error('❌ Failed to process terms acceptance:', error);
      Alert.alert('Error', 'Failed to process terms acceptance. Please try again.');
      setIsAccepting(false);
    }
  };

  const handleDeclineTerms = () => {
    Alert.alert(
      t('terms.declineTitle'),
      t('terms.declineMessage'),
      [
        {
          text: t('terms.reviewAgain'),
          style: 'cancel',
          onPress: () => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }
        },
        {
          text: t('terms.exitApp'),
          style: 'destructive',
          onPress: () => {
            // Sign out - AppNavigator will handle navigation automatically
            auth.signOut();
          }
        }
      ]
    );
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
      <LinearGradient colors={['#1A2C5B', '#2C467D']} style={styles.container}>
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerIcon}>
            <FontAwesome5 name="shield-alt" size={32} color="#D4AF37" />
          </View>
          <Text style={styles.title}>{t('terms.title')}</Text>
          <Text style={styles.subtitle}>{t('terms.subtitle')}</Text>
          <Text style={styles.dateText}>
            {t('terms.effectiveDate')}: {getCurrentDate()}
          </Text>
        </Animated.View>

        {/* Terms Content */}
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            
            {/* Beta Testing Agreement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="flask" size={16} color="#D4AF37" /> {t('terms.betaTestingTitle')}
              </Text>
              <Text style={styles.sectionText}>
                {t('terms.betaTestingContent')}
              </Text>
            </View>

            {/* Non-Disclosure Agreement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="eye-slash" size={16} color="#D4AF37" /> {t('terms.ndaTitle')}
              </Text>
              <Text style={styles.sectionText}>
                {t('terms.ndaContent')}
              </Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• {t('terms.ndaBullet1')}</Text>
                <Text style={styles.bulletPoint}>• {t('terms.ndaBullet2')}</Text>
                <Text style={styles.bulletPoint}>• {t('terms.ndaBullet3')}</Text>
                <Text style={styles.bulletPoint}>• {t('terms.ndaBullet4')}</Text>
              </View>
            </View>

            {/* Intellectual Property Protection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="copyright" size={16} color="#D4AF37" /> {t('terms.ipTitle')}
              </Text>
              <Text style={styles.sectionText}>
                {t('terms.ipContent')}
              </Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• {t('terms.ipBullet1')}</Text>
                <Text style={styles.bulletPoint}>• {t('terms.ipBullet2')}</Text>
                <Text style={styles.bulletPoint}>• {t('terms.ipBullet3')}</Text>
                <Text style={styles.bulletPoint}>• {t('terms.ipBullet4')}</Text>
              </View>
            </View>

            {/* Non-Compete Agreement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="handshake" size={16} color="#D4AF37" /> {t('terms.nonCompeteTitle')}
              </Text>
              <Text style={styles.sectionText}>
                {t('terms.nonCompeteContent')}
              </Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• {t('terms.nonCompeteBullet1')}</Text>
                <Text style={styles.bulletPoint}>• {t('terms.nonCompeteBullet2')}</Text>
                <Text style={styles.bulletPoint}>• {t('terms.nonCompeteBullet3')}</Text>
              </View>
            </View>

            {/* Data Protection & Privacy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="user-shield" size={16} color="#D4AF37" /> {t('terms.privacyTitle')}
              </Text>
              <Text style={styles.sectionText}>
                {t('terms.privacyContent')}
              </Text>
            </View>

            {/* Liability & Disclaimer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="exclamation-triangle" size={16} color="#D4AF37" /> {t('terms.liabilityTitle')}
              </Text>
              <Text style={styles.sectionText}>
                {t('terms.liabilityContent')}
              </Text>
            </View>

            {/* Termination */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="times-circle" size={16} color="#D4AF37" /> {t('terms.terminationTitle')}
              </Text>
              <Text style={styles.sectionText}>
                {t('terms.terminationContent')}
              </Text>
            </View>

            {/* Contact Information */}
            <View style={[styles.section, styles.lastSection]}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="envelope" size={16} color="#D4AF37" /> {t('terms.contactTitle')}
              </Text>
              <Text style={styles.sectionText}>
                {t('terms.contactContent')}
              </Text>
            </View>

          </ScrollView>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Scroll Indicator */}
          {!hasScrolledToBottom && (
            <View style={styles.scrollIndicator}>
              <FontAwesome5 name="arrow-down" size={12} color="#CBD5E0" />
              <Text style={styles.scrollText}>{t('terms.scrollToEnd')}</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            {/* Decline Button */}
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDeclineTerms}
              activeOpacity={0.8}
            >
              <Text style={styles.declineButtonText}>
                {t('terms.decline')}
              </Text>
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={[
                styles.acceptButton,
                (!hasScrolledToBottom || isAccepting) && styles.acceptButtonDisabled
              ]}
              onPress={handleAcceptTerms}
              disabled={!hasScrolledToBottom || isAccepting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  hasScrolledToBottom && !isAccepting
                    ? ['#D4AF37', '#B8941F']
                    : ['#666666', '#555555']
                }
                style={styles.acceptButtonGradient}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="#1A2C5B" />
                ) : (
                  <View style={styles.acceptButtonContent}>
                    <FontAwesome5 name="check" size={16} color="#1A2C5B" />
                    <Text style={styles.acceptButtonText}>
                      {t('terms.accept')}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8F4E3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5E0',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'rgba(248, 244, 227, 0.05)',
    borderRadius: 16,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 12,
    lineHeight: 24,
  },
  sectionText: {
    fontSize: 14,
    color: '#F8F4E3',
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletPoints: {
    marginTop: 12,
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#CBD5E0',
    lineHeight: 20,
    marginBottom: 6,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scrollText: {
    fontSize: 12,
    color: '#CBD5E0',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E0',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonDisabled: {
    opacity: 0.5,
  },
  acceptButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2C5B',
    marginLeft: 8,
  },
});