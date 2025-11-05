import React from 'react';
import { Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface QuizResultsDisplayProps {
  score: number;
  totalQuestions: number;
  isChallenge: boolean;
  themeColors: any;
  onRetake: () => void;
  styles: any;
  t: (key: string) => string;
}

/**
 * QuizResultsDisplay - Post-quiz results display
 *
 * Features:
 * - Animated slide-up entrance
 * - Score display with gradient
 * - Percentage calculation
 * - Challenge complete message
 * - Retake button
 * - Alexandria theming
 */
const QuizResultsDisplay: React.FC<QuizResultsDisplayProps> = ({
  score,
  totalQuestions,
  isChallenge,
  themeColors,
  onRetake,
  styles,
  t
}) => {
  return (
    <Animatable.View
      animation="slideInUp"
      style={[
        styles.resultsContainer,
        {
          backgroundColor: themeColors?.overlay || 'rgba(255, 255, 255, 0.9)',
          borderTopColor: themeColors?.border || 'rgba(26, 44, 91, 0.2)'
        }
      ]}
    >
      <LinearGradient
        colors={[
          themeColors?.alexandriaGold || '#D4AF37',
          themeColors?.alexandriaBronze || '#CD7F32'
        ]}
        style={styles.scoreDisplay}
      >
        <Text style={styles.scoreLabel}>
          {isChallenge ? t('quiz.trialMastery') : t('quiz.wisdomGained')}
        </Text>
        <Animated.Text style={styles.scoreValue}>
          {score}/{totalQuestions}
        </Animated.Text>
        <Text style={styles.scorePercent}>
          {Math.round((score / totalQuestions) * 100)}%
        </Text>
        {isChallenge && (
          <Text style={styles.challengeCompleteText}>
            {t('quiz.trialComplete')}
          </Text>
        )}
      </LinearGradient>

      <TouchableOpacity onPress={onRetake}>
        <LinearGradient
          colors={[
            themeColors?.alexandriaNavy || '#1A2C5B',
            themeColors?.surfaceSecondary || '#2C3E50'
          ]}
          style={styles.retakeButton}
        >
          <FontAwesome5
            name="redo"
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.retakeButtonText}>
            {isChallenge ? t('quiz.retakeTrial') : t('quiz.seekMoreWisdom')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );
};

export default QuizResultsDisplay;
