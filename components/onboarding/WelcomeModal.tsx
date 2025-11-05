/**
 * WelcomeModal.tsx
 *
 * First-time user welcome modal that introduces Alexandria.
 * Appears once on first app launch after account creation.
 *
 * Features:
 * - Elegant animated entrance with auto-dismiss
 * - Alexandria branding and torch animation
 * - Brief value proposition
 * - Quick feature highlights
 * - Encouraging CTA to get started
 * - Auto-dismisses after 4 seconds
 * - Manual dismiss available via button or tap-outside
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import logger from '../../utils/logger';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WelcomeModalProps {
  visible: boolean;
  userName?: string;
  onGetStarted: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  userName = 'Scholar',
  onGetStarted,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const torchFlame = useRef(new Animated.Value(1)).current;
  const [countdown, setCountdown] = useState(4);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flickerAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Safe dismiss handler that cleans up all timers and animations
  const handleDismiss = () => {
    logger.info('WelcomeModal dismissing', { userName });

    // Cleanup all timers
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // Stop animations
    if (flickerAnimationRef.current) {
      flickerAnimationRef.current.stop();
    }

    // Call parent dismiss handler
    onGetStarted();
  };

  useEffect(() => {
    if (visible) {
      logger.info('WelcomeModal showing', { userName });

      // Reset countdown
      setCountdown(4);

      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Torch flame flicker animation (store reference for cleanup)
      const flicker = Animated.loop(
        Animated.sequence([
          Animated.timing(torchFlame, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(torchFlame, {
            toValue: 0.95,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(torchFlame, {
            toValue: 1.05,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(torchFlame, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      flickerAnimationRef.current = flicker;
      flicker.start();

      // Auto-dismiss after 4 seconds
      autoDismissTimerRef.current = setTimeout(() => {
        logger.info('WelcomeModal auto-dismissing');
        handleDismiss();
      }, 4000);

      // Countdown timer (updates every second)
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Fallback timeout (force dismiss after 10 seconds if something goes wrong)
      const fallbackTimer = setTimeout(() => {
        logger.warn('WelcomeModal fallback timeout triggered - force closing');
        handleDismiss();
      }, 10000);

      // Cleanup function
      return () => {
        if (autoDismissTimerRef.current) {
          clearTimeout(autoDismissTimerRef.current);
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        clearTimeout(fallbackTimer);
        if (flickerAnimationRef.current) {
          flickerAnimationRef.current.stop();
        }
      };
    } else {
      // Reset animations when modal becomes invisible
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      torchFlame.setValue(1);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Tap-outside to dismiss */}
      <Pressable style={styles.pressableOverlay} onPress={handleDismiss}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Prevent tap-through to overlay */}
          <Pressable onPress={e => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#1A2C5B', '#2C467D']}
                style={styles.modalContent}
              >
                {/* Close button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleDismiss}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="times" size={18} color="#F8F4E3" />
                </TouchableOpacity>

                {/* Auto-dismiss countdown indicator */}
                {countdown > 0 && (
                  <View style={styles.countdownContainer}>
                    <Text style={styles.countdownText}>
                      Auto-closing in {countdown}s
                    </Text>
                  </View>
                )}

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Animated Torch Logo */}
              <Animatable.View
                animation="fadeInDown"
                delay={200}
                style={styles.logoContainer}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: torchFlame }],
                  }}
                >
                  <LinearGradient
                    colors={['#FFD700', '#D4AF37', '#B8941F']}
                    style={styles.torchGlow}
                  >
                    <FontAwesome5 name="fire" size={48} color="#1A2C5B" />
                  </LinearGradient>
                </Animated.View>
              </Animatable.View>

              {/* Welcome Message */}
              <Animatable.Text
                animation="fadeIn"
                delay={400}
                style={styles.title}
              >
                Welcome to Alexandria, {userName}
              </Animatable.Text>

              <Animatable.Text
                animation="fadeIn"
                delay={600}
                style={styles.subtitle}
              >
                Your AI Study Companion
              </Animatable.Text>

              {/* Value Proposition */}
              <Animatable.View
                animation="fadeInUp"
                delay={800}
                style={styles.descriptionContainer}
              >
                <Text style={styles.description}>
                  Upload your study materials and I'll create personalized quizzes
                  to help you master any subject.
                </Text>
              </Animatable.View>

              {/* Feature Highlights */}
              <Animatable.View
                animation="fadeInUp"
                delay={1000}
                style={styles.featuresContainer}
              >
                <FeatureItem
                  icon="book-reader"
                  title="Smart Learning"
                  description="AI-powered quizzes from any material"
                  delay={1100}
                />
                <FeatureItem
                  icon="chart-line"
                  title="Track Progress"
                  description="Monitor your improvement over time"
                  delay={1200}
                />
                <FeatureItem
                  icon="users"
                  title="Compete & Share"
                  description="Challenge friends on leaderboards"
                  delay={1300}
                />
              </Animatable.View>

              {/* Get Started Button */}
              <Animatable.View
                animation="pulse"
                iterationCount={3}
                delay={1500}
                style={styles.ctaContainer}
              >
                <TouchableOpacity
                  style={styles.getStartedButton}
                  onPress={handleDismiss}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#D4AF37', '#B8941F']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>Begin Your Journey</Text>
                    <FontAwesome5 name="arrow-right" size={16} color="#1A2C5B" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>

              {/* Tagline */}
              <Animatable.Text
                animation="fadeIn"
                delay={1700}
                style={styles.tagline}
              >
                Ignite Your Learning
              </Animatable.Text>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </Pressable>
      </Animated.View>
      </Pressable>
    </Modal>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, delay }) => (
  <Animatable.View animation="fadeInLeft" delay={delay} style={styles.featureItem}>
    <View style={styles.featureIconContainer}>
      <FontAwesome5 name={icon} size={20} color="#D4AF37" />
    </View>
    <View style={styles.featureTextContainer}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </Animatable.View>
);

const styles = StyleSheet.create({
  pressableOverlay: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 500,
    maxHeight: screenHeight * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalContent: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(248, 244, 227, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 32,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  torchGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8F4E3',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#F8F4E3',
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(248, 244, 227, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8F4E3',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#CBD5E0',
    lineHeight: 18,
  },
  ctaContainer: {
    width: '100%',
    marginBottom: 16,
  },
  getStartedButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2C5B',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#D4AF37',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default WelcomeModal;
