/**
 * BottomTabNavigator (Enhanced with React Native Reanimated)
 *
 * This is the PREMIUM VERSION with buttery-smooth 60fps animations.
 *
 * INSTALLATION REQUIRED:
 * 1. Install dependencies:
 *    npm install react-native-reanimated
 *
 * 2. Add to babel.config.js plugins array:
 *    plugins: ['react-native-reanimated/plugin']
 *
 * 3. Clear cache and restart:
 *    npx expo start -c
 *
 * Once installed, rename this file to BottomTabNavigator.tsx to use it.
 *
 * Features:
 * - Buttery-smooth 60fps animations with React Native Reanimated
 * - Sophisticated haptic feedback patterns
 * - Floating elevated design with premium glassmorphism
 * - Sliding active indicator with fluid motion
 * - Advanced icon animations (scale, rotate, glow)
 * - Particle sparkle effects on tab press
 * - Gold gradient accents with depth
 * - Spring physics for natural motion
 * - Type-safe navigation
 * - Optimized for performance
 */

import React, { useRef, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

// Import tab screens
import HomeTab from '../screens/tabs/HomeTab';
import AnalyticsTab from '../screens/tabs/AnalyticsTab';
import FeaturesTab from '../screens/tabs/FeaturesTab';
import QuickShortcutTab from '../screens/tabs/QuickShortcutTab';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Alexandria theme colors
const themeColors = {
  background: '#1A2C5B',
  backgroundSecondary: '#2C467D',
  alexandriaGold: '#D4AF37',
  alexandriaBronze: '#B8941F',
  alexandriaGoldLight: '#E5C158',
  alexandriaNavy: '#1A2C5B',
  text: '#F8F4E3',
  textSecondary: '#CBD5E0',
  tabBarBackground: '#1A2C5B',
  tabBarInactive: '#8094B3',
  glowColor: 'rgba(212, 175, 55, 0.5)',
  sparkleGold: '#FFE55C',
};

// Spring animation configs for natural motion
const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

const bouncySpringConfig = {
  damping: 10,
  stiffness: 200,
  mass: 0.3,
};

interface BottomTabNavigatorProps {
  user: any;
  subscription: any;
}

/**
 * Sparkle Particle - Animated particle that appears on tab press
 */
interface SparkleProps {
  delay: number;
  angle: number;
}

const Sparkle: React.FC<SparkleProps> = ({ delay, angle }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Delay start
    const timeout = setTimeout(() => {
      // Animate outward
      translateX.value = withTiming(Math.cos(angle) * 30, { duration: 600, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(Math.sin(angle) * 30, { duration: 600, easing: Easing.out(Easing.cubic) });

      // Fade in then out
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      );

      // Scale up then down
      scale.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.sparkle, animatedStyle]}>
      <View style={styles.sparkleInner} />
    </Animated.View>
  );
};

/**
 * Custom Tab Bar Button with premium animations and haptic feedback
 *
 * Features:
 * - Advanced spring animations with natural physics
 * - Sophisticated haptic feedback patterns
 * - Smooth color transitions
 * - Pulsing glow effect when active
 * - Icon rotation and scale effects
 * - Particle sparkles on press
 * - Optimized for 60fps performance
 */
interface CustomTabBarButtonProps {
  onPress: () => void;
  isFocused: boolean;
  label: string;
  iconName: string;
  index: number;
  onLayout: (event: any) => void;
}

const CustomTabBarButton: React.FC<CustomTabBarButtonProps> = ({
  onPress,
  isFocused,
  label,
  iconName,
  index,
  onLayout,
}) => {
  const [showSparkles, setShowSparkles] = useState(false);

  // Animated values
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(isFocused ? 1.15 : 1);
  const iconRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(isFocused ? 1 : 0);
  const glowScale = useSharedValue(1);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.7);

  // Animate when focused state changes
  useEffect(() => {
    if (isFocused) {
      // Icon scale up with bounce
      iconScale.value = withSpring(1.15, bouncySpringConfig);

      // Subtle rotation for emphasis
      iconRotation.value = withSequence(
        withTiming(-5, { duration: 150 }),
        withTiming(5, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );

      // Glow fade in
      glowOpacity.value = withTiming(1, { duration: 300 });

      // Pulsing glow animation
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Label fully visible
      labelOpacity.value = withTiming(1, { duration: 200 });
    } else {
      // Icon scale down
      iconScale.value = withSpring(1, springConfig);

      // Reset rotation
      iconRotation.value = withTiming(0, { duration: 200 });

      // Glow fade out
      glowOpacity.value = withTiming(0, { duration: 300 });

      // Label semi-transparent
      labelOpacity.value = withTiming(0.7, { duration: 200 });
    }
  }, [isFocused]);

  const handlePress = async () => {
    // Sophisticated haptic pattern
    if (isFocused) {
      // Gentle feedback if already on this tab
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // More pronounced feedback when switching tabs
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Show sparkle particles
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 800);
    }

    // Press animation - scale down then bounce back
    scale.value = withSequence(
      withSpring(0.88, { damping: 20, stiffness: 300 }),
      withSpring(1, bouncySpringConfig)
    );

    onPress();
  };

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const iconColor = isFocused ? themeColors.alexandriaGold : themeColors.tabBarInactive;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLayout={onLayout}
      activeOpacity={0.8}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabButtonContent, buttonAnimatedStyle]}>
        {/* Glow effect behind active icon */}
        {isFocused && (
          <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
            <LinearGradient
              colors={[
                'rgba(212, 175, 55, 0.3)',
                'rgba(212, 175, 55, 0.15)',
                'rgba(212, 175, 55, 0)',
              ]}
              style={styles.glow}
            />
          </Animated.View>
        )}

        {/* Sparkle particles */}
        {showSparkles && (
          <View style={styles.sparklesContainer}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Sparkle
                key={i}
                delay={i * 50}
                angle={(Math.PI * 2 * i) / 6}
              />
            ))}
          </View>
        )}

        {/* Icon with advanced animations */}
        <Animated.View style={iconAnimatedStyle}>
          <FontAwesome5
            name={iconName}
            size={22}
            color={iconColor}
            solid={isFocused}
          />
        </Animated.View>

        {/* Label with fade animation */}
        <Animated.Text
          style={[
            styles.tabLabel,
            { color: iconColor },
            isFocused && styles.tabLabelActive,
            labelAnimatedStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Custom Tab Bar with floating elevated design and sliding indicator
 *
 * Features:
 * - Floating card design with rounded corners
 * - Premium glassmorphism with blur effect
 * - Sliding active indicator that flows between tabs
 * - Gold gradient border accent
 * - Optimized padding for safe areas
 * - Entrance animation on mount
 * - Sophisticated shadow depth
 */
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);

  // Animated values
  const slideUp = useSharedValue(0);
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  // Tab configuration
  const tabs = [
    { name: 'HomeTab', label: 'Home', icon: 'home' },
    { name: 'AnalyticsTab', label: 'Analytics', icon: 'chart-line' },
    { name: 'FeaturesTab', label: 'Features', icon: 'th-large' },
    { name: 'QuickShortcutTab', label: 'Shortcut', icon: 'star' },
  ];

  useEffect(() => {
    // Entrance animation
    slideUp.value = withSpring(1, {
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    });
  }, []);

  // Update indicator position when active tab changes
  useEffect(() => {
    if (tabLayouts.length === tabs.length) {
      const activeLayout = tabLayouts[state.index];
      if (activeLayout) {
        indicatorX.value = withSpring(activeLayout.x, springConfig);
        indicatorWidth.value = withSpring(activeLayout.width, springConfig);
      }
    }
  }, [state.index, tabLayouts]);

  const handleTabLayout = (index: number) => (event: any) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const newLayouts = [...prev];
      newLayouts[index] = { x, width };
      return newLayouts;
    });
  };

  const tabBarHeight = Platform.OS === 'ios' ? 75 + insets.bottom : 70;

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          slideUp.value,
          [0, 1],
          [100, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: slideUp.value,
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <Animated.View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: tabBarHeight,
        },
        containerAnimatedStyle,
      ]}
    >
      {/* Glassmorphism blur background (iOS) */}
      {Platform.OS === 'ios' && (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.blurOverlay} />
        </BlurView>
      )}

      {/* Solid background (Android) */}
      {Platform.OS === 'android' && (
        <View style={styles.solidBackground} />
      )}

      {/* Premium shadow layer */}
      <View style={styles.shadowLayer} />

      {/* Gold gradient border accent at top */}
      <LinearGradient
        colors={[
          'rgba(212, 175, 55, 0.5)',
          'rgba(229, 193, 88, 0.3)',
          'rgba(212, 175, 55, 0.5)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
      />

      {/* Sliding active indicator */}
      <Animated.View style={[styles.slidingIndicator, indicatorAnimatedStyle]}>
        <LinearGradient
          colors={[
            themeColors.alexandriaGoldLight,
            themeColors.alexandriaGold,
            themeColors.alexandriaBronze,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.indicatorGradient}
        />
      </Animated.View>

      {/* Tab buttons container */}
      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || tabs[index]?.label || route.name;
          const iconName = tabs[index]?.icon || 'circle';
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <CustomTabBarButton
              key={route.key}
              onPress={onPress}
              isFocused={isFocused}
              label={label}
              iconName={iconName}
              index={index}
              onLayout={handleTabLayout(index)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ user, subscription }) => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          tabBarLabel: 'Home',
        }}
      >
        {(props) => <HomeTab {...props} user={user} subscription={subscription} />}
      </Tab.Screen>

      <Tab.Screen
        name="AnalyticsTab"
        options={{
          tabBarLabel: 'Analytics',
        }}
      >
        {(props) => <AnalyticsTab {...props} user={user} subscription={subscription} />}
      </Tab.Screen>

      <Tab.Screen
        name="FeaturesTab"
        options={{
          tabBarLabel: 'Features',
        }}
      >
        {(props) => <FeaturesTab {...props} user={user} subscription={subscription} />}
      </Tab.Screen>

      <Tab.Screen
        name="QuickShortcutTab"
        options={{
          tabBarLabel: 'Shortcut',
        }}
      >
        {(props) => <QuickShortcutTab {...props} user={user} subscription={subscription} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // Tab Bar Container
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    borderRadius: 28,
    marginBottom: 8,
    overflow: 'hidden',
    // Premium shadow effects with multiple layers
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 44, 91, 0.85)',
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: themeColors.tabBarBackground,
  },
  shadowLayer: {
    position: 'absolute',
    bottom: -10,
    left: 10,
    right: 10,
    height: 30,
    backgroundColor: 'transparent',
    shadowColor: themeColors.alexandriaGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  slidingIndicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    shadowColor: themeColors.alexandriaGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 12,
  },

  // Tab Button
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 12,
  },

  // Glow Effect
  glowContainer: {
    position: 'absolute',
    top: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  // Sparkles
  sparklesContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sparkleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: themeColors.sparkleGold,
    shadowColor: themeColors.sparkleGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },

  // Label
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

export default BottomTabNavigator;
