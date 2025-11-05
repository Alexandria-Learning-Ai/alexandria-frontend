import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import HierarchicalSubjectService from '../../services/HierarchicalSubjectService';
import logger from '../../utils/logger';
import { ThemeStyles, QuizMetadata } from '../../types';

interface Question {
  id: string;
  text?: string;
  questionText?: string;
  type?: string;
  keywords?: string[];
  [key: string]: any;
}

interface HierarchyInfo {
  subject: string;
  course: string | null;
  topic?: string;
  icon: string;
  color: string;
  confidence: number;
  courseTopics?: string[];
}

interface HierarchicalSubjectDisplayProps {
  metadata: QuizMetadata;
  questions: Question[];
  isDarkMode: boolean;
}

const HierarchicalSubjectDisplay: React.FC<HierarchicalSubjectDisplayProps> = ({
  metadata,
  questions,
  isDarkMode,
}) => {
  const [hierarchyInfo, setHierarchyInfo] = useState<HierarchyInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Import theme styles from parent or define inline
  const currentThemeStyles: Partial<ThemeStyles> = isDarkMode
    ? { text: { color: '#FFFFFF' }, subtitle: { color: '#B0B0B0' } }
    : { text: { color: '#1A1A1A' }, subtitle: { color: '#666666' } };

  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const hierarchy = HierarchicalSubjectService.classifyHierarchical(questions, metadata);
        const displayInfo = HierarchicalSubjectService.getHierarchyDisplayInfo(
          hierarchy.subject,
          hierarchy.course
        );

        setHierarchyInfo({
          ...hierarchy,
          ...displayInfo,
        });
      } catch (error) {
        logger.error('Error loading hierarchy info:', error);
        setHierarchyInfo({
          subject: 'General Knowledge',
          course: null,
          icon: 'book',
          color: '#95A5A6',
          confidence: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadHierarchy();
  }, [metadata, questions]);

  if (loading || !hierarchyInfo) {
    return (
      <View style={styles.hierarchyContainer}>
        <ActivityIndicator size="small" color="#D4AF37" />
        <Text style={[styles.hierarchyLoadingText, currentThemeStyles.text]}>
          Analyzing subject area...
        </Text>
      </View>
    );
  }

  const confidenceColor =
    hierarchyInfo.confidence > 0.8
      ? '#28a745'
      : hierarchyInfo.confidence > 0.6
      ? '#ffc107'
      : '#dc3545';

  return (
    <View style={styles.hierarchyContainer}>
      <View style={styles.hierarchyHeader}>
        <FontAwesome5
          name={hierarchyInfo.icon}
          size={20}
          color={hierarchyInfo.color}
          style={styles.hierarchyIcon}
        />
        <Text style={[styles.hierarchyTitle, currentThemeStyles.text]}>Subject Classification</Text>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
          <Text style={styles.confidenceText}>{Math.round(hierarchyInfo.confidence * 100)}%</Text>
        </View>
      </View>

      <View style={styles.hierarchyContent}>
        {/* Main Subject */}
        <View style={styles.hierarchyLevel}>
          <Text style={[styles.hierarchyLabelText, currentThemeStyles.subtitle]}>Subject:</Text>
          <Text
            style={[
              styles.hierarchyValueText,
              currentThemeStyles.text,
              { color: hierarchyInfo.color },
            ]}
          >
            {hierarchyInfo.subject}
          </Text>
        </View>

        {/* Course Level */}
        {hierarchyInfo.course && (
          <View style={styles.hierarchyLevel}>
            <Text style={[styles.hierarchyLabelText, currentThemeStyles.subtitle]}>Course:</Text>
            <Text style={[styles.hierarchyValueText, currentThemeStyles.text]}>
              {hierarchyInfo.course}
            </Text>
          </View>
        )}

        {/* Topic Level */}
        {hierarchyInfo.topic && (
          <View style={styles.hierarchyLevel}>
            <Text style={[styles.hierarchyLabelText, currentThemeStyles.subtitle]}>Topic:</Text>
            <Text style={[styles.hierarchyValueText, currentThemeStyles.text]}>
              {hierarchyInfo.topic}
            </Text>
          </View>
        )}

        {/* Course Topics Preview */}
        {hierarchyInfo.courseTopics && hierarchyInfo.courseTopics.length > 0 && (
          <View style={styles.hierarchyTopicsContainer}>
            <Text style={[styles.hierarchyTopicsLabel, currentThemeStyles.subtitle]}>
              Related topics in {hierarchyInfo.course}:
            </Text>
            <View style={styles.topicsRow}>
              {hierarchyInfo.courseTopics.slice(0, 3).map((topic, index) => (
                <View key={index} style={[styles.topicTag, { borderColor: hierarchyInfo.color }]}>
                  <Text style={[styles.topicTagText, currentThemeStyles.text]}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hierarchyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  hierarchyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hierarchyIcon: {
    marginRight: 8,
  },
  hierarchyTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  hierarchyContent: {
    gap: 8,
  },
  hierarchyLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hierarchyLabelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  hierarchyValueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hierarchyTopicsContainer: {
    marginTop: 8,
  },
  hierarchyTopicsLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicTag: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  topicTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hierarchyLoadingText: {
    marginTop: 8,
    fontSize: 13,
  },
});

export default HierarchicalSubjectDisplay;
