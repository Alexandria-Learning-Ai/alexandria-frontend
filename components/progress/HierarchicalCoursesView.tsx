import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import HierarchicalSubjectService from '../../services/HierarchicalSubjectService';
import { getThemeProperty, getAccuracyColor } from '../../utils/progressHelpers';

interface HierarchicalCoursesViewProps {
  hierarchicalProgress: Record<string, any>;
  selectedSubject: string | null;
  setSelectedSubject: (subject: string | null) => void;
  hierarchicalRecommendations: any[];
  navigation: NavigationProp<any>;
  styles: any;
  currentTheme: any;
}

/**
 * HierarchicalCoursesView - Displays hierarchical course/topic structure
 *
 * Features:
 * - Subject → Course → Topic hierarchy
 * - Expandable sections
 * - Progress tracking at all levels
 * - Smart recommendations
 * - Practice buttons for each course
 */
const HierarchicalCoursesView: React.FC<HierarchicalCoursesViewProps> = ({
  hierarchicalProgress,
  selectedSubject,
  setSelectedSubject,
  hierarchicalRecommendations,
  navigation,
  styles,
  currentTheme
}) => {
  const hierarchicalEntries = Object.entries(hierarchicalProgress);

  if (hierarchicalEntries.length === 0) {
    return (
      <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
        <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🎓 Course Progress</Text>
        <View style={styles.noDataContainer}>
          <FontAwesome5 name="graduation-cap" size={48} color={getThemeProperty(currentTheme, 'noDataIcon', '#7F8C8D')} />
          <Text style={[styles.noDataText, currentTheme.noDataText]}>
            Start taking quizzes to track hierarchical course progress!
          </Text>
        </View>
      </Animatable.View>
    );
  }

  return (
    <>
      <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
        <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🎓 Course Progress Overview</Text>

        <View style={styles.hierarchicalStats}>
          <View style={styles.hierarchicalStat}>
            <Text style={[styles.hierarchicalValue, currentTheme.statNumber]}>
              {hierarchicalEntries.length}
            </Text>
            <Text style={[styles.hierarchicalLabel, currentTheme.statLabel]}>Subjects</Text>
          </View>

          <View style={styles.hierarchicalStat}>
            <Text style={[styles.hierarchicalValue, { color: '#28a745' }]}>
              {hierarchicalEntries.reduce((total, [_, subject]) =>
                total + Object.keys(subject.courses || {}).length, 0
              )}
            </Text>
            <Text style={[styles.hierarchicalLabel, currentTheme.statLabel]}>Courses</Text>
          </View>

          <View style={styles.hierarchicalStat}>
            <Text style={[styles.hierarchicalValue, { color: '#3498DB' }]}>
              {hierarchicalEntries.reduce((total: number, [_, subject]) =>
                total + (Object.values(subject.courses || {}) as any[]).reduce((courseTotal: number, course: any) =>
                  courseTotal + Object.keys(course.topics || {}).length, 0
                ), 0
              )}
            </Text>
            <Text style={[styles.hierarchicalLabel, currentTheme.statLabel]}>Topics</Text>
          </View>
        </View>
      </Animatable.View>

      {hierarchicalEntries.map(([subjectName, subjectData]: [string, any], subjectIndex) => (
        <Animatable.View
          key={subjectName}
          animation="fadeInUp"
          delay={800 + (subjectIndex * 100)}
          style={[styles.chartContainer, currentTheme.chartContainer]}
        >
          <View style={styles.subjectHeaderExpanded}>
            <View style={styles.subjectTitleSection}>
              <View style={[styles.subjectIconLarge, { backgroundColor: HierarchicalSubjectService.getSubjectColor(subjectName) + '20' }]}>
                <FontAwesome5
                  name={HierarchicalSubjectService.getSubjectIcon(subjectName)}
                  size={24}
                  color={HierarchicalSubjectService.getSubjectColor(subjectName)}
                />
              </View>
              <View>
                <Text style={[styles.subjectNameLarge, currentTheme.chartTitle]}>{subjectName}</Text>
                <Text style={[styles.subjectSummary, currentTheme.chartSubtitle]}>
                  {Object.keys(subjectData.courses || {}).length} courses •
                  {subjectData.totalQuizzes || 0} quizzes •
                  {Math.round(subjectData.averageScore || 0)}% avg
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.expandButton, { borderColor: HierarchicalSubjectService.getSubjectColor(subjectName) }]}
              onPress={() => {
                if (selectedSubject === subjectName) {
                  setSelectedSubject(null);
                } else {
                  setSelectedSubject(subjectName);
                }
              }}
            >
              <FontAwesome5
                name={selectedSubject === subjectName ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={HierarchicalSubjectService.getSubjectColor(subjectName)}
              />
            </TouchableOpacity>
          </View>

          {selectedSubject === subjectName && (
            <View style={styles.coursesContainer}>
              {Object.entries(subjectData.courses || {}).map(([courseName, courseData]: [string, any]) => (
                <View key={courseName} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseInfo}>
                      <Text style={[styles.courseName, currentTheme.categoryName]}>{courseName}</Text>
                      <Text style={[styles.courseStats, currentTheme.categoryCount]}>
                        {courseData.totalQuizzes || 0} quizzes • {Math.round(courseData.averageScore || 0)}% avg
                      </Text>
                    </View>
                    <View style={styles.courseScoreContainer}>
                      <Text style={[styles.courseScore, { color: getAccuracyColor(courseData.averageScore || 0) }]}>
                        {Math.round(courseData.averageScore || 0)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, {
                      width: `${Math.min(courseData.averageScore || 0, 100)}%`,
                      backgroundColor: getAccuracyColor(courseData.averageScore || 0)
                    }]} />
                  </View>

                  {Object.keys(courseData.topics || {}).length > 0 && (
                    <View style={styles.topicsContainer}>
                      <Text style={[styles.topicsTitle, currentTheme.categoryCount]}>
                        Topics ({Object.keys(courseData.topics).length}):
                      </Text>
                      <View style={styles.topicsList}>
                        {Object.entries(courseData.topics).slice(0, 3).map(([topicName, topicData]: [string, any]) => (
                          <View key={topicName} style={styles.topicChip}>
                            <Text style={[styles.topicName, currentTheme.categoryCount]}>{topicName}</Text>
                            <Text style={[styles.topicScore, { color: getAccuracyColor(topicData.averageScore || 0) }]}>
                              {Math.round(topicData.averageScore || 0)}%
                            </Text>
                          </View>
                        ))}
                        {Object.keys(courseData.topics).length > 3 && (
                          <Text style={[styles.moreTopics, currentTheme.categoryCount]}>
                            +{Object.keys(courseData.topics).length - 3} more
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.practiceButton, { borderColor: HierarchicalSubjectService.getSubjectColor(subjectName) }]}
                    onPress={() => {
                      navigation.navigate('AskAlexandria', {
                        suggestedTopic: courseName,
                        subjectKey: subjectName,
                        courseKey: courseName,
                        hierarchicalMode: true
                      });
                    }}
                  >
                    <FontAwesome5 name="play" size={12} color={HierarchicalSubjectService.getSubjectColor(subjectName)} />
                    <Text style={[styles.practiceButtonText, { color: HierarchicalSubjectService.getSubjectColor(subjectName) }]}>
                      Practice {courseName}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Animatable.View>
      ))}

      {hierarchicalRecommendations.length > 0 && (
        <Animatable.View animation="fadeInUp" delay={1000} style={[styles.chartContainer, currentTheme.chartContainer]}>
          <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🎯 Hierarchical Recommendations</Text>

          {hierarchicalRecommendations.slice(0, 3).map((rec, index) => {
            const priorityColor = rec.priority === 'high' ? '#dc3545' :
                                 rec.priority === 'medium' ? '#ffc107' : '#17a2b8';

            return (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  <FontAwesome5
                    name={rec.priority === 'high' ? 'exclamation-circle' : 'lightbulb'}
                    size={14}
                    color={priorityColor}
                  />
                  <Text style={[styles.recommendationPriority, { color: priorityColor }]}>
                    {rec.priority?.toUpperCase() || 'MEDIUM'}
                  </Text>
                </View>
                <Text style={[styles.recommendationMessage, currentTheme.categoryName]}>
                  {rec.message}
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: priorityColor + '20', borderColor: priorityColor }]}
                  onPress={() => {
                    navigation.navigate('AskAlexandria', {
                      suggestedTopic: rec.course || rec.subject,
                      subjectKey: rec.subject,
                      courseKey: rec.course,
                      hierarchicalMode: true
                    });
                  }}
                >
                  <Text style={[styles.actionButtonText, { color: priorityColor }]}>
                    Practice Now
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </Animatable.View>
      )}
    </>
  );
};

export default HierarchicalCoursesView;
