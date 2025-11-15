import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ThemeColors {
  glass: string;
  text: string;
  textSecondary: string;
  alexandriaGold: string;
  alexandriaBronze: string;
  [key: string]: string;
}

interface EmptyFilesListProps {
  themeColors: ThemeColors;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * EmptyFilesList - Enhanced empty state with inviting design
 *
 * Features:
 * - Animated fade-in entrance with bounce
 * - Gradient icon container with pulse animation
 * - Multiple Alexandria-themed icons in a grid
 * - Encouraging message with enhanced typography
 * - Helpful subtitle with call-to-action
 * - Glass morphism background with border
 * - Decorative elements and visual interest
 *
 * Accessibility:
 * - Descriptive text for screen readers
 * - Clear visual hierarchy
 * - High contrast text
 */
const EmptyFilesList: React.FC<EmptyFilesListProps> = ({
  themeColors,
  styles,
  t
}) => {
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial entrance animation
    Animated.spring(iconScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Continuous pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={400}
      duration={600}
      style={[
        styles.emptyState,
        enhancedStyles.emptyState,
        { backgroundColor: themeColors.glass }
      ]}
    >
      {/* Decorative Background Elements */}
      <View style={enhancedStyles.decorativeContainer}>
        <View style={[enhancedStyles.decorativeCircle, enhancedStyles.decorativeCircle1]} />
        <View style={[enhancedStyles.decorativeCircle, enhancedStyles.decorativeCircle2]} />
      </View>

      {/* Main Icon Container */}
      <Animated.View
        style={[
          enhancedStyles.iconContainer,
          {
            transform: [{ scale: Animated.multiply(iconScale, iconPulse) }],
          },
        ]}
      >
        <LinearGradient
          colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
          style={enhancedStyles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome5
            name="university"
            size={56}
            color="#1A2C5B"
          />
        </LinearGradient>
      </Animated.View>

      {/* Supporting Icons Grid */}
      <View style={enhancedStyles.supportingIconsGrid}>
        <View style={enhancedStyles.supportingIcon}>
          <FontAwesome5 name="book" size={20} color={themeColors.alexandriaGold} />
        </View>
        <View style={enhancedStyles.supportingIcon}>
          <FontAwesome5 name="scroll" size={20} color={themeColors.alexandriaGold} />
        </View>
        <View style={enhancedStyles.supportingIcon}>
          <FontAwesome5 name="file-pdf" size={20} color={themeColors.alexandriaGold} />
        </View>
      </View>

      {/* Text Content */}
      <Text
        style={[styles.emptyStateText, enhancedStyles.emptyStateText, { color: themeColors.text }]}
        accessibilityRole="header"
      >
        {t('upload.archivesAwait')}
      </Text>

      <View style={enhancedStyles.subtextContainer}>
        <Text
          style={[
            styles.emptyStateSubtext,
            enhancedStyles.emptyStateSubtext,
            { color: themeColors.textSecondary }
          ]}
        >
          {t('upload.selectSacredTextsToBegin')}
        </Text>
      </View>

      {/* Call to Action Hint */}
      <View style={enhancedStyles.hintContainer}>
        <FontAwesome5 name="lightbulb" size={12} color={themeColors.alexandriaGold} />
        <Text style={[enhancedStyles.hintText, { color: themeColors.textSecondary }]}>
          Choose your first document to get started
        </Text>
      </View>
    </Animatable.View>
  );
};

const enhancedStyles = StyleSheet.create({
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  decorativeCircle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: -20,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  supportingIconsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  supportingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  subtextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  arrowIcon: {
    marginRight: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    lineHeight: 22,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  hintText: {
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default EmptyFilesList;
