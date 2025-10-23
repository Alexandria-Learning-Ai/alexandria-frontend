import React from 'react';
import { View, Text, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import SafeBackButton from '../SafeBackButton';
import { getThemeProperty } from '../../utils/progressHelpers';
import { HEADER_SIZES } from '../../constants/layout';

interface HeaderProps {
  navigation: NavigationProp<any>;
  containerAnim: Animated.Value;
  dataSource: 'backend' | 'local' | 'loading';
  backendError: string | null;
  styles: any;
  currentTheme: any;
}

/**
 * Header - Progress Tracker screen header
 *
 * Features:
 * - Title and subtitle
 * - Animated back button
 * - Data source indicator (Cloud/Local)
 * - Error indicator for backend issues
 */
const Header: React.FC<HeaderProps> = ({
  navigation,
  containerAnim,
  dataSource,
  backendError,
  styles,
  currentTheme
}) => {
  return (
    <Animatable.View animation="fadeInDown" duration={800} style={styles.headerContainer}>
      <SafeBackButton
        style={[styles.backButton, currentTheme.backButton]}
        color={getThemeProperty(currentTheme, 'backButtonText', '#1A2C5B')}
        size={20}
        onPress={() => {
          Animated.timing(containerAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            const NavigationHelper = require('../../utils/NavigationHelper').default;
            NavigationHelper.safeGoBack(navigation);
          });
        }}
      />

      <Animatable.View animation="fadeIn" delay={300} style={styles.titleSection}>
        <View style={[styles.titleIcon, currentTheme.titleIcon]}>
          <FontAwesome5
            name="chart-line"
            size={HEADER_SIZES.icon.large}
            color={getThemeProperty(currentTheme, 'titleIconColor', '#1A2C5B')}
          />
        </View>
        <Text style={[styles.title, currentTheme.title]}>Progress Tracker</Text>
        <Text style={[styles.subtitle, currentTheme.subtitle]}>
          Track your learning journey and improvements
        </Text>

        {dataSource !== 'loading' && (
          <View style={styles.dataSourceIndicator}>
            <FontAwesome5
              name={dataSource === 'backend' ? 'cloud' : 'mobile-alt'}
              size={12}
              color={dataSource === 'backend' ? '#4CAF50' : '#FF9800'}
            />
            <Text style={[styles.dataSourceText, currentTheme.dataSourceText]}>
              {dataSource === 'backend' ? 'Cloud Synced' : 'Local Data'}
            </Text>
            {backendError && (
              <FontAwesome5
                name="exclamation-triangle"
                size={10}
                color="#FF9800"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        )}
      </Animatable.View>
    </Animatable.View>
  );
};

// Memoized export - static header component
export default React.memo(Header);
