/**
 * QuizExitConfirmModal - Alexandria-themed exit confirmation modal for quizzes
 *
 * Features:
 * - Three-button interface (Save & Exit, Exit Without Saving, Cancel)
 * - Alexandria theme styling (scholarly, elegant)
 * - Loading state during save operation
 * - Animated appearance
 * - Touch-outside to dismiss (closes modal, same as Cancel)
 * - Fully typed with TypeScript
 *
 * @param visible - Whether modal is visible
 * @param onSaveAndExit - Callback when "Save & Exit" is pressed
 * @param onExitWithoutSaving - Callback when "Exit Without Saving" is pressed
 * @param onCancel - Callback when "Cancel" is pressed or backdrop touched
 * @param isSaving - Whether save operation is in progress
 */

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface QuizExitConfirmModalProps {
  visible: boolean;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const QuizExitConfirmModal: React.FC<QuizExitConfirmModalProps> = ({
  visible,
  onSaveAndExit,
  onExitWithoutSaving,
  onCancel,
  isSaving = false,
}) => {
  const themeColors = useMemo(
    () => ({
      background: '#1A2C5B',           // Alexandria Navy
      backgroundSecondary: '#2C467D',  // Lighter navy
      alexandriaGold: '#D4AF37',       // Gold accents
      alexandriaBronze: '#B8941F',     // Darker gold
      text: '#F8F4E3',                 // Parchment white
      textSecondary: '#CBD5E0',        // Light gray
      destructive: '#dc3545',          // Red for destructive action
      overlay: 'rgba(26, 44, 91, 0.85)', // Navy overlay
    }),
    []
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={isSaving ? undefined : onCancel}>
        <View style={[styles.overlay, { backgroundColor: themeColors.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { backgroundColor: themeColors.background }]}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <FontAwesome5
                  name="door-open"
                  size={40}
                  color={themeColors.alexandriaGold}
                />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: themeColors.text }]}>
                Abandon Your Quest?
              </Text>

              {/* Message */}
              <Text style={[styles.message, { color: themeColors.textSecondary }]}>
                You can save your current progress and continue this trial later, or exit without saving.
              </Text>

              {/* Button Container */}
              <View style={styles.buttonContainer}>
                {/* Save & Exit Button (Primary action) */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    { backgroundColor: themeColors.alexandriaGold },
                    isSaving && styles.buttonDisabled,
                  ]}
                  onPress={onSaveAndExit}
                  activeOpacity={0.8}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={themeColors.background} />
                  ) : (
                    <>
                      <FontAwesome5
                        name="save"
                        size={16}
                        color={themeColors.background}
                        style={styles.buttonIcon}
                      />
                      <Text style={[styles.buttonText, { color: themeColors.background }]}>
                        Save & Exit
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Exit Without Saving Button (Destructive action) */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    { borderColor: themeColors.destructive },
                    isSaving && styles.buttonDisabled,
                  ]}
                  onPress={onExitWithoutSaving}
                  activeOpacity={0.8}
                  disabled={isSaving}
                >
                  <FontAwesome5
                    name="times-circle"
                    size={16}
                    color={themeColors.destructive}
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.buttonText, { color: themeColors.destructive }]}>
                    Exit Without Saving
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button (Safe action) */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    { borderColor: themeColors.textSecondary },
                    isSaving && styles.buttonDisabled,
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.8}
                  disabled={isSaving}
                >
                  <Text style={[styles.buttonText, { color: themeColors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Saving indicator text */}
              {isSaving && (
                <Text style={[styles.savingText, { color: themeColors.alexandriaGold }]}>
                  Preserving your wisdom...
                </Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48, // Accessibility: minimum touch target
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  savingText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default QuizExitConfirmModal;
