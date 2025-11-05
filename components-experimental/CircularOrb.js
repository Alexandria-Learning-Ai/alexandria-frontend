/**
 * CircularOrb - Alexandria Design System Component (Refined Gold 3D Orb)
 *
 * Updated for 50x50 orbs:
 * - Reduced shadows for proportional depth
 * - Softer glow for smaller scale
 * - Optimized shimmer/shine animations
 * - Clean alignment for 3x2 grid use
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import { useExperimentalTheme } from "../hooks/useExperimentalTheme";

export default function CircularOrb({ title, icon, onPress }) {
  const { colors } = useExperimentalTheme();

  // Animation refs
  const liftAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const ambientAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  // 🌬️ Ambient glow (subtle breathing)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(ambientAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // ✨ Shimmer reflection
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 7000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 💎 Shine streak
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 🖱️ Press interactions
  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(liftAnim, {
        toValue: -6, // smaller lift for smaller orb
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(liftAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => onPress && onPress());
  };

  // 🔆 Glow intensity + shimmer movement
  const combinedGlow = Animated.add(ambientAnim, glowAnim).interpolate({
    inputRange: [0, 2],
    outputRange: [0.1, 0.6],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 80],
  });

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  return (
    <View style={styles.verticalContainer}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.wrapper,
            { transform: [{ translateY: liftAnim }] },
          ]}
        >
          {/* Base card shadow */}
          <View style={styles.baseCard} />

          {/* Glow aura */}
          <Animated.View
            style={[
              styles.glowLayer,
              {
                opacity: combinedGlow,
                shadowColor: "#FFD15C",
              },
            ]}
          />

          {/* Gold orb */}
          <LinearGradient
            colors={["#f6e27a", "#cb9b51"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.orb}
          >
            <View style={styles.highlightOverlay} />

            {/* Shimmer reflection */}
            <Animated.View
              style={[
                styles.shimmerOverlay,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                colors={["#ffffff20", "#ffffff05", "#ffffff00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            {/* Shine streak */}
            <Animated.View
              style={[
                styles.shineOverlay,
                { transform: [{ translateX: shineTranslate }] },
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.8)",
                  "rgba(255,255,255,0)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            <FontAwesome5 name={icon} size={18} color={"#1A1400"} />
          </LinearGradient>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Label */}
      <Text style={[styles.title, { color: colors.text || "#FFFFFF" }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  verticalContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    marginVertical: 14,
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  baseCard: {
    position: "absolute",
    bottom: 0,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#0B1223",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  orb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#FFD15C",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
  },
  shineOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    opacity: 0.18,
  },
  title: {
    fontSize: 11.5,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
    marginTop: 5,
  },
  glowLayer: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});
