/**
 * CreatePlaylistModal Component
 * Modal for creating a new audio playlist
 *
 * Features:
 * - Form with name (required) and description (optional)
 * - Thumbnail color picker with preset colors
 * - Validation and error handling
 * - Alexandria theme styling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, thumbnailColor: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#D4AF37', // Alexandria Gold
  '#6366F1', // Indigo
  '#9333EA', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
];

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#D4AF37');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validate name
    if (!name.trim()) {
      setError('Playlist name is required');
      return;
    }

    if (name.trim().length > 100) {
      setError('Playlist name must be less than 100 characters');
      return;
    }

    if (description.length > 500) {
      setError('Description must be less than 500 characters');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(name.trim(), description.trim(), selectedColor);
      // Reset form
      setName('');
      setDescription('');
      setSelectedColor('#D4AF37');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setSelectedColor('#D4AF37');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Playlist</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <FontAwesome5 name="times" size={20} color="#F8F4E3" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Playlist Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter playlist name..."
                placeholderTextColor="#CBD5E0"
                value={name}
                onChangeText={setName}
                maxLength={100}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{name.length}/100</Text>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a description..."
                placeholderTextColor="#CBD5E0"
                value={description}
                onChangeText={setDescription}
                maxLength={500}
                multiline
                numberOfLines={3}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            {/* Color Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Playlist Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    disabled={isSubmitting}
                  >
                    {selectedColor === color && (
                      <FontAwesome5 name="check" size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={[styles.previewThumbnail, { backgroundColor: selectedColor }]}>
                  <FontAwesome5 name="music" size={20} color="#FFF" />
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {name || 'Playlist Name'}
                  </Text>
                  <Text style={styles.previewDescription} numberOfLines={1}>
                    {description || 'No description'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#1A2C5B" />
              ) : (
                <>
                  <FontAwesome5 name="plus" size={16} color="#1A2C5B" />
                  <Text style={styles.submitButtonText}>Create</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A2C5B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8F4E3',
  },
  closeButton: {
    padding: 8,
  },
  inputGroup: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#F8F4E3',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#CBD5E0',
    marginTop: 4,
    textAlign: 'right',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#F8F4E3',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  preview: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    gap: 12,
  },
  previewThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 2,
  },
  previewDescription: {
    fontSize: 12,
    color: '#CBD5E0',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8F4E3',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C5B',
  },
});

export default CreatePlaylistModal;
