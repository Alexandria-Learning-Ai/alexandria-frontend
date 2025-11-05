/**
 * ConfirmDialog - Reusable confirmation dialog component
 *
 * Features:
 * - Centered modal overlay
 * - Title and message display
 * - Confirm and cancel buttons
 * - Theme-consistent styling
 * - Touch-outside to dismiss
 * - Animated appearance
 *
 * @param visible - Whether dialog is visible
 * @param title - Dialog title
 * @param message - Dialog message
 * @param confirmText - Confirm button text (default: "Confirm")
 * @param cancelText - Cancel button text (default: "Cancel")
 * @param onConfirm - Callback when confirm is pressed
 * @param onCancel - Callback when cancel is pressed
 * @param confirmDestructive - Whether confirm button is destructive (default: false)
 */

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDestructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmDestructive = false,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      primary: Colors.primary,
      destructive: '#dc3545',
      overlay: 'rgba(0, 0, 0, 0.5)',
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
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={[styles.overlay, { backgroundColor: themeColors.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.title, { color: themeColors.text }]}>
                {title}
              </Text>

              <Text style={[styles.message, { color: themeColors.textSecondary }]}>
                {message}
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, { color: themeColors.textSecondary }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    {
                      backgroundColor: confirmDestructive
                        ? themeColors.destructive
                        : themeColors.primary,
                    },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
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
    paddingHorizontal: 32,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
});

export default ConfirmDialog;
