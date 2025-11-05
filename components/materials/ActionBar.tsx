/**
 * ActionBar - Sticky bottom bar for chapter navigation and controls
 *
 * Features:
 * - Previous chapter button (disabled if first chapter)
 * - Next chapter button (disabled if last chapter)
 * - Font size controls (A-, A, A+)
 * - Sticky positioning at bottom
 * - Disabled state styling
 * - Alexandria theme colors
 * - Touch feedback
 * - Shadow and elevation
 *
 * @param onPrevChapter - Callback for previous chapter button
 * @param onNextChapter - Callback for next chapter button
 * @param onFontSizeChange - Callback for font size change
 * @param currentFontSize - Current font size setting
 * @param hasPrevChapter - Whether previous chapter exists
 * @param hasNextChapter - Whether next chapter exists
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface ActionBarProps {
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
  currentFontSize: 'small' | 'medium' | 'large';
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onPrevChapter,
  onNextChapter,
  onFontSizeChange,
  currentFontSize,
  hasPrevChapter,
  hasNextChapter,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accent,
      accentLight: Colors.accentLight,
      border: Colors.border,
    }),
    []
  );

  const fontSizes: Array<{ size: 'small' | 'medium' | 'large'; label: string }> = [
    { size: 'small', label: 'A-' },
    { size: 'medium', label: 'A' },
    { size: 'large', label: 'A+' },
  ];

  return (
    <View style={[styles.actionBar, { backgroundColor: themeColors.background }]}>
      {/* Previous Chapter Button */}
      <TouchableOpacity
        style={[
          styles.navButton,
          !hasPrevChapter && styles.navButtonDisabled,
        ]}
        onPress={onPrevChapter}
        disabled={!hasPrevChapter}
        activeOpacity={0.7}
      >
        <FontAwesome5
          name="chevron-left"
          size={18}
          color={hasPrevChapter ? themeColors.text : themeColors.textMuted}
        />
        <Text
          style={[
            styles.navButtonText,
            { color: hasPrevChapter ? themeColors.text : themeColors.textMuted },
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      {/* Font Size Controls */}
      <View style={styles.fontSizeContainer}>
        {fontSizes.map((item) => (
          <TouchableOpacity
            key={item.size}
            style={[
              styles.fontSizeButton,
              currentFontSize === item.size && [
                styles.fontSizeButtonActive,
                { backgroundColor: themeColors.accent },
              ],
            ]}
            onPress={() => onFontSizeChange(item.size)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.fontSizeButtonText,
                {
                  color:
                    currentFontSize === item.size
                      ? Colors.white
                      : themeColors.text,
                },
                item.size === 'small' && { fontSize: 12 },
                item.size === 'medium' && { fontSize: 14 },
                item.size === 'large' && { fontSize: 16 },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Chapter Button */}
      <TouchableOpacity
        style={[
          styles.navButton,
          !hasNextChapter && styles.navButtonDisabled,
        ]}
        onPress={onNextChapter}
        disabled={!hasNextChapter}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.navButtonText,
            { color: hasNextChapter ? themeColors.text : themeColors.textMuted },
          ]}
        >
          Next
        </Text>
        <FontAwesome5
          name="chevron-right"
          size={18}
          color={hasNextChapter ? themeColors.text : themeColors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  fontSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontSizeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  fontSizeButtonActive: {
    borderColor: 'transparent',
  },
  fontSizeButtonText: {
    fontWeight: '700',
  },
});

export default ActionBar;
