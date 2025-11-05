/**
 * AddToPlaylistModal - Modal for adding chapters to playlists
 *
 * Features:
 * - List existing playlists
 * - Create new playlist option
 * - Search playlists
 * - Success feedback
 * - Loading states
 * - Error handling
 * - Alexandria theme
 * - Smooth animations
 * - Accessible modal
 *
 * @param visible - Modal visibility state
 * @param chapterId - ID of the chapter to add
 * @param materialId - ID of the material
 * @param onClose - Callback when modal closes
 * @param onSuccess - Callback when successfully added
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Colors } from '../../constants/Colors';
import { API_BASE_URL } from '../../config/api';
import { auth } from '../../firebaseConfig';
import logger from '../../utils/logger';

interface Playlist {
  id: string;
  name: string;
  item_count: number;
  created_at: string;
}

interface AddToPlaylistModalProps {
  visible: boolean;
  chapterId: string;
  materialId: string;
  onClose: () => void;
  onSuccess: (playlistId: string, playlistName: string) => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  visible,
  chapterId,
  materialId,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const queryClient = useQueryClient();

  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      surface: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accentLight,
      accentDark: Colors.accentDark,
      primary: Colors.primary,
      error: Colors.error,
      success: Colors.success,
      border: Colors.border,
      overlay: 'rgba(26, 44, 91, 0.8)',
    }),
    []
  );

  // Fetch user's playlists
  const {
    data: playlists,
    isLoading: playlistsLoading,
    error: playlistsError,
  } = useQuery<Playlist[]>({
    queryKey: ['playlists'],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        logger.info('Fetching playlists');
        const response = await axios.get(`${API_BASE_URL}/api/playlists`, {
          headers: {
            'X-User-ID': user.uid,
            'Content-Type': 'application/json',
          },
        });

        logger.success('Playlists fetched', { count: response.data.length });
        return response.data;
      } catch (error) {
        logger.error('Failed to fetch playlists', error);
        throw error;
      }
    },
    enabled: visible,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add to existing playlist mutation
  const addToPlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      logger.info('Adding chapter to playlist', { chapterId, playlistId });

      const response = await axios.post(
        `${API_BASE_URL}/api/materials/${materialId}/chapters/${chapterId}/add-to-playlist`,
        { playlist_id: playlistId },
        {
          headers: {
            'X-User-ID': user.uid,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.success('Chapter added to playlist');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      const playlist = playlists?.find((p) => p.id === data.playlist_id);
      onSuccess(data.playlist_id, playlist?.name || 'Playlist');
      handleClose();
    },
    onError: (error) => {
      logger.error('Failed to add to playlist', error);
    },
  });

  // Create new playlist with chapter mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (name: string) => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      logger.info('Creating new playlist with chapter', { name, chapterId });

      const response = await axios.post(
        `${API_BASE_URL}/api/materials/${materialId}/chapters/${chapterId}/add-to-playlist`,
        { playlist_name: name },
        {
          headers: {
            'X-User-ID': user.uid,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.success('Playlist created and chapter added');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      onSuccess(data.playlist_id, newPlaylistName);
      handleClose();
    },
    onError: (error) => {
      logger.error('Failed to create playlist', error);
    },
  });

  const handleClose = () => {
    setSearchQuery('');
    setShowCreateNew(false);
    setNewPlaylistName('');
    onClose();
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylistMutation.mutate(newPlaylistName.trim());
    }
  };

  const filteredPlaylists = playlists?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View
            style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
              <View style={styles.headerTitleContainer}>
                <FontAwesome5 name="list-alt" size={20} color={themeColors.accent} />
                <Text style={[styles.title, { color: themeColors.text }]}>
                  Add to Playlist
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <FontAwesome5 name="times" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            {!showCreateNew && (
              <View style={styles.searchContainer}>
                <FontAwesome5
                  name="search"
                  size={16}
                  color={themeColors.textMuted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: themeColors.text, borderColor: themeColors.border },
                  ]}
                  placeholder="Search playlists..."
                  placeholderTextColor={themeColors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            )}

            {/* Create New Button */}
            {!showCreateNew && (
              <TouchableOpacity
                style={[styles.createNewButton, { backgroundColor: themeColors.accent }]}
                onPress={() => setShowCreateNew(true)}
                activeOpacity={0.8}
              >
                <FontAwesome5 name="plus" size={16} color={Colors.white} />
                <Text style={styles.createNewText}>Create New Playlist</Text>
              </TouchableOpacity>
            )}

            {/* Create New Form */}
            {showCreateNew && (
              <View style={styles.createNewContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { color: themeColors.text, borderColor: themeColors.border },
                  ]}
                  placeholder="Playlist name"
                  placeholderTextColor={themeColors.textMuted}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />
                <View style={styles.createActions}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: themeColors.border }]}
                    onPress={() => {
                      setShowCreateNew(false);
                      setNewPlaylistName('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelButtonText, { color: themeColors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      { backgroundColor: themeColors.accent },
                      (!newPlaylistName.trim() || createPlaylistMutation.isPending) &&
                        styles.createButtonDisabled,
                    ]}
                    onPress={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                    activeOpacity={0.8}
                  >
                    {createPlaylistMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <FontAwesome5 name="plus" size={14} color={Colors.white} />
                        <Text style={styles.createButtonText}>Create & Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Playlist List */}
            {!showCreateNew && (
              <View style={styles.listContainer}>
                {playlistsLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={themeColors.accent} />
                    <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                      Loading playlists...
                    </Text>
                  </View>
                ) : playlistsError ? (
                  <View style={styles.errorContainer}>
                    <FontAwesome5 name="exclamation-triangle" size={48} color={themeColors.error} />
                    <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
                      Failed to load playlists
                    </Text>
                  </View>
                ) : filteredPlaylists && filteredPlaylists.length > 0 ? (
                  <FlatList
                    data={filteredPlaylists}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.playlistItem,
                          { backgroundColor: themeColors.background, borderColor: themeColors.border },
                        ]}
                        onPress={() => addToPlaylistMutation.mutate(item.id)}
                        disabled={addToPlaylistMutation.isPending}
                        activeOpacity={0.7}
                      >
                        <View style={styles.playlistIcon}>
                          <FontAwesome5 name="list-alt" size={18} color={themeColors.accent} />
                        </View>
                        <View style={styles.playlistInfo}>
                          <Text style={[styles.playlistName, { color: themeColors.text }]}>
                            {item.name}
                          </Text>
                          <Text style={[styles.playlistCount, { color: themeColors.textMuted }]}>
                            {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
                          </Text>
                        </View>
                        {addToPlaylistMutation.isPending ? (
                          <ActivityIndicator size="small" color={themeColors.accent} />
                        ) : (
                          <FontAwesome5 name="chevron-right" size={16} color={themeColors.textMuted} />
                        )}
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={true}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <FontAwesome5 name="inbox" size={48} color={themeColors.textMuted} />
                    <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                      {searchQuery ? 'No playlists found' : 'No playlists yet'}
                    </Text>
                    {!searchQuery && (
                      <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                        Create your first playlist
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 36,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingLeft: 40,
    fontSize: 15,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createNewText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  createNewContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  createActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  playlistIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  playlistCount: {
    fontSize: 13,
  },
});

export default AddToPlaylistModal;
