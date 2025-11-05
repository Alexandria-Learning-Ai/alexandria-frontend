// components/MainActionsEnhanced.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useExperimentalTheme } from '../../hooks/useExperimentalTheme';
import UnifiedNotificationService from '../../utils/UnifiedNotificationService';
import { auth } from '../../firebaseConfig';
import logger from '../../utils/logger';

export default function MainActionsEnhanced({ navigation, onShowFlashcardDashboard, t }) {
  const { colors, gradients } = useExperimentalTheme();

  const handleInsights = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const status = await UnifiedNotificationService.getNotificationStatus(user.uid);
      if (status?.analysisSnapshot) {
        const a = status.analysisSnapshot;
        let msg = `Progress: ${a.trend || 'Stable'}\nOverall Score: ${a.overallScore || 'N/A'}%\n`;
        if (a.topFocusArea) msg += `Focus: ${a.topFocusArea}\n`;
        if (a.examReadiness?.length > 0)
          msg += `Next Exam: ${a.examReadiness[0].title} (${a.examReadiness[0].readiness}%)`;

        Alert.alert('🧠 Smart Insights', msg, [
          { text: 'View Details', onPress: () => navigation.navigate('ProgressTracker') },
          { text: 'Refresh', onPress: () => UnifiedNotificationService.scheduleIntelligentNotifications(user.uid, 'manual') },
          { text: 'Close' },
        ]);
      } else {
        Alert.alert('✨ Keep Learning!', 'Take more quizzes to unlock personalized insights!');
      }
    } catch (err) {
      logger.error('Error fetching insights:', err);
      Alert.alert('Error', 'Could not load insights.');
    }
  };

  return (
    <Animatable.View animation="fadeInUp" delay={300} style={styles.container}>
      {/* Primary Action */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.gold }]}
        onPress={() => navigation.navigate('Upload')}
        activeOpacity={0.85}
      >
        <Text style={[styles.primaryText, { color: colors.bg }]}>Take New Quiz</Text>
        <Text style={[styles.subtitle, { color: colors.textDim }]}>
          Upload study material and start learning
        </Text>
      </TouchableOpacity>

      {/* Ask Alexandria */}
      <TouchableOpacity
        style={[styles.askButton, { borderColor: colors.gold }]}
        onPress={() => navigation.navigate('AskAlexandria')}
      >
        <FontAwesome5 name="comments" size={16} color={colors.gold} />
        <Text style={[styles.askText, { color: colors.gold }]}>Ask Alexandria for a Quiz</Text>
        <FontAwesome5 name="arrow-right" size={14} color={colors.gold} />
      </TouchableOpacity>

      {/* Secondary Row */}
      <View style={styles.row}>
        <Animatable.View animation="fadeInUp" delay={400}>
          <LinearGradient colors={gradients.card as [string, string]} style={styles.card}>
            <FontAwesome5 name="history" size={22} color={colors.text} />
            <Text style={styles.cardTitle}>Quiz History</Text>
            <Text style={styles.cardSub}>Review past quizzes</Text>
          </LinearGradient>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={550}>
          <LinearGradient colors={gradients.card as [string, string]} style={styles.card}>
            <FontAwesome5 name="book-open" size={22} color={colors.text} />
            <Text style={styles.cardTitle}>Study Materials</Text>
            <Text style={styles.cardSub}>Browse extracted content</Text>
          </LinearGradient>
        </Animatable.View>
      </View>

      {/* Final Row (Insights, Cards, Exams) */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.miniCard} onPress={handleInsights}>
          <FontAwesome5 name="brain" size={18} color={colors.gold} />
          <Text style={styles.miniText}>Smart Insights</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.miniCard} onPress={onShowFlashcardDashboard}>
          <FontAwesome5 name="layer-group" size={18} color={colors.gold} />
          <Text style={styles.miniText}>Study Cards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.miniCard}
          onPress={() => navigation.navigate('ExamListScreen')}
        >
          <FontAwesome5 name="list" size={18} color={colors.gold} />
          <Text style={styles.miniText}>View Exams</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  primaryButton: {
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#FFD15C',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 10,
    marginBottom: 24,
    gap: 8,
  },
  askText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  card: {
    width: 160,
    height: 120,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#FFF',
    marginTop: 8,
  },
  cardSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  miniCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(17,26,43,0.8)',
  },
  miniText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD15C',
    marginTop: 6,
  },
});
