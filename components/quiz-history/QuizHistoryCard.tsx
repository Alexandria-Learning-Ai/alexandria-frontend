import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface QuizHistoryCardProps {
  quiz: any;
  index: number;
  currentThemeStyles: any;
  onDelete: (quiz: any) => void;
  onRetake: (quiz: any) => void;
  onReview: (quiz: any) => void;
}

const QuizHistoryCard: React.FC<QuizHistoryCardProps> = ({
  quiz,
  index,
  currentThemeStyles,
  onDelete,
  onRetake,
  onReview,
}) => {
  const results = quiz.results || {};
  const percentage = results.percentage || 0;
  const score = results.score || 0;
  const totalQuestions = results.totalQuestions || quiz.questions?.length || 0;
  const completedDate = new Date(quiz.metadata?.completedAt || quiz.results?.completedAt);
  const difficulty = quiz.metadata?.difficulty || 'medium';

  const getPerformanceColor = (pct: number) => {
    if (pct >= 90) return '#D4AF37'; // Gold
    if (pct >= 80) return '#28a745'; // Green
    if (pct >= 70) return '#17a2b8'; // Blue
    if (pct >= 60) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  const getPerformanceIcon = (pct: number) => {
    if (pct >= 90) return 'trophy';
    if (pct >= 80) return 'star';
    if (pct >= 70) return 'thumbs-up';
    if (pct >= 60) return 'check-circle';
    return 'times-circle';
  };

  const performanceColor = getPerformanceColor(percentage);
  const performanceIcon = getPerformanceIcon(percentage);

  return (
    <Animatable.View
      animation="slideInUp"
      delay={index * 100}
      style={[styles.quizCard, currentThemeStyles.quizCard]}
    >
      {/* Quiz Header */}
      <View style={styles.quizHeader}>
        <View style={styles.quizInfo}>
          <View style={[styles.performanceIcon, { backgroundColor: performanceColor }]}>
            <FontAwesome5 name={performanceIcon} size={16} color="#FFFFFF" />
          </View>
          <View style={styles.quizDetails}>
            <Text style={[styles.quizTitle, currentThemeStyles.quizTitle]}>
              {quiz.title || `Quiz - ${completedDate.toLocaleDateString()}`}
            </Text>
            <View style={styles.quizMeta}>
              <View style={styles.metaItem}>
                <FontAwesome5 name="calendar" size={12} color={currentThemeStyles.metaText.color} />
                <Text style={[styles.metaText, currentThemeStyles.metaText]}>
                  {completedDate.toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <FontAwesome5 name="clock" size={12} color={currentThemeStyles.metaText.color} />
                <Text style={[styles.metaText, currentThemeStyles.metaText]}>
                  {completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <FontAwesome5 name="chart-line" size={12} color={currentThemeStyles.metaText.color} />
                <Text style={[styles.metaText, currentThemeStyles.metaText]}>
                  {difficulty}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, currentThemeStyles.deleteButton]}
          onPress={() => onDelete(quiz)}
        >
          <FontAwesome5 name="trash" size={14} color={currentThemeStyles.deleteButtonText.color} />
        </TouchableOpacity>
      </View>

      {/* Score Section */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreNumber, { color: performanceColor }]}>
            {percentage}%
          </Text>
          <Text style={[styles.scoreLabel, currentThemeStyles.scoreLabel]}>
            {score}/{totalQuestions} correct
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome5 name="list" size={14} color={currentThemeStyles.statIcon.color} />
            <Text style={[styles.statText, currentThemeStyles.statText]}>
              {totalQuestions} questions
            </Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome5 name="check-circle" size={14} color="#28a745" />
            <Text style={[styles.statText, { color: '#28a745' }]}>
              {score} correct
            </Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome5 name="times-circle" size={14} color="#dc3545" />
            <Text style={[styles.statText, { color: '#dc3545' }]}>
              {totalQuestions - score} wrong
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.retakeButton, currentThemeStyles.retakeButton]}
          onPress={() => onRetake(quiz)}
        >
          <FontAwesome5 name="redo" size={14} color={currentThemeStyles.retakeButtonText.color} />
          <Text style={[styles.actionButtonText, currentThemeStyles.retakeButtonText]}>
            Retake
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.reviewButton, currentThemeStyles.reviewButton]}
          onPress={() => onReview(quiz)}
        >
          <FontAwesome5 name="eye" size={14} color={currentThemeStyles.reviewButtonText.color} />
          <Text style={[styles.actionButtonText, currentThemeStyles.reviewButtonText]}>
            Review
          </Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  quizCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quizInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizDetails: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreSection: {
    marginBottom: 16,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {},
  reviewButton: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

// Memoized export
export default React.memo(QuizHistoryCard);
