import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { ThemeStyles } from '../../types';

interface AIAnalysis {
  mistakeType: string;
  granularTopic: string;
}

interface Weakness {
  topic: string;
  severity: number;
  aiAnalysis?: AIAnalysis[];
}

interface WeaknessInsightCardProps {
  weaknessAnalysis: Weakness[] | null;
  onRequestFocusQuiz: (weakness: Weakness) => void;
  onShowSubjectCorrection: () => void;
  themeStyles: ThemeStyles;
}

const getMostCommonMistakeType = (aiAnalyses: AIAnalysis[]): string | null => {
  if (!aiAnalyses.length) return null;
  const types: Record<string, number> = {};
  aiAnalyses.forEach(analysis => {
    types[analysis.mistakeType] = (types[analysis.mistakeType] || 0) + 1;
  });
  return Object.entries(types).reduce((a, b) => (types[a[0]] > types[b[0]] ? a : b))[0];
};

const getGranularTopics = (aiAnalyses: AIAnalysis[]): string[] => {
  return [...new Set(aiAnalyses.map(analysis => analysis.granularTopic))].slice(0, 2);
};

const getAIRecommendation = (
  topWeakness: Weakness,
  hasAIInsights: boolean,
  mostCommonMistakeType: string | null
): string => {
  const topicName = topWeakness.topic?.replace(/_/g, ' ') || 'this area';

  if (!hasAIInsights) {
    return `Strengthen your understanding of ${topicName}`;
  }

  switch (mostCommonMistakeType) {
    case 'conceptual':
      return `💡 Work on core concepts in ${topicName}`;
    case 'procedural':
      return `⚙️ Practice step-by-step processes for ${topicName}`;
    case 'factual':
      return `📚 Review key facts about ${topicName}`;
    case 'analytical':
      return `🧠 Develop analytical skills for ${topicName}`;
    default:
      return `🎯 Focus on ${topicName} fundamentals`;
  }
};

const WeaknessInsightCard: React.FC<WeaknessInsightCardProps> = React.memo(({
  weaknessAnalysis,
  onRequestFocusQuiz,
  onShowSubjectCorrection,
  themeStyles,
}) => {
  if (!weaknessAnalysis || weaknessAnalysis.length === 0) return null;

  const topWeakness = weaknessAnalysis[0];
  if (!topWeakness) return null;

  // Get AI insights from the weakness analysis
  const aiInsights = topWeakness.aiAnalysis || [];
  const hasAIInsights = aiInsights.length > 0;

  // ✨ Performance: Memoize expensive computations
  const mostCommonMistakeType = useMemo(
    () => hasAIInsights ? getMostCommonMistakeType(aiInsights) : null,
    [hasAIInsights, aiInsights]
  );

  const granularTopics = useMemo(
    () => hasAIInsights ? getGranularTopics(aiInsights) : [],
    [hasAIInsights, aiInsights]
  );

  return (
    <Animatable.View animation="fadeInUp" delay={1200} style={[styles.insightCard, themeStyles.insightCard]}>
      <View style={styles.insightHeader}>
        <FontAwesome5 name="brain" size={20} color={(themeStyles.insightTitle as any)?.color || '#D4AF37'} />
        <Text style={[styles.insightTitle, themeStyles.insightTitle]}>
          {hasAIInsights ? 'AI-Powered Analysis' : "Alexandria's Focus Area"}
        </Text>
      </View>

      <Text style={[styles.insightText, themeStyles.insightText]}>
        <Text style={{ fontWeight: 'bold' }}>{topWeakness.topic?.replace(/_/g, ' ') || 'General'}</Text>
      </Text>

      <Text style={[styles.insightDetail, themeStyles.insightDetail]}>
        Accuracy: <Text style={{ fontWeight: 'bold' }}>{(100 - (topWeakness.severity || 0)).toFixed(0)}%</Text> •
        {hasAIInsights && mostCommonMistakeType && (
          <>
            {' '}
            Gap Type: <Text style={{ fontWeight: 'bold' }}>{mostCommonMistakeType}</Text>
          </>
        )}
      </Text>

      {/* AI Recommendation */}
      <View style={[styles.aiRecommendationBox, themeStyles.aiRecommendationBox]}>
        <FontAwesome5 name="lightbulb" size={14} color={(themeStyles.insightTitle as any)?.color || '#D4AF37'} />
        <Text style={[styles.aiRecommendationText, themeStyles.aiRecommendationText]}>
          {getAIRecommendation(topWeakness, hasAIInsights, mostCommonMistakeType)}
        </Text>
      </View>

      {/* Granular topics if available */}
      {granularTopics.length > 0 && (
        <View style={styles.granularTopicsContainer}>
          <Text style={[styles.granularTopicsLabel, themeStyles.granularTopicsLabel]}>Specific areas:</Text>
          <View style={styles.topicsRow}>
            {granularTopics.map((topic, index) => (
              <View key={index} style={[styles.topicTag, themeStyles.topicTag]}>
                <Text style={[styles.topicTagText, themeStyles.topicTagText]}>
                  {topic?.replace(/_/g, ' ') || 'General'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.focusQuizButton, themeStyles.focusQuizButton]}
        onPress={() => onRequestFocusQuiz(topWeakness)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Generate a focused quiz on ${topWeakness.topic?.replace(/_/g, ' ') || 'this topic'}`}
        accessibilityHint="Double tap to create a personalized quiz to improve in this area"
      >
        <FontAwesome5 name="book-reader" size={16} color={(themeStyles.focusQuizButtonText as any)?.color || '#FFFFFF'} />
        <Text style={[styles.focusQuizButtonText, themeStyles.focusQuizButtonText]}>Generate Focus Quiz</Text>
      </TouchableOpacity>

      {/* Subject Correction Button */}
      <TouchableOpacity
        style={[styles.subjectCorrectionButton, themeStyles.subjectCorrectionButton]}
        onPress={onShowSubjectCorrection}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Correct subject classification"
        accessibilityHint="Double tap if the quiz subject was incorrectly identified"
      >
        <FontAwesome5 name="edit" size={14} color="#D4AF37" />
        <Text style={[styles.subjectCorrectionText, themeStyles.subjectCorrectionText]}>
          Wrong subject? Correct it
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );
});

// ✨ Performance: Display name for debugging
WeaknessInsightCard.displayName = 'WeaknessInsightCard';

const styles = StyleSheet.create({
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
  },
  insightText: {
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  insightDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  aiRecommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  aiRecommendationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2C5B',
  },
  granularTopicsContainer: {
    marginBottom: 12,
  },
  granularTopicsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicTag: {
    backgroundColor: 'rgba(26, 44, 91, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topicTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A2C5B',
  },
  focusQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2C5B',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  focusQuizButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subjectCorrectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    gap: 6,
  },
  subjectCorrectionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4AF37',
    textDecorationLine: 'underline',
  },
});

export default WeaknessInsightCard;
