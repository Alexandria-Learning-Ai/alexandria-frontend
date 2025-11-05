import React from 'react';
import { Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface AskAlexandriaFreshnessIndicatorProps {
  isVisible: boolean;
  styles: any;
}

/**
 * AskAlexandriaFreshnessIndicator - Success notification for fresh questions
 *
 * Features:
 * - Slides down from top when visible
 * - Brain icon with success message
 * - Auto-hides when not visible
 * - Animated entrance
 */
const AskAlexandriaFreshnessIndicator: React.FC<AskAlexandriaFreshnessIndicatorProps> = ({
  isVisible,
  styles
}) => {
  if (!isVisible) return null;

  return (
    <Animatable.View
      animation="slideInDown"
      duration={500}
      style={[styles.freshnessIndicator]}
    >
      <FontAwesome5 name="brain" size={16} color="#D4AF37" />
      <Text style={styles.freshnessText}>
        ✨ Fresh questions generated!
      </Text>
    </Animatable.View>
  );
};

export default AskAlexandriaFreshnessIndicator;
