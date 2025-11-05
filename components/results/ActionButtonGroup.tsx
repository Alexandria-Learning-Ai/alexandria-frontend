import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemeStyles } from '../../types';

interface ActionButtonGroupProps {
  // Explanation actions
  showExplanations: boolean;
  loadingExplanations: boolean;
  onToggleExplanations: () => void;

  // Save actions
  savingQuiz: boolean;
  onSaveQuiz: () => void;

  // Share actions
  enableShareFeatures: boolean;
  onShowShareOptions: () => void;
  onSaveQuizForLater: () => void;

  // Navigation
  navigation: NativeStackNavigationProp<any>;

  // Theme
  themeStyles: ThemeStyles;
}

const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  showExplanations,
  loadingExplanations,
  onToggleExplanations,
  savingQuiz,
  onSaveQuiz,
  enableShareFeatures,
  onShowShareOptions,
  onSaveQuizForLater,
  navigation,
  themeStyles,
}) => {
  return (
    <View style={styles.actionButtonsContainer}>
      <View style={styles.enhancedActionsRow}>
        <TouchableOpacity
          style={[styles.enhancedActionButton, themeStyles.explanationButton]}
          onPress={onToggleExplanations}
          disabled={loadingExplanations}
          activeOpacity={0.8}
        >
          {loadingExplanations ? (
            <ActivityIndicator
              size="small"
              color={(themeStyles.explanationButtonText as any)?.color || '#D4AF37'}
            />
          ) : (
            <FontAwesome5
              name={showExplanations ? 'eye-slash' : 'magic'}
              size={18}
              color={(themeStyles.explanationButtonText as any)?.color || '#D4AF37'}
            />
          )}
          <Text style={[styles.enhancedButtonText, themeStyles.explanationButtonText]}>
            {loadingExplanations
              ? 'Analyzing Your Answers...'
              : showExplanations
              ? 'Hide Analysis'
              : 'Explain Wrong Answers'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.enhancedActionButton, themeStyles.saveQuizButton]}
          onPress={onSaveQuiz}
          disabled={savingQuiz}
          activeOpacity={0.8}
        >
          {savingQuiz ? (
            <ActivityIndicator
              size="small"
              color={(themeStyles.saveQuizButtonText as any)?.color || '#1A2C5B'}
            />
          ) : (
            <FontAwesome5
              name="save"
              size={18}
              color={(themeStyles.saveQuizButtonText as any)?.color || '#1A2C5B'}
            />
          )}
          <Text style={[styles.enhancedButtonText, themeStyles.saveQuizButtonText]}>
            {savingQuiz ? 'Saving Quiz...' : 'Save to History'}
          </Text>
        </TouchableOpacity>
      </View>

      {enableShareFeatures && (
        <View style={styles.enhancedActionsRow}>
          <TouchableOpacity
            style={[styles.enhancedActionButton, themeStyles.shareButton]}
            onPress={onShowShareOptions}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="share-alt"
              size={18}
              color={(themeStyles.shareButtonText as any)?.color || '#17a2b8'}
            />
            <Text style={[styles.enhancedButtonText, themeStyles.shareButtonText]}>
              Share My Score
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enhancedActionButton, themeStyles.copyButton]}
            onPress={onSaveQuizForLater}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="bookmark"
              size={18}
              color={(themeStyles.copyButtonText as any)?.color || '#28a745'}
            />
            <Text style={[styles.enhancedButtonText, themeStyles.copyButtonText]}>
              Bookmark Quiz
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionButton, styles.primaryButton, themeStyles.primaryButton]}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <FontAwesome5
          name="home"
          size={20}
          color={(themeStyles.primaryButtonText as any)?.color || '#FFFFFF'}
        />
        <Text style={[styles.buttonText, themeStyles.primaryButtonText]}>Return Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton, themeStyles.secondaryButton]}
        onPress={() => navigation.navigate('AskAlexandria')}
        activeOpacity={0.8}
      >
        <FontAwesome5
          name="redo"
          size={20}
          color={(themeStyles.secondaryButtonText as any)?.color || '#1A2C5B'}
        />
        <Text style={[styles.buttonText, themeStyles.secondaryButtonText]}>Create Another Quiz</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  enhancedActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  enhancedActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  enhancedButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#1A2C5B',
  },
  secondaryButton: {
    backgroundColor: '#F8F4E3',
    borderWidth: 2,
    borderColor: '#1A2C5B',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ActionButtonGroup;
