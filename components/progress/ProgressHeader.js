import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const ProgressHeader = ({
  currentTheme,
  getThemeProperty,
  dataSource,
  backendError
}) => {
  return (
    <Animatable.View animation="fadeIn" delay={300} style={styles.titleSection}>
      <View style={[styles.titleIcon, currentTheme.titleIcon]}>
        <FontAwesome5
          name="chart-line"
          size={32}
          color={getThemeProperty(currentTheme, 'titleIconColor', '#1A2C5B')}
        />
      </View>
      <Text style={[styles.title, currentTheme.title]}>Progress Tracker</Text>
      <Text style={[styles.subtitle, currentTheme.subtitle]}>
        Track your learning journey and improvements
      </Text>

      {/* Data source indicator */}
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
  );
};

const styles = StyleSheet.create({
  titleSection: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  titleIcon: {
    backgroundColor: '#F0F4F8',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A2C5B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
  },
  dataSourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataSourceText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    color: '#4A5568',
  },
});

export default ProgressHeader;