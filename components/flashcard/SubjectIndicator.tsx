import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { safeDisplayText } from '../../utils/flashcardHelpers';

interface DisplayInfo {
  icon?: string;
  color?: string;
}

interface ThemeColors {
  text: string;
  accent: string;
}

interface SubjectIndicatorProps {
  subject?: string;
  course?: string;
  topic?: string;
  difficulty?: string;
  displayInfo?: DisplayInfo;
  themeColors: ThemeColors;
}

const SubjectIndicator: React.FC<SubjectIndicatorProps> = ({
  subject,
  course,
  topic,
  difficulty = 'medium',
  displayInfo,
  themeColors,
}) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return '#10b981';
      case 'hard':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  return (
    <View style={styles.subjectIndicator}>
      <View style={styles.hierarchicalSubjectDisplay}>
        <View
          style={[
            styles.subjectBadge,
            {
              backgroundColor: displayInfo?.color
                ? `${displayInfo.color}20`
                : `${themeColors.accent}20`,
            },
          ]}
        >
          {displayInfo?.icon && (
            <FontAwesome5
              name={displayInfo.icon}
              size={14}
              color={displayInfo?.color || themeColors.accent}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.subjectText,
              { color: displayInfo?.color || themeColors.accent },
            ]}
          >
            {safeDisplayText(subject) || 'General'}
          </Text>
        </View>

        {course && (
          <View style={styles.courseBadge}>
            <FontAwesome5
              name="chevron-right"
              size={10}
              color={themeColors.text}
              style={{ opacity: 0.5 }}
            />
            <Text style={[styles.courseText, { color: themeColors.text }]}>
              {safeDisplayText(course)}
            </Text>
          </View>
        )}

        {topic && (
          <View style={styles.topicBadge}>
            <FontAwesome5
              name="chevron-right"
              size={8}
              color={themeColors.text}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.topicText, { color: themeColors.text }]}>
              {safeDisplayText(topic)}
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.difficultyBadge,
          { backgroundColor: getDifficultyColor(difficulty) },
        ]}
      >
        <Text style={styles.difficultyText}>
          {safeDisplayText(difficulty).toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  subjectIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hierarchicalSubjectDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '700',
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseText: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '600',
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicText: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

// Memoized export - static for each card
export default React.memo(SubjectIndicator);
