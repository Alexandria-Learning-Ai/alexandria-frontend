/**
 * HybridDataService - Coordinates between Firebase and API backend
 * Handles data synchronization, offline support, and intelligent routing
 */

import { FirebaseService } from './FirebaseService';
import { StudentProfileService } from './StudentProfileService';
import { API_BASE_URL } from '../config/api';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocs } from 'firebase/firestore';
import logger from '../utils/logger';


export class HybridDataService {
    
    static SYNC_QUEUE_KEY = 'hybrid_sync_queue';
    static LAST_SYNC_KEY = 'last_sync_timestamp';
    
    // ===== PROFILE MANAGEMENT =====

    /**
     * Save user profile with hybrid approach
     * - Save to Firebase for real-time sync
     * - Queue API sync for backend processing
     */
    static async saveUserProfile(userId, profileData) {
        logger.info('🔄 HybridDataService: Starting profile save for user:', userId);
        try {
            // 1. Save to Firebase immediately (real-time)
            logger.info('🔥 HybridDataService: Saving to Firebase...');
            const firebaseProfile = await FirebaseService.saveUserProfile(userId, profileData);
            logger.info('✅ HybridDataService: Firebase save successful');
            
            // 2. Queue API sync for background processing
            logger.info('📋 HybridDataService: Queuing API sync...');
            await this.queueApiSync('profile', 'update', {
                userId,
                profileData: StudentProfileService.transformProfileForBackend(profileData)
            });
            
            // 3. Process sync queue if online
            logger.info('🌐 HybridDataService: Processing sync queue...');
            this.processSyncQueue();
            
            logger.info('✅ Profile saved with hybrid approach');
            return firebaseProfile;
            
        } catch (error) {
            logger.error('❌ Error in hybrid profile save:', error);
            logger.error('❌ Error details:', error.message);
            
            // Try to fallback to local save if Firebase fails
            try {
                logger.info('🔄 Attempting fallback to local save...');
                await StudentProfileService.saveProfileLocally(userId, profileData);
                logger.info('✅ Profile saved locally as fallback');
                return { success: true, fallback: 'local' };
            } catch (fallbackError) {
                logger.error('❌ Fallback save also failed:', fallbackError);
                throw error; // Throw original error
            }
        }
    }

    /**
     * Load user profile with fallback strategy
     * - Try Firebase first (faster, real-time)
     * - Fallback to API if Firebase fails
     * - Use local cache as last resort
     */
    static async getUserProfile(userId) {
        try {
            // 1. Try Firebase first (fastest)
            try {
                const firebaseProfile = await FirebaseService.getUserProfile(userId);
                if (firebaseProfile) {
                    logger.info('✅ Profile loaded from Firebase');
                    return firebaseProfile;
                }
            } catch (firebaseError) {
                logger.info('⚠️ Firebase profile load failed, trying API...');
            }

            // 2. Fallback to API
            try {
                const apiProfile = await StudentProfileService.getProfile(userId);
                if (apiProfile) {
                    // Sync back to Firebase for future fast access
                    await FirebaseService.saveUserProfile(userId, apiProfile);
                    logger.info('✅ Profile loaded from API, synced to Firebase');
                    return apiProfile;
                }
            } catch (apiError) {
                logger.info('⚠️ API profile load failed, using local cache...');
            }

            // 3. Last resort: local cache
            return await StudentProfileService.getProfile(userId);
            
        } catch (error) {
            logger.error('❌ All profile loading methods failed:', error);
            return null;
        }
    }

    // ===== QUIZ MANAGEMENT =====

    /**
     * Save quiz result with hybrid approach
     */
    static async saveQuizResult(userId, quizData) {
        try {
            // 1. Save to Firebase for immediate access
            const firebaseQuiz = await FirebaseService.saveQuizResult(userId, quizData);
            
            // 2. Update Firebase progress in real-time
            await this.updateProgressFromQuiz(userId, quizData);
            
            // 3. Queue API processing for AI analysis
            await this.queueApiSync('quiz', 'create', {
                userId,
                quizData: {
                    ...quizData,
                    firebaseId: firebaseQuiz.id
                }
            });
            
            // 4. Process queue
            this.processSyncQueue();
            
            return firebaseQuiz;
            
        } catch (error) {
            logger.error('❌ Error in hybrid quiz save:', error);
            throw error;
        }
    }

    /**
     * Get quiz history with intelligent loading
     */
    static async getQuizHistory(userId, limit = 20) {
        try {
            // Load from Firebase for instant access
            const firebaseHistory = await FirebaseService.getUserQuizHistory(userId, limit);
            
            // Queue background sync with API to ensure completeness
            this.queueApiSync('quiz', 'sync', { userId, limit });
            
            return firebaseHistory;
            
        } catch (error) {
            logger.error('❌ Error loading quiz history:', error);
            return [];
        }
    }

    // ===== PROGRESS TRACKING =====

    /**
     * Update progress from quiz results
     */
    static async updateProgressFromQuiz(userId, quizData) {
        try {
            const currentProgress = await FirebaseService.getUserProgress(userId);
            
            // Calculate new progress metrics
            const newProgress = this.calculateProgressUpdate(currentProgress, quizData);
            
            // Save updated progress to Firebase
            return await FirebaseService.updateProgress(userId, newProgress);
            
        } catch (error) {
            logger.error('❌ Error updating progress:', error);
        }
    }

    /**
     * Calculate progress metrics from quiz data
     */
    static calculateProgressUpdate(currentProgress, quizData) {
        const { questions, userAnswers, results } = quizData;
        
        const totalQuestions = questions?.length || 0;
        const correctCount = results?.correctCount || 0;
        const subject = quizData.category || 'General';
        
        return {
            totalQuizzes: (currentProgress.totalQuizzes || 0) + 1,
            totalQuestions: (currentProgress.totalQuestions || 0) + totalQuestions,
            correctAnswers: (currentProgress.correctAnswers || 0) + correctCount,
            accuracy: totalQuestions > 0 ? 
                ((currentProgress.correctAnswers || 0) + correctCount) / 
                ((currentProgress.totalQuestions || 0) + totalQuestions) * 100 : 0,
            subjects: {
                ...currentProgress.subjects,
                [subject]: {
                    quizzes: ((currentProgress.subjects?.[subject]?.quizzes) || 0) + 1,
                    questions: ((currentProgress.subjects?.[subject]?.questions) || 0) + totalQuestions,
                    correct: ((currentProgress.subjects?.[subject]?.correct) || 0) + correctCount,
                    accuracy: totalQuestions > 0 ? 
                        (((currentProgress.subjects?.[subject]?.correct) || 0) + correctCount) / 
                        (((currentProgress.subjects?.[subject]?.questions) || 0) + totalQuestions) * 100 : 0
                }
            },
            lastActivity: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    // ===== SYNC QUEUE MANAGEMENT =====

    /**
     * Add operation to sync queue
     */
    static async queueApiSync(dataType, operation, data) {
        try {
            const queue = await this.getSyncQueue();
            const syncItem = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                dataType,
                operation,
                data,
                timestamp: Date.now(),
                retries: 0,
                maxRetries: 3
            };
            
            queue.push(syncItem);
            await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
            
            logger.info(`📋 Queued ${dataType} ${operation} for API sync`);
            
        } catch (error) {
            logger.error('❌ Error queuing sync operation:', error);
        }
    }

    /**
     * Get current sync queue
     */
    static async getSyncQueue() {
        try {
            const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
            return queueData ? JSON.parse(queueData) : [];
        } catch (error) {
            logger.error('❌ Error loading sync queue:', error);
            return [];
        }
    }

    /**
     * Process sync queue when online
     */
    static async processSyncQueue() {
        try {
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                logger.info('📱 Offline - sync queue will process when online');
                return;
            }

            const queue = await this.getSyncQueue();
            const processedItems = [];

            for (const item of queue) {
                try {
                    await this.processSyncItem(item);
                    processedItems.push(item);
                    logger.info(`✅ Synced ${item.dataType} ${item.operation} with API`);
                } catch (error) {
                    logger.error(`❌ Failed to sync ${item.dataType}:`, error);
                    
                    // Increment retry count
                    item.retries++;
                    if (item.retries >= item.maxRetries) {
                        processedItems.push(item); // Remove failed items after max retries
                        logger.info(`🗑️ Removed failed sync item after ${item.maxRetries} retries`);
                    }
                }
            }

            // Remove processed items from queue
            const remainingQueue = queue.filter(item => !processedItems.includes(item));
            await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
            
            if (processedItems.length > 0) {
                logger.info(`✅ Processed ${processedItems.length} sync operations`);
            }

        } catch (error) {
            logger.error('❌ Error processing sync queue:', error);
        }
    }

    /**
     * Process individual sync item
     */
    static async processSyncItem(item) {
        const { dataType, operation, data } = item;

        switch (dataType) {
            case 'profile':
                if (operation === 'update') {
                    try {
                        return await StudentProfileService.saveProfile(data.userId, data.profileData);
                    } catch (error) {
                        if (error.message && error.message.includes('Profile already exists')) {
                            // Handle 409 conflict - profile already exists, this is okay for updates
                            logger.info('✅ Profile sync skipped - already exists (this is normal for updates)');
                            return { success: true, skipped: 'already_exists' };
                        }
                        throw error; // Re-throw other errors
                    }
                }
                break;

            case 'quiz':
                if (operation === 'create') {
                    // Send quiz result to API for analysis
                    const response = await fetch(`${API_BASE_URL}/api/quiz-result`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-User-ID': data.userId, // Include user ID for proper data isolation
                        },
                        body: JSON.stringify(data.quizData)
                    });
                    return await response.json();
                }
                break;

            default:
                throw new Error(`Unknown sync operation: ${dataType} ${operation}`);
        }
    }

    // ===== REAL-TIME SUBSCRIPTIONS =====

    /**
     * Subscribe to real-time profile updates
     */
    static subscribeToProfile(userId, callback) {
        return FirebaseService.subscribeToProfile(userId, (profile) => {
            // Enhanced callback with additional processing
            callback(profile);
            
            // Log analytics event
            if (profile) {
                FirebaseService.logAnalyticsEvent(userId, {
                    event: 'profile_updated',
                    timestamp: Date.now()
                });
            }
        });
    }

    // ===== INITIALIZATION =====

    /**
     * Initialize hybrid service
     */
    static async initialize() {
        try {
            // Set up network listener for sync queue processing
            NetInfo.addEventListener(state => {
                if (state.isConnected) {
                    logger.info('🌐 Network connected - processing sync queue');
                    this.processSyncQueue();
                }
            });

            // Process any pending sync operations
            this.processSyncQueue();
            
            logger.info('✅ HybridDataService initialized');
            
        } catch (error) {
            logger.error('❌ Error initializing HybridDataService:', error);
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Force sync all data
     */
    static async forceSync(userId) {
        try {
            // Load all data from API and sync to Firebase
            const [profile, progress] = await Promise.allSettled([
                StudentProfileService.getProfile(userId),
                // Add other data fetching as needed
            ]);

            if (profile.status === 'fulfilled' && profile.value) {
                await FirebaseService.saveUserProfile(userId, profile.value);
            }

            logger.info('✅ Force sync completed');
            
        } catch (error) {
            logger.error('❌ Error in force sync:', error);
        }
    }

    /**
     * Clear sync queue (for testing/debugging)
     */
    static async clearSyncQueue() {
        await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY);
        logger.info('🗑️ Sync queue cleared');
    }
}