/**
 * FlashcardDashboardScreen - Screen wrapper for FlashcardDashboard
 *
 * This screen wraps the FlashcardDashboard component so it can be
 * accessed via navigation from tabs and other screens.
 */

import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import FlashcardDashboard from '../components/FlashcardDashboard';
import { RootStackParamList } from '../types';

type FlashcardDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'FlashcardDashboardScreen'>;

const FlashcardDashboardScreen: React.FC<FlashcardDashboardScreenProps> = ({ navigation }) => {
  return (
    <FlashcardDashboard
      navigation={navigation}
      isDarkMode={true}
      onClose={() => navigation.goBack()}
    />
  );
};

export default FlashcardDashboardScreen;
