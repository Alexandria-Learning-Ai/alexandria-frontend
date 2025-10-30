import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface DifficultyProgression {
  currentLevel: string;
  readyForNext: boolean;
  recommendation: string;
  nextSteps: string[];
}

interface DifficultyProgressionCardProps {
  difficultyProgression: DifficultyProgression | null;
  styles: any;
  currentTheme: any;
}

/**
 * DifficultyProgressionCard - Difficulty level tracking
 *
 * Features:
 * - Current difficulty level display
 * - Readiness indicator (ready to advance/keep practicing)
 * - AI-generated recommendations
 * - Next steps checklist
 * - Color-coded readiness badge
 */
const DifficultyProgressionCard: React.FC<DifficultyProgressionCardProps> = ({
  difficultyProgression,
  styles,
  currentTheme
}) => {
  if (!difficultyProgression) return null;

  return (
    <Animatable.View animation="fadeInUp" delay={1000} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📊 Difficulty Progression</Text>

      <View style={styles.difficultyHeader}>
        <Text style={[styles.currentLevel, currentTheme.categoryName]}>
          Current Level: <Text style={{ color: '#3498DB' }}>{difficultyProgression.currentLevel}</Text>
        </Text>
        <View style={[
          styles.readinessIndicator,
          {
            backgroundColor: difficultyProgression.readyForNext ? '#28a745' : '#ffc107'
          }
        ]}>
          <Text style={styles.readinessText}>
            {difficultyProgression.readyForNext ? 'Ready to advance!' : 'Keep practicing'}
          </Text>
        </View>
      </View>

      <Text style={[styles.difficultyRecommendation, currentTheme.categoryName]}>
        {difficultyProgression.recommendation}
      </Text>

      <View style={styles.nextStepsContainer}>
        <Text style={[styles.nextStepsTitle, currentTheme.categoryName]}>Next Steps:</Text>
        {difficultyProgression.nextSteps.map((step, index) => (
          <Text key={index} style={[styles.nextStepItem, currentTheme.categoryCount]}>
            • {step}
          </Text>
        ))}
      </View>
    </Animatable.View>
  );
};

export default DifficultyProgressionCard;
