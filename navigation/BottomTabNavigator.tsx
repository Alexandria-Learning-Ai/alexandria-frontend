/**
 * BottomTabNavigator - Premium animated navigation with Alexandria aesthetics
 *
 * Tabs:
 * 1. Home - Welcome, Upload, Ask Alexandria, Stats, Profile
 * 2. Analytics - Detailed progress and analytics
 * 3. Features - Feature cards (Audio, Schedule Exam, History, Materials)
 * 4. Quick Shortcut - Customizable shortcut to favorite feature
 *
 * Premium Features:
 * - Smooth 60fps animations with React Native Animated API
 * - Sophisticated haptic feedback patterns (Light/Medium/Heavy)
 * - Floating elevated design with premium glassmorphism
 * - Sliding active indicator with fluid spring motion
 * - Advanced icon animations (scale, rotate, glow, breathe)
 * - Particle sparkle effects on tab press
 * - Gold gradient accents with depth
 * - Natural spring physics for delightful interactions
 * - Long-press micro-interactions with vibration feedback
 * - Shimmer effect on inactive tabs
 * - Gradient pulsing on active tab
 * - Type-safe navigation
 * - Performance optimized with native driver
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
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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

interface BottomTabNavigatorProps {
  user: any;
  subscription: any;
}

/**
 * Sparkle Particle - Animated particle that appears on tab press
 *
 * Creates a delightful burst effect radiating outward from the tab
 */
interface SparkleProps {
  delay: number;
  angle: number;
}

const Sparkle: React.FC<SparkleProps> = ({ delay, angle }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Delay start for staggered effect
    const timeout = setTimeout(() => {
      Animated.parallel([
        // Animate outward in a radial pattern
        Animated.timing(translateX, {
          toValue: Math.cos(angle) * 30,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: Math.sin(angle) * 30,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Fade in then out
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Scale up then down
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <View style={styles.sparkleInner} />
    </Animated.View>
  );
};

/**
 * Custom Tab Bar Button with premium animations and haptic feedback
 *
 * Features:
 * - Spring animations with natural bounce physics
 * - Context-aware haptic feedback (different for active/inactive)
 * - Smooth color transitions
 * - Pulsing glow effect when active
 * - Icon rotation wiggle on activation
 * - Particle sparkles on press for delight
 * - Optimized with native driver for 60fps
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
  const scale = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(isFocused ? 1.15 : 1)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(isFocused ? 1 : 0.7)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const breatheScale = useRef(new Animated.Value(1)).current;

  // Animate when focused state changes
  useEffect(() => {
    if (isFocused) {
      // Icon scale up with spring bounce
      Animated.spring(iconScale, {
        toValue: 1.15,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Subtle rotation wiggle for emphasis
      Animated.sequence([
        Animated.timing(iconRotation, {
          toValue: -5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotation, {
          toValue: 5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow fade in
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulsing glow animation (infinite)
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.2,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Gentle breathe effect for active icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheScale, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breatheScale, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Label fully visible
      Animated.timing(labelOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Icon scale down
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Reset rotation
      Animated.timing(iconRotation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Glow fade out
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Shimmer effect for inactive tabs (subtle attraction)
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerX, {
            toValue: 2,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
        ])
      ).start();

      // Label semi-transparent
      Animated.timing(labelOpacity, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      }).start();
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

      // Show sparkle particles for delight
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 800);
    }

    // Press animation - scale down then bounce back
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.88,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const handleLongPress = async () => {
    // Special haptic pattern for long press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Extra sparkle burst effect
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 1000);

    // Dramatic scale animation
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1.3,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: isFocused ? 1.15 : 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const iconColor = isFocused ? themeColors.alexandriaGold : themeColors.tabBarInactive;

  // Interpolate rotation from -5 to 5 degrees
  const rotateInterpolate = iconRotation.interpolate({
    inputRange: [-5, 5],
    outputRange: ['-5deg', '5deg'],
  });

  // Shimmer gradient position interpolation
  const shimmerTranslateX = shimmerX.interpolate({
    inputRange: [-1, 2],
    outputRange: [-100, 100],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      onLayout={onLayout}
      activeOpacity={0.8}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabButtonContent,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {/* Glow effect behind active icon */}
        {isFocused && (
          <Animated.View
            style={[
              styles.glowContainer,
              {
                opacity: glowOpacity,
                transform: [
                  { scale: glowScale },
                  { scale: breatheScale },
                ],
              },
            ]}
          >
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

        {/* Subtle shimmer for inactive tabs */}
        {!isFocused && (
          <Animated.View
            style={[
              styles.shimmerContainer,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'transparent',
                'rgba(212, 175, 55, 0.1)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmer}
            />
          </Animated.View>
        )}

        {/* Sparkle particles */}
        {showSparkles && (
          <View style={styles.sparklesContainer}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Sparkle
                key={i}
                delay={i * 40}
                angle={(Math.PI * 2 * i) / 8}
              />
            ))}
          </View>
        )}

        {/* Icon with advanced animations */}
        <Animated.View
          style={{
            transform: [
              { scale: iconScale },
              { rotate: rotateInterpolate },
            ],
          }}
        >
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
            { opacity: labelOpacity },
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
 * - Premium glassmorphism with blur effect (iOS)
 * - Sliding active indicator that flows smoothly between tabs
 * - Gold gradient border accent at top
 * - Optimized padding for safe areas
 * - Entrance slide-up animation on mount
 * - Sophisticated multi-layer shadow depth
 */
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);

  // Animated values
  const slideUp = useRef(new Animated.Value(0)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;

  // Tab configuration
  const tabs = [
    { name: 'HomeTab', label: 'Home', icon: 'home' },
    { name: 'AnalyticsTab', label: 'Analytics', icon: 'chart-line' },
    { name: 'FeaturesTab', label: 'Features', icon: 'th-large' },
    { name: 'QuickShortcutTab', label: 'Shortcut', icon: 'star' },
  ];

  useEffect(() => {
    // Entrance animation - slide up from bottom
    Animated.spring(slideUp, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Subtle border pulse animation (infinite)
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(borderPulse, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Update indicator position when active tab changes
  useEffect(() => {
    if (tabLayouts.length === tabs.length) {
      const activeLayout = tabLayouts[state.index];
      if (activeLayout) {
        // Smooth spring animation for indicator
        Animated.spring(indicatorX, {
          toValue: activeLayout.x,
          friction: 8,
          tension: 50,
          useNativeDriver: false, // Can't use native driver for width/x position
        }).start();

        Animated.spring(indicatorWidth, {
          toValue: activeLayout.width,
          friction: 8,
          tension: 50,
          useNativeDriver: false,
        }).start();
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

  // Interpolate slide up animation
  const translateY = slideUp.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  // Interpolate border pulse for subtle glow
  const borderOpacity = borderPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: tabBarHeight,
          transform: [{ translateY }],
          opacity: slideUp,
        },
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

      {/* Gold gradient border accent at top with pulse animation */}
      <Animated.View style={{ opacity: borderOpacity }}>
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
      </Animated.View>

      {/* Sliding active indicator */}
      <Animated.View
        style={[
          styles.slidingIndicator,
          {
            transform: [{ translateX: indicatorX }],
            width: indicatorWidth,
          },
        ]}
      >
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

  // Shimmer Effect (inactive tabs)
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmer: {
    width: 100,
    height: '100%',
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
