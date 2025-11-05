import React from 'react';
import { View, Text, ScrollView, Animated, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { safeDisplayText } from '../../utils/flashcardHelpers';
import SelfAssessment from './SelfAssessment';

interface AnswerData {
  correctAnswer?: string;
  explanation?: string;
  options?: Array<string | { text?: string; value?: string }>;
}

interface Card {
  back: string | AnswerData;
}

interface ThemeColors {
  text: string;
  accent: string;
  cardBackground: string;
  success: string;
}

interface FlashcardBackProps {
  card: Card;
  themeColors: ThemeColors;
  onAnswerQuality: (quality: number) => void;
  backInterpolate: Animated.AnimatedInterpolation<string | number>;
  showingAnswer: boolean;
}

const FlashcardBack: React.FC<FlashcardBackProps> = ({
  card,
  themeColors,
  onAnswerQuality,
  backInterpolate,
  showingAnswer,
}) => {
  const renderAnswerContent = (cardData: Card, colors: ThemeColors) => {
    const answerData: AnswerData =
      typeof cardData.back === 'object'
        ? cardData.back
        : {
            correctAnswer: 'View answer',
            explanation: typeof cardData.back === 'string' ? cardData.back : 'Study this concept carefully.',
          };

    return (
      <ScrollView style={styles.answerScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.flashcardAnswerLayout}>
          <View style={[styles.correctAnswerSection, { borderColor: `${colors.success}40` }]}>
            <FontAwesome5 name="check-circle" size={20} color={colors.success} style={{ marginBottom: 8 }} />
            <Text style={[styles.correctAnswerText, { color: colors.text }]}>
              {safeDisplayText(answerData.correctAnswer)}
            </Text>
          </View>

          {answerData.explanation && (
            <View style={[styles.explanationSection, { backgroundColor: `${colors.accent}15` }]}>
              <View style={styles.explanationHeader}>
                <FontAwesome5 name="lightbulb" size={16} color={colors.accent} />
                <Text style={[styles.explanationLabel, { color: colors.accent }]}>Explanation</Text>
              </View>
              <Text style={[styles.explanationText, { color: colors.text }]}>
                {safeDisplayText(answerData.explanation)}
              </Text>
            </View>
          )}

          {answerData.options && Array.isArray(answerData.options) && answerData.options.length > 0 && (
            <View style={styles.optionsSection}>
              <Text style={[styles.optionsTitle, { color: colors.text }]}>Answer Choices:</Text>
              {answerData.options.map((option, index) => {
                const optionText =
                  typeof option === 'string' ? option : option?.text || option?.value || safeDisplayText(option);
                const isCorrect = optionText === answerData.correctAnswer;
                return (
                  <View key={index} style={styles.optionRow}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {String.fromCharCode(65 + index)})
                    </Text>
                    <Text
                      style={[styles.optionText, { color: isCorrect ? colors.success : colors.text }]}
                    >
                      {isCorrect ? '✅ ' : ''}
                      {safeDisplayText(optionText)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <Animated.View
      style={[
        styles.card,
        styles.cardBack,
        { backgroundColor: themeColors.cardBackground },
        { transform: [{ rotateY: backInterpolate }] },
        showingAnswer && styles.cardVisible,
      ]}
    >
      <View style={styles.cardContent}>
        {renderAnswerContent(card, themeColors)}

        {/* Self-Assessment */}
        <SelfAssessment onAnswerQuality={onAnswerQuality} themeColors={themeColors} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    zIndex: 0,
  },
  cardVisible: {
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
  },
  answerScrollView: {
    flex: 1,
  },
  flashcardAnswerLayout: {
    paddingBottom: 16,
  },
  correctAnswerSection: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  correctAnswerText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  explanationSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 24,
  },
  optionsSection: {
    marginTop: 12,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 24,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
});

// Memoized export - only re-renders when card or answer changes
export default React.memo(FlashcardBack);
