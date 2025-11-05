import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  AchievementSummaryCard,
  InsightsDisplay,
} from '../AchievementComponents';
import { ThemeStyles } from '../../types';
import logger from '../../utils/logger';

interface UserProfile {
  current_streak?: number;
  total_achievement_points?: number;
  performance_level?: string;
  subject_accuracies?: Record<string, number>;
}

interface AnalyticsSectionProps {
  loadingAnalytics: boolean;
  analyticsAchievements: any[];
  analyticsInsights: any[];
  userProfile: UserProfile | null;
  metadata: any;
  questions: any[];
  isDarkMode: boolean;
  themeStyles: ThemeStyles;
  HierarchicalSubjectDisplay?: React.ComponentType<any>;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = React.memo(({
  loadingAnalytics,
  analyticsAchievements,
  analyticsInsights,
  userProfile,
  metadata,
  questions,
  isDarkMode,
  themeStyles,
  HierarchicalSubjectDisplay,
}) => {
  // ✨ Performance: Memoize event handlers to prevent child re-renders
  const handleViewAll = useCallback(() => {
    logger.info('View all achievements tapped');
  }, []);

  const handleInsightTap = useCallback((insight: any) => {
    logger.info('Insight tapped:', insight);
    Alert.alert(
      insight.title,
      insight.message + '\n\n' + (insight.recommendations?.join('\n• ') || ''),
      [{ text: 'Got it!' }]
    );
  }, []);
  if (loadingAnalytics) {
    return (
      <View style={[styles.loadingContainer, themeStyles.questionCard]}>
        <ActivityIndicator size="small" color={(themeStyles.title as any)?.color || '#1A2C5B'} />
        <Text style={[styles.loadingText, themeStyles.subtitle]}>Loading AI insights...</Text>
      </View>
    );
  }

  return (
    <>
      {/* Achievement Summary */}
      {analyticsAchievements.length > 0 && (
        <AchievementSummaryCard
          achievements={analyticsAchievements}
          visible={true}
          isDarkMode={isDarkMode}
          onViewAll={handleViewAll}
        />
      )}

      {/* Learning Insights */}
      {analyticsInsights.length > 0 && (
        <InsightsDisplay
          insights={analyticsInsights}
          visible={true}
          isDarkMode={isDarkMode}
          onInsightTap={handleInsightTap}
        />
      )}

      {/* Enhanced User Profile Stats */}
      {userProfile && (
        <Animatable.View animation="fadeInUp" delay={800}>
          <View style={[styles.profileStatsCard, themeStyles.questionCard]}>
            <View style={styles.profileHeader}>
              <FontAwesome5
                name="user-graduate"
                size={20}
                color={(themeStyles.insightTitle as any)?.color || '#D4AF37'}
              />
              <Text style={[styles.profileTitle, themeStyles.insightTitle]}>Your Learning Journey</Text>
            </View>

            <View style={styles.profileStatsGrid}>
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, themeStyles.title]}>
                  {userProfile.current_streak || 0}
                </Text>
                <Text style={[styles.profileStatLabel, themeStyles.subtitle]}>Current Streak</Text>
              </View>

              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, themeStyles.title]}>
                  {userProfile.total_achievement_points || 0}
                </Text>
                <Text style={[styles.profileStatLabel, themeStyles.subtitle]}>Total XP</Text>
              </View>

              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, themeStyles.title]}>
                  {userProfile.performance_level || 'Beginner'}
                </Text>
                <Text style={[styles.profileStatLabel, themeStyles.subtitle]}>Level</Text>
              </View>
            </View>

            {/* Hierarchical Subject Classification Display */}
            {HierarchicalSubjectDisplay && (
              <HierarchicalSubjectDisplay
                metadata={metadata}
                questions={questions}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Subject Progress Preview */}
            {userProfile.subject_accuracies && Object.keys(userProfile.subject_accuracies).length > 0 && (
              <View style={styles.subjectProgress}>
                <Text style={[styles.subjectProgressTitle, themeStyles.explanationTitle]}>
                  Subject Mastery
                </Text>
                {Object.entries(userProfile.subject_accuracies)
                  .slice(0, 3)
                  .map(([subject, accuracy]) => (
                    <View key={subject} style={styles.subjectProgressItem}>
                      <Text style={[styles.subjectName, themeStyles.text]}>
                        {subject.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              backgroundColor:
                                (themeStyles.borderSecondary as any)?.color || 'rgba(0,0,0,0.1)',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.round(accuracy * 100)}%`,
                                backgroundColor: (themeStyles.insightTitle as any)?.color || '#D4AF37',
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressPercentage, themeStyles.subtitle]}>
                          {Math.round(accuracy * 100)}%
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </Animatable.View>
      )}
    </>
  );
});

// ✨ Performance: Display name for debugging
AnalyticsSection.displayName = 'AnalyticsSection';

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  profileStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
  },
  profileStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
  },
  subjectProgress: {
    marginTop: 16,
  },
  subjectProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  subjectProgressItem: {
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});

export default AnalyticsSection;
