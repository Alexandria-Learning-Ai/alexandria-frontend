import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StudyModeToggleProps {
  enableStudyMode: boolean;
  setEnableStudyMode: (enabled: boolean) => void;
  styles: any;
}

/**
 * StudyModeToggle - Enhanced toggle for study mode features
 *
 * Features:
 * - Modern card design with gradient accents
 * - Animated toggle with smooth transitions
 * - Feature badges showing what's enabled
 * - Icon animation on state change
 * - Visual feedback with scale and glow effects
 * - Accessibility-compliant with proper labels
 * - Coming soon features preview
 *
 * Accessibility:
 * - accessibilityLabel for current state
 * - accessibilityRole for toggle identification
 * - accessibilityHint for action guidance
 * - accessibilityState for enabled/disabled state
 */
const StudyModeToggle: React.FC<StudyModeToggleProps> = ({
  enableStudyMode,
  setEnableStudyMode,
  styles
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconBounce = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const featuresSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (enableStudyMode) {
      Animated.spring(iconBounce, {
        toValue: 1.15,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(iconBounce, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }).start();
      });

      Animated.parallel([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(featuresSlide, {
          toValue: 1,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(featuresSlide, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [enableStudyMode]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View style={styles.inputContainer}>
      {/* Enhanced Label */}
      <View style={enhancedStyles.labelRow}>
        <FontAwesome5 name="book-reader" size={11} color="#D4AF37" style={{ opacity: 0.7 }} />
        <Text style={[styles.label, enhancedStyles.label]}>Study Mode Features</Text>
        {enableStudyMode && (
          <View style={enhancedStyles.enabledBadge}>
            <Text style={enhancedStyles.enabledBadgeText}>ON</Text>
          </View>
        )}
      </View>

      {/* Enhanced Toggle Card */}
      <Animated.View
        style={[
          enhancedStyles.toggleCard,
          {
            transform: [{ scale: scaleAnim }],
            shadowOpacity: glowOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.toggleOption,
            enhancedStyles.toggleOption,
            enableStudyMode && enhancedStyles.toggleOptionActive
          ]}
          onPress={() => setEnableStudyMode(!enableStudyMode)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessibilityLabel={
            enableStudyMode
              ? 'Study mode enabled. Tap to disable.'
              : 'Study mode disabled. Tap to enable.'
          }
          accessibilityRole="switch"
          accessibilityState={{ checked: enableStudyMode }}
          accessibilityHint="Enables text extraction for summaries, flashcards, and audio"
        >
          {/* Gradient Background when active */}
          {enableStudyMode && (
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.15)', 'rgba(184, 148, 31, 0.15)']}
              style={enhancedStyles.activeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          <View style={[styles.toggleContent, enhancedStyles.toggleContent]}>
            {/* Animated Icon Container */}
            <Animated.View
              style={[
                enhancedStyles.iconContainer,
                {
                  transform: [{ scale: iconBounce }],
                  backgroundColor: enableStudyMode ? '#28a745' + '20' : 'rgba(203, 213, 224, 0.1)',
                },
              ]}
            >
              <FontAwesome5
                name={enableStudyMode ? "check-circle" : "circle"}
                size={18} // TERTIARY: Smaller icon
                color={enableStudyMode ? "#28a745" : "#CBD5E0"}
                solid={enableStudyMode}
              />
            </Animated.View>

            {/* Text Content */}
            <View style={[styles.toggleTextContainer, enhancedStyles.toggleTextContainer]}>
              <View style={enhancedStyles.titleRow}>
                <Text style={[
                  styles.toggleTitle,
                  enhancedStyles.toggleTitle,
                  { color: enableStudyMode ? "#D4AF37" : "#F8F4E3" }
                ]}>
                  Enable Text Extraction
                </Text>
                {enableStudyMode && (
                  <FontAwesome5 name="star" size={12} color="#FFD700" />
                )}
              </View>
              {/* REMOVED: Verbose description to reduce clutter - details shown in feature preview below */}
            </View>

            {/* Chevron indicator */}
            <FontAwesome5
              name={enableStudyMode ? "chevron-up" : "chevron-down"}
              size={14}
              color={enableStudyMode ? "#D4AF37" : "#8A95B5"}
              style={enhancedStyles.chevron}
            />
          </View>
        </TouchableOpacity>

        {/* Feature Preview - Animated slide */}
        <Animated.View
          style={[
            enhancedStyles.featuresPreview,
            {
              maxHeight: enableStudyMode ? 100 : 0,
              opacity: featuresSlide,
              transform: [
                {
                  translateY: featuresSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {enableStudyMode && (
            <View style={enhancedStyles.featuresGrid}>
              {/* Active Features */}
              <View style={enhancedStyles.featureChip}>
                <FontAwesome5 name="file-alt" size={12} color="#28a745" />
                <Text style={enhancedStyles.featureChipText}>Text Extract</Text>
              </View>

              {/* Coming Soon Features */}
              <View style={[enhancedStyles.featureChip, enhancedStyles.comingSoonChip]}>
                <FontAwesome5 name="brain" size={12} color="#8A95B5" />
                <Text style={[enhancedStyles.featureChipText, enhancedStyles.comingSoonText]}>
                  Summaries
                </Text>
                <View style={enhancedStyles.comingSoonBadge}>
                  <Text style={enhancedStyles.comingSoonBadgeText}>Soon</Text>
                </View>
              </View>

              <View style={[enhancedStyles.featureChip, enhancedStyles.comingSoonChip]}>
                <FontAwesome5 name="clone" size={12} color="#8A95B5" />
                <Text style={[enhancedStyles.featureChipText, enhancedStyles.comingSoonText]}>
                  Flashcards
                </Text>
                <View style={enhancedStyles.comingSoonBadge}>
                  <Text style={enhancedStyles.comingSoonBadgeText}>Soon</Text>
                </View>
              </View>

              <View style={[enhancedStyles.featureChip, enhancedStyles.comingSoonChip]}>
                <FontAwesome5 name="volume-up" size={12} color="#8A95B5" />
                <Text style={[enhancedStyles.featureChipText, enhancedStyles.comingSoonText]}>
                  Audio
                </Text>
                <View style={enhancedStyles.comingSoonBadge}>
                  <Text style={enhancedStyles.comingSoonBadgeText}>Soon</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const enhancedStyles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // TERTIARY: Reduced spacing
  },
  label: {
    marginLeft: 8,
    marginBottom: 0,
    flex: 1,
    fontSize: 12, // TERTIARY: Smaller label
    opacity: 0.7, // TERTIARY: Muted
  },
  enabledBadge: {
    backgroundColor: '#28a745',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  enabledBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleCard: {
    borderRadius: 12, // TERTIARY: Smaller radius
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 }, // TERTIARY: Reduced shadow
    shadowRadius: 6, // TERTIARY: Smaller glow
    elevation: 2, // TERTIARY: Lower elevation
    opacity: 0.9, // TERTIARY: Slightly muted
  },
  toggleOption: {
    borderWidth: 1, // TERTIARY: Thinner border
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  toggleOptionActive: {
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  activeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // TERTIARY: Reduced padding
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 36, // TERTIARY: Smaller icon container
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // TERTIARY: Reduced margin
    borderWidth: 1, // TERTIARY: Thinner border
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  toggleTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  toggleTitle: {
    fontSize: 13, // TERTIARY: Smaller title
    fontWeight: '500', // TERTIARY: Lighter weight
    marginRight: 6,
    letterSpacing: 0.1,
  },
  toggleDescription: {
    fontSize: 11, // TERTIARY: Smaller description
    lineHeight: 15,
    opacity: 0.7, // TERTIARY: Muted
  },
  chevron: {
    marginLeft: 8,
  },
  featuresPreview: {
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.3)',
  },
  comingSoonChip: {
    backgroundColor: 'rgba(138, 149, 181, 0.1)',
    borderColor: 'rgba(138, 149, 181, 0.2)',
    position: 'relative',
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 4,
  },
  comingSoonText: {
    color: '#8A95B5',
  },
  comingSoonBadge: {
    backgroundColor: '#FFD700',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  comingSoonBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1A2C5B',
    letterSpacing: 0.3,
  },
});

export default StudyModeToggle;
