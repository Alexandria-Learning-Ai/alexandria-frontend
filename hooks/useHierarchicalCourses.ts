import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { UserCoursesService } from '../services/UserCoursesService';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService';
import logger from '../utils/logger';

interface Course {
    name: string;
    code?: string;
    subject?: string;
    source?: string;
    icon?: string;
    color?: string;
}

export const useHierarchicalCourses = () => {
    const [userCourses, setUserCourses] = useState<any[]>([]);
    const [hasProfileCourses, setHasProfileCourses] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [courseSelectionMode, setCourseSelectionMode] = useState<'profile' | 'hierarchical'>('profile');

    // Hierarchical course selection state
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [selectedHierarchicalSubject, setSelectedHierarchicalSubject] = useState<string | null>(null);
    const [availableCourses, setAvailableCourses] = useState<string[]>([]);
    const [selectedHierarchicalCourse, setSelectedHierarchicalCourse] = useState<string | null>(null);

    /**
     * Load user's profile courses
     */
    const loadUserCourses = useCallback(async () => {
        try {
            const courses = await UserCoursesService.getUserCourses();
            setUserCourses(courses);
            setHasProfileCourses(courses.length > 0);

            if (courses.length > 0) {
                logger.info(`📚 Loaded ${courses.length} courses from user profile for Upload screen`);
            }
        } catch (error) {
            logger.error('❌ Error loading user courses for Upload screen:', error);
        }
    }, []);

    /**
     * Load hierarchical subjects for enhanced course selection
     */
    const loadHierarchicalSubjects = useCallback(() => {
        try {
            const subjects = Object.keys(HierarchicalSubjectService.SUBJECT_HIERARCHY);
            setAvailableSubjects(subjects);
            logger.info(`🎓 Loaded ${subjects.length} hierarchical subjects for Upload screen`);
        } catch (error) {
            logger.error('❌ Error loading hierarchical subjects for Upload screen:', error);
        }
    }, []);

    /**
     * Handle hierarchical subject selection
     */
    const handleHierarchicalSubjectSelect = useCallback((subjectName: string) => {
        setSelectedHierarchicalSubject(subjectName);
        setSelectedHierarchicalCourse(null); // Clear course selection

        // Load available courses for this subject
        const hierarchy = HierarchicalSubjectService.SUBJECT_HIERARCHY[subjectName];
        if (hierarchy && hierarchy.courses) {
            const courses = Object.keys(hierarchy.courses);
            setAvailableCourses(courses);
            logger.info(`📚 Loaded ${courses.length} courses for ${subjectName} in Upload screen`);
        }
    }, []);

    /**
     * Handle hierarchical course selection
     */
    const handleHierarchicalCourseSelect = useCallback((courseName: string) => {
        setSelectedHierarchicalCourse(courseName);

        // Create a course object similar to profile courses for consistency
        setSelectedCourse({
            name: courseName,
            code: `${selectedHierarchicalSubject}_${courseName}`.replace(/\s+/g, '_').toUpperCase(),
            subject: selectedHierarchicalSubject || undefined,
            source: 'hierarchical'
        });
    }, [selectedHierarchicalSubject]);

    // Load courses on mount
    useEffect(() => {
        loadUserCourses();
        loadHierarchicalSubjects();
    }, [loadUserCourses, loadHierarchicalSubjects]);

    // Refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadUserCourses();
            loadHierarchicalSubjects();
        }, [loadUserCourses, loadHierarchicalSubjects])
    );

    return {
        // Profile courses
        userCourses,
        hasProfileCourses,
        selectedCourse,
        setSelectedCourse,

        // Course selection mode
        courseSelectionMode,
        setCourseSelectionMode,

        // Hierarchical selection
        availableSubjects,
        selectedHierarchicalSubject,
        setSelectedHierarchicalSubject,
        availableCourses,
        selectedHierarchicalCourse,
        setSelectedHierarchicalCourse,

        // Handlers
        loadUserCourses,
        loadHierarchicalSubjects,
        handleHierarchicalSubjectSelect,
        handleHierarchicalCourseSelect
    };
};
