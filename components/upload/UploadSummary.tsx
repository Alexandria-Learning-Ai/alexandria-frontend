import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { quizTypeOptions, difficultyOptions } from '../../constants/uploadOptions';

interface ThemeColors {
  alexandriaGold: string;
  text: string;
  [key: string]: string;
}

interface UploadSummaryProps {
  uploadPurpose: 'study' | 'quiz';
  selectedSubject: any;
  quizTypes: string[];
  difficulty: string;
  numQuestions: number;
  themeColors: ThemeColors;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * UploadSummary - Configuration summary display
 *
 * Features:
 * - Shows upload purpose (Study/Quiz)
 * - Displays selected subject
 * - Quiz-specific settings (type, difficulty, questions)
 * - Theme-aware styling with gold accents
 */
const UploadSummary: React.FC<UploadSummaryProps> = ({
  uploadPurpose,
  selectedSubject,
  quizTypes,
  difficulty,
  numQuestions,
  themeColors,
  styles,
  t
}) => {
  return (
    <View style={[
      styles.summaryContainer,
      {
        backgroundColor: themeColors.alexandriaGold + '15',
        borderColor: themeColors.alexandriaGold + '40'
      }
    ]}>
      <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
        {uploadPurpose === 'study' ? 'Study Material Configuration' : 'Quiz Configuration'}
      </Text>

      {/* Purpose Summary */}
      <View style={styles.summaryRow}>
        <FontAwesome5
          name={uploadPurpose === 'study' ? "book-reader" : "brain"}
          size={16}
          color={themeColors.alexandriaGold}
        />
        <Text style={[styles.summaryText, { color: themeColors.text }]}>
          Purpose: {uploadPurpose === 'study' ? '📚 Add to Study Library' : '🧠 Generate Practice Quiz'}
        </Text>
      </View>

      {/* Subject summary row */}
      {selectedSubject && (
        <View style={styles.summaryRow}>
          <FontAwesome5 name="tags" size={16} color={themeColors.alexandriaGold} />
          <Text style={[styles.summaryText, { color: themeColors.text }]}>
            {t('upload.subject')}: {selectedSubject?.name || ''}
          </Text>
        </View>
      )}

      {/* Quiz-specific summary */}
      {uploadPurpose === 'quiz' && (
        <>
          <View style={styles.summaryRow}>
            <FontAwesome5 name="question-circle" size={16} color={themeColors.alexandriaGold} />
            <Text style={[styles.summaryText, { color: themeColors.text }]}>
              Type: {
                quizTypes.includes('all')
                  ? 'All Types'
                  : quizTypes.length === 1
                    ? quizTypeOptions.find(opt => opt.value === quizTypes[0])?.label || 'Custom'
                    : `${quizTypes.length} types`
              }
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <FontAwesome5 name="signal" size={16} color={themeColors.alexandriaGold} />
            <Text style={[styles.summaryText, { color: themeColors.text }]}>
              Difficulty: {difficultyOptions.find(opt => opt.value === difficulty)?.label || 'Medium'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <FontAwesome5 name="list-ol" size={16} color={themeColors.alexandriaGold} />
            <Text style={[styles.summaryText, { color: themeColors.text }]}>
              Questions: {numQuestions}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export default UploadSummary;
