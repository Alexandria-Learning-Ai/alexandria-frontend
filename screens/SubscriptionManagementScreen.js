// screens/SubscriptionManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSubscription } from '../contexts/SubscriptionContext';
import logger from '../utils/logger';


const SubscriptionManagementScreen = ({ navigation, route, theme = 'light' }) => {
  const [loading, setLoading] = useState(false);
  const [managementURL, setManagementURL] = useState(null);

  const {
    currentTier,
    hasActiveSubscription,
    subscriptionExpiry,
    isTrialActive,
    trialDaysRemaining,
    getSubscriptionManagementURL,
    restorePurchases
  } = useSubscription();

  // Theme colors
  const colors = theme === 'dark' 
    ? {
        background: '#1A2C5B',
        surface: '#2C3E50',
        text: '#FFFFFF',
        textSecondary: '#BDC3C7',
        accent: '#E74C3C',
        success: '#22C55E',
        warning: '#FFD700',
        danger: '#E74C3C'
      }
    : {
        background: '#F8F4E3',
        surface: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        accent: '#E74C3C',
        success: '#28A745',
        warning: '#FFD700',
        danger: '#DC3545'
      };

  useEffect(() => {
    loadManagementURL();
  }, []);

  const loadManagementURL = async () => {
    try {
      const url = await getSubscriptionManagementURL();
      setManagementURL(url);
    } catch (error) {
      logger.error('Error loading management URL:', error);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      Platform.OS === 'ios' 
        ? 'To cancel your Alexandria subscription, you\'ll need to manage it through your Apple ID settings.'
        : 'To cancel your Alexandria subscription, you\'ll need to manage it through Google Play Store.',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => openSubscriptionSettings()
        }
      ]
    );
  };

  const openSubscriptionSettings = async () => {
    try {
      if (managementURL) {
        const supported = await Linking.canOpenURL(managementURL);
        if (supported) {
          await Linking.openURL(managementURL);
        } else {
          throw new Error('Cannot open subscription management URL');
        }
      } else {
        // Fallback URLs
        const fallbackURL = Platform.OS === 'ios' 
          ? 'https://apps.apple.com/account/subscriptions'
          : 'https://play.google.com/store/account/subscriptions';
        
        await Linking.openURL(fallbackURL);
      }
    } catch (error) {
      Alert.alert(
        'Unable to Open Settings',
        Platform.OS === 'ios'
          ? 'Please go to Settings > Apple ID > Subscriptions on your device to manage your subscription.'
          : 'Please go to Google Play Store > Account > Subscriptions to manage your subscription.'
      );
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      
      if (result.success && result.restored) {
        Alert.alert(
          'Purchases Restored! ✅',
          'Your subscription has been restored successfully.'
        );
      } else if (result.success) {
        Alert.alert(
          'No Purchases Found',
          'No active subscriptions were found to restore.'
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Alert.alert('Restore Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    const nextTier = currentTier?.id === 'scholar' ? 'mastermind' : 'scholar';
    navigation.navigate('Subscription', {
      context: 'Upgrade your plan',
      currentTier: currentTier?.id,
      suggestedTier: nextTier
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderSubscriptionStatus = () => {
    if (!hasActiveSubscription) {
      return (
        <Animatable.View animation="fadeIn" style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statusHeader}>
            <FontAwesome5 name="user" size={32} color={colors.textSecondary} />
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              Free Plan
            </Text>
          </View>
          <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
            You're currently using Alexandria's free plan with basic features.
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Subscription')}
          >
            <FontAwesome5 name="crown" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </Animatable.View>
      );
    }

    const tierInfo = {
      scholar: { color: '#3498DB', icon: 'gem', emoji: '🔷' },
      mastermind: { color: '#FFD700', icon: 'crown', emoji: '🟡' }
    };

    const info = tierInfo[currentTier?.id] || tierInfo.scholar;

    return (
      <Animatable.View animation="fadeIn" style={[styles.statusCard, { backgroundColor: colors.surface }]}>
        <View style={styles.statusHeader}>
          <FontAwesome5 name={info.icon} size={32} color={info.color} />
          <View style={styles.statusTitleContainer}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              {info.emoji} {currentTier?.name} Active
            </Text>
            {isTrialActive && (
              <Text style={[styles.trialBadge, { color: colors.success }]}>
                Trial • {trialDaysRemaining} days left
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
          {isTrialActive 
            ? `Your ${currentTier?.name} trial expires on ${formatDate(subscriptionExpiry)}`
            : `Your subscription renews on ${formatDate(subscriptionExpiry)}`
          }
        </Text>

        <View style={styles.featuresList}>
          {currentTier?.features?.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <FontAwesome5 name="check" size={14} color={info.color} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature}
              </Text>
            </View>
          ))}
          {currentTier?.features?.length > 3 && (
            <Text style={[styles.moreFeatures, { color: colors.textSecondary }]}>
              +{currentTier.features.length - 3} more features
            </Text>
          )}
        </View>
      </Animatable.View>
    );
  };

  const renderManagementOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Subscription Management
      </Text>

      {hasActiveSubscription && (
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.surface }]}
          onPress={openSubscriptionSettings}
        >
          <View style={styles.optionContent}>
            <FontAwesome5 name="cog" size={20} color={colors.accent} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Manage Subscription
              </Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                Update payment method, cancel, or modify your plan
              </Text>
            </View>
            <FontAwesome5 name="external-link-alt" size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.optionCard, { backgroundColor: colors.surface }]}
        onPress={handleRestorePurchases}
        disabled={loading}
      >
        <View style={styles.optionContent}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <FontAwesome5 name="redo" size={20} color={colors.success} />
          )}
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              Restore Purchases
            </Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
              Restore your subscription on this device
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {hasActiveSubscription && currentTier?.id === 'scholar' && (
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.surface }]}
          onPress={handleUpgrade}
        >
          <View style={styles.optionContent}>
            <FontAwesome5 name="arrow-up" size={20} color={colors.warning} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                Upgrade to Mastermind
              </Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                Get GPT-4 access, advanced features, and priority support
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}

      {hasActiveSubscription && (
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.danger, borderWidth: 1 }]}
          onPress={handleCancelSubscription}
        >
          <View style={styles.optionContent}>
            <FontAwesome5 name="times-circle" size={20} color={colors.danger} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.danger }]}>
                Cancel Subscription
              </Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                End your subscription and return to free plan
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={theme === 'dark' 
          ? ['#1A2C5B', '#2C3E50'] 
          : ['#F8F4E3', '#ECF0F1']
        }
        style={styles.header}
      >
        <Animatable.View animation="fadeInDown" style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Subscription Management
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage your Alexandria subscription and features
          </Text>
        </Animatable.View>
      </LinearGradient>

      {renderSubscriptionStatus()}
      {renderManagementOptions()}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Need help? Contact our support team for assistance with your subscription.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    margin: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitleContainer: {
    marginLeft: 15,
    flex: 1,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  trialBadge: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  featuresList: {
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SubscriptionManagementScreen;