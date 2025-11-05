import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SafeBackButton from '../SafeBackButton';

interface FlashcardHeaderProps {
  studyMode: string;
  currentCardIndex: number;
  totalCards: number;
  themeColors: {
    text: string;
  };
  onShowSettings: () => void;
  translate?: (key: string) => string;
}

const FlashcardHeader: React.FC<FlashcardHeaderProps> = ({
  studyMode,
  currentCardIndex,
  totalCards,
  themeColors,
  onShowSettings,
  translate = (key) => key,
}) => {
  const getHeaderTitle = () => {
    switch (studyMode) {
      case 'due':
        return '📅 Due Cards';
      case 'struggling':
        return '💪 Practice Mode';
      default:
        return '📚 Study Session';
    }
  };

  return (
    <View style={styles.header}>
      <SafeBackButton
        color={themeColors.text}
        size={20}
        fallbackScreen="Home"
        style={styles.backButton}
      />

      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          {getHeaderTitle()}
        </Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.text }]}>
          Card {currentCardIndex + 1} of {totalCards}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.sessionMenuButton}
        onPress={onShowSettings}
      >
        <MaterialIcons name="more-vert" size={24} color={themeColors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
  sessionMenuButton: {
    padding: 8,
  },
});

// Memoized export - prevents re-renders when props haven't changed
export default React.memo(FlashcardHeader);
