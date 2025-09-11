import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('language')}:</Text>
      <TouchableOpacity
        style={[styles.button, i18n.language === 'en' && styles.active]}
        onPress={() => changeLanguage('en')}
      >
        <Text style={styles.text}>English</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, i18n.language === 'es' && styles.active]}
        onPress={() => changeLanguage('es')}
      >
        <Text style={styles.text}>Español</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  active: {
    backgroundColor: '#4285F4',
  },
  text: {
    color: '#000',
  },
});
