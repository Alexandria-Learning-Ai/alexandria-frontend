/**
 * Progressive Audio Playlist Types
 *
 * Type definitions for chunked audio generation with progressive track delivery.
 */

export type TrackStatus = 'queued' | 'processing' | 'complete' | 'failed';

export type PlaylistStatus = 'generating' | 'complete' | 'partial' | 'failed';

export interface AudioTrack {
  id: string;
  track_num: number;
  title: string;
  character_count: number;
  word_count: number;
  status: TrackStatus;
  progress: number; // 0-100
  audio_url: string | null;
  duration: number | null; // seconds
  file_size: number | null; // bytes
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ProgressivePlaylist {
  chunked_playlist_id: string;
  playlist_id: string;
  material_id: string;
  title: string;
  total_tracks: number;
  completed_tracks: number;
  status: PlaylistStatus;
  voice: string;
  speed: number;
  language: string;
  created_at: string;
  updated_at: string;
  tracks: AudioTrack[];
  estimated_total_duration?: number; // seconds
  avg_chars_per_track?: number;
}

export interface TrackStatusSummary {
  complete: number;
  processing: number;
  queued: number;
  failed: number;
  total: number;
}

export interface ProgressivePlaylistProps {
  materialId: string;
  playlist: ProgressivePlaylist;
  onTrackPlay: (track: AudioTrack) => void;
  onRefresh?: () => void;
  onPlaylistUpdate?: (playlist: ProgressivePlaylist) => void;
  currentlyPlayingTrackId?: string | null;
}

export interface TrackListItemProps {
  track: AudioTrack;
  onPlay: () => void;
  onRetry?: (trackId: string) => void;
  isPlaying: boolean;
  isDisabled?: boolean;
}

export interface PlaylistHeaderProps {
  playlist: ProgressivePlaylist;
  statusSummary: TrackStatusSummary;
  onRefresh?: () => void;
  onSavePlaylist?: () => void;
  isSaved?: boolean;
}
