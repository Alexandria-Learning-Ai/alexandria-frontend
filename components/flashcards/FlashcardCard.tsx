import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  Animated
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Flashcard } from '../../types';

interface FlashcardCardProps {
  flashcard: Flashcard;
  onQualitySelect: (quality: number) => void;
  isDarkMode?: boolean;
}

/**
 * FlashcardCard - Component for displaying and flipping individual flashcards
 */
const FlashcardCard: React.FC<FlashcardCardProps> = ({
  flashcard,
  onQualitySelect,
  isDarkMode = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQualityButtons, setShowQualityButtons] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent double-taps

  const handleFlip = () => {
    if (isProcessing) return; // Ignore taps while processing

    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      // Show quality buttons after flipping to back
      setTimeout(() => setShowQualityButtons(true), 300);
    } else {
      setShowQualityButtons(false);
    }
  };

  const handleQualitySelect = (quality: number) => {
    if (isProcessing) return; // Prevent double-taps

    setIsProcessing(true);
    setShowQualityButtons(false); // Hide buttons immediately

    // Call the parent handler
    onQualitySelect(quality);

    // Reset for next card after a short delay
    setTimeout(() => {
      setIsFlipped(false);
      setIsProcessing(false);
    }, 300);
  };

  const cardBgColor = isDarkMode ? '#2C2C2E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const subtitleColor = isDarkMode ? '#999999' : '#666666';

  return (
    <View style={styles.container}>
      {/* Flashcard */}
      <Pressable onPress={handleFlip} style={styles.cardPressable}>
        <Animatable.View
          animation={isFlipped ? 'flipInY' : 'flipInX'}
          duration={300}
          style={[styles.card, { backgroundColor: cardBgColor }]}
        >
          {!isFlipped ? (
            // Front of card
            <View style={styles.cardContent}>
              <Text style={[styles.label, { color: subtitleColor }]}>Question</Text>
              <Text style={[styles.text, { color: textColor }]}>
                {typeof flashcard.front === 'string'
                  ? flashcard.front
                  : JSON.stringify(flashcard.front)}
              </Text>
              <Text style={[styles.hint, { color: subtitleColor }]}>
                Tap to reveal answer
              </Text>
            </View>
          ) : (
            // Back of card
            <View style={styles.cardContent}>
              <Text style={[styles.label, { color: subtitleColor }]}>Answer</Text>
              <Text style={[styles.text, { color: textColor }]}>
                {typeof flashcard.back === 'string'
                  ? flashcard.back
                  : typeof flashcard.back === 'object' && 'correctAnswer' in flashcard.back
                  ? flashcard.back.correctAnswer as string
                  : JSON.stringify(flashcard.back)}
              </Text>
              {typeof flashcard.back === 'object' && 'explanation' in flashcard.back && flashcard.back.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={[styles.explanationLabel, { color: subtitleColor }]}>
                    Explanation:
                  </Text>
                  <Text style={[styles.explanationText, { color: textColor }]}>
                    {flashcard.back.explanation as string}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Animatable.View>
      </Pressable>

      {/* Quality Rating Buttons */}
      {showQualityButtons && (
        <Animatable.View animation="fadeInUp" duration={300} style={styles.qualityContainer}>
          <Text style={[styles.qualityPrompt, { color: textColor }]}>
            How well did you know this?
          </Text>
          <View style={styles.qualityButtons}>
            <QualityButton
              label="Forgot"
              quality={0}
              color="#EF4444"
              onPress={handleQualitySelect}
              disabled={isProcessing}
            />
            <QualityButton
              label="Hard"
              quality={2}
              color="#F97316"
              onPress={handleQualitySelect}
              disabled={isProcessing}
            />
            <QualityButton
              label="Good"
              quality={4}
              color="#84CC16"
              onPress={handleQualitySelect}
              disabled={isProcessing}
            />
            <QualityButton
              label="Perfect"
              quality={5}
              color="#22C55E"
              onPress={handleQualitySelect}
              disabled={isProcessing}
            />
          </View>
        </Animatable.View>
      )}

      {/* Card Metadata */}
      <View style={styles.metadata}>
        <Text style={[styles.metadataText, { color: subtitleColor }]}>
          {flashcard.subject}
          {flashcard.difficulty && ` • ${flashcard.difficulty}`}
          {flashcard.reviewCount !== undefined && ` • Reviewed ${flashcard.reviewCount}x`}
        </Text>
      </View>
    </View>
  );
};

interface QualityButtonProps {
  label: string;
  quality: number;
  color: string;
  onPress: (quality: number) => void;
  disabled?: boolean;
}

const QualityButton: React.FC<QualityButtonProps> = ({ label, quality, color, onPress, disabled = false }) => (
  <Pressable
    style={({ pressed }) => [
      styles.qualityButton,
      {
        backgroundColor: color,
        opacity: disabled ? 0.5 : (pressed ? 0.8 : 1)
      }
    ]}
    onPress={() => !disabled && onPress(quality)}
    disabled={disabled}
  >
    <Text style={styles.qualityButtonText}>{label}</Text>
  </Pressable>
);

interface Styles {
  container: ViewStyle;
  cardPressable: ViewStyle;
  card: ViewStyle;
  cardContent: ViewStyle;
  label: TextStyle;
  text: TextStyle;
  hint: TextStyle;
  explanationContainer: ViewStyle;
  explanationLabel: TextStyle;
  explanationText: TextStyle;
  qualityContainer: ViewStyle;
  qualityPrompt: TextStyle;
  qualityButtons: ViewStyle;
  qualityButton: ViewStyle;
  qualityButtonText: TextStyle;
  metadata: ViewStyle;
  metadataText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    padding: 16,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardPressable: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 32,
    minHeight: 300,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  text: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 28,
  },
  hint: {
    fontSize: 14,
    marginTop: 24,
    fontStyle: 'italic',
  },
  explanationContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    width: '100%',
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  qualityContainer: {
    marginBottom: 20,
  },
  qualityPrompt: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  qualityButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  metadata: {
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FlashcardCard;
