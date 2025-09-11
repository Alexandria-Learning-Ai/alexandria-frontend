// SubscriptionScreen.js - Alexandria Themed
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import SubscriptionManager, { SUBSCRIPTION_TIERS } from '../services/SubscriptionManager';
import { revenueCatService } from '../services/RevenueCatService';
import SafeBackButton from '../components/SafeBackButton';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';


const { width, height } = Dimensions.get('window');

// Alexandria-themed tier definitions
const ALEXANDRIA_TIERS = {
  EXPLORER: {
    id: 'explorer',
    name: 'The Explorer',
    subtitle: 'Bronze Tier',
    modelName: 'Alexandria Core',
    modelTagline: 'Your steady and resourceful guide through the halls of knowledge',
    price: 2.99,
    emoji: '🧭',
    icon: 'compass',
    colors: {
      primary: '#CD7F32', // Bronze
      secondary: '#8B4513', // Darker bronze
      background: '#FFF8DC', // Cornsilk
      accent: '#B8860B' // Dark goldenrod
    },
    features: [
      'All core features: quiz generation, history tracking, grading',
      'Custom quiz types (MCQ, open-ended, matching)',
      'Progress tracking, streaks, and XP system',
      'Basic explanations and feedback',
      'Study reminders and notifications'
    ],
    ideal: 'Perfect for casual learners, exam prep, and broad general subjects'
  },
  SCHOLAR: {
    id: 'scholar',
    name: 'The Scholar',
    subtitle: 'Silver Tier',
    modelName: 'Alexandria Insight',
    modelTagline: 'A mentor with deeper reasoning and wider disciplines',
    price: 5.99,
    emoji: '📚',
    icon: 'graduation-cap',
    colors: {
      primary: '#C0C0C0', // Silver
      secondary: '#708090', // Slate gray
      background: '#F8F8FF', // Ghost white
      accent: '#4682B4' // Steel blue
    },
    features: [
      'All Explorer features, plus advanced capabilities',
      'Mastery of complex topics (calculus, organic chemistry)',
      'Sophisticated, thought-provoking questions',
      'Personalized quizzes based on learning patterns',
      'Enhanced explanations with context',
      'Advanced progress analytics'
    ],
    ideal: 'Ideal for serious students, STEM courses, higher education prep',
    popular: true
  },
  MASTERMIND: {
    id: 'mastermind',
    name: 'The Mastermind',
    subtitle: 'Gold Tier',
    modelName: 'Alexandria Oracle',
    modelTagline: 'The pinnacle of intellectual precision for demanding challenges',
    price: 9.99,
    emoji: '👁️',
    icon: 'eye',
    colors: {
      primary: '#FFD700', // Gold
      secondary: '#DAA520', // Goldenrod
      background: '#1C1C1C', // Almost black
      accent: '#FF6347' // Tomato (for flame effect)
    },
    features: [
      'All Scholar features, plus elite capabilities',
      'Elite-level quizzes (quantum mechanics, advanced logic)',
      'Premium "Explain Answer" with step-by-step reasoning',
      'Goal-based study planning with adaptive AI',
      'Smart, contextual reminders and insights',
      'Priority support and early feature access'
    ],
    ideal: 'For advanced learners, pre-med, graduate-level prep, specialization'
  }
};

const SubscriptionScreen = ({ navigation, route, theme = 'light' }) => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [currentTier, setCurrentTier] = useState('explorer');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [productPrices, setProductPrices] = useState({});

  const userId = route?.params?.userId || 'default_user_id';

  // Enhanced theme colors for Alexandria
  const colors = theme === 'dark' 
    ? {
        background: '#0F1419', // Deep ancient night
        surface: '#1A2C5B',
        text: '#F5F5DC', // Beige for ancient parchment feel
        textSecondary: '#BDC3C7',
        accent: '#E74C3C',
        gold: '#FFD700',
        bronze: '#CD7F32',
        silver: '#C0C0C0'
      }
    : {
        background: '#F8F4E3', // Warm parchment
        surface: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        accent: '#E74C3C',
        gold: '#B8860B',
        bronze: '#8B4513',
        silver: '#4682B4'
      };

  useEffect(() => {
    initializeSubscription();
  }, []);

  const initializeSubscription = async () => {
    setLoading(true);
    try {
      await SubscriptionManager.initialize(userId);
      const tier = SubscriptionManager.getCurrentTier();
      setCurrentTier(tier?.id || 'explorer');
      
      await revenueCatService.loadOfferings();
      const loadedOfferings = revenueCatService.offerings;
      setOfferings(loadedOfferings);
      
      await loadProductPrices();
    } catch (error) {
      logger.error('Error initializing subscription:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductPrices = async () => {
    try {
      const prices = {};
      
      for (const [key, tier] of Object.entries(ALEXANDRIA_TIERS)) {
        if (tier.price > 0) {
          const productId = `alexandria_${tier.id}_monthly`;
          const product = await revenueCatService.getProductInfo(productId);
          if (product) {
            prices[tier.id] = {
              price: product.priceAmount,
              priceString: product.priceString,
              currencyCode: product.currencyCode
            };
          }
        }
      }
      
      setProductPrices(prices);
    } catch (error) {
      logger.error('Error loading product prices:', error);
    }
  };

  const handleTierSelection = (tier) => {
    setSelectedTier(tier);
  };

  const handleUpgrade = async () => {
    if (!selectedTier || selectedTier.price === 0) return;

    setProcessingPayment(true);
    
    try {
      const result = await SubscriptionManager.upgradeTier(selectedTier.id);
      
      if (result.success) {
        Alert.alert(
          '🏛️ Welcome to Alexandria! 🎉',
          `You have ascended to ${selectedTier.name}! The halls of wisdom await you.`,
          [
            {
              text: 'Begin Your Journey',
              onPress: () => NavigationHelper.safeGoBack(navigation)
            }
          ]
        );
        setCurrentTier(selectedTier.id);
      } else if (result.cancelled) {
        logger.info('Purchase cancelled by user');
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error) {
      Alert.alert(
        'Purchase Error', 
        error.message || 'Something went wrong. Please try again.',
        [
          { text: 'OK' },
          { 
            text: 'Restore Purchases', 
            onPress: () => handleRestorePurchases() 
          }
        ]
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      const result = await SubscriptionManager.restorePurchases();
      
      if (result.success && result.hasActiveSubscription) {
        Alert.alert(
          '🏛️ Membership Restored! ✅',
          `Your ${result.tier.name} access has been restored to the Great Library.`
        );
        setCurrentTier(result.tier.id);
      } else if (result.success) {
        Alert.alert(
          'No Active Memberships',
          'No active subscriptions were found in the archives.'
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

  const renderTierCard = (tier, index) => {
    const isSelected = selectedTier?.id === tier.id;
    const isCurrent = currentTier === tier.id;
    const isPopular = tier.popular;

    return (
      <Animatable.View
        key={tier.id}
        animation="fadeInUp"
        delay={index * 200}
        style={styles.tierCardContainer}
      >
        <LinearGradient
          colors={theme === 'dark' 
            ? [tier.colors.background + '20', tier.colors.primary + '10'] 
            : [tier.colors.background, '#FFFFFF']
          }
          style={[
            styles.tierCard,
            {
              borderColor: isSelected ? tier.colors.primary : (tier.colors.secondary + '30'),
              borderWidth: isSelected ? 3 : 1,
            }
          ]}
        >
          {isPopular && (
            <View style={[styles.popularBanner, { backgroundColor: tier.colors.accent || colors.accent }]}>
              <FontAwesome5 name="crown" size={12} color="#FFFFFF" />
              <Text style={styles.popularText}>MOST CHOSEN PATH</Text>
            </View>
          )}
          
          {isCurrent && (
            <View style={[styles.currentBanner, { backgroundColor: colors.accent }]}>
              <FontAwesome5 name="check-circle" size={12} color="#FFFFFF" />
              <Text style={styles.currentText}>YOUR CURRENT PATH</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.tierContent}
            onPress={() => handleTierSelection(tier)}
            disabled={isCurrent}
            activeOpacity={0.8}
          >
            {/* Tier Header */}
            <View style={styles.tierHeader}>
              <View style={styles.tierIconContainer}>
                <LinearGradient
                  colors={[tier.colors.primary, tier.colors.secondary]}
                  style={styles.tierIconGradient}
                >
                  <FontAwesome5 
                    name={tier.icon} 
                    size={28} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
              </View>
              
              <View style={styles.tierTitleContainer}>
                <Text style={[styles.tierName, { color: colors.text }]}>
                  {tier.name}
                </Text>
                <Text style={[styles.tierSubtitle, { color: tier.colors.primary }]}>
                  {tier.subtitle}
                </Text>
              </View>
            </View>

            {/* AI Model Info */}
            <View style={[styles.modelContainer, { borderColor: tier.colors.primary + '30' }]}>
              <Text style={[styles.modelName, { color: tier.colors.primary }]}>
                Powered by {tier.modelName}
              </Text>
              <Text style={[styles.modelTagline, { color: colors.textSecondary }]}>
                {tier.modelTagline}
              </Text>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              {tier.price === 0 ? (
                <Text style={[styles.priceText, { color: tier.colors.primary }]}>
                  FREE ACCESS
                </Text>
              ) : (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceText, { color: colors.text }]}>
                    {productPrices[tier.id]?.priceString || `$${tier.price}`}
                  </Text>
                  <Text style={[styles.priceSubtext, { color: colors.textSecondary }]}>
                    /month
                  </Text>
                </View>
              )}
            </View>

            {/* Ideal For */}
            <Text style={[styles.idealFor, { color: colors.textSecondary }]}>
              {tier.ideal}
            </Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {tier.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <FontAwesome5 
                    name="scroll" 
                    size={12} 
                    color={tier.colors.primary} 
                    style={styles.featureIcon}
                  />
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            {!isCurrent && (
              <LinearGradient
                colors={isSelected 
                  ? [tier.colors.primary, tier.colors.secondary]
                  : ['transparent', 'transparent']
                }
                style={[
                  styles.selectButton,
                  {
                    borderColor: tier.colors.primary,
                    borderWidth: isSelected ? 0 : 2
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.selectButtonInner}
                  onPress={() => handleTierSelection(tier)}
                >
                  <FontAwesome5 
                    name={tier.price === 0 ? "unlock" : "arrow-right"} 
                    size={14} 
                    color={isSelected ? "#FFFFFF" : tier.colors.primary} 
                  />
                  <Text
                    style={[
                      styles.selectButtonText,
                      { color: isSelected ? '#FFFFFF' : tier.colors.primary }
                    ]}
                  >
                    {tier.price === 0 ? 'CURRENT PATH' : 'CHOOSE PATH'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </Animatable.View>
    );
  };

  // Alexandria Message Component
  const AlexandriaWisdom = () => (
    <Animatable.View animation="fadeInUp" delay={300} style={styles.wisdomContainer}>
      <LinearGradient
        colors={theme === 'dark' 
          ? ['#1A2C5B', '#2C3E50'] 
          : ['#F8F4E3', '#FFFFFF']
        }
        style={[styles.wisdomCard, { borderColor: colors.gold }]}
      >
        <View style={styles.wisdomHeader}>
          <FontAwesome5 name="university" size={24} color={colors.gold} />
          <Text style={[styles.wisdomTitle, { color: colors.text }]}>
            The Wisdom of Alexandria
          </Text>
        </View>
        
        <Text style={[styles.wisdomQuote, { color: colors.text }]}>
          "In the great Library of Alexandria, knowledge was never hoarded—it was shared freely among all who sought wisdom.
        </Text>
        
        <Text style={[styles.wisdomText, { color: colors.text }]}>
          Today's Alexandria honors that legacy. Every essential tool for learning lives within these halls, accessible to all.
        </Text>
        
        <Text style={[styles.wisdomText, { color: colors.text }]}>
          Our tiers don't lock away knowledge—they match you with the right guide for your journey. A novice needs different wisdom than a master scholar.
        </Text>
        
        <Text style={[styles.wisdomClosing, { color: colors.gold }]}>
          Choose not by what you can afford, but by how deeply you wish to explore the infinite corridors of understanding."
        </Text>
        
        <View style={styles.wisdomFooter}>
          <Text style={[styles.wisdomSignature, { color: colors.textSecondary }]}>
            — The Keepers of Alexandria
          </Text>
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <FontAwesome5 name="university" size={48} color={colors.gold} />
        <ActivityIndicator size="large" color={colors.gold} style={styles.loader} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Consulting the ancient scrolls...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient
          colors={theme === 'dark' 
            ? ['#0F1419', '#1A2C5B'] 
            : ['#F8F4E3', '#ECF0F1']
          }
          style={styles.headerGradient}
        >
          <SafeBackButton 
            style={styles.backButton}
            color={colors.text}
            size={20}
          />
          
          <Animatable.View animation="fadeInDown" style={styles.headerContent}>
            <FontAwesome5 name="university" size={40} color={colors.gold} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Choose Your Path to Wisdom
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Three guides await you in the halls of Alexandria
            </Text>
          </Animatable.View>
        </LinearGradient>

        {/* Alexandria Wisdom */}
        <AlexandriaWisdom />

        {/* Tier Cards */}
        <View style={styles.tiersContainer}>
          {Object.values(ALEXANDRIA_TIERS).map((tier, index) => 
            renderTierCard(tier, index)
          )}
        </View>

        {/* Upgrade Section */}
        {selectedTier && selectedTier.price > 0 && (
          <Animatable.View 
            animation="slideInUp" 
            style={styles.upgradeSection}
          >
            <LinearGradient
              colors={[selectedTier.colors.primary, selectedTier.colors.secondary]}
              style={styles.upgradeButton}
            >
              <TouchableOpacity
                style={styles.upgradeButtonInner}
                onPress={handleUpgrade}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome5 name="unlock" size={20} color="#FFFFFF" />
                    <Text style={styles.upgradeButtonText}>
                      Ascend to {selectedTier.name} - {productPrices[selectedTier.id]?.priceString || `$${selectedTier.price}/month`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
            
            <Text style={[styles.upgradeDisclaimer, { color: colors.textSecondary }]}>
              Cancel anytime • Secure payment • Instant access to the archives
            </Text>
          </Animatable.View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <FontAwesome5 name="history" size={16} color={colors.gold} />
            <Text style={[styles.restoreButtonText, { color: colors.gold }]}>
              Restore Previous Access
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            All paths include core Alexandria features. Upgrade anytime to unlock deeper wisdom.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Wisdom Message Styles
  wisdomContainer: {
    marginHorizontal: 20,
    marginVertical: 30,
  },
  wisdomCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  wisdomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  wisdomTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  wisdomQuote: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  wisdomText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  wisdomClosing: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  wisdomFooter: {
    alignItems: 'flex-end',
  },
  wisdomSignature: {
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Tier Card Styles
  tiersContainer: {
    paddingHorizontal: 20,
  },
  tierCardContainer: {
    marginBottom: 24,
  },
  tierCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  popularBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  currentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  currentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tierContent: {
    padding: 24,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierIconContainer: {
    marginRight: 16,
  },
  tierIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitleContainer: {
    flex: 1,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tierSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  modelContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  modelTagline: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  priceSubtext: {
    fontSize: 16,
    marginLeft: 4,
  },
  idealFor: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  selectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Upgrade Section Styles
  upgradeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  upgradeButton: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  upgradeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  upgradeDisclaimer: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Footer Styles
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default SubscriptionScreen;