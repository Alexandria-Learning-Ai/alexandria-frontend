import { useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface AnimationParams {
  currentQuestionIndex: number;
  quizStarted: boolean;
  questionsLength: number;
}

export const useQuizAnimations = ({ currentQuestionIndex, quizStarted, questionsLength }: AnimationParams) => {
  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Progress animation effect
  useEffect(() => {
    if (quizStarted && questionsLength > 0) {
      Animated.spring(progressAnim, {
        toValue: (currentQuestionIndex + 1) / questionsLength,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [currentQuestionIndex, quizStarted, questionsLength, progressAnim]);

  /**
   * Animate answer selection
   */
  const animateSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Animate quiz submission with score reveal
   */
  const animateSubmission = (correctCount: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scoreAnim, {
        toValue: correctCount,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  };

  /**
   * Animate question navigation
   */
  const animateQuestionTransition = (direction: 'next' | 'prev') => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -screenWidth : screenWidth,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    // Animation refs
    progressAnim,
    scoreAnim,
    fadeAnim,
    scaleAnim,
    slideAnim,

    // Animation functions
    animateSelection,
    animateSubmission,
    animateQuestionTransition,
  };
};
