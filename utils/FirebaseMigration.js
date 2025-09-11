/**
 * FirebaseMigration - Utility for migrating existing user data to Firebase
 * Handles gradual migration from local/API storage to Firebase
 */

import { HybridDataService } from '../services/HybridDataService';
import { StudentProfileService } from '../services/StudentProfileService';
import { FirebaseService } from '../services/FirebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';


export class FirebaseMigration {
    
    static MIGRATION_KEY = 'firebase_migration_status';
    static MIGRATION_VERSION = '1.0.0';

    /**
     * Check if user data needs migration
     */
    static async needsMigration(userId) {
        try {
            const migrationStatus = await AsyncStorage.getItem(`${this.MIGRATION_KEY}_${userId}`);
            const status = migrationStatus ? JSON.parse(migrationStatus) : null;
            
            return !status || status.version !== this.MIGRATION_VERSION;
        } catch (error) {
            logger.error('❌ Error checking migration status:', error);
            return true; // Assume migration needed on error
        }
    }

    /**
     * Perform complete user data migration
     */
    static async migrateUserData(userId) {
        try {
            logger.info('🔄 Starting Firebase migration for user:', userId);
            
            const migrationResults = {
                profile: false,
                quizHistory: false,
                settings: false,
                progress: false
            };

            // 1. Migrate User Profile
            try {
                await this.migrateProfile(userId);
                migrationResults.profile = true;
                logger.info('✅ Profile migration completed');
            } catch (error) {
                logger.error('❌ Profile migration failed:', error);
                if (error.code === 'permission-denied') {
                    logger.warn('🔒 Skipping profile migration - Firebase permissions not configured');
                    migrationResults.profile = 'skipped_permissions';
                }
            }

            // 2. Migrate Quiz History
            try {
                await this.migrateQuizHistory(userId);
                migrationResults.quizHistory = true;
                logger.info('✅ Quiz history migration completed');
            } catch (error) {
                logger.error('❌ Quiz history migration failed:', error);
            }

            // 3. Migrate User Settings
            try {
                await this.migrateSettings(userId);
                migrationResults.settings = true;
                logger.info('✅ Settings migration completed');
            } catch (error) {
                logger.error('❌ Settings migration failed:', error);
            }

            // 4. Migrate Progress Data
            try {
                await this.migrateProgress(userId);
                migrationResults.progress = true;
                logger.info('✅ Progress migration completed');
            } catch (error) {
                logger.error('❌ Progress migration failed:', error);
            }

            // 5. Mark migration as complete
            await this.markMigrationComplete(userId, migrationResults);
            
            logger.info('🎉 Firebase migration completed for user:', userId, migrationResults);
            return migrationResults;

        } catch (error) {
            logger.error('❌ Migration failed for user:', userId, error);
            throw error;
        }
    }

    /**
     * Migrate user profile data
     */
    static async migrateProfile(userId) {
        try {
            // Check if profile already exists in Firebase
            const existingProfile = await FirebaseService.getUserProfile(userId);
            if (existingProfile) {
                logger.info('📝 Profile already exists in Firebase, skipping migration');
                return;
            }

            // Load profile from local/API storage
            const localProfile = await StudentProfileService.getProfile(userId);
            if (!localProfile) {
                logger.info('📝 No local profile found to migrate');
                return;
            }

            // Save to Firebase
            await FirebaseService.saveUserProfile(userId, {
                ...localProfile,
                migratedAt: new Date().toISOString(),
                migrationSource: 'local_storage'
            });

            logger.info('✅ Profile migrated to Firebase');

        } catch (error) {
            logger.error('❌ Profile migration error:', error);
            throw error;
        }
    }

    /**
     * Migrate quiz history
     */
    static async migrateQuizHistory(userId) {
        try {
            // Load local quiz history
            const localHistory = await this.getLocalQuizHistory(userId);
            if (!localHistory || localHistory.length === 0) {
                logger.info('📝 No local quiz history found to migrate');
                return;
            }

            // Migrate each quiz result
            const migrationPromises = localHistory.map(async (quiz) => {
                try {
                    await FirebaseService.saveQuizResult(userId, {
                        ...quiz,
                        migratedAt: new Date().toISOString(),
                        migrationSource: 'local_storage'
                    });
                } catch (error) {
                    logger.error('❌ Failed to migrate quiz:', quiz.id, error);
                }
            });

            await Promise.allSettled(migrationPromises);
            logger.info(`✅ Migrated ${localHistory.length} quiz results`);

        } catch (error) {
            logger.error('❌ Quiz history migration error:', error);
            throw error;
        }
    }

    /**
     * Migrate user settings
     */
    static async migrateSettings(userId) {
        try {
            // Load local settings
            const localSettings = await this.getLocalSettings(userId);
            
            // Create default settings or use existing
            const settingsToMigrate = {
                theme: 'light',
                notifications: true,
                language: 'en',
                privacy: {
                    shareProgress: false,
                    allowAnalytics: true
                },
                ...localSettings,
                migratedAt: new Date().toISOString(),
                migrationSource: 'local_storage'
            };

            await FirebaseService.saveUserSettings(userId, settingsToMigrate);
            logger.info('✅ Settings migrated to Firebase');

        } catch (error) {
            logger.error('❌ Settings migration error:', error);
            throw error;
        }
    }

    /**
     * Migrate progress data
     */
    static async migrateProgress(userId) {
        try {
            // Calculate progress from existing data
            const progressData = await this.calculateProgressFromHistory(userId);
            
            await FirebaseService.updateProgress(userId, {
                ...progressData,
                migratedAt: new Date().toISOString(),
                migrationSource: 'calculated_from_history'
            });

            logger.info('✅ Progress data migrated to Firebase');

        } catch (error) {
            logger.error('❌ Progress migration error:', error);
            throw error;
        }
    }

    /**
     * Get local quiz history for migration
     */
    static async getLocalQuizHistory(userId) {
        try {
            const historyKey = `quiz_history_${userId}`;
            const historyData = await AsyncStorage.getItem(historyKey);
            return historyData ? JSON.parse(historyData) : [];
        } catch (error) {
            logger.error('❌ Error loading local quiz history:', error);
            return [];
        }
    }

    /**
     * Get local settings for migration
     */
    static async getLocalSettings(userId) {
        try {
            const settingsKey = `user_settings_${userId}`;
            const settingsData = await AsyncStorage.getItem(settingsKey);
            return settingsData ? JSON.parse(settingsData) : {};
        } catch (error) {
            logger.error('❌ Error loading local settings:', error);
            return {};
        }
    }

    /**
     * Calculate progress metrics from quiz history
     */
    static async calculateProgressFromHistory(userId) {
        try {
            const quizHistory = await this.getLocalQuizHistory(userId);
            
            let totalQuizzes = 0;
            let totalQuestions = 0;
            let correctAnswers = 0;
            const subjects = {};
            
            quizHistory.forEach(quiz => {
                totalQuizzes++;
                const questionsCount = quiz.questions?.length || 0;
                const correctCount = quiz.results?.correctCount || 0;
                const subject = quiz.category || 'General';
                
                totalQuestions += questionsCount;
                correctAnswers += correctCount;
                
                if (!subjects[subject]) {
                    subjects[subject] = {
                        quizzes: 0,
                        questions: 0,
                        correct: 0,
                        accuracy: 0
                    };
                }
                
                subjects[subject].quizzes++;
                subjects[subject].questions += questionsCount;
                subjects[subject].correct += correctCount;
                subjects[subject].accuracy = subjects[subject].questions > 0 ? 
                    (subjects[subject].correct / subjects[subject].questions) * 100 : 0;
            });

            return {
                totalQuizzes,
                totalQuestions,
                correctAnswers,
                accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
                subjects,
                streaks: { current: 0, longest: 0 }, // Will be calculated over time
                lastActivity: new Date().toISOString()
            };

        } catch (error) {
            logger.error('❌ Error calculating progress:', error);
            return {
                totalQuizzes: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                accuracy: 0,
                subjects: {},
                streaks: { current: 0, longest: 0 }
            };
        }
    }

    /**
     * Mark migration as complete
     */
    static async markMigrationComplete(userId, results) {
        try {
            const migrationStatus = {
                version: this.MIGRATION_VERSION,
                completedAt: new Date().toISOString(),
                results,
                success: Object.values(results).every(r => r === true)
            };

            await AsyncStorage.setItem(
                `${this.MIGRATION_KEY}_${userId}`, 
                JSON.stringify(migrationStatus)
            );

            logger.info('✅ Migration status saved');

        } catch (error) {
            logger.error('❌ Error saving migration status:', error);
        }
    }

    /**
     * Auto-migrate user data when they log in
     */
    static async autoMigrate(userId) {
        try {
            const needsMigration = await this.needsMigration(userId);
            
            if (needsMigration) {
                logger.info('🔄 Auto-migration triggered for user:', userId);
                
                // Perform migration in background
                setTimeout(async () => {
                    try {
                        await this.migrateUserData(userId);
                        logger.info('✅ Auto-migration completed');
                    } catch (error) {
                        logger.error('❌ Auto-migration failed:', error);
                    }
                }, 2000); // Delay to not block user login
                
            } else {
                logger.info('✅ User data already migrated');
            }

        } catch (error) {
            logger.error('❌ Auto-migration error:', error);
        }
    }

    /**
     * Force re-migration (for testing/troubleshooting)
     */
    static async forceMigration(userId) {
        try {
            await AsyncStorage.removeItem(`${this.MIGRATION_KEY}_${userId}`);
            return await this.migrateUserData(userId);
        } catch (error) {
            logger.error('❌ Force migration error:', error);
            throw error;
        }
    }

    /**
     * Get migration status
     */
    static async getMigrationStatus(userId) {
        try {
            const migrationStatus = await AsyncStorage.getItem(`${this.MIGRATION_KEY}_${userId}`);
            return migrationStatus ? JSON.parse(migrationStatus) : null;
        } catch (error) {
            logger.error('❌ Error getting migration status:', error);
            return null;
        }
    }
}