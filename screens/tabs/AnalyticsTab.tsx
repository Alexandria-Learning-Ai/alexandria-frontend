/**
 * AnalyticsTab - Detailed analytics and progress tracking
 *
 * Contains:
 * - Overall performance metrics with carved borders
 * - Quick stats overview card
 * - Progress trends with elegant styling
 * - Category strengths and weaknesses
 * - Progress and Course Insights widgets (reused from home)
 * - Quick navigation to detailed progress tracker
 *
 * Features:
 * - Type-safe props with comprehensive interfaces
 * - Alexandria theme styling with carved border effects
 * - Smooth staggered animations matching HomeTab/FeaturesTab
 * - Pull-to-refresh functionality
 * - Consistent spacing (4/8px grid system)
 * - Enhanced visual hierarchy with proper shadows
 * - Responsive design patterns
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

interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  alexandriaGold: string;
  alexandriaBronze: string;
  success: string;
  error: string;
  warning: string;
  dividerShadow: string;
  dividerHighlight: string;
}

interface QuickStat {
  id: string;
  icon: string;
  iconColor: string;
  value: string | number;
  label: string;
  delay: number;
}

/**
 * AnalyticsTab Component - Main analytics screen accessible from bottom tab navigation
 *
 * Design Pattern: Matches HomeTab and FeaturesTab with:
 * - 60px top padding for status bar
 * - 20px horizontal padding
 * - Carved border effects on all major cards
 * - Consistent 30px margins between sections
 * - Alexandria color palette throughout
 * - Smooth animations with staggered delays
 */
const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ navigation, user, subscription }) => {
  const { t } = useTranslation();
  const { themeStyles } = useTheme();
  const { recentStats, refreshStats } = useQuizStats();
  const { hierarchicalInsights } = useHierarchicalProgress();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  // Theme colors - matches HomeTab and FeaturesTab exactly
  const themeColors = useMemo<ThemeColors>(
    () => ({
      background: '#1A2C5B',
      backgroundSecondary: '#2C467D',
      text: '#F8F4E3',
      textSecondary: '#CBD5E0',
      alexandriaGold: '#D4AF37',
      alexandriaBronze: '#B8941F',
      success: '#28a745',
      error: '#dc3545',
      warning: '#FFD700',
      dividerShadow: 'rgba(0, 0, 0, 0.3)',
      dividerHighlight: 'rgba(212, 175, 55, 0.15)',
    }),
    []
  );

  // Quick stats configuration with proper typing
  const quickStats = useMemo<QuickStat[]>(
    () => [
      {
        id: 'score',
        icon: 'trophy',
        iconColor: themeColors.alexandriaGold,
        value: `${recentStats.averageScore}%`,
        label: 'Average Score',
        delay: 300,
      },
      {
        id: 'streak',
        icon: 'fire',
        iconColor: themeColors.error,
        value: recentStats.currentStreak,
        label: 'Day Streak',
        delay: 400,
      },
      {
        id: 'quizzes',
        icon: 'clipboard-list',
        iconColor: themeColors.success,
        value: recentStats.totalQuizzes,
        label: 'Total Quizzes',
        delay: 500,
      },
    ],
    [recentStats, themeColors]
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRefresh = async () => {
    setRefreshing(true);
    logger.info('AnalyticsTab: Refreshing analytics data');
    await refreshStats();
    setRefreshing(false);
  };

  const navigateToProgressTracker = () => {
    logger.info('AnalyticsTab: Navigating to Progress Tracker');
    navigation.navigate('ProgressTracker');
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
          {/* Header - Matches HomeTab and FeaturesTab style */}
          <Animatable.View animation="fadeInDown" delay={100} style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Analytics</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
              Your learning insights and progress
            </Text>
          </Animatable.View>

          {/* Quick Stats Overview Card with Carved Border */}
          <Animatable.View animation="fadeInUp" delay={200} style={styles.quickStatsContainer}>
            <View
              style={[
                styles.carvedBorderContainer,
                {
                  borderTopColor: themeColors.dividerShadow,
                  borderLeftColor: themeColors.dividerShadow,
                  borderBottomColor: themeColors.dividerHighlight,
                  borderRightColor: themeColors.dividerHighlight,
                },
              ]}
            >
              <LinearGradient
                colors={[themeColors.backgroundSecondary, themeColors.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickStatsCard}
              >
                <View style={styles.quickStatsRow}>
                  {quickStats.map((stat, index) => (
                    <React.Fragment key={stat.id}>
                      {index > 0 && (
                        <View
                          style={[
                            styles.quickStatDivider,
                            { backgroundColor: 'rgba(248, 244, 227, 0.2)' },
                          ]}
                        />
                      )}
                      <View style={styles.quickStatItem}>
                        <FontAwesome5 name={stat.icon} size={24} color={stat.iconColor} />
                        <Text style={[styles.quickStatNumber, { color: themeColors.text }]}>
                          {stat.value}
                        </Text>
                        <Text style={[styles.quickStatLabel, { color: themeColors.textSecondary }]}>
                          {stat.label}
                        </Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </LinearGradient>
            </View>
          </Animatable.View>

          {/* Progress Widget - Reused from home with consistent styling */}
          <ProgressWidget navigation={navigation} themeStyles={themeStyles} t={t} />

          {/* Hierarchical Insights Widget - Reused from home */}
          <HierarchicalInsightsWidget
            navigation={navigation}
            themeStyles={themeStyles}
            t={t}
            hierarchicalInsights={{
              ...hierarchicalInsights,
              topSubject: hierarchicalInsights.topSubject
                ? {
                    ...hierarchicalInsights.topSubject,
                    courses: hierarchicalInsights.topSubject.courses ?? 0,
                  }
                : null,
            }}
          />

          {/* View Full Analytics Button with Carved Border */}
          <Animatable.View animation="fadeInUp" delay={800} style={styles.actionContainer}>
            <View
              style={[
                styles.carvedBorderContainer,
                {
                  borderTopColor: themeColors.dividerShadow,
                  borderLeftColor: themeColors.dividerShadow,
                  borderBottomColor: themeColors.dividerHighlight,
                  borderRightColor: themeColors.dividerHighlight,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={navigateToProgressTracker}
                activeOpacity={0.8}
                accessibilityLabel="View Detailed Analytics"
                accessibilityRole="button"
                accessibilityHint="Navigate to detailed progress tracker screen"
              >
                <LinearGradient
                  colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
                  style={styles.primaryActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 name="chart-bar" size={20} color={themeColors.background} />
                  <Text style={[styles.primaryActionText, { color: themeColors.background }]}>
                    View Detailed Analytics
                  </Text>
                  <FontAwesome5 name="arrow-right" size={16} color={themeColors.background} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Spacer for bottom tab bar - matches HomeTab and FeaturesTab */}
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
    paddingTop: 60, // Consistent with HomeTab and FeaturesTab
    paddingHorizontal: 20, // Consistent horizontal padding
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 32, // Consistent spacing with other tabs
  },
  headerTitle: {
    fontSize: 32, // Matches FeaturesTab header size
    fontWeight: '800',
    letterSpacing: -0.5, // Tight letter spacing for elegance
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  quickStatsContainer: {
    marginBottom: 30, // Consistent spacing between sections
  },
  carvedBorderContainer: {
    borderWidth: 1,
    borderRadius: 22, // Slightly larger than inner content (20px + 2px)
    padding: 12, // Padding inside carved border
    backgroundColor: 'transparent',
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
    gap: 8, // Modern gap property for vertical spacing
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
  },
  actionContainer: {
    marginBottom: 16,
  },
  primaryAction: {
    borderRadius: 20, // Adjusted to fit within carved border
    overflow: 'hidden',
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
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
});

export default AnalyticsTab;
