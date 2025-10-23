/**
 * AnalyticsTab - Detailed analytics and progress tracking
 *
 * Contains:
 * - Overall performance metrics
 * - Progress trends
 * - Category strengths and weaknesses
 * - Recent activity
 * - Quick navigation to detailed progress tracker
 *
 * Features:
 * - Type-safe props
 * - Alexandria theme styling
 * - Smooth animations
 * - Pull-to-refresh
 */

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useQuizStats } from '../../hooks/useQuizStats';
import { useHierarchicalProgress } from '../../hooks/useHierarchicalProgress';
import { ProgressWidget, HierarchicalInsightsWidget } from '../../components/home/ProgressWidgets';
import { useTheme } from '../../hooks/useTheme';
import logger from '../../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsTabProps {
  navigation: any;
  user: any;
  subscription: any;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ navigation, user, subscription }) => {
  const { t } = useTranslation();
  const { themeStyles } = useTheme();
  const { recentStats, refreshStats } = useQuizStats();
  const { hierarchicalInsights } = useHierarchicalProgress();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  // Theme colors
  const themeColors = useMemo(
    () => ({
      background: '#1A2C5B',
      backgroundSecondary: '#2C467D',
      text: '#F8F4E3',
      textSecondary: '#CBD5E0',
      alexandriaGold: '#D4AF37',
      success: '#28a745',
      error: '#dc3545',
      warning: '#FFD700',
    }),
    []
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ExpoStatusBar style="light" />

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[themeColors.alexandriaGold]}
              tintColor={themeColors.alexandriaGold}
            />
          }
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" delay={100} style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Analytics</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
              Your learning insights and progress
            </Text>
          </Animatable.View>

          {/* Quick Stats Overview */}
          <Animatable.View animation="fadeInUp" delay={200} style={styles.quickStatsContainer}>
            <LinearGradient
              colors={[themeColors.backgroundSecondary, themeColors.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickStatsCard}
            >
              <View style={styles.quickStatsRow}>
                <View style={styles.quickStatItem}>
                  <FontAwesome5 name="trophy" size={24} color={themeColors.alexandriaGold} />
                  <Text style={[styles.quickStatNumber, { color: themeColors.text }]}>
                    {recentStats.averageScore}%
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: themeColors.textSecondary }]}>
                    Average Score
                  </Text>
                </View>

                <View style={styles.quickStatDivider} />

                <View style={styles.quickStatItem}>
                  <FontAwesome5 name="fire" size={24} color={themeColors.error} />
                  <Text style={[styles.quickStatNumber, { color: themeColors.text }]}>
                    {recentStats.currentStreak}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: themeColors.textSecondary }]}>
                    Day Streak
                  </Text>
                </View>

                <View style={styles.quickStatDivider} />

                <View style={styles.quickStatItem}>
                  <FontAwesome5 name="clipboard-list" size={24} color={themeColors.success} />
                  <Text style={[styles.quickStatNumber, { color: themeColors.text }]}>
                    {recentStats.totalQuizzes}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: themeColors.textSecondary }]}>
                    Total Quizzes
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animatable.View>

          {/* Progress Widget */}
          <ProgressWidget navigation={navigation} themeStyles={themeStyles} t={t} />

          {/* Hierarchical Insights Widget */}
          <HierarchicalInsightsWidget
            navigation={navigation}
            themeStyles={themeStyles}
            t={t}
            hierarchicalInsights={{
              ...hierarchicalInsights,
              topSubject: hierarchicalInsights.topSubject ? {
                ...hierarchicalInsights.topSubject,
                courses: hierarchicalInsights.topSubject.courses ?? 0
              } : null
            }}
          />

          {/* View Full Analytics Button */}
          <Animatable.View animation="fadeInUp" delay={800} style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.primaryAction, { backgroundColor: themeColors.alexandriaGold }]}
              onPress={() => navigation.navigate('ProgressTracker')}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="chart-bar" size={20} color={themeColors.background} />
              <Text style={[styles.primaryActionText, { color: themeColors.background }]}>
                View Detailed Analytics
              </Text>
              <FontAwesome5 name="arrow-right" size={16} color={themeColors.background} />
            </TouchableOpacity>
          </Animatable.View>

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  quickStatsContainer: {
    marginBottom: 30,
  },
  quickStatsCard: {
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(248, 244, 227, 0.2)',
  },
  actionContainer: {
    marginBottom: 16,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});

export default AnalyticsTab;
