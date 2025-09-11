import { StudentProfileService } from './StudentProfileService';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';


/**
 * Centralized service for managing user courses across the app
 * Integrates with user's profile courses and provides standardized course data
 */
export class UserCoursesService {
    
    // Cache for user courses to avoid repeated API calls
    static _coursesCache = null;
    static _lastCacheTime = null;
    static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Get user's courses from their profile
     * Returns standardized course objects with consistent format
     */
    static async getUserCourses(forceRefresh = false) {
        try {
            // Check cache first
            const now = Date.now();
            if (!forceRefresh && this._coursesCache && this._lastCacheTime && 
                (now - this._lastCacheTime) < this.CACHE_DURATION) {
                return this._coursesCache;
            }

            const user = auth.currentUser;
            if (!user) {
                logger.info('👤 No authenticated user - returning empty courses');
                return [];
            }

            // Get user profile
            const profileStatus = await StudentProfileService.checkProfileStatus(user.uid);
            
            if (!profileStatus.exists) {
                logger.info('👤 User has no profile yet - returning empty courses');
                return [];
            }

            const profile = await StudentProfileService.getProfile(user.uid);
            
            if (!profile || !profile.courses || profile.courses.length === 0) {
                logger.info('📚 User has no courses in profile');
                return [];
            }

            // Standardize course format
            const standardizedCourses = profile.courses.map(course => ({
                id: course.id,
                key: this.generateCourseKey(course.code || course.name),
                code: course.code || course.name,
                name: this.cleanCourseName(course.name || course.code),
                fullName: course.name || course.code,
                type: 'profile_course',
                icon: this.getCourseIcon(course.code || course.name),
                color: this.getCourseColor(course.code || course.name),
                validated: course.validated || false,
                source: 'user_profile'
            }));

            // Update cache
            this._coursesCache = standardizedCourses;
            this._lastCacheTime = now;

            logger.info(`📚 Loaded ${standardizedCourses.length} courses from user profile`);
            return standardizedCourses;

        } catch (error) {
            logger.error('❌ Error loading user courses:', error);
            return [];
        }
    }

    /**
     * Get combined courses: user's profile courses + predefined subjects
     * This provides a comprehensive list for selection screens
     */
    static async getAllAvailableCourses() {
        try {
            const userCourses = await this.getUserCourses();
            const predefinedSubjects = this.getPredefinedSubjects();

            // User courses come first (priority), then predefined subjects
            // Remove duplicates by checking if predefined subject matches user course
            const userCourseKeys = new Set(userCourses.map(course => course.key.toLowerCase()));
            
            const filteredPredefined = predefinedSubjects.filter(subject => 
                !userCourseKeys.has(subject.key.toLowerCase())
            );

            const allCourses = [
                ...userCourses.map(course => ({ ...course, isPriority: true })),
                ...filteredPredefined.map(subject => ({ ...subject, isPriority: false }))
            ];

            logger.info(`📚 Combined courses: ${userCourses.length} from profile + ${filteredPredefined.length} predefined`);
            return allCourses;

        } catch (error) {
            logger.error('❌ Error getting combined courses:', error);
            return this.getPredefinedSubjects();
        }
    }

    /**
     * Get predefined subjects list (fallback when no profile courses)
     */
    static getPredefinedSubjects() {
        return [
            { key: 'mathematics', name: 'Mathematics', icon: 'calculator', color: '#3498DB', type: 'predefined' },
            { key: 'science', name: 'Science', icon: 'atom', color: '#27AE60', type: 'predefined' },
            { key: 'history', name: 'History', icon: 'landmark', color: '#8B4513', type: 'predefined' },
            { key: 'english', name: 'English/Literature', icon: 'book', color: '#9B59B6', type: 'predefined' },
            { key: 'computer_science', name: 'Computer Science', icon: 'code', color: '#E74C3C', type: 'predefined' },
            { key: 'art', name: 'Art', icon: 'palette', color: '#F39C12', type: 'predefined' },
            { key: 'music', name: 'Music', icon: 'music', color: '#E91E63', type: 'predefined' },
            { key: 'geography', name: 'Geography', icon: 'globe', color: '#1ABC9C', type: 'predefined' },
            { key: 'business', name: 'Business', icon: 'briefcase', color: '#34495E', type: 'predefined' },
            { key: 'medicine', name: 'Medicine', icon: 'user-md', color: '#E67E22', type: 'predefined' },
            { key: 'law', name: 'Law', icon: 'gavel', color: '#7F8C8D', type: 'predefined' },
            { key: 'physics', name: 'Physics', icon: 'atom', color: '#2ECC71', type: 'predefined' },
            { key: 'chemistry', name: 'Chemistry', icon: 'flask', color: '#F1C40F', type: 'predefined' },
            { key: 'psychology', name: 'Psychology', icon: 'brain', color: '#AF7AC5', type: 'predefined' },
            { key: 'economics', name: 'Economics', icon: 'chart-line', color: '#58D68D', type: 'predefined' },
        ];
    }

    /**
     * Generate a standardized key from course code/name
     */
    static generateCourseKey(courseName) {
        if (!courseName) return 'unknown';
        
        return courseName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .substring(0, 50); // Limit length
    }

    /**
     * Clean course name for display
     */
    static cleanCourseName(courseName) {
        if (!courseName) return 'Unknown Course';
        
        // Remove common prefixes and clean up
        return courseName
            .replace(/^(MATH|ENG|SCI|HIST|CS|CHEM|PHYS|BIO)\s*\d+\s*[-:]?\s*/i, '')
            .trim() || courseName;
    }

    /**
     * Get icon for course based on course code/name
     */
    static getCourseIcon(courseName) {
        if (!courseName) return 'book';
        
        const name = courseName.toLowerCase();
        
        if (name.includes('math') || name.includes('calc') || name.includes('algebra') || name.includes('geometry')) {
            return 'calculator';
        }
        if (name.includes('physics') || name.includes('phys')) {
            return 'atom';
        }
        if (name.includes('chemistry') || name.includes('chem')) {
            return 'flask';
        }
        if (name.includes('biology') || name.includes('bio')) {
            return 'dna';
        }
        if (name.includes('computer') || name.includes('cs') || name.includes('programming') || name.includes('coding')) {
            return 'code';
        }
        if (name.includes('english') || name.includes('literature') || name.includes('writing')) {
            return 'book';
        }
        if (name.includes('history') || name.includes('hist')) {
            return 'landmark';
        }
        if (name.includes('art') || name.includes('design')) {
            return 'palette';
        }
        if (name.includes('music')) {
            return 'music';
        }
        if (name.includes('business') || name.includes('econ') || name.includes('finance')) {
            return 'briefcase';
        }
        if (name.includes('psychology') || name.includes('psych')) {
            return 'brain';
        }
        if (name.includes('geography') || name.includes('geo')) {
            return 'globe';
        }
        if (name.includes('law') || name.includes('legal')) {
            return 'gavel';
        }
        if (name.includes('medicine') || name.includes('medical') || name.includes('anatomy')) {
            return 'user-md';
        }
        
        return 'book'; // Default
    }

    /**
     * Get color for course based on course code/name
     */
    static getCourseColor(courseName) {
        if (!courseName) return '#9B59B6';
        
        const name = courseName.toLowerCase();
        
        if (name.includes('math') || name.includes('calc') || name.includes('algebra') || name.includes('geometry')) {
            return '#3498DB'; // Blue
        }
        if (name.includes('science') || name.includes('physics') || name.includes('chemistry') || name.includes('biology')) {
            return '#27AE60'; // Green
        }
        if (name.includes('computer') || name.includes('cs') || name.includes('programming')) {
            return '#E74C3C'; // Red
        }
        if (name.includes('english') || name.includes('literature') || name.includes('writing')) {
            return '#9B59B6'; // Purple
        }
        if (name.includes('history')) {
            return '#8B4513'; // Brown
        }
        if (name.includes('art') || name.includes('design')) {
            return '#F39C12'; // Orange
        }
        if (name.includes('music')) {
            return '#E91E63'; // Pink
        }
        if (name.includes('business') || name.includes('econ')) {
            return '#34495E'; // Dark gray
        }
        if (name.includes('psychology')) {
            return '#AF7AC5'; // Light purple
        }
        if (name.includes('geography')) {
            return '#1ABC9C'; // Teal
        }
        if (name.includes('law')) {
            return '#7F8C8D'; // Gray
        }
        if (name.includes('medicine') || name.includes('medical')) {
            return '#E67E22'; // Orange-red
        }
        
        // Generate a consistent color based on course name hash
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            const char = name.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        const colors = ['#3498DB', '#27AE60', '#E74C3C', '#9B59B6', '#F39C12', '#E91E63', '#1ABC9C', '#34495E'];
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Clear cache (call when user updates profile)
     */
    static clearCache() {
        this._coursesCache = null;
        this._lastCacheTime = null;
        logger.info('🧹 User courses cache cleared');
    }

    /**
     * Check if user has any courses in their profile
     */
    static async hasProfileCourses() {
        const courses = await this.getUserCourses();
        return courses.length > 0;
    }

    /**
     * Get course by key/id
     */
    static async getCourseByKey(key) {
        const allCourses = await this.getAllAvailableCourses();
        return allCourses.find(course => 
            course.key === key || 
            course.id === key ||
            course.code === key
        );
    }

    /**
     * Format course for display in UI components
     */
    static formatCourseForDisplay(course) {
        return {
            key: course.key,
            name: course.name,
            fullName: course.fullName || course.name,
            icon: course.icon,
            color: course.color,
            type: course.type,
            isPriority: course.isPriority || course.type === 'profile_course',
            source: course.source || course.type
        };
    }
}