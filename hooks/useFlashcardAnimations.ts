/**
 * useFlashcardAnimations Hook
 * Manages all animations for flashcard interactions
 */

import { useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface AnimationParams {
  currentCardIndex: number;
  flashcardsLength: number;
}

export const useFlashcardAnimations = ({ currentCardIndex, flashcardsLength }: AnimationParams) => {
  // Animation refs
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Update progress animation when card changes
  useEffect(() => {
    if (flashcardsLength > 0) {
      Animated.timing(progressAnimation, {
        toValue: (currentCardIndex + 1) / flashcardsLength,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
  }, [currentCardIndex, flashcardsLength, progressAnimation]);

  /**
   * Animate card flip
   */
  const animateFlip = (isFlipped: boolean) => {
    Animated.parallel([
      Animated.timing(flipAnimation, {
        toValue: isFlipped ? 0 : 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.02,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ])
    ]).start();
  };

  /**
   * Animate card slide to next
   */
  const animateSlideNext = (onComplete: () => void) => {
    Animated.timing(slideAnimation, {
      toValue: -screenWidth * 1.1,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      onComplete();

      flipAnimation.setValue(0);
      slideAnimation.setValue(screenWidth * 1.1);

      Animated.spring(slideAnimation, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true
      }).start();
    });
  };

  /**
   * Animate card slide to previous
   */
  const animateSlidePrevious = (onComplete: () => void) => {
    Animated.timing(slideAnimation, {
      toValue: screenWidth,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      onComplete();

      flipAnimation.setValue(0);
      slideAnimation.setValue(-screenWidth);

      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    });
  };

  /**
   * Animate slide back to center (gesture cancelled)
   */
  const animateSlideReset = () => {
    Animated.spring(slideAnimation, {
      toValue: 0,
      useNativeDriver: true
    }).start();
  };

  /**
   * Interpolations for flip effect
   */
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return {
    // Animation refs
    flipAnimation,
    slideAnimation,
    scaleAnimation,
    progressAnimation,

    // Animation functions
    animateFlip,
    animateSlideNext,
    animateSlidePrevious,
    animateSlideReset,

    // Interpolations
    frontInterpolate,
    backInterpolate,
  };
};
