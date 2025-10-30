import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import NotificationManager from '../../utils/NotificationManager';
import { getThemeProperty } from '../../utils/progressHelpers';

interface NotificationInsightsData {
  analysisSnapshot?: {
    trend?: string;
    overallScore?: number;
    topFocusArea?: string;
  };
  activeCounts?: {
    total?: number;
    exam?: number;
    smart?: number;
  };
}

interface NotificationInsightsCardProps {
  notificationInsights: NotificationInsightsData | null;
  setNotificationInsights: (insights: NotificationInsightsData) => void;
  styles: any;
  currentTheme: any;
}

/**
 * NotificationInsightsCard - Displays notification statistics
 *
 * Features:
 * - Shows active reminder counts
 * - Displays latest analysis snapshot
 * - Refresh button to update notifications
 * - Animated entrance
 */
const NotificationInsightsCard: React.FC<NotificationInsightsCardProps> = ({
  notificationInsights,
  setNotificationInsights,
  styles,
  currentTheme
}) => {
  if (!notificationInsights || !notificationInsights.analysisSnapshot) return null;

  const analysis = notificationInsights.analysisSnapshot;
  const counts = notificationInsights.activeCounts;

  const handleRefresh = async () => {
    const user = auth.currentUser;
    if (user) {
      const results = await NotificationManager.scheduleAllNotifications(
        user.uid,
        null,
        'manual_refresh'
      );
      Alert.alert('✨ Refreshed!', results.summary || 'Notifications updated with latest insights!');

      const newStatus = await NotificationManager.getNotificationStatus(user.uid);
      setNotificationInsights(newStatus);
    }
  };

  return (
    <Animatable.View animation="fadeInUp" delay={1100} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🔔 Smart Notifications</Text>

      <View style={styles.notificationStatus}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, currentTheme.categoryName]}>Active Reminders:</Text>
          <Text style={[styles.statusValue, currentTheme.categoryName]}>{counts?.total || 0}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, currentTheme.categoryCount]}>• Exam reminders: {counts?.exam || 0}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, currentTheme.categoryCount]}>• Smart insights: {counts?.smart || 0}</Text>
        </View>
      </View>

      <View style={styles.analysisPreview}>
        <Text style={[styles.analysisTitle, currentTheme.categoryName]}>Latest Analysis:</Text>
        <Text style={[styles.analysisText, currentTheme.categoryCount]}>
          Trend: {analysis.trend || 'Stable'} • Score: {analysis.overallScore || 'N/A'}%
        </Text>
        {analysis.topFocusArea && (
          <Text style={[styles.analysisText, currentTheme.categoryCount]}>
            Focus: {analysis.topFocusArea}
          </Text>
        )}
      </View>

      <View style={styles.notificationActions}>
        <TouchableOpacity
          style={[styles.actionButton, currentTheme.quickProgressAction]}
          onPress={handleRefresh}
        >
          <FontAwesome5 name="sync" size={14} color={getThemeProperty(currentTheme, 'quickProgressActionText', '#1A2C5B')} />
          <Text style={[styles.actionButtonText, currentTheme.quickProgressActionText]}>
            Refresh Analysis
          </Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
};

export default NotificationInsightsCard;
