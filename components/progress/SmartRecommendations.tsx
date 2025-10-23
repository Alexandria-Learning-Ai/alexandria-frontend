import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  message: string;
  action: 'take_quiz' | 'focus_practice';
  subjectKey: string;
}

interface SmartRecommendationsProps {
  subjectRecommendations: Recommendation[];
  navigation: NavigationProp<any>;
  styles: any;
  currentTheme: any;
}

/**
 * SmartRecommendations - AI-powered learning recommendations
 *
 * Features:
 * - Priority-based recommendations (high/medium/low)
 * - Action buttons (Take Quiz/Focus Practice)
 * - Color-coded by priority
 * - Shows top 3 recommendations
 * - Auto-hides when no recommendations
 */
const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  subjectRecommendations,
  navigation,
  styles,
  currentTheme
}) => {
  if (subjectRecommendations.length === 0) return null;

  return (
    <Animatable.View animation="fadeInUp" delay={900} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🎯 Smart Recommendations</Text>

      {subjectRecommendations.slice(0, 3).map((rec, index) => {
        const priority = rec.priority || 'low';
        const priorityColor = priority === 'high' ? '#dc3545' :
                            priority === 'medium' ? '#ffc107' : '#17a2b8';

        return (
          <View key={index} style={styles.recommendationItem}>
            <View style={styles.recommendationHeader}>
              <FontAwesome5
                name={priority === 'high' ? 'exclamation-circle' : 'lightbulb'}
                size={14}
                color={priorityColor}
              />
              <Text style={[styles.recommendationPriority, { color: priorityColor }]}>
                {priority.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.recommendationMessage, currentTheme.categoryName]}>
              {rec.message}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: priorityColor + '20', borderColor: priorityColor }]}
              onPress={() => {
                if (rec.action === 'take_quiz' || rec.action === 'focus_practice') {
                  navigation.navigate('AskAlexandria', {
                    suggestedTopic: rec.subjectKey,
                    difficulty: 'medium',
                    numQuestions: 10,
                    autoGenerate: true, // Auto-start quiz from recommendation
                    focusWeaknesses: rec.action === 'focus_practice'
                  });
                }
              }}
            >
              <Text style={[styles.actionButtonText, { color: priorityColor }]}>
                {rec.action === 'take_quiz' ? 'Take Quiz' : 'Focus Practice'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </Animatable.View>
  );
};

export default SmartRecommendations;
