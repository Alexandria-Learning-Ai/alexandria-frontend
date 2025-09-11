/**
 * FirebaseService - Central service for all Firebase Firestore operations
 * Handles user profiles, quiz history, progress tracking, and real-time updates
 */

import { 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    addDoc,
    query, 
    where, 
    orderBy, 
    limit,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    increment,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import logger from '../utils/logger';


export class FirebaseService {
    
    // ===== COLLECTIONS =====
    static COLLECTIONS = {
        USERS: 'users',
        PROFILES: 'profiles', 
        QUIZ_HISTORY: 'quizHistory',
        PROGRESS: 'progress',
        FLASHCARDS: 'flashcards',
        ACHIEVEMENTS: 'achievements',
        SETTINGS: 'settings',
        ANALYTICS: 'analytics'
    };

    // ===== USER PROFILE MANAGEMENT =====
    
    /**
     * Create or update user profile in Firebase
     */
    static async saveUserProfile(userId, profileData) {
        try {
            const profileRef = doc(db, this.COLLECTIONS.PROFILES, userId);
            const profileToSave = {
                ...profileData,
                userId,
                updatedAt: serverTimestamp(),
                createdAt: profileData.createdAt || serverTimestamp()
            };

            await setDoc(profileRef, profileToSave, { merge: true });
            logger.info('✅ Profile saved to Firebase:', userId);
            return profileToSave;
        } catch (error) {
            logger.error('❌ Error saving profile to Firebase:', error);
            if (error.code === 'permission-denied') {
                logger.error('🔒 Firebase permissions not configured. Please check Firestore security rules.');
            }
            throw error;
        }
    }

    /**
     * Get user profile from Firebase
     */
    static async getUserProfile(userId) {
        try {
            const profileRef = doc(db, this.COLLECTIONS.PROFILES, userId);
            const profileSnap = await getDoc(profileRef);
            
            if (profileSnap.exists()) {
                const profile = profileSnap.data();
                logger.info('✅ Profile loaded from Firebase:', userId);
                return profile;
            } else {
                logger.info('📝 No profile found in Firebase for:', userId);
                return null;
            }
        } catch (error) {
            logger.error('❌ Error loading profile from Firebase:', error);
            if (error.code === 'permission-denied') {
                logger.error('🔒 Firebase permissions not configured. Please check Firestore security rules.');
                return null; // Return null instead of throwing for profile reads
            }
            throw error;
        }
    }

    /**
     * Listen to real-time profile updates
     */
    static subscribeToProfile(userId, callback) {
        const profileRef = doc(db, this.COLLECTIONS.PROFILES, userId);
        
        const unsubscribe = onSnapshot(profileRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            } else {
                callback(null);
            }
        }, (error) => {
            logger.error('❌ Error in profile subscription:', error);
        });

        return unsubscribe;
    }

    // ===== QUIZ HISTORY MANAGEMENT =====

    /**
     * Save quiz result to Firebase
     */
    static async saveQuizResult(userId, quizData) {
        try {
            const quizHistoryRef = collection(db, this.COLLECTIONS.QUIZ_HISTORY);
            const quizResult = {
                userId,
                ...quizData,
                completedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(quizHistoryRef, quizResult);
            logger.info('✅ Quiz result saved to Firebase:', docRef.id);
            return { id: docRef.id, ...quizResult };
        } catch (error) {
            logger.error('❌ Error saving quiz result to Firebase:', error);
            throw error;
        }
    }

    /**
     * Get user's quiz history
     */
    static async getUserQuizHistory(userId, limitCount = 20) {
        try {
            const quizHistoryRef = collection(db, this.COLLECTIONS.QUIZ_HISTORY);
            const q = query(
                quizHistoryRef, 
                where("userId", "==", userId),
                orderBy("completedAt", "desc"),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const quizzes = [];
            querySnapshot.forEach((doc) => {
                quizzes.push({ id: doc.id, ...doc.data() });
            });

            logger.info(`✅ Loaded ${quizzes.length} quiz results from Firebase`);
            return quizzes;
        } catch (error) {
            logger.error('❌ Error loading quiz history from Firebase:', error);
            throw error;
        }
    }

    // ===== PROGRESS TRACKING =====

    /**
     * Update user progress
     */
    static async updateProgress(userId, progressData) {
        try {
            const progressRef = doc(db, this.COLLECTIONS.PROGRESS, userId);
            const progressUpdate = {
                userId,
                ...progressData,
                updatedAt: serverTimestamp()
            };

            await setDoc(progressRef, progressUpdate, { merge: true });
            logger.info('✅ Progress updated in Firebase:', userId);
            return progressUpdate;
        } catch (error) {
            logger.error('❌ Error updating progress in Firebase:', error);
            throw error;
        }
    }

    /**
     * Get user progress
     */
    static async getUserProgress(userId) {
        try {
            const progressRef = doc(db, this.COLLECTIONS.PROGRESS, userId);
            const progressSnap = await getDoc(progressRef);
            
            if (progressSnap.exists()) {
                return progressSnap.data();
            } else {
                // Return default progress structure
                return {
                    userId,
                    totalQuizzes: 0,
                    totalQuestions: 0,
                    correctAnswers: 0,
                    accuracy: 0,
                    subjects: {},
                    streaks: { current: 0, longest: 0 },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
            }
        } catch (error) {
            logger.error('❌ Error loading progress from Firebase:', error);
            throw error;
        }
    }

    // ===== FLASHCARDS MANAGEMENT =====

    /**
     * Save flashcard to Firebase
     */
    static async saveFlashcard(userId, flashcardData) {
        try {
            const flashcardsRef = collection(db, this.COLLECTIONS.FLASHCARDS);
            const flashcard = {
                userId,
                ...flashcardData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(flashcardsRef, flashcard);
            logger.info('✅ Flashcard saved to Firebase:', docRef.id);
            return { id: docRef.id, ...flashcard };
        } catch (error) {
            logger.error('❌ Error saving flashcard to Firebase:', error);
            throw error;
        }
    }

    /**
     * Get user's flashcards
     */
    static async getUserFlashcards(userId) {
        try {
            const flashcardsRef = collection(db, this.COLLECTIONS.FLASHCARDS);
            const q = query(
                flashcardsRef,
                where("userId", "==", userId),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const flashcards = [];
            querySnapshot.forEach((doc) => {
                flashcards.push({ id: doc.id, ...doc.data() });
            });

            logger.info(`✅ Loaded ${flashcards.length} flashcards from Firebase`);
            return flashcards;
        } catch (error) {
            logger.error('❌ Error loading flashcards from Firebase:', error);
            throw error;
        }
    }

    // ===== USER SETTINGS =====

    /**
     * Save user settings
     */
    static async saveUserSettings(userId, settings) {
        try {
            const settingsRef = doc(db, this.COLLECTIONS.SETTINGS, userId);
            const settingsData = {
                userId,
                ...settings,
                updatedAt: serverTimestamp()
            };

            await setDoc(settingsRef, settingsData, { merge: true });
            logger.info('✅ Settings saved to Firebase:', userId);
            return settingsData;
        } catch (error) {
            logger.error('❌ Error saving settings to Firebase:', error);
            throw error;
        }
    }

    /**
     * Get user settings
     */
    static async getUserSettings(userId) {
        try {
            const settingsRef = doc(db, this.COLLECTIONS.SETTINGS, userId);
            const settingsSnap = await getDoc(settingsRef);
            
            if (settingsSnap.exists()) {
                return settingsSnap.data();
            } else {
                // Return default settings
                return {
                    userId,
                    theme: 'light',
                    notifications: true,
                    language: 'en',
                    privacy: {
                        shareProgress: false,
                        allowAnalytics: true
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
            }
        } catch (error) {
            logger.error('❌ Error loading settings from Firebase:', error);
            throw error;
        }
    }

    // ===== ANALYTICS & INSIGHTS =====

    /**
     * Log analytics event
     */
    static async logAnalyticsEvent(userId, eventData) {
        try {
            const analyticsRef = collection(db, this.COLLECTIONS.ANALYTICS);
            const event = {
                userId,
                ...eventData,
                timestamp: serverTimestamp()
            };

            await addDoc(analyticsRef, event);
            logger.info('✅ Analytics event logged:', eventData.event);
        } catch (error) {
            logger.error('❌ Error logging analytics event:', error);
            // Don't throw error for analytics failures
        }
    }

    // ===== BATCH OPERATIONS =====

    /**
     * Perform batch operations for better performance
     */
    static async batchOperations(operations) {
        try {
            const batch = writeBatch(db);
            
            operations.forEach(({ type, ref, data }) => {
                switch (type) {
                    case 'set':
                        batch.set(ref, data);
                        break;
                    case 'update':
                        batch.update(ref, data);
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                }
            });

            await batch.commit();
            logger.info('✅ Batch operations completed');
        } catch (error) {
            logger.error('❌ Error in batch operations:', error);
            throw error;
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Check if user is authenticated
     */
    static getCurrentUserId() {
        return auth.currentUser?.uid || null;
    }

    /**
     * Clean up listeners
     */
    static unsubscribe(unsubscribeFunction) {
        if (typeof unsubscribeFunction === 'function') {
            unsubscribeFunction();
        }
    }
}