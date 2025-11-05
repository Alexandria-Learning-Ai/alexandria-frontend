import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { ThemeStyles } from '../../types';

interface UsageStats {
  percentageUsed: number;
  todayUsage: number;
  maxUsage: number;
}

interface UsageStatsCardProps {
  usageStats: UsageStats | null;
  themeStyles: ThemeStyles;
}

const UsageStatsCard: React.FC<UsageStatsCardProps> = ({ usageStats, themeStyles }) => {
  if (!usageStats) return null;

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={1000}
      style={[styles.usageCard, themeStyles.explanationContainer]}
    >
      <View style={styles.usageHeader}>
        <FontAwesome5 name="chart-line" size={16} color={(themeStyles.insightTitle as any)?.color || '#3B82F6'} />
        <Text style={[styles.usageTitle, themeStyles.explanationTitle]}>AI Explanations (Basic)</Text>
      </View>

      <View style={styles.usageProgress}>
        <View style={styles.usageBar}>
          <View
            style={[
              styles.usageBarFill,
              {
                width: `${usageStats.percentageUsed || 0}%`,
                backgroundColor: (usageStats.percentageUsed || 0) > 80 ? '#dc3545' : '#3B82F6',
              },
            ]}
          />
        </View>
        <Text style={[styles.usageText, themeStyles.explanationText]}>
          {usageStats.todayUsage || 0}/{usageStats.maxUsage || 20} explanations today
        </Text>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  usageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  usageProgress: {
    gap: 8,
  },
  usageBar: {
    height: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 12,
  },
});

export default UsageStatsCard;
