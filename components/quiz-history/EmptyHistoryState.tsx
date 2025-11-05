import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface EmptyHistoryStateProps {
  currentThemeStyles: any;
  onTakeQuiz: () => void;
}

const EmptyHistoryState: React.FC<EmptyHistoryStateProps> = ({
  currentThemeStyles,
  onTakeQuiz,
}) => {
  return (
    <Animatable.View animation="fadeIn" style={[styles.emptyContainer, currentThemeStyles.emptyContainer]}>
      <FontAwesome5 name="history" size={64} color={currentThemeStyles.emptyIcon.color} />
      <Text style={[styles.emptyTitle, currentThemeStyles.emptyTitle]}>
        Your Journey Begins Here
      </Text>
      <Text style={[styles.emptySubtitle, currentThemeStyles.emptySubtitle]}>
        Complete and save quizzes to track your progress and build your knowledge history
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, currentThemeStyles.emptyButton]}
        onPress={onTakeQuiz}
        accessibilityRole="button"
        accessibilityLabel="Create your first quiz"
      >
        <FontAwesome5 name="fire" size={16} color={currentThemeStyles.emptyButtonText.color} />
        <Text style={[styles.emptyButtonText, currentThemeStyles.emptyButtonText]}>
          Create Your First Quiz
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

// Memoized export
export default React.memo(EmptyHistoryState);
