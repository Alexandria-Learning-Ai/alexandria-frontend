import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface QuestionsSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * QuestionsSlider - Number of questions slider input
 *
 * Features:
 * - Slider component for question count
 * - Displays current value in label
 * - Min and max labels on ends
 * - Helper text with recommendation
 * - Gold accent color
 */
const QuestionsSlider: React.FC<QuestionsSliderProps> = ({
  value,
  onChange,
  min = 5,
  max = 20,
  styles,
  t
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        <FontAwesome5 name="list-ol" size={14} color="#D4AF37" /> {t('askAlexandria.numberOfQuestions')} {value}
      </Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>{min}</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={1}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor="#D4AF37"
          maximumTrackTintColor="rgba(248, 244, 227, 0.3)"
          thumbTintColor="#D4AF37"
        />
        <Text style={styles.sliderLabel}>{max}</Text>
      </View>
      <Text style={styles.sliderHelper}>
        {t('askAlexandria.recommended')}
      </Text>
    </View>
  );
};

export default QuestionsSlider;
