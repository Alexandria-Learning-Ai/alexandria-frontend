import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { getThemeProperty, getAccuracyColor } from '../../utils/progressHelpers';

interface Subject {
  name: string;
  averageScore: number;
  totalQuizzes: number;
  consistency: number;
  lastActivity?: string;
  trend?: 'improving' | 'declining' | 'stable';
  color?: string;
  icon?: string;
}

interface SubjectProgressCardsProps {
  subjectProgress: Record<string, Subject>;
  navigation: NavigationProp<any>;
  getSubjectColor: (subject: Subject) => string;
  getSubjectIcon: (subject: Subject) => string;
  styles: any;
  currentTheme: any;
}

/**
 * SubjectProgressCards - Individual subject progress cards
 *
 * Features:
 * - Shows up to 5 subjects with detailed stats
 * - Trending indicators (improving/declining/stable)
 * - Progress bars with color coding
 * - Practice buttons for each subject
 * - "View All" button for 5+ subjects
 * - Empty state with encouragement
 */
const SubjectProgressCards: React.FC<SubjectProgressCardsProps> = ({
  subjectProgress,
  navigation,
  getSubjectColor,
  getSubjectIcon,
  styles,
  currentTheme
}) => {
  const subjectEntries = Object.entries(subjectProgress);

  if (subjectEntries.length === 0) {
    return (
      <Animatable.View animation="fadeInUp" delay={800} style={[styles.chartContainer, currentTheme.chartContainer]}>
        <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📖 Your Subjects</Text>
        <View style={styles.noDataContainer}>
          <FontAwesome5 name="graduation-cap" size={48} color={getThemeProperty(currentTheme, 'noDataIcon', '#7F8C8D')} />
          <Text style={[styles.noDataText, currentTheme.noDataText]}>
            Start taking quizzes to track progress by subject!
          </Text>
        </View>
      </Animatable.View>
    );
  }

  return (
    <Animatable.View animation="fadeInUp" delay={800} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>📖 Your Subjects</Text>

      {subjectEntries.slice(0, 5).map(([subjectKey, subject], index) => {
        const daysSinceActivity = subject.lastActivity
          ? Math.floor((new Date().getTime() - new Date(subject.lastActivity).getTime()) / (24 * 60 * 60 * 1000))
          : 999;

        const subjectColor = getSubjectColor(subject);
        const subjectIcon = getSubjectIcon(subject);
        const averageScore = subject.averageScore || 0;

        return (
          <View key={subjectKey} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <View style={styles.subjectInfo}>
                <View style={[styles.subjectIcon, { backgroundColor: subjectColor + '20' }]}>
                  <FontAwesome5 name={subjectIcon} size={18} color={subjectColor} />
                </View>
                <View style={styles.subjectDetails}>
                  <Text style={[styles.subjectName, currentTheme.categoryName]}>
                    {subject.name || 'Unknown Subject'}
                  </Text>
                  <Text style={[styles.activityText, currentTheme.categoryCount]}>
                    {daysSinceActivity === 0 ? 'Active today' :
                     daysSinceActivity === 1 ? 'Yesterday' :
                     daysSinceActivity < 7 ? `${daysSinceActivity} days ago` :
                     'More than a week ago'}
                  </Text>
                </View>
              </View>
              <View style={styles.trendIndicator}>
                <FontAwesome5
                  name={subject.trend === 'improving' ? 'trending-up' :
                        subject.trend === 'declining' ? 'trending-down' : 'minus'}
                  size={16}
                  color={subject.trend === 'improving' ? '#28a745' :
                         subject.trend === 'declining' ? '#dc3545' :
                         getThemeProperty(currentTheme, 'categoryCount', '#7F8C8D')}
                />
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, {
                width: `${Math.min(averageScore, 100)}%`,
                backgroundColor: getAccuracyColor(averageScore)
              }]} />
            </View>

            <View style={styles.subjectStats}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: getAccuracyColor(averageScore) }]}>
                  {averageScore.toFixed(0)}%
                </Text>
                <Text style={[styles.statLabel, currentTheme.categoryCount]}>Average</Text>
              </View>

              <View style={styles.stat}>
                <Text style={[styles.statValue, currentTheme.categoryName]}>
                  {subject.totalQuizzes || 0}
                </Text>
                <Text style={[styles.statLabel, currentTheme.categoryCount]}>Quizzes</Text>
              </View>

              <View style={styles.stat}>
                <Text style={[styles.statValue, currentTheme.categoryName]}>
                  {(subject.consistency || 0).toFixed(0)}%
                </Text>
                <Text style={[styles.statLabel, currentTheme.categoryCount]}>Consistency</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.practiceButton, { borderColor: subjectColor }]}
              onPress={() => {
                navigation.navigate('AskAlexandria', {
                  suggestedTopic: subject.name,
                  subjectKey: subjectKey
                });
              }}
            >
              <FontAwesome5 name="play" size={12} color={subjectColor} />
              <Text style={[styles.practiceButtonText, { color: subjectColor }]}>
                Practice {subject.name || 'Subject'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {subjectEntries.length > 5 && (
        <TouchableOpacity
          style={[styles.viewMoreButton, currentTheme.periodButton]}
          onPress={() => {
            Alert.alert('Coming Soon', 'Full subject dashboard will be available soon!');
          }}
        >
          <Text style={[styles.viewMoreText, currentTheme.periodButtonText]}>
            View All {subjectEntries.length} Subjects
          </Text>
          <FontAwesome5 name="arrow-right" size={14} color={getThemeProperty(currentTheme, 'periodButtonText', '#1A2C5B')} />
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

export default SubjectProgressCards;
