import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ThemeColors {
  text: string;
  accent: string;
}

interface SelfAssessmentProps {
  onAnswerQuality: (quality: number) => void;
  themeColors: ThemeColors;
}

const SelfAssessment: React.FC<SelfAssessmentProps> = ({
  onAnswerQuality,
  themeColors,
}) => {
  return (
    <View style={[styles.selfAssessmentFooter, { borderTopColor: `${themeColors.accent}30` }]}>
      <Text style={[styles.assessmentPrompt, { color: themeColors.text }]}>
        How well did you know this? 🤔
      </Text>
      <View style={styles.assessmentButtons}>
        <TouchableOpacity
          style={[styles.assessmentButton, styles.hardButton]}
          onPress={() => onAnswerQuality(1)}
          activeOpacity={0.8}
        >
          <Text style={styles.assessmentEmoji}>😰</Text>
          <Text style={styles.assessmentText}>Hard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.assessmentButton, styles.goodButton]}
          onPress={() => onAnswerQuality(3)}
          activeOpacity={0.8}
        >
          <Text style={styles.assessmentEmoji}>😐</Text>
          <Text style={styles.assessmentText}>Good</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.assessmentButton, styles.easyButton]}
          onPress={() => onAnswerQuality(5)}
          activeOpacity={0.8}
        >
          <Text style={styles.assessmentEmoji}>✅</Text>
          <Text style={styles.assessmentText}>Easy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selfAssessmentFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
  assessmentPrompt: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  assessmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  assessmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hardButton: {
    backgroundColor: '#fee2e2',
  },
  goodButton: {
    backgroundColor: '#fef3c7',
  },
  easyButton: {
    backgroundColor: '#d1fae5',
  },
  assessmentEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  assessmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
});

// Memoized export - static UI component
export default React.memo(SelfAssessment);
