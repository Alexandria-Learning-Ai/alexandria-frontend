/**
 * EmptyState - Empty state display for material lists
 *
 * Features:
 * - Icon and message display
 * - Different messages for each tab
 * - Call-to-action button
 * - Alexandria theme styling
 * - Centered layout
 *
 * @param tab - Current material tab
 * @param onUpload - Callback when upload button is pressed
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MaterialKind } from '../../types/materials';

interface EmptyStateProps {
  tab: MaterialKind;
  onUpload?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ tab, onUpload }) => {
  const themeColors = useMemo(
    () => ({
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      accent: Colors.accent,
      primary: Colors.primary,
      background: Colors.gray100,
    }),
    []
  );

  const getEmptyStateContent = (kind: MaterialKind) => {
    switch (kind) {
      case 'book':
        return {
          icon: 'book-open',
          title: 'No books yet',
          message: 'Upload your first book to start learning',
        };
      case 'study_guide':
        return {
          icon: 'file-alt',
          title: 'No study guides yet',
          message: 'Upload study guides to enhance your learning',
        };
      case 'paper':
        return {
          icon: 'file-pdf',
          title: 'No papers yet',
          message: 'Upload research papers to study',
        };
      default:
        return {
          icon: 'folder-open',
          title: 'No materials yet',
          message: 'Upload your first material to get started',
        };
    }
  };

  const content = getEmptyStateContent(tab);

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name={content.icon} size={64} color={themeColors.textSecondary} />
      </View>

      <Text style={[styles.title, { color: themeColors.text }]}>{content.title}</Text>

      <Text style={[styles.message, { color: themeColors.textSecondary }]}>
        {content.message}
      </Text>

      {onUpload && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.primary }]}
          onPress={onUpload}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="plus" size={16} color={Colors.textLight} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: Colors.textLight }]}>Upload Material</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmptyState;
