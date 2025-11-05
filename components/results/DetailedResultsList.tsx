import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QuestionResultCard from './QuestionResultCard';

interface DetailedResultsListProps {
  questions: any[];
  userAnswers: Record<string, any>;
  themeStyles: any;
}

/**
 * DetailedResultsList - Displays a list of all quiz questions with results
 *
 * Features:
 * - Question-by-question breakdown
 * - Shows correct/incorrect answers
 * - Displays explanations for each question
 * - Theme-aware styling
 */
const DetailedResultsList: React.FC<DetailedResultsListProps> = ({
  questions,
  userAnswers,
  themeStyles,
}) => {
  return (
    <View style={styles.questionsSection}>
      <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
        Detailed Results
      </Text>
      {questions.map((question, index) => (
        <QuestionResultCard
          key={question?.id || index}
          question={question}
          index={index}
          userAnswer={userAnswers[question?.id]}
          themeStyles={themeStyles}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  questionsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    marginHorizontal: 20,
  },
});

// Memoized export - only re-renders when questions/answers change
export default React.memo(DetailedResultsList);
