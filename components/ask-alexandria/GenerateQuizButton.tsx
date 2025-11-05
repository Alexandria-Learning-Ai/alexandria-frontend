import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

interface GenerateQuizButtonProps {
  onPress: () => void;
  loading: boolean;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * GenerateQuizButton - Main action button for quiz generation
 *
 * Features:
 * - Gold gradient background
 * - Loading state with spinner
 * - Robot icon when not loading
 * - Disabled state during loading
 * - Motivational quote below button
 */
const GenerateQuizButton: React.FC<GenerateQuizButtonProps> = ({
  onPress,
  loading,
  styles,
  t
}) => {
  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#D4AF37", "#B8941F"]} style={styles.buttonGradient}>
          {loading ? (
            <ActivityIndicator size="small" color="#1A2C5B" />
          ) : (
            <>
              <FontAwesome5 name="robot" size={16} color="#1A2C5B" />
              <Text style={styles.buttonText}>{t('askAlexandria.generateQuiz')}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.motivation}>
        {t('askAlexandria.expandQuote')}
      </Text>
    </>
  );
};

export default GenerateQuizButton;
