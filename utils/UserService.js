
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';


export class UserService {
    
    // Get greeting based on time of day
    static getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    // Get first name from full name
    static getFirstName(fullName) {
        if (!fullName) return 'Student';
        return fullName.split(' ')[0];
    }

    // Get user profile (placeholder - you can implement Firebase integration later)
    static async getUserProfile(userId) {
        try {
            // For now, get from AsyncStorage
            const profile = await AsyncStorage.getItem(`userProfile_${userId}`);
            if (profile) {
                return JSON.parse(profile);
            }
            
            // Fallback to basic user info
            const user = auth?.currentUser;
            if (user) {
                return {
                    fullName: user.displayName || 'Student',
                    email: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid
                };
            }
            
            return null;
        } catch (error) {
            logger.error('Error getting user profile:', error);
            return null;
        }
    }

    // Save user profile
    static async saveUserProfile(userId, profileData) {
        try {
            await AsyncStorage.setItem(`userProfile_${userId}`, JSON.stringify(profileData));
            return true;
        } catch (error) {
            logger.error('Error saving user profile:', error);
            return false;
        }
    }

    // Update user profile
    static async updateUserProfile(userId, updates) {
        try {
            const existingProfile = await this.getUserProfile(userId);
            const updatedProfile = {
                ...existingProfile,
                ...updates,
                updatedAt: new Date()
            };
            
            await this.saveUserProfile(userId, updatedProfile);
            return updatedProfile;
        } catch (error) {
            logger.error('Error updating user profile:', error);
            return null;
        }
    }

    // Get user preferences
    static async getUserPreferences(userId) {
        try {
            const preferences = await AsyncStorage.getItem(`userPreferences_${userId}`);
            if (preferences) {
                return JSON.parse(preferences);
            }
            
            // Default preferences
            return {
                theme: 'dark',
                notifications: true,
                language: 'en',
                studyReminders: true,
                difficulty: 'medium'
            };
        } catch (error) {
            logger.error('Error getting user preferences:', error);
            return {};
        }
    }

    // Save user preferences
    static async saveUserPreferences(userId, preferences) {
        try {
            await AsyncStorage.setItem(`userPreferences_${userId}`, JSON.stringify(preferences));
            return true;
        } catch (error) {
            logger.error('Error saving user preferences:', error);
            return false;
        }
    }

    // Get user stats
    static async getUserStats(userId) {
        try {
            const stats = await AsyncStorage.getItem(`userStats_${userId}`);
            if (stats) {
                return JSON.parse(stats);
            }
            
            // Default stats
            return {
                totalQuizzes: 0,
                totalScore: 0,
                averageScore: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastQuizDate: null,
                favoriteCategory: null,
                totalStudyTime: 0
            };
        } catch (error) {
            logger.error('Error getting user stats:', error);
            return {};
        }
    }

    // Update user stats
    static async updateUserStats(userId, newQuizData) {
        try {
            const currentStats = await this.getUserStats(userId);
            
            const updatedStats = {
                ...currentStats,
                totalQuizzes: currentStats.totalQuizzes + 1,
                totalScore: currentStats.totalScore + (newQuizData.score || 0),
                lastQuizDate: new Date(),
                // Recalculate average
                averageScore: Math.round(((currentStats.totalScore + (newQuizData.score || 0)) / (currentStats.totalQuizzes + 1)) * 100) / 100
            };

            // Update streak
            const today = new Date();
            const lastQuiz = currentStats.lastQuizDate ? new Date(currentStats.lastQuizDate) : null;
            
            if (lastQuiz) {
                const daysDiff = Math.floor((today - lastQuiz) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                    // Consecutive day
                    updatedStats.currentStreak = currentStats.currentStreak + 1;
                } else if (daysDiff > 1) {
                    // Streak broken
                    updatedStats.currentStreak = 1;
                } else {
                    // Same day, maintain streak
                    updatedStats.currentStreak = Math.max(currentStats.currentStreak, 1);
                }
            } else {
                updatedStats.currentStreak = 1;
            }

            // Update longest streak
            updatedStats.longestStreak = Math.max(updatedStats.currentStreak, currentStats.longestStreak);

            await AsyncStorage.setItem(`userStats_${userId}`, JSON.stringify(updatedStats));
            return updatedStats;
        } catch (error) {
            logger.error('Error updating user stats:', error);
            return null;
        }
    }

    // Get current user
    static getCurrentUser() {
        return auth?.currentUser;
    }

    // Check if user is authenticated
    static isAuthenticated() {
        return !!auth?.currentUser;
    }

    // Get user display name
    static getUserDisplayName() {
        const user = this.getCurrentUser();
        if (user) {
            return user.displayName || this.getFirstName(user.email) || 'Student';
        }
        return 'Student';
    }

    // Get user email
    static getUserEmail() {
        const user = this.getCurrentUser();
        return user?.email || '';
    }

    // Get user avatar URL
    static getUserAvatarURL() {
        const user = this.getCurrentUser();
        return user?.photoURL || null;
    }

    // Generate user initials
    static getUserInitials(fullName) {
        if (!fullName) return 'ST';
        
        const names = fullName.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return names[0].slice(0, 2).toUpperCase();
    }

    // Format user name for display
    static formatDisplayName(fullName) {
        if (!fullName) return 'Student';
        
        const names = fullName.split(' ');
        if (names.length >= 2) {
            return `${names[0]} ${names[names.length - 1]}`;
        }
        return names[0];
    }

    // Clear user data (for logout)
    static async clearUserData(userId) {
        try {
            const keys = [
                `userProfile_${userId}`,
                `userPreferences_${userId}`,
                `userStats_${userId}`
            ];
            
            await AsyncStorage.multiRemove(keys);
            return true;
        } catch (error) {
            logger.error('Error clearing user data:', error);
            return false;
        }
    }
}