/**
 * useAudioPlayer Hook
 *
 * React hook for using the AudioPlayerService with automatic state updates
 */

import { useState, useEffect } from 'react';
import audioPlayerService, { PlaybackState, AudioTrack } from '../services/AudioPlayerService';

export function useAudioPlayer() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    audioPlayerService.getState()
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to playback state changes
    const unsubscribe = audioPlayerService.subscribe((state) => {
      setPlaybackState(state);
    });

    // Subscribe to errors
    const unsubscribeErrors = audioPlayerService.subscribeToErrors((err) => {
      setError(err);
    });

    // Get initial state
    setPlaybackState(audioPlayerService.getState());

    return () => {
      unsubscribe();
      unsubscribeErrors();
    };
  }, []);

  return {
    // State
    ...playbackState,
    error,

    // Actions
    playTrack: (track: AudioTrack, autoPlay?: boolean) =>
      audioPlayerService.playTrack(track, autoPlay),
    playPlaylist: (tracks: AudioTrack[], startIndex?: number) =>
      audioPlayerService.playPlaylist(tracks, startIndex),
    playNext: () => audioPlayerService.playNext(),
    playPrevious: () => audioPlayerService.playPrevious(),
    pause: () => audioPlayerService.pause(),
    resume: () => audioPlayerService.resume(),
    stop: () => audioPlayerService.stop(),
    togglePlayPause: () => audioPlayerService.togglePlayPause(),
    setPlaybackRate: (rate: number) => audioPlayerService.setPlaybackRate(rate),
    seekTo: (positionMillis: number) => audioPlayerService.seekTo(positionMillis),

    // Helpers
    formatTime: (millis: number) => {
      const totalSeconds = Math.floor(millis / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    clearError: () => setError(null),
  };
}
