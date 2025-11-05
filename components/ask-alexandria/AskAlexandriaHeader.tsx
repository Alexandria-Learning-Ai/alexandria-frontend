import React from 'react';
import { View, Text, Animated } from 'react-native';
import SafeBackButton from '../SafeBackButton';

interface AskAlexandriaHeaderProps {
  navigation: any;
  containerAnim: Animated.Value;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * AskAlexandriaHeader - Header section for Ask Alexandria screen
 *
 * Features:
 * - Animated back button with smooth exit
 * - Title and subtitle with translations
 * - Consistent styling with app theme
 */
const AskAlexandriaHeader: React.FC<AskAlexandriaHeaderProps> = ({
  navigation,
  containerAnim,
  styles,
  t
}) => {
  const handleBackPress = () => {
    Animated.timing(containerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      const NavigationHelper = require('../../utils/NavigationHelper').default;
      NavigationHelper.safeGoBack(navigation);
    });
  };

  return (
    <>
      {/* Back Button with smooth exit animation */}
      <SafeBackButton
        style={styles.backButton}
        color="#F8F4E3"
        size={20}
        onPress={handleBackPress}
      />

      <View style={styles.header}>
        <Text style={styles.title}>{t('askAlexandria.title')}</Text>
        <Text style={styles.subtitle}>{t('askAlexandria.subtitle')}</Text>
      </View>
    </>
  );
};

export default AskAlexandriaHeader;
