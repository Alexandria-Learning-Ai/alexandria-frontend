import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { safeDisplayText } from '../../utils/flashcardHelpers';
import SubjectIndicator from './SubjectIndicator';

interface DisplayInfo {
  icon?: string;
  color?: string;
}

interface Card {
  subject?: string;
  course?: string;
  topic?: string;
  difficulty?: string;
  displayInfo?: DisplayInfo;
  front: string;
}

interface ThemeColors {
  text: string;
  accent: string;
  cardBackground: string;
}

interface FlashcardFrontProps {
  card: Card;
  themeColors: ThemeColors;
  isDarkMode: boolean;
  onFlip: () => void;
  frontInterpolate: Animated.AnimatedInterpolation<string | number>;
  showingAnswer: boolean;
}

const FlashcardFront: React.FC<FlashcardFrontProps> = ({
  card,
  themeColors,
  isDarkMode,
  onFlip,
  frontInterpolate,
  showingAnswer,
}) => {
  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: themeColors.cardBackground },
        { transform: [{ rotateY: frontInterpolate }] },
        !showingAnswer && styles.cardVisible,
      ]}
    >
      <View style={styles.cardContent}>
        {/* Subject Indicator */}
        <SubjectIndicator
          subject={card.subject}
          course={card.course}
          topic={card.topic}
          difficulty={card.difficulty}
          displayInfo={card.displayInfo}
          themeColors={themeColors}
        />

        {/* Question */}
        <ScrollView style={styles.questionScrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.questionContainer}>
            <Text style={[styles.cardQuestion, { color: themeColors.text }]}>
              {safeDisplayText(card.front)}
            </Text>
          </View>
        </ScrollView>

        {/* Interaction Hints */}
        <View style={styles.interactionHints}>
          <View style={styles.hintItem}>
            <FontAwesome5 name="hand-pointer" size={14} color={themeColors.text} style={{ opacity: 0.6 }} />
            <Text style={[styles.hintText, { color: themeColors.text }]}>Tap to reveal answer</Text>
          </View>
          <View style={styles.hintItem}>
            <FontAwesome5 name="arrows-alt-h" size={14} color={themeColors.text} style={{ opacity: 0.6 }} />
            <Text style={[styles.hintText, { color: themeColors.text }]}>Swipe to navigate</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.showAnswerButton, { backgroundColor: themeColors.accent }]}
        onPress={onFlip}
        activeOpacity={0.8}
      >
        <FontAwesome5 name="eye" size={18} color={isDarkMode ? '#1A2C5B' : '#F8F4E3'} style={{ marginRight: 8 }} />
        <Text style={[styles.showAnswerText, { color: isDarkMode ? '#1A2C5B' : '#F8F4E3' }]}>
          Show Answer
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardVisible: {
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
  },
  questionScrollContainer: {
    flex: 1,
    marginVertical: 16,
  },
  questionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    paddingVertical: 20,
  },
  cardQuestion: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
  },
  interactionHints: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.6,
  },
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
  },
  showAnswerText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

// Memoized export - only re-renders when card changes
export default React.memo(FlashcardFront);
