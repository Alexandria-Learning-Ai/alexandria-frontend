/**
 * EndOfChapterModal - Modal displayed when chapter is completed
 *
 * Improvements:
 * - Cleaned Touchable layering (outer only captures background taps)
 * - Added haptic feedback on open
 * - Added accessibility labels
 * - Keeps modal mounted during fade-out for smoother closing
 * - Small layout and performance polish
 */

import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';

interface EndOfChapterModalProps {
  visible: boolean;
  chapterTitle: string;
  hasNextChapter: boolean;
  onNextChapter: () => void;
  onReturnToBook: () => void;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const EndOfChapterModal: React.FC<EndOfChapterModalProps> = ({
  visible,
  chapterTitle,
  hasNextChapter,
  onNextChapter,
  onReturnToBook,
  onClose,
}) => {
  const [mounted, setMounted] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      accent: Colors.accent,
      success: Colors.success,
      border: Colors.border,
    }),
    []
  );

  // Handle mount + animation
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.modalContainer,
              { backgroundColor: themeColors.background, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close modal"
            >
              <FontAwesome5 name="times" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>

            {/* Success icon */}
            <View
              style={[styles.iconContainer, { backgroundColor: `${themeColors.success}20` }]}
              accessibilityLabel="Chapter complete"
            >
              <FontAwesome5 name="check-circle" size={64} color={themeColors.success} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: themeColors.text }]}>Chapter Complete!</Text>

            {/* Chapter name */}
            <Text
              style={[styles.subtitle, { color: themeColors.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {chapterTitle}
            </Text>

            {/* Message */}
            <Text style={[styles.message, { color: themeColors.textSecondary }]}>
              Great work! You've finished this chapter.
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {hasNextChapter && (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: themeColors.accent }]}
                  onPress={onNextChapter}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Continue to Next Chapter</Text>
                  <FontAwesome5
                    name="chevron-right"
                    size={16}
                    color={Colors.white}
                    style={styles.buttonIcon}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: themeColors.border }]}
                onPress={onReturnToBook}
                activeOpacity={0.85}
              >
                <FontAwesome5
                  name="book"
                  size={16}
                  color={themeColors.text}
                  style={styles.buttonIcon}
                />
                <Text style={[styles.secondaryButtonText, { color: themeColors.text }]}>
                  Return to Book
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  buttonContainer: { width: '100%', gap: 12 },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 48,
  },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 48,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
  buttonIcon: { marginLeft: 8 },
});

export default EndOfChapterModal;
