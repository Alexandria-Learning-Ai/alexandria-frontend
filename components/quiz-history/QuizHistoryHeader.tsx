import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import SafeBackButton from '../SafeBackButton';

interface QuizHistoryHeaderProps {
  historyCount: number;
  currentThemeStyles: any;
  containerAnim: Animated.Value;
  onBack: () => void;
  onClearAll: () => void;
}

const QuizHistoryHeader: React.FC<QuizHistoryHeaderProps> = ({
  historyCount,
  currentThemeStyles,
  containerAnim,
  onBack,
  onClearAll,
}) => {
  return (
    <Animatable.View animation="fadeInDown" duration={800} style={styles.headerContainer}>
      {/* Back Button */}
      <SafeBackButton
        style={[styles.backButton, currentThemeStyles.backButton]}
        color={currentThemeStyles.backButtonText.color}
        size={20}
        onPress={() => {
          Animated.timing(containerAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onBack();
          });
        }}
      />

      {/* Title Section */}
      <Animatable.View animation="fadeIn" delay={300} style={styles.titleSection}>
        <View style={[styles.titleIcon, currentThemeStyles.titleIcon]}>
          <FontAwesome5 name="history" size={32} color={currentThemeStyles.titleIconColor.color} />
        </View>
        <Text style={[styles.title, currentThemeStyles.title]}>Quiz History</Text>
        <Text style={[styles.subtitle, currentThemeStyles.subtitle]}>
          Review your past quiz attempts
        </Text>
      </Animatable.View>

      {/* Actions Row */}
      {historyCount > 0 && (
        <Animatable.View animation="slideInUp" delay={600} style={styles.actionsRow}>
          <Text style={[styles.historyCount, currentThemeStyles.historyCount]}>
            {historyCount} quiz{historyCount !== 1 ? 'es' : ''} saved
          </Text>
          <TouchableOpacity
            style={[styles.clearButton, currentThemeStyles.clearButton]}
            onPress={onClearAll}
          >
            <FontAwesome5 name="trash" size={14} color={currentThemeStyles.clearButtonText.color} />
            <Text style={[styles.clearButtonText, currentThemeStyles.clearButtonText]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      )}
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  historyCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Memoized export
export default React.memo(QuizHistoryHeader);
