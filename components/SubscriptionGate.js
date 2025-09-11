// components/SubscriptionGate.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';

// Component that wraps features behind subscription gates
export function SubscriptionGate({ 
  feature, 
  children, 
  fallback = null,
  showPrompt = true,
  requiredTier = 'scholar',
  theme = 'light' 
}) {
  const { canAccessFeature, getFeatureName, currentTier } = useSubscription();
  const navigation = useNavigation();

  const colors = theme === 'dark' 
    ? {
        background: '#1A2C5B',
        surface: '#2C3E50',
        text: '#FFFFFF',
        textSecondary: '#BDC3C7',
        accent: '#E74C3C',
        warning: '#FFD700'
      }
    : {
        background: '#F8F4E3',
        surface: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        accent: '#E74C3C',
        warning: '#FFD700'
      };

  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (!showPrompt) {
    return null;
  }

  const tierInfo = {
    scholar: { name: 'Scholar', price: '$2.99', color: '#3498DB', emoji: '🔷' },
    mastermind: { name: 'Mastermind', price: '$5.99', color: '#FFD700', emoji: '🟡' }
  };

  const tier = tierInfo[requiredTier];

  return (
    <Animatable.View animation="fadeIn" style={[styles.gateContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.gateContent}>
        <FontAwesome5 name="lock" size={32} color={colors.accent} />
        
        <Text style={[styles.gateTitle, { color: colors.text }]}>
          {getFeatureName(feature)} Premium Feature
        </Text>
        
        <Text style={[styles.gateDescription, { color: colors.textSecondary }]}>
          Unlock {getFeatureName(feature)} with {tier.emoji} {tier.name}
        </Text>
        
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Subscription', { 
            context: `Unlock ${getFeatureName(feature)}`,
            requiredTier,
            feature 
          })}
        >
          <FontAwesome5 name="crown" size={16} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>
            Upgrade to {tier.name} - {tier.price}/month
          </Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
}

// Component for quiz limit warnings
export function QuizLimitGate({ children, theme = 'light' }) {
  const { canTakeQuiz, getRemainingQuizzes, currentTier } = useSubscription();
  const navigation = useNavigation();

  const colors = theme === 'dark' 
    ? {
        surface: '#2C3E50',
        text: '#FFFFFF',
        textSecondary: '#BDC3C7',
        accent: '#E74C3C',
        warning: '#FFD700'
      }
    : {
        surface: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        accent: '#E74C3C',
        warning: '#FFD700'
      };

  if (canTakeQuiz) {
    return children;
  }

  const remaining = getRemainingQuizzes();

  return (
    <Animatable.View animation="shakeX" style={[styles.limitContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.limitContent}>
        <FontAwesome5 name="exclamation-triangle" size={28} color={colors.warning} />
        
        <Text style={[styles.limitTitle, { color: colors.text }]}>
          Daily Quiz Limit Reached
        </Text>
        
        <Text style={[styles.limitDescription, { color: colors.textSecondary }]}>
          You've used all {currentTier.limits.dailyQuizzes} quizzes for today.
          {remaining !== 'Unlimited' && ` ${remaining} remaining.`}
        </Text>
        
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Subscription', { 
            context: 'Get unlimited daily quizzes',
            requiredTier: 'scholar',
            feature: 'unlimited_quizzes'
          })}
        >
          <FontAwesome5 name="infinity" size={16} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>
            Get Unlimited Quizzes
          </Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
}

// Premium badge component for navigation headers
export function PremiumBadge({ tier, size = 20, style = {} }) {
  const getBadgeInfo = () => {
    switch (tier?.id) {
      case 'mastermind':
        return { icon: 'crown', color: '#FFD700' };
      case 'scholar':
        return { icon: 'gem', color: '#3498DB' };
      default:
        return null;
    }
  };

  const badgeInfo = getBadgeInfo();
  
  if (!badgeInfo) return null;

  return (
    <FontAwesome5 
      name={badgeInfo.icon}
      size={size}
      color={badgeInfo.color}
      style={[{ marginRight: 15 }, style]}
    />
  );
}

// Trial banner component
export function TrialBanner({ theme = 'light' }) {
  const { isTrialActive, trialDaysRemaining, currentTier } = useSubscription();
  const navigation = useNavigation();

  if (!isTrialActive) return null;

  const colors = theme === 'dark' 
    ? {
        surface: '#2C3E50',
        text: '#FFFFFF',
        accent: '#E74C3C',
        success: '#22C55E'
      }
    : {
        surface: '#FFFFFF',
        text: '#2C3E50',
        accent: '#E74C3C',
        success: '#28A745'
      };

  return (
    <Animatable.View animation="slideInDown" style={[styles.trialBanner, { backgroundColor: colors.success }]}>
      <View style={styles.trialContent}>
        <FontAwesome5 name="clock" size={16} color="#FFFFFF" />
        <Text style={styles.trialText}>
          {trialDaysRemaining} days left in your {currentTier.name} trial
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Subscription', { 
            context: 'Continue your trial with full subscription',
            requiredTier: currentTier.id 
          })}
        >
          <Text style={styles.trialAction}>Subscribe</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
}

// Subscription status indicator for settings/profile
export function SubscriptionStatusCard({ theme = 'light' }) {
  const { 
    currentTier, 
    hasActiveSubscription, 
    subscriptionExpiry,
    isTrialActive,
    trialDaysRemaining 
  } = useSubscription();
  const navigation = useNavigation();

  const colors = theme === 'dark' 
    ? {
        surface: '#2C3E50',
        text: '#FFFFFF',
        textSecondary: '#BDC3C7',
        accent: '#E74C3C',
        success: '#22C55E'
      }
    : {
        surface: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        accent: '#E74C3C',
        success: '#28A745'
      };

  const getStatusInfo = () => {
    if (isTrialActive) {
      return {
        status: 'Trial Active',
        description: `${trialDaysRemaining} days remaining`,
        color: colors.success,
        icon: 'clock'
      };
    } else if (hasActiveSubscription) {
      const expiryDate = subscriptionExpiry ? new Date(subscriptionExpiry).toLocaleDateString() : '';
      return {
        status: `${currentTier.name} Active`,
        description: expiryDate ? `Renews ${expiryDate}` : 'Active subscription',
        color: currentTier.color,
        icon: currentTier.id === 'mastermind' ? 'crown' : 'gem'
      };
    } else {
      return {
        status: 'Free Plan',
        description: 'Upgrade to unlock premium features',
        color: colors.textSecondary,
        icon: 'user'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      style={[styles.statusCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate(hasActiveSubscription ? 'SubscriptionManagement' : 'Subscription')}
    >
      <View style={styles.statusContent}>
        <View style={styles.statusLeft}>
          <FontAwesome5 name={statusInfo.icon} size={24} color={statusInfo.color} />
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              {statusInfo.status}
            </Text>
            <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
              {statusInfo.description}
            </Text>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

// Hook for navigation with subscription awareness
export function useSubscriptionNavigation() {
  const navigation = useNavigation();
  const { canAccessFeature, checkQuizAccess } = useSubscription();

  const navigateWithSubscriptionCheck = (screenName, feature, params = {}) => {
    if (feature && !canAccessFeature(feature)) {
      navigation.navigate('Subscription', {
        context: `Access ${screenName}`,
        feature,
        returnTo: screenName,
        returnParams: params
      });
      return false;
    }

    navigation.navigate(screenName, params);
    return true;
  };

  const navigateToQuizWithCheck = (params = {}) => {
    const quizAccess = checkQuizAccess();
    
    if (!quizAccess.allowed) {
      navigation.navigate('Subscription', {
        context: 'Take unlimited quizzes',
        feature: 'unlimited_quizzes',
        requiredTier: 'scholar'
      });
      return false;
    }

    navigation.navigate('Quiz', params);
    return true;
  };

  return {
    navigateWithSubscriptionCheck,
    navigateToQuizWithCheck,
    navigateToSubscription: (context = '', requiredTier = 'scholar') => {
      navigation.navigate('Subscription', { context, requiredTier });
    }
  };
}

const styles = StyleSheet.create({
  gateContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gateContent: {
    alignItems: 'center',
  },
  gateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  gateDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  limitContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  limitContent: {
    alignItems: 'center',
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  limitDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  trialBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trialText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  trialAction: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  statusCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});

export default {
  SubscriptionGate,
  QuizLimitGate,
  PremiumBadge,
  TrialBanner,
  SubscriptionStatusCard,
  useSubscriptionNavigation
};