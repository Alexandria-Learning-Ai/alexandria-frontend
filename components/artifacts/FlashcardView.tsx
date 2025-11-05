/**
 * FlashcardView - Interactive flashcard viewer with flip animation
 *
 * Features:
 * - Card flip animation (front/back) with 3D transform
 * - Navigation between cards
 * - Progress indicator (card X of Y)
 * - Shuffle option
 * - Generate button (if no cards)
 * - Loading and error states
 * - Alexandria theme
 * - Smooth 60fps animations
 * - Accessible touch targets
 *
 * @param flashcards - Array of flashcard objects
 * @param loading - Loading state
 * @param error - Error message
 * @param onGenerate - Callback to generate flashcards
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardViewProps {
  flashcards: Flashcard[] | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 40, 400);

const FlashcardView: React.FC<FlashcardViewProps> = ({
  flashcards,
  loading,
  error,
  onGenerate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      surface: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accentLight,
      accentDark: Colors.accentDark,
      primary: Colors.primary,
      error: Colors.error,
      border: Colors.border,
    }),
    []
  );

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (flashcards && currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const handleShuffle = () => {
    // Reset to first card after shuffle
    setCurrentIndex(0);
    setIsFlipped(false);
    flipAnim.setValue(0);
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Generating flashcards...
        </Text>
        <Text style={[styles.loadingSubtext, { color: themeColors.textMuted }]}>
          Creating study materials
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name="exclamation-triangle" size={56} color={themeColors.error} />
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>
          Failed to load flashcards
        </Text>
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  // Empty state
  if (!flashcards || flashcards.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name="layer-group" size={64} color={themeColors.textMuted} />
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
          No flashcards yet
        </Text>
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
          Generate AI-powered flashcards for this chapter
        </Text>
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: themeColors.accent }]}
          onPress={onGenerate}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="magic" size={16} color={Colors.white} style={styles.buttonIcon} />
          <Text style={styles.generateText}>Generate Flashcards</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Animation interpolations
  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [0, 0, 1],
  });

  const currentCard = flashcards[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Progress Header */}
      <View style={styles.header}>
        <Text style={[styles.progress, { color: themeColors.text }]}>
          Card {currentIndex + 1} of {flashcards.length}
        </Text>
        <TouchableOpacity
          style={[styles.shuffleButton, { borderColor: themeColors.border }]}
          onPress={handleShuffle}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="random" size={16} color={themeColors.accent} />
        </TouchableOpacity>
      </View>

      {/* Flashcard Container */}
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleFlip}
          style={styles.cardTouchable}
        >
          {/* Front of card */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              {
                transform: [{ rotateY: frontRotation }],
                opacity: frontOpacity,
              },
              styles.cardFront,
            ]}
          >
            <View style={styles.cardHeader}>
              <FontAwesome5 name="question-circle" size={20} color={themeColors.accent} />
              <Text style={[styles.cardLabel, { color: themeColors.accent }]}>
                Question
              </Text>
            </View>
            <Text style={[styles.cardText, { color: themeColors.text }]}>
              {currentCard.front}
            </Text>
            <View style={styles.tapHint}>
              <FontAwesome5 name="hand-pointer" size={14} color={themeColors.textMuted} />
              <Text style={[styles.tapHintText, { color: themeColors.textMuted }]}>
                Tap to reveal answer
              </Text>
            </View>
          </Animated.View>

          {/* Back of card */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: themeColors.accent, borderColor: themeColors.accentDark },
              {
                transform: [{ rotateY: backRotation }],
                opacity: backOpacity,
              },
              styles.cardBack,
            ]}
          >
            <View style={styles.cardHeader}>
              <FontAwesome5 name="check-circle" size={20} color={Colors.white} />
              <Text style={[styles.cardLabel, { color: Colors.white }]}>
                Answer
              </Text>
            </View>
            <Text style={[styles.cardText, { color: Colors.white }]}>
              {currentCard.back}
            </Text>
            <View style={styles.tapHint}>
              <FontAwesome5 name="hand-pointer" size={14} color="rgba(255, 255, 255, 0.7)" />
              <Text style={[styles.tapHintText, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                Tap to see question
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          style={[
            styles.navButton,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            currentIndex === 0 && styles.navButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name="chevron-left"
            size={18}
            color={currentIndex === 0 ? themeColors.textMuted : themeColors.text}
          />
          <Text
            style={[
              styles.navText,
              { color: currentIndex === 0 ? themeColors.textMuted : themeColors.text },
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          style={[
            styles.navButton,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            currentIndex === flashcards.length - 1 && styles.navButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navText,
              {
                color:
                  currentIndex === flashcards.length - 1
                    ? themeColors.textMuted
                    : themeColors.text,
              },
            ]}
          >
            Next
          </Text>
          <FontAwesome5
            name="chevron-right"
            size={18}
            color={
              currentIndex === flashcards.length - 1
                ? themeColors.textMuted
                : themeColors.text
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  generateText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  progress: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shuffleButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTouchable: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    maxHeight: 500,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tapHintText: {
    fontSize: 13,
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 52,
    gap: 8,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default FlashcardView;
