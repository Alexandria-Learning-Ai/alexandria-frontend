// =============================
// 🏆 components/AchievementComponents.js
// =============================

/**
 * Beautiful Achievement and Insight Components for Alexandria App
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// =============================
// 🎊 Achievement Celebration Modal
// =============================

export const AchievementCelebrationModal = ({ 
  visible, 
  achievements, 
  onClose, 
  isDarkMode = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievements.length > 0) {
      // Start celebration animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [visible, achievements]);

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Reset animations for next achievement
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!visible || !achievements || achievements.length === 0) {
    return null;
  }

  const currentAchievement = achievements[currentIndex];
  const themeColors = isDarkMode 
    ? { bg: '#1A202C', card: '#2D3748', text: '#E2E8F0', accent: '#D4AF37' }
    : { bg: 'rgba(0,0,0,0.8)', card: '#FFFFFF', text: '#1A2C5B', accent: '#D4AF37' };

  const rarityColors = {
    common: ['#6B7280', '#9CA3AF'],
    uncommon: ['#3B82F6', '#60A5FA'],
    rare: ['#8B5CF6', '#A78BFA'],
    epic: ['#F59E0B', '#FBBF24'],
    legendary: ['#EF4444', '#F87171']
  };

  const currentRarityColor = rarityColors[currentAchievement.rarity] || rarityColors.common;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.achievementOverlay, { backgroundColor: themeColors.bg }]}>
        {/* Confetti Animation */}
        <Animated.View 
          style={[
            styles.confettiContainer,
            {
              opacity: confettiAnim,
              transform: [{
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, screenHeight]
                })
              }]
            }
          ]}
        >
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confettiPiece,
                {
                  left: Math.random() * screenWidth,
                  backgroundColor: ['#D4AF37', '#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'][i % 5],
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]}
            />
          ))}
        </Animated.View>

        {/* Achievement Card */}
        <Animated.View 
          style={[
            styles.achievementCard,
            { backgroundColor: themeColors.card, transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.achievementHeader}>
            <Animatable.Text 
              animation="pulse" 
              iterationCount="infinite" 
              style={[styles.celebrationText, { color: themeColors.accent }]}
            >
              🎉 ACHIEVEMENT UNLOCKED! 🎉
            </Animatable.Text>
          </View>

          {/* Achievement Icon */}
          <LinearGradient
            colors={currentRarityColor}
            style={styles.achievementIconContainer}
          >
            <Animatable.Text 
              animation="bounceIn" 
              delay={500}
              style={styles.achievementIcon}
            >
              {currentAchievement.icon}
            </Animatable.Text>
          </LinearGradient>

          {/* Achievement Details */}
          <Animatable.View animation="fadeInUp" delay={800}>
            <Text style={[styles.achievementTitle, { color: themeColors.text }]}>
              {currentAchievement.title}
            </Text>
            <Text style={[styles.achievementDescription, { color: themeColors.text }]}>
              {currentAchievement.description}
            </Text>

            {/* Rarity Badge */}
            <LinearGradient
              colors={currentRarityColor}
              style={styles.rarityBadge}
            >
              <Text style={styles.rarityText}>
                {currentAchievement.rarity.toUpperCase()}
              </Text>
            </LinearGradient>

            {/* Progress Indicator */}
            <Text style={[styles.progressText, { color: themeColors.text }]}>
              {currentIndex + 1} of {achievements.length}
            </Text>
          </Animatable.View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.skipButton]} 
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.nextButton, { backgroundColor: themeColors.accent }]} 
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex < achievements.length - 1 ? 'Next' : 'Awesome!'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// =============================
// 🧠 Insight Card Component
// =============================

export const InsightCard = ({ 
  insight, 
  onClose, 
  isDarkMode = false 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const themeColors = isDarkMode 
    ? { bg: '#2D3748', text: '#E2E8F0', accent: '#D4AF37', secondary: '#4A5568' }
    : { bg: '#FFFFFF', text: '#1A2C5B', accent: '#D4AF37', secondary: '#718096' };

  return (
    <Animated.View style={[styles.insightCard, { backgroundColor: themeColors.bg, opacity: fadeAnim }]}>
      <LinearGradient
        colors={[themeColors.accent, '#FFD700']}
        style={styles.insightHeader}
      >
        <FontAwesome5 name="lightbulb" size={24} color="#FFFFFF" />
        <Text style={styles.insightHeaderText}>Alexandria's Wisdom</Text>
      </LinearGradient>

      <View style={styles.insightContent}>
        <Text style={[styles.insightTitle, { color: themeColors.text }]}>
          {insight.title || 'Performance Insight'}
        </Text>
        <Text style={[styles.insightText, { color: themeColors.secondary }]}>
          {insight.message || insight.description}
        </Text>

        {insight.recommendations && (
          <View style={styles.recommendationsContainer}>
            <Text style={[styles.recommendationsTitle, { color: themeColors.accent }]}>
              📚 Recommendations:
            </Text>
            {insight.recommendations.map((rec, index) => (
              <Text key={index} style={[styles.recommendationItem, { color: themeColors.text }]}>
                • {rec}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.insightButton, { backgroundColor: themeColors.accent }]}
          onPress={onClose}
        >
          <Text style={styles.insightButtonText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// =============================
// 🏆 Achievement Badge Component
// =============================

export const AchievementBadge = ({ 
  achievement, 
  size = 'medium', 
  onPress, 
  isDarkMode = false 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress && onPress(achievement);
  };

  const sizes = {
    small: { container: 50, icon: 20, text: 10 },
    medium: { container: 70, icon: 28, text: 12 },
    large: { container: 90, icon: 36, text: 14 }
  };

  const currentSize = sizes[size];
  const themeColors = isDarkMode 
    ? { bg: '#2D3748', text: '#E2E8F0', accent: '#D4AF37' }
    : { bg: '#FFFFFF', text: '#1A2C5B', accent: '#D4AF37' };

  const rarityColors = {
    common: ['#6B7280', '#9CA3AF'],
    uncommon: ['#3B82F6', '#60A5FA'],
    rare: ['#8B5CF6', '#A78BFA'],
    epic: ['#F59E0B', '#FBBF24'],
    legendary: ['#EF4444', '#F87171']
  };

  const badgeColors = rarityColors[achievement.rarity] || rarityColors.common;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[
        styles.achievementBadge,
        {
          width: currentSize.container,
          height: currentSize.container,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        <LinearGradient
          colors={badgeColors}
          style={[styles.badgeGradient, { borderRadius: currentSize.container / 2 }]}
        >
          <Text style={[styles.badgeIcon, { fontSize: currentSize.icon }]}>
            {achievement.icon}
          </Text>
        </LinearGradient>
        {size !== 'small' && (
          <Text style={[
            styles.badgeTitle, 
            { color: themeColors.text, fontSize: currentSize.text }
          ]} numberOfLines={2}>
            {achievement.title}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// =============================
// 📊 Progress Ring Component
// =============================

export const ProgressRing = ({ 
  progress, 
  size = 100, 
  strokeWidth = 8, 
  color = '#D4AF37',
  backgroundColor = '#E2E8F0',
  children 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <Animated.View style={styles.progressRingContainer}>
        <Animated.View
          style={[
            styles.progressRingCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: backgroundColor,
            }
          ]}
        />
        <Animated.View
          style={[
            styles.progressRingProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{
                rotate: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-90deg', '270deg']
                })
              }]
            }
          ]}
        />
      </Animated.View>
      <View style={styles.progressRingContent}>
        {children}
      </View>
    </View>
  );
};

// =============================
// 🎨 Styles
// =============================

const styles = StyleSheet.create({
  // Achievement Modal Styles
  achievementOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    top: -50,
  },
  achievementCard: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  achievementHeader: {
    marginBottom: 20,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  achievementIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  achievementIcon: {
    fontSize: 60,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  achievementDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  rarityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  nextButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Insight Card Styles
  insightCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
  },
  insightHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  insightContent: {
    padding: 20,
  },
  insightTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 8,
  },
  insightButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'center',
  },
  insightButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Achievement Badge Styles
  achievementBadge: {
    alignItems: 'center',
    margin: 5,
  },
  badgeGradient: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  badgeIcon: {
    color: '#FFFFFF',
  },
  badgeTitle: {
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },

  // Progress Ring Styles
  progressRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
  },
  progressRingCircle: {
    position: 'absolute',
  },
  progressRingProgress: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressRingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default {
  AchievementCelebrationModal,
  InsightCard,
  AchievementBadge,
  ProgressRing,
};