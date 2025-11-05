/**
 * useResultsState Hook
 * Manages all state for the results screen
 */

import { useState, useRef } from 'react';
import { Animated, Appearance } from 'react-native';
import axios from 'axios';

export const useResultsState = () => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

  // Explanation states
  const [showExplanations, setShowExplanations] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, any>>({});
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [loadingSpecificExplanation, setLoadingSpecificExplanation] = useState<string | null>(null);

  // Performance animation state
  const [animatedPercentageValue, setAnimatedPercentageValue] = useState(0);

  // Coach message states
  const [coachMessage, setCoachMessage] = useState<any>(null);
  const [showCoachTips, setShowCoachTips] = useState(false);
  const [loadingCoachMessage, setLoadingCoachMessage] = useState(false);
  const [showCoachCard, setShowCoachCard] = useState(true);

  // UI states
  const [refreshing, setRefreshing] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);

  // Subject correction states
  const [showSubjectCorrection, setShowSubjectCorrection] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Animation refs
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const cancelTokenSource = useRef(axios.CancelToken.source());

  return {
    // Theme
    isDarkMode,
    setIsDarkMode,

    // Explanations
    showExplanations,
    setShowExplanations,
    explanations,
    setExplanations,
    loadingExplanations,
    setLoadingExplanations,
    loadingSpecificExplanation,
    setLoadingSpecificExplanation,

    // Performance
    animatedPercentageValue,
    setAnimatedPercentageValue,

    // Coach
    coachMessage,
    setCoachMessage,
    showCoachTips,
    setShowCoachTips,
    loadingCoachMessage,
    setLoadingCoachMessage,
    showCoachCard,
    setShowCoachCard,

    // UI
    refreshing,
    setRefreshing,
    showAchievementModal,
    setShowAchievementModal,
    usageStats,
    setUsageStats,

    // Subject correction
    showSubjectCorrection,
    setShowSubjectCorrection,
    selectedSubject,
    setSelectedSubject,
    submittingCorrection,
    setSubmittingCorrection,

    // Animations
    scoreAnimation,
    celebrationScale,

    // Refs
    isMountedRef,
    cancelTokenSource,
  };
};
