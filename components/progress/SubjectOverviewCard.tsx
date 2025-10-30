import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { getThemeProperty } from '../../utils/progressHelpers';

interface SubjectSummary {
  totalSubjects: number;
  activeSubjects: number;
  neglectedCount?: number;
  overallBalance: number;
  bestSubject?: {
    name: string;
    averageScore: number;
  };
  worstSubject?: {
    name: string;
    averageScore: number;
  };
}

interface SubjectOverviewCardProps {
  subjectSummary: SubjectSummary | null;
  styles: any;
  currentTheme: any;
}

/**
 * SubjectOverviewCard - Displays subject-level statistics
 *
 * Features:
 * - Total/Active/Neglected subject counts
 * - Overall balance percentage
 * - Best and worst performing subjects
 * - Empty state with encouragement
 */
const SubjectOverviewCard: React.FC<SubjectOverviewCardProps> = ({
  subjectSummary,
  styles,
  currentTheme
}) => {
  if (!subjectSummary) {
    return (
      <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
        <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📚 Subject Overview</Text>
        <View style={styles.noDataContainer}>
          <FontAwesome5 name="book-open" size={48} color={getThemeProperty(currentTheme, 'noDataIcon', '#7F8C8D')} />
          <Text style={[styles.noDataText, currentTheme.noDataText]}>
            Take quizzes to see subject-specific insights!
          </Text>
        </View>
      </Animatable.View>
    );
  }

  return (
    <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📚 Subject Overview</Text>

      <View style={styles.overviewStats}>
        <View style={styles.overviewStat}>
          <Text style={[styles.overviewValue, currentTheme.statNumber]}>
            {subjectSummary.totalSubjects}
          </Text>
          <Text style={[styles.overviewLabel, currentTheme.statLabel]}>Subjects</Text>
        </View>

        <View style={styles.overviewStat}>
          <Text style={[styles.overviewValue, { color: '#28a745' }]}>
            {subjectSummary.activeSubjects}
          </Text>
          <Text style={[styles.overviewLabel, currentTheme.statLabel]}>Active</Text>
        </View>

        <View style={styles.overviewStat}>
          <Text style={[styles.overviewValue, { color: '#dc3545' }]}>
            {subjectSummary.neglectedCount || 0}
          </Text>
          <Text style={[styles.overviewLabel, currentTheme.statLabel]}>Neglected</Text>
        </View>

        <View style={styles.overviewStat}>
          <Text style={[styles.overviewValue, currentTheme.statNumber]}>
            {subjectSummary.overallBalance}%
          </Text>
          <Text style={[styles.overviewLabel, currentTheme.statLabel]}>Balance</Text>
        </View>
      </View>

      {subjectSummary.bestSubject && (
        <View style={styles.highlightContainer}>
          <View style={styles.highlight}>
            <FontAwesome5 name="trophy" size={16} color="#28a745" />
            <Text style={[styles.highlightText, currentTheme.categoryName]}>
              Strongest: <Text style={{ color: '#28a745' }}>
                {subjectSummary.bestSubject.name} ({subjectSummary.bestSubject.averageScore.toFixed(0)}%)
              </Text>
            </Text>
          </View>

          {subjectSummary.worstSubject && (
            <View style={styles.highlight}>
              <FontAwesome5 name="exclamation-triangle" size={16} color="#ffc107" />
              <Text style={[styles.highlightText, currentTheme.categoryName]}>
                Needs work: <Text style={{ color: '#ffc107' }}>
                  {subjectSummary.worstSubject.name} ({subjectSummary.worstSubject.averageScore.toFixed(0)}%)
                </Text>
              </Text>
            </View>
          )}
        </View>
      )}
    </Animatable.View>
  );
};

export default SubjectOverviewCard;
