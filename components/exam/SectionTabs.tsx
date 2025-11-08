/**
 * SectionTabs - Section navigation for multi-section exams
 *
 * Displays:
 * - Tabs for each section (I, II, III, etc.)
 * - Active section indicator
 * - Section completion indicators
 * - Horizontal scrollable on mobile
 *
 * Features:
 * - Roman numerals for section numbers
 * - Completion badges (3/5 answered)
 * - Active tab highlighting
 * - Smooth scrolling
 * - Touch-optimized
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useExamContext } from './context/ExamContext';
import { colors, spacing, radius as borderRadius } from '../../theme/tokens';

// Typography tokens (not exported from theme)
const typography = {
  sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24 },
  weights: { medium: '500', semibold: '600', bold: '700' }
};

export interface SectionTabsProps {
  showCompletion?: boolean;
}

const SectionTabs: React.FC<SectionTabsProps> = ({ showCompletion = true }) => {
  const { sections, currentSectionIndex, goToSection, answers } = useExamContext();
  const scrollViewRef = useRef<ScrollView>(null);

  /**
   * Auto-scroll to active tab when section changes
   */
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentSectionIndex * 120, // Approximate tab width
        animated: true,
      });
    }
  }, [currentSectionIndex]);

  /**
   * Calculate section completion
   */
  const getSectionCompletion = (sectionIndex: number): { answered: number; total: number } => {
    const section = sections[sectionIndex];
    const total = section.questionCount;

    let answered = 0;
    section.questionIndices.forEach((questionIndex) => {
      // Note: question_number might not match questionIndex
      // We need to get the actual question to find its question_number
      // For now, assuming questionIndex maps directly
      if (answers[questionIndex + 1]) {
        answered++;
      }
    });

    return { answered, total };
  };

  /**
   * Convert number to Roman numeral
   */
  const toRomanNumeral = (num: number): string => {
    const romanMap: [number, string][] = [
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ];

    let result = '';
    for (const [value, numeral] of romanMap) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section, index) => {
          const isActive = index === currentSectionIndex;
          const { answered, total } = getSectionCompletion(index);
          const isComplete = answered === total;
          const romanNumeral = toRomanNumeral(index + 1);

          return (
            <TouchableOpacity
              key={section.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => goToSection(index)}
              activeOpacity={0.7}
            >
              {/* Section Number (Roman Numeral) */}
              <Text style={[styles.sectionNumber, isActive && styles.sectionNumberActive]}>
                {romanNumeral}
              </Text>

              {/* Section Title */}
              <Text
                style={[styles.sectionTitle, isActive && styles.sectionTitleActive]}
                numberOfLines={1}
              >
                {section.title}
              </Text>

              {/* Completion Badge */}
              {showCompletion && (
                <View
                  style={[
                    styles.completionBadge,
                    isComplete && styles.completionBadgeComplete,
                    isActive && styles.completionBadgeActive,
                  ]}
                >
                  {isComplete ? (
                    <FontAwesome5 name="check" size={10} color={colors.bg} />
                  ) : (
                    <Text
                      style={[
                        styles.completionText,
                        isActive && styles.completionTextActive,
                      ]}
                    >
                      {answered}/{total}
                    </Text>
                  )}
                </View>
              )}

              {/* Active Indicator Bar */}
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold,
  },
  scrollContent: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
    gap: spacing[8],
  },
  tab: {
    minWidth: 110,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.bg2,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: colors.bg2,
    borderColor: colors.gold,
    borderWidth: 2,
  },
  sectionNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.textDim,
    marginBottom: spacing[4],
  },
  sectionNumberActive: {
    color: colors.gold,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as any,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  sectionTitleActive: {
    color: colors.text,
  },
  completionBadge: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionBadgeComplete: {
    backgroundColor: colors.success,
  },
  completionBadgeActive: {
    backgroundColor: colors.gold,
  },
  completionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as any,
    color: colors.textDim,
  },
  completionTextActive: {
    color: colors.bg,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.sm,
  },
});

export default SectionTabs;
