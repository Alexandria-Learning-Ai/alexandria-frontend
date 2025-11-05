import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface QuizStartScreenProps {
  themeColors: any;
  isDarkMode: boolean;
  isChallenge: boolean;
  quizTitle: string;
  questionsCount: number;
  questionTypes: string[];
  onStart: () => void;
  onBack: () => void;
  onNavigateHome: () => void;
  getQuestionIcon: (type: string) => string;
  styles: any;
  t: (key: string) => string;
}

/**
 * QuizStartScreen - Pre-quiz start screen with quiz preview
 *
 * Features:
 * - Challenge badge for challenge quizzes
 * - Animated start icon (scroll/university)
 * - Quiz title and question count
 * - Question types preview chips
 * - Start button with animations
 * - Empty state handling
 */
const QuizStartScreen: React.FC<QuizStartScreenProps> = ({
  themeColors,
  isDarkMode,
  isChallenge,
  quizTitle,
  questionsCount,
  questionTypes,
  onStart,
  onBack,
  onNavigateHome,
  getQuestionIcon,
  styles,
  t
}) => {
  return (
    <LinearGradient
      colors={themeColors ? [
        themeColors.background,
        themeColors.surface
      ] : ['#F8F4E3', '#FFFFFF']}
      style={styles.container}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <Animatable.View animation="fadeInUp" duration={1000} style={styles.startContainer}>
        {/* Enhanced back button */}
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: themeColors?.overlay || 'rgba(255, 255, 255, 0.9)',
              shadowColor: themeColors?.shadow || '#1A2C5B',
            }
          ]}
          onPress={onBack}
        >
          <FontAwesome5
            name="arrow-left"
            size={20}
            color={themeColors?.text || '#1A2C5B'}
          />
        </TouchableOpacity>

        {/* Enhanced challenge badge */}
        {isChallenge && (
          <Animatable.View
            animation="bounceIn"
            delay={500}
            style={[
              styles.challengeBadge,
              { backgroundColor: themeColors?.alexandriaGold || '#D4AF37' }
            ]}
          >
            <FontAwesome5
              name="trophy"
              size={16}
              color={themeColors?.alexandriaNavy || '#1A2C5B'}
            />
            <Text style={[
              styles.challengeBadgeText,
              { color: themeColors?.alexandriaNavy || '#1A2C5B' }
            ]}>
              SACRED TRIAL
            </Text>
          </Animatable.View>
        )}

        {/* Enhanced start icon with animation */}
        <Animatable.View
          animation="pulse"
          easing="ease-out"
          iterationCount="infinite"
          duration={2000}
        >
          <LinearGradient
            colors={[
              themeColors?.alexandriaGold || '#D4AF37',
              themeColors?.alexandriaBronze || '#CD7F32'
            ]}
            style={styles.startIcon}
          >
            <FontAwesome5
              name={isChallenge ? 'scroll' : 'university'}
              size={48}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Animatable.View>

        {/* Enhanced titles */}
        <Text style={[
          styles.startTitle,
          { color: themeColors?.text || '#1A2C5B' }
        ]}>
          {isChallenge ? ((t && t('quiz.sacredTrialAwaits')) || 'Sacred Trial Awaits') : ((t && t('quiz.wisdomBeckons')) || 'Wisdom Beckons')}
        </Text>

        {quizTitle && (
          <Text style={[
            styles.quizTitle,
            { color: themeColors?.textSecondary || '#4A5568' }
          ]}>
            {quizTitle}
          </Text>
        )}

        {questionsCount > 0 ? (
          <>
            <Text style={[
              styles.startSubtitle,
              { color: themeColors?.textSecondary || '#4A5568' }
            ]}>
              {questionsCount} trial{questionsCount !== 1 ? 's' : ''} • {
                isChallenge
                  ? 'Prove your mastery'
                  : 'Test your knowledge'
              }
            </Text>

            {/* Enhanced question types preview */}
            <View style={styles.typesPreview}>
              {questionTypes.map((type) => (
                <LinearGradient
                  key={type}
                  colors={[
                    themeColors?.surface || '#FFFFFF',
                    themeColors?.surfaceSecondary || '#F8F9FA'
                  ]}
                  style={[
                    styles.typeChip,
                    { borderColor: themeColors?.border || 'rgba(26, 44, 91, 0.2)' }
                  ]}
                >
                  <FontAwesome5
                    name={getQuestionIcon(type)}
                    size={14}
                    color={themeColors?.alexandriaGold || '#D4AF37'}
                  />
                  <Text style={[
                    styles.typeChipText,
                    { color: themeColors?.text || '#1A2C5B' }
                  ]}>
                    {type.replace(/_/g, ' ')}
                  </Text>
                </LinearGradient>
              ))}
            </View>

            {/* Enhanced start button */}
            <TouchableOpacity
              onPress={onStart}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  themeColors?.alexandriaNavy || '#1A2C5B',
                  themeColors?.surfaceSecondary || '#2C3E50'
                ]}
                style={styles.startButton}
              >
                <FontAwesome5
                  name="play"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.startButtonText}>
                  {isChallenge ? ((t && t('quiz.acceptTrial')) || 'Accept Trial') : ((t && t('quiz.beginJourney')) || 'Begin Journey')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[
              styles.noQuestionsTitle,
              { color: themeColors?.error || '#dc3545' }
            ]}>
              No Scrolls Available
            </Text>
            <Text style={[
              styles.noQuestionsText,
              { color: themeColors?.textSecondary || '#4A5568' }
            ]}>
              {isChallenge
                ? 'This sacred trial is no longer available in our archives.'
                : 'Please return to the library and prepare new scrolls for study'
              }
            </Text>
            <TouchableOpacity
              onPress={onNavigateHome}
              style={[
                styles.backToUploadButton,
                {
                  borderColor: themeColors?.border || 'rgba(26, 44, 91, 0.2)',
                  backgroundColor: themeColors?.surfaceSecondary || '#F8F9FA'
                }
              ]}
            >
              <Text style={[
                styles.backToUploadText,
                { color: themeColors?.text || '#1A2C5B' }
              ]}>
                Return to Library
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Animatable.View>
    </LinearGradient>
  );
};

export default QuizStartScreen;
