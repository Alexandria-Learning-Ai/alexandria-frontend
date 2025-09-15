// utils/examScheduleService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig'; // ✅ Add auth import
import logger from '../utils/logger';


const STORAGE_KEY_PREFIX = 'scheduled_exams_'; // ✅ Changed to prefix for user-specific keys

export class ExamScheduleService {
    // ✅ NEW: Get user-specific storage key
    static getUserStorageKey() {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated to access exam data');
        }
        return `${STORAGE_KEY_PREFIX}${user.uid}`;
    }

    // Add this method to match your ScheduleExamScreen
    static async addExam(examData) {
        try {
            const existingExams = await this.getUserExams();
            const newExam = {
                id: Date.now().toString(), 
                title: examData.title,        // Map 'title' field
                subject: examData.subject,
                examDate: examData.date,       // Map 'date' to 'examDate'
                time: examData.time,
                reminderEnabled: examData.reminderEnabled,
                isRecurring: examData.isRecurring,
                createdAt: new Date()
            };
            
            const updatedExams = [...existingExams, newExam];
            await AsyncStorage.setItem(this.getUserStorageKey(), JSON.stringify(updatedExams));
            logger.info('✅ Exam saved:', newExam.title);
            return newExam;
        } catch (error) {
            logger.error('❌ Error adding exam:', error);
            throw error;
        }
    }

    // Get all user exams
    static async getUserExams() {
        try {
            const examsData = await AsyncStorage.getItem(this.getUserStorageKey());
            if (examsData) {
                const exams = JSON.parse(examsData);
                // Convert date strings back to Date objects
                return exams.map(exam => ({
                    ...exam,
                    examDate: new Date(exam.examDate),
                    createdAt: new Date(exam.createdAt)
                })).sort((a, b) => a.examDate - b.examDate); // Sort by date
            }
            return [];
        } catch (error) {
            logger.error('Error getting user exams:', error);
            return [];
        }
    }

    // Save a new exam
    static async saveExam(examData) {
        try {
            const existingExams = await this.getUserExams();
            const newExam = {
                id: Date.now().toString(), // Simple ID generation
                ...examData,
                createdAt: new Date(),
                examDate: new Date(examData.examDate) // Ensure it's a Date object
            };
            
            const updatedExams = [...existingExams, newExam];
            await AsyncStorage.setItem(this.getUserStorageKey(), JSON.stringify(updatedExams));
            return newExam;
        } catch (error) {
            logger.error('Error saving exam:', error);
            throw error;
        }
    }

    // Delete an exam
    static async deleteExam(examId) {
        try {
            const existingExams = await this.getUserExams();
            const updatedExams = existingExams.filter(exam => exam.id !== examId);
            await AsyncStorage.setItem(this.getUserStorageKey(), JSON.stringify(updatedExams));
            logger.info('✅ Exam deleted:', examId);
        } catch (error) {
            logger.error('Error deleting exam:', error);
            throw error;
        }
    }

    // Update an exam
    static async updateExam(examId, updatedData) {
        try {
            const existingExams = await this.getUserExams();
            const examIndex = existingExams.findIndex(exam => exam.id === examId);
            
            if (examIndex !== -1) {
                existingExams[examIndex] = {
                    ...existingExams[examIndex],
                    ...updatedData,
                    examDate: new Date(updatedData.examDate || existingExams[examIndex].examDate)
                };
                await AsyncStorage.setItem(this.getUserStorageKey(), JSON.stringify(existingExams));
                return existingExams[examIndex];
            }
            throw new Error('Exam not found');
        } catch (error) {
            logger.error('Error updating exam:', error);
            throw error;
        }
    }

    // Calculate days until exam
    static calculateDaysUntilExam(examDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const exam = new Date(examDate);
        exam.setHours(0, 0, 0, 0);
        
        const timeDiff = exam.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff;
    }

    // Get urgency level based on days left
    static getUrgencyLevel(daysLeft) {
        if (daysLeft < 0) return 'past';
        if (daysLeft === 0) return 'today';
        if (daysLeft === 1) return 'tomorrow';
        if (daysLeft <= 3) return 'urgent';
        if (daysLeft <= 7) return 'soon';
        return 'upcoming';
    }

    // Get motivational message based on days left
    static getMotivationalMessage(daysLeft, examTitle) {
        const urgency = this.getUrgencyLevel(daysLeft);
        
        const messages = {
            past: `📚 How did ${examTitle} go? Time to review for next time!`,
            today: `🔥 IT'S EXAM DAY! ${examTitle} is TODAY! You've got this! 💪`,
            tomorrow: `⏰ ${examTitle} is TOMORROW! Time for final review! 📚`,
            urgent: `🚨 Only ${daysLeft} days until ${examTitle}! Let's practice! 🎯`,
            soon: `📅 ${daysLeft} days until ${examTitle}. Stay consistent! ⭐`,
            upcoming: `📖 ${daysLeft} days until ${examTitle}. Build your knowledge! 🧠`
        };

        return messages[urgency] || `📚 ${daysLeft} days until ${examTitle}`;
    }

    // Get exams by urgency
    static async getExamsByUrgency() {
        const exams = await this.getUserExams();
        const categorized = {
            today: [],
            tomorrow: [],
            urgent: [],
            soon: [],
            upcoming: [],
            past: []
        };

        exams.forEach(exam => {
            const daysLeft = this.calculateDaysUntilExam(exam.examDate);
            const urgency = this.getUrgencyLevel(daysLeft);
            categorized[urgency].push(exam);
        });

        return categorized;
    }

    // Get upcoming exams (next 30 days)
    static async getUpcomingExams(days = 30) {
        const allExams = await this.getUserExams();
        const today = new Date();
        const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));

        return allExams.filter(exam => {
            const examDate = new Date(exam.examDate);
            return examDate >= today && examDate <= futureDate;
        });
    }

    // Get study statistics
    static async getStudyStats() {
        const exams = await this.getUserExams();
        const now = new Date();
        
        const stats = {
            totalExams: exams.length,
            upcomingExams: exams.filter(exam => new Date(exam.examDate) > now).length,
            pastExams: exams.filter(exam => new Date(exam.examDate) < now).length,
            todayExams: exams.filter(exam => {
                const examDate = new Date(exam.examDate);
                return examDate.toDateString() === now.toDateString();
            }).length,
            nextExam: null
        };

        // Find next upcoming exam
        const upcomingExams = exams.filter(exam => new Date(exam.examDate) > now);
        if (upcomingExams.length > 0) {
            stats.nextExam = upcomingExams[0]; // Already sorted by date
        }

        return stats;
    }
}