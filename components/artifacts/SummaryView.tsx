/**
 * SummaryView - Displays chapter summary artifact
 *
 * Features:
 * - Overview section (2-3 sentences)
 * - Key points (bullet list)
 * - Takeaways section
 * - Generate button (if not exists)
 * - Loading state with spinner
 * - Error state with retry
 * - Empty state with generate button
 * - Alexandria theme
 * - Smooth scrolling
 *
 * @param summary - Summary data object
 * @param loading - Loading state
 * @param error - Error message
 * @param onGenerate - Callback to generate summary
 * @param onRetry - Callback to retry after error
 */

import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface SummaryData {
  overview: string;
  key_points: string[];
  takeaways: string[];
}

interface SummaryViewProps {
  summary: SummaryData | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  onRetry: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  loading,
  error,
  onGenerate,
  onRetry,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      surface: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accentLight,
      accentDark: Colors.accentDark,
      primary: Colors.primary,
      error: Colors.error,
      border: Colors.border,
    }),
    []
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Generating summary...
        </Text>
        <Text style={[styles.loadingSubtext, { color: themeColors.textMuted }]}>
          This may take a moment
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name="exclamation-triangle" size={56} color={themeColors.error} />
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>
          Failed to load summary
        </Text>
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: themeColors.accent }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="redo" size={16} color={Colors.white} style={styles.buttonIcon} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!summary) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name="file-alt" size={64} color={themeColors.textMuted} />
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
          No summary yet
        </Text>
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
          Generate an AI-powered summary of this chapter
        </Text>
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: themeColors.accent }]}
          onPress={onGenerate}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="magic" size={16} color={Colors.white} style={styles.buttonIcon} />
          <Text style={styles.generateText}>Generate Summary</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Summary content
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {/* Overview Section */}
      <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="eye" size={18} color={themeColors.accent} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Overview
          </Text>
        </View>
        <Text style={[styles.overview, { color: themeColors.text }]}>
          {summary.overview}
        </Text>
      </View>

      {/* Key Points Section */}
      {summary.key_points && summary.key_points.length > 0 && (
        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="list-ul" size={18} color={themeColors.accent} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Key Points
            </Text>
          </View>
          {summary.key_points.map((point, index) => (
            <View key={index} style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: themeColors.accent }]} />
              <Text style={[styles.bulletText, { color: themeColors.text }]}>
                {point}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Takeaways Section */}
      {summary.takeaways && summary.takeaways.length > 0 && (
        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="lightbulb" size={18} color={themeColors.accent} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Takeaways
            </Text>
          </View>
          {summary.takeaways.map((takeaway, index) => (
            <View key={index} style={styles.bulletItem}>
              <FontAwesome5
                name="arrow-right"
                size={12}
                color={themeColors.accent}
                style={styles.arrowIcon}
              />
              <Text style={[styles.bulletText, { color: themeColors.text }]}>
                {takeaway}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  generateText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  overview: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 12,
  },
  arrowIcon: {
    marginTop: 6,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SummaryView;
