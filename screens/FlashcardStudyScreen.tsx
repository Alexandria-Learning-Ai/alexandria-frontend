import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  ViewStyle,
  TextStyle
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Animatable from 'react-native-animatable';
import FlashcardCard from '../components/flashcards/FlashcardCard';
import FlashcardService from '../services/FlashcardService';
import { Flashcard, RootStackParamList } from '../types';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';


type FlashcardStudyScreenProps = NativeStackScreenProps<RootStackParamList, 'FlashcardStudy'>;

/**
 * FlashcardStudyScreen - Main screen for studying flashcards with spaced repetition
 */
const FlashcardStudyScreen: React.FC<FlashcardStudyScreenProps> = ({ navigation, route }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    cardsStudied: 0,
    startTime: new Date(),
  });
  const [isDarkMode] = useState(false); // TODO: Connect to theme context

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        logger.error('No user authenticated');
        return;
      }

      // Get due flashcards for review
      const dueCards = await FlashcardService.getDueFlashcards(userId);

      if (dueCards.length === 0) {
        // No due cards, get all flashcards
        const allCards = await FlashcardService.getFlashcards(userId);
        setFlashcards(allCards);
      } else {
        setFlashcards(dueCards);
      }
    } catch (error) {
      logger.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQualitySelect = async (quality: number) => {
    const userId = auth.currentUser?.uid;
    if (!userId || !flashcards[currentIndex]) return;

    try {
      // Record the review
      await FlashcardService.updateFlashcardReview(
        userId,
        flashcards[currentIndex].id,
        quality
      );

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        cardsStudied: prev.cardsStudied + 1
      }));

      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Session complete
        handleSessionComplete();
      }
    } catch (error) {
      logger.error('Error recording flashcard review:', error);
    }
  };

  const handleSessionComplete = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - sessionStats.startTime.getTime()) / 1000);

      await FlashcardService.recordStudySession(userId, {
        cardsStudied: sessionStats.cardsStudied,
        timeSpent: duration,
        startTime: sessionStats.startTime,
        endTime,
        flashcardsReviewed: sessionStats.cardsStudied,
        averageQuality: 0, // TODO: Track average quality during session
        duration
      });

      navigation.navigate('FlashcardComplete', {
        cardsStudied: sessionStats.cardsStudied,
        duration
      });
    } catch (error) {
      logger.error('Error completing session:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1A2C5B" />
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Animatable.View animation="fadeIn" style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>No Flashcards Yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete some quizzes to generate flashcards from your mistakes
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => navigation.navigate('QuizSelect')}
          >
            <Text style={styles.emptyButtonText}>Start a Quiz</Text>
          </Pressable>
        </Animatable.View>
      </View>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {flashcards.length}
          </Text>
        </View>
      </View>

      {/* Flashcard */}
      <FlashcardCard
        flashcard={currentCard}
        onQualitySelect={handleQualitySelect}
        isDarkMode={isDarkMode}
      />

      {/* Session Stats */}
      <View style={styles.statsContainer}>
        <StatItem label="Cards Studied" value={sessionStats.cardsStudied.toString()} />
        <StatItem label="Remaining" value={(flashcards.length - currentIndex - 1).toString()} />
      </View>

      {/* Skip Button */}
      {currentIndex < flashcards.length - 1 && (
        <Pressable
          style={styles.skipButton}
          onPress={() => setCurrentIndex(currentIndex + 1)}
        >
          <Text style={styles.skipButtonText}>Skip Card</Text>
        </Pressable>
      )}
    </ScrollView>
  );
};

interface StatItemProps {
  label: string;
  value: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface Styles {
  container: ViewStyle;
  centerContent: ViewStyle;
  scrollContent: ViewStyle;
  loadingText: TextStyle;
  header: ViewStyle;
  progressContainer: ViewStyle;
  progressBackground: ViewStyle;
  progressFill: ViewStyle;
  progressText: TextStyle;
  emptyState: ViewStyle;
  emptyIcon: TextStyle;
  emptyTitle: TextStyle;
  emptySubtitle: TextStyle;
  emptyButton: ViewStyle;
  emptyButtonText: TextStyle;
  statsContainer: ViewStyle;
  statItem: ViewStyle;
  statValue: TextStyle;
  statLabel: TextStyle;
  skipButton: ViewStyle;
  skipButtonText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  progressContainer: {
    gap: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1A2C5B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2C5B',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#1A2C5B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A2C5B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  skipButton: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A2C5B',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#1A2C5B',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FlashcardStudyScreen;
