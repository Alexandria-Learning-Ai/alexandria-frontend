import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const themeColors = {
  alexandriaBlack: '#1A2C5B',
  alexandriaGold: '#D4AF37',
  secondaryText: '#CBD5E0',
};

export const UploadErrorFallback: React.FC = () => {
  const navigation = useNavigation();

  const handleGoHome = () => {
    navigation.navigate('Home' as never);
  };

  const handleRetry = () => {
    // Reset navigation stack and return to upload screen fresh
    navigation.reset({
      index: 0,
      routes: [{ name: 'Upload' as never }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📤</Text>
      <Text style={styles.title}>Upload Error</Text>
      <Text style={styles.message}>
        We encountered an error while processing your upload.{'\n'}
        Your files are safe - please try again.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRetry}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleGoHome}
        >
          <Text style={styles.secondaryButtonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: themeColors.alexandriaBlack,
  },
  message: {
    fontSize: 16,
    color: themeColors.secondaryText,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: themeColors.alexandriaGold,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: themeColors.alexandriaGold,
  },
  secondaryButtonText: {
    color: themeColors.alexandriaGold,
    fontSize: 16,
    fontWeight: '600',
  },
});
