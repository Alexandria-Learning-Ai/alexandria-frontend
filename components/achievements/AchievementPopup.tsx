/**
 * AchievementPopup.tsx
 *
 * Animated popup for displaying unlocked achievements.
 * Shows achievement details with confetti effect and auto-dismiss.
 *
 * Features:
 * - Slide up + scale animation
 * - Achievement icon, name, description
 * - Points earned display
 * - Confetti/celebration effect
 * - Auto-dismiss after 5 seconds
 * - Tap to dismiss early
 * - Alexandria theme styling
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import logger from '../../utils/logger';
import type { ThemeColors } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AchievementData {
  name: string; // Achievement name
  description: string; // Achievement description
  icon: string; // FontAwesome5 icon name
  points: number; // Points earned
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'; // Achievement rarity
}

export interface AchievementPopupProps {
  achievement: AchievementData; // Achievement to display
  visible: boolean; // Visibility state
  onDismiss: () => void; // Callback when dismissed
  themeColors: ThemeColors; // Alexandria theme colors
  autoDismissDelay?: number; // Auto-dismiss delay in ms (default: 5000)
}

/**
 * Get rarity color and label
 */
const getRarityData = (rarity?: string) => {
  switch (rarity) {
    case 'legendary':
      return { color: '#FFD700', label: 'Legendary', glow: '#FFD700' };
    case 'epic':
      return { color: '#9B59B6', label: 'Epic', glow: '#9B59B6' };
    case 'rare':
      return { color: '#3498DB', label: 'Rare', glow: '#3498DB' };
    case 'common':
    default:
      return { color: '#95A5A6', label: 'Common', glow: '#95A5A6' };
  }
};

/**
 * Confetti particle component
 */
const ConfettiParticle: React.FC<{
  color: string;
  delay: number;
  startX: number;
}> = ({ color, delay, startX }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 400,
        duration: 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: (Math.random() - 0.5) * 200,
        duration: 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 360,
        duration: 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        delay: delay + 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          backgroundColor: color,
          left: startX,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
          ],
          opacity,
        },
      ]}
    />
  );
};

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
  visible,
  onDismiss,
  themeColors,
  autoDismissDelay = 5000,
}) => {
  const rarityData = getRarityData(achievement.rarity);

  // Auto-dismiss timer
  useEffect(() => {
    if (visible) {
      logger.info('Achievement unlocked', { achievement: achievement.name });
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [visible, autoDismissDelay, onDismiss, achievement.name]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        {/* Confetti particles */}
        {Array.from({ length: 20 }).map((_, index) => (
          <ConfettiParticle
            key={index}
            color={
              ['#FFD700', '#D4AF37', '#FF6B6B', '#4ECDC4', '#95E1D3'][
                index % 5
              ]
            }
            delay={index * 50}
            startX={SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100}
          />
        ))}

        {/* Achievement card */}
        <Animatable.View
          animation="bounceIn"
          duration={800}
          style={styles.cardContainer}
        >
          <LinearGradient
            colors={[themeColors.alexandriaNavy, themeColors.alexandriaBronze + '40']}
            style={[
              styles.card,
              {
                borderColor: rarityData.color,
                shadowColor: rarityData.glow,
              },
            ]}
          >
            {/* Rarity Badge */}
            {achievement.rarity && (
              <View
                style={[
                  styles.rarityBadge,
                  {
                    backgroundColor: rarityData.color + '30',
                    borderColor: rarityData.color,
                  },
                ]}
              >
                <Text style={[styles.rarityText, { color: rarityData.color }]}>
                  {rarityData.label.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Achievement Icon */}
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              duration={1500}
              style={[
                styles.iconContainer,
                {
                  backgroundColor: rarityData.color + '30',
                  borderColor: rarityData.color,
                  shadowColor: rarityData.glow,
                },
              ]}
            >
              <FontAwesome5 name={achievement.icon} size={48} color={rarityData.color} />
            </Animatable.View>

            {/* Achievement Unlocked Label */}
            <Text style={[styles.unlockedLabel, { color: themeColors.alexandriaGold }]}>
              Achievement Unlocked!
            </Text>

            {/* Achievement Name */}
            <Text style={[styles.achievementName, { color: themeColors.text }]}>
              {achievement.name}
            </Text>

            {/* Achievement Description */}
            <Text style={[styles.achievementDescription, { color: themeColors.textSecondary }]}>
              {achievement.description}
            </Text>

            {/* Points Display */}
            <View
              style={[
                styles.pointsContainer,
                {
                  backgroundColor: themeColors.alexandriaGold + '20',
                  borderColor: themeColors.alexandriaGold,
                },
              ]}
            >
              <FontAwesome5
                name="star"
                size={18}
                color={themeColors.alexandriaGold}
                style={styles.starIcon}
              />
              <Text style={[styles.pointsText, { color: themeColors.alexandriaGold }]}>
                +{achievement.points} points
              </Text>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity
              style={[styles.dismissButton, { backgroundColor: themeColors.alexandriaGold }]}
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissButtonText}>Awesome!</Text>
              <FontAwesome5
                name="sparkles"
                size={16}
                color="#FFFFFF"
                style={styles.sparklesIcon}
              />
            </TouchableOpacity>
          </LinearGradient>
        </Animatable.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 0,
  },
  cardContainer: {
    width: SCREEN_WIDTH - 64,
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 15,
  },
  rarityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  unlockedLabel: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  achievementDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
  },
  starIcon: {
    marginRight: 8,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  sparklesIcon: {
    marginLeft: 4,
  },
});

export default AchievementPopup;
