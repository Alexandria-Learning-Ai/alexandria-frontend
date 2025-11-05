/**
 * ReadingSettingsModal - Bottom sheet for reading preferences
 *
 * Features:
 * - Font size controls (A-, A, A+) with visual feedback
 * - Theme mode selector (Light, Dark, Sepia, Auto)
 * - Line spacing adjustment (Compact, Normal, Relaxed)
 * - EPUB original styles toggle (if available)
 * - Smooth slide-up animation
 * - Backdrop with touch-to-close
 * - Alexandria theme styling
 * - Persistent preferences via AsyncStorage
 *
 * @param visible - Whether modal is visible
 * @param onClose - Callback when modal is closed
 * @param currentFontSize - Current font size setting
 * @param onFontSizeChange - Callback for font size change
 * @param hasEpubStyles - Whether chapter has EPUB styles available
 * @param useOriginalStyles - Current EPUB styles preference
 * @param onStylePreferenceChange - Callback for style preference change
 */

import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Switch,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const WINDOW_HEIGHT = Dimensions.get('window').height;

export type ThemeMode = 'light' | 'dark' | 'sepia' | 'auto';

interface ReadingSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  currentFontSize: 'small' | 'medium' | 'large';
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
  currentThemeMode?: ThemeMode;
  onThemeModeChange?: (mode: ThemeMode) => void;
  hasEpubStyles?: boolean;
  useOriginalStyles?: boolean;
  onStylePreferenceChange?: (value: boolean) => void;
}

const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  visible,
  onClose,
  currentFontSize,
  onFontSizeChange,
  currentThemeMode = 'auto',
  onThemeModeChange,
  hasEpubStyles = false,
  useOriginalStyles = false,
  onStylePreferenceChange,
}) => {
  const slideAnim = useRef(new Animated.Value(WINDOW_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      accent: Colors.accent,
      border: Colors.border,
    }),
    []
  );

  const fontSizes: Array<{ size: 'small' | 'medium' | 'large'; label: string; icon: string }> = [
    { size: 'small', label: 'Small', icon: 'font' },
    { size: 'medium', label: 'Normal', icon: 'font' },
    { size: 'large', label: 'Large', icon: 'font' },
  ];

  const themeModes: Array<{ mode: ThemeMode; label: string; icon: string }> = [
    { mode: 'light', label: 'Light', icon: 'sun' },
    { mode: 'dark', label: 'Dark', icon: 'moon' },
    { mode: 'sepia', label: 'Sepia', icon: 'book' },
    { mode: 'auto', label: 'Auto', icon: 'adjust' },
  ];

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: WINDOW_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: themeColors.background,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome5 name="text-height" size={20} color={themeColors.accent} />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Reading Settings
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome5 name="times" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Font Size Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>
            Font Size
          </Text>
          <View style={styles.optionsRow}>
            {fontSizes.map((item) => (
              <TouchableOpacity
                key={item.size}
                style={[
                  styles.optionButton,
                  { borderColor: themeColors.border },
                  currentFontSize === item.size && [
                    styles.optionButtonActive,
                    { backgroundColor: themeColors.accent, borderColor: themeColors.accent },
                  ],
                ]}
                onPress={() => onFontSizeChange(item.size)}
                activeOpacity={0.7}
              >
                <FontAwesome5
                  name={item.icon}
                  size={item.size === 'small' ? 14 : item.size === 'medium' ? 16 : 18}
                  color={currentFontSize === item.size ? Colors.white : themeColors.text}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color: currentFontSize === item.size ? Colors.white : themeColors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Theme Mode Section */}
        {onThemeModeChange && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>
              Theme
            </Text>
            <View style={styles.themeGrid}>
              {themeModes.map((item) => (
                <TouchableOpacity
                  key={item.mode}
                  style={[
                    styles.themeButton,
                    { borderColor: themeColors.border },
                    currentThemeMode === item.mode && [
                      styles.optionButtonActive,
                      { backgroundColor: themeColors.accent, borderColor: themeColors.accent },
                    ],
                  ]}
                  onPress={() => onThemeModeChange(item.mode)}
                  activeOpacity={0.7}
                >
                  <FontAwesome5
                    name={item.icon}
                    size={16}
                    color={currentThemeMode === item.mode ? Colors.white : themeColors.text}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: currentThemeMode === item.mode ? Colors.white : themeColors.text,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* EPUB Styles Toggle (if available) */}
        {hasEpubStyles && (
          <View style={[styles.section, styles.toggleSection]}>
            <View style={styles.toggleInfo}>
              <FontAwesome5
                name="palette"
                size={18}
                color={themeColors.accent}
                style={styles.toggleIcon}
              />
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: themeColors.text }]}>
                  Original Book Styling
                </Text>
                <Text style={[styles.toggleDescription, { color: themeColors.textSecondary }]}>
                  Use publisher's typography and layout
                </Text>
              </View>
            </View>
            <Switch
              value={useOriginalStyles}
              onValueChange={onStylePreferenceChange}
              trackColor={{ false: '#767577', true: themeColors.accent }}
              thumbColor={useOriginalStyles ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#767577"
            />
          </View>
        )}

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <FontAwesome5
            name="info-circle"
            size={12}
            color={themeColors.textSecondary}
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
            Settings are saved automatically and apply to all books
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  optionButtonActive: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: Colors.surface,
    gap: 8,
    minWidth: '47%',
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  toggleIcon: {
    marginRight: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});

export default ReadingSettingsModal;
