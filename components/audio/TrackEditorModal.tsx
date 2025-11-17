/**
 * TrackEditorModal - Bottom sheet modal for editing track metadata
 *
 * Features:
 * - Edit track title and description
 * - Real-time character counting
 * - Input validation
 * - Keyboard-aware layout
 * - Smooth animations
 * - API integration for saving changes
 *
 * Usage:
 * <TrackEditorModal
 *   visible={isVisible}
 *   track={trackToEdit}
 *   onClose={() => setVisible(false)}
 *   onSave={() => refreshTrackList()}
 * />
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { auth } from '../../firebaseConfig';
import { API_BASE_URL } from '../../config/api';
import axios from 'axios';
import logger from '../../utils/logger';

interface Track {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  audio_url?: string;
}

interface TrackEditorModalProps {
  visible: boolean;
  track: Track | null;
  playlistId?: string;
  onClose: () => void;
  onSave: () => void;
}

const TrackEditorModal: React.FC<TrackEditorModalProps> = ({
  visible,
  track,
  playlistId,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Theme colors
  const themeColors = useMemo(() => ({
    background: '#1A2C5B',
    backgroundSecondary: '#2C467D',
    alexandriaGold: '#D4AF37',
    alexandriaBronze: '#B8941F',
    text: '#F8F4E3',
    textSecondary: '#CBD5E0',
    error: '#dc3545',
    cardBackground: 'rgba(44, 70, 125, 0.95)',
    inputBackground: 'rgba(248, 244, 227, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  }), []);

  // Character limits
  const MAX_TITLE_LENGTH = 200;
  const MAX_DESCRIPTION_LENGTH = 500;

  // Initialize form with track data
  useEffect(() => {
    if (track && visible) {
      setTitle(track.title || '');
      setDescription(track.description || '');
      setHasChanges(false);
    }
  }, [track, visible]);

  // Check for changes
  useEffect(() => {
    if (!track) return;

    const titleChanged = title !== (track.title || '');
    const descriptionChanged = description !== (track.description || '');
    setHasChanges(titleChanged || descriptionChanged);
  }, [title, description, track]);

  // Validate inputs
  const isValid = useMemo(() => {
    return (
      title.trim().length > 0 &&
      title.length <= MAX_TITLE_LENGTH &&
      description.length <= MAX_DESCRIPTION_LENGTH
    );
  }, [title, description]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!track || !isValid) return;

    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to edit tracks.');
        setLoading(false);
        return;
      }

      const updateData = {
        title: title.trim(),
        description: description.trim() || null,
      };

      logger.info(`📝 Updating track: ${track.id}`, updateData);

      await axios.patch(
        `${API_BASE_URL}/api/audio/tracks/${track.id}`,
        updateData,
        {
          params: { user_id: user.uid },
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.uid,
          },
          timeout: 15000,
        }
      );

      logger.info(`✅ Track updated successfully: ${title}`);

      setLoading(false);
      Alert.alert('Success', 'Track updated successfully!');

      // Close modal and trigger refresh
      onClose();
      onSave();
    } catch (error) {
      logger.error('❌ Error updating track:', error);
      setLoading(false);

      let errorMessage = 'Failed to update track. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      Alert.alert('Error', errorMessage);
    }
  }, [track, title, description, isValid, onClose, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: onClose,
          },
        ]
      );
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  if (!visible || !track) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={styles.blurView}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleCancel}
          />
        </BlurView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animatable.View
            animation="slideInUp"
            duration={300}
            style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTextContainer}>
                <FontAwesome5 name="edit" size={20} color={themeColors.alexandriaGold} />
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  Edit Track
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="times" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                    Track Title *
                  </Text>
                  <Text
                    style={[
                      styles.charCounter,
                      {
                        color:
                          title.length > MAX_TITLE_LENGTH
                            ? themeColors.error
                            : themeColors.textSecondary,
                      },
                    ]}
                  >
                    {title.length}/{MAX_TITLE_LENGTH}
                  </Text>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.inputBackground,
                      borderColor: themeColors.borderColor,
                      color: themeColors.text,
                    },
                    title.length > MAX_TITLE_LENGTH && {
                      borderColor: themeColors.error,
                      borderWidth: 2,
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter track title"
                  placeholderTextColor={themeColors.textSecondary}
                  maxLength={MAX_TITLE_LENGTH}
                  autoFocus
                />

                {title.trim().length === 0 && (
                  <Text style={[styles.validationError, { color: themeColors.error }]}>
                    Title cannot be empty
                  </Text>
                )}
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                    Description (optional)
                  </Text>
                  <Text
                    style={[
                      styles.charCounter,
                      {
                        color:
                          description.length > MAX_DESCRIPTION_LENGTH
                            ? themeColors.error
                            : themeColors.textSecondary,
                      },
                    ]}
                  >
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </Text>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: themeColors.inputBackground,
                      borderColor: themeColors.borderColor,
                      color: themeColors.text,
                    },
                    description.length > MAX_DESCRIPTION_LENGTH && {
                      borderColor: themeColors.error,
                      borderWidth: 2,
                    },
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add description (optional)"
                  placeholderTextColor={themeColors.textSecondary}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { borderColor: themeColors.borderColor },
                ]}
                onPress={handleCancel}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  (!isValid || !hasChanges) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={loading || !isValid || !hasChanges}
              >
                <LinearGradient
                  colors={
                    isValid && hasChanges
                      ? [themeColors.alexandriaGold, themeColors.alexandriaBronze]
                      : ['rgba(212, 175, 55, 0.3)', 'rgba(184, 148, 31, 0.3)']
                  }
                  style={styles.saveButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={themeColors.background} />
                  ) : (
                    <>
                      <FontAwesome5
                        name="save"
                        size={14}
                        color={isValid && hasChanges ? themeColors.background : themeColors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.saveButtonText,
                          {
                            color:
                              isValid && hasChanges
                                ? themeColors.background
                                : themeColors.textSecondary,
                          },
                        ]}
                      >
                        Save Changes
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    flex: 1,
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  charCounter: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  validationError: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TrackEditorModal;
