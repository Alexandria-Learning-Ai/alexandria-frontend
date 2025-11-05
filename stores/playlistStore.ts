import { create } from 'zustand';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { auth } from '../firebaseConfig';

interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  item_count: number;
  total_duration: number;
  thumbnail_color: string;
  created_at: string;
  updated_at: string;
  items?: PlaylistItem[];
}

interface PlaylistItem {
  id: string;
  playlist_id: string;
  audio_id: string;
  material_id: string | null;
  position: number;
  title: string;
  duration: number;
  added_at: string;
}

interface PlaylistStore {
  playlists: Playlist[];
  loading: boolean;
  error: string | null;

  // Fetch all playlists from backend
  fetchPlaylists: () => Promise<void>;

  // Optimistic add - updates UI immediately, syncs to backend
  addPlaylist: (playlist: Playlist) => void;

  // Optimistic update - updates UI immediately
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;

  // Optimistic delete - removes from UI immediately
  deletePlaylist: (id: string) => void;

  // Update playlist items after adding/removing audio
  updatePlaylistItems: (playlistId: string, items: PlaylistItem[], itemCount: number, totalDuration: number) => void;

  // Clear all data
  clear: () => void;
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  playlists: [],
  loading: false,
  error: null,

  fetchPlaylists: async () => {
    set({ loading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      logger.info('📚 Fetching playlists from backend...');

      const response = await fetch(`${API_BASE_URL}/api/audio/playlists/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.uid,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status}`);
      }

      const data = await response.json();

      // API returns {playlists: [...], total_count, page, limit}
      const playlistsArray = Array.isArray(data) ? data : data.playlists || [];
      logger.info(`✅ Fetched ${playlistsArray.length} playlists`);

      set({ playlists: playlistsArray, loading: false });
    } catch (error) {
      logger.error('❌ Error fetching playlists:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch playlists',
        loading: false
      });
    }
  },

  addPlaylist: (playlist: Playlist) => {
    logger.info(`➕ Adding playlist to store: ${playlist.name}`);
    set((state) => ({
      playlists: [playlist, ...state.playlists], // Add to beginning for newest-first
    }));
  },

  updatePlaylist: (id: string, updates: Partial<Playlist>) => {
    logger.info(`✏️ Updating playlist ${id} in store`);
    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deletePlaylist: (id: string) => {
    logger.info(`🗑️ Deleting playlist ${id} from store`);
    set((state) => ({
      playlists: state.playlists.filter((p) => p.id !== id),
    }));
  },

  updatePlaylistItems: (playlistId: string, items: PlaylistItem[], itemCount: number, totalDuration: number) => {
    logger.info(`🔄 Updating playlist ${playlistId} items in store`);
    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              items,
              item_count: itemCount,
              total_duration: totalDuration
            }
          : p
      ),
    }));
  },

  clear: () => {
    logger.info('🧹 Clearing playlist store');
    set({ playlists: [], loading: false, error: null });
  },
}));

// Selectors for convenient access
export const selectPlaylistById = (state: PlaylistStore, id: string) =>
  state.playlists.find((p) => p.id === id);

export const selectPlaylistCount = (state: PlaylistStore) =>
  state.playlists.length;

export const selectTotalAudioCount = (state: PlaylistStore) =>
  state.playlists.reduce((sum, p) => sum + p.item_count, 0);
