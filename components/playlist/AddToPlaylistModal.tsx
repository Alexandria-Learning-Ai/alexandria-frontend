/**
 * AddToPlaylistModal Component
 * Modal for adding audio to an existing playlist
 *
 * Features:
 * - Shows list of user's playlists
 * - Select playlist to add audio to
 * - Create new playlist option
 * - Search/filter playlists
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { auth } from '../../firebaseConfig';
import { API_BASE_URL } from '../../config/api';
import logger from '../../utils/logger';
import { usePlaylistStore } from '../../stores/playlistStore';
import CreatePlaylistModal from './CreatePlaylistModal';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  item_count: number;
  thumbnail_color: string;
}

interface AudioData {
  audio_id: string;
  material_id: string;
  title: string;
  duration: number;
}

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  audioData: AudioData;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  visible,
  onClose,
  audioData,
}) => {
  // Global playlist store
  const { playlists, loading, fetchPlaylists, updatePlaylistItems, addPlaylist } = usePlaylistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch playlists when modal opens
  useEffect(() => {
    if (visible) {
      fetchPlaylists();
    }
  }, [visible, fetchPlaylists]);

  // Filter playlists by search query
  const filteredPlaylists = (playlists || []).filter((playlist) =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPlaylist = async (playlistId: string) => {
    setIsAdding(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to add to playlist');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/audio/playlists/${playlistId}/items`,
        {
          audio_id: audioData.audio_id,
          material_id: audioData.material_id,
          title: audioData.title,
          duration: audioData.duration,
        },
        {
          headers: { 'X-User-ID': user.uid },
          timeout: 10000,
        }
      );

      if (response.data?.success || response.data) {
        // Update global store with new playlist state
        const updatedPlaylist = response.data.playlist || response.data;
        if (updatedPlaylist.items) {
          updatePlaylistItems(
            playlistId,
            updatedPlaylist.items,
            updatedPlaylist.item_count,
            updatedPlaylist.total_duration
          );
        } else {
          // If no items returned, just refresh the store
          await fetchPlaylists();
        }

        Alert.alert('Success', 'Audio added to playlist!');
        setSearchQuery('');
        onClose();
      }
    } catch (error) {
      logger.error('Error adding to playlist:', error);
      Alert.alert('Error', 'Failed to add audio to playlist');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      setSearchQuery('');
      onClose();
    }
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleCreatePlaylistSubmit = async (name: string, description: string, thumbnailColor: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to create playlists.');
        return;
      }

      // Create playlist via API
      const response = await axios.post(
        `${API_BASE_URL}/api/audio/playlists/`,
        {
          name,
          description,
          thumbnail_color: thumbnailColor,
        },
        {
          params: {
            user_id: user.uid,
          },
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.uid,
          },
          timeout: 30000,
        }
      );

      if (response.data) {
        logger.info('✅ Created playlist:', response.data.name);

        // Add to global store immediately (optimistic update)
        addPlaylist(response.data);

        // Close create modal
        setShowCreateModal(false);

        // Automatically select the newly created playlist and add audio to it
        await handleSelectPlaylist(response.data.id);
      }
    } catch (error) {
      logger.error('❌ Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
      throw error;
    }
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => handleSelectPlaylist(item.id)}
      disabled={isAdding}
      activeOpacity={0.7}
    >
      <View style={[styles.playlistThumbnail, { backgroundColor: item.thumbnail_color || '#D4AF37' }]}>
        <FontAwesome5 name="music" size={18} color="#FFF" />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.playlistStats}>
          {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <FontAwesome5 name="chevron-right" size={14} color="#CBD5E0" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="music" size={48} color="#CBD5E0" />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No playlists found' : 'No playlists yet'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? 'Try a different search term'
          : 'Create your first playlist to get started'}
      </Text>
    </View>
  );

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
            <Text style={styles.title}>Add to Playlist</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isAdding}
            >
              <FontAwesome5 name="times" size={20} color="#F8F4E3" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <FontAwesome5 name="search" size={14} color="#CBD5E0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search playlists..."
              placeholderTextColor="#CBD5E0"
              value={searchQuery}
              onChangeText={setSearchQuery}
              editable={!isAdding}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <FontAwesome5 name="times-circle" size={16} color="#CBD5E0" />
              </TouchableOpacity>
            )}
          </View>

          {/* Create New Playlist Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNew}
            disabled={isAdding}
            activeOpacity={0.7}
          >
            <View style={styles.createButtonContent}>
              <View style={styles.createIcon}>
                <FontAwesome5 name="plus" size={16} color="#1A2C5B" />
              </View>
              <Text style={styles.createButtonText}>Create New Playlist</Text>
            </View>
          </TouchableOpacity>

          {/* Playlists List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={styles.loadingText}>Loading playlists...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPlaylists}
              keyExtractor={(item) => item.id}
              renderItem={renderPlaylistItem}
              contentContainerStyle={styles.playlistsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
            />
          )}

          {isAdding && (
            <View style={styles.addingOverlay}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={styles.addingText}>Adding to playlist...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePlaylistSubmit}
      />
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
    maxHeight: '80%',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F8F4E3',
  },
  clearButton: {
    padding: 4,
  },
  createButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  createIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 44, 91, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C5B',
  },
  playlistsList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    gap: 12,
  },
  playlistThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 2,
  },
  playlistStats: {
    fontSize: 12,
    color: '#CBD5E0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#CBD5E0',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8F4E3',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#CBD5E0',
    textAlign: 'center',
  },
  addingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 44, 91, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  addingText: {
    fontSize: 16,
    color: '#F8F4E3',
    marginTop: 16,
  },
});

export default AddToPlaylistModal;
