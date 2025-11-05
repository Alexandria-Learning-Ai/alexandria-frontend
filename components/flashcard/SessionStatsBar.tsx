import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { safeDisplayText } from '../../utils/flashcardHelpers';

interface DisplayInfo {
  icon?: string;
  color?: string;
}

interface CurrentCard {
  subject?: string;
  displayInfo?: DisplayInfo;
}

interface SessionStats {
  correct: number;
  studied: number;
  streak: number;
  timeSpent: number;
}

interface ThemeColors {
  cardBackground: string;
  text: string;
  accent: string;
  success: string;
}

interface SessionStatsBarProps {
  currentCard: CurrentCard;
  sessionStats: SessionStats;
  studyStreak: number;
  themeColors: ThemeColors;
}

const SessionStatsBar: React.FC<SessionStatsBarProps> = ({
  currentCard,
  sessionStats,
  studyStreak,
  themeColors,
}) => {
  return (
    <View style={[styles.sessionStatsBar, { backgroundColor: `${themeColors.cardBackground}40` }]}>
      {currentCard.subject && (
        <View style={styles.statItem}>
          <FontAwesome5
            name={currentCard.displayInfo?.icon || 'book'}
            size={12}
            color={currentCard.displayInfo?.color || themeColors.accent}
          />
          <Text style={[styles.statText, { color: themeColors.text, fontSize: 12 }]}>
            {safeDisplayText(currentCard.subject).substring(0, 8)}
            {safeDisplayText(currentCard.subject).length > 8 ? '...' : ''}
          </Text>
        </View>
      )}

      <View style={styles.statItem}>
        <FontAwesome5 name="check-circle" size={12} color={themeColors.success} />
        <Text style={[styles.statText, { color: themeColors.text }]}>
          {sessionStats.correct}/{sessionStats.studied}
        </Text>
      </View>

      {sessionStats.streak > 0 && (
        <View style={styles.statItem}>
          <FontAwesome5 name="fire" size={12} color="#ff6b6b" />
          <Text style={[styles.statText, { color: themeColors.text }]}>
            {sessionStats.streak}
          </Text>
        </View>
      )}

      <View style={styles.statItem}>
        <FontAwesome5 name="clock" size={12} color={themeColors.text} />
        <Text style={[styles.statText, { color: themeColors.text }]}>
          {Math.round(sessionStats.timeSpent / 1000 / 60)}m
        </Text>
      </View>

      {studyStreak > 0 && (
        <View style={styles.statItem}>
          <FontAwesome5 name="calendar-day" size={12} color={themeColors.accent} />
          <Text style={[styles.statText, { color: themeColors.text }]}>
            {studyStreak}d
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sessionStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

// Memoized export - only re-renders when stats change
export default React.memo(SessionStatsBar);
