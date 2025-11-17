/**
 * PlaylistCustomizationScreen - Screen for editing playlist settings
 *
 * Features:
 * - Edit playlist name and description
 * - Change cover image
 * - Toggle favorite status
 * - Live preview of changes
 * - Delete playlist (danger zone)
 * - Validation and error handling
 *
 * Navigation:
 * Accessed from AudioPlaylistsScreen via long-press menu
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';
import axios from 'axios';
import { usePlaylistStore } from '../stores/playlistStore';

interface PlaylistCustomizationScreenProps {
  navigation: any;
  route: {
    params: {
      playlistId: string;
      playlist: {
        id: string;
        name: string;
        description?: string;
        cover_image?: string;
        thumbnail_color?: string;
        is_favorite?: boolean;
        item_count: number;
        total_duration: number;
      };
    };
  };
}

export default function PlaylistCustomizationScreen({ navigation, route }: PlaylistCustomizationScreenProps) {
  const { playlistId, playlist: initialPlaylist } = route.params;

  // Global store
  const { updatePlaylist, deletePlaylist } = usePlaylistStore();

  // Form state
  const [name, setName] = useState<string>(initialPlaylist.name || '');
  const [description, setDescription] = useState<string>(initialPlaylist.description || '');
  const [coverImage, setCoverImage] = useState<string | undefined>(initialPlaylist.cover_image);
  const [isFavorite, setIsFavorite] = useState<boolean>(initialPlaylist.is_favorite || false);
  const [thumbnailColor, setThumbnailColor] = useState<string>(
    initialPlaylist.thumbnail_color || '#D4AF37'
  );

  // UI state
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Theme colors
  const themeColors = useMemo(() => ({
    background: '#1A2C5B',
    backgroundSecondary: '#2C467D',
    alexandriaGold: '#D4AF37',
    alexandriaBronze: '#B8941F',
    text: '#F8F4E3',
    textSecondary: '#CBD5E0',
    success: '#28a745',
    error: '#dc3545',
    cardBackground: 'rgba(248, 244, 227, 0.08)',
    inputBackground: 'rgba(248, 244, 227, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  }), []);

  // Character limits
  const MAX_NAME_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 500;

  // Alexandria color presets
  const colorPresets = [
    { name: 'Gold', color: '#D4AF37' },
    { name: 'Bronze', color: '#B8941F' },
    { name: 'Navy', color: '#1A2C5B' },
    { name: 'Teal', color: '#2C7D7D' },
    { name: 'Purple', color: '#6B4C9A' },
  ];

  // Check for changes
  useEffect(() => {
    const nameChanged = name !== initialPlaylist.name;
    const descriptionChanged = description !== (initialPlaylist.description || '');
    const coverChanged = coverImage !== initialPlaylist.cover_image;
    const favoriteChanged = isFavorite !== (initialPlaylist.is_favorite || false);
    const colorChanged = thumbnailColor !== (initialPlaylist.thumbnail_color || '#D4AF37');

    setHasChanges(
      nameChanged || descriptionChanged || coverChanged || favoriteChanged || colorChanged
    );
  }, [name, description, coverImage, isFavorite, thumbnailColor, initialPlaylist]);

  // Validate inputs
  const isValid = useMemo(() => {
    return (
      name.trim().length >= 3 &&
      name.length <= MAX_NAME_LENGTH &&
      description.length <= MAX_DESCRIPTION_LENGTH
    );
  }, [name, description]);

  // Pick cover image
  const handlePickImage = useCallback(async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to change the cover image.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const imageUri = result.assets[0].uri;

        // TODO: Upload to S3 or convert to base64
        // For now, just set the local URI
        setCoverImage(imageUri);
        setUploading(false);

        logger.info(`📷 Cover image selected: ${imageUri}`);
      }
    } catch (error) {
      logger.error('❌ Error picking image:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!isValid || !hasChanges) return;

    try {
      setSaving(true);

      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to save changes.');
        setSaving(false);
        return;
      }

      const updateData = {
        name: name.trim(),
        description: description.trim() || null,
        cover_image: coverImage || null,
        thumbnail_color: thumbnailColor,
        is_favorite: isFavorite,
      };

      logger.info(`💾 Saving playlist changes:`, updateData);

      await axios.patch(
        `${API_BASE_URL}/api/audio/playlists/${playlistId}`,
        updateData,
        {
          params: { user_id: user.uid },
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.uid,
          },
          timeout: 30000,
        }
      );

      // Update global store
      updatePlaylist(playlistId, updateData);

      logger.info(`✅ Playlist updated: ${name}`);
      setSaving(false);

      Alert.alert('Success', 'Playlist updated successfully!', [
        {
          text: 'OK',
          onPress: () => NavigationHelper.safeGoBack(navigation),
        },
      ]);
    } catch (error) {
      logger.error('❌ Error updating playlist:', error);
      setSaving(false);

      let errorMessage = 'Failed to update playlist. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      Alert.alert('Error', errorMessage);
    }
  }, [
    isValid,
    hasChanges,
    name,
    description,
    coverImage,
    thumbnailColor,
    isFavorite,
    playlistId,
    updatePlaylist,
    navigation,
  ]);

  // Delete playlist
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('Error', 'Please log in to delete playlists.');
                return;
              }

              // Delete from backend
              await axios.delete(`${API_BASE_URL}/api/audio/playlists/${playlistId}`, {
                params: { user_id: user.uid },
                headers: { 'X-User-ID': user.uid },
                timeout: 30000,
              });

              // Update global store
              deletePlaylist(playlistId);

              logger.info(`🗑️ Deleted playlist: ${name}`);

              Alert.alert('Success', 'Playlist deleted successfully.', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('AudioPlaylists'),
                },
              ]);
            } catch (error) {
              logger.error('❌ Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist. Please try again.');
            }
          },
        },
      ]
    );
  }, [name, playlistId, deletePlaylist, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />

      <LinearGradient
        colors={[themeColors.background, themeColors.backgroundSecondary]}
        style={styles.innerContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (hasChanges) {
                Alert.alert(
                  'Discard Changes?',
                  'You have unsaved changes. Are you sure you want to go back?',
                  [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                      text: 'Discard',
                      style: 'destructive',
                      onPress: () => NavigationHelper.safeGoBack(navigation),
                    },
                  ]
                );
              } else {
                NavigationHelper.safeGoBack(navigation);
              }
            }}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="arrow-left" size={20} color={themeColors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: themeColors.text }]}>Edit Playlist</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isValid || !hasChanges) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || !isValid || !hasChanges}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={themeColors.alexandriaGold} />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  {
                    color:
                      isValid && hasChanges
                        ? themeColors.alexandriaGold
                        : themeColors.textSecondary,
                  },
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          <Animatable.View animation="fadeIn" delay={100} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Preview</Text>

            <View
              style={[styles.previewCard, { backgroundColor: themeColors.cardBackground }]}
            >
              {/* Cover/Thumbnail */}
              <View style={styles.previewThumbnailContainer}>
                {coverImage ? (
                  <Image source={{ uri: coverImage }} style={styles.previewCoverImage} />
                ) : (
                  <View
                    style={[
                      styles.previewThumbnail,
                      { backgroundColor: thumbnailColor },
                    ]}
                  >
                    <FontAwesome5 name="music" size={40} color={themeColors.text} />
                  </View>
                )}

                {isFavorite && (
                  <View style={[styles.favoriteBadge, { backgroundColor: themeColors.alexandriaGold }]}>
                    <FontAwesome5 name="star" size={12} color={themeColors.background} solid />
                  </View>
                )}
              </View>

              {/* Preview Info */}
              <Text style={[styles.previewName, { color: themeColors.text }]} numberOfLines={2}>
                {name || 'Playlist Name'}
              </Text>
              {description && (
                <Text
                  style={[styles.previewDescription, { color: themeColors.textSecondary }]}
                  numberOfLines={3}
                >
                  {description}
                </Text>
              )}
            </View>
          </Animatable.View>

          {/* Playlist Name */}
          <Animatable.View animation="fadeInUp" delay={200} style={styles.section}>
            <View style={styles.inputLabelRow}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Playlist Name *
              </Text>
              <Text
                style={[
                  styles.charCounter,
                  {
                    color:
                      name.length > MAX_NAME_LENGTH
                        ? themeColors.error
                        : themeColors.textSecondary,
                  },
                ]}
              >
                {name.length}/{MAX_NAME_LENGTH}
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
                name.length > MAX_NAME_LENGTH && {
                  borderColor: themeColors.error,
                  borderWidth: 2,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter playlist name"
              placeholderTextColor={themeColors.textSecondary}
              maxLength={MAX_NAME_LENGTH}
            />

            {name.trim().length < 3 && name.length > 0 && (
              <Text style={[styles.validationError, { color: themeColors.error }]}>
                Name must be at least 3 characters
              </Text>
            )}
          </Animatable.View>

          {/* Description */}
          <Animatable.View animation="fadeInUp" delay={300} style={styles.section}>
            <View style={styles.inputLabelRow}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
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
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description"
              placeholderTextColor={themeColors.textSecondary}
              maxLength={MAX_DESCRIPTION_LENGTH}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Animatable.View>

          {/* Cover Image */}
          <Animatable.View animation="fadeInUp" delay={400} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Cover Image</Text>

            <View style={styles.coverImageSection}>
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.coverImagePreview} />
              ) : (
                <View
                  style={[
                    styles.coverImagePlaceholder,
                    { backgroundColor: thumbnailColor },
                  ]}
                >
                  <FontAwesome5 name="image" size={48} color={themeColors.text} />
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.changeCoverButton,
                  { borderColor: themeColors.borderColor },
                ]}
                onPress={handlePickImage}
                disabled={uploading}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={themeColors.alexandriaGold} />
                ) : (
                  <>
                    <FontAwesome5 name="camera" size={16} color={themeColors.alexandriaGold} />
                    <Text style={[styles.changeCoverButtonText, { color: themeColors.alexandriaGold }]}>
                      Change Cover
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Color Theme */}
          <Animatable.View animation="fadeInUp" delay={500} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Color Theme</Text>

            <View style={styles.colorPresetsRow}>
              {colorPresets.map((preset) => (
                <TouchableOpacity
                  key={preset.color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: preset.color },
                    thumbnailColor === preset.color && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setThumbnailColor(preset.color)}
                  activeOpacity={0.7}
                >
                  {thumbnailColor === preset.color && (
                    <FontAwesome5 name="check" size={16} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>

          {/* Favorite Toggle */}
          <Animatable.View animation="fadeInUp" delay={600} style={styles.section}>
            <View style={styles.favoriteRow}>
              <View style={styles.favoriteInfo}>
                <FontAwesome5 name="star" size={20} color={themeColors.alexandriaGold} solid />
                <View style={styles.favoriteTextContainer}>
                  <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 4 }]}>
                    Favorite Playlist
                  </Text>
                  <Text style={[styles.favoriteDescription, { color: themeColors.textSecondary }]}>
                    Mark as favorite for quick access
                  </Text>
                </View>
              </View>

              <Switch
                value={isFavorite}
                onValueChange={setIsFavorite}
                trackColor={{
                  false: 'rgba(248, 244, 227, 0.2)',
                  true: themeColors.alexandriaGold,
                }}
                thumbColor="#FFF"
              />
            </View>
          </Animatable.View>

          {/* Danger Zone */}
          <Animatable.View animation="fadeInUp" delay={700} style={styles.section}>
            <Text style={[styles.dangerZoneTitle, { color: themeColors.error }]}>Danger Zone</Text>

            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: themeColors.error }]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="trash" size={16} color={themeColors.error} />
              <Text style={[styles.deleteButtonText, { color: themeColors.error }]}>
                Delete Playlist
              </Text>
            </TouchableOpacity>

            <Text style={[styles.deleteWarning, { color: themeColors.textSecondary }]}>
              This action cannot be undone. All playlist items will be removed.
            </Text>
          </Animatable.View>

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  previewThumbnailContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  previewCoverImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  previewThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  coverImageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  coverImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  coverImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeCoverButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    gap: 8,
  },
  changeCoverButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorPresetsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  colorSwatch: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  favoriteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  favoriteTextContainer: {
    flex: 1,
  },
  favoriteDescription: {
    fontSize: 13,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    gap: 8,
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteWarning: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
});
