import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

// Type definitions
interface Quote {
  text: string;
  author: string;
}

interface ThemeStyles {
  quoteContainer: ViewStyle;
  quoteIcon: { color: string };
  quoteText: TextStyle;
  quoteAuthor: TextStyle;
}

interface MotivationalQuoteProps {
  quote: Quote | null;
  themeStyles: ThemeStyles;
}

interface Styles {
  quoteContainer: ViewStyle;
  quoteText: TextStyle;
  quoteAuthor: TextStyle;
}

/**
 * MotivationalQuote - Displays daily inspirational academic quotes
 *
 * Features:
 * - Animated entrance with fade-in effect
 * - Theme-aware styling
 * - Null-safe rendering
 * - Academic quote with author attribution
 */
const MotivationalQuote: React.FC<MotivationalQuoteProps> = ({ quote, themeStyles }) => {
  if (!quote) return null;

  return (
    <Animatable.View
      animation="fadeIn"
      delay={1500}
      style={[styles.quoteContainer, themeStyles.quoteContainer]}
    >
      <FontAwesome5
        name="quote-left"
        size={16}
        color={themeStyles.quoteIcon.color}
      />
      <Text style={[styles.quoteText, themeStyles.quoteText]}>
        "{quote.text}"
      </Text>
      <Text style={[styles.quoteAuthor, themeStyles.quoteAuthor]}>
        - {quote.author}
      </Text>
    </Animatable.View>
  );
};

const styles = StyleSheet.create<Styles>({
  quoteContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default MotivationalQuote;
