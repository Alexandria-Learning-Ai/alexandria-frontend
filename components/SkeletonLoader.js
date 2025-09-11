/**
 * SkeletonLoader - Reusable skeleton loading components
 * Provides smooth shimmer animations during data fetching
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const SkeletonLoader = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style = {},
  animationSpeed = 1000
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: animationSpeed,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: animationSpeed,
          useNativeDriver: false,
        }),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [animatedValue, animationSpeed]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  const skeletonWidth = typeof width === 'string' ? 
    (width.includes('%') ? (screenWidth * parseInt(width) / 100) : screenWidth) : 
    width;

  return (
    <View 
      style={[
        styles.container, 
        { width: skeletonWidth, height, borderRadius },
        style
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          }
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

// Predefined skeleton components for common use cases
export const QuizCardSkeleton = ({ style = {} }) => (
  <View style={[styles.quizCardContainer, style]}>
    <SkeletonLoader width="80%" height={24} style={styles.titleSkeleton} />
    <SkeletonLoader width="60%" height={16} style={styles.subtitleSkeleton} />
    <View style={styles.rowSkeleton}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <SkeletonLoader width="70%" height={16} style={{ marginLeft: 12 }} />
    </View>
    <SkeletonLoader width="100%" height={44} borderRadius={22} style={styles.buttonSkeleton} />
  </View>
);

export const ProfileSkeleton = ({ style = {} }) => (
  <View style={[styles.profileContainer, style]}>
    <SkeletonLoader width={80} height={80} borderRadius={40} style={styles.avatarSkeleton} />
    <SkeletonLoader width="70%" height={24} style={styles.nameSkeleton} />
    <SkeletonLoader width="50%" height={16} style={styles.emailSkeleton} />
    <View style={styles.statsSkeleton}>
      <View style={styles.statItem}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <SkeletonLoader width="80%" height={14} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.statItem}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <SkeletonLoader width="80%" height={14} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.statItem}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <SkeletonLoader width="80%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  </View>
);

export const ListItemSkeleton = ({ count = 5, style = {} }) => (
  <View style={style}>
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={styles.listItemContainer}>
        <SkeletonLoader width={50} height={50} borderRadius={8} />
        <View style={styles.listItemContent}>
          <SkeletonLoader width="70%" height={18} />
          <SkeletonLoader width="90%" height={14} style={{ marginTop: 6 }} />
          <SkeletonLoader width="40%" height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
    ))}
  </View>
);

export const ProgressSkeleton = ({ style = {} }) => (
  <View style={[styles.progressContainer, style]}>
    <SkeletonLoader width="60%" height={20} style={styles.progressTitle} />
    <View style={styles.progressBarContainer}>
      <SkeletonLoader width="100%" height={8} borderRadius={4} />
      <SkeletonLoader width="30%" height={14} style={styles.progressText} />
    </View>
    <View style={styles.progressStats}>
      <SkeletonLoader width="25%" height={16} />
      <SkeletonLoader width="25%" height={16} />
      <SkeletonLoader width="25%" height={16} />
    </View>
  </View>
);

export const CardSkeleton = ({ style = {} }) => (
  <View style={[styles.cardContainer, style]}>
    <SkeletonLoader width="100%" height={120} borderRadius={8} />
    <View style={styles.cardContent}>
      <SkeletonLoader width="80%" height={18} />
      <SkeletonLoader width="100%" height={14} style={{ marginTop: 6 }} />
      <SkeletonLoader width="60%" height={14} style={{ marginTop: 4 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    flex: 1,
  },
  
  // Quiz Card Skeleton
  quizCardContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  subtitleSkeleton: {
    marginBottom: 16,
  },
  rowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonSkeleton: {
    marginTop: 8,
  },

  // Profile Skeleton
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  avatarSkeleton: {
    marginBottom: 16,
  },
  nameSkeleton: {
    marginBottom: 8,
  },
  emailSkeleton: {
    marginBottom: 20,
  },
  statsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  // List Item Skeleton
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },

  // Progress Skeleton
  progressContainer: {
    padding: 16,
  },
  progressTitle: {
    marginBottom: 12,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressText: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Card Skeleton
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
});

export default SkeletonLoader;