/**
 * ExamHistoryScreen - Exam History with Infinite Scroll
 *
 * Displays all user-generated exams with pagination
 *
 * Features:
 * - Infinite scroll with React Query
 * - Pull-to-refresh
 * - Exam cards with preview
 * - Quick actions (View, Retake, Delete)
 * - Empty state
 * - Loading states
 * - Error handling
 * - Search/filter (future enhancement)
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeBackButton from '../components/SafeBackButton';
import { useExamHistory, useDeleteExam } from '../hooks/useExamQueries';
import { formatExamDate } from '../services/examService';
import { ExamSummary } from '../types/exam';
import { colors, radius, spacing } from '../theme/tokens';
import logger from '../utils/logger';

type ExamHistoryScreenNavigationProp = NativeStackNavigationProp<any, 'ExamHistory'>;

interface ExamHistoryScreenProps {
  navigation: ExamHistoryScreenNavigationProp;
}

/**
 * Exam History Screen Component
 *
 * Lists all generated exams with infinite scroll
 */
export default function ExamHistoryScreen({ navigation }: ExamHistoryScreenProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    error
  } = useExamHistory();

  const { mutate: deleteExam, isPending: isDeleting } = useDeleteExam();

  // Flatten paginated data
  const exams = data?.pages.flatMap(page => page.exams) || [];
  const totalExams = data?.pages[0]?.total || 0;

  // Handle exam actions
  const handleViewExam = (examId: string) => {
    navigation.navigate('ExamViewer', {
      examId,
      mode: 'take',
    });
  };

  const handleRetakeExam = (examId: string) => {
    navigation.navigate('ExamViewer', {
      examId,
      mode: 'take',
    });
  };

  const handleDeleteExam = (exam: ExamSummary) => {
    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete the exam on "${exam.topic}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            logger.info('Deleting exam:', { examId: exam.exam_id });
            deleteExam(exam.exam_id, {
              onSuccess: () => {
                logger.info('Exam deleted successfully:', { examId: exam.exam_id });
              },
              onError: (error) => {
                logger.error('Failed to delete exam:', error);
                Alert.alert('Error', 'Failed to delete exam. Please try again.');
              },
            });
          },
        },
      ]
    );
  };

  const handleExamOptions = (exam: ExamSummary) => {
    Alert.alert(
      exam.topic,
      'Choose an action',
      [
        {
          text: 'View Exam',
          onPress: () => handleViewExam(exam.exam_id),
        },
        {
          text: 'Retake',
          onPress: () => handleRetakeExam(exam.exam_id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteExam(exam),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Render exam card
  const renderExamCard = ({ item }: { item: ExamSummary }) => {
    const difficultyColor =
      item.difficulty === 'Hard'
        ? colors.danger
        : item.difficulty === 'Moderate'
        ? colors.gold
        : colors.success;

    return (
      <TouchableOpacity
        style={styles.examCard}
        onPress={() => handleViewExam(item.exam_id)}
        onLongPress={() => handleExamOptions(item)}
        activeOpacity={0.7}
      >
        <View style={styles.examCardHeader}>
          <View style={styles.examCardTitleContainer}>
            <Text style={styles.examCardTitle} numberOfLines={2}>
              {item.topic}
            </Text>
            <Text style={styles.examCardDate}>{formatExamDate(item.created_at)}</Text>
          </View>
          <TouchableOpacity
            style={styles.examCardOptionsButton}
            onPress={() => handleExamOptions(item)}
          >
            <FontAwesome5 name="ellipsis-v" size={16} color={colors.textMute} />
          </TouchableOpacity>
        </View>

        <View style={styles.examCardMetadata}>
          <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20` }]}>
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {item.difficulty}
            </Text>
          </View>

          {item.sections.map((section, index) => (
            <View key={index} style={styles.sectionBadge}>
              <Text style={styles.sectionText}>{section}</Text>
            </View>
          ))}
        </View>

        {item.preview && (
          <Text style={styles.examCardPreview} numberOfLines={2}>
            {item.preview}
          </Text>
        )}

        <View style={styles.examCardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewExam(item.exam_id)}
          >
            <FontAwesome5 name="eye" size={14} color={colors.gold} />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRetakeExam(item.exam_id)}
          >
            <FontAwesome5 name="redo" size={14} color={colors.blue} />
            <Text style={styles.actionButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteExam(item)}
          >
            <FontAwesome5 name="trash" size={14} color={colors.danger} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render list footer
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.footerLoadingText}>Loading more...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="clipboard-list" size={64} color={colors.textMute} />
        <Text style={styles.emptyStateTitle}>No Exams Yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Generate your first AI-powered exam to get started!
        </Text>
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={() => navigation.navigate('ExamGenerator')}
        >
          <LinearGradient
            colors={[colors.gold, '#D4AF37']}
            style={styles.createFirstButtonGradient}
          >
            <FontAwesome5 name="magic" size={16} color={colors.bg} />
            <Text style={styles.createFirstButtonText}>Generate Exam</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#0B1223', '#0F1F33']} style={styles.gradient}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading your exams...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <LinearGradient colors={['#0B1223', '#0F1F33']} style={styles.gradient}>
          <FontAwesome5 name="exclamation-triangle" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Failed to Load Exams</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0B1223', '#0F1F33']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <SafeBackButton style={styles.backButton} color={colors.text} size={20} />
          <Text style={styles.headerTitle}>Exam History</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ExamGenerator')}
          >
            <FontAwesome5 name="plus" size={20} color={colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        {exams.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalExams}</Text>
              <Text style={styles.statLabel}>Total Exams</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{exams.length}</Text>
              <Text style={styles.statLabel}>Loaded</Text>
            </View>
          </View>
        )}

        {/* Exam List */}
        <FlatList
          data={exams}
          renderItem={renderExamCard}
          keyExtractor={(item) => item.exam_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.gold}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              logger.info('Fetching next page of exams');
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing[16],
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.danger,
    marginTop: spacing[16],
    marginBottom: spacing[8],
  },
  errorText: {
    fontSize: 14,
    color: colors.textMute,
    marginBottom: spacing[24],
    textAlign: 'center',
    paddingHorizontal: spacing[32],
  },
  retryButton: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[24],
    backgroundColor: colors.gold,
    borderRadius: radius.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[20],
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
  },
  backButton: {
    padding: spacing[8],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    padding: spacing[8],
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
    backgroundColor: colors.card,
    marginHorizontal: spacing[20],
    borderRadius: radius.md,
    marginBottom: spacing[16],
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMute,
    marginTop: spacing[4],
  },
  listContent: {
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[24],
  },
  examCard: {
    padding: spacing[16],
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing[16],
    borderWidth: 2,
    borderColor: colors.cardStroke,
  },
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[12],
  },
  examCardTitleContainer: {
    flex: 1,
    marginRight: spacing[12],
  },
  examCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing[4],
  },
  examCardDate: {
    fontSize: 13,
    color: colors.textMute,
  },
  examCardOptionsButton: {
    padding: spacing[4],
  },
  examCardMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginBottom: spacing[12],
  },
  difficultyBadge: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[12],
    borderRadius: radius.sm,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBadge: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[12],
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
  },
  examCardPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textDim,
    marginBottom: spacing[12],
  },
  examCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing[12],
    borderTopWidth: 1,
    borderTopColor: colors.cardStroke,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  footerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
    paddingVertical: spacing[20],
  },
  footerLoadingText: {
    fontSize: 14,
    color: colors.textMute,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[32],
    paddingHorizontal: spacing[24],
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing[16],
    marginBottom: spacing[8],
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textMute,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[24],
  },
  createFirstButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  createFirstButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    paddingVertical: spacing[14],
    paddingHorizontal: spacing[24],
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.bg,
  },
});
