/**
 * AudioPlayerService
 *
 * Centralized service for audio playback with background support and notification controls.
 * Manages playback state, handles sequential playback, and provides media controls in notifications.
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Notifications from 'expo-notifications';
import logger from '../utils/logger';

export interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  duration: number;
  position?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  currentIndex: number;
  playlist: AudioTrack[];
  isSequential: boolean;
  playbackRate: number;
  positionMillis: number;
  durationMillis: number;
}

type PlaybackListener = (state: PlaybackState) => void;
type PlaybackErrorListener = (error: Error, track?: AudioTrack) => void;

class AudioPlayerService {
  private sound: Audio.Sound | null = null;
  private currentTrack: AudioTrack | null = null;
  private currentIndex: number = -1;
  private playlist: AudioTrack[] = [];
  private isSequential: boolean = false;
  private playbackRate: number = 1.0;
  private listeners: Set<PlaybackListener> = new Set();
  private errorListeners: Set<PlaybackErrorListener> = new Set();
  private positionMillis: number = 0;
  private durationMillis: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize audio player with background playback support
   */
  private async initialize() {
    if (this.isInitialized) return;

    try {
      // Configure notification handler for background playback
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        }),
      });

      // Set audio mode for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      logger.info('🎵 AudioPlayerService initialized with background playback support');
    } catch (error) {
      logger.error('❌ Error initializing AudioPlayerService:', error);
    }
  }

  /**
   * Load and play a track
   */
  async playTrack(track: AudioTrack, autoPlay: boolean = true): Promise<void> {
    try {
      logger.info(`🎵 Loading track: ${track.title}`);

      // Stop current track if playing
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // If clicking same track and not auto-advancing, toggle playback
      if (!autoPlay && this.currentTrack?.id === track.id) {
        await this.stop();
        return;
      }

      // Load new track
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.audio_url },
        {
          shouldPlay: autoPlay,
          rate: this.playbackRate,
          shouldCorrectPitch: true
        },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentTrack = track;

      // Update notification
      await this.updateNotification(track, true);

      // Notify listeners
      this.notifyListeners();

      logger.info(`✅ Playing: ${track.title}`);
    } catch (error) {
      logger.error('❌ Error playing track:', error);
      this.notifyErrorListeners(error as Error, track);
      throw error;
    }
  }

  /**
   * Load playlist and start sequential playback
   */
  async playPlaylist(tracks: AudioTrack[], startIndex: number = 0): Promise<void> {
    this.playlist = tracks;
    this.currentIndex = startIndex;
    this.isSequential = true;

    if (tracks.length > 0 && startIndex >= 0 && startIndex < tracks.length) {
      await this.playTrack(tracks[startIndex], true);
    }
  }

  /**
   * Play next track in playlist
   */
  async playNext(): Promise<void> {
    if (!this.isSequential || this.playlist.length === 0) return;

    const nextIndex = this.currentIndex + 1;
    if (nextIndex < this.playlist.length) {
      this.currentIndex = nextIndex;
      await this.playTrack(this.playlist[nextIndex], true);
    } else {
      logger.info('🎵 Reached end of playlist');
      await this.stop();
      this.isSequential = false;
    }
  }

  /**
   * Play previous track in playlist
   */
  async playPrevious(): Promise<void> {
    if (!this.isSequential || this.playlist.length === 0) return;

    const prevIndex = this.currentIndex - 1;
    if (prevIndex >= 0) {
      this.currentIndex = prevIndex;
      await this.playTrack(this.playlist[prevIndex], true);
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
      await this.updateNotification(this.currentTrack!, false);
      this.notifyListeners();
      logger.info('⏸️ Playback paused');
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
      await this.updateNotification(this.currentTrack!, true);
      this.notifyListeners();
      logger.info('▶️ Playback resumed');
    }
  }

  /**
   * Stop playback and clear state
   */
  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }

    this.currentTrack = null;
    this.currentIndex = -1;
    this.isSequential = false;

    await this.clearNotification();
    this.notifyListeners();
    logger.info('⏹️ Playback stopped');
  }

  /**
   * Set playback speed
   */
  async setPlaybackRate(rate: number): Promise<void> {
    this.playbackRate = rate;

    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
      this.notifyListeners();
      logger.info(`🎵 Playback speed set to ${rate}x`);
    }
  }

  /**
   * Seek to position (in milliseconds)
   */
  async seekTo(positionMillis: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMillis);
      this.notifyListeners();
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlayPause(): Promise<void> {
    if (!this.sound) return;

    const status = await this.sound.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await this.pause();
      } else {
        await this.resume();
      }
    }
  }

  /**
   * Handle playback status updates
   */
  private onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (!status.isLoaded) return;

    this.positionMillis = status.positionMillis;
    this.durationMillis = status.durationMillis || 0;

    // Track finished - auto-advance if sequential
    if (status.didJustFinish) {
      logger.info('🎵 Track finished');

      if (this.isSequential) {
        logger.info('🎵 Auto-advancing to next track...');
        setTimeout(() => {
          this.playNext();
        }, 500);
      } else {
        this.stop();
      }
    }

    this.notifyListeners();
  }

  /**
   * Update media notification
   */
  private async updateNotification(track: AudioTrack, isPlaying: boolean): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: track.title,
          body: isPlaying ? 'Playing' : 'Paused',
          sound: false,
          badge: 0,
          categoryIdentifier: 'audio-playback',
          data: {
            trackId: track.id,
            isPlaying,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      logger.error('❌ Error updating notification:', error);
    }
  }

  /**
   * Clear media notification
   */
  private async clearNotification(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      logger.error('❌ Error clearing notification:', error);
    }
  }

  /**
   * Subscribe to playback state changes
   */
  subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to playback errors
   */
  subscribeToErrors(listener: PlaybackErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Notify error listeners
   */
  private notifyErrorListeners(error: Error, track?: AudioTrack): void {
    this.errorListeners.forEach(listener => listener(error, track));
  }

  /**
   * Get current playback state
   */
  getState(): PlaybackState {
    return {
      isPlaying: this.sound !== null,
      currentTrack: this.currentTrack,
      currentIndex: this.currentIndex,
      playlist: this.playlist,
      isSequential: this.isSequential,
      playbackRate: this.playbackRate,
      positionMillis: this.positionMillis,
      durationMillis: this.durationMillis,
    };
  }

  /**
   * Get current track
   */
  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }

  /**
   * Check if playing
   */
  isCurrentlyPlaying(): boolean {
    return this.sound !== null;
  }

  /**
   * Cleanup - call on app close
   */
  async cleanup(): Promise<void> {
    await this.stop();
    this.listeners.clear();
    this.errorListeners.clear();
    logger.info('🧹 AudioPlayerService cleaned up');
  }
}

// Export singleton instance
export const audioPlayerService = new AudioPlayerService();
export default audioPlayerService;
