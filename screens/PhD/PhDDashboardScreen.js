// =============================
// 📄 screens/PhD/PhDDashboardScreen.js
// =============================

/**
 * PhD Research Companion Dashboard
 * MASTERMIND TIER EXCLUSIVE - Main hub for advanced academic features
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionService } from '../../services/SubscriptionService';
import { PhDService } from '../../services/PhDService';
import LoadingSpinner from '../../components/LoadingSpinner';
import UpgradePrompt from '../../components/UpgradePrompt';
import NavigationHelper from '../../utils/NavigationHelper';
import logger from '../utils/logger';


const { width } = Dimensions.get('window');

const PhDDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState(null);
  const [phdStats, setPhdStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [cognitiveProfile, setCognitiveProfile] = useState(null);

  // Check subscription and load data
  useFocusEffect(
    useCallback(() => {
      checkSubscriptionAndLoadData();
    }, [])
  );

  const checkSubscriptionAndLoadData = async () => {
    try {
      setLoading(true);
      
      // Check subscription tier
      const tier = await SubscriptionService.getCurrentTier();
      setSubscriptionTier(tier);
      
      if (tier !== 'mastermind') {
        setLoading(false);
        return; // Show upgrade prompt
      }
      
      // Load PhD dashboard data
      await loadPhDData();
      
    } catch (error) {
      logger.error('❌ Error loading PhD dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadPhDData = async () => {
    try {
      // Load dashboard statistics
      const stats = await PhDService.getDashboardStats();
      setPhdStats(stats);
      
      // Load recent activity
      const activity = await PhDService.getRecentActivity();
      setRecentActivity(activity);
      
      // Load cognitive profile summary
      const profile = await PhDService.getCognitiveProfileSummary();
      setCognitiveProfile(profile);
      
    } catch (error) {
      logger.error('❌ Error loading PhD data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhDData();
    setRefreshing(false);
  };

  const handleFeatureNavigation = (feature, screenName, params = {}) => {
    // Double-check subscription before navigating
    if (subscriptionTier !== 'mastermind') {
      Alert.alert(
        'Premium Feature',
        `${feature} requires a Mastermind subscription to access PhD-level research tools.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }
    
    navigation.navigate(screenName, params);
  };

  if (loading) {
    return <LoadingSpinner message="Loading PhD Research Companion..." />;
  }

  if (subscriptionTier !== 'mastermind') {
    return (
      <UpgradePrompt
        title="PhD Research Companion"
        description="Unlock advanced research tools designed for PhD-level learning"
        features={[
          'PhD-level question complexity',
          'Advanced AI models (Claude Opus)',
          'Research-grade analysis tools',
          'Academic document processing',
          'Comprehensive essay feedback',
          'Research skill training modules',
          'Lab collaboration features',
          'Academic tool integrations'
        ]}
        onUpgrade={() => navigation.navigate('Subscription')}
        onCancel={() => NavigationHelper.safeGoBack(navigation, 'Home')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name="science" size={28} color="#4A90E2" />
            <Text style={styles.title}>PhD Research Companion</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>MASTERMIND</Text>
          </View>
        </View>

        {/* Quick Stats */}
        {phdStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{phdStats.questionsCompleted}</Text>
              <Text style={styles.statLabel}>PhD Questions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{phdStats.essaysEvaluated}</Text>
              <Text style={styles.statLabel}>Essays Evaluated</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{phdStats.documentsProcessed}</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{phdStats.skillsAssessed}</Text>
              <Text style={styles.statLabel}>Skills Assessed</Text>
            </View>
          </View>
        )}

        {/* Cognitive Profile Summary */}
        {cognitiveProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cognitive Profile</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Critical Thinking</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${cognitiveProfile.criticalThinking}%` }]} 
                  />
                </View>
                <Text style={styles.profileScore}>{cognitiveProfile.criticalThinking}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Research Skills</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${cognitiveProfile.researchSkills}%` }]} 
                  />
                </View>
                <Text style={styles.profileScore}>{cognitiveProfile.researchSkills}</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewFullButton}
                onPress={() => handleFeatureNavigation('Analytics Dashboard', 'PhDAnalytics')}
              >
                <Text style={styles.viewFullText}>View Full Analysis</Text>
                <Icon name="arrow-forward" size={16} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Main Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Research Tools</Text>
          
          {/* Question Generation */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeatureNavigation('Advanced Question Generation', 'PhDQuestionGenerator')}
          >
            <View style={styles.featureIconContainer}>
              <Icon name="quiz" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>PhD-Level Questions</Text>
              <Text style={styles.featureDescription}>
                Generate complex scenario-based, methodological, and analytical questions
              </Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666666" />
          </TouchableOpacity>

          {/* Document Processing */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeatureNavigation('Document Processing', 'DocumentUpload')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: '#E67E22' }]}>
              <Icon name="upload-file" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Academic Documents</Text>
              <Text style={styles.featureDescription}>
                Upload papers, datasets, and generate questions from your research
              </Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666666" />
          </TouchableOpacity>

          {/* Essay Evaluation */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeatureNavigation('Essay Evaluation', 'EssayEvaluator')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: '#9B59B6' }]}>
              <Icon name="rate-review" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI Essay Feedback</Text>
              <Text style={styles.featureDescription}>
                Get comprehensive feedback on open-ended responses with bias detection
              </Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666666" />
          </TouchableOpacity>

          {/* Research Skills */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeatureNavigation('Research Skills', 'ResearchSkills')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: '#27AE60' }]}>
              <Icon name="school" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Research Training</Text>
              <Text style={styles.featureDescription}>
                Practice grant writing, peer review, and conference defense skills
              </Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Collaboration & Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collaboration & Tools</Text>
          
          {/* Lab Groups */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeatureNavigation('Lab Collaboration', 'CollaborativeGroups')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: '#3498DB' }]}>
              <Icon name="groups" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Lab Groups</Text>
              <Text style={styles.featureDescription}>
                Create and manage collaborative learning groups with your research team
              </Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666666" />
          </TouchableOpacity>

          {/* Academic Integrations */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeatureNavigation('Academic Integrations', 'AcademicIntegrations')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: '#E74C3C' }]}>
              <Icon name="link" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Academic Tools</Text>
              <Text style={styles.featureDescription}>
                Connect Zotero, Mendeley, arXiv, and other research databases
              </Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.slice(0, 3).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Icon name={activity.icon} size={20} color="#4A90E2" />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.timeAgo}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 10,
  },
  tierBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileLabel: {
    fontSize: 14,
    color: '#2C3E50',
    width: 120,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  profileScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
    width: 30,
    textAlign: 'right',
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewFullText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    marginRight: 5,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityContent: {
    flex: 1,
    marginLeft: 10,
  },
  activityTitle: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default PhDDashboardScreen;