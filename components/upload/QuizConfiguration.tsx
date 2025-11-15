import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import CustomDropdown from '../shared/CustomDropdown';
import MultiSelectDropdown from '../shared/MultiSelectDropdown';
import { quizTypeOptions, difficultyOptions } from '../../constants/uploadOptions';

interface QuizConfigurationProps {
  quizTypes: string[];
  setQuizTypes: (types: string[]) => void;
  difficulty: string;
  setDifficulty: (diff: string) => void;
  numQuestions: number;
  setNumQuestions: (num: number) => void;
  quizTypeModalVisible: boolean;
  setQuizTypeModalVisible: (visible: boolean) => void;
  difficultyModalVisible: boolean;
  setDifficultyModalVisible: (visible: boolean) => void;
  styles: any;
}

/**
 * QuizConfiguration - Enhanced quiz settings with modern card design
 *
 * Features:
 * - Modern card-based layout with gradient accents
 * - Multi-select quiz type selector with visual chips
 * - Difficulty level selector with color-coded indicators
 * - Enhanced number slider with visual feedback
 * - Smart recommendations based on selections
 * - Smooth entrance animations
 * - Accessibility-compliant with descriptive labels
 * - Icon indicators for each setting type
 *
 * Accessibility:
 * - accessibilityLabel for each input
 * - accessibilityHint for guidance
 * - accessibilityRole for proper component identification
 * - Clear visual hierarchy
 */
const QuizConfiguration: React.FC<QuizConfigurationProps> = ({
  quizTypes,
  setQuizTypes,
  difficulty,
  setDifficulty,
  numQuestions,
  setNumQuestions,
  quizTypeModalVisible,
  setQuizTypeModalVisible,
  difficultyModalVisible,
  setDifficultyModalVisible,
  styles
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const sliderThumbScale = useRef(new Animated.Value(1)).current;

  

  

  // Get difficulty color
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return '#28a745';
      case 'medium':
        return '#FFD700';
      case 'hard':
        return '#dc3545';
      default:
        return '#D4AF37';
    }
  };

  // Get intelligent recommendations
  const getRecommendation = useMemo(() => {
    if (numQuestions <= 8) {
      return 'Quick review session - great for daily practice';
    } else if (numQuestions >= 15) {
      return 'Comprehensive study - excellent for exam preparation';
    } else {
      return 'Balanced session - optimal for learning and retention';
    }
  }, [numQuestions]);

  // Get difficulty icon
  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'easy':
        return 'smile';
      case 'medium':
        return 'meh';
      case 'hard':
        return 'dizzy';
      default:
        return 'signal';
    }
  };

  return (
    <>
    {/* Configuration Card */}
      <View style={enhancedStyles.card}>
        {/* Card Header */}
        <View style={enhancedStyles.cardHeader}>
          <LinearGradient
            colors={['#D4AF37', '#B8941F']}
            style={enhancedStyles.headerIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="sliders-h" size={18} color="#1A2C5B" />
          </LinearGradient>
          <Text style={enhancedStyles.cardTitle}>Quiz Settings</Text>
        </View>

        {/* Quiz Type Multi-Select */}
        <View style={[styles.inputContainer, enhancedStyles.section]}>
          <View style={enhancedStyles.labelRow}>
            <FontAwesome5 name="question-circle" size={14} color="#D4AF37" />
            <Text style={[styles.label, enhancedStyles.label]}>Quiz Types</Text>
          </View>
          <MultiSelectDropdown
            values={quizTypes}
            onSelect={setQuizTypes}
            options={quizTypeOptions}
            placeholder="Select quiz types"
            modalVisible={quizTypeModalVisible}
            setModalVisible={setQuizTypeModalVisible}
            icon="question-circle"
            styles={styles}
            allTypesValue="all"
          />
          <View style={enhancedStyles.helperContainer}>
            <FontAwesome5 name="info-circle" size={11} color="#8A95B5" />
            <Text style={enhancedStyles.helperText}>
              {quizTypes.includes('all')
                ? 'All question types selected for variety'
                : `${quizTypes.length} type${quizTypes.length > 1 ? 's' : ''} selected`}
            </Text>
          </View>
        </View>

        {/* Difficulty Level */}
        <View style={[styles.inputContainer, enhancedStyles.section]}>
          <View style={enhancedStyles.labelRow}>
            <FontAwesome5
              name={getDifficultyIcon(difficulty)}
              size={14}
              color={getDifficultyColor(difficulty)}
            />
            <Text style={[styles.label, enhancedStyles.label]}>Difficulty Level</Text>
          </View>
          <CustomDropdown
            value={difficulty}
            onSelect={setDifficulty}
            options={difficultyOptions}
            placeholder="Select difficulty level"
            modalVisible={difficultyModalVisible}
            setModalVisible={setDifficultyModalVisible}
            icon="signal"
            styles={styles}
          />
          <View style={enhancedStyles.helperContainer}>
            <View
              style={[
                enhancedStyles.difficultyIndicator,
                { backgroundColor: getDifficultyColor(difficulty) + '30' },
              ]}
            >
              <View
                style={[
                  enhancedStyles.difficultyDot,
                  { backgroundColor: getDifficultyColor(difficulty) },
                ]}
              />
              <Text
                style={[
                  enhancedStyles.helperText,
                  { color: getDifficultyColor(difficulty), fontWeight: '600' },
                ]}
              >
                {difficulty === 'easy' && 'Foundational concepts'}
                {difficulty === 'medium' && 'Balanced challenge'}
                {difficulty === 'hard' && 'Advanced mastery'}
              </Text>
            </View>
          </View>
        </View>

        {/* Number of Questions Slider */}
        <View style={[styles.inputContainer, enhancedStyles.section, enhancedStyles.lastSection]}>
          <View style={enhancedStyles.labelRow}>
            <FontAwesome5 name="list-ol" size={14} color="#D4AF37" />
            <View style={enhancedStyles.questionCountHeader}>
              <Text style={[styles.label, enhancedStyles.label]}>Number of Questions</Text>
              <View style={enhancedStyles.questionBadge}>
                <LinearGradient
                  colors={['#D4AF37', '#B8941F']}
                  style={enhancedStyles.questionBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={enhancedStyles.questionBadgeText}>{numQuestions}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Enhanced Slider Container */}
          <View style={enhancedStyles.sliderWrapper}>
            <View style={enhancedStyles.sliderTrack}>
              <View style={enhancedStyles.sliderContainer}>
                <Text style={[styles.sliderLabel, enhancedStyles.sliderLabel]}>5</Text>
                <Slider
                  style={enhancedStyles.slider}
                  minimumValue={5}
                  maximumValue={20}
                  step={1}
                  value={numQuestions}
                  onSlidingComplete={setNumQuestions}
                  minimumTrackTintColor="#D4AF37"
                  maximumTrackTintColor="rgba(248, 244, 227, 0.2)"
                  thumbTintColor="#D4AF37"
                  accessibilityLabel={`Number of questions: ${numQuestions}`}
                  accessibilityRole="adjustable"
                  accessibilityHint="Slide to adjust the number of quiz questions"
                />
                <Text style={[styles.sliderLabel, enhancedStyles.sliderLabel]}>20</Text>
              </View>
            </View>

            {/* Visual milestones */}
            <View style={enhancedStyles.milestonesContainer}>
              <View style={enhancedStyles.milestone}>
                <View
                  style={[
                    enhancedStyles.milestoneDot,
                    numQuestions <= 8 && enhancedStyles.milestoneDotActive,
                  ]}
                />
                <Text style={enhancedStyles.milestoneLabel}>Quick</Text>
              </View>
              <View style={enhancedStyles.milestone}>
                <View
                  style={[
                    enhancedStyles.milestoneDot,
                    numQuestions > 8 && numQuestions < 15 && enhancedStyles.milestoneDotActive,
                  ]}
                />
                <Text style={enhancedStyles.milestoneLabel}>Balanced</Text>
              </View>
              <View style={enhancedStyles.milestone}>
                <View
                  style={[
                    enhancedStyles.milestoneDot,
                    numQuestions >= 15 && enhancedStyles.milestoneDotActive,
                  ]}
                />
                <Text style={enhancedStyles.milestoneLabel}>Deep</Text>
              </View>
            </View>
          </View>

          {/* Smart Recommendation */}
          <View style={enhancedStyles.recommendationContainer}>
            <FontAwesome5 name="lightbulb" size={12} color="#FFD700" />
            <Text style={enhancedStyles.recommendationText}>{getRecommendation}</Text>
          </View>
        </View>
      </View>
    </>
  );
};

const enhancedStyles = StyleSheet.create({
  container: {
    marginBottom: 32, // Increased breathing room
  },
  card: {
    backgroundColor: 'rgba(44, 70, 125, 0.2)', // Lighter, less intrusive
    borderRadius: 16, // Standard radius
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)', // Subtle border
    padding: 16, // Tighter padding
    // Removed all shadows for cleaner look
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)', // More subtle divider
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    // Removed shadow
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8F4E3',
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 20,
  },
  lastSection: {
    marginBottom: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    marginLeft: 8,
    marginBottom: 0,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#8A95B5',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  difficultyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  questionCountHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  questionBadge: {
    marginLeft: 12,
  },
  questionBadgeGradient: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  questionBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2C5B',
  },
  sliderWrapper: {
    marginTop: 8,
  },
  sliderTrack: {
    backgroundColor: 'rgba(26, 44, 91, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  sliderContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },

  slider: {
    width: "85%"
  },

  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E0',
    paddingHorizontal: 8
  },
  milestonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  milestone: {
    alignItems: 'center',
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 4,
  },
  milestoneDotActive: {
    backgroundColor: '#D4AF37',
    // Removed shadow for cleaner look
  },
  milestoneLabel: {
    fontSize: 10,
    color: '#8A95B5',
    fontWeight: '600',
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  recommendationText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
});

export default QuizConfiguration;
